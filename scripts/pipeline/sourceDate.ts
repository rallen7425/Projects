export function sourceDate(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) return ''
  const ms = Date.parse(value)
  return Number.isFinite(ms) ? new Date(ms).toISOString() : ''
}
export function sourceTime(value: string): number {
  const ms = Date.parse(value)
  return Number.isFinite(ms) ? ms : 0
}
