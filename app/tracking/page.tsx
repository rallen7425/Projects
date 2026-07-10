export const dynamic = 'force-dynamic'

import { getEffectiveUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getTrackedTopics } from '@/lib/db/tracks'
import { searchArticlesByTopic } from '@/lib/db/articles'
import { toArticleDisplay } from '@/lib/articleUtils'
import TrackingClient from './TrackingClient'

export default async function TrackingPage() {
  const user = await getEffectiveUser()
  if (!user) redirect('/auth/signin')

  const topics = await getTrackedTopics(user.id)

  const topicsWithArticles = await Promise.all(
    topics.map(async (t) => {
      try {
        const articles = await searchArticlesByTopic(t.topic, 5)
        return { topic: t, articles: articles.map(toArticleDisplay) }
      } catch {
        return { topic: t, articles: [] }
      }
    })
  )

  return <TrackingClient topicsWithArticles={topicsWithArticles} userId={user.id} />
}
