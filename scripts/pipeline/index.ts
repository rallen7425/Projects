import { config } from 'dotenv'
import { resolve } from 'path'
// Load .env.local first (takes priority), then .env
config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })
import { fetchGuardian } from './sources/guardian'
import { fetchRss } from './sources/rss'
import { fetchGoogleNews } from './sources/googlenews'
import { fetchBloxSearch } from './sources/blox'
import { fetchSports } from './sources/sports'
import { fetchFinance } from './sources/finance'
import { enrichImages } from './enrich/images'
import { summarizeArticles } from './enrich/summarize'
import { writeArticles } from './write'
import { createServiceClient } from '@/lib/supabase/service'
import type { RawArticle, ZoneType } from './types'
import type { LocalArea } from '@/types'

type ZoneRunner = {
  zone: ZoneType
  fetch: () => Promise<RawArticle[]>
}

// Local Zone content is driven by each configured local zone's `config.areas`
// (community/metro/region tiers — see lib/geo/*, lib/weather/nws.ts, and the
// zones.setup script). Same shared-article-pool architecture as every other
// zone: no per-user pipeline runs, just a union of whatever areas any enabled
// local zone has configured, deduped by query text.
async function fetchLocalAreaConfigs(): Promise<LocalArea[]> {
  const supabase = createServiceClient()
  const { data: zones, error } = await supabase
    .from('zones')
    .select('config')
    .eq('type', 'local')
    .eq('enabled', true)

  if (error) {
    console.warn('[local] Failed to load zone configs:', error.message)
    return []
  }

  const byQuery = new Map<string, LocalArea>()
  for (const zone of zones ?? []) {
    const areas = (zone.config as { areas?: LocalArea[] } | null)?.areas ?? []
    for (const area of areas) {
      if (!byQuery.has(area.query)) byQuery.set(area.query, area)
    }
  }
  return Array.from(byQuery.values())
}

const ZONE_RUNNERS: ZoneRunner[] = [
  {
    zone: 'tech',
    fetch: async () => {
      // Guardian + HN kept as-is (broad framing + community/startup-culture
      // flavor); TechCrunch/Verge/Ars Technica/Wired added for leading-outlet
      // tech journalism (confirmed live: real, timely, high-signal content).
      // Each source capped before merging so no single feed dominates.
      const sources = await Promise.allSettled([
        fetchGuardian('technology', 'tech'),
        fetchRss('https://hnrss.org/frontpage', 'tech', 'Hacker News'),
        fetchRss('https://techcrunch.com/feed/', 'tech', 'TechCrunch'),
        fetchRss('https://www.theverge.com/rss/index.xml', 'tech', 'The Verge'),
        fetchRss('https://feeds.arstechnica.com/arstechnica/index', 'tech', 'Ars Technica'),
        fetchRss('https://www.wired.com/feed/rss', 'tech', 'Wired'),
      ])
      const merged = sources.flatMap((r) => (r.status === 'fulfilled' ? r.value.slice(0, 6) : []))
      return merged
        .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
        .slice(0, 15)
    },
  },
  {
    zone: 'finance',
    fetch: async () => {
      const [guardian, market] = await Promise.allSettled([
        fetchGuardian('business', 'finance'),
        fetchFinance(),
      ])
      return [
        ...(market.status === 'fulfilled' ? market.value : []),
        ...(guardian.status === 'fulfilled' ? guardian.value : []),
      ].slice(0, 15)
    },
  },
  {
    zone: 'sports',
    fetch: fetchSports,
  },
  {
    zone: 'entertainment',
    fetch: () => fetchGuardian('culture', 'entertainment'),
  },
  {
    zone: 'local',
    fetch: async () => {
      const areas = await fetchLocalAreaConfigs()
      if (areas.length === 0) {
        // No local zone configured yet — fall back to generic US news so the
        // zone isn't empty.
        return fetchGuardian('us-news', 'local')
      }

      // Per area: Google News (broad discovery, every area) plus any curated
      // direct sources (real article URLs — real OG images work, unlike
      // Google News' redirect links). Cap each individual source's
      // contribution before merging so one prolific source can't crowd out
      // the rest; the final sort+cap below enforces the overall 15/run limit
      // regardless of how many sources feed in.
      const fetchers: Promise<RawArticle[]>[] = []
      for (const area of areas) {
        fetchers.push(fetchGoogleNews(area.query, 'local', area.label).catch(() => []))
        for (const source of area.directSources ?? []) {
          if (source.kind === 'blox') {
            fetchers.push(fetchBloxSearch(source.domain, area.query, 'local', source.name).catch(() => []))
          } else {
            fetchers.push(fetchRss(source.url, 'local', source.name).catch(() => []))
          }
        }
      }

      const resultSets = await Promise.all(fetchers)
      const merged = resultSets.flatMap((set) => set.slice(0, 6))
      return merged
        .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
        .slice(0, 15)
    },
  },
  {
    zone: 'news',
    fetch: async () => {
      const feeds = await Promise.allSettled([
        fetchGuardian('world', 'news'),
        fetchGuardian('us-news', 'news'),
      ])
      return feeds
        .flatMap((r) => (r.status === 'fulfilled' ? r.value : []))
        .slice(0, 15)
    },
  },
  {
    zone: 'work',
    fetch: () => fetchGuardian('money', 'work'),
  },
]

