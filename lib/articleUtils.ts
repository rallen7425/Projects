import type { ArticleDisplay, ZoneType } from '@/types'
import type { Database } from '@/types/supabase'

type ArticleRow = Database['distilled']['Tables']['articles']['Row']

export function toArticleDisplay(row: ArticleRow, nowMs = Date.now()): ArticleDisplay {
  const publishedMs = row.published_at ? new Date(row.published_at).getTime() : NaN
  const ageMs = nowMs - publishedMs
  const ageHours = ageMs / (1000 * 60 * 60)

  return {
    id: row.id,
    headline: row.headline,
    summary: row.summary ?? '',
    imageUrl: row.image_url ?? undefined,
    sourceName: row.source_name ?? '',
    sourceUrl: row.source_url ?? '',
    publishedAt: row.published_at ?? '',
    urgencyScore: row.urgency_score,
    zoneType: (row.zone_type ?? 'tech') as ZoneType,
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
    isNew: Number.isFinite(ageHours) && ageHours >= 0 && ageHours < 3,
    isUrgent: row.urgency_score >= 4,
  }
}

// Until persistent event identities exist, only collapse exact normalized headlines.
// Topic/tag overlap is not evidence that two reports describe the same event.
type StoryProfile = { id: string; headline: string; publishedMs: number }
function storyProfile(article: ArticleDisplay): StoryProfile {
  return { publishedMs: Date.parse(article.publishedAt), id: article.id, headline: article.headline.toLowerCase().replace(/\s+/g, ' ').trim() }
}
function isSameStory(a: StoryProfile, b: StoryProfile): boolean {
  return a.id === b.id || (a.headline.length > 0 && a.headline === b.headline &&
    Number.isFinite(a.publishedMs) && Number.isFinite(b.publishedMs) &&
    Math.abs(a.publishedMs - b.publishedMs) <= 36 * 60 * 60 * 1000)
}

export function dedupeStories(articles: ArticleDisplay[]): ArticleDisplay[] {
  const kept: StoryProfile[] = []
  const result: ArticleDisplay[] = []

  for (const article of articles) {
    const profile = storyProfile(article)
    const isDuplicate = kept.some(k => isSameStory(profile, k))
    if (isDuplicate) continue
    kept.push(profile)
    result.push(article)
  }

  return result
}

// Finds every article in `pool` that dedupeStories would treat as the same real-world
// story as `article` — used by Story Detail's "Full Coverage" section, which previously
// relied on a single-tag ILIKE search (lib/db/articles.ts's searchArticlesByTopic) that
// missed most of a story's actual coverage for the exact same reason dedupeStories itself
// used to under-collapse duplicates: inconsistent tag/headline phrasing for the same event
// across separate pipeline batches. Reusing the same same-story comparator here means
// Full Coverage now surfaces the very articles dedupeStories collapsed away up in
// Breaking/Top Stories/Today, instead of a narrower, differently-computed set.
export function findRelatedStories(article: ArticleDisplay, pool: ArticleDisplay[], max = 10): ArticleDisplay[] {
  const target = storyProfile(article)
  return pool
    .filter(a => a.id !== article.id && isSameStory(target, storyProfile(a)))
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, max)
}

function scoreForImportance(article: ArticleDisplay): number {
  let score = article.urgencyScore * 3

  const ageHours = (Date.now() - new Date(article.publishedAt).getTime()) / (1000 * 60 * 60)
  if (ageHours >= 0 && ageHours < 2) score += 3
  else if (ageHours >= 0 && ageHours < 6) score += 2
  else if (ageHours >= 0 && ageHours < 12) score += 1

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
  const now = Date.now()
  const cutoffMs = now - 12 * 60 * 60 * 1000
  return articles
    .filter(a => a.isUrgent && new Date(a.publishedAt).getTime() >= cutoffMs && new Date(a.publishedAt).getTime() <= now)
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
