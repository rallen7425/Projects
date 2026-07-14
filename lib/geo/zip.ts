// Free, no-key US zip geocoding — same endpoint already used by the weather
// pipeline (api.zippopotam.us), extracted here so weather, metro-lookup, and
// region-lookup all share one geocoding call instead of duplicating it.

export type ZipLocation = {
  lat: number
  lng: number
  city: string
  state: string
  stateAbbr: string
}

export async function geocodeZip(zip: string): Promise<ZipLocation | null> {
  const res = await fetch(`https://api.zippopotam.us/us/${zip}`)
  if (!res.ok) return null

  const json = await res.json()
  const place = json?.places?.[0]
  if (!place) return null

  return {
    lat: parseFloat(place.latitude),
    lng: parseFloat(place.longitude),
    city: place['place name'],
    state: place.state,
    stateAbbr: place['state abbreviation'],
  }
}
