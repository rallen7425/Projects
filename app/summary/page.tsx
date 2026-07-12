export const dynamic = 'force-dynamic'

import { createServerSupabase, getEffectiveUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getTopArticles, getArticlesByZone, searchArticlesByTopic } from '@/lib/db/articles'
import { getUserZones } from '@/lib/db/zones'
import { getTrackedTopics } from '@/lib/db/tracks'
import { toArticleDisplay, dedupeStories, selectBreakingStories, selectTopStories } from '@/lib/articleUtils'
import SummaryClient from './SummaryClient'
import type { ZoneType } from '@/types'

function getGreeting(): string {
  const h = new Date().getHours()
  if (h >= 4 && h < 12) return 'Good morning, Rick.'
  if (h >= 12 && h < 17) return 'Good afternoon, Rick.'
  if (h >= 17 && h < 21) return 'Good evening, Rick.'
  return 'Still up, Rick?'
}

export default async function SummaryPage() {
  const user = await getEffectiveUser()
  if (!user) redirect('/auth/signin')

  const [articles, dbZones, trackedTopics] = await Promise.all([
    getTopArticles(30),
    getUserZones(user.id),
    getTrackedTopics(user.id),
  ])

  // Collapse separate DB rows covering the same real-world event before splitting into sections
  const displays = dedupeStories(articles.map(toArticleDisplay))

  const articleIds = articles.map((a) => a.id)
  const supabase = createServerSupabase()
  const [{ data: saves }, { data: userProfile }] = await Promise.all([
    supabase.from('user_saves').select('article_id').eq('user_id', user.id).in('article_id', articleIds),
    supabase.from('users').select('zip_code').eq('id', user.id).maybeSingle(),
  ])

  const savedIds = new Set((saves ?? []).map((s) => s.article_id))
  const userCity = userProfile?.zip_code ?? undefined

  // Fetch top 10 articles per zone — used for the Your Zones cards
  const zoneArticleSets = await Promise.all(
    dbZones.map(z => getArticlesByZone(z.type as ZoneType, 10))
  )

  const zoneData = dbZones.map((z, i) => ({
    id: z.id,
    type: z.type as ZoneType,
    topArticle: zoneArticleSets[i][0] ? toArticleDisplay(zoneArticleSets[i][0]) : null,
    articleCount: zoneArticleSets[i].length,
  }))

  // Breaking > Top Stories > Today/More — each tier excludes articles already claimed above it
  const breakingArticles = selectBreakingStories(displays)
  const breakingIds = new Set(breakingArticles.map(a => a.id))

  const topStoryArticles = selectTopStories(displays, breakingIds)
  const topStoryIds = new Set(topStoryArticles.map(a => a.id))

  const remainingArticles = displays.filter(a => !breakingIds.has(a.id) && !topStoryIds.has(a.id))

  // One representative article per tracked topic (most recent match), for the Tracking card row
  const trackingTopics = await Promise.all(
    trackedTopics.map(async (t) => {
      const matches = await searchArticlesByTopic(t.topic, 5).catch(() => [])
      return {
        id: t.id,
        topic: t.topic,
        createdAt: t.created_at,
        article: matches[0] ? toArticleDisplay(matches[0]) : null,
        articleCount: matches.length,
      }
    })
  )

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  const greeting = getGreeting()

  return (
    <SummaryClient
      breakingArticles={breakingArticles}
      topStoryArticles={topStoryArticles}
      remainingArticles={remainingArticles}
      initialSavedIds={Array.from(savedIds)}
      userId={user.id}
      today={today}
      greeting={greeting}
      zoneData={zoneData}
      trackingTopics={trackingTopics}
      userCity={userCity}
    />
  )
}
