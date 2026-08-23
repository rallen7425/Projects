// Curated metro -> major-league-team mapping, used to default the Sports
// Zone's Teams of Interest to the user's nearest metro's teams at zone
// creation (same "derive from zip" precedent as Local Zone's areas). Keyed
// against lib/geo/metros.ts' METROS list by "{name}, {state}" — only metros
// with an actual major-league team are listed; the rest resolve to [].
//
// Team identity follows current (2026) franchise locations, e.g. the
// Athletics' temporary Sacramento home and Utah's NHL team (Mammoth).

import type { TeamOfInterest } from './espn'
import { TEAM_CATALOG } from './teams'

type TeamRef = { league: TeamOfInterest['league']; abbrev: string }

function resolveTeams(refs: TeamRef[]): TeamOfInterest[] {
  return refs
    .map((r) => TEAM_CATALOG.find((t) => t.league === r.league && t.abbrev === r.abbrev))
    .filter((t): t is TeamOfInterest => !!t)
}

const METRO_TEAM_REFS: Record<string, TeamRef[]> = {
  'Boston, MA': [{ league: 'mlb', abbrev: 'BOS' }, { league: 'nfl', abbrev: 'NE' }, { league: 'nba', abbrev: 'BOS' }, { league: 'nhl', abbrev: 'BOS' }],
  'New York, NY': [
    { league: 'mlb', abbrev: 'NYY' }, { league: 'mlb', abbrev: 'NYM' },
    { league: 'nfl', abbrev: 'NYG' }, { league: 'nfl', abbrev: 'NYJ' },
    { league: 'nba', abbrev: 'NY' }, { league: 'nba', abbrev: 'BKN' },
    { league: 'nhl', abbrev: 'NYR' }, { league: 'nhl', abbrev: 'NYI' }, { league: 'nhl', abbrev: 'NJ' },
  ],
  'Philadelphia, PA': [{ league: 'mlb', abbrev: 'PHI' }, { league: 'nfl', abbrev: 'PHI' }, { league: 'nba', abbrev: 'PHI' }, { league: 'nhl', abbrev: 'PHI' }],
  'Washington, DC': [{ league: 'mlb', abbrev: 'WSH' }, { league: 'nfl', abbrev: 'WSH' }, { league: 'nba', abbrev: 'WSH' }, { league: 'nhl', abbrev: 'WSH' }],
  'Baltimore, MD': [{ league: 'mlb', abbrev: 'BAL' }, { league: 'nfl', abbrev: 'BAL' }],
  'Pittsburgh, PA': [{ league: 'mlb', abbrev: 'PIT' }, { league: 'nfl', abbrev: 'PIT' }, { league: 'nhl', abbrev: 'PIT' }],
  'Buffalo, NY': [{ league: 'nfl', abbrev: 'BUF' }, { league: 'nhl', abbrev: 'BUF' }],
  'Atlanta, GA': [{ league: 'mlb', abbrev: 'ATL' }, { league: 'nfl', abbrev: 'ATL' }, { league: 'nba', abbrev: 'ATL' }],
  'Miami, FL': [{ league: 'mlb', abbrev: 'MIA' }, { league: 'nfl', abbrev: 'MIA' }, { league: 'nba', abbrev: 'MIA' }, { league: 'nhl', abbrev: 'FLA' }],
  'Orlando, FL': [{ league: 'nba', abbrev: 'ORL' }],
  'Tampa, FL': [{ league: 'mlb', abbrev: 'TB' }, { league: 'nfl', abbrev: 'TB' }, { league: 'nhl', abbrev: 'TB' }],
  'Jacksonville, FL': [{ league: 'nfl', abbrev: 'JAX' }],
  'Charlotte, NC': [{ league: 'nfl', abbrev: 'CAR' }, { league: 'nba', abbrev: 'CHA' }],
  'Raleigh, NC': [{ league: 'nhl', abbrev: 'CAR' }],
  'Nashville, TN': [{ league: 'nfl', abbrev: 'TEN' }, { league: 'nhl', abbrev: 'NSH' }],
  'Memphis, TN': [{ league: 'nba', abbrev: 'MEM' }],
  'New Orleans, LA': [{ league: 'nfl', abbrev: 'NO' }, { league: 'nba', abbrev: 'NO' }],
  'Chicago, IL': [{ league: 'mlb', abbrev: 'CHC' }, { league: 'mlb', abbrev: 'CHW' }, { league: 'nfl', abbrev: 'CHI' }, { league: 'nba', abbrev: 'CHI' }, { league: 'nhl', abbrev: 'CHI' }],
  'Detroit, MI': [{ league: 'mlb', abbrev: 'DET' }, { league: 'nfl', abbrev: 'DET' }, { league: 'nba', abbrev: 'DET' }, { league: 'nhl', abbrev: 'DET' }],
  'Cleveland, OH': [{ league: 'mlb', abbrev: 'CLE' }, { league: 'nfl', abbrev: 'CLE' }, { league: 'nba', abbrev: 'CLE' }],
  'Columbus, OH': [{ league: 'nhl', abbrev: 'CBJ' }],
  'Cincinnati, OH': [{ league: 'mlb', abbrev: 'CIN' }, { league: 'nfl', abbrev: 'CIN' }],
  'Indianapolis, IN': [{ league: 'nfl', abbrev: 'IND' }, { league: 'nba', abbrev: 'IND' }],
  'Milwaukee, WI': [{ league: 'mlb', abbrev: 'MIL' }, { league: 'nba', abbrev: 'MIL' }],
  'Minneapolis, MN': [{ league: 'mlb', abbrev: 'MIN' }, { league: 'nfl', abbrev: 'MIN' }, { league: 'nba', abbrev: 'MIN' }, { league: 'nhl', abbrev: 'MIN' }],
  'St. Louis, MO': [{ league: 'mlb', abbrev: 'STL' }, { league: 'nhl', abbrev: 'STL' }],
  'Kansas City, MO': [{ league: 'nfl', abbrev: 'KC' }, { league: 'mlb', abbrev: 'KC' }],
  'Dallas, TX': [{ league: 'nfl', abbrev: 'DAL' }, { league: 'nba', abbrev: 'DAL' }, { league: 'nhl', abbrev: 'DAL' }, { league: 'mlb', abbrev: 'TEX' }],
  'Houston, TX': [{ league: 'mlb', abbrev: 'HOU' }, { league: 'nfl', abbrev: 'HOU' }, { league: 'nba', abbrev: 'HOU' }],
  'San Antonio, TX': [{ league: 'nba', abbrev: 'SA' }],
  'Oklahoma City, OK': [{ league: 'nba', abbrev: 'OKC' }],
  'Denver, CO': [{ league: 'nfl', abbrev: 'DEN' }, { league: 'nba', abbrev: 'DEN' }, { league: 'nhl', abbrev: 'COL' }, { league: 'mlb', abbrev: 'COL' }],
  'Salt Lake City, UT': [{ league: 'nba', abbrev: 'UTAH' }, { league: 'nhl', abbrev: 'UTAH' }],
  'Phoenix, AZ': [{ league: 'nfl', abbrev: 'ARI' }, { league: 'nba', abbrev: 'PHX' }, { league: 'mlb', abbrev: 'ARI' }],
  'Las Vegas, NV': [{ league: 'nhl', abbrev: 'VGK' }, { league: 'nfl', abbrev: 'LV' }],
  'Los Angeles, CA': [
    { league: 'nfl', abbrev: 'LAR' }, { league: 'nfl', abbrev: 'LAC' },
    { league: 'nba', abbrev: 'LAL' }, { league: 'nba', abbrev: 'LAC' },
    { league: 'nhl', abbrev: 'LA' }, { league: 'nhl', abbrev: 'ANA' },
    { league: 'mlb', abbrev: 'LAD' }, { league: 'mlb', abbrev: 'LAA' },
  ],
  'San Diego, CA': [{ league: 'mlb', abbrev: 'SD' }],
  'San Francisco, CA': [{ league: 'nfl', abbrev: 'SF' }, { league: 'nba', abbrev: 'GS' }, { league: 'mlb', abbrev: 'SF' }],
  'Sacramento, CA': [{ league: 'nba', abbrev: 'SAC' }, { league: 'mlb', abbrev: 'ATH' }],
  'San Jose, CA': [{ league: 'nhl', abbrev: 'SJ' }],
  'Portland, OR': [{ league: 'nba', abbrev: 'POR' }],
  'Seattle, WA': [{ league: 'nfl', abbrev: 'SEA' }, { league: 'mlb', abbrev: 'SEA' }, { league: 'nhl', abbrev: 'SEA' }],
}

export function getDefaultTeamsForMetro(metroName: string, metroState: string): TeamOfInterest[] {
  const refs = METRO_TEAM_REFS[`${metroName}, ${metroState}`]
  if (!refs) return []
  return resolveTeams(refs)
}
