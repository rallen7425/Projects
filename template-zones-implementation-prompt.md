# Distilled — Template Zones: Implementation Prompt

Read `CLAUDE.md` and `template-zones-plan.md` first. This is the concrete file-level scope for
building the plan — 4 new zone templates (Family, Health & Wellness, Interests, and a reactivated/
personalized Entertainment) added to the existing Default Zone Catalog, using only patterns and
sources already established in this codebase.

**Do not build:** youth sports data sourcing, school-district-specific content, any paid/signup-gated
API, or a real recommendation engine for Entertainment. See the plan's "Explicitly deferred" section
for the reasoning — if you think one of these is needed to make a zone useful, stop and ask rather
than substituting a workaround.

## Step 1 — Type/catalog additions (no schema migration needed)

- `types/index.ts`: extend `ZoneType` with `'family' | 'wellness' | 'interests'`. Add matching
  `ZONE_META` entries (label, shortLabel, color, bg, border — pick colors distinct from the existing
  7 and consistent with the existing token style in `styles/tokens.css`; add them there too as
  `--family`, `--wellness`, `--interests` following the existing `--sports`/`--local`/etc. pattern).
- `lib/zone-templates.ts`: add `family`, `wellness`, `interests` entries to `ZONE_TEMPLATES`
  (position 7, 8, 9), and update the existing `entertainment` entry with a `personalization: { kind:
  'genres', label: 'Genres' }` field. `ZoneTemplate`'s `personalization.kind` union needs `'genres' |
  'topic'` added alongside the existing `'teams' | 'areas' | 'industry'`. Give `wellness` a
  `specialCard: 'airquality'` (new value on that union) and `requiresZip: true` (it needs a home
  location for the air-quality fetch, same reason Local/Sports have it).
- Grep for every other `Record<ZoneType, ...>` site the 2026-07-14 Maine->News rename log calls out
  (`scripts/pipeline/types.ts`, `app/saved/SavedClient.tsx`'s zone filter list, `app/error.tsx`'s icon
  color, any `ZONE_GRADIENTS` duplicate) and add the 3 new types there too. Run `npx tsc --noEmit`
  after this step — the compiler will catch anything this list misses, same as that session's
  approach.

## Step 2 — Pipeline runners (`scripts/pipeline/index.ts`)

- **Family**: `fetchGuardian('lifeandstyle', 'family')` — check the Guardian Content API's tag list
  first (`content.guardianapis.com/tags?q=parenting`) for something narrower than the whole
  `lifeandstyle` section; use it if it exists and looks reasonably populated, otherwise fall back to
  the plain section with a keyword filter (`parent`, `kid`, `child`, `school`, `family` in
  headline/summary) before writing to `articles` — same substring-filter tradeoff already used
  elsewhere in this codebase (documented, not a new risk).
- **Wellness**: same investigation — look for a `wellbeing`/`health`/`fitness` Guardian tag distinct
  from Family's. If Family and Wellness end up drawing from the same section, apply complementary
  keyword filters so they don't produce near-identical content (Family: parenting/kids/school angle;
  Wellness: fitness/exercise/mental-health/nutrition angle).
- **Interests**: reuse `sources/googlenews.ts`'s `fetchGoogleNews(query, zoneType, sourceName?)`
  directly — for each enabled `interests` zone, read `config.topic` and call
  `fetchGoogleNews(topic, 'interests')`, same call shape Local Zone already makes per area. No new
  adapter file needed.
- **Entertainment**: no runner change — `fetchGuardian('culture', 'entertainment')` already exists.
  Genre personalization is a **read-time** filter (see Step 4), not an ingestion-time one, so every
  user's Entertainment zone still shares one content pool (matches this app's existing
  shared-article-pool architecture for every other zone).
- Respect every cost constraint already documented in CLAUDE.md: batch the Claude summarization call
  (these are new rows flowing through the same `enrich/summarize.ts` batch step, no per-article calls
  to add), cap each new runner at 15 articles, dedupe before any Claude/image-enrichment call, no
  NewsAPI.

## Step 3 — Air Quality special card (Wellness)

- `lib/air/openmeteo.ts` (new) — mirror `lib/weather/nws.ts`'s structure exactly: a plain fetch
  against `https://air-quality-api.open-meteo.com/v1/air-quality` with `latitude`/`longitude`
  query params (no key), returning current US AQI (or the PM2.5-derived index Open-Meteo provides)
  and UV index. Read lat/lng from the same `users`/`user_locations` data Local Zone already reads
  (don't add new location-collection UI — Wellness's `requiresZip` flag should reuse the existing
  Home Location flow the same way Sports/Local already do via `/zones/manage`'s inline zip prompt).
- Wrap the fetch in `lib/cache/ttlCache.ts`'s 60s TTL helper, same as `espn.ts`/`nws.ts`.
- `AirQualityCard` component in `app/zones/[zoneId]/ZoneDetailClient.tsx` (and duplicate into
  `InDepthClient.tsx`/`SummaryClient.tsx`/`ZonesHubClient.tsx` per this app's established per-file
  card-duplication convention, same as `ScoresCard`/`WeatherCard`) — dark surface, `--wellness`
  zone-color accent border/label, shows AQI + a plain-language descriptor (Good/Moderate/Unhealthy —
  use Open-Meteo's or the EPA's standard AQI bands) + UV index.
- Wire into `app/zones/[zoneId]/page.tsx` the same way Sports'/Local's special-card data fetching
  works: fetch only when `zoneType === 'wellness'` and a home location exists.

## Step 4 — Entertainment genre personalization

- `CustomizeSheet.tsx` gains a `genres` tab for Entertainment zones — multi-select chips from a fixed
  list (pick something reasonable for Guardian `culture` coverage: e.g. Film, TV, Music, Books, Theatre
  & Stage, Art & Design — Guardian's own culture sub-tags are a reasonable source list to check first
  rather than inventing one from scratch).
- Read-time filter in `lib/zonePreview.ts`'s `getZoneArticles`/`getZonePreview` (same place Sports'
  team-filtering already lives): if an Entertainment zone has `config.genres` set, filter/boost
  articles whose tags or headline/summary match a selected genre keyword, same
  substring-match-with-known-limitations approach as Sports' team matching — falls back to the
  unfiltered pool if no genres are configured or nothing matches (never show an empty zone because
  personalization filtered everything out — same "never show a genuinely empty result" precedent as
  Local Zone's primary/secondary area boosting, which never excludes, only re-ranks).

## Step 5 — Interests Customize UI

- `CustomizeSheet.tsx` gains a plain single-text-field tab for Interests zones (`config.topic`) —
  same shape as Work's industry field, not a multi-select. Optionally, pre-fill the field's
  placeholder/suggestion from the user's existing `user_tracks` topics (a nice-to-have convenience,
  not a hard dependency — Interests must work fine with a freshly-typed topic and no existing tracks).
