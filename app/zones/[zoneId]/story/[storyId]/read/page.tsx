import { createServerSupabase, getEffectiveUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getStoryCoverage } from '@/lib/storyCoverage'
import ReadClient from './ReadClient'

// Sites that explicitly refuse to be framed tell us so via these headers.
// Absence of both means the browser will allow framing by default.
async function checkEmbeddable(url: string): Promise<boolean> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5000)

  try {
    let res = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: controller.signal })
    if (res.status === 405 || res.status === 501) {
      res = await fetch(url, { method: 'GET', redirect: 'follow', signal: controller.signal })
      res.body?.cancel().catch(() => {})
    }

    const xfo = (res.headers.get('x-frame-options') ?? '').toLowerCase()
    if (xfo.includes('deny') || xfo.includes('sameorigin')) return false

    const csp = (res.headers.get('content-security-policy') ?? '').toLowerCase()
    const match = csp.match(/frame-ancestors\s+([^;]+)/)
    if (match) {
      // Only a bare "*" token means "any origin." Scoped patterns like
      // "*.espn.com:*" contain the character '*' but only permit that
      // site's own domain family, not us — a plain substring check on
      // '*' produced false positives for exactly this case (ESPN).
      const tokens = match[1].trim().split(/\s+/)
      if (!tokens.includes('*')) return false
    }

    return true
  } catch {
    // Can't verify — fail safe to the AI Preview rather than risk a blank frame.
    return false
  } finally {
    clearTimeout(timeout)
  }
}

export default async function ReadPage({
  params,
  searchParams,
}: {
  params: { zoneId: string; storyId: string }
  searchParams: { sourceId?: string }
}) {
  const user = await getEffectiveUser()
  if (!user) redirect('/auth/signin')

  const storyCoverage = await getStoryCoverage(params.storyId)
  if (!storyCoverage) redirect(`/zones/${params.zoneId}`)
  const { sources } = storyCoverage

  // Defaults to the main article's own source (position 0) when no sourceId is
  // given — e.g. a bare link straight to /read.
  const requestedId = searchParams.sourceId ?? sources[0]?.id
  const currentIndex = sources.findIndex((s) => s.id === requestedId)
  const source = currentIndex >= 0 ? sources[currentIndex] : sources[0]
  if (!source) redirect(`/zones/${params.zoneId}/story/${params.storyId}`)

  const resolvedIndex = currentIndex >= 0 ? currentIndex : 0
  const prevSource = resolvedIndex > 0 ? sources[resolvedIndex - 1] : null
  const nextSource = resolvedIndex < sources.length - 1 ? sources[resolvedIndex + 1] : null

  const supabase = createServerSupabase()
  const [saveData, canEmbed] = await Promise.all([
    supabase.from('user_saves').select('id').eq('user_id', user.id).eq('article_id', source.id).maybeSingle(),
    checkEmbeddable(source.sourceUrl),
  ])

  return (
    <ReadClient
      source={source}
      isSaved={saveData.data !== null}
      canEmbed={canEmbed}
      position={resolvedIndex + 1}
      total={sources.length}
      prevSourceId={prevSource?.id ?? null}
      nextSourceId={nextSource?.id ?? null}
      mainStoryId={params.storyId}
      zoneId={params.zoneId}
    />
  )
}
