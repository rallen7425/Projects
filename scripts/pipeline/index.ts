import { sourceScope, resultStatus, runStatus, type SourceOutcome } from './sourceStatus'
import { sourceTime } from './sourceDate'
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

// Merges pre-sorted (most-recent-first) groups by taking one item from each group in
// turn — group 1's most recent, group 2's most recent, ... group N's most recent, then
// group 1's second-most-recent, etc. — instead of concatenating and re-sorting by
// recency, which lets a high-frequency group's items dominate purely by being newer.
// Used for the Local Zone's per-source and per-area fairness (see the 'local' runner).
function interleaveRoundRobin<T>(groups: T[][]): T[] {
  const result: T[] = []
  const maxLen = Math.max(0, ...groups.map((g) => g.length))
  for (let i = 0; i < maxLen; i++) {
    for (const group of groups) {
      if (group[i] !== undefined) result.push(group[i])
    }
  }
  return result
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
    throw new Error('Local configuration lookup failed')
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

// Interests Zone content is driven by every enabled interests zone's own
// config.topic — same shared-article-pool architecture as every other zone
// (one union of topics, not a per-user pipeline run), same pattern as
// fetchLocalAreaConfigs above. Each topic's Google News results are capped
// before interleaving so one topic can't crowd out another.
async function fetchInterestsTopics(): Promise<string[]> {
  const supabase = createServiceClient()
  const { data: zones, error } = await supabase
    .from('zones')
    .select('config')
    .eq('type', 'interests')
    .eq('enabled', true)

  if (error) {
    throw new Error('Interests configuration lookup failed')
  }

  const topics = new Set<string>()
  for (const zone of zones ?? []) {
    const topic = (zone.config as { topic?: string } | null)?.topic
    if (topic) topics.add(topic)
  }
  return Array.from(topics)
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
        .sort((a, b) => sourceTime(b.publishedAt) - sourceTime(a.publishedAt))
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

      // Per area: Google News (broad discovery) plus any curated direct sources (real
      // article URLs — real OG images work, unlike Google News' redirect links). Both
      // within an area (across its own sources) and across areas, results are
      // round-robin interleaved rather than globally sorted-by-recency-and-capped — a
      // plain recency sort let one high-publish-frequency source (e.g. a regional public
      // radio newsroom, or a statewide outlet on a secondary area) crowd out a
      // lower-frequency source completely, every single run, even though that source's
      // own fetch succeeds every time (confirmed live: a 5-paper BLOX area was producing
      // 10 real articles per source but almost none ever made the final cut, buried under
      // one prolific source within the same area). Interleaving at both levels guarantees
      // every configured source — and every configured area — a fair share.
      const perArea = await Promise.all(
        areas.map(async (area) => {
          const fetchers: Promise<RawArticle[]>[] = [fetchGoogleNews(area.query, 'local', area.label).catch(() => [])]
          for (const source of area.directSources ?? []) {
            if (source.kind === 'blox') {
              fetchers.push(fetchBloxSearch(source.domain, area.query, 'local', source.name).catch(() => []))
            } else {
              fetchers.push(fetchRss(source.url, 'local', source.name).catch(() => []))
            }
          }
          const sets = await Promise.all(fetchers)
          const perSource = sets.map((set) =>
            [...set].sort((a, b) => sourceTime(b.publishedAt) - sourceTime(a.publishedAt)).slice(0, 6)
          )
          return interleaveRoundRobin(perSource).slice(0, 8)
        })
      )

      return interleaveRoundRobin(perArea).slice(0, 15)
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
  {
    zone: 'family',
    fetch: () => fetchGuardian('lifeandstyle/parents-and-parenting', 'family', { byTag: true }),
  },
  {
    zone: 'wellness',
    fetch: () => fetchGuardian('lifeandstyle/fitness', 'wellness', { byTag: true }),
  },
  {
    zone: 'interests',
    fetch: async () => {
      const topics = await fetchInterestsTopics()
      if (topics.length === 0) return []

      const perTopic = await Promise.all(
        topics.map((topic) => fetchGoogleNews(topic, 'interests', topic).catch(() => []))
      )
      const capped = perTopic.map((set) =>
        [...set].sort((a, b) => sourceTime(b.publishedAt) - sourceTime(a.publishedAt)).slice(0, 8)
      )
      return interleaveRoundRobin(capped).slice(0, 15)
    },
  },
]

export type PipelineResult = {
  status: 'success' | 'partial' | 'failed'
  sources: SourceOutcome[]
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
    const sources: SourceOutcome[] = []
    const result: PipelineResult = { zone: runner.zone, fetched: 0, newArticles: 0, written: 0, status: 'success', sources }
    let stage = 'Acquisition'
    await sourceScope.run(sources, async () => {
      try {
        const raw = await runner.fetch()
        result.fetched = raw.length
        if (!raw.length) return
        stage = 'Deduplication'
        const supabase = createServiceClient()
        const { data: existing, error } = await supabase.from('articles').select('external_id').in('external_id', raw.map(a => a.externalId))
        if (error) throw new Error('Dedup lookup failed')
        const knownIds = new Set((existing ?? []).map(r => r.external_id))
        const newRaw = raw.filter(a => !knownIds.has(a.externalId))
        result.newArticles = newRaw.length
        if (!newRaw.length) return
        stage = 'Image enrichment'
        const withImages = await enrichImages(newRaw)
        stage = 'Summary enrichment'
        const processed = await summarizeArticles(withImages)
        stage = 'Storage'
        result.written = await writeArticles(processed)
      } catch {
        result.error = `${stage} failed`
      }
    })
    result.status = resultStatus(Boolean(result.error), sources)
    results.push(result)
    console.log('[pipeline]', JSON.stringify(result))
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
    process.exit(runStatus(results) === 'success' ? 0 : 1)
  }).catch(() => {
    console.error('Pipeline crashed')
    process.exit(1)
  })
}
