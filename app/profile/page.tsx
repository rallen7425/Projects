import { createServerSupabase, getEffectiveUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppHeader from '@/components/ui/AppHeader'
import BottomNav from '@/components/ui/BottomNav'
import SignOutButton from './SignOutButton'

export default async function ProfilePage() {
  const user = await getEffectiveUser()
  if (!user) redirect('/auth/signin')

  const supabase = createServerSupabase()
  const { data: profile } = await supabase
    .from('users')
    .select('email, zip_code, display_name')
    .eq('id', user.id)
    .maybeSingle()

  const email = profile?.email ?? user.email ?? ''
  const zipCode = profile?.zip_code ?? '—'

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

        {/* Zones link */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: '10px' }}>
            Content
          </div>
          <a href="/zones" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'var(--surface)', borderRadius: '14px', border: '1px solid var(--border-mid)', textDecoration: 'none' }}>
            <span style={{ fontSize: '14px', color: 'var(--text)' }}>Manage Zones</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2.5" strokeLinecap="round">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </a>
        </div>

        {/* Sign out */}
        <SignOutButton />
      </div>

      <BottomNav activeTab="today" />
    </div>
  )
}
