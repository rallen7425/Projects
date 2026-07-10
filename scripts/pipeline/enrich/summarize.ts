import Anthropic from '@anthropic-ai/sdk'
import type { RawArticle, ProcessedArticle } from '../types'

let _client: Anthropic | null = null
function getClient() {
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  return _client
}

type SummarizeResult = {
  id: string
  summary: string
  urgency: number
  tags: string[]
}

async function summarizeBatch(articles: RawArticle[]): Promise<SummarizeResult[]> {
  const articleList = articles
    .map((a, i) =>
      `${i + 1}. ID:${a.externalId}\nHeadline: ${a.headline}${a.bodySnippet ? '\nContext: ' + a.bodySnippet : ''}`
    )
    .join('\n\n')

  const prompt = `You are summarizing news articles for a personal news app. For each article below, provide:
- summary: 2-3 sentence plain English summary, no jargon
- urgency: 1-5 (5=breaking/critical, 4=important today, 3=worth knowing, 2=background, 1=when you have time)
- tags: array of 1-3 short topic tags (e.g. "Celtics", "NBA Draft", "Boston")

Return ONLY a JSON array, no other text:
[{"id":"...","summary":"...","urgency":1,"tags":["..."]}]

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

  return JSON.parse(match[0]) as SummarizeResult[]
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
    return {
      ...article,
      summary: result?.summary ?? '',
      urgencyScore: result?.urgency ?? 1,
      tags: result?.tags ?? [],
    }
  })
}
