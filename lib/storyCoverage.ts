// Shared "Full Coverage" computation for a story — used by both the Story Detail
// page (to render the section) and the Read page (to know the ordered list of
// sources so its prev/next navigation lands on the exact same set, in the exact
// same order, as what the user saw on Story Detail). Keeping this in one place
// means the two pages can never quietly drift out of sync with each other.

import { getArticleById, getArticlesByZone, searchArticlesByTopic } from '@/lib/db/articles'
import { toArticleDisplay, findRelatedStories } from '@/lib/articleUtils'
import type { ArticleDisplay, ZoneType } from '@/types'

export type StoryCoverage = {
  main: ArticleDisplay
  // Every real source link for this story, main article first (if it has one),
  // then related coverage sorted by recency — the exact order Full Coverage
  // renders in, and the order the Read page's prev/next arrows step through.
  sources: ArticleDisplay[]
  // The zone's own wide article pool, already converted — returned so Story
  // Detail's "More from {Zone}" section can reuse it instead of re-fetching.
  zoneDisplays: ArticleDisplay[]
}

export async function getStoryCoverage(articleId: string): Promise<StoryCoverage | null> {
  const article = await getArticleById(articleId).catch(() => null)
  if (!article) return null

  const zoneType = (article.zone_type ?? 'news') as ZoneType
  const searchTopic = (Array.isArray(article.tags) && (article.tags as string[])[0])
    ? (article.tags as string[])[0]
    : article.headline.split(' ').slice(0, 4).join(' ')

  const [coverageRaw, zoneArticlesRaw] = await Promise.all([
    searchArticlesByTopic(searchTopic, 7),
    getArticlesByZone(zoneType, 45).catch(() => [] as Awaited<ReturnType<typeof getArticlesByZone>>),
  ])

  const main = toArticleDisplay(article)
  const zoneDisplays = zoneArticlesRaw.map(toArticleDisplay)

  // Every candidate has to pass findRelatedStories' same-story check — see
  // lib/articleUtils.ts's isSameStory doc comment for why the raw topic-search
  // results can't be trusted unfiltered (a short/generic tag ILIKE-matches almost
  // anything).
  const candidatePool = new Map<string, ArticleDisplay>()
  for (const a of [...zoneDisplays, ...coverageRaw.map(toArticleDisplay)]) {
    if (a.id !== article.id) candidatePool.set(a.id, a)
  }
  const coverage = findRelatedStories(main, Array.from(candidatePool.values()), 40)

  const sources = [
    ...(main.sourceUrl ? [main] : []),
    ...coverage.filter((c) => c.sourceUrl),
  ]

  return { main, sources, zoneDisplays }
}
