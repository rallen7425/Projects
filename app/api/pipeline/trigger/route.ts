import { runStatus } from '@/scripts/pipeline/sourceStatus'
import { NextRequest, NextResponse } from 'next/server'
import { runPipeline } from '@/scripts/pipeline/index'
import type { ZoneType } from '@/scripts/pipeline/types'

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-cron-secret')
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json().catch(() => ({}))
    const zones = body?.zones as ZoneType[] | undefined
    const allowed = ['sports', 'local', 'tech', 'finance', 'entertainment', 'work', 'news', 'family', 'wellness', 'interests']
    if (zones !== undefined && (!Array.isArray(zones) || !zones.length || zones.some(z => !allowed.includes(z)))) {
      return NextResponse.json({ error: 'Invalid zones' }, { status: 400 })
    }

    const results = await runPipeline(zones)

    const status = runStatus(results)
    return NextResponse.json({ success: status === 'success', status, results }, { status: status === 'success' ? 200 : 502 })
  } catch {
    const message = 'Pipeline failed'
    console.error('[pipeline trigger] Error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
