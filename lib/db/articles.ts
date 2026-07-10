import { createServerSupabase } from '@/lib/supabase/server'
import type { ZoneType } from '@/types'

export async function getArticlesByZone(zoneType: ZoneType, limit = 15, days = 14) {
  const supabase = createServerSupabase()
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('zone_type', zoneType)
    .gte('published_at', cutoff)
    .order('urgency_score', { ascending: false })
    .order('published_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data ?? []
}

export async function getArticleById(id: string) {
  const supabase = createServerSupabase()
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function getTopArticles(limit = 20) {
  const supabase = createServerSupabase()
  // Only show articles from the last 72 hours so stale high-urgency articles
  // don't permanently dominate the Today page
  const cutoff = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString()
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .gte('published_at', cutoff)
    .order('urgency_score', { ascending: false })
    .order('published_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data ?? []
}

export async function searchArticlesByTopic(topic: string, limit = 10, days = 30) {
  const supabase = createServerSupabase()
  const escaped = topic.replace(/[%_]/g, '\\$&')
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .or(`headline.ilike.%${escaped}%,summary.ilike.%${escaped}%`)
    .gte('published_at', cutoff)
    .order('published_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('searchArticlesByTopic error:', error.message)
    return []
  }
  return data ?? []
}
