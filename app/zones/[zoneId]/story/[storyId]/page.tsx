import { createServerSupabase, getEffectiveUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getArticleById, getArticlesByZone, searchArticlesByTopic } from '@/lib/db/articles'
import { getUserZones } from '@/lib/db/zones'
import { toArticleDisplay, findRelatedStories } from '@/lib/articleUtils'
import StoryDetailClient from './StoryDetailClient'
import type { ArticleDisplay, ZoneType } from '@/types'

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

  // zoneArticlesRaw is fetched wide (45, not the old flat 8) so findRelatedStories has
  // enough of the zone's real pool to work with — a big story's coverage is often spread
  // well past the first 8 urgency-sorted rows.
  const [coverageRaw, zoneArticlesRaw, saveData, userZones] = await Promise.all([
    searchArticlesByTopic(searchTopic, 7),
    getArticlesByZone(zoneType, 45).catch(() => [] as Awaited<ReturnType<typeof getArticlesByZone>>),
    supabase.from('user_saves').select('id').eq('user_id', user.id).eq('article_id', article.id).maybeSingle(),
    getUserZones(user.id).catch(() => [] as Awaited<ReturnType<typeof getUserZones>>),
  ])

  const mainDisplay = toArticleDisplay(article)
  const zoneDisplays = zoneArticlesRaw.map(toArticleDisplay)

  // Coverage: every candidate — the zone pool plus the topic-search results (for recall
  // beyond the zone pool, e.g. a related article classified under a different zone) — has
  // to pass findRelatedStories' same-story check against the main article. The topic search
  // alone isn't a safe signal on its own: `searchTopic` is often just the article's first
  // tag (e.g. "AI"), and a bare ILIKE match on a short/generic tag like that matches almost
  // anything, not just genuinely related coverage — confirmed live (an earbuds story pulled
  // in NFL, markets, and politics articles before this was gated).
  const candidatePool = new Map<string, ArticleDisplay>()
  for (const a of [...zoneDisplays, ...coverageRaw.map(toArticleDisplay)]) {
    if (a.id !== article.id) candidatePool.set(a.id, a)
  }
  // Capped well above the candidate pool's realistic size (rather than the old flat 10)
  // now that the UI paginates Full Coverage 5-at-a-time instead of showing one flat list.
  const coverage = findRelatedStories(mainDisplay, Array.from(candidatePool.values()), 40)

  // Related: zone articles not already in coverage, up to 3
  const coverageIds = new Set([article.id, ...coverage.map((a) => a.id)])
  const related = zoneDisplays
    .filter((a) => !coverageIds.has(a.id))
    .slice(0, 3)

  // Zone page href for the zone pill click
  const userZone = userZones.find((z) => z.type === zoneType)
  const zonePageHref = userZone ? `/zones/${userZone.id}` : '/zones'

  return (
    <StoryDetailClient
      article={mainDisplay}
      coverage={coverage}
      related={related}
      isSaved={saveData.data !== null}
      userId={user.id}
      zonePageHref={zonePageHref}
    />
  )
}
