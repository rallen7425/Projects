// Free, unauthenticated Open-Meteo air-quality API — used at request time for the
// Wellness Zone's Air Quality card, not part of the batched content pipeline. Same
// live-fetch pattern as ESPN scores (lib/scores/espn.ts) and NWS weather
// (lib/weather/nws.ts): fetched fresh per page load, never written to the
// articles table. Confirmed live (real North Andover coordinates) before wiring
// this in — no API key required, response shape matches what's used below.

import { withTtlCache } from '@/lib/cache/ttlCache'

export type AirQualityCardData = {
  city: string
  state: string
  aqi: number
  aqiLabel: string
  uvIndex: number
}

// Standard EPA US AQI bands.
function labelForAqi(aqi: number): string {
  if (aqi <= 50) return 'Good'
  if (aqi <= 100) return 'Moderate'
  if (aqi <= 150) return 'Unhealthy for Sensitive Groups'
  if (aqi <= 200) return 'Unhealthy'
  if (aqi <= 300) return 'Very Unhealthy'
  return 'Hazardous'
}

async function fetchAirQualityForCoords(lat: number, lng: number): Promise<{ aqi: number; uvIndex: number } | null> {
  return withTtlCache(`air-quality:${lat.toFixed(2)},${lng.toFixed(2)}`, 60_000, async () => {
    const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}&current=us_aqi,uv_index&timezone=auto`
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return null
    const json = await res.json()
    const aqi = json?.current?.us_aqi
    const uvIndex = json?.current?.uv_index
    if (typeof aqi !== 'number') return null
    return { aqi, uvIndex: typeof uvIndex === 'number' ? uvIndex : 0 }
  })
}

// One card for the user's home location — unlike Weather's per-area rows, Air
// Quality reads a single lat/lng straight off the user's Profile (Home Location),
// not LocalArea config, so there's only ever one row.
export async function getAirQualityForLocation(lat: number, lng: number, city: string, state: string): Promise<AirQualityCardData | null> {
  const reading = await fetchAirQualityForCoords(lat, lng).catch(() => null)
  if (!reading) return null
  return {
    city,
    state,
    aqi: reading.aqi,
    aqiLabel: labelForAqi(reading.aqi),
    uvIndex: reading.uvIndex,
  }
}
