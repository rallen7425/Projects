export type ZoneType =
  | 'sports'
  | 'local'
  | 'news'
  | 'tech'
  | 'finance'
  | 'work'
  | 'entertainment'

export type ArticleDisplay = {
  id: string
  headline: string
  summary: string
  imageUrl?: string
  sourceName: string
  sourceUrl: string
  publishedAt: string
  urgencyScore: number
  zoneType: ZoneType
  tags: string[]
  isNew?: boolean
  isUrgent?: boolean
}

export type ZoneConfig = {
  id: string
  type: ZoneType
  label: string
  enabled: boolean
  position: number
}

// Local Zone personalization — community/metro/region tiers derived from the
// user's zip code, plus up to 3 user-added extra community/metro areas.
export type LocalArea = {
  id: string
  kind: 'community' | 'metro' | 'region'
  label: string // e.g. "North Andover, MA", "Boston, MA", "New England"
  query: string  // Google News search query for this area
  zip?: string    // present for community-kind areas — used for the Weather Card
}

export type ScheduleRow = {
  sport: 'mlb' | 'nba' | 'nfl' | 'other'
  matchup: string
  time: string
}

export type ScheduleHero = {
  rows: ScheduleRow[]
}

export type StatHero = {
  value: string
  label: string
  sub: string
}

export type HeadlineHero = {
  text: string
  tag: string
  time: string
}

export const ZONE_META: Record<ZoneType, { label: string; shortLabel: string; color: string; bg: string; border: string }> = {
  sports: {
    label: 'Sports Zone',
    shortLabel: 'Sports',
    color: '#52C97A',
    bg: 'rgba(82,201,122,0.12)',
    border: 'rgba(82,201,122,0.30)',
  },
  local: {
    label: 'Local Zone',
    shortLabel: 'Local',
    color: '#5B9CF6',
    bg: 'rgba(91,156,246,0.12)',
    border: 'rgba(91,156,246,0.30)',
  },
  news: {
    label: 'News Zone',
    shortLabel: 'News',
    color: '#EF9F27',
    bg: 'rgba(239,159,39,0.12)',
    border: 'rgba(239,159,39,0.30)',
  },
  tech: {
    label: 'Tech & AI Zone',
    shortLabel: 'Tech',
    color: '#A78BFA',
    bg: 'rgba(167,139,250,0.12)',
    border: 'rgba(167,139,250,0.30)',
  },
  finance: {
    label: 'Finance Zone',
    shortLabel: 'Finance',
    color: '#34D399',
    bg: 'rgba(52,211,153,0.12)',
    border: 'rgba(52,211,153,0.30)',
  },
  work: {
    label: 'Work Zone',
    shortLabel: 'Work',
    color: '#94A3B8',
    bg: 'rgba(148,163,184,0.12)',
    border: 'rgba(148,163,184,0.30)',
  },
  entertainment: {
    label: 'Entertainment Zone',
    shortLabel: 'Entertain',
    color: '#F472B6',
    bg: 'rgba(244,114,182,0.12)',
    border: 'rgba(244,114,182,0.30)',
  },
}
