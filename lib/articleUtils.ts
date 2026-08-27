import type { ArticleDisplay, ZoneType } from '@/types'
import type { Database } from '@/types/supabase'

type ArticleRow = Database['distilled']['Tables']['articles']['Row']

export function toArticleDisplay(row: ArticleRow, nowMs = Date.now()): ArticleDisplay {
  const publishedMs = row.published_at ? new Date(row.published_at).getTime() : nowMs
  const ageMs = nowMs - publishedMs
  const ageHours = ageMs / (1000 * 60 * 60)

  return {
    id: row.id,
    headline: row.headline,
    summary: row.summary ?? '',
    imageUrl: row.image_url ?? undefined,
    sourceName: row.source_name ?? '',
    sourceUrl: row.source_url ?? '',
    publishedAt: row.published_at ?? new Date().toISOString(),
    urgencyScore: row.urgency_score,
    zoneType: (row.zone_type ?? 'tech') as ZoneType,
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
    isNew: ageHours < 3,
    isUrgent: row.urgency_score >= 4,
  }
}

const HEADLINE_STOPWORDS = new Set([
  'with', 'after', 'from', 'have', 'their', 'about', 'would', 'could', 'should',
  'being', 'which', 'where', 'there', 'these', 'those', 'under', 'between',
  'first', 'before', 'during', 'while', 'against', 'among', 'into', 'over',
  'than', 'then', 'when', 'what', 'were', 'been', 'more', 'also', 'some',
  'will', 'says', 'said', 'this', 'that', 'live',
])

function significantHeadlineWords(headline: string): Set<string> {
  return new Set(
    headline
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3 && !HEADLINE_STOPWORDS.has(w))
  )
}

// Collapses separate DB rows covering the same real-world event into one representative
// article — the first (i.e. highest-priority, since callers pass an already urgency/recency
// sorted list) encountered. Two articles are treated as the same story via either path:
//
//  A) an EXACT shared tag string AND >=2 shared significant headline words — tag overlap
//     alone isn't safe, since generic tags (e.g. "Politics", "US Senate") are shared by
//     genuinely unrelated stories.
//  B) the SAME source, a fuzzy (word-level) tag overlap, AND >=1 shared headline word — added
//     after a real-world case (a live-blogged disaster) where one outlet's own coverage of one
//     event got tagged inconsistently across separate hourly Claude batches (e.g. "Nepal
//     floods" vs "Nepal" + "flash flood" vs "Nepal-Tibet floods" for the same story), so exact
//     tag-string matching alone let many near-duplicate rows from that outlet survive. Scoping
//     this looser path to same-source keeps it safe — it can't merge two different outlets'
//     unrelated stories the way a bare fuzzy-tag rule could.
function tagWords(tags: string[]): Set<string> {
  const words = new Set<string>()
  for (const tag of tags) significantHeadlineWords(tag).forEach(w => words.add(w))
  return words
}

export function dedupeStories(articles: ArticleDisplay[]): ArticleDisplay[] {
  const kept: Array<{ sourceName: string; tags: Set<string>; tagWords: Set<string>; words: Set<string> }> = []
  const result: ArticleDisplay[] = []

  for (const article of articles) {
    const tags = new Set(article.tags.map(t => t.toLowerCase().trim()).filter(Boolean))
    const words = significantHeadlineWords(article.headline)
    const artTagWords = tagWords(article.tags)

    const isDuplicate = kept.some(k => {
      let sharedWords = 0
      words.forEach(w => { if (k.words.has(w)) sharedWords++ })

      // Path A: exact tag match + strong headline overlap.
      if (tags.size > 0 && k.tags.size > 0) {
        const sharesTag = Array.from(tags).some(t => k.tags.has(t))
        if (sharesTag && sharedWords >= 2) return true
      }

      // Path B: same source + fuzzy tag-topic overlap + at least one shared headline word.
      if (article.sourceName && article.sourceName === k.sourceName) {
        let sharedTagWords = 0
        artTagWords.forEach(w => { if (k.tagWords.has(w)) sharedTagWords++ })
        if (sharedTagWords > 0 && sharedWords >= 1) return true
      }

      return false
    })

    if (isDuplicate) continue
    kept.push({ sourceName: article.sourceName, tags, tagWords: artTagWords, words })
    result.push(article)
  }

  return result
}

function scoreForImportance(article: ArticleDisplay): number {
  let score = article.urgencyScore * 3

  const ageHours = (Date.now() - new Date(article.publishedAt).getTime()) / (1000 * 60 * 60)
  if (ageHours < 2) score += 3
  else if (ageHours < 6) score += 2
  else if (ageHours < 12) score += 1

  const timeSensitive = ['today', 'tonight', 'deadline', 'breaking', 'alert', 'closing', 'final', 'now', 'live']
  if (timeSensitive.some(w => article.headline.toLowerCase().includes(w))) score += 4

  return score
}

// Distribute selections across zones: cap 3 per zone, never two in a row from the same zone
function pickDistributedByZone(scored: Array<{ article: ArticleDisplay; score: number }>, max: number): ArticleDisplay[] {
  const selected: ArticleDisplay[] = []
  const zoneCount: Record<string, number> = {}
  for (const { article } of scored) {
    if (selected.length >= max) break
    const z = article.zoneType
    if ((zoneCount[z] ?? 0) >= 3) continue
    if (selected.length > 0 && selected[selected.length - 1].zoneType === z) continue
    selected.push(article)
    zoneCount[z] = (zoneCount[z] ?? 0) + 1
  }
  return selected
}

// Breaking: urgent (score >= 4) stories from the last 12 hours only. Empty when nothing qualifies.
export function selectBreakingStories(articles: ArticleDisplay[], max = 5): ArticleDisplay[] {
  const cutoffMs = Date.now() - 12 * 60 * 60 * 1000
  return articles
    .filter(a => a.isUrgent && new Date(a.publishedAt).getTime() >= cutoffMs)
    .sort((a, b) => {
      if (b.urgencyScore !== a.urgencyScore) return b.urgencyScore - a.urgencyScore
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    })
    .slice(0, max)
}

// Top Stories: most important/recent stories across zones, excluding anything already used in Breaking.
// Always returns at least `min` stories (falls back to a looser zone cap if the strict pass comes up short).
export function selectTopStories(
  articles: ArticleDisplay[],
  excludeIds: Set<string>,
  min = 3,
  max = 6
): ArticleDisplay[] {
  const scored = articles
    .filter(a => !excludeIds.has(a.id))
    .map(a => ({ article: a, score: scoreForImportance(a) }))
    .sort((a, b) => b.score - a.score)

  const selected = pickDistributedByZone(scored, max)
  if (selected.length >= min) return selected

  // Fallback: same zone cap, but allow back-to-back same-zone picks so we still hit `min`
  const fallback: ArticleDisplay[] = []
  const fbCount: Record<string, number> = {}
  for (const { article } of scored) {
    if (fallback.length >= max) break
    const z = article.zoneType
    if ((fbCount[z] ?? 0) >= 3) continue
    fallback.push(article)
    fbCount[z] = (fbCount[z] ?? 0) + 1
  }
  return fallback
}
