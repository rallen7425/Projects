import { createServerSupabase, getEffectiveUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getArticlesByZone, getArticleById, searchTeamUpdates, searchArticlesByTopic } from '@/lib/db/articles'
import { getZoneQuicklook } from '@/lib/db/zones'
import { getTrackedTopics } from '@/lib/db/tracks'
import { toArticleDisplay, dedupeStories, selectBreakingStories, selectTopStories } from '@/lib/articleUtils'
import ZoneDetailClient from './ZoneDetailClient'
import type { ArticleDisplay, LocalArea, ZoneType } from '@/types'
import { getScoresForTeams, type TeamOfInterest } from '@/lib/scores/espn'
import { getWeatherForAreas } from '@/lib/weather/nws'

type TrackingTopicResult = { id: string; topic: string; createdAt: string; article: ArticleDisplay | null; articleCount: number }

// Tracking — same fetch/scoring rules for both Sports and Local (best-matching
// article per topic via searchArticlesByTopic), filtered to this zone's own
// zoneType: either explicitly tracked from this zone, or an untagged topic
// whose text actually matches this zone's coverage.
async function fetchZoneTracking(userId: string, zoneId: string, zoneType: ZoneType): Promise<TrackingTopicResult[]> {
  const allTracks = await getTrackedTopics(userId)
  const candidateTracks = allTracks.filter((t) => t.zone_id === zoneId || t.zone_id === null)
  const raw = await Promise.all(
    candidateTracks.map(async (t) => {
      const matches = await searchArticlesByTopic(t.topic, 5, 30, zoneType).catch(() => [])
      return {
        id: t.id,
        topic: t.topic,
        createdAt: t.created_at,
        zoneId: t.zone_id,
        article: matches[0] ? toArticleDisplay(matches[0]) : null,
        articleCount: matches.length,
      }
    })
  )
  return raw
    .filter((t) => t.zoneId === zoneId || t.articleCount > 0)
    .map((t) => ({ id: t.id, topic: t.topic, createdAt: t.createdAt, article: t.article, articleCount: t.articleCount }))
}

export default async function ZoneDetailPage({ params }: { params: { zoneId: string } }) {
  const user = await getEffectiveUser()
  if (!user) redirect('/auth/signin')

  const supabase = createServerSupabase()
  const { data: zone } = await supabase
    .from('zones')
    .select('*')
    .eq('id', params.zoneId)
    .eq('user_id', user.id)
    .single()

  if (!zone) redirect('/zones')

  const zoneType = zone.type as ZoneType

  const teamsOfInterest = ((zone.config as { teams?: TeamOfInterest[] } | null)?.teams ?? [])
  const localAreas = ((zone.config as { areas?: LocalArea[] } | null)?.areas ?? [])

  const [articles, quicklook, scores, weather] = await Promise.all([
    getArticlesByZone(zoneType, 15),
    getZoneQuicklook(zoneType),
    zoneType === 'sports' && teamsOfInterest.length > 0
      ? getScoresForTeams(teamsOfInterest)
      : Promise.resolve([]),
    zoneType === 'local' && localAreas.length > 0
      ? getWeatherForAreas(localAreas).catch(() => [])
      : Promise.resolve([]),
  ])

  // Team-of-interest coverage — general news, specific to in-season teams only (the
  // `scores` array is already filtered to in-season teams by getScoresForTeams).
  // Shared source for both Updates (the game-specific subset) and Top Stories
  // (everything else team-related).
  const teamRows = scores.length > 0
    ? await searchTeamUpdates(scores.map((s) => s.team.shortName), 8, 14, 16)
    : []
  const teamDisplays = dedupeStories(teamRows.map((row) => toArticleDisplay(row)))

  // Updates — strictly about the specific last/live or next game shown on the Scores
  // Card: the article must name that game's actual opponent, not just the team.
  // General team news (injuries, suspensions, personnel) is deliberately excluded
  // even though it mentions the team, per explicit product direction.
  const isGameSpecific = (article: ArticleDisplay) => {
    const text = `${article.headline} ${article.summary}`.toLowerCase()
    return scores.some((s) => {
      const opponents = [
        s.lastOrLiveGame?.opponent, s.lastOrLiveGame?.opponentAbbrev,
        s.nextGame?.opponent, s.nextGame?.opponentAbbrev,
      ].filter((o): o is string => !!o)
      return opponents.some((o) => text.includes(o.toLowerCase()))
    })
  }
  const updateDisplays = teamDisplays.filter(isGameSpecific).slice(0, 5)
  const updateIds = new Set(updateDisplays.map((a) => a.id))
  const topStories = teamDisplays.filter((a) => !updateIds.has(a.id))

  const articleDisplays = articles.map(toArticleDisplay)

  // More — general sports news beyond the Teams of Interest (excludes anything
  // already surfaced as team-of-interest coverage above).
  const teamKeywords = scores.map((s) => s.team.shortName.toLowerCase())
  const teamDisplayIds = new Set(teamDisplays.map((a) => a.id))
  const mentionsTeam = (a: ArticleDisplay) =>
    teamKeywords.some((k) => a.headline.toLowerCase().includes(k) || a.summary.toLowerCase().includes(k))
  const more = zoneType === 'sports'
    ? articleDisplays
        .filter((a) => !teamDisplayIds.has(a.id) && !mentionsTeam(a))
        .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    : []

  // Local Zone's own Breaking/Top Stories/Today split — mirrors Home's logic
  // exactly (lib/articleUtils.ts), just scoped to this single zone's own
  // article pool instead of cross-zone.
  const localDisplays = zoneType === 'local' ? dedupeStories(articleDisplays) : []
  const localBreaking = zoneType === 'local' ? selectBreakingStories(localDisplays) : []
  const localBreakingIds = new Set(localBreaking.map((a) => a.id))
  const localTopStories = zoneType === 'local' ? selectTopStories(localDisplays, localBreakingIds) : []
  const localTopIds = new Set(localTopStories.map((a) => a.id))
  const localToday = zoneType === 'local'
    ? localDisplays.filter((a) => !localBreakingIds.has(a.id) && !localTopIds.has(a.id))
    : []

  // Tracking — sports and local both use the same fetch/scoring rules as Home's
  // Tracking section, filtered to this zone's own zoneType.
  let trackingTopics: TrackingTopicResult[] = []
  if (zoneType === 'sports') {
    trackingTopics = await fetchZoneTracking(user.id, zone.id, 'sports')
  } else if (zoneType === 'local') {
    trackingTopics = await fetchZoneTracking(user.id, zone.id, 'local')
  }

  // Check saved status for all articles
  const articleIds = articles.map((a) => a.id)
  const { data: saves } = await supabase
    .from('user_saves')
    .select('article_id')
    .eq('user_id', user.id)
    .in('article_id', articleIds)

  const savedIds = new Set((saves ?? []).map((s) => s.article_id))

  return (
    <ZoneDetailClient
      zone={zone}
      articles={articleDisplays}
      quicklook={quicklook}
      scores={scores}
      weather={weather}
      updates={updateDisplays}
      breaking={localBreaking}
      topStories={zoneType === 'local' ? localTopStories : topStories}
      today={localToday}
      more={more}
      trackingTopics={trackingTopics}
      initialSavedIds={Array.from(savedIds)}
      userId={user.id}
    />
  )
}
