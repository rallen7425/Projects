import type { ZoneType } from '@/types'

export type ZoneTemplate = {
  type: ZoneType
  label: string
  position: number
  defaultConfig: Record<string, unknown>
  sources: string[]
  requiresZip?: boolean
  requiresIndustry?: boolean
}

export const ZONE_TEMPLATES: Record<string, ZoneTemplate> = {
  local: {
    type: 'local',
    label: 'Local Zone',
    position: 0,
    defaultConfig: {},
    sources: ['weather', 'local-rss'],
    requiresZip: true,
  },
  sports: {
    type: 'sports',
    label: 'Sports Zone',
    position: 1,
    defaultConfig: {},
    sources: ['espn-rss', 'team-rss'],
    requiresZip: true,
  },
  news: {
    type: 'news',
    label: 'News Zone',
    position: 2,
    defaultConfig: {},
    sources: ['guardian-world', 'guardian-us-news'],
  },
  tech: {
    type: 'tech',
    label: 'Tech & AI Zone',
    position: 3,
    defaultConfig: {},
    sources: ['guardian-tech', 'hn-rss'],
  },
  finance: {
    type: 'finance',
    label: 'Finance Zone',
    position: 4,
    defaultConfig: {},
    sources: ['finance-api'],
  },
  work: {
    type: 'work',
    label: 'Work Zone',
    position: 5,
    defaultConfig: {},
    sources: ['guardian', 'rss'],
    requiresIndustry: true,
  },
  entertainment: {
    type: 'entertainment',
    label: 'Entertainment Zone',
    position: 6,
    defaultConfig: {},
    sources: ['guardian-culture'],
  },
}
