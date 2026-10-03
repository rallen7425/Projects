import { observeSource } from '../sourceStatus'
import { sourceDate } from '../sourceDate'
import { createHash } from 'crypto'
import Parser from 'rss-parser'
import type { RawArticle, ZoneType } from '../types'

const parser = new Parser({ timeout: 15000 })

function makeExternalId(sourceUrl: string, headline: string): string {
  return createHash('sha256').update(sourceUrl + headline).digest('hex').slice(0, 32)
}

function extractOgImage(content: string): string | undefined {
  const match = content?.match(/https?:\/\/[^\s"'<>]+\.(?:jpg|jpeg|png|webp|gif)[^\s"'<>]*/i)
  return match?.[0]
}

async function fetchRssImpl(feedUrl: string, zoneType: ZoneType, sourceName?: string): Promise<RawArticle[]> {
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
      publishedAt: sourceDate(item.isoDate ?? item.pubDate),
      zoneType,
    } satisfies RawArticle
  })
}

export async function fetchRss(feedUrl: string, zoneType: ZoneType, sourceName?: string): Promise<RawArticle[]> {
  // One retry: community feeds (e.g. hnrss.org) intermittently time out, and a single
  // transient miss shouldn't mark the whole zone partial.
  const attempt = async () => {
    try {
      return await fetchRssImpl(feedUrl, zoneType, sourceName)
    } catch {
      await new Promise(r => setTimeout(r, 1500))
      return fetchRssImpl(feedUrl, zoneType, sourceName)
    }
  }
  return observeSource(new URL(feedUrl).hostname, attempt, rows => rows.length)
}
