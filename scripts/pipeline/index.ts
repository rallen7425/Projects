import { config } from 'dotenv'
import { resolve } from 'path'
// Load .env.local first (takes priority), then .env
config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })
import { fetchGuardian } from './sources/guardian'
import { fetchRss } from './sources/rss'
import { fetchWeather } from './sources/weather'
import { fetchSports } from './sources/sports'
import { fetchFinance } from './sources/finance'
import { enrichImages } from './enrich/images'
import { summarizeArticles } from './enrich/summarize'
import { writeArticles } from './write'
import { createServiceClient } from '@/lib/supabase/service'
import type { RawArticle, ZoneType } from './types'

type ZoneRunner = {
  zone: ZoneType
  fetch: () => Promise<RawArticle[]>
}

const DEFAULT_ZIP = process.env.DEFAULT_ZIP ?? '04101'  // Portland, ME fallback

const ZONE_RUNNERS: ZoneRunner[] = [
  {
    zone: 'tech',
    fetch: async () => {
      const [guardian, hn] = await Promise.allSettled([
        fetchGuardian('technology', 'tech'),
        fetchRss('https://hnrss.org/frontpage', 'tech', 'Hacker News'),
      ])
      return [
        ...(guardian.status === 'fulfilled' ? guardian.value : []),
        ...(hn.status === 'fulfilled' ? hn.value : []),
      ].slice(0, 15)
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
      const [weather, local] = await Promise.allSettled([
        fetchWeather(DEFAULT_ZIP),
        fetchGuardian('us-news', 'local'),
      ])
      return [
        ...(weather.status === 'fulfilled' ? weather.value : []),
        ...(local.status === 'fulfilled' ? local.value : []),
      ].slice(0, 15)
    },
  },
  {
    zone: 'maine',
    fetch: async () => {
      const feeds = await Promise.allSettled([
        fetchRss('https://www.pressherald.com/feed/', 'maine', 'Portland Press Herald'),
        fetchRss('https://www.bangordailynews.com/feed/', 'maine', 'Bangor Daily News'),
      ])
      return feeds
        .flatMap((r) => (r.status === 'fulfilled' ? r.value : []))
        .slice(0, 15)
    },
  },
  {
    zone: 'work',
    fetch: () => fetchGuardian('business', 'work'),
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
