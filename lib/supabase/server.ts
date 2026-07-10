import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'

const createAnonClient = () => {
  const cookieStore = cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}

// In dev bypass mode, use service role to skip RLS for all db queries.
export const createServerSupabase = () => {
  if (process.env.DEV_BYPASS_USER_ID) {
    return createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
  }
  return createAnonClient()
}

// Use this in pages instead of supabase.auth.getUser() + redirect.
// Returns the real session user, or a synthetic dev user when DEV_BYPASS_USER_ID is set.
export async function getEffectiveUser(): Promise<{ id: string; email: string } | null> {
  const devId = process.env.DEV_BYPASS_USER_ID
  if (devId) return { id: devId, email: 'rallen7425@gmail.com' }
  const supabase = createAnonClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  return { id: user.id, email: user.email ?? '' }
}
