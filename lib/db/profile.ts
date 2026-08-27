import { createServerSupabase } from '@/lib/supabase/server'
import type { HomeLocation, UserLocation } from '@/types'

export async function getUserProfile(userId: string) {
  const supabase = createServerSupabase()
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function getUserLocations(userId: string): Promise<UserLocation[]> {
  const supabase = createServerSupabase()
  const { data, error } = await supabase
    .from('user_locations')
    .select('*')
    .eq('user_id', userId)
    .order('position', { ascending: true })

  if (error) throw error
  return (data ?? []).map((row) => ({
    id: row.id,
    zip: row.zip_code,
    label: row.label,
    lat: row.lat,
    lng: row.lng,
    metroArea: row.metro_area,
    schoolDistrict: row.school_district ?? undefined,
    privateSchools: row.private_schools ?? undefined,
    colleges: row.colleges ?? undefined,
  }))
}

// A user's home location is only "complete" once every field
// buildLocalAreasFromProfile needs is present — earlier signups may have a
// stray zip_code with nothing else set, which should be treated the same as
// no home location at all.
export function toHomeLocation(profile: {
  zip_code: string | null
  city: string | null
  state_abbr: string | null
  lat: number | null
  lng: number | null
  metro_area: string | null
  school_district: string | null
  private_schools: string | null
  colleges: string | null
} | null): HomeLocation | null {
  if (!profile?.zip_code || !profile.city || !profile.state_abbr || profile.lat == null || profile.lng == null || !profile.metro_area) {
    return null
  }
  return {
    zip: profile.zip_code,
    city: profile.city,
    stateAbbr: profile.state_abbr,
    lat: profile.lat,
    lng: profile.lng,
    metroArea: profile.metro_area,
    schoolDistrict: profile.school_district ?? undefined,
    privateSchools: profile.private_schools ?? undefined,
    colleges: profile.colleges ?? undefined,
  }
}
