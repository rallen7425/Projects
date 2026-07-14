// Shared zone-preview logic for compact zone cards (Home's "Your Zones" section,
// Summary View's equivalent, and the /zones hub page). The Sports Zone's shared
// article pool is generic (all leagues/teams via ESPN RSS), so its preview must be
// filtered to the user's Teams of Interest — same personalization already applied
// on the zone detail page's Top Stories, just reused here instead of duplicated.
// The Local Zone's shared pool is already area-specific at ingestion (Google News
// queries scoped to the user's configured community/metro/region), so a plain
// zone-wide fetch is already personalized there — no team-style filtering needed.

import type { ArticleDisplay, ZoneType } from '@/types'
import type { TeamOfInterest } from '@/lib/scores/espn'
import { getScoresForTeams } from '@/lib/scores/espn'
import { getArticlesByZone, searchTeamUpdates } from '@/lib/db/articles'
import { dedupeStories, toArticleDisplay } from '@/lib/articleUtils'
import type { Json } from '@/types/supabase'

// Returns the zone's articles in personalized order — for Sports, team-of-interest
// coverage first (falls back to the generic zone pool if no teams are configured or
// none of them have any matching coverage); for every other zone type, the plain
// zone-wide pool, which for Local is already area-specific at ingestion. Callers
// derive whatever shape they need: a single "topArticle" + count (Home/Summary's
// compact zone cards) or the full list (the /zones hub's richer cards, which show
// up to 2 preview story rows plus per-story dots).
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

  const articles = await getArticlesByZone(zoneType, limit)
  return articles.map(toArticleDisplay)
}

export type ZonePreview = { topArticle: ArticleDisplay | null; articleCount: number }

export async function getZonePreview(zoneType: ZoneType, config: Json, limit = 10): Promise<ZonePreview> {
  const articles = await getZoneArticles(zoneType, config, limit)
  return {
    topArticle: articles[0] ?? null,
    articleCount: articles.length,
  }
}
