// Derives a Local Zone's 3 default areas (community/metro/region) from a zip
// code — the same logic scripts/setup-local-zone.ts already runs by hand,
// extracted here so the Add Zone flow (lib/actions.ts) can do it inline at
// zone-creation time instead of requiring a separate manual step.

import { geocodeZip } from './zip'
import { nearestMetro } from './metros'
import { regionForState } from './regions'
import type { LocalArea } from '@/types'

export async function buildDefaultLocalAreas(zip: string): Promise<LocalArea[]> {
  const location = await geocodeZip(zip)
  if (!location) throw new Error(`Could not find a location for zip code ${zip}`)

  const metro = nearestMetro(location.lat, location.lng)
  if (!metro) throw new Error('No nearby metro area found')

  const region = regionForState(location.stateAbbr)
  if (!region) throw new Error(`No region mapping for state ${location.stateAbbr}`)

  return [
    {
      id: 'community-primary',
      kind: 'community',
      label: `${location.city}, ${location.stateAbbr}`,
      query: location.city,
      zip,
    },
    {
      id: 'metro-primary',
      kind: 'metro',
      label: `${metro.name}, ${metro.state}`,
      query: metro.name,
    },
    {
      id: 'region-primary',
      kind: 'region',
      label: region,
      query: region,
    },
  ]
}
