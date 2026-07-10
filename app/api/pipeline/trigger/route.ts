import { NextRequest, NextResponse } from 'next/server'
import { runPipeline } from '@/scripts/pipeline/index'
import type { ZoneType } from '@/scripts/pipeline/types'

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json().catch(() => ({}))
    const zones = body?.zones as ZoneType[] | undefined

    const results = await runPipeline(zones)

    return NextResponse.json({ success: true, results })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[pipeline trigger] Error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
