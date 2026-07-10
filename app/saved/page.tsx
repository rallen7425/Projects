export const dynamic = 'force-dynamic'

import { getEffectiveUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getSavedArticles } from '@/lib/db/saves'
import { toArticleDisplay } from '@/lib/articleUtils'
import SavedClient from './SavedClient'

export default async function SavedPage() {
  const user = await getEffectiveUser()
  if (!user) redirect('/auth/signin')

  const saves = await getSavedArticles(user.id)

  const articles = saves
    .map((s) => (s as unknown as { articles: unknown }).articles)
    .filter(Boolean)
    .map((a) => toArticleDisplay(a as Parameters<typeof toArticleDisplay>[0]))

  return <SavedClient articles={articles} userId={user.id} />
}
