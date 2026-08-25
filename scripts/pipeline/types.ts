export type ZoneType = 'sports' | 'local' | 'tech' | 'finance' | 'entertainment' | 'work' | 'news'

export type RawArticle = {
  externalId: string       // sha256 hash of (sourceUrl + headline), truncated to 32 chars
  headline: string
  bodySnippet?: string     // first 500 chars of article body, for Claude context only
  imageUrl?: string
  sourceUrl: string
  sourceName: string
  publishedAt: string
  zoneType: ZoneType
}

export type ProcessedArticle = RawArticle & {
  summary: string
  urgencyScore: number     // 1–5
  tags: string[]
  // Every zone this article should be findable under — its classified native
  // zone (zoneType, above — overridden post-classification, no longer just
  // the source-feed hint it was fetched with), plus 'news' when the article
  // is breaking/critical enough to also surface there. See summarize.ts.
  zoneTypes: ZoneType[]
}
