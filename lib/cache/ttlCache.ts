// Tiny in-memory TTL cache for live, read-only external API calls (ESPN
// schedules, NWS forecasts) that don't change second-to-second but are now
// fetched from more than one page in quick succession — e.g. the Zones hub
// and a zone's own detail page both request the same team's schedule or the
// same area's forecast. Not persisted across cold starts or shared across
// serverless instances, so this is a best-effort dedup rather than a real
// cache layer — but Vercel's Fluid Compute reuses warm instances across
// nearby requests, which is exactly the case this targets. Falsy/null
// results are never cached, so a transient upstream failure doesn't get
// "stuck" for a full TTL window — the next request just retries.
const store = new Map<string, { value: unknown; expires: number }>()

export async function withTtlCache<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
  const hit = store.get(key)
  if (hit && hit.expires > Date.now()) return hit.value as T

  const value = await fetcher()
  if (value) store.set(key, { value, expires: Date.now() + ttlMs })
  return value
}
