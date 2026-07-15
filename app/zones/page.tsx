export const dynamic = 'force-dynamic'

import { createServerSupabase, getEffectiveUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getUserZones } from '@/lib/db/zones'
import { getZoneArticles } from '@/lib/zonePreview'
import { getWeatherForAreas } from '@/lib/weather/nws'
import { getScoresForTeams, type TeamOfInterest } from '@/lib/scores/espn'
import ZonesHubClient from './ZonesHubClient'
import type { LocalArea, ZoneType } from '@/types'

export default async function ZonesPage() {
  const user = await getEffectiveUser()
  if (!user) redirect('/auth/signin')

  const dbZones = await getUserZones(user.id)

  // Fetch up to 9 articles per zone (one horizontal-scroll row per zone, see
  // ZonesHubClient) — team/area-aware, see lib/zonePreview.ts — and, for
  // Local/Sports Zones specifically, the same live Weather Card / Scores
  // Card data their zone detail pages use, so it can render as the lead card
  // in that zone's scroll row.
  const zoneData = await Promise.all(
    dbZones.map(async (z) => {
      const zoneType = z.type as ZoneType
      const teamsOfInterest = (z.config as { teams?: TeamOfInterest[] } | null)?.teams ?? []
      const localAreas = (z.config as { areas?: LocalArea[] } | null)?.areas ?? []
      const [articles, scores, weather] = await Promise.all([
        getZoneArticles(zoneType, z.config, 9),
        zoneType === 'sports' && teamsOfInterest.length > 0
          ? getScoresForTeams(teamsOfInterest)
          : Promise.resolve([]),
        zoneType === 'local' && localAreas.length > 0
          ? getWeatherForAreas(localAreas).catch(() => [])
          : Promise.resolve([]),
      ])
      return { zone: z, articles, scores, weather }
    })
  )

  // The new story cards are interactive (Save/Track, matching Home's Breaking/Top
  // Stories cards), so the hub needs each article's saved state up front.
  const articleIds = zoneData.flatMap((zd) => zd.articles.map((a) => a.id))
  const supabase = createServerSupabase()
  const { data: saves } = articleIds.length > 0
    ? await supabase.from('user_saves').select('article_id').eq('user_id', user.id).in('article_id', articleIds)
    : { data: [] as { article_id: string }[] }
  const initialSavedIds = (saves ?? []).map((s) => s.article_id)

  return <ZonesHubClient zoneData={zoneData} initialSavedIds={initialSavedIds} />
}
