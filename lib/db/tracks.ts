import { createServerSupabase } from '@/lib/supabase/server'

export async function getTrackedTopics(userId: string) {
  const supabase = createServerSupabase()
  const { data, error } = await supabase
    .from('user_tracks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function trackTopic(
  userId: string,
  topic: string,
  zoneId?: string,
  deadlineAt?: string
) {
  const supabase = createServerSupabase()
  const { error } = await supabase
    .from('user_tracks')
    .insert({
      user_id: userId,
      topic,
      zone_id: zoneId ?? null,
      deadline_at: deadlineAt ?? null,
    })

  if (error) throw error
}

export async function untrackTopic(id: string) {
  const supabase = createServerSupabase()
  const { error } = await supabase
    .from('user_tracks')
    .delete()
    .eq('id', id)

  if (error) throw error
}
