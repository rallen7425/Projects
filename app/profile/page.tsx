import { getEffectiveUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProfileClient from './ProfileClient'
import { getUserZones } from '@/lib/db/zones'
import { getUserProfile, getUserLocations, toHomeLocation } from '@/lib/db/profile'
import { ZONE_TEMPLATES } from '@/lib/zone-templates'
import { ZONE_META, type ZoneType } from '@/types'
import type { TeamOfInterest } from '@/lib/scores/espn'

export const dynamic = 'force-dynamic'

// Profile is a reference view for the remaining zone editors — it doesn't
// duplicate the Sports/Work Customize sheets, just summarizes what's set and
// links to the zone's own detail page. Local isn't included here since its
// editor (location data) now lives directly on this page instead.
function summarizePersonalization(kind: 'teams' | 'industry', config: unknown): string {
  if (kind === 'teams') {
    const teams = (config as { teams?: TeamOfInterest[] } | null)?.teams ?? []
    return teams.length > 0 ? teams.map((t) => t.shortName).join(', ') : 'No teams selected yet'
  }
  const industry = (config as { industry?: string } | null)?.industry
  return industry || 'Not set yet'
}

export default async function ProfilePage() {
  const user = await getEffectiveUser()
  if (!user) redirect('/auth/signin')

  const [profile, locations, zones] = await Promise.all([
    getUserProfile(user.id),
    getUserLocations(user.id),
    getUserZones(user.id),
  ])

  const email = profile?.email ?? user.email ?? ''
  const home = toHomeLocation(profile)

  const personalizedZones = zones
    .filter((z) => z.type !== 'local')
    .map((z) => {
      const template = Object.values(ZONE_TEMPLATES).find((t) => t.type === z.type)
      if (!template?.personalization || template.personalization.kind === 'areas') return null
      const meta = ZONE_META[z.type as ZoneType]
      return {
        zoneId: z.id,
        color: meta.color,
        label: template.personalization.label,
        summary: summarizePersonalization(template.personalization.kind, z.config),
      }
    })
    .filter((z): z is NonNullable<typeof z> => z !== null)

  return <ProfileClient email={email} home={home} secondaries={locations} personalizedZones={personalizedZones} />
}
