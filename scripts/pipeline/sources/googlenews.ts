import { createHash } from 'crypto'
import Parser from 'rss-parser'
import type { RawArticle, ZoneType } from '../types'

// Google News' RSS search endpoint (no API key required) — used for the Local
// Zone's community/metro/region tiers. Confirmed via live testing to return
// genuinely relevant local results for town/city/region queries, unlike
// Guardian's keyword search. This is an unofficial/undocumented endpoint (no
// formal API contract like the Guardian Content API), but has been stable in
// practice for years.
//
// Caveat: item links are Google redirect pages (news.google.com/rss/articles/...),
// not the publisher's real article URL — the actual destination is resolved
// client-side via JS, which curl/cheerio-based server code can't follow. This
// means: (1) OG-image scraping is skipped for these URLs (see enrich/images.ts —
// it would otherwise scrape Google's own generic branding image, not real
// article art) and (2) the in-app "Read" embedded viewer will always show its
// "open in browser" interstitial for these links rather than truly embedding,
// since news.google.com sends X-Frame-Options: SAMEORIGIN. Opening in an
// external browser still works correctly (the real browser executes the JS
// redirect to the true publisher).

const parser = new Parser({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  },
  customFields: { item: ['source'] },
})

function makeExternalId(sourceUrl: string, headline: string): string {
  return createHash('sha256').update(sourceUrl + headline).digest('hex').slice(0, 32)
}

export async function fetchGoogleNews(query: string, zoneType: ZoneType, sourceLabel?: string): Promise<RawArticle[]> {
  // Quoted as an exact phrase — unquoted multi-word queries are matched as loose
  // AND/OR keyword sets, not a phrase, which let a bare "Wells Maine" query match
  // an unrelated article about a person named "Nolan Wells" (confirmed via live
  // testing). Every query this app uses (town/metro/region names) is a proper
  // noun phrase, so exact-phrase matching is always what's wanted here.
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(`"${query}"`)}+when:14d&hl=en-US&gl=US&ceid=US:en`
  const feed = await parser.parseURL(url)

  return feed.items.slice(0, 15).map((item) => {
    const sourceUrl = item.link ?? url
    const sourceName = (item as { source?: string }).source ?? sourceLabel ?? 'Google News'

    // Google News RSS titles are suffixed with " - sourcename.com" — strip it.
    let headline = item.title ?? ''
    const suffix = ` - ${sourceName}`
    if (headline.endsWith(suffix)) headline = headline.slice(0, -suffix.length)

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
