// Static state -> broad US region lookup, used to derive the Local Zone's
// "region" tier (e.g. Massachusetts -> New England) from a geocoded zip's state.

const REGION_BY_STATE: Record<string, string> = {
  // New England
  ME: 'New England', NH: 'New England', VT: 'New England',
  MA: 'New England', RI: 'New England', CT: 'New England',
  // Mid-Atlantic
  NY: 'Mid-Atlantic', NJ: 'Mid-Atlantic', PA: 'Mid-Atlantic', DE: 'Mid-Atlantic',
  MD: 'Mid-Atlantic', DC: 'Mid-Atlantic',
  // Southeast
  VA: 'Southeast', WV: 'Southeast', NC: 'Southeast', SC: 'Southeast',
  GA: 'Southeast', FL: 'Southeast', AL: 'Southeast', MS: 'Southeast',
  TN: 'Southeast', KY: 'Southeast', LA: 'Southeast', AR: 'Southeast',
  // Midwest
  OH: 'Midwest', MI: 'Midwest', IN: 'Midwest', IL: 'Midwest', WI: 'Midwest',
  MN: 'Midwest', IA: 'Midwest', MO: 'Midwest', ND: 'Midwest', SD: 'Midwest',
  NE: 'Midwest', KS: 'Midwest',
  // South Central / Southwest
  TX: 'South Central', OK: 'South Central', NM: 'Southwest', AZ: 'Southwest',
  // Mountain West
  CO: 'Mountain West', UT: 'Mountain West', NV: 'Mountain West', ID: 'Mountain West',
  MT: 'Mountain West', WY: 'Mountain West',
  // Pacific
  CA: 'Pacific', OR: 'Pacific', WA: 'Pacific', AK: 'Pacific', HI: 'Pacific',
}

export function regionForState(stateAbbr: string): string | null {
  return REGION_BY_STATE[stateAbbr.toUpperCase()] ?? null
}
