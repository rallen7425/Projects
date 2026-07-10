export const dynamic = 'force-dynamic'

import { createServerSupabase, getEffectiveUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getTopArticles, getArticlesByZone } from '@/lib/db/articles'
import { getUserZones } from '@/lib/db/zones'
import { getTrackedTopics } from '@/lib/db/tracks'
import { toArticleDisplay, scoredArticlesForTracking } from '@/lib/articleUtils'
import TodayClient from './TodayClient'
import type { ZoneType } from '@/types'

function getGreeting(): string {
  const h = new Date().getHours()
  if (h >= 4 && h < 12) return 'Good morning, Rick.'
  if (h >= 12 && h < 17) return 'Good afternoon, Rick.'
  if (h >= 17 && h < 21) return 'Good evening, Rick.'
  return 'Still up, Rick?'
}

export default async function TodayPage() {
  const user = await getEffectiveUser()
  if (!user) redirect('/auth/signin')

  const [articles, dbZones, trackedTopics] = await Promise.all([
    getTopArticles(30),
    getUserZones(user.id),
    getTrackedTopics(user.id),
  ])

  const displays = articles.map(toArticleDisplay)

  const articleIds = articles.map((a) => a.id)
  const supabase = createServerSupabase()
  const [{ data: saves }, { data: userProfile }] = await Promise.all([
    supabase.from('user_saves').select('article_id').eq('user_id', user.id).in('article_id', articleIds),
    supabase.from('users').select('zip_code').eq('id', user.id).maybeSingle(),
  ])

  const savedIds = new Set((saves ?? []).map((s) => s.article_id))
  const userCity = userProfile?.zip_code ?? undefined

  // Fetch top 10 articles per zone — reused for both zone cards and tracking scoring pool
  const zoneArticleSets = await Promise.all(
    dbZones.map(z => getArticlesByZone(z.type as ZoneType, 10))
  )

  const zoneData = dbZones.map((z, i) => ({
    id: z.id,
    type: z.type as ZoneType,
    topArticle: zoneArticleSets[i][0] ? toArticleDisplay(zoneArticleSets[i][0]) : null,
    articleCount: zoneArticleSets[i].length,
  }))

  const articlePool = zoneArticleSets.flat().map(toArticleDisplay)
  const trackingCards = scoredArticlesForTracking(articlePool, trackedTopics)

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  const greeting = getGreeting()

  return (
    <TodayClient
      articles={displays}
      initialSavedIds={Array.from(savedIds)}
      userId={user.id}
      today={today}
      greeting={greeting}
      zoneData={zoneData}
      trackingCards={trackingCards}
      userCity={userCity}
    />
  )
}
