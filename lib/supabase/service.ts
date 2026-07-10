import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

// Service role client — pipeline use only. Never import in app/ or components/.
export const createServiceClient = () => {
  // ws is required for Node.js < 22 which lacks native WebSocket
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ws = typeof WebSocket === 'undefined' ? require('ws') : WebSocket
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { realtime: { transport: ws } }
  )
}
