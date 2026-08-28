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
  syncLocalZoneAreas,
} from './db/zones'
import { getUserProfile, getUserLocations, toHomeLocation } from './db/profile'
import { buildLocalAreasFromProfile } from './geo/localAreas'
import { geocodeZip } from './geo/zip'
import { nearestMetro } from './geo/metros'
import { lookupZip } from './geo/locationLookup'
import { getDefaultTeamsForMetro } from './scores/metroTeams'
import type { Json } from '@/types/supabase'
import type { ZoneType } from '@/types'

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
// zones.config shape each zone type reads (Work's plain `industry` string;
// Sports' `teams`, seeded from a zip). Local no longer accepts a raw zip here
// at all — its areas come entirely from the user's Profile home location
// (see "Profile locations" below), since that's now the shared source of
// truth Zones read from rather than each zone owning its own copy.
export async function addZone(templateKey: string, setupInput?: { zip?: string; industry?: string }) {
  const user = await getEffectiveUser()
  if (!user) redirect('/auth/signin')

  let config: Json = {}
  if (templateKey === 'local') {
    const profile = await getUserProfile(user.id)
    const home = toHomeLocation(profile)
    if (!home) throw new Error('Set up your home location in Profile before turning on the Local Zone')
    const secondaries = await getUserLocations(user.id)
    const areas = buildLocalAreasFromProfile(home, secondaries)
    config = { areas } as unknown as Json
  } else if (templateKey === 'sports') {
    // Prefer the Profile's home location if one is already set (skips the
    // zip prompt entirely); otherwise fall back to the inline zip this
    // template's setup prompt still collects, same as before.
    const profile = await getUserProfile(user.id)
    const home = toHomeLocation(profile)
    const location = home ?? (setupInput?.zip ? await geocodeZip(setupInput.zip) : null)
    if (!location) throw new Error('Zip code is required for the Sports Zone')
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

// Generic zone-config writer used by the remaining per-zone customization
// editors (Sports' Teams of Interest, Work's Industry) — Local's areas moved
// to the Profile-driven path above and no longer go through this.
export async function updateZoneCustomization(zoneId: string, config: Json) {
  const user = await getEffectiveUser()
  if (!user) redirect('/auth/signin')

  const zone = await getZoneById(zoneId, user.id)
  if (!zone) throw new Error('Zone not found')

  await updateZoneConfig(zoneId, config)
  revalidateZoneSurfaces()
}

// ── Profile locations ──────────────────────────────────────────────────────
// Location data (home + up to 5 secondary locations) now lives on the user's
// Profile rather than inside any one zone's config — Local Zone's areas are
// derived from it (see syncLocalZoneAreas) rather than typed directly into a
// zone's own Customize sheet. Superseded the old addLocalArea/removeLocalArea
// zone-scoped actions.

function revalidateProfileSurfaces() {
  revalidatePath('/profile')
  revalidateZoneSurfaces()
}

// Read-only zip → city/state + up to 3 metro-city candidates, for the "which
// city do you consider home?" step. Used identically by both the Home
// Location and Secondary Location editors.
export async function lookupZipForProfile(zip: string) {
  const user = await getEffectiveUser()
  if (!user) redirect('/auth/signin')
  return lookupZip(zip)
}

type LocationInput = {
  zip: string
  city: string
  stateAbbr: string
  lat: number
  lng: number
  // Required in practice for the Home location (Local Zone's metro tier needs
  // one) but omitted entirely for secondary locations, which are just a
  // town/zip per explicit product direction — no metro/region attached.
  metroArea?: string
  schoolDistrict?: string
  privateSchools?: string
  colleges?: string
}

export async function saveHomeLocation(input: LocationInput) {
  const user = await getEffectiveUser()
  if (!user) redirect('/auth/signin')

  const supabase = createServerSupabase()
  const { error } = await supabase
    .from('users')
    .update({
      zip_code: input.zip,
      city: input.city,
      state_abbr: input.stateAbbr,
      lat: input.lat,
      lng: input.lng,
      metro_area: input.metroArea ?? null,
      school_district: input.schoolDistrict ?? null,
      private_schools: input.privateSchools ?? null,
      colleges: input.colleges ?? null,
    })
    .eq('id', user.id)
  if (error) throw error

  await syncLocalZoneAreas(user.id)
  revalidateProfileSurfaces()
}

export async function updateHomeSchoolInfo(info: { schoolDistrict?: string; privateSchools?: string; colleges?: string }) {
  const user = await getEffectiveUser()
  if (!user) redirect('/auth/signin')

  const supabase = createServerSupabase()
  const { error } = await supabase
    .from('users')
    .update({
      school_district: info.schoolDistrict ?? null,
      private_schools: info.privateSchools ?? null,
      colleges: info.colleges ?? null,
    })
    .eq('id', user.id)
  if (error) throw error

  revalidateProfileSurfaces()
}

export async function addSecondaryLocation(input: LocationInput) {
  const user = await getEffectiveUser()
  if (!user) redirect('/auth/signin')

  const supabase = createServerSupabase()
  const { count, error: countError } = await supabase
    .from('user_locations')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
  if (countError) throw countError
  if ((count ?? 0) >= 5) throw new Error('You can add up to 5 secondary locations')

  const { error } = await supabase.from('user_locations').insert({
    user_id: user.id,
    zip_code: input.zip,
    label: `${input.city}, ${input.stateAbbr}`,
    lat: input.lat,
    lng: input.lng,
    metro_area: input.metroArea ?? null,
    school_district: input.schoolDistrict ?? null,
    private_schools: input.privateSchools ?? null,
    colleges: input.colleges ?? null,
    position: count ?? 0,
  })
  if (error) throw error

  await syncLocalZoneAreas(user.id)
  revalidateProfileSurfaces()
}

export async function removeSecondaryLocation(id: string) {
  const user = await getEffectiveUser()
  if (!user) redirect('/auth/signin')

  const supabase = createServerSupabase()
  const { error } = await supabase.from('user_locations').delete().eq('id', id).eq('user_id', user.id)
  if (error) throw error

  await syncLocalZoneAreas(user.id)
  revalidateProfileSurfaces()
}

export async function updateSecondaryLocationSchoolInfo(
  id: string,
  info: { schoolDistrict?: string; privateSchools?: string; colleges?: string }
) {
  const user = await getEffectiveUser()
  if (!user) redirect('/auth/signin')

  const supabase = createServerSupabase()
  const { error } = await supabase
    .from('user_locations')
    .update({
      school_district: info.schoolDistrict ?? null,
      private_schools: info.privateSchools ?? null,
      colleges: info.colleges ?? null,
    })
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) throw error

  revalidateProfileSurfaces()
}
