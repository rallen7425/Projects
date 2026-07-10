import { createHash } from 'crypto'
import type { RawArticle, ZoneType } from '../types'

const BASE = 'https://content.guardianapis.com/search'

function makeExternalId(sourceUrl: string, headline: string): string {
  return createHash('sha256').update(sourceUrl + headline).digest('hex').slice(0, 32)
}

export async function fetchGuardian(section: string, zoneType: ZoneType): Promise<RawArticle[]> {
  const apiKey = process.env.GUARDIAN_API_KEY
  if (!apiKey) throw new Error('GUARDIAN_API_KEY not set')

  const url = new URL(BASE)
  url.searchParams.set('api-key', apiKey)
  url.searchParams.set('section', section)
  url.searchParams.set('show-fields', 'headline,bodyText,thumbnail')
  url.searchParams.set('page-size', '15')
  url.searchParams.set('order-by', 'newest')

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`Guardian API error: ${res.status}`)

  const json = await res.json()
  const results = json?.response?.results ?? []

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
      publishedAt: (item.webPublicationDate ?? new Date().toISOString()) as string,
      zoneType,
    } satisfies RawArticle
  })
}
