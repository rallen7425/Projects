import { createServerSupabase } from '@/lib/supabase/server'
import type { ZoneType } from '@/types'

export async function getArticlesByZone(zoneType: ZoneType, limit = 15, days = 14) {
  const supabase = createServerSupabase()
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .contains('zone_types', [zoneType])
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

// zoneTypes, when passed, scopes the cross-zone pool to the user's own active
// zones — without it, the pipeline's other zone runners (e.g. Finance,
// Entertainment, Work) keep generating content for zone types the user may
// not have an active zone for at all, and that content would otherwise leak
// into Home/Summary's Breaking/Top Stories despite no matching zone existing.
export async function getTopArticles(limit = 20, zoneTypes?: ZoneType[]) {
  const supabase = createServerSupabase()
  // Only show articles from the last 72 hours so stale high-urgency articles
  // don't permanently dominate the Today page
  const cutoff = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString()
  let query = supabase
    .from('articles')
    .select('*')
    .gte('published_at', cutoff)
  if (zoneTypes && zoneTypes.length > 0) query = query.overlaps('zone_types', zoneTypes)

  const { data, error } = await query
    .order('urgency_score', { ascending: false })
    .order('published_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data ?? []
}

export async function searchArticlesByTopic(topic: string, limit = 10, days = 30, zoneType?: ZoneType) {
  const supabase = createServerSupabase()
  const escaped = topic.replace(/[%_]/g, '\\$&')
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
  let query = supabase
    .from('articles')
    .select('*')
    .or(`headline.ilike.%${escaped}%,summary.ilike.%${escaped}%`)
    .gte('published_at', cutoff)
  if (zoneType) query = query.contains('zone_types', [zoneType])

  const { data, error } = await query
    .order('published_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('searchArticlesByTopic error:', error.message)
    return []
  }
  return data ?? []
}

// Game updates/recaps specific to a set of team names (Sports Zone "Updates" section) —
// searches each team name independently, merges, dedupes by id, and caps the total.
export async function searchTeamUpdates(teamNames: string[], perTeamLimit = 6, days = 14, cap = 10) {
  const results = await Promise.all(
    teamNames.map((name) => searchArticlesByTopic(name, perTeamLimit, days, 'sports'))
  )

  const seen = new Set<string>()
  const merged: Awaited<ReturnType<typeof searchArticlesByTopic>> = []
  for (const list of results) {
    for (const row of list) {
      if (seen.has(row.id)) continue
      seen.add(row.id)
      merged.push(row)
    }
  }

  merged.sort((a, b) => new Date(b.published_at ?? 0).getTime() - new Date(a.published_at ?? 0).getTime())
  return merged.slice(0, cap)
}
