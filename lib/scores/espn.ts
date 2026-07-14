// ESPN's public, unauthenticated site API (no key required) — same free-tier
// pattern already used for the sports RSS feeds in scripts/pipeline/sources/sports.ts.
// Used at request time for live/recent scores, not part of the batched content pipeline.

import { withTtlCache } from '@/lib/cache/ttlCache'

export type League = 'mlb' | 'nfl' | 'nba' | 'nhl'

export type TeamOfInterest = {
  league: League
  teamId: string
  name: string // "Boston Red Sox"
  shortName: string // "Red Sox"
  abbrev: string // "BOS"
}

type LeagueMeta = {
  sportPath: string
  leaguePath: string
  // Approximate season window (inclusive). endMonth < startMonth means the
  // window wraps across the new year (e.g. NFL runs Aug -> Feb).
  seasonWindow: { startMonth: number; startDay: number; endMonth: number; endDay: number }
}

const LEAGUE_META: Record<League, LeagueMeta> = {
  mlb: { sportPath: 'baseball', leaguePath: 'mlb', seasonWindow: { startMonth: 3, startDay: 15, endMonth: 11, endDay: 5 } },
  nfl: { sportPath: 'football', leaguePath: 'nfl', seasonWindow: { startMonth: 8, startDay: 1, endMonth: 2, endDay: 15 } },
  nba: { sportPath: 'basketball', leaguePath: 'nba', seasonWindow: { startMonth: 10, startDay: 1, endMonth: 6, endDay: 25 } },
  nhl: { sportPath: 'hockey', leaguePath: 'nhl', seasonWindow: { startMonth: 10, startDay: 1, endMonth: 6, endDay: 30 } },
}

export function isInSeason(league: League, now: Date = new Date()): boolean {
  const { startMonth, startDay, endMonth, endDay } = LEAGUE_META[league].seasonWindow
  const asNum = (m: number, d: number) => m * 100 + d
  const cur = asNum(now.getMonth() + 1, now.getDate())
  const start = asNum(startMonth, startDay)
  const end = asNum(endMonth, endDay)
  return start <= end ? cur >= start && cur <= end : cur >= start || cur <= end
}

export type GameResult = {
  status: 'final' | 'live'
  opponent: string
  opponentAbbrev: string
  isHome: boolean
  teamScore: number
  opponentScore: number
  isWin: boolean | null
  detail: string
  date: string
}

export type NextGame = {
  opponent: string
  opponentAbbrev: string
  isHome: boolean
  date: string
}

export type TeamScoreCard = {
  team: TeamOfInterest
  lastOrLiveGame: GameResult | null
  nextGame: NextGame | null
}

type EspnCompetitor = {
  homeAway: 'home' | 'away'
  winner?: boolean
  score?: { value: number; displayValue: string }
  team: { id: string; abbreviation: string; shortDisplayName: string }
}

type EspnEvent = {
  date: string
  competitions: Array<{
    status: { type: { state: 'pre' | 'in' | 'post'; completed: boolean; detail: string; shortDetail: string } }
    competitors: EspnCompetitor[]
  }>
}

function toGameResult(event: EspnEvent, teamId: string, status: 'final' | 'live'): GameResult | null {
  const comp = event.competitions[0]
  const self = comp.competitors.find((c) => c.team.id === teamId)
  const opp = comp.competitors.find((c) => c.team.id !== teamId)
  if (!self || !opp) return null
  const teamScore = self.score ? Number(self.score.value) : 0
  const opponentScore = opp.score ? Number(opp.score.value) : 0
  return {
    status,
    opponent: opp.team.shortDisplayName,
    opponentAbbrev: opp.team.abbreviation,
    isHome: self.homeAway === 'home',
    teamScore,
    opponentScore,
    isWin: status === 'final' ? self.winner ?? teamScore > opponentScore : null,
    detail: comp.status.type.shortDetail,
    date: event.date,
  }
}

function toNextGame(event: EspnEvent, teamId: string): NextGame | null {
  const comp = event.competitions[0]
  const self = comp.competitors.find((c) => c.team.id === teamId)
  const opp = comp.competitors.find((c) => c.team.id !== teamId)
  if (!self || !opp) return null
  return {
    opponent: opp.team.shortDisplayName,
    opponentAbbrev: opp.team.abbreviation,
    isHome: self.homeAway === 'home',
    date: event.date,
  }
}

async function fetchTeamScoreCard(team: TeamOfInterest): Promise<TeamScoreCard | null> {
  // The Zones hub and a zone's own detail page both call this for the same
  // team within seconds of each other during normal navigation — cache the
  // parsed result briefly so that doesn't mean two ~3MB ESPN fetches.
  return withTtlCache(`espn-schedule:${team.league}:${team.teamId}`, 60_000, async () => {
    const meta = LEAGUE_META[team.league]
    const url = `https://site.api.espn.com/apis/site/v2/sports/${meta.sportPath}/${meta.leaguePath}/teams/${team.teamId}/schedule`

    try {
      // The full-season schedule payload (~3MB) exceeds Next's 2MB data-cache
      // limit, so caching it would just fail silently on every request — fetch
      // fresh instead, which also suits live/recent score data better anyway.
      const res = await fetch(url, { cache: 'no-store' })
      if (!res.ok) return null
      const data = await res.json()
      const events: EspnEvent[] = data.events ?? []
      if (events.length === 0) return { team, lastOrLiveGame: null, nextGame: null }

      const live = events.find((e) => e.competitions[0]?.status.type.state === 'in')
      const completed = events
        .filter((e) => e.competitions[0]?.status.type.state === 'post')
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      const upcoming = events
        .filter((e) => e.competitions[0]?.status.type.state === 'pre')
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

      const lastOrLiveGame = live
        ? toGameResult(live, team.teamId, 'live')
        : completed[0]
          ? toGameResult(completed[0], team.teamId, 'final')
          : null

      const nextGame = upcoming[0] ? toNextGame(upcoming[0], team.teamId) : null

      return { team, lastOrLiveGame, nextGame }
    } catch {
      return null
    }
  })
}

// Returns one card per in-season team of interest. Out-of-season teams are
// omitted entirely, per product requirement.
export async function getScoresForTeams(teams: TeamOfInterest[]): Promise<TeamScoreCard[]> {
  const inSeason = teams.filter((t) => isInSeason(t.league))
  const results = await Promise.all(inSeason.map(fetchTeamScoreCard))
  return results.filter((r): r is TeamScoreCard => r !== null)
}
