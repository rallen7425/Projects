import { createHash } from 'crypto'
import Parser from 'rss-parser'
import type { RawArticle, ZoneType } from '../types'

// BLOX/TownNews CMS search-as-RSS endpoint, shared by several North of Boston
// Media Group papers (Eagle-Tribune, Salem News, Newburyport Daily News, Derry
// News, Andover Townsman). Confirmed via live testing: the bare feed
// (`/search/?f=rss`) is a noisy "everything recent" dump — wire/syndicated
// content (e.g. investor-alert press releases) and raw image-asset filenames
// mixed in alongside real articles. Querying with a town name and `t=article`
// filters to genuinely local, real article content. A browser-like (mobile)
// User-Agent is required — a desktop UA got a 429 from at least
// eagletribune.com; iPhone Safari's UA did not.
const parser = new Parser({
  headers: {
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  },
})

// Even with t=article, a handful of raw image-asset filenames can still slip
// through as item titles — filter those out defensively.
const FILENAME_PATTERN = /\.(jpe?g|png|webp|gif)$/i

function makeExternalId(sourceUrl: string, headline: string): string {
  return createHash('sha256').update(sourceUrl + headline).digest('hex').slice(0, 32)
}

export async function fetchBloxSearch(domain: string, query: string, zoneType: ZoneType, sourceName: string): Promise<RawArticle[]> {
  const url = `https://${domain}/search/?q=${encodeURIComponent(query)}&f=rss&t=article`
  const feed = await parser.parseURL(url)

  return feed.items
    .filter((item) => item.title && !FILENAME_PATTERN.test(item.title))
    .slice(0, 15)
    .map((item) => {
      const headline = item.title ?? ''
      const sourceUrl = item.link ?? url
      const content = item.contentSnippet ?? ''

      return {
        externalId: makeExternalId(sourceUrl, headline),
        headline,
        bodySnippet: content.slice(0, 500) || undefined,
        sourceUrl,
        sourceName,
        publishedAt: item.isoDate ?? item.pubDate ?? new Date().toISOString(),
        zoneType,
      } satisfies RawArticle
    })
}
