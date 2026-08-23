import { createServerSupabase, getEffectiveUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppHeader from '@/components/ui/AppHeader'
import BottomNav from '@/components/ui/BottomNav'
import SignOutButton from './SignOutButton'
import { getUserZones } from '@/lib/db/zones'
import { ZONE_TEMPLATES } from '@/lib/zone-templates'
import { ZONE_META, type ZoneType } from '@/types'
import type { TeamOfInterest } from '@/lib/scores/espn'
import type { LocalArea } from '@/types'

export const dynamic = 'force-dynamic'

// Profile is a reference view only — it doesn't duplicate the Sports/Local/Work
// Customize sheets, just summarizes what's currently set and links to the
// zone's own detail page (where the real "Customize" pill lives).
function summarizePersonalization(kind: 'teams' | 'areas' | 'industry', config: unknown): string {
  if (kind === 'teams') {
    const teams = (config as { teams?: TeamOfInterest[] } | null)?.teams ?? []
    return teams.length > 0 ? teams.map((t) => t.shortName).join(', ') : 'No teams selected yet'
  }
  if (kind === 'areas') {
    const areas = (config as { areas?: LocalArea[] } | null)?.areas ?? []
    return areas.length > 0 ? areas.map((a) => a.label).join(', ') : 'No areas set yet'
  }
  const industry = (config as { industry?: string } | null)?.industry
  return industry || 'Not set yet'
}

export default async function ProfilePage() {
  const user = await getEffectiveUser()
  if (!user) redirect('/auth/signin')

  const supabase = createServerSupabase()
  const [{ data: profile }, zones] = await Promise.all([
    supabase.from('users').select('email, zip_code, display_name').eq('id', user.id).maybeSingle(),
    getUserZones(user.id),
  ])

  const email = profile?.email ?? user.email ?? ''
  const zipCode = profile?.zip_code ?? '—'

  const personalizedZones = zones
    .map((z) => {
      const template = Object.values(ZONE_TEMPLATES).find((t) => t.type === z.type)
      if (!template?.personalization) return null
      const meta = ZONE_META[z.type as ZoneType]
      return {
        zoneId: z.id,
        color: meta.color,
        label: template.personalization.label,
        summary: summarizePersonalization(template.personalization.kind, z.config),
      }
    })
    .filter((z): z is NonNullable<typeof z> => z !== null)

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100dvh', paddingBottom: '100px' }}>
      <AppHeader title="Profile" />

      <div style={{ padding: '20px' }}>
        {/* Avatar */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingBottom: '28px', marginBottom: '24px', borderBottom: '1px solid var(--border)' }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '50%',
            background: 'var(--surface-2)', border: '1px solid var(--border-mid)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '12px',
          }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)' }}>{email}</div>
        </div>

        {/* Account details */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: '10px' }}>
            Account
          </div>
          <div style={{ background: 'var(--surface)', borderRadius: '14px', border: '1px solid var(--border-mid)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: '14px', color: 'var(--text-2)' }}>Email</span>
              <span style={{ fontSize: '14px', color: 'var(--text)', fontWeight: 500 }}>{email}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px' }}>
              <span style={{ fontSize: '14px', color: 'var(--text-2)' }}>Zip code</span>
              <span style={{ fontSize: '14px', color: 'var(--text)', fontWeight: 500 }}>{zipCode}</span>
            </div>
          </div>
        </div>

        {/* Personalization — reference only, links out to each zone's own Customize sheet */}
        {personalizedZones.length > 0 && (
          <div style={{ marginBottom: '28px' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: '10px' }}>
              Personalization
            </div>
            <div style={{ background: 'var(--surface)', borderRadius: '14px', border: '1px solid var(--border-mid)', overflow: 'hidden' }}>
              {personalizedZones.map((z, i) => (
                <a
                  key={z.zoneId}
                  href={`/zones/${z.zoneId}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px',
                    borderBottom: i < personalizedZones.length - 1 ? '1px solid var(--border)' : 'none',
                    textDecoration: 'none',
                  }}
                >
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: z.color, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', color: 'var(--text-2)' }}>{z.label}</div>
                    <div style={{ fontSize: '14px', color: 'var(--text)', fontWeight: 500, marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {z.summary}
                    </div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0 }}>
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Zones link */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: '10px' }}>
            Content
          </div>
          <a href="/zones/manage" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'var(--surface)', borderRadius: '14px', border: '1px solid var(--border-mid)', textDecoration: 'none' }}>
            <span style={{ fontSize: '14px', color: 'var(--text)' }}>Manage Zones</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2.5" strokeLinecap="round">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </a>
        </div>

        {/* Sign out / switch accounts */}
        <SignOutButton />
        <div style={{ fontSize: '11.5px', color: 'var(--text-3)', textAlign: 'center', marginTop: '10px', lineHeight: 1.5 }}>
          Signing out returns you to the sign-in screen, where you can sign back in with a different account.
        </div>
      </div>

      <BottomNav activeTab="today" />
    </div>
  )
}
