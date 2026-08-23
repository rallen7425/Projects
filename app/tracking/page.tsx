export const dynamic = 'force-dynamic'

import { getEffectiveUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getTrackedTopics } from '@/lib/db/tracks'
import { getUserZones } from '@/lib/db/zones'
import { searchArticlesByTopic } from '@/lib/db/articles'
import { toArticleDisplay } from '@/lib/articleUtils'
import { resolveTrackedTopicZone } from '@/lib/trackingPreview'
import TrackingClient from './TrackingClient'
import type { ZoneType } from '@/types'

export default async function TrackingPage() {
  const user = await getEffectiveUser()
  if (!user) redirect('/auth/signin')

  const [topics, dbZones] = await Promise.all([
    getTrackedTopics(user.id),
    getUserZones(user.id),
  ])
  const zoneRefs = dbZones.map((z) => ({ id: z.id, type: z.type as ZoneType }))

  const topicsWithArticles = await Promise.all(
    topics.map(async (t) => {
      try {
        const zoneType = resolveTrackedTopicZone(t.zone_id, zoneRefs)
        let articles = await searchArticlesByTopic(t.topic, 5, 30, zoneType ?? undefined)
        // See lib/trackingPreview.ts — a topic's real coverage doesn't always
        // live in the zone_type it's editorially tracked under, so an empty
        // scoped search falls back to an unscoped one rather than looking dead.
        if (zoneType && articles.length === 0) {
          articles = await searchArticlesByTopic(t.topic, 5, 30)
        }
        return { topic: t, articles: articles.map(toArticleDisplay) }
      } catch {
        return { topic: t, articles: [] }
      }
    })
  )

  return <TrackingClient topicsWithArticles={topicsWithArticles} userId={user.id} zones={zoneRefs} />
}
