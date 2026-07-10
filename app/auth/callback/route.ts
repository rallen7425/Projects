import { createServerSupabase } from '@/lib/supabase/server'
import { initializeNewUser } from '@/lib/user-init'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = createServerSupabase()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Ensure user record exists (email sign-up path — upsert is safe for OAuth too)
      await supabase
        .from('users')
        .upsert({ id: data.user.id, email: data.user.email ?? '' }, { onConflict: 'id', ignoreDuplicates: true })

      // Check if user has zones
      const { data: zones } = await supabase
        .from('zones')
        .select('id')
        .eq('user_id', data.user.id)
        .limit(1)

      if (!zones || zones.length === 0) {
        // New user — create default zones then send to zones hub
        try {
          await initializeNewUser(data.user.id)
        } catch (e) {
          console.error('[callback] initializeNewUser failed:', e)
        }
      }

      return NextResponse.redirect(`${origin}/zones`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/signin`)
}
