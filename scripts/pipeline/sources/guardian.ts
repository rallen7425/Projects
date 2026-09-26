import { observeSource } from '../sourceStatus'
import { sourceDate } from '../sourceDate'
import { createHash } from 'crypto'
import type { RawArticle, ZoneType } from '../types'

const BASE = 'https://content.guardianapis.com/search'

function makeExternalId(sourceUrl: string, headline: string): string {
  return createHash('sha256').update(sourceUrl + headline).digest('hex').slice(0, 32)
}

// `byTag: true` queries a specific Guardian tag (e.g. 'lifeandstyle/parents-and-parenting')
// instead of a whole section — used where a section is too broad (Family/Wellness both
// draw from 'lifeandstyle', so each needs its own narrower tag to avoid near-identical
// content; confirmed both tags exist and are reasonably populated via a live tags-API
// check before wiring this in).
async function fetchGuardianImpl(sectionOrTag: string, zoneType: ZoneType, opts?: { byTag?: boolean }): Promise<RawArticle[]> {
  const apiKey = process.env.GUARDIAN_API_KEY
  if (!apiKey) throw new Error('GUARDIAN_API_KEY not set')

  const url = new URL(BASE)
  url.searchParams.set('api-key', apiKey)
  url.searchParams.set(opts?.byTag ? 'tag' : 'section', sectionOrTag)
  url.searchParams.set('show-fields', 'headline,bodyText,thumbnail')
  url.searchParams.set('page-size', '15')
  url.searchParams.set('order-by', 'newest')

  const res = await fetch(url.toString(), { signal: AbortSignal.timeout(15000) })
  if (!res.ok) throw new Error(`Guardian API error: ${res.status}`)

  const json = await res.json()
  if (!Array.isArray(json?.response?.results)) throw new Error('Invalid Guardian response')
  const results = json.response.results

  return results.slice(0, 15).map((item: Record<string, unknown>) => {
    const fields = (item.fields ?? {}) as Record<string, string>
    const headline = (fields.headline ?? item.webTitle ?? '') as string
    const sourceUrl = (item.webUrl ?? '') as string
    const bodyText = (fields.bodyText ?? '') as string

    return {
      externalId: makeExternalId(sourceUrl as string, headline),
      headline,
      bodySnippet: bodyText.slice(0, 500) || undefined,
      imageUrl: fields.thumbnail || undefined,
      sourceUrl: sourceUrl as string,
      sourceName: 'The Guardian',
      publishedAt: sourceDate(item.webPublicationDate),
      zoneType,
    } satisfies RawArticle
  })
}

export async function fetchGuardian(sectionOrTag: string, zoneType: ZoneType, opts?: { byTag?: boolean }): Promise<RawArticle[]> {
  return observeSource('Guardian', () => fetchGuardianImpl(sectionOrTag, zoneType, opts), rows => rows.length)
}
