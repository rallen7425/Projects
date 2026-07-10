'use server'

import { createServerSupabase, getEffectiveUser } from './supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function addTrack(topic: string) {
  const user = await getEffectiveUser()
  if (!user) redirect('/auth/signin')

  const supabase = createServerSupabase()
  const { data, error } = await supabase
    .from('user_tracks')
    .insert({ user_id: user.id, topic, zone_id: null, deadline_at: null })
    .select()
    .single()

  if (error) {
    console.error('addTrack error:', error.message)
    return null
  }
  revalidatePath('/tracking')
  revalidatePath('/')
  return data
}

export async function removeTrack(id: string) {
  const user = await getEffectiveUser()
  if (!user) redirect('/auth/signin')

  const supabase = createServerSupabase()
  const { error } = await supabase.from('user_tracks').delete().eq('id', id).eq('user_id', user.id)
  if (error) throw new Error(error.message)
  revalidatePath('/tracking')
  revalidatePath('/')
}

export async function saveArticle(articleId: string) {
  const user = await getEffectiveUser()
  if (!user) redirect('/auth/signin')

  const supabase = createServerSupabase()
  const { error } = await supabase
    .from('user_saves')
    .insert({ user_id: user.id, article_id: articleId })

  return !error
}

export async function unsaveArticle(articleId: string) {
  const user = await getEffectiveUser()
  if (!user) redirect('/auth/signin')

  const supabase = createServerSupabase()
  await supabase.from('user_saves').delete().eq('user_id', user.id).eq('article_id', articleId)
}
