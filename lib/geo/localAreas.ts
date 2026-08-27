// Derives a Local Zone's config.areas from the user's Profile location data
// (home location + up to 5 secondary locations) — the shared source of truth
// Zones read from, per the 2026-08-27 Profile rework. Replaces the old
// buildDefaultLocalAreas(zip), which derived a zone's own independent copy of
// this data once at zone-creation time with no link back to a user profile.

import { regionForState } from './regions'
import type { HomeLocation, LocalArea, UserLocation } from '@/types'

export function buildLocalAreasFromProfile(home: HomeLocation, secondaries: UserLocation[]): LocalArea[] {
  const region = regionForState(home.stateAbbr)
  if (!region) throw new Error(`No region mapping for state ${home.stateAbbr}`)

  // metroArea is stored as "City, ST" (the label the user picked from the
  // disambiguation list) — the query wants just the city name, matching the
  // convention every other area's `query` already follows.
  const metroCity = home.metroArea.split(',')[0].trim()

  const areas: LocalArea[] = [
    {
      id: 'community-primary',
      kind: 'community',
      label: `${home.city}, ${home.stateAbbr}`,
      query: home.city,
      zip: home.zip,
    },
    {
      id: 'metro-primary',
      kind: 'metro',
      label: home.metroArea,
      query: metroCity,
    },
    {
      id: 'region-primary',
      kind: 'region',
      label: region,
      query: region,
    },
  ]

  secondaries.forEach((loc, i) => {
    areas.push({
      id: `community-secondary-${i + 1}`,
      kind: 'community',
      label: loc.label,
      query: loc.label.split(',')[0].trim(),
      zip: loc.zip,
    })
  })

  return areas
}
