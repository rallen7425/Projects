import { createServerSupabase, getEffectiveUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getArticleById } from '@/lib/db/articles'
import { toArticleDisplay } from '@/lib/articleUtils'
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
    if (match && !match[1].includes('*')) return false

    return true
  } catch {
    // Can't verify — fail safe to the interstitial rather than risk a blank frame.
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
  searchParams: { url?: string; name?: string }
}) {
  const user = await getEffectiveUser()
  if (!user) redirect('/auth/signin')

  const url = searchParams.url
  if (!url) redirect(`/zones/${params.zoneId}/story/${params.storyId}`)

  const article = await getArticleById(params.storyId)
  if (!article) redirect(`/zones/${params.zoneId}`)

  const supabase = createServerSupabase()
  const [saveData, canEmbed] = await Promise.all([
    supabase.from('user_saves').select('id').eq('user_id', user.id).eq('article_id', article.id).maybeSingle(),
    checkEmbeddable(url),
  ])

  return (
    <ReadClient
      article={toArticleDisplay(article)}
      isSaved={saveData.data !== null}
      url={url}
      sourceName={searchParams.name ?? 'Source'}
      canEmbed={canEmbed}
    />
  )
}
