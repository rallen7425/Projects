export const dynamic = 'force-dynamic'

import { getEffectiveUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getAllUserZones } from '@/lib/db/zones'
import { ZONE_TEMPLATES } from '@/lib/zone-templates'
import ZoneManageClient from './ZoneManageClient'

export default async function ZoneManagePage() {
  const user = await getEffectiveUser()
  if (!user) redirect('/auth/signin')

  const zones = await getAllUserZones(user.id)

  // Every template, not just ones the user hasn't added — the page shows one
  // row per default zone type, on/off via a single toggle, so there's no
  // separate "Add Zone" step.
  const templates = Object.entries(ZONE_TEMPLATES)
    .map(([key, template]) => ({ key, ...template }))
    .sort((a, b) => a.position - b.position)

  return <ZoneManageClient zones={zones} templates={templates} />
}
