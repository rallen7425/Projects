export const dynamic = 'force-dynamic'

import { getEffectiveUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getUserZones, getZoneQuicklook } from '@/lib/db/zones'
import { getZoneArticles } from '@/lib/zonePreview'
import { getWeatherForAreas } from '@/lib/weather/nws'
import ZonesHubClient from './ZonesHubClient'
import type { LocalArea, ZoneType } from '@/types'

export default async function ZonesPage() {
  const user = await getEffectiveUser()
  if (!user) redirect('/auth/signin')

  const dbZones = await getUserZones(user.id)

  // Fetch articles (team/area-aware, see lib/zonePreview.ts), quicklook, and —
  // for Local Zone specifically — a live weather stat-hero (mirrors the zone
  // detail page's Weather Card; the old pipeline-written quicklook stat for
  // weather was retired when Local Zone moved to live-fetched weather).
  const zoneData = await Promise.all(
    dbZones.map(async (z) => {
      const zoneType = z.type as ZoneType
      const [articles, quicklook, weather] = await Promise.all([
        getZoneArticles(zoneType, z.config, 2),
        getZoneQuicklook(z.type),
        zoneType === 'local'
          ? getWeatherForAreas((z.config as { areas?: LocalArea[] } | null)?.areas ?? []).catch(() => [])
          : Promise.resolve([]),
      ])
      return { zone: z, articles, quicklook, weather: weather[0] ?? null }
    })
  )

  return <ZonesHubClient zoneData={zoneData} />
}
