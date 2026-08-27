// Free, unauthenticated NWS weather API — used at request time for the Local
// Zone's Weather Card, not part of the batched content pipeline. Same
// live-fetch pattern already used for Sports Zone scores (lib/scores/espn.ts):
// fetched fresh per page load, never written to the articles table.

import { geocodeZip } from '@/lib/geo/zip'
import { withTtlCache } from '@/lib/cache/ttlCache'
import type { LocalArea } from '@/types'

export type WeatherCard = {
  area: LocalArea
  city: string
  state: string
  temp: number
  unit: string
  shortForecast: string
  windSpeed: string
  periodName: string
  sourceUrl: string
}

const NWS_HEADERS = { 'User-Agent': 'Distilled News App (distilled-news.vercel.app)' }

// The 12-hour forecast periods endpoint (used below for shortForecast/windSpeed) is a
// forward-looking forecast, not a live reading — its first period is just whichever
// half-day window is current, so outside the daytime window periods[0] is "Tonight"'s
// forecast LOW, not the actual temperature right now. Confirmed live: at 7:52pm the
// forecast endpoint's periods[0] read 69°F ("Tonight"), while the nearest station's real
// observation read 75°F. This fetches the actual live reading from the nearest station.
async function fetchLiveTemp(observationStationsUrl: string | undefined): Promise<{ temp: number; shortForecast: string } | null> {
  if (!observationStationsUrl) return null
  try {
    const stationsRes = await fetch(observationStationsUrl, { headers: NWS_HEADERS, cache: 'no-store' })
    if (!stationsRes.ok) return null
    const stationsJson = await stationsRes.json()
    const stationId = stationsJson?.features?.[0]?.properties?.stationIdentifier
    if (!stationId) return null

    const obsRes = await fetch(`https://api.weather.gov/stations/${stationId}/observations/latest`, {
      headers: NWS_HEADERS,
      cache: 'no-store',
    })
    if (!obsRes.ok) return null
    const obsJson = await obsRes.json()
    const tempC = obsJson?.properties?.temperature?.value
    if (typeof tempC !== 'number') return null

    return {
      temp: Math.round(tempC * 9 / 5 + 32),
      shortForecast: obsJson?.properties?.textDescription ?? '',
    }
  } catch {
    return null
  }
}

async function fetchWeatherForZip(area: LocalArea, zip: string): Promise<WeatherCard | null> {
  // Same duplication as ESPN scores (lib/scores/espn.ts) — the Zones hub and
  // the Local Zone's own detail page both fetch this for the same zip within
  // seconds of each other during normal navigation.
  return withTtlCache(`nws-weather:${zip}`, 60_000, async () => {
    const coords = await geocodeZip(zip)
    if (!coords) return null

    const pointRes = await fetch(
      `https://api.weather.gov/points/${coords.lat.toFixed(4)},${coords.lng.toFixed(4)}`,
      { headers: NWS_HEADERS, cache: 'no-store' }
    )
    if (!pointRes.ok) return null
    const pointJson = await pointRes.json()
    const forecastUrl: string = pointJson?.properties?.forecast
    const observationStationsUrl: string | undefined = pointJson?.properties?.observationStations
    const city: string = pointJson?.properties?.relativeLocation?.properties?.city ?? coords.city
    const state: string = pointJson?.properties?.relativeLocation?.properties?.state ?? coords.stateAbbr
    if (!forecastUrl) return null

    const [forecastRes, liveTemp] = await Promise.all([
      fetch(forecastUrl, { headers: NWS_HEADERS, cache: 'no-store' }),
      fetchLiveTemp(observationStationsUrl),
    ])
    if (!forecastRes.ok) return null
    const forecastJson = await forecastRes.json()

    const periods: Array<Record<string, unknown>> = forecastJson?.properties?.periods ?? []
    const current = periods[0]
    if (!current) return null

    return {
      area,
      city,
      state,
      // Prefer the real live station reading; fall back to the forecast period's
      // temperature (today's prior behavior) only if the observation fetch fails.
      temp: liveTemp?.temp ?? (current.temperature as number),
      unit: current.temperatureUnit as string,
      shortForecast: liveTemp?.shortForecast || (current.shortForecast as string),
      windSpeed: current.windSpeed as string,
      periodName: current.name as string,
      sourceUrl: `https://forecast.weather.gov/MapClick.php?CityName=${encodeURIComponent(city)}`,
    }
  })
}

// One card per community-kind area that has a zip — mirrors getScoresForTeams'
// one-card-per-team shape. Areas without a zip (metro/region tiers) are skipped.
export async function getWeatherForAreas(areas: LocalArea[]): Promise<WeatherCard[]> {
  const withZip = areas.filter((a) => a.kind === 'community' && a.zip)
  const results = await Promise.all(
    withZip.map((a) => fetchWeatherForZip(a, a.zip!).catch(() => null))
  )
  return results.filter((r): r is WeatherCard => r !== null)
}
