import { createHash } from 'crypto'
import Parser from 'rss-parser'
import type { RawArticle, ZoneType } from '../types'

const parser = new Parser()

function makeExternalId(sourceUrl: string, headline: string): string {
  return createHash('sha256').update(sourceUrl + headline).digest('hex').slice(0, 32)
}

function extractOgImage(content: string): string | undefined {
  const match = content?.match(/https?:\/\/[^\s"'<>]+\.(?:jpg|jpeg|png|webp|gif)[^\s"'<>]*/i)
  return match?.[0]
}

export async function fetchRss(feedUrl: string, zoneType: ZoneType, sourceName?: string): Promise<RawArticle[]> {
  const feed = await parser.parseURL(feedUrl)

  const name = sourceName ?? feed.title ?? feedUrl

  return feed.items.slice(0, 15).map((item) => {
    const headline = item.title ?? ''
    const sourceUrl = item.link ?? feedUrl
    const content = item.content ?? item.summary ?? ''

    const imageUrl =
      (item.enclosure?.url) ||
      extractOgImage(content) ||
      undefined

    return {
      externalId: makeExternalId(sourceUrl, headline),
      headline,
      bodySnippet: content.replace(/<[^>]+>/g, '').slice(0, 500) || undefined,
      imageUrl,
      sourceUrl,
      sourceName: name,
      publishedAt: item.isoDate ?? item.pubDate ?? new Date().toISOString(),
      zoneType,
    } satisfies RawArticle
  })
}
