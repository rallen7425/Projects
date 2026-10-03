import { observeSource, sourceScope } from '../sourceStatus'
import { createHash } from 'crypto'
import type { RawArticle } from '../types'

function makeExternalId(sourceUrl: string, headline: string): string {
  return createHash('sha256').update(sourceUrl + headline).digest('hex').slice(0, 32)
}

type QuoteResult = {
  symbol: string
  price: string
  change: string
  changePercent: string
}

async function fetchQuote(symbol: string, apiKey: string): Promise<QuoteResult | null> {
  const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`
  return observeSource('Alpha Vantage ' + symbol, async () => {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) })
    if (!res.ok) throw new Error('Quote failed')
    const json = await res.json()
    const q = json?.['Global Quote']
    if (!q?.['05. price']) throw new Error('Missing quote')
    return {
      symbol,
      price: parseFloat(q['05. price']).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      change: q['09. change'],
      changePercent: q['10. change percent'],
    }
  }, () => 1).catch(() => null)
}

export async function fetchFinance(): Promise<RawArticle[]> {
  const apiKey = process.env.ALPHA_VANTAGE_KEY
  if (!apiKey) {
    sourceScope.getStore()?.push({ source: 'Alpha Vantage', status: 'skipped', items: 0 })
    return []
  }

  // Free tier allows 1 request/second — parallel calls get rate-limited and
  // silently return an "Information" body with no quote, so space them out.
  const spy = await fetchQuote('SPY', apiKey)
  await new Promise(r => setTimeout(r, 1100))
  const dia = await fetchQuote('DIA', apiKey)
  await new Promise(r => setTimeout(r, 1100))
  const qqq = await fetchQuote('QQQ', apiKey)

  if (!spy) return []

  const direction = parseFloat(spy.change) >= 0 ? '▲' : '▼'
  const headline = `Markets: S&P 500 ${direction} ${spy.price} (${spy.changePercent?.replace('%', '')}%)`

  const lines: string[] = []
  if (spy) lines.push(`S&P 500 (SPY): $${spy.price} ${spy.change >= '0' ? '+' : ''}${spy.change} (${spy.changePercent})`)
  if (dia) lines.push(`Dow Jones (DIA): $${dia.price} ${dia.change >= '0' ? '+' : ''}${dia.change} (${dia.changePercent})`)
  if (qqq) lines.push(`NASDAQ (QQQ): $${qqq.price} ${qqq.change >= '0' ? '+' : ''}${qqq.change} (${qqq.changePercent})`)

  const bodySnippet = lines.join(' | ')
  const sourceUrl = 'https://finance.yahoo.com'

  return [{
    externalId: makeExternalId(sourceUrl + new Date().toDateString(), headline),
    headline,
    bodySnippet,
    sourceUrl,
    sourceName: 'Alpha Vantage',
    publishedAt: new Date().toISOString(),
    zoneType: 'finance',
  }]
}
