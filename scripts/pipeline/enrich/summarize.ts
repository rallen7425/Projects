import Anthropic from '@anthropic-ai/sdk'
import type { RawArticle, ProcessedArticle, ZoneType } from '../types'

let _client: Anthropic | null = null
function getClient() {
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  return _client
}

const ZONE_VALUES: ZoneType[] = ['sports', 'local', 'tech', 'finance', 'entertainment', 'work', 'news']

// A story is breaking/critical enough to also surface in News on top of its
// native zone at this urgency tier (see the rubric in the prompt below) —
// deliberately enforced here in code rather than left to the model, so the
// crossover rule is consistent and auditable rather than a per-call judgment
// call baked into free-text generation.
const NEWS_CROSSOVER_URGENCY = 5

type SummarizeResult = {
  id: string
  summary: string
  urgency: number
  tags: string[]
  zoneType: ZoneType
}

async function summarizeBatch(articles: RawArticle[]): Promise<SummarizeResult[]> {
  const articleList = articles
    .map((a, i) =>
      `${i + 1}. ID:${a.externalId}\nHeadline: ${a.headline}${a.bodySnippet ? '\nContext: ' + a.bodySnippet : ''}`
    )
    .join('\n\n')

  const prompt = `You are classifying and summarizing news articles for a personal news app called Distilled, organized around topic Zones. For each article below, judge it purely on its own headline/content — ignore any hints about where it was found — and provide:
- zoneType: the ONE zone that best fits what this article is actually about, from this exact list:
  - "tech": the technology industry, products, software, AI, or the tech business world.
  - "sports": games, leagues, athletes, teams, sports business.
  - "finance": markets, the economy, business/corporate news, investing.
  - "local": content specific to a particular city/region/community (schools, local government, local events) — not just "published by a local outlet," the substance must be geographically local.
  - "work": careers, workplace trends, employment, the world of work itself.
  - "entertainment": film, TV, music, celebrities, culture, arts.
  - "news": general significant world/national/political events that don't fit any zone above — this is the catch-all, not a default for borderline cases in another zone.
  A story about a tech company's stock move is "finance" or "tech", not both — pick the single best fit. A general-interest story that merely mentions a tech company in passing (e.g. a celebrity's death, an election ruling) is NOT "tech" just because it was found via a tech-adjacent source — classify it by its actual subject.
- summary: 2-3 sentence plain English summary, no jargon
- urgency: 1-5 (5=breaking/critical — the kind of story that would be a national headline regardless of topic, 4=important today, 3=worth knowing, 2=background, 1=when you have time)
- tags: array of 1-3 short topic tags (e.g. "Celtics", "NBA Draft", "Boston")

Return ONLY a JSON array, no other text:
[{"id":"...","zoneType":"...","summary":"...","urgency":1,"tags":["..."]}]

Articles:
${articleList}`

  const message = await getClient().messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4096,
    temperature: 0,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''

  // Extract JSON array from response
  const match = text.match(/\[[\s\S]*\]/)
  if (!match) {
    console.warn('[summarize] Could not parse JSON from response:', text.slice(0, 200))
    return []
  }

  const parsed = JSON.parse(match[0]) as SummarizeResult[]
  // Guard against the model returning something outside the known enum —
  // fall back per-item in the merge step below rather than trusting this blindly.
  return parsed.filter((r) => ZONE_VALUES.includes(r.zoneType))
}

export async function summarizeArticles(articles: RawArticle[]): Promise<ProcessedArticle[]> {
  if (articles.length === 0) return []

  const BATCH_SIZE = 20
  const results: SummarizeResult[] = []

  for (let i = 0; i < articles.length; i += BATCH_SIZE) {
    const batch = articles.slice(i, i + BATCH_SIZE)
    const batchResults = await summarizeBatch(batch)
    results.push(...batchResults)
  }

  // Merge summaries back into articles
  const resultMap = new Map(results.map((r) => [r.id, r]))

  return articles.map((article) => {
    const result = resultMap.get(article.externalId)
    // If classification failed to come back for this article (parse error,
    // dropped batch item), fall back to the source-feed hint it was fetched
    // with rather than losing the article's zone entirely.
    const zoneType = result?.zoneType ?? article.zoneType
    const urgencyScore = result?.urgency ?? 1
    const zoneTypes: ZoneType[] =
      zoneType !== 'news' && urgencyScore >= NEWS_CROSSOVER_URGENCY ? [zoneType, 'news'] : [zoneType]

    return {
      ...article,
      zoneType,
      zoneTypes,
      summary: result?.summary ?? '',
      urgencyScore,
      tags: result?.tags ?? [],
    }
  })
}
