// Curated list of major US metro areas for "nearest major city" lookup —
// static data + haversine distance, no external API call needed beyond the
// zip geocode already performed in lib/geo/zip.ts.

export type Metro = {
  name: string
  state: string
  lat: number
  lng: number
}

export const METROS: Metro[] = [
  { name: 'Boston', state: 'MA', lat: 42.3601, lng: -71.0589 },
  { name: 'New York', state: 'NY', lat: 40.7128, lng: -74.0060 },
  { name: 'Philadelphia', state: 'PA', lat: 39.9526, lng: -75.1652 },
  { name: 'Washington', state: 'DC', lat: 38.9072, lng: -77.0369 },
  { name: 'Baltimore', state: 'MD', lat: 39.2904, lng: -76.6122 },
  { name: 'Pittsburgh', state: 'PA', lat: 40.4406, lng: -79.9959 },
  { name: 'Buffalo', state: 'NY', lat: 42.8864, lng: -78.8784 },
  { name: 'Providence', state: 'RI', lat: 41.8240, lng: -71.4128 },
  { name: 'Hartford', state: 'CT', lat: 41.7658, lng: -72.6734 },
  { name: 'Portland', state: 'ME', lat: 43.6591, lng: -70.2568 },
  { name: 'Manchester', state: 'NH', lat: 42.9956, lng: -71.4548 },
  { name: 'Burlington', state: 'VT', lat: 44.4759, lng: -73.2121 },
  { name: 'Atlanta', state: 'GA', lat: 33.7490, lng: -84.3880 },
  { name: 'Miami', state: 'FL', lat: 25.7617, lng: -80.1918 },
  { name: 'Orlando', state: 'FL', lat: 28.5383, lng: -81.3792 },
  { name: 'Tampa', state: 'FL', lat: 27.9506, lng: -82.4572 },
  { name: 'Jacksonville', state: 'FL', lat: 30.3322, lng: -81.6557 },
  { name: 'Charlotte', state: 'NC', lat: 35.2271, lng: -80.8431 },
  { name: 'Raleigh', state: 'NC', lat: 35.7796, lng: -78.6382 },
  { name: 'Nashville', state: 'TN', lat: 36.1627, lng: -86.7816 },
  { name: 'Memphis', state: 'TN', lat: 35.1495, lng: -90.0490 },
  { name: 'New Orleans', state: 'LA', lat: 29.9511, lng: -90.0715 },
  { name: 'Birmingham', state: 'AL', lat: 33.5186, lng: -86.8104 },
  { name: 'Richmond', state: 'VA', lat: 37.5407, lng: -77.4360 },
  { name: 'Virginia Beach', state: 'VA', lat: 36.8529, lng: -75.9780 },
  { name: 'Chicago', state: 'IL', lat: 41.8781, lng: -87.6298 },
  { name: 'Detroit', state: 'MI', lat: 42.3314, lng: -83.0458 },
  { name: 'Cleveland', state: 'OH', lat: 41.4993, lng: -81.6944 },
  { name: 'Columbus', state: 'OH', lat: 39.9612, lng: -82.9988 },
  { name: 'Cincinnati', state: 'OH', lat: 39.1031, lng: -84.5120 },
  { name: 'Indianapolis', state: 'IN', lat: 39.7684, lng: -86.1581 },
  { name: 'Milwaukee', state: 'WI', lat: 43.0389, lng: -87.9065 },
  { name: 'Minneapolis', state: 'MN', lat: 44.9778, lng: -93.2650 },
  { name: 'St. Louis', state: 'MO', lat: 38.6270, lng: -90.1994 },
  { name: 'Kansas City', state: 'MO', lat: 39.0997, lng: -94.5786 },
  { name: 'Omaha', state: 'NE', lat: 41.2565, lng: -95.9345 },
  { name: 'Des Moines', state: 'IA', lat: 41.5868, lng: -93.6250 },
  { name: 'Dallas', state: 'TX', lat: 32.7767, lng: -96.7970 },
  { name: 'Houston', state: 'TX', lat: 29.7604, lng: -95.3698 },
  { name: 'San Antonio', state: 'TX', lat: 29.4241, lng: -98.4936 },
  { name: 'Austin', state: 'TX', lat: 30.2672, lng: -97.7431 },
  { name: 'Oklahoma City', state: 'OK', lat: 35.4676, lng: -97.5164 },
  { name: 'Denver', state: 'CO', lat: 39.7392, lng: -104.9903 },
  { name: 'Salt Lake City', state: 'UT', lat: 40.7608, lng: -111.8910 },
  { name: 'Phoenix', state: 'AZ', lat: 33.4484, lng: -112.0740 },
  { name: 'Tucson', state: 'AZ', lat: 32.2226, lng: -110.9747 },
  { name: 'Albuquerque', state: 'NM', lat: 35.0844, lng: -106.6504 },
  { name: 'Las Vegas', state: 'NV', lat: 36.1699, lng: -115.1398 },
  { name: 'Los Angeles', state: 'CA', lat: 34.0522, lng: -118.2437 },
  { name: 'San Diego', state: 'CA', lat: 32.7157, lng: -117.1611 },
  { name: 'San Francisco', state: 'CA', lat: 37.7749, lng: -122.4194 },
  { name: 'Sacramento', state: 'CA', lat: 38.5816, lng: -121.4944 },
  { name: 'San Jose', state: 'CA', lat: 37.3382, lng: -121.8863 },
  { name: 'Fresno', state: 'CA', lat: 36.7378, lng: -119.7871 },
  { name: 'Portland', state: 'OR', lat: 45.5152, lng: -122.6784 },
  { name: 'Seattle', state: 'WA', lat: 47.6062, lng: -122.3321 },
  { name: 'Boise', state: 'ID', lat: 43.6150, lng: -116.2023 },
  { name: 'Anchorage', state: 'AK', lat: 61.2181, lng: -149.9003 },
  { name: 'Honolulu', state: 'HI', lat: 21.3069, lng: -157.8583 },
]

function haversineMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.asin(Math.sqrt(a))
}

// Top N metros by distance, closest first — used for the "which city do you
// consider home?" disambiguation picker, so the user always chooses rather
// than having a single nearest metro auto-assigned silently.
export function nearestMetros(lat: number, lng: number, n = 3): (Metro & { distanceMi: number })[] {
  return METROS
    .map((metro) => ({ ...metro, distanceMi: haversineMiles(lat, lng, metro.lat, metro.lng) }))
    .sort((a, b) => a.distanceMi - b.distanceMi)
    .slice(0, n)
}

export function nearestMetro(lat: number, lng: number): Metro | null {
  return nearestMetros(lat, lng, 1)[0] ?? null
}
