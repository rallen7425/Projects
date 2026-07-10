import * as cheerio from 'cheerio'
import type { RawArticle } from '../types'

async function fetchOgImage(url: string): Promise<string | undefined> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3000)
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DistilledBot/1.0)' },
    })
    clearTimeout(timeout)
    if (!res.ok) return undefined

    const html = await res.text()
    const $ = cheerio.load(html)
    const ogImage = $('meta[property="og:image"]').attr('content')
      ?? $('meta[name="twitter:image"]').attr('content')
    return ogImage || undefined
  } catch {
    return undefined
  }
}

async function fetchUnsplashImage(query: string): Promise<string | undefined> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY
  if (!accessKey) return undefined
  try {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1`
    const res = await fetch(url, {
      headers: { Authorization: `Client-ID ${accessKey}` },
    })
    if (!res.ok) return undefined
    const json = await res.json()
    return json?.results?.[0]?.urls?.small
  } catch {
    return undefined
  }
}

export async function enrichImages(articles: RawArticle[]): Promise<RawArticle[]> {
  const missing = articles.filter((a) => !a.imageUrl)

  // OG extraction — run concurrently but don't block pipeline on failure
  await Promise.all(
    missing.map(async (article) => {
      const ogImage = await fetchOgImage(article.sourceUrl)
      if (ogImage) {
        article.imageUrl = ogImage
      }
    })
  )

  // Unsplash fallback for still-missing images
  await Promise.all(
    articles
      .filter((a) => !a.imageUrl)
      .map(async (article) => {
        const query = article.headline.split(' ').slice(0, 3).join(' ')
        const img = await fetchUnsplashImage(query)
        if (img) {
          article.imageUrl = img
        }
      })
  )

  return articles
}
