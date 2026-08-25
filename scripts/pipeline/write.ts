import { createServiceClient } from '@/lib/supabase/service'
import type { ProcessedArticle } from './types'

type QuicklookItem = {
  zone_type: string
  label: string
  value: string
  sub?: string
  position: number
}

function parseFinanceQuicklook(articles: ProcessedArticle[]): QuicklookItem[] {
  const finance = articles.find((a) => a.zoneType === 'finance' && a.bodySnippet?.includes('S&P 500'))
  if (!finance?.bodySnippet) return []

  const items: QuicklookItem[] = []
  const parts = finance.bodySnippet.split(' | ')
  parts.forEach((part, i) => {
    const match = part.match(/^([^:]+): \$?([\d,]+\.?\d*)/)
    if (match) {
      const changeMatch = part.match(/\(([^)]+)\)$/)
      items.push({
        zone_type: 'finance',
        label: match[1].trim(),
        value: match[2],
        sub: changeMatch?.[1],
        position: i,
      })
    }
  })
  return items
}

export async function writeArticles(articles: ProcessedArticle[]): Promise<number> {
  if (articles.length === 0) return 0

  const supabase = createServiceClient()

  // Dedup: find which externalIds already exist
  const externalIds = articles.map((a) => a.externalId)
  const { data: existing } = await supabase
    .from('articles')
    .select('external_id')
    .in('external_id', externalIds)

  const knownIds = new Set((existing ?? []).map((r) => r.external_id))
  // Also dedup within the batch itself (same article can appear in multiple feeds)
  const seen = new Set<string>()
  const newArticles = articles.filter((a) => {
    if (knownIds.has(a.externalId) || seen.has(a.externalId)) return false
    seen.add(a.externalId)
    return true
  })

  if (newArticles.length === 0) return 0

  const rows = newArticles.map((a) => ({
    external_id: a.externalId,
    headline: a.headline,
    summary: a.summary,
    image_url: a.imageUrl ?? null,
    source_name: a.sourceName,
    source_url: a.sourceUrl,
    published_at: a.publishedAt,
    urgency_score: a.urgencyScore,
    zone_type: a.zoneType,
    zone_types: a.zoneTypes,
    tags: a.tags,
  }))

  const { error } = await supabase.from('articles').insert(rows)
  if (error) throw error

  // Update quicklook for finance (Local Zone's weather now lives in the live-fetched Weather Card, not quicklook)
  const quicklookItems = parseFinanceQuicklook(articles)

  if (quicklookItems.length > 0) {
    for (const item of quicklookItems) {
      await supabase
        .from('zone_quicklook')
        .upsert(
          { ...item, updated_at: new Date().toISOString() },
          { onConflict: 'zone_type,label' }
        )
    }
  }

  return newArticles.length
}
