import { createServerSupabase, getEffectiveUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getArticlesByZone, getArticleById } from '@/lib/db/articles'
import { getZoneQuicklook } from '@/lib/db/zones'
import { toArticleDisplay } from '@/lib/articleUtils'
import ZoneDetailClient from './ZoneDetailClient'
import type { ZoneType } from '@/types'

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

  const [articles, quicklook] = await Promise.all([
    getArticlesByZone(zoneType, 15),
    getZoneQuicklook(zoneType),
  ])

  const articleDisplays = articles.map(toArticleDisplay)

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
      initialSavedIds={Array.from(savedIds)}
      userId={user.id}
    />
  )
}
