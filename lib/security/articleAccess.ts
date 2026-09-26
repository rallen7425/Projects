// Per-process protection only: instances do not share these counters.
// Authentication and stored-article lookup provide the primary access boundary.
const users = new Map<string, { start: number; count: number }>()
let active = 0
export function acquireArticleRead(userId: string, now = Date.now()): (() => void) | null {
  for (const [id, value] of Array.from(users)) if (now - value.start >= 60_000) users.delete(id)
  if (active >= 4 || (!users.has(userId) && users.size >= 1000)) return null
  const value = users.get(userId) ?? { start: now, count: 0 }
  if (value.count >= 10) return null
  value.count++; users.set(userId, value); active++
  let released = false
  return () => { if (!released) { released = true; active-- } }
}