- Turning on the Interests template from `/zones/manage` should prompt for this topic inline, the
  same way Local/Sports/Work already prompt for zip/industry on first enable.

## Step 6 — `/zones/manage` and Add Zone flow

- No structural change needed — the unified list already renders every `ZONE_TEMPLATES` entry as a
  toggle row (Part 5 of the 2026-08-22 session log). Confirm the 4 new templates appear correctly,
  toggle on/off cleanly, and their inline setup prompts (zip for Wellness, topic for Interests, genres
  for Entertainment) fire correctly on first enable.

## Verification (do this for each zone before moving to the next, not all at the end)

- Trigger the pipeline for just the new zone type (`POST /api/pipeline/trigger` with a scoped body if
  that's supported, or a full run) against real Guardian/Google News data — confirm real, on-topic
  articles land in `articles` with the correct `zone_type`, images/summaries/urgency populate
  normally, and dedupe works on a second run.
- For Wellness, hit the Open-Meteo endpoint directly first with a real lat/lng (e.g. the test
  profile's North Andover coordinates) to confirm the response shape before wiring the card.
- Load `/zones/manage`, turn each new template on (through its inline prompt), confirm a real zone
  row is created and content appears on its detail page via the generic template.
- For Entertainment, configure a couple of genres via Customize and confirm the read-time filter
  visibly changes which articles surface, without ever showing an empty zone.
- `npx tsc --noEmit`, lint, and a full `next build` clean, matching this repo's standing bar for every
  change.

## Update CLAUDE.md when done

Per this repo's own convention, add a dated Session log entry (what was built, real verification
evidence, files touched) and update "Current status" — this is explicitly the next priority item
named at the end of the 2026-08-27 session, so mark it done and set the next one (Onboarding) as the
new "Next session" pointer once this is verified and deployed.
