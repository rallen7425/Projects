import { createHash } from 'crypto'
import type { RawArticle } from '../types'

function makeExternalId(sourceUrl: string, headline: string): string {
  return createHash('sha256').update(sourceUrl + headline).digest('hex').slice(0, 32)
}

async function zipToLatLng(zip: string): Promise<{ lat: number; lng: number } | null> {
  const res = await fetch(`https://api.zippopotam.us/us/${zip}`)
  if (!res.ok) return null
  const json = await res.json()
  const place = json?.places?.[0]
  if (!place) return null
  return { lat: parseFloat(place.latitude), lng: parseFloat(place.longitude) }
}

export async function fetchWeather(zip: string): Promise<RawArticle[]> {
  const coords = await zipToLatLng(zip)
  if (!coords) {
    console.warn(`[weather] Could not geocode zip ${zip}`)
    return []
  }

  const pointRes = await fetch(
    `https://api.weather.gov/points/${coords.lat.toFixed(4)},${coords.lng.toFixed(4)}`,
    { headers: { 'User-Agent': 'Distilled News App (distilled-news.vercel.app)' } }
  )
  if (!pointRes.ok) {
    console.warn(`[weather] NWS points API error: ${pointRes.status}`)
    return []
  }
  const pointJson = await pointRes.json()
  const forecastUrl: string = pointJson?.properties?.forecast
  const city: string = pointJson?.properties?.relativeLocation?.properties?.city ?? 'your area'
  const state: string = pointJson?.properties?.relativeLocation?.properties?.state ?? ''

  if (!forecastUrl) return []

  const forecastRes = await fetch(forecastUrl, {
    headers: { 'User-Agent': 'Distilled News App (distilled-news.vercel.app)' }
  })
  if (!forecastRes.ok) return []
  const forecastJson = await forecastRes.json()

  const periods: Array<Record<string, unknown>> = forecastJson?.properties?.periods ?? []
  const current = periods[0]
  if (!current) return []

  const temp = current.temperature as number
  const unit = current.temperatureUnit as string
  const shortForecast = current.shortForecast as string
  const windSpeed = current.windSpeed as string
  const name = current.name as string

  const headline = `${city}${state ? ', ' + state : ''}: ${temp}°${unit} and ${shortForecast}`
  const bodySnippet = `Temperature: ${temp}°${unit}. Conditions: ${shortForecast}. Wind: ${windSpeed}. Period: ${name}.`
  const sourceUrl = `https://forecast.weather.gov/MapClick.php?CityName=${encodeURIComponent(city)}`

  return [{
    externalId: makeExternalId(sourceUrl, headline),
    headline,
    bodySnippet,
    sourceUrl,
    sourceName: 'National Weather Service',
    publishedAt: new Date().toISOString(),
    zoneType: 'local',
  }]
}
