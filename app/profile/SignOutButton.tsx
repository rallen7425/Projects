'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function SignOutButton() {
  const supabase = createClient()
  const router = useRouter()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/signin')
    router.refresh()
  }

  return (
    <button
      onClick={handleSignOut}
      style={{
        width: '100%',
        height: '48px',
        borderRadius: '12px',
        background: 'rgba(226,75,74,0.1)',
        border: '1px solid rgba(226,75,74,0.25)',
        color: '#E24B4A',
        fontSize: '15px',
        fontWeight: 600,
        cursor: 'pointer',
        fontFamily: 'inherit',
      }}
    >
      Sign out
    </button>
  )
}
