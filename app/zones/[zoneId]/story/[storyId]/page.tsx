import { createServerSupabase, getEffectiveUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getArticleById, getArticlesByZone, searchArticlesByTopic } from '@/lib/db/articles'
import { getUserZones } from '@/lib/db/zones'
import { toArticleDisplay } from '@/lib/articleUtils'
import StoryDetailClient from './StoryDetailClient'
import type { ZoneType } from '@/types'

export default async function StoryDetailPage({ params }: { params: { zoneId: string; storyId: string } }) {
  const user = await getEffectiveUser()
  if (!user) redirect('/auth/signin')

  const article = await getArticleById(params.storyId)
  if (!article) redirect(`/zones/${params.zoneId}`)

  const zoneType = (article.zone_type ?? params.zoneId) as ZoneType

  // Build search topic from first tag or headline keywords
  const searchTopic = (Array.isArray(article.tags) && (article.tags as string[])[0])
    ? (article.tags as string[])[0]
    : article.headline.split(' ').slice(0, 4).join(' ')

  const supabase = createServerSupabase()

  const [coverageRaw, zoneArticlesRaw, saveData, userZones] = await Promise.all([
    searchArticlesByTopic(searchTopic, 7),
    getArticlesByZone(zoneType, 8).catch(() => [] as Awaited<ReturnType<typeof getArticlesByZone>>),
    supabase.from('user_saves').select('id').eq('user_id', user.id).eq('article_id', article.id).maybeSingle(),
    getUserZones(user.id).catch(() => [] as Awaited<ReturnType<typeof getUserZones>>),
  ])

  // Coverage: topic-matched articles (excluding the main article), up to 5
  const coverage = coverageRaw
    .filter((a) => a.id !== article.id)
    .slice(0, 5)
    .map(toArticleDisplay)

  // Related: zone articles not already in coverage, up to 3
  const coverageIds = new Set([article.id, ...coverage.map((a) => a.id)])
  const related = zoneArticlesRaw
    .filter((a) => !coverageIds.has(a.id))
    .slice(0, 3)
    .map(toArticleDisplay)

  // Zone page href for the zone pill click
  const userZone = userZones.find((z) => z.type === zoneType)
  const zonePageHref = userZone ? `/zones/${userZone.id}` : '/zones'

  return (
    <StoryDetailClient
      article={toArticleDisplay(article)}
      coverage={coverage}
      related={related}
      isSaved={saveData.data !== null}
      userId={user.id}
      zonePageHref={zonePageHref}
    />
  )
}
