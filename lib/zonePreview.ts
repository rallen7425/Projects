// Shared zone-preview logic for compact zone cards (Home's "Your Zones" section,
// Summary View's equivalent, and the /zones hub page). The Sports Zone's shared
// article pool is generic (all leagues/teams via ESPN RSS), so its preview must be
// filtered to the user's Teams of Interest — same personalization already applied
// on the zone detail page's Top Stories, just reused here instead of duplicated.
// The Local Zone's shared pool is area-specific at ingestion (Google News queries +
// curated direct sources per configured area), but ingestion doesn't distinguish the
// user's primary community/metro from a secondary "extra" area (e.g. a vacation town) —
// a secondary area's direct sources can be statewide/regional outlets (not filtered to
// that area's own relevance) and can otherwise flood the pool. applyLocalAreaPriority
// below re-biases toward primary-area content, same ILIKE-substring/source-name
// matching approach already used for Sports' team-of-interest, since articles don't
// carry a stored per-area tag.

import type { ArticleDisplay, LocalArea, ZoneType } from '@/types'
import type { TeamOfInterest } from '@/lib/scores/espn'
import { getScoresForTeams } from '@/lib/scores/espn'
import { getArticlesByZone, searchTeamUpdates } from '@/lib/db/articles'
import { dedupeStories, toArticleDisplay } from '@/lib/articleUtils'
import type { Json } from '@/types/supabase'

// LocalArea.id follows a 'community-primary' / 'metro-primary' / 'region-primary' /
// 'community-secondary-N' convention (see lib/geo/*, scripts/setup-local-zone.ts) —
// areas without '-secondary' are the user's actual home community/metro/region.
function classifyLocalArticle(article: ArticleDisplay, areas: LocalArea[]): 'primary' | 'secondary' | 'neutral' {
  const primaryAreas = areas.filter((a) => !a.id.includes('secondary'))
  const secondaryAreas = areas.filter((a) => a.id.includes('secondary'))

  // Source name is the strongest signal: a secondary area's curated direct sources
  // (e.g. a statewide outlet) publish plenty of content with no textual mention of
  // the area itself, so headline/summary keyword matching alone would miss it.
  const secondarySources = new Set(secondaryAreas.flatMap((a) => (a.directSources ?? []).map((s) => s.name)))
  const primarySources = new Set(primaryAreas.flatMap((a) => (a.directSources ?? []).map((s) => s.name)))
  if (secondarySources.has(article.sourceName)) return 'secondary'
  if (primarySources.has(article.sourceName)) return 'primary'

  // Fallback for Google News-sourced articles (no dedicated outlet tie to an area):
  // match the area's place name (label minus state suffix) or full query phrase.
  const text = `${article.headline} ${article.summary}`.toLowerCase()
  const terms = (list: LocalArea[]) => list.flatMap((a) => [a.label.split(',')[0], a.query]).filter(Boolean)
  if (terms(secondaryAreas).some((t) => text.includes(t.toLowerCase()))) return 'secondary'
  if (terms(primaryAreas).some((t) => text.includes(t.toLowerCase()))) return 'primary'
  return 'neutral'
}

// Boosts primary-area articles' effective urgency so the existing urgency/recency-based
// selection (selectTopStories, plain sort) naturally favors them — the selection criteria
// themselves are untouched, only the input ranking is biased. Secondary-area articles are
// never penalized, only not boosted, so the result is still a mix rather than a full
// primary/secondary split. Deliberately NOT applied to Breaking (see the zone detail
// page) — Breaking stays purely urgency/recency-driven so genuine local emergencies from
// any configured area still surface.
export function applyLocalAreaPriority(articles: ArticleDisplay[], areas: LocalArea[]): ArticleDisplay[] {
  if (areas.length === 0) return articles
  const boosted = articles.map((a) => {
    if (classifyLocalArticle(a, areas) !== 'primary') return a
    const urgencyScore = Math.min(5, a.urgencyScore + 1)
    return { ...a, urgencyScore, isUrgent: urgencyScore >= 4 }
  })
  return boosted.sort((a, b) => {
    if (b.urgencyScore !== a.urgencyScore) return b.urgencyScore - a.urgencyScore
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  })
}

// Returns the zone's articles in personalized order — for Sports, team-of-interest
// coverage first (falls back to the generic zone pool if no teams are configured or
// none of them have any matching coverage); for Local, a larger raw pool (so there's
// enough headroom to re-rank) run through applyLocalAreaPriority; for every other zone
// type, the plain zone-wide pool. Callers derive whatever shape they need: a single
// "topArticle" + count (Home/Summary's compact zone cards) or the full list (the /zones
// hub's richer cards, which show up to 3 preview story rows plus per-story dots).
export async function getZoneArticles(zoneType: ZoneType, config: Json, limit = 10): Promise<ArticleDisplay[]> {
  if (zoneType === 'sports') {
    const teams = (config as { teams?: TeamOfInterest[] } | null)?.teams ?? []
    if (teams.length > 0) {
      const scores = await getScoresForTeams(teams).catch(() => [])
      const teamNames = (scores.length > 0 ? scores.map((s) => s.team.shortName) : teams.map((t) => t.shortName))
      const rows = await searchTeamUpdates(teamNames, 8, 14, limit).catch(() => [])
      const displays = dedupeStories(rows.map(toArticleDisplay))
      if (displays.length > 0) return displays
    }
  }

  if (zoneType === 'local') {
    const areas = (config as { areas?: LocalArea[] } | null)?.areas ?? []
    if (areas.length > 0) {
      const poolSize = Math.max(limit * 3, 30)
      const rows = await getArticlesByZone(zoneType, poolSize)
      const displays = dedupeStories(rows.map(toArticleDisplay))
      return applyLocalAreaPriority(displays, areas).slice(0, limit)
    }
  }

  // Same reasoning as the Local branch above: fetch a larger raw pool than `limit` so
  // dedupeStories has enough headroom to find genuinely distinct stories even when one
  // event (e.g. a live-blogged breaking story) is dominating the zone's raw urgency-sorted
  // pool — this branch previously skipped dedup entirely, which is what let Home/Summary's
  // "Your Zones" card and the /zones hub keep showing several rows about the same event
  // even after Breaking/Top Stories/Today (which do dedupe) had already collapsed them.
  const poolSize = Math.max(limit * 3, 30)
  const rows = await getArticlesByZone(zoneType, poolSize)
  return dedupeStories(rows.map(toArticleDisplay)).slice(0, limit)
}

// `topArticles` is the full fetched pool (up to `limit`), not pre-sliced to 3 —
// callers (Home/Summary's page.tsx) dedupe against Breaking/Top Stories first,
// then take the first 3 of what's left, so a story already shown higher up
// the page never repeats in a zone's preview card.
export type ZonePreview = { topArticle: ArticleDisplay | null; topArticles: ArticleDisplay[]; articleCount: number }

export async function getZonePreview(zoneType: ZoneType, config: Json, limit = 10): Promise<ZonePreview> {
  const articles = await getZoneArticles(zoneType, config, limit)
  return {
    topArticle: articles[0] ?? null,
    topArticles: articles,
    articleCount: articles.length,
  }
}