type PipelineResult = {
  zone: ZoneType
  fetched: number
  newArticles: number
  written: number
  error?: string
}

export async function runPipeline(zones?: ZoneType[]): Promise<PipelineResult[]> {
  const runners = zones
    ? ZONE_RUNNERS.filter((r) => zones.includes(r.zone))
    : ZONE_RUNNERS

  const results: PipelineResult[] = []

  for (const runner of runners) {
    console.log(`[pipeline] Running zone: ${runner.zone}`)
    try {
      const raw = await runner.fetch()
      console.log(`[pipeline] ${runner.zone}: fetched ${raw.length} articles`)

      if (raw.length === 0) {
        results.push({ zone: runner.zone, fetched: 0, newArticles: 0, written: 0 })
        continue
      }

      // Check which are new before enrichment (optimization to avoid Claude calls)
      const supabase = createServiceClient()
      const externalIds = raw.map((a) => a.externalId)
      const { data: existing, error: dedupError } = await supabase
        .from('articles')
        .select('external_id')
        .in('external_id', externalIds)
      if (dedupError) {
        // If dedup query fails, skip this zone rather than calling Claude for
        // articles that may already exist (write.ts has its own dedup as a fallback)
        console.error(`[pipeline] ${runner.zone}: dedup query failed:`, dedupError.message)
        results.push({ zone: runner.zone, fetched: raw.length, newArticles: 0, written: 0, error: dedupError.message })
        continue
      }
      const knownIds = new Set((existing ?? []).map((r) => r.external_id))
      const newRaw = raw.filter((a) => !knownIds.has(a.externalId))

      console.log(`[pipeline] ${runner.zone}: ${newRaw.length} new articles`)

      if (newRaw.length === 0) {
        results.push({ zone: runner.zone, fetched: raw.length, newArticles: 0, written: 0 })
        continue
      }

      // Enrich only new articles
      const withImages = await enrichImages(newRaw)
      const processed = await summarizeArticles(withImages)
      const written = await writeArticles(processed)

      console.log(`[pipeline] ${runner.zone}: wrote ${written} articles`)
      results.push({ zone: runner.zone, fetched: raw.length, newArticles: newRaw.length, written })
    } catch (err) {
      const message = err instanceof Error ? err.message : JSON.stringify(err)
      console.error(`[pipeline] ${runner.zone} failed:`, message)
      results.push({ zone: runner.zone, fetched: 0, newArticles: 0, written: 0, error: message })
    }
  }

  return results
}

// Allow direct execution: npx tsx scripts/pipeline/index.ts
if (process.argv[1]?.endsWith('index.ts') || process.argv[1]?.endsWith('index.js')) {
  runPipeline().then((results) => {
    console.log('\n=== Pipeline complete ===')
    for (const r of results) {
      const status = r.error ? `ERROR: ${r.error}` : `fetched=${r.fetched} new=${r.newArticles} written=${r.written}`
      console.log(`  ${r.zone}: ${status}`)
    }
    process.exit(0)
  }).catch((err) => {
    console.error('Pipeline crashed:', err)
    process.exit(1)
  })
}
