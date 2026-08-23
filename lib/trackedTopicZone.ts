// Pure, client-safe piece of the tracked-topic zone-resolution logic — split
// out of lib/trackingPreview.ts because that file also imports
// lib/db/articles.ts (server-only, pulls in next/headers via
// lib/supabase/server.ts), which breaks when imported from a 'use client'
// component like app/tracking/TrackingClient.tsx even if only this function
// is actually used there.

import type { ZoneType } from '@/types'

export type ZoneRef = { id: string; type: ZoneType }

export function resolveTrackedTopicZone(zoneId: string | null | undefined, zones: ZoneRef[]): ZoneType | null {
  if (!zoneId) return null
  return zones.find((z) => z.id === zoneId)?.type ?? null
}
