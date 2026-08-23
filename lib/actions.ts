'use server'

import { createServerSupabase, getEffectiveUser } from './supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import {
  createZoneFromTemplate,
  deleteZone as deleteZoneRow,
  toggleZone,
  reorderZones,
  updateZoneConfig,
  getZoneById,
  getUserZones,
} from './db/zones'
import { buildDefaultLocalAreas } from './geo/localAreas'
import { geocodeZip } from './geo/zip'
import { nearestMetro } from './geo/metros'
import { getDefaultTeamsForMetro } from './scores/metroTeams'
import type { Json } from '@/types/supabase'
import type { LocalArea, ZoneType } from '@/types'

function revalidateZoneSurfaces() {
  revalidatePath('/')
  revalidatePath('/summary')
  revalidatePath('/zones')
  revalidatePath('/zones/manage')
}

function revalidateTrackingSurfaces() {
  revalidatePath('/tracking')
  revalidatePath('/')
  revalidatePath('/summary')
}

// TrackModal's zone chips work in ZoneType terms (they don't know a zone's
// row id), so every write path resolves the selected type to this user's
// actual zone row here. Resolves to null (untracked-zone, not an error) if
// the user has no zone of that type — e.g. a stale chip for a zone they
// disabled or never added.
async function resolveZoneId(userId: string, zoneType: ZoneType | null | undefined): Promise<string | null> {
  if (!zoneType) return null
  const zones = await getUserZones(userId)
  return zones.find((z) => z.type === zoneType)?.id ?? null
}

export async function addTrack(topic: string, zoneType?: ZoneType | null) {
  const user = await getEffectiveUser()
  if (!user) redirect('/auth/signin')

  const zoneId = await resolveZoneId(user.id, zoneType)

  const supabase = createServerSupabase()
  const { data, error } = await supabase
    .from('user_tracks')
    .insert({ user_id: user.id, topic, zone_id: zoneId, deadline_at: null })
    .select()
    .single()

  if (error) {
    console.error('addTrack error:', error.message)
    return null
  }
  revalidateTrackingSurfaces()
  return data
}

// Updates both the topic text and its zone association — the pencil-icon
// edit flow on /tracking reuses TrackModal in an "edit" mode rather than a
// separate form.
export async function updateTrack(id: string, topic: string, zoneType?: ZoneType | null) {
  const user = await getEffectiveUser()
  if (!user) redirect('/auth/signin')

  const zoneId = await resolveZoneId(user.id, zoneType)

  const supabase = createServerSupabase()
  const { data, error } = await supabase
    .from('user_tracks')
    .update({ topic, zone_id: zoneId })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidateTrackingSurfaces()
  return data
}

