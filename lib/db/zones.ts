import { createServerSupabase } from '@/lib/supabase/server'
import { ZONE_TEMPLATES } from '@/lib/zone-templates'
import { getUserProfile, getUserLocations, toHomeLocation } from '@/lib/db/profile'
import { buildLocalAreasFromProfile } from '@/lib/geo/localAreas'
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

// Every zone (enabled AND disabled) — used by the Zone Management page, which
// needs to show disabled zones too so they can be re-enabled or deleted.
// getUserZones' enabled-only filter is intentional for every other caller
// (Home/Summary/Zones hub should never render a disabled zone), so this is a
// separate function rather than an optional flag on that one.
export async function getAllUserZones(userId: string) {
  const supabase = createServerSupabase()
  const { data, error } = await supabase
    .from('zones')
    .select('*')
    .eq('user_id', userId)
    .order('position', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function getZoneById(zoneId: string, userId: string) {
  const supabase = createServerSupabase()
  const { data, error } = await supabase
    .from('zones')
    .select('*')
    .eq('id', zoneId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  return data
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

// Every template maps 1:1 to a ZoneType, and the whole app (lib/zonePreview.ts,
// ZoneDetailClient's Sports/Local branches, the hub) assumes one zone per type
// per user — so this rejects a true duplicate and instead re-enables a matching
// disabled zone if one exists, rather than ever inserting a second row of the
// same type.
export async function createZoneFromTemplate(userId: string, templateKey: string, config?: Json) {
  const template = ZONE_TEMPLATES[templateKey]
  if (!template) throw new Error(`Unknown zone template: ${templateKey}`)

  const supabase = createServerSupabase()

  const { data: existing, error: existingError } = await supabase
    .from('zones')
    .select('*')
    .eq('user_id', userId)
    .eq('type', template.type)
    .maybeSingle()
  if (existingError) throw existingError

  if (existing) {
    if (existing.enabled) throw new Error(`You already have a ${template.label}`)
    const { error } = await supabase
      .from('zones')
      .update({ enabled: true, config: config ?? existing.config })
      .eq('id', existing.id)
    if (error) throw error
    return existing.id
  }

  const { data: positionRows } = await supabase
    .from('zones')
    .select('position')
    .eq('user_id', userId)
    .order('position', { ascending: false })
    .limit(1)

  const nextPosition = positionRows?.[0] ? positionRows[0].position + 1 : template.position

  const { data, error } = await supabase
    .from('zones')
    .insert({
      user_id: userId,
      type: template.type,
      template_id: templateKey,
      config: config ?? {},
      position: nextPosition,
      enabled: true,
    })
    .select('id')
    .single()

  if (error) throw error
  return data.id
}

export async function deleteZone(zoneId: string, userId: string) {
  const supabase = createServerSupabase()
  const { error } = await supabase
    .from('zones')
    .delete()
    .eq('id', zoneId)
    .eq('user_id', userId)

  if (error) throw error
}

export async function reorderZones(userId: string, orderedZoneIds: string[]) {
  const supabase = createServerSupabase()
  await Promise.all(
    orderedZoneIds.map((id, position) =>
      supabase.from('zones').update({ position }).eq('id', id).eq('user_id', userId)
    )
  )
}

// Rebuilds every enabled Local Zone this user has from their current Profile
// location data (home + secondary locations) and writes it into config.areas.
// Called after any Profile location mutation so an existing Local Zone
// reflects the change immediately — this is the actual implementation of
// "the zone shares the zip code and location information" from the user.
export async function syncLocalZoneAreas(userId: string) {
  const [profile, secondaries] = await Promise.all([
    getUserProfile(userId),
    getUserLocations(userId),
  ])
  const home = toHomeLocation(profile)
  if (!home) return // no complete home location yet — nothing to sync

  const areas = buildLocalAreasFromProfile(home, secondaries)

  const supabase = createServerSupabase()
  const { data: localZones, error } = await supabase
    .from('zones')
    .select('id, config')
    .eq('user_id', userId)
    .eq('type', 'local')
    .eq('enabled', true)
  if (error) throw error

  await Promise.all(
    (localZones ?? []).map((zone) => {
      const existingConfig = (zone.config as Record<string, unknown> | null) ?? {}
      return updateZoneConfig(zone.id, { ...existingConfig, areas } as unknown as Json)
    })
  )
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
