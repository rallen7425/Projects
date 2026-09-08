# Distilled — Template Zones: Plan

Companion to `template-zones-implementation-prompt.md`. Read `CLAUDE.md` first — this plan
builds strictly on the existing architecture (Default Zone Catalog in `lib/zone-templates.ts`,
the batch pipeline in `scripts/pipeline/`, the generic Breaking/Top Stories/Today/Tracking/More
template, live request-time fetches for Sports/Local's special cards) rather than introducing a
parallel system.

## What this adds

Four new selectable zone templates, on top of the existing 7 (Local, Sports, News, Tech, Finance,
Work, Entertainment — Finance and Entertainment currently have templates but no active zone for
the test profile):

1. **Family** — parenting/family-life content + school-relevant news, no special card at launch.
2. **Health & Wellness** — wellness/fitness content, with a new live special card (air quality + UV,
   reusing Local's home-location data — no new location UI needed).
3. **Interests** — a single user-named topic (e.g. "Guitar", "Golf", "Photography"), sourced the
   same way Local Zone sources its named areas (Google News RSS, no new adapter).
4. **Entertainment reactivated with real personalization** — the template already exists
   (`entertainment` -> Guardian `culture`) but has never had genre-level personalization or an
   active zone for the test profile. Add a `genres` config (same pattern as Sports' `teams`/Local's
   `areas`) and a keyword-based post-filter.

Also: no schema migration is strictly required. `articles.zone_type` is already a plain `text`
column (not a DB enum), so it accepts new values without a migration — see `CLAUDE.md`'s note that
`zone_type` stays valid harmlessly even for zone types with zero active users (e.g. `work` today).
The only "schema" changes are TypeScript-side (`ZoneType` union, `ZONE_META`, `ZONE_TEMPLATES`).

## Explicitly deferred, and why

- **Markets & Money / a Business zone** — out of scope, per earlier product discussion: real-time
  financial data has a very high competitive bar; a business-focused app or personal/business mode
  is a longer-term, separate idea, not a Distilled zone. (Finance Zone already exists as a template
  using Alpha Vantage + Guardian business, and stays as-is — this is about not going further, e.g.
  no per-stock watchlist zone.)
- **Live youth sports scores/schedules for Family** — no centralized public API for rec/travel
  leagues (unlike Sports Zone's ESPN-backed pro/college coverage). Family launches as a content-only
  zone (Guardian `lifeandstyle` + RSS), no special card, no youth-sports data source. Revisit only if
  a real data source is identified later — don't stub a fake API for it.
- **School district-specific content** — no existing adapter can target one specific district. Family
  Zone's content is general parenting/family-life content, not district-specific announcements. If
  district-level content becomes a priority later, that's a new adapter (likely a per-district RSS or
  scrape), not part of this pass.
- **Interests as a Tracking-engine-backed feature** — the original design conversation floated
  "Interests promotes a Tracking topic into the Briefing." In this codebase, Zones and Tracking
  (`user_tracks`) are parallel systems with a loose `zone_id` link, not a shared content pipeline.
  Rebuilding Interests as a true Tracking-to-Zone promotion would mean giving `user_tracks` its own
  pipeline runner — a bigger architectural change. **Simpler v1, consistent with existing patterns:**
  Interests is a zone like Work (one config field — here, `topic` instead of `industry`), sourced via
  the same Google News RSS adapter Local Zone already uses for named areas. The Customize sheet can
  optionally pre-fill from an existing tracked topic as a convenience, but the zone doesn't depend on
  the Tracking table to function.

## New `ZoneType` values and sourcing

| Type | Sources | Personalization | Special card |
|---|---|---|---|
| `family` | Guardian `lifeandstyle` (parenting angle) | none (v1) | none |
| `wellness` | Guardian `lifeandstyle` (fitness/wellness angle — same section as Family; differentiate by keyword filter, or use a second Guardian tag if one fits better on inspection) | none required; optional 1-2 interest tags (future) | `airquality` (new) |
| `interests` | Google News RSS, keyed on the zone's `config.topic` | `topic` (single text field, like Work's `industry`) | none |
| `entertainment` | Guardian `culture` (existing, unchanged) | `genres` (new — multi-select from a fixed list, like Sports' `teams`) | none |

**Family vs. Wellness content overlap risk:** both draw from Guardian's `lifeandstyle` section.
Before wiring both runners, check `content.guardianapis.com`'s available tags/sections for a
cleaner split (e.g. a `wellbeing` or `health` tag scoped narrower than all of `lifeandstyle`) —
if nothing cleaner exists, differentiate with a keyword-based post-filter the same way
Sports/Local already do substring-based content classification elsewhere in this codebase (an
accepted, documented tradeoff pattern, not a new one).

**Air quality special card** — new live, request-time fetch (`lib/air/openmeteo.ts`), following
the exact pattern of `lib/weather/nws.ts`: free, no API key, `air-quality-api.open-meteo.com`,
keyed off the same lat/lng already stored on `users`/`user_locations` from the Home Location
editor — no new location UI. Cache with the existing `lib/cache/ttlCache.ts` 60s TTL helper, same
as ESPN/NWS.

## Rendering

All four new zone types render through the existing **generic template**
(`app/zones/[zoneId]/page.tsx` + `ZoneDetailClient.tsx`'s fallback branch — Breaking / Top Stories /
Today, paginated / zone-filtered Tracking / More) with zero new branching, except Wellness gets a
`specialCard` the same way Sports/Local do (a new `AirQualityCard` component, following
`ScoresCard`/`WeatherCard`'s exact visual pattern — dark surface, zone-color accent, per this app's
established per-file-duplication convention for these cards).

## Rollout / verification approach

Follow the existing pattern documented throughout `CLAUDE.md`'s Session log: build one zone type at
a time, verify against real live data (real Guardian articles, real Google News results, a real
Open-Meteo air-quality response) before moving to the next, and do NOT deploy DB-incompatible code
gaps — since `zone_type` needs no migration here, this specific risk (documented in the 2026-07-14
session log) doesn't apply, but the same "verify live pipeline output before considering it done"
discipline should.

## Out of scope for this pass (explicit)

- Youth sports data sourcing (Family) — no viable free source identified.
- School-district-specific content (Family).
- Any new paid API or API requiring a signup/approval delay — Open-Meteo's air-quality endpoint is
  free/keyless; if it turns out to need a key or is unreliable, stop and ask before reaching for a
  paid alternative (matches the existing "free sources only" cost-constraint rule in CLAUDE.md).
- Real recommendation-engine-style genre learning for Entertainment — `genres` is a fixed multi-select
  configured once via Customize, same UX as Sports' Teams of Interest, not a self-tuning system.
