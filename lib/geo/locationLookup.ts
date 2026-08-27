// Two-step "enter a zip → pick your home city" lookup used by the Profile
// page's Home Location and Secondary Location editors. Wraps the existing
// zip geocode + nearest-metros helpers into one call so the UI always gets a
// short list of metro candidates to disambiguate from, rather than a single
// silently-auto-assigned metro.

import { geocodeZip } from './zip'
import { nearestMetros } from './metros'
import type { MetroOption } from '@/types'

export type ZipLookupResult = {
  zip: string
  city: string
  stateAbbr: string
  lat: number
  lng: number
  metroOptions: MetroOption[]
}

export async function lookupZip(zip: string): Promise<ZipLookupResult> {
  const location = await geocodeZip(zip)
  if (!location) throw new Error(`Could not find a location for zip code ${zip}`)

  const metroOptions: MetroOption[] = nearestMetros(location.lat, location.lng, 3).map((m) => ({
    label: `${m.name}, ${m.state}`,
    distanceMi: Math.round(m.distanceMi),
  }))

  return {
    zip,
    city: location.city,
    stateAbbr: location.stateAbbr,
    lat: location.lat,
    lng: location.lng,
    metroOptions,
  }
}
