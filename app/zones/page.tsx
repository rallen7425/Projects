export const dynamic = 'force-dynamic'

import { getEffectiveUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getArticlesByZone } from '@/lib/db/articles'
import { getUserZones, getZoneQuicklook } from '@/lib/db/zones'
import { toArticleDisplay } from '@/lib/articleUtils'
import ZonesHubClient from './ZonesHubClient'
import type { ZoneType } from '@/types'

export default async function ZonesPage() {
  const user = await getEffectiveUser()
  if (!user) redirect('/auth/signin')

  const dbZones = await getUserZones(user.id)

  // Fetch articles + quicklook for each zone in parallel
  const zoneData = await Promise.all(
    dbZones.map(async (z) => {
      const [articles, quicklook] = await Promise.all([
        getArticlesByZone(z.type as ZoneType, 2),
        getZoneQuicklook(z.type),
      ])
      return { zone: z, articles: articles.map(toArticleDisplay), quicklook }
    })
  )

  return <ZonesHubClient zoneData={zoneData} />
}
