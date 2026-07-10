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

type TrackedTopic = { topic: string; deadline_at: string | null }

function scoreArticle(article: ArticleDisplay, trackedTopics: TrackedTopic[]): number {
  let score = article.urgencyScore * 3

  const ageHours = (Date.now() - new Date(article.publishedAt).getTime()) / (1000 * 60 * 60)
  if (ageHours < 2) score += 3
  else if (ageHours < 6) score += 2
  else if (ageHours < 12) score += 1

  for (const t of trackedTopics) {
    const words = t.topic.toLowerCase().split(' ').filter(w => w.length > 3)
    const haystack = (article.headline + ' ' + article.tags.join(' ')).toLowerCase()
    const matched = words.some(w => haystack.includes(w))
    if (matched) {
      score += 5
      if (t.deadline_at && new Date(t.deadline_at) > new Date()) score += 4
      break
    }
  }

  const timeSensitive = ['today', 'tonight', 'deadline', 'breaking', 'alert', 'closing', 'final', 'now', 'live']
  if (timeSensitive.some(w => article.headline.toLowerCase().includes(w))) score += 4

  return score
}

export function scoredArticlesForTracking(
  articles: ArticleDisplay[],
  trackedTopics: TrackedTopic[],
  min = 3,
  max = 6
): ArticleDisplay[] {
  const scored = articles
    .map(a => ({ article: a, score: scoreArticle(a, trackedTopics) }))
    .sort((a, b) => b.score - a.score)

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

  if (selected.length < min) {
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

  return selected
}
