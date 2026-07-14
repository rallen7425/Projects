import { NextResponse } from 'next/server'
import { getEffectiveUser } from '@/lib/supabase/server'
import { getUserZones } from '@/lib/db/zones'
import { ZONE_META, type ZoneType } from '@/types'

// Lightweight zone list for the hamburger menu's "My Zones" sub-links —
// deliberately its own tiny route rather than threading zone data through
// the 9 different page trees that render <BottomNav>, several of which
// (Profile, Tracking, Saved) don't otherwise fetch zones at all.
export async function GET() {
  const user = await getEffectiveUser()
  if (!user) return NextResponse.json([], { status: 401 })

  const zones = await getUserZones(user.id).catch(() => [])
  const list = zones.map((z) => {
    const meta = ZONE_META[z.type as ZoneType]
    return { id: z.id, label: meta?.label ?? z.type, color: meta?.color ?? 'var(--text)' }
  })

  return NextResponse.json(list)
}
