import type { ZoneType } from '@/types'

// The Default Zone Catalog — one entry per selectable zone template. `personalization`
// and `specialCard` document what's already true in the rendering code (ZoneDetailClient's
// ScoresCard/WeatherCard/QuickLookStrip, lib/zonePreview.ts's team/area handling) so the
// Add Zone and Customize UIs can read from one typed source instead of hardcoded branching
// per zone type.
export type ZoneTemplate = {
  type: ZoneType
  label: string
  description: string
  position: number
  defaultConfig: Record<string, unknown>
  sources: string[]
  requiresZip?: boolean
  requiresIndustry?: boolean
  personalization?: {
    kind: 'teams' | 'areas' | 'industry'
    label: string
  }
  specialCard?: 'scores' | 'weather' | 'quicklook'
}

export const ZONE_TEMPLATES: Record<string, ZoneTemplate> = {
  local: {
    type: 'local',
    label: 'Local Zone',
    description: 'Community, metro, and regional news for your area — plus live weather.',
    position: 0,
    defaultConfig: {},
    sources: ['weather', 'local-rss'],
    requiresZip: true,
    personalization: { kind: 'areas', label: 'Local Areas' },
    specialCard: 'weather',
  },
  sports: {
    type: 'sports',
    label: 'Sports Zone',
    description: 'Scores, recaps, and coverage for the teams you follow — starts with your nearest metro’s teams, fully customizable after.',
    position: 1,
    defaultConfig: {},
    sources: ['espn-rss', 'team-rss'],
    requiresZip: true,
    personalization: { kind: 'teams', label: 'Teams of Interest' },
    specialCard: 'scores',
  },
  news: {
    type: 'news',
    label: 'News Zone',
    description: 'National and global headlines from The Guardian.',
    position: 2,
    defaultConfig: {},
    sources: ['guardian-world', 'guardian-us-news'],
  },
  tech: {
    type: 'tech',
    label: 'Tech & AI Zone',
    description: 'Tech and AI coverage from The Guardian, Hacker News, TechCrunch, The Verge, Ars Technica, and Wired.',
    position: 3,
    defaultConfig: {},
    sources: ['guardian-tech', 'hn-rss'],
  },
  finance: {
    type: 'finance',
    label: 'Finance Zone',
    description: 'Market index quotes plus business news from The Guardian.',
    position: 4,
    defaultConfig: {},
    sources: ['finance-api'],
    specialCard: 'quicklook',
  },
  work: {
    type: 'work',
    label: 'Work Zone',
    description: 'Careers and personal-finance news for your industry.',
    position: 5,
    defaultConfig: {},
    sources: ['guardian', 'rss'],
    requiresIndustry: true,
    personalization: { kind: 'industry', label: 'Industry' },
  },
  entertainment: {
    type: 'entertainment',
    label: 'Entertainment Zone',
    description: 'Culture and entertainment news from The Guardian.',
    position: 6,
    defaultConfig: {},
    sources: ['guardian-culture'],
  },
}