export async function removeTrack(id: string) {
  const user = await getEffectiveUser()
  if (!user) redirect('/auth/signin')

  const supabase = createServerSupabase()
  const { error } = await supabase.from('user_tracks').delete().eq('id', id).eq('user_id', user.id)
  if (error) throw new Error(error.message)
  revalidateTrackingSurfaces()
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

// setupInput carries whatever the Add Zone form collected for a template's
// requiresZip/requiresIndustry fields — translated here into the actual
// zones.config shape each zone type reads (Local's `areas`, geocoded from the
// zip inline rather than requiring a separate Customize step; Work's plain
// `industry` string).
export async function addZone(templateKey: string, setupInput?: { zip?: string; industry?: string }) {
  const user = await getEffectiveUser()
  if (!user) redirect('/auth/signin')

  let config: Json = {}
  if (templateKey === 'local') {
    if (!setupInput?.zip) throw new Error('Zip code is required for the Local Zone')
    const areas = await buildDefaultLocalAreas(setupInput.zip)
    config = { areas } as unknown as Json
  } else if (templateKey === 'sports') {
    if (!setupInput?.zip) throw new Error('Zip code is required for the Sports Zone')
    const location = await geocodeZip(setupInput.zip)
    if (!location) throw new Error(`Could not find a location for zip code ${setupInput.zip}`)
    const metro = nearestMetro(location.lat, location.lng)
    // No teams found for this metro (many smaller metros have none) — the zone
    // is still created, just empty; the Customize picker covers the rest.
    const teams = metro ? getDefaultTeamsForMetro(metro.name, metro.state) : []
    config = { teams } as unknown as Json
  } else if (templateKey === 'work') {
    if (!setupInput?.industry) throw new Error('Industry is required for the Work Zone')
    config = { industry: setupInput.industry }
  }

  const zoneId = await createZoneFromTemplate(user.id, templateKey, config)
  revalidateZoneSurfaces()
  return zoneId
}

export async function removeZone(zoneId: string) {
  const user = await getEffectiveUser()
  if (!user) redirect('/auth/signin')

  await deleteZoneRow(zoneId, user.id)
  revalidateZoneSurfaces()
}

export async function toggleZoneEnabled(zoneId: string, enabled: boolean) {
  const user = await getEffectiveUser()
  if (!user) redirect('/auth/signin')

  // toggleZone doesn't itself scope by user — verify ownership first.
  const zone = await getZoneById(zoneId, user.id)
  if (!zone) throw new Error('Zone not found')

  await toggleZone(zoneId, enabled)
  revalidateZoneSurfaces()
}

export async function reorderZonesAction(orderedZoneIds: string[]) {
  const user = await getEffectiveUser()
  if (!user) redirect('/auth/signin')

  await reorderZones(user.id, orderedZoneIds)
  revalidateZoneSurfaces()
}

// Generic zone-config writer used by every per-zone customization editor
// (Sports' Teams of Interest, Local's Areas, Work's Industry) — all three
// just write different shapes into the same zones.config jsonb column.
export async function updateZoneCustomization(zoneId: string, config: Json) {
  const user = await getEffectiveUser()
  if (!user) redirect('/auth/signin')

  const zone = await getZoneById(zoneId, user.id)
  if (!zone) throw new Error('Zone not found')

  await updateZoneConfig(zoneId, config)
  revalidateZoneSurfaces()
}

// Local Zone's 3 zip-derived defaults (community/metro/region) are set at
// creation time (see addZone above); this adds up to 3 additional
// community-kind areas on top — e.g. a vacation town, same precedent as the
// Wells, ME secondary area documented in CLAUDE.md.
export async function addLocalArea(zoneId: string, zip: string) {
  const user = await getEffectiveUser()
  if (!user) redirect('/auth/signin')

  const zone = await getZoneById(zoneId, user.id)
  if (!zone) throw new Error('Zone not found')

  const existingConfig = (zone.config as Record<string, unknown> | null) ?? {}
  const areas = (existingConfig.areas as LocalArea[] | undefined) ?? []
  const secondaryCount = areas.filter((a) => a.id.includes('secondary')).length
  if (secondaryCount >= 3) throw new Error('You can add up to 3 extra areas')

  const location = await geocodeZip(zip)
  if (!location) throw new Error(`Could not find a location for zip code ${zip}`)

  const newArea: LocalArea = {
    id: `community-secondary-${secondaryCount + 1}`,
    kind: 'community',
    label: `${location.city}, ${location.stateAbbr}`,
    query: location.city,
    zip,
  }

  await updateZoneConfig(zoneId, { ...existingConfig, areas: [...areas, newArea] } as unknown as Json)
  revalidateZoneSurfaces()
  return newArea
}

export async function removeLocalArea(zoneId: string, areaId: string) {
  const user = await getEffectiveUser()
  if (!user) redirect('/auth/signin')

  const zone = await getZoneById(zoneId, user.id)
  if (!zone) throw new Error('Zone not found')

  const existingConfig = (zone.config as Record<string, unknown> | null) ?? {}
  const areas = ((existingConfig.areas as LocalArea[] | undefined) ?? []).filter((a) => a.id !== areaId)

  await updateZoneConfig(zoneId, { ...existingConfig, areas } as unknown as Json)
  revalidateZoneSurfaces()
}
