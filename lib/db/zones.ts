import { createServerSupabase } from '@/lib/supabase/server'
import type { Json } from '@/types/supabase'

export async function getUserZones(userId: string) {
  const supabase = createServerSupabase()
  const { data, error } = await supabase
    .from('zones')
    .select('*')
    .eq('user_id', userId)
    .eq('enabled', true)
    .order('position', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function updateZoneConfig(zoneId: string, config: Json) {
  const supabase = createServerSupabase()
  const { error } = await supabase
    .from('zones')
    .update({ config })
    .eq('id', zoneId)

  if (error) throw error
}

export async function toggleZone(zoneId: string, enabled: boolean) {
  const supabase = createServerSupabase()
  const { error } = await supabase
    .from('zones')
    .update({ enabled })
    .eq('id', zoneId)

  if (error) throw error
}

export async function getZoneQuicklook(zoneType: string) {
  const supabase = createServerSupabase()
  const { data, error } = await supabase
    .from('zone_quicklook')
    .select('*')
    .eq('zone_type', zoneType)
    .order('position', { ascending: true })

  if (error) throw error
  return data ?? []
}
