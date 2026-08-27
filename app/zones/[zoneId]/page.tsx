export const dynamic = 'force-dynamic'

import { createServerSupabase, getEffectiveUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getArticlesByZone, getArticleById, searchTeamUpdates, searchArticlesByTopic } from '@/lib/db/articles'
import { getZoneQuicklook } from '@/lib/db/zones'
import { getTrackedTopics } from '@/lib/db/tracks'
import { toArticleDisplay, dedupeStories, selectBreakingStories, selectTopStories } from '@/lib/articleUtils'
import { applyLocalAreaPriority } from '@/lib/zonePreview'
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
  const isGeneric = zoneType !== 'sports' && zoneType !== 'local'

  const teamsOfInterest = ((zone.config as { teams?: TeamOfInterest[] } | null)?.teams ?? [])
  const localAreas = ((zone.config as { areas?: LocalArea[] } | null)?.areas ?? [])

  // Local Zone's (and, for the same reason, every generic zone's) Breaking/Top Stories/Today
  // pool is fetched separately and larger (45 vs the flat 15) — its own urgency-sorted top 15
  // can already be dominated by one prolific source/event (e.g. a live-blogged breaking story
  // spawning a dozen high-urgency rows) before dedupeStories ever gets enough raw material to
  // find genuinely distinct stories among it. Local's version of this also re-biases toward the
  // user's primary community/metro via applyLocalAreaPriority (see that function's doc comment).
  const [articles, quicklook, scores, weather, localPoolRows, genericPoolRows] = await Promise.all([
    getArticlesByZone(zoneType, 15),
    getZoneQuicklook(zoneType),
    zoneType === 'sports' && teamsOfInterest.length > 0
      ? getScoresForTeams(teamsOfInterest)
      : Promise.resolve([]),
    zoneType === 'local' && localAreas.length > 0
      ? getWeatherForAreas(localAreas).catch(() => [])
      : Promise.resolve([]),
    zoneType === 'local' ? getArticlesByZone('local', 45) : Promise.resolve([]),
    isGeneric ? getArticlesByZone(zoneType, 45) : Promise.resolve([]),
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

  // Local + generic zones (everything except Sports, which has its own
  // team-of-interest split above) both use the same Breaking/Top Stories split
  // against their own article pool (lib/articleUtils.ts), mirroring Home's logic
  // exactly. Generic zones (News, Tech, etc.) additionally cap Today and push
  // the overflow into a trailing More section; Local's Today is uncapped, no More.
  const TODAY_CAP = 15

  // Local and generic zones each draw from their own larger 45-row pool fetched
  // above, rather than the flat 15-row `articles` fetch (see the comment above
  // that fetch for why).
  const nonSportsPool = zoneType === 'local' ? localPoolRows : genericPoolRows
  const zoneDisplays = zoneType !== 'sports' ? dedupeStories(nonSportsPool.map(toArticleDisplay)) : []

  // Breaking stays purely urgency/recency-driven (unboosted) so a genuinely urgent story
  // from any configured area — primary or secondary — still surfaces here.
  const zoneBreaking = zoneType !== 'sports' ? selectBreakingStories(zoneDisplays) : []
  const zoneBreakingIds = new Set(zoneBreaking.map((a) => a.id))
  const zoneAfterBreaking = zoneDisplays.filter((a) => !zoneBreakingIds.has(a.id))

  // Top Stories/Today favor the user's primary community/metro over a secondary "extra"
  // area (see lib/zonePreview.ts's applyLocalAreaPriority) — a mix, not an exclusion,
  // since secondary-area articles are only left unboosted, never penalized.
  const prioritizedRemaining = zoneType === 'local'
    ? applyLocalAreaPriority(zoneAfterBreaking, localAreas)
    : zoneAfterBreaking

  const zoneTopStories = zoneType !== 'sports' ? selectTopStories(prioritizedRemaining, new Set()) : []
  const zoneTopIds = new Set(zoneTopStories.map((a) => a.id))
  const zoneRemaining = zoneType !== 'sports'
    ? prioritizedRemaining.filter((a) => !zoneTopIds.has(a.id))
    : []
  const zoneToday = isGeneric ? zoneRemaining.slice(0, TODAY_CAP) : zoneRemaining
  const zoneMore = isGeneric ? zoneRemaining.slice(TODAY_CAP) : []

  // Tracking — every zone type uses the same fetch/scoring rules as Home's
  // Tracking section, filtered to this zone's own zoneType.
  const trackingTopics: TrackingTopicResult[] = await fetchZoneTracking(user.id, zone.id, zoneType)

  // Check saved status for all articles — includes the larger local/generic pool so a
  // save made outside the flat 15-row fetch still shows as saved.
  const articleIds = zoneType === 'local'
    ? Array.from(new Set([...articles.map((a) => a.id), ...localPoolRows.map((a) => a.id)]))
    : isGeneric
      ? Array.from(new Set([...articles.map((a) => a.id), ...genericPoolRows.map((a) => a.id)]))
      : articles.map((a) => a.id)
  const { data: saves } = await supabase
    .from('user_saves')
    .select('article_id')
    .eq('user_id', user.id)
    .in('article_id', articleIds)

  const savedIds = new Set((saves ?? []).map((s) => s.article_id))

  return (
    <ZoneDetailClient
      zone={zone}
      articles={zoneType === 'sports' ? articleDisplays : zoneDisplays}
      quicklook={quicklook}
      scores={scores}
      weather={weather}
      updates={updateDisplays}
      breaking={zoneBreaking}
      topStories={zoneType === 'sports' ? topStories : zoneTopStories}
      today={zoneToday}
      more={zoneType === 'sports' ? more : zoneMore}
      trackingTopics={trackingTopics}
      initialSavedIds={Array.from(savedIds)}
      userId={user.id}
    />
  )
}
