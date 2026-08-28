import { createServerSupabase, getEffectiveUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getUserZones } from '@/lib/db/zones'
import { getStoryCoverage } from '@/lib/storyCoverage'
import StoryDetailClient from './StoryDetailClient'

export default async function StoryDetailPage({ params }: { params: { zoneId: string; storyId: string } }) {
  const user = await getEffectiveUser()
  if (!user) redirect('/auth/signin')

  const storyCoverage = await getStoryCoverage(params.storyId)
  if (!storyCoverage) redirect(`/zones/${params.zoneId}`)
  const { main, sources, zoneDisplays } = storyCoverage

  const supabase = createServerSupabase()
  const [saveData, userZones] = await Promise.all([
    supabase.from('user_saves').select('id').eq('user_id', user.id).eq('article_id', main.id).maybeSingle(),
    getUserZones(user.id).catch(() => [] as Awaited<ReturnType<typeof getUserZones>>),
  ])

  // Coverage (for the client's Full Coverage list): every source except the main
  // article itself, which the client already has as its own `article` prop.
  const coverage = sources.filter((a) => a.id !== main.id)

  // Related: zone articles not already surfaced as coverage, up to 3
  const coverageIds = new Set(sources.map((a) => a.id))
  const related = zoneDisplays
    .filter((a) => !coverageIds.has(a.id))
    .slice(0, 3)

  // Zone page href for the zone pill click
  const userZone = userZones.find((z) => z.type === main.zoneType)
  const zonePageHref = userZone ? `/zones/${userZone.id}` : '/zones'

  return (
    <StoryDetailClient
      article={main}
      coverage={coverage}
      related={related}
      isSaved={saveData.data !== null}
      userId={user.id}
      zonePageHref={zonePageHref}
    />
  )
}
