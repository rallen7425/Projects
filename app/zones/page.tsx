export const dynamic = 'force-dynamic'

import { getEffectiveUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getUserZones, getZoneQuicklook } from '@/lib/db/zones'
import { getZoneArticles } from '@/lib/zonePreview'
import { getWeatherForAreas } from '@/lib/weather/nws'
import { getScoresForTeams, type TeamOfInterest } from '@/lib/scores/espn'
import ZonesHubClient from './ZonesHubClient'
import type { LocalArea, ZoneType } from '@/types'

export default async function ZonesPage() {
  const user = await getEffectiveUser()
  if (!user) redirect('/auth/signin')

  const dbZones = await getUserZones(user.id)

  // Fetch articles (team/area-aware, see lib/zonePreview.ts), quicklook, and —
  // for Local/Sports Zones specifically — the same live Weather Card / Scores
  // Card data their zone detail pages use, so the hub card can show it too.
  const zoneData = await Promise.all(
    dbZones.map(async (z) => {
      const zoneType = z.type as ZoneType
      const teamsOfInterest = (z.config as { teams?: TeamOfInterest[] } | null)?.teams ?? []
      const localAreas = (z.config as { areas?: LocalArea[] } | null)?.areas ?? []
      const [articles, quicklook, scores, weather] = await Promise.all([
        getZoneArticles(zoneType, z.config, 3),
        getZoneQuicklook(z.type),
        zoneType === 'sports' && teamsOfInterest.length > 0
          ? getScoresForTeams(teamsOfInterest)
          : Promise.resolve([]),
        zoneType === 'local' && localAreas.length > 0
          ? getWeatherForAreas(localAreas).catch(() => [])
          : Promise.resolve([]),
      ])
      return { zone: z, articles, quicklook, scores, weather }
    })
  )

  return <ZonesHubClient zoneData={zoneData} />
}
