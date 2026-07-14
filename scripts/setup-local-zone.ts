// One-off script to configure the test profile's Local Zone areas —
// same pattern as the earlier one-off script that wrote Sports' `teams`
// config. Run once via: npx tsx scripts/setup-local-zone.ts
import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

import { createServiceClient } from '@/lib/supabase/service'
import { geocodeZip } from '@/lib/geo/zip'
import { nearestMetro } from '@/lib/geo/metros'
import { regionForState } from '@/lib/geo/regions'
import type { LocalArea } from '@/types'

const ZIP = process.argv[2] ?? '01845'
const USER_ID = process.env.DEV_BYPASS_USER_ID

async function main() {
  if (!USER_ID) throw new Error('DEV_BYPASS_USER_ID not set')

  const location = await geocodeZip(ZIP)
  if (!location) throw new Error(`Could not geocode zip ${ZIP}`)

  const metro = nearestMetro(location.lat, location.lng)
  if (!metro) throw new Error('No metro found')

  const region = regionForState(location.stateAbbr)
  if (!region) throw new Error(`No region mapping for state ${location.stateAbbr}`)

  const areas: LocalArea[] = [
    {
      id: 'community-primary',
      kind: 'community',
      label: `${location.city}, ${location.stateAbbr}`,
      query: location.city,
      zip: ZIP,
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

  console.log('Resolved areas:', JSON.stringify(areas, null, 2))

  const supabase = createServiceClient()
  const { data: zone, error: findError } = await supabase
    .from('zones')
    .select('id')
    .eq('user_id', USER_ID)
    .eq('type', 'local')
    .eq('enabled', true)
    .maybeSingle()

  if (findError) throw findError
  if (!zone) throw new Error('No local zone found for this user')

  const { error: updateError } = await supabase
    .from('zones')
    .update({ config: { areas } })
    .eq('id', zone.id)

  if (updateError) throw updateError

  console.log(`\nWrote areas to local zone ${zone.id}`)
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err)
  process.exit(1)
})
