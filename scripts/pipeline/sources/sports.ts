import { fetchRss } from './rss'
import type { RawArticle } from '../types'

const SPORTS_FEEDS = [
  { url: 'https://www.espn.com/espn/rss/nfl/news', name: 'ESPN NFL' },
  { url: 'https://www.espn.com/espn/rss/nba/news', name: 'ESPN NBA' },
  { url: 'https://www.espn.com/espn/rss/mlb/news', name: 'ESPN MLB' },
  { url: 'https://www.espn.com/espn/rss/nhl/news', name: 'ESPN NHL' },
]

export async function fetchSports(): Promise<RawArticle[]> {
  const results = await Promise.allSettled(
    SPORTS_FEEDS.map((feed) => fetchRss(feed.url, 'sports', feed.name))
  )

  const articles: RawArticle[] = []
  for (const result of results) {
    if (result.status === 'fulfilled') {
      articles.push(...result.value)
    } else {
      console.warn('[sports] Feed fetch failed:', result.reason)
    }
  }

  // Sort by publishedAt descending, cap at 15
  return articles
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, 15)
}
