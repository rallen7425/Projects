// Free, unauthenticated NWS weather API — used at request time for the Local
// Zone's Weather Card, not part of the batched content pipeline. Same
// live-fetch pattern already used for Sports Zone scores (lib/scores/espn.ts):
// fetched fresh per page load, never written to the articles table.

import { geocodeZip } from '@/lib/geo/zip'
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

async function fetchWeatherForZip(area: LocalArea, zip: string): Promise<WeatherCard | null> {
  const coords = await geocodeZip(zip)
  if (!coords) return null

  const pointRes = await fetch(
    `https://api.weather.gov/points/${coords.lat.toFixed(4)},${coords.lng.toFixed(4)}`,
    { headers: { 'User-Agent': 'Distilled News App (distilled-news.vercel.app)' }, cache: 'no-store' }
  )
  if (!pointRes.ok) return null
  const pointJson = await pointRes.json()
  const forecastUrl: string = pointJson?.properties?.forecast
  const city: string = pointJson?.properties?.relativeLocation?.properties?.city ?? coords.city
  const state: string = pointJson?.properties?.relativeLocation?.properties?.state ?? coords.stateAbbr
  if (!forecastUrl) return null

  const forecastRes = await fetch(forecastUrl, {
    headers: { 'User-Agent': 'Distilled News App (distilled-news.vercel.app)' },
    cache: 'no-store',
  })
  if (!forecastRes.ok) return null
  const forecastJson = await forecastRes.json()

  const periods: Array<Record<string, unknown>> = forecastJson?.properties?.periods ?? []
  const current = periods[0]
  if (!current) return null

  return {
    area,
    city,
    state,
    temp: current.temperature as number,
    unit: current.temperatureUnit as string,
    shortForecast: current.shortForecast as string,
    windSpeed: current.windSpeed as string,
    periodName: current.name as string,
    sourceUrl: `https://forecast.weather.gov/MapClick.php?CityName=${encodeURIComponent(city)}`,
  }
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
