import { AsyncLocalStorage } from 'node:async_hooks'
export type SourceOutcome = { source: string; status: 'success' | 'failed' | 'skipped'; items: number }
export const sourceScope = new AsyncLocalStorage<SourceOutcome[]>()
export async function observeSource<T>(source: string, work: () => Promise<T>, count: (value: T) => number): Promise<T> {
  try {
    const value = await work()
    sourceScope.getStore()?.push({ source, status: 'success', items: count(value) })
    return value
  } catch {
    sourceScope.getStore()?.push({ source, status: 'failed', items: 0 })
    // Never propagate raw upstream messages containing URLs, keys or personal queries.
    throw new Error('Source request failed')
  }
}
export function resultStatus(error: boolean, sources: SourceOutcome[]): 'success' | 'partial' | 'failed' {
  if (error) return 'failed'
  if (!sources.some(s => s.status === 'failed')) return 'success'
  return sources.some(s => s.status === 'success') ? 'partial' : 'failed'
}
export function runStatus(results: { status: string }[]): 'success' | 'partial' | 'failed' {
  if (!results.length || results.every(r => r.status === 'failed')) return 'failed'
  return results.every(r => r.status === 'success') ? 'success' : 'partial'
}
