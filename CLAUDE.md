# Distilled — CLAUDE.md

**App names:** "Distilled" (official) · "Distilled News App" (full)

---

## Deployment & access

| | |
|---|---|
| **Live site** | https://distilled-news.vercel.app |
| **GitHub repo** | git@github.com:rallen7425/Projects.git |
| **Branch** | main |
| **Vercel project** | rick-allen-s-projects/projects-yg1p |
| **Local dev** | `npm run dev` → http://localhost:3000 |

> **Deploy:** Always run `npx vercel --prod` manually after pushing. GitHub auto-deploy via Vercel is unreliable. The `.vercel` folder is present and linked.

---

## What this app is

Distilled is a mobile-first, AI-powered personal news briefing app. The design goal is **signal over noise** — a highly personalized daily briefing organized around the user's own "Zones" (topic areas), with automated content ingestion, AI summarization, and cross-device sync.

**Target platforms:** Web (primary), PWA (installable), App Store (future via Expo/React Native). All user data is server-side so the experience is identical on mobile, tablet, and desktop.

**Core screens:**
- **Home / In-Depth View** (`/`) — the default landing page (changed 2026-07-12; previously this was the compact "Today" list). Urgency-tiered briefing: **Breaking** (urgent + ≤12h old, only appears when something qualifies), **Top Stories** (cross-zone, always ≥3), **Your Zones**, **Today** (expanded "Story Card" format — full-bleed hero, AI Snapshot, "Full Coverage →" link — paginated 5 at a time via a "View More" row), **Tracking** (one card per tracked topic).
- **Summary View** (`/summary`) — the original compact list-style briefing, reachable via the hamburger menu. Shares the same Breaking/Top Stories/Your Zones/Tracking sections as Home, but Today (+ a separate "More" section, not paginated) render as compact `StoryItem` rows instead of expanded Story Cards.
- **Zones** (`/zones`) — hub showing all user zones as cards with live hero stats/schedules/headlines; tap into any zone for full story list
- **Tracking** (`/tracking`) — dedicated page listing every tracked topic with live article carousels (distinct from the Tracking *section* that now also appears on Home/Summary)
- **Read Later** (`/saved`) — bookmarked articles, filterable by zone
- **Menu** (hamburger icon, 5th item in the bottom nav) — Profile, My Zones, Tracking & Saved, Summary View

---

## Tech stack

| Layer | Technology | Notes |
|---|---|---|
| Framework | Next.js 14 (App Router) | Already in place |
| Styling | Tailwind CSS + CSS custom properties | Tokens in `styles/tokens.css` |
| Database + Auth | Supabase (Postgres + Supabase Auth) | Email + Google OAuth |
| Content pipeline | GitHub Actions (cron) | Calls Vercel API route; avoids Vercel Pro requirement |
| AI summarization | Anthropic Claude API (Haiku model) | Batched calls only — never per-article |
| Hosting | Vercel Hobby (free) | Pipeline runs in GitHub Actions, not Vercel cron |

---

## Design system

**The design spec lives in HTML prototypes.** Before building any component or page, read the relevant prototype file. All design decisions — spacing, color, component structure, interaction patterns — are defined there.

**Prototype files location:** `prototypes/` (in this repo)

| Prototype | What it defines |
|---|---|
| `prototypes/distilled-v3-concept.html` | Today page, StoryItem layout, BottomNav, TrackModal |
| `prototypes/distilled-zones.html` | Zone hub, ZoneCard (3 templates), two-line ZoneSubNav |
| `prototypes/distilled-zone-detail.html` | Zone detail page, QuickLook strip, ZoneSubNav active states |
| `prototypes/distilled-tracking.html` | Tracking page, topic header, story card carousel, filter pills |
| `prototypes/distilled-read-later.html` | Read Later page, bookmark behavior, zone filter pills |
| `prototypes/distilled-story-detail.html` | Story detail, hero image, AI summary, related stories |

### Design tokens (CSS custom properties)

```css
/* Base */
--bg:            #09090e
--surface:       #111117
--surface-2:     #17171f
--surface-3:     #1e1e28
--border:        rgba(255,255,255,0.06)
--border-mid:    rgba(255,255,255,0.11)
--text:          #eeeef2
--text-2:        rgba(238,238,242,0.58)
--text-3:        rgba(238,238,242,0.30)

/* Zone colors */
--sports:        #52C97A
--local:         #5B9CF6
--news:          #EF9F27
--tech:          #A78BFA
--finance:       #34D399

/* Darkened zone colors — for solid-fill live-data cards (Scores, Weather) where
   white text needs real contrast, not the pill-scale zone color */
--sports-dark:   #098533
--local-dark:    #163E77

/* Primary (interactive elements — always white, never zone color) */
--primary:        #ffffff
--primary-text:   #0a0a0f
--primary-subtle: rgba(255,255,255,0.08)
--primary-border: rgba(255,255,255,0.18)
```

### Key design rules
- Zone colors are used **only for semantic labels** (pills, accents, indicators) — never as backgrounds for interactive elements
- All core interactive elements (buttons, active states) use `--primary` (white)
- The bottom nav is a floating pill with blur backdrop
- Story item layout: meta row (zone pill + tag + time + save/track buttons) sits **above** the headline
- Zone sub-nav uses **two-line labels** (zone name on line 1, "Zone" on line 2), `flex: 1` on each tab (no overflow scroll), single color per tab (both lines same color)

---

## Database schema

```sql
-- Core user record
create table users (
  id           uuid primary key default gen_random_uuid(),
  email        text unique not null,
  zip_code     text,
  display_name text,
  industry     text,           -- for Work Zone template
  created_at   timestamptz default now()
);

-- User's zone configuration
create table zones (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references users(id) on delete cascade,
  type        text not null,   -- 'sports' | 'local' | 'news' | 'tech' | 'finance' | 'work' | 'entertainment'
  template_id text,            -- which starter template was used
  config      jsonb default '{}',  -- zone-specific settings (teams, industry, etc.)
  position    int default 0,
  enabled     boolean default true,
  created_at  timestamptz default now()
);

-- Processed articles from pipeline
create table articles (
  id             uuid primary key default gen_random_uuid(),
  external_id    text unique not null,   -- hash of (source_url + headline) for dedup
  headline       text not null,
  summary        text,                   -- AI-generated, 2–4 sentences
  image_url      text,
  source_name    text,
  source_url     text,
  published_at   timestamptz,
  urgency_score  int default 1,          -- 1–5, set by Claude
  zone_type      text,                   -- which zone this article belongs to
  tags           jsonb default '[]',     -- e.g. ["Celtics", "NBA Draft"]
  created_at     timestamptz default now()
);

-- User saves (Read Later)
create table user_saves (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references users(id) on delete cascade,
  article_id uuid references articles(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, article_id)
);

-- User tracked topics
create table user_tracks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references users(id) on delete cascade,
  topic       text not null,
  zone_id     uuid references zones(id) on delete set null,
  deadline_at timestamptz,
  created_at  timestamptz default now()
);

-- Dynamic QuickLook stats per zone (updated by pipeline)
create table zone_quicklook (
  id         uuid primary key default gen_random_uuid(),
  zone_type  text not null,
  label      text not null,
  value      text not null,
  sub        text,
  position   int default 0,
  updated_at timestamptz default now()
);
```

**RLS policies:** Every table except `articles` and `zone_quicklook` requires `auth.uid() = user_id`. Articles and quicklook are readable by all authenticated users.

---

## Content pipeline

### Architecture

```
GitHub Actions (cron: every hour)
  └── calls POST /api/pipeline/trigger (secret-protected)
        └── for each zone:
              1. Fetch raw articles from source adapters
              2. Deduplicate against articles table (skip known external_ids)
              3. Extract OG images for articles missing imageUrl
              4. Batch new articles → single Claude Haiku call → summaries + urgency scores + tags
              5. Write to Supabase articles table
              6. Update zone_quicklook stats
```

### Source adapters (all free)

| Zone | Source | API/Method |
|---|---|---|
| All news | The Guardian | Guardian API (free, images included) |
| All news | Curated RSS | RSS parser (`rss-parser` npm package) |
| Local Zone weather | NWS | `api.weather.gov` — no key, zip → coordinates via `lib/geo/zip.ts` (`api.zippopotam.us`). Live-fetched per request (Weather Card), not pipeline-stored — see `lib/weather/nws.ts` |
| Local Zone news (community/metro/region) | Google News RSS search | `news.google.com/rss/search?q=...` — no key, per-area query (town/metro/region name). See `scripts/pipeline/sources/googlenews.ts` |
| Sports | ESPN + team RSS | Public RSS feeds (no API key) |
| Finance | Alpha Vantage | Free tier (25 calls/day — sufficient for indices) |
| Images (fallback) | OG extraction | `cheerio` scrapes `og:image` from article URL — skipped for Google News links (see Known issues) |
| Images (last resort) | Unsplash | Unsplash API topic match (50 req/hour free) |

### Cost constraints — must be enforced in code

1. **Never call Claude API per-article.** Always batch: collect all new articles for a run into one prompt, return JSON array of `{id, summary, urgency, tags}`. Max 20 articles per batch call.
2. **Deduplicate before any API call.** Check `external_id` against Supabase before fetching OG images or calling Claude.
3. **Cap articles per zone per run: 15.** Fetch top 15 newest, skip the rest.
4. **Do not store article body text.** Store only: headline, summary (AI), image_url, source_url, source_name, published_at, urgency_score, tags, zone_type.
5. **Do not use NewsAPI.** Terms prohibit production use on free tier; paid tier is $449/month.

### Pipeline file structure

```
scripts/pipeline/
  index.ts          ← orchestrator (called by API route)
  sources/
    guardian.ts     ← Guardian API adapter
    rss.ts          ← generic RSS adapter
    googlenews.ts   ← Google News RSS search adapter (Local Zone community/metro/region)
    sports.ts       ← ESPN + team RSS adapter
    finance.ts      ← Alpha Vantage adapter
  enrich/
    images.ts       ← OG image extraction with cheerio (skips news.google.com links)
    summarize.ts    ← batched Claude Haiku calls
  write.ts          ← dedup check + Supabase upsert
  types.ts          ← shared RawArticle and ProcessedArticle types

lib/
  geo/
    zip.ts          ← zip → lat/lng/city/state geocoding (api.zippopotam.us)
    metros.ts       ← curated major-metro list + nearestMetro() haversine lookup
    regions.ts      ← state → broad US region lookup (e.g. MA → New England)
  weather/
    nws.ts          ← live NWS fetch for the Local Zone's Weather Card (not pipeline-stored)

app/api/pipeline/
  trigger/route.ts  ← POST endpoint called by GitHub Actions (verify CRON_SECRET header)

.github/workflows/
  pipeline.yml      ← cron schedule, calls trigger endpoint
```

### Normalized article type

```typescript
type RawArticle = {
  externalId: string       // hash of (sourceUrl + headline)
  headline: string
  bodySnippet?: string     // first 500 chars only, for Claude context
  imageUrl?: string
  sourceUrl: string
  sourceName: string
  publishedAt: string
  zoneType: ZoneType
}
```

---

## Zone templates

Zone templates live in `lib/zone-templates.ts`. Each maps a template key to a `ZoneType` and pipeline sources.

**Note (2026-07-14): `'maine'` was retired and replaced by `'news'`.** The old `headlines` template (Maine-specific RSS: Portland Press Herald, Bangor Daily News) is gone — its zone type, `ZONE_META` entry, `ZONE_GRADIENTS` key, and pipeline runner were fully renamed to `'news'`, refocused on National/Global content (Guardian `world` + `us-news` sections). This wasn't a data migration — old `zone_type='maine'` articles were Maine-specific, not national/global, so they were deleted (766 rows) rather than reassigned. The user's actual interest in Maine now lives as a secondary **community area on Local Zone** (Wells, ME) instead of its own zone — see below. New users get `news` + `tech` zones auto-created via `initializeNewUser()` in `lib/user-init.ts`.

```typescript
// lib/zone-templates.ts — abbreviated
news      → type: 'news'    // National/Global — Guardian 'world' + 'us-news' sections
tech      → type: 'tech'    // Guardian tech + HN RSS
sports    → type: 'sports'  // ESPN RSS (requiresZip)
local     → type: 'local'   // Google News RSS (community/metro/region) + live NWS weather (requiresZip)
finance   → type: 'finance' // Alpha Vantage + Guardian finance — no active zone for this test user as of 2026-07-14, template stays valid for future rebuilds
work      → type: 'work'    // Guardian money/careers (requiresIndustry) — NOT 'business'; finance uses that section
entertainment → type: 'entertainment' // Guardian culture — no active zone for this test user as of 2026-07-14, template stays valid for future rebuilds
```

**Local Zone personalization (added 2026-07-13, extended 2026-07-14):** `zones.config` for a `local` zone holds `{ areas: LocalArea[] }` — up to 3 default areas (community/metro/region, derived from zip via `lib/geo/*`) plus up to 3 user-added extra community/metro areas. The test profile's local zone now has 4 areas total: North Andover/Boston/New England (defaults) + Wells, ME 04090 (secondary community area, added 2026-07-14 — see Session log). Same `zones.config` jsonb pattern already used for Sports' `{ teams: TeamOfInterest[] }`. See `types/index.ts` for the `LocalArea` shape.

**Generic zone template (added 2026-07-14):** any zone type without its own specific branch in `ZoneDetailClient.tsx` (i.e. anything except Sports and Local) gets a shared template: Breaking (if any) → Top Stories (horizontal `TrackCard` scroll) → Today (paginated `StoryCard` list, 5-at-a-time, capped at 15) → Tracking (zone-filtered) → More (whatever's left beyond Today's cap, unpaginated). Currently used by News and Tech zones, and would apply automatically to Finance/Work/Entertainment if any of those are rebuilt later — this was a deliberate architectural choice (the fallback `else` branch was upgraded in place, not hardcoded to specific zone types).

---

## Current status

**Phase 10 deployed — 4-zone test profile (Sports/Local/News/Tech), zone-preview personalization, generic Breaking/Top Stories/Today/Tracking/More template (2026-07-14).**

All V2 code has been deleted. The full app is deployed at https://distilled-news.vercel.app, running on the shared Rocky Coast Labs Supabase platform (see Infrastructure below). This session's work (2026-07-14) — zone-preview personalization reaching Home/Summary/Zones-hub, and the 4-zone restructure (News Zone replacing Maine, Wells ME added to Local, Finance/Entertainment deleted) — is deployed as of commit `a6d70d3`.

**Deploy urgency note:** the one-off scripts that restructured this session's DB state (deleting the Maine/Finance/Entertainment zones, creating the News zone) ran against the shared production Supabase DB *before* the matching code was deployed — since the old deployed code's `ZONE_META` had no `'news'` entry, any real user hitting a `type: 'news'` zone in that window got a hard crash ("Something went wrong"). Confirmed and fixed by deploying immediately once reported. **Lesson:** when a session's DB changes (new zone types, deleted zones) aren't backward-compatible with the currently-deployed code, deploy the matching code *before or immediately after* running the DB migration script — don't leave that gap open, even mid-session.

### What's been built

| Phase | What | Status |
|---|---|---|
| 1 | Design system, components (`components/ui/`, `styles/tokens.css`) | ✅ Done |
| 2 | Supabase schema (6 tables), RLS policies, `types/supabase.ts` | ✅ Done |
| 3 | Content pipeline — Guardian, RSS, NWS weather, ESPN, Alpha Vantage, Claude Haiku summarization | ✅ Done |
| 4 | Auth — email/password sign-up/sign-in, OAuth callback, `middleware.ts`, `initializeNewUser` | ✅ Done |
| 5 | All 6 pages wired to live Supabase: Today, Zones hub, Zone detail, Story detail, Tracking, Read Later | ✅ Done |
| 6 | Onboarding flow | ❌ Not built — deliberately last priority, see "Next session" |
| 7 | Home page restructure — hamburger menu, Breaking/Top Stories tiers, redesigned Tracking (topic cards), story dedup, In-Depth View promoted to `/`, legacy view moved to `/summary` | ✅ Done 2026-07-12 |
| 8 | Sports Zone personalization — Scores Card (live scores via ESPN API), Updates (game-specific recaps/previews), team-prioritized Top Stories, sports-filtered Tracking, More section | ✅ Done 2026-07-12 |
| 9 | Local Zone personalization — community/metro/region tiers derived from zip, Weather Card (live NWS), Breaking/Top Stories/Today/Tracking (Home's format, not Sports') | ✅ Done 2026-07-13 |
| 10 | Zone-preview personalization everywhere (Home, Summary, Zones hub) + 4-zone restructure — News Zone replaces Maine, Wells ME added to Local, Finance/Entertainment deleted, generic Breaking/Top Stories/Today/Tracking/More template for non-Sports/Local zones | ✅ Done 2026-07-14 |
| — | In-app embedded reader for "Full Coverage" source links (replaces `target="_blank"`), with an interstitial fallback for sites that block framing | ✅ Done 2026-07-13 |
| — | Migrate onto shared Rocky Coast Labs Supabase platform, verify end-to-end | ✅ Done 2026-07-10 |

### Route inventory

```
/                          Home / In-Depth View — Breaking, Top Stories, Your Zones, paginated Today, Tracking
                            (app/page.tsx + app/InDepthClient.tsx)
/summary                   Summary View — same sections, compact StoryItem rows for Today + a More section
                            (app/summary/page.tsx + app/summary/SummaryClient.tsx)
/zones                     Zones hub — user's zones as cards with live hero data, team/area-aware previews (see
                            lib/zonePreview.ts) and a live weather stat-hero for Local Zone
/zones/[zoneId]            Zone detail — expanded Story Card format matching Home (zoneId = zone UUID). Sports zone:
                            Scores Card, Updates (game-specific), team-prioritized Top Stories, sports-filtered Tracking,
                            More (general news). Local zone: Weather Card (live NWS), Breaking (if any), Top Stories,
                            Today (paginated 5-at-a-time, same as Home), local-filtered Tracking — mirrors Home's own
                            section format, not Sports' Updates/More structure. Every other zone type (News, Tech, and
                            any future Finance/Work/Entertainment rebuild): the same generic template — Breaking (if
                            any), Top Stories (horizontal scroll), Today (paginated, capped at 15), zone-filtered
                            Tracking, More (whatever's left beyond the cap).
/zones/[zoneId]/story/[storyId]  Story detail / "Detailed view" (zoneId = zone TYPE string e.g. 'sports')
/zones/[zoneId]/story/[storyId]/read  Embedded in-app reader for a "Full Coverage" source link — iframe if the
                            source allows framing (checked via X-Frame-Options/CSP frame-ancestors), else an
                            interstitial with "Open in Browser" / "Back to Story"
/tracking                  Tracked topics with article carousels
/saved                     Read Later with zone filter pills
/auth/signin               Email + Google sign-in
/auth/signup               Email sign-up → "check your email" confirmation screen
/auth/callback              OAuth + email confirmation handler
/profile                   Profile page with sign out
/api/pipeline/trigger      POST — runs content pipeline (requires x-cron-secret header)
```

**URL asymmetry to be aware of:** Zone detail uses the zone's database UUID (`/zones/{uuid}`). Story detail uses zone type string (`/zones/sports/story/{uuid}`). This is intentional — stories link directly without knowing the user's zone UUID.

**`/` and `/summary` are near-duplicates, not two independent implementations.** Both pages call the same server-side selection pipeline (`selectBreakingStories`, `selectTopStories`, `dedupeStories` in `lib/articleUtils.ts`) and share the same Breaking/Top Stories/Your Zones/Tracking sections. The only real difference is how the remaining "Today" articles render: `InDepthClient.tsx` uses the expanded `StoryCard` component (paginated, no separate More section); `SummaryClient.tsx` uses the compact `StoryItem` row (capped at 5 for Today, everything else falls into a separate More section). Keep both files' Breaking/Top Stories/Tracking JSX in sync when changing one — they were deliberately kept as separate files rather than a shared component to match how this app's client components have been built throughout (see design system notes below).

### Infrastructure

- **Supabase project:** `rocky-coast-labs` (ref `kywdezqgrtpzuecxxvfc`, us-east-1) — shared across the Rocky Coast Labs portfolio, one schema per app. Distilled's data lives in the **`distilled` schema**, not `public`. Migrated 2026-07-10 from a standalone project (`qyjkqfgodgnjlvjdyuci`, kept paused as a dormant backup, not in use).
- All three Supabase clients (`lib/supabase/client.ts`, `server.ts`, `service.ts`) target the schema explicitly via `db: { schema: 'distilled' }` — don't remove that or queries silently hit (nonexistent) `public.*` instead.
- `types/supabase.ts` is generated against the `distilled` schema: `supabase gen types typescript --project-id kywdezqgrtpzuecxxvfc --schema distilled`. Regenerate after any schema change.
- **All env vars set** in Vercel and `.env.local` (SUPABASE_URL, SUPABASE_ANON_KEY, SERVICE_ROLE_KEY, GUARDIAN_API_KEY, ANTHROPIC_API_KEY, ALPHA_VANTAGE_KEY, CRON_SECRET, DEV_BYPASS_USER_ID) — URL/keys now point at the shared project
- **Pipeline is running hourly** via GitHub Actions — ~90–95 articles per day across 7 zones
- **`zone_quicklook` unique constraint** added: `unique(zone_type, label)` ✅
- No real end users exist yet — `DEV_BYPASS_USER_ID` is a fixed test user, not real Supabase Auth. Don't build real auth-migration logic in until onboarding is rebuilt.
- **A real production sign-in account now exists** for testing: `rallen7425+distilled@gmail.com` (password in `rocky-coast-labs/.secrets/distilled-test-password.txt`, gitignored — currently a simple 8-digit number, changed 2026-07-10 at the user's request since there's no sensitive data on this test account). Its ID matches `DEV_BYPASS_USER_ID` / the migrated `distilled.users` row, so it shows the same zones and saved article as local dev. Use this to test the real sign-in path (middleware auth, `/auth/signin`) rather than only ever testing via the bypass.

---

## Session log

### Session 2026-07-14 — Diagnosed "Local Zone shows national/political news" report

User reported Local Zone content was full of national news, politics, and international stories unrelated to North Andover/Boston/New England, right after the 2026-07-13 deploy. Root-cause investigation (not a new bug):

1. Pulled the 40 most recent `zone_type='local'` articles from Supabase directly — confirmed a real split: several batches of Guardian/NWS content (Lindsey Graham, US/Iran, ICE operations in Maine, ambient national politics) mixed with genuinely local Google News content (Bruins, Celtics, WBUR, North Andover lottery/real-estate/community stories).
2. Cross-referenced article `created_at` timestamps against the actual deploy completion time (`vercel inspect` → **2026-07-14T01:03:31 UTC** for commit `64e0ec3`, not the wall-clock time implied by the conversation). Every stale Guardian/NWS row was created *before* that timestamp; every row after it was genuinely local. **The pipeline itself was never broken post-deploy** — 6 more old-code cron batches had simply accumulated in the gap between the last mid-session cleanup (2026-07-13) and the deploy actually taking effect, and nobody did a final cleanup pass after that.
3. Deleted the ~47 remaining pre-deploy rows (`zone_type='local'` AND `created_at < 2026-07-14T01:03:31`), with explicit user confirmation obtained first. Re-verified live: Weather Card → Breaking → Top Stories → Today now show exclusively local/regional content, zero national/political stories, zero console errors.

**Lesson for future sessions:** after deploying a fix for a content-sourcing bug, get the deploy's *exact* completion timestamp (`vercel inspect <url>` shows it) and do one more stale-data cleanup pass for anything created before it, rather than assuming the last mid-session cleanup was sufficient — cron cadence during the deploy gap can easily add more.

**Part 2: Zone-preview personalization reaches Home, Summary, and the Zones hub.** Sports/Local personalization (Teams of Interest, community/metro/region) previously only affected the zone *detail* page — Home's "Your Zones" section and the `/zones` hub still called generic `getArticlesByZone(type)[0]` for each zone's preview card, so e.g. the Sports Zone's Home card could show *"LeBron tells Lakers he plans to play elsewhere"* — nothing to do with the user's Red Sox/Patriots/Celtics (confirmed live before fixing).

1. **New shared helper `lib/zonePreview.ts`** (`getZoneArticles`/`getZonePreview`) — for Sports, filters to team-of-interest coverage (reuses `searchTeamUpdates`, same as the detail page, falling back to the generic pool only if no teams are configured or none have matching coverage); for every other zone type, the plain zone-wide pool (Local Zone's is already area-specific at ingestion, so no special-casing needed there).
2. **`app/page.tsx` and `app/summary/page.tsx`** — "Your Zones" cards now use `getZonePreview` instead of a raw top-article fetch. Verified live: Sports card shows *"Boston's silver lining? Red Sox win 9 straight."*
3. **`app/zones/page.tsx` + `ZonesHubClient.tsx`** — same fix, plus restored the Local Zone's weather stat-hero on the hub card (lost when the prior session retired the old pipeline-quicklook-writing pattern) via a live NWS fetch (`getWeatherForAreas`, same call the zone detail page's Weather Card already makes). Verified live: hub's Local Zone card now shows "92°F / Andover / Sunny" instead of falling back to a generic headline.

**Part 3: Zone restructure — 4-zone test profile (Sports, Local, News, Tech).** Per explicit direction: Finance and Entertainment zones are deleted for this test profile (rebuildable later — their `ZoneType`/template/pipeline-runner code is untouched, only the zone *rows* are gone). The Maine Zone doesn't survive as its own zone either — its purpose (the user's interest in a specific Maine location, tied to their other apps "Summer Village Life" and "Rocky Coast Guide") migrates into **Local Zone as a secondary community area**: Wells, ME 04090. A genuinely new **News Zone** (`type: 'news'`) is built in its place, focused on National/Global/World news — not a data migration of old Maine content, since that content was Maine-specific, not national/global.

1. **Full `'maine'` → `'news'` type rename**, not just a relabel — every `Record<ZoneType, ...>` site (`types/index.ts`, `styles/tokens.css`, `scripts/pipeline/types.ts`, `lib/zone-templates.ts`, `ZONE_GRADIENTS` in all 4 duplicated locations, `app/saved/SavedClient.tsx`'s zone filter list, `app/error.tsx`'s icon color, plus `lib/user-init.ts`'s `defaultTemplates` array which TypeScript didn't catch since it referenced the template key `'headlines'` as a bare string, not a typed `Record` — found by grep, not the compiler). `npx tsc --noEmit` confirmed completeness after the rename (removing `'maine'` from the union forces every `Record<ZoneType,X>` to be updated).
2. **News Zone pipeline sourcing** (`scripts/pipeline/index.ts`) — `fetchGuardian('world', 'news')` + `fetchGuardian('us-news', 'news')`, no new source code needed. Verified live: genuinely international/national content (Iran strikes, France Bastille Day, Church of England, Bangkok fire, etc.), zero Maine-specific leftovers.
3. **Wells, ME added to Local Zone's `config.areas`** as a 4th `LocalArea` (community-kind, zip 04090) via a one-off script (same pattern as the original `setup-local-zone.ts`). `getWeatherForAreas()` already supported multiple community areas, so Wells' weather appeared as a second Weather Card row with zero further code changes.
4. **Bug caught and fixed during this work:** the initial Wells, ME Google News query returned false positives — articles about a person named "Nolan Wells" (a true-crime story), not the town. Root cause: `fetchGoogleNews()` sends multi-word queries unquoted (`q=Wells Maine`), which Google News matches as a loose keyword set, not an exact phrase — even though the *manual* testing done when this function was first built (see 2026-07-13 entry) used a quoted phrase (`%22Wells+Maine%22`) and got clean results, the shipped code never actually quoted the query. Fixed by always wrapping the query in literal quotes before encoding. This risk was latent in every existing query (North Andover, Boston, New England) too — they just happened not to trigger it, since "Wells" alone is a far more common word/surname than the others. Re-verified after the fix: genuinely on-topic Wells, ME content (HarborFest, a town moratorium vote).
5. **New zone rows** — deleted Finance/Entertainment/Maine zone rows for the test user via a one-off script (`user_tracks.zone_id` has `ON DELETE SET NULL`, so any tracks pointed at these zones become zone-agnostic rather than being deleted); created a fresh News zone row (position 2, between Local and Tech).
6. **Generic zone template** (`app/zones/[zoneId]/page.tsx` + `ZoneDetailClient.tsx`) — the render ternary's final `else` branch (previously a bare zone-wide list sorted by recency) was upgraded in place to: Breaking (if any, `TrackCard` row) → Top Stories (`TrackCard` row) → Today (`StoryCard` list, paginated 5-at-a-time, capped at 15 total) → zone-filtered Tracking (shared `trackingSection`) → More (whatever's left beyond the cap, unpaginated `StoryCard` list). Deliberately built as the *generic fallback*, not hardcoded to `'news'`/`'tech'`, so Finance/Work/Entertainment get this automatically if rebuilt later. All visual components already existed in this one file — no new component code, just new data-fetching (extending the existing Local Zone Breaking/TopStories/Today split to any non-Sports zone type, adding the cap+More split on top) and a new render branch.
7. **Cleanup requiring explicit confirmation (obtained):** deleted 766 stale `zone_type='maine'` article rows — necessary because `'maine'` no longer exists in `ZONE_META`/`ZoneType`, so a leftover row surfacing in Home/Summary's cross-zone `getTopArticles()` query (which doesn't filter by the user's actual zones) would crash on an undefined `ZONE_META['maine']` lookup. Finance/Entertainment article rows were *not* touched — those `ZoneType` values stay valid in the type system, matching how `'work'` articles already exist harmlessly today with zero users on that zone type.

**Verified live** (screenshots, real Supabase/Guardian/Google News/NWS data, `npx playwright screenshot` + a small Playwright console-error-check script since `chromium-cli` isn't available in this environment): `/zones` hub shows exactly 4 zones (Sports/Local/News/Tech) in order, each with a genuinely on-topic preview; News Zone and Tech Zone both render the new Breaking/Top Stories/Today/Tracking template automatically; Local Zone's Weather Card shows 2 rows (Andover 92°F, Kennebunk/Wells 87°F — NWS resolves the 04090 coordinates to the nearest named place, Kennebunk, which is adjacent to Wells; expected, not a bug); Home's cross-zone Breaking correctly picked up News Zone's Iran/Middle East content; zero console errors across Home, Summary, the hub, all 4 zone detail pages, and `/saved`.

**Part 4: Production crash from a code/DB sync gap, caught and fixed same day.** After Part 3's one-off script ran against the shared production Supabase DB (deleting the Maine/Finance/Entertainment zones, creating the News zone) but *before* the matching code was deployed, the user hit a real "Something went wrong" crash on their phone. Root cause: the still-deployed old code's `ZONE_META` had no `'news'` entry, so the user's real account — which now had a `type: 'news'` zone in the DB — crashed on `ZONE_META['news']` being `undefined`. Fixed by deploying immediately (commit `a6d70d3`). **Lesson:** DB-restructuring scripts that aren't backward-compatible with the currently-deployed code (new zone types, deleted zones a real user depends on) need the matching code deployed before or immediately after running — don't leave that gap open, even mid-session, even against a "test" account that turns out to also be the real sign-in account being used for phone testing.

Separately, this session's report of a recurring GitHub-integration auto-deploy failure notification was investigated: confirmed it's a distinct deploy path (Vercel's Git webhook, triggered on every `git push`, separate from the manual `npx vercel --prod` CLI deploys that actually go live) — `vercel env pull --environment=production` confirmed the Supabase env vars the failure complained about missing are genuinely present for Production, so this looks like either a transient blip or a branch-scoping subtlety only visible in the dashboard UI, not a real ongoing misconfiguration of the deploy path that matters. User is disabling the GitHub auto-deploy integration directly in the Vercel dashboard (Settings → Git) to stop the noise, since it's redundant with the manual CLI deploy this project already exclusively relies on.

**Files touched:** `types/index.ts`, `styles/tokens.css`, `scripts/pipeline/types.ts`, `lib/zone-templates.ts`, `lib/user-init.ts` (maine→news rename); `app/zones/[zoneId]/ZoneDetailClient.tsx`, `app/InDepthClient.tsx`, `app/summary/SummaryClient.tsx`, `app/zones/[zoneId]/story/[storyId]/StoryDetailClient.tsx` (`ZONE_GRADIENTS` key rename); `app/saved/SavedClient.tsx`, `app/error.tsx`, `components/ui/TrackModal.tsx`, `components/ui/ZoneSubNav.tsx` (dead code but still type-checked), `components/zones/ZoneCard.tsx` (remaining `'maine'` references); `scripts/pipeline/index.ts` (news runner); `scripts/pipeline/sources/googlenews.ts` (exact-phrase quoting fix); `lib/zonePreview.ts` (new); `app/page.tsx`, `app/summary/page.tsx`, `app/zones/page.tsx`, `app/zones/ZonesHubClient.tsx` (zone-preview personalization + hub weather hero); `app/zones/[zoneId]/page.tsx` (generic Breaking/TopStories/Today-capped/More/Tracking data fetching). No schema changes — `zones.config`'s existing jsonb shape absorbed Wells ME with zero migration.

**Part 5: Finance Zone still leaking into Home/Summary after deletion, same day.** User reported the Finance Zone was "still showing on the Main page" despite its zone row being deleted in Part 3. Root cause: `getTopArticles()` (used by Home/Summary's cross-zone Breaking/Top Stories) queries the *entire* `articles` table with no zone filter at all — it was never scoped to "zones the user actually has." The Finance pipeline runner was deliberately left running (per Part 3's "rebuildable later" decision), so it kept producing `zone_type='finance'` content, some of it urgent enough (score 4, published same-day) to qualify for Breaking/Top Stories even with zero active Finance zones. This is a general architectural gap, not Finance-specific — the same latent risk already existed for `'work'` (a zone type with a pipeline runner but zero users on it). Fixed by adding an optional `zoneTypes` filter to `getTopArticles()` (`lib/db/articles.ts`) and passing the user's own active zone types from `app/page.tsx`/`app/summary/page.tsx` — cross-zone sections are now scoped to zones the user actually has, closing this off for any zone type, not just Finance. Verified live: Breaking/Top Stories on both pages show only Sports/Local/News/Tech content. Deployed same session (commit `be291b3`).

Also answered, same conversation: **why Local Zone articles never have images while Sports/News/Tech do** — Local Zone's entire content pool is Google News-sourced (see Part 3's caveat); the other three zones each have at least one non-Google-News source (ESPN/team RSS for Sports, Guardian for News, Guardian+HN for Tech) that can produce a real image via RSS enclosure or successful OG-scraping. Not a new issue — already documented in Known Issues → Content precision.

---

### Session 2026-07-13 — Embedded in-app reader + Local Zone personalization

**Part 1: Embedded "Full Coverage" reader.** Story Detail's source links previously opened `target="_blank"` in a new browser tab. Per explicit request, they now navigate to a new in-app route (`/zones/[zoneId]/story/[storyId]/read`) that either embeds the source in an iframe (same fixed Back/Save/Track header + floating `BottomNav` as Story Detail) or, if the source disallows framing, shows an interstitial with "Open in Browser" / "Back to Story".

1. **Embeddability check** (`read/page.tsx`) — server-side `fetch()` of the target URL's headers (HEAD, falling back to GET if 405/501) before rendering: `X-Frame-Options: deny|sameorigin` → blocked; `Content-Security-Policy: frame-ancestors` present and not containing a bare `*` token → blocked. **Bug caught and fixed same day:** the first version substring-matched for the `*` character anywhere in the `frame-ancestors` value, which is wrong — ESPN's policy is `frame-ancestors 'self' *.espn.com:* *.abcnews.go.com ...` (scoped wildcards for its own domain family, not an open policy), so the substring check treated it as "allow anyone" and let real browsers silently block the frame per CSP, leaving a blank iframe under Distilled's own floating nav (which the user initially mistook for "ESPN's bottom nav"). Fixed by splitting the value into whitespace-separated tokens and requiring an exact `*` token match. Guardian's block (`X-Frame-Options: SAMEORIGIN`) was already correct — not a bug, expected interstitial behavior.
2. **Sandbox** — the iframe uses `sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"`, deliberately omitting `allow-top-navigation` so a framed page can't hijack the parent tab.
3. Deployed to production same day (`npx vercel --prod`), verified live against real Guardian (blocked → interstitial) and ESPN (blocked after the fix → interstitial; previously falsely embedded) article URLs.

**Part 2: Local Zone personalization (community/metro/region).** Per explicit product direction, mirroring the Sports Zone precedent: Local Zone content should be organized around 3 geographic tiers derived from the user's zip code — **Community** (own town), **Metro** (nearest major city), **Region** (the metro's broader area) — plus up to 3 user-addable extra community/metro areas. Test profile: zip `01845` (North Andover, MA).

1. **Live testing reshaped the sourcing plan mid-session.** The original plan (curate a specific local RSS feed for Community, use Guardian keyword search for Metro/Region) didn't survive contact with reality: the Eagle-Tribune (the natural local paper) blocks non-browser requests (429s), Patch's per-town RSS URLs 404, MassLive's locality-scoped RSS categories return zero items, and Guardian's `q=Boston&section=us-news` returned Trump/politics stories with no actual Boston connection — Guardian's search isn't doing real relevance filtering for a proper-noun query. **Google News' RSS search endpoint** (`news.google.com/rss/search?q=...`, no API key) was tested live instead and returned genuinely relevant results for all three tiers — real local outlets (andovertownsman.com) for the community query, WBUR/Boston Herald/NBC Sports Boston for the metro query, real New England coverage for the region query. Switched all three tiers to this one mechanism, confirmed with the user before implementing.
2. **Geo utilities** (`lib/geo/`, new) — `zip.ts` (`geocodeZip()`, wraps `api.zippopotam.us`, extracted out of the old `weather.ts`'s inline `zipToLatLng`), `metros.ts` (~55-entry curated major-US-metro list + `nearestMetro()` via haversine distance), `regions.ts` (static state → region lookup, e.g. MA → New England). All pure/static — no new external calls beyond the existing zip geocode.
3. **Weather Card, live-fetched not pipeline-stored** (`lib/weather/nws.ts`, new) — mirrors `lib/scores/espn.ts`'s pattern exactly: fetched at request time in `page.tsx`, one card per configured community-kind area, never written to the `articles` table. This retires the old pattern where `scripts/pipeline/sources/weather.ts` wrote a fake "article" row for weather (deleted); the `zone_quicklook` rows that old pattern also wrote were stale duplicate data and were deleted from Supabase (with explicit user confirmation — see below).
4. **`scripts/pipeline/sources/googlenews.ts`** (new) — `fetchGoogleNews(query, zoneType, sourceName?)`, browser-like User-Agent required (confirmed via testing), parses via `rss-parser` (standard RSS 2.0). **Known caveat:** item `link`s are Google redirect pages (`news.google.com/rss/articles/...`), not the real publisher URL — the actual destination only resolves client-side via JS, which curl/cheerio can't follow. Consequences, both handled: (a) `enrich/images.ts`'s OG-scraping step now skips any `sourceUrl` containing `news.google.com` (it would otherwise scrape Google's own generic branding image, not real article art — worse than no image, since the app already gracefully falls back to a zone-color gradient when `imageUrl` is absent); (b) the new embedded reader (Part 1) will always show its "open in browser" interstitial for these links rather than truly embedding, since `news.google.com` sends `X-Frame-Options: SAMEORIGIN` — "Open in Browser" still works correctly since a real browser tab executes the JS redirect to the true publisher. Also strips the " - sourcename.com" suffix Google News appends to every title.
5. **`scripts/pipeline/index.ts`** — the `local` zone runner no longer takes a single global `DEFAULT_ZIP` env var; it now reads `config.areas` off whichever enabled `local` zone(s) exist (`fetchLocalAreaConfigs()`), unions areas by query text across zones (same shared-article-pool architecture as every other zone — no per-user pipeline runs), and calls `fetchGoogleNews()` once per area, capping each area's contribution to 8 before merging/sorting/capping the total at 15 so one high-volume query can't crowd out the others. Falls back to the old generic `fetchGuardian('us-news', 'local')` if no local zone has areas configured yet.
6. **Data model** — `zones.config` for a `local` zone: `{ areas: LocalArea[] }` (new `LocalArea` type in `types/index.ts`: `{ id, kind: 'community'|'metro'|'region', label, query, zip? }`), same jsonb-config pattern as Sports' `{ teams }`. One-off script `scripts/setup-local-zone.ts` (matching the Sports team-writing precedent) geocodes a zip, computes nearest metro + region, and writes the 3 default areas to the test user's local zone — run once for zip 01845 → North Andover, MA / Boston, MA / New England.
7. **UI** (`app/zones/[zoneId]/ZoneDetailClient.tsx` + `page.tsx`) — new `WeatherCard` component (solid `var(--local-dark)` fill, same live-data-card pattern as `ScoresCard`, one row per community area). The main zone-detail ternary gained a third `zoneType === 'local'` branch that mirrors **Home's** section format (Breaking → Top Stories → Today, paginated 5-at-a-time via a "View More" row → Tracking, local-filtered) rather than Sports' own Updates/More structure — per explicit instruction, Local should "follow the main page format," not Sports Zone's internal layout. `selectBreakingStories`/`selectTopStories`/`dedupeStories` (`lib/articleUtils.ts`) are reused as-is, scoped to just this zone's own article pool instead of cross-zone. The Tracking header+row markup (previously duplicated only within the Sports branch) was extracted into a single `trackingSection` JSX value reused by both the Sports and Local branches, since — unlike the established cross-*file* duplication convention — this would otherwise be byte-identical duplication within one render function.
8. **Design token cleanup, closing out a documented backlog item** — Sports' Scores Card background had churned through 5 ad hoc hex values in the 2026-07-12 session with no reusable token (flagged then as a follow-up). Added real tokens to `styles/tokens.css` this time: `--sports-dark: #098533` (Sports' final value, retro-tokenized) and `--local-dark: #163E77` (hand-picked, ~8:1 contrast with white). `ScoresCard` now references `var(--sports-dark)` instead of the raw hex.

**Stale data cleanup (explicit user confirmation required and obtained for both):** the shared `articles` pool for `zone_type='local'` still had ~405 old rows from the previous generic Guardian/NWS-based pipeline (including high-urgency stories like a senator's death) outranking the new real local content by urgency score — deleted (rows created before the new pipeline run). The 3 stale `zone_quicklook` rows for `zone_type='local'` (`Now`/`Conditions`/`Wind`, superseded by the Weather Card) were also deleted. Both deletions were blocked on first attempt by the auto-mode safety classifier (unscoped bulk deletes against shared Supabase tables) and only proceeded after explicit per-table confirmation.

**Verified live** (real Supabase + Google News + NWS data, no mocks, headless-Chromium screenshots via `npx playwright screenshot` since `chromium-cli` wasn't available in this environment): pipeline run produced 15 genuinely local articles (North Andover High School football, WHAV American Legion Baseball, WBUR Boston World Cup coverage, FOX Weather New England storm threat, etc.); Local Zone page renders Weather Card ("Andover, MA / 89°F / Mostly Sunny · Wind 5 to 9 mph") → Top Stories → Today (paginated, "View More" appears) → Tracking (a genuine `#Celtics` match via the local-filtered search, since one of the new articles is about the Celtics' Jaylen Brown trade); Sports Zone page confirmed unaffected (Scores/Updates/Top Stories/Tracking/More unchanged); zero console errors on either page.

**Not yet deployed to production as of this write-up** — code is committed locally; deploy pending final user sign-off on the browser walkthrough.

**Files touched:** `lib/geo/zip.ts`, `lib/geo/metros.ts`, `lib/geo/regions.ts` (new), `lib/weather/nws.ts` (new), `scripts/pipeline/sources/googlenews.ts` (new), `scripts/pipeline/sources/weather.ts` (deleted), `scripts/pipeline/index.ts` (local runner rewired), `scripts/pipeline/enrich/images.ts` (skip OG-scrape for Google News links), `scripts/setup-local-zone.ts` (new, one-off), `types/index.ts` (`LocalArea`), `styles/tokens.css` (`--sports-dark`, `--local-dark`), `app/zones/[zoneId]/ZoneDetailClient.tsx` (`WeatherCard`, local branch, shared `trackingSection`), `app/zones/[zoneId]/page.tsx` (local data fetching). Embedded reader: `app/zones/[zoneId]/story/[storyId]/read/page.tsx` + `ReadClient.tsx` (new), `StoryDetailClient.tsx` (Full Coverage links now route to `/read` instead of `target="_blank"`).

**Part 3: Post-review fixes, same day.** After reviewing the Local Zone build in the browser, the user flagged two more issues, both fixed:

9. **Empty hero-image space fixed across all 3 duplicated copies.** Since virtually all Google News-sourced Local Zone content has no `imageUrl` (see caveat above), `StoryCard` (200px hero) and `TrackCard` (116px hero) were reserving a full-height empty gradient block for every imageless article — "excess space with empty pictures," per the user. Fixed by branching each card on `!!article.imageUrl`: when present, renders exactly as before (full hero, image + gradient overlay + absolutely-positioned zone pill/Save/Track); when absent, renders a compact non-absolute header row instead (zone pill using `meta.bg`/`meta.border` instead of the image-only semi-transparent dark pill, relativeTime as plain text next to it on `StoryCard`, Save/Track buttons using opaque `var(--surface-2)` instead of `rgba(17,17,23,0.85)` since there's no image underneath to sit on top of) — no wasted space, same click targets and handlers either way. Applied identically to all three files with their own copies of these components (`ZoneDetailClient.tsx`, `InDepthClient.tsx`, `SummaryClient.tsx`), per explicit user decision, since Local Zone content can surface in Home/Summary's cross-zone Top Stories too.
10. **Redundant Quick Look strip removed from Local Zone.** The generic `QuickLookStrip` component (zone-agnostic, driven by `zone_quicklook` rows) was showing a second, stale "Now / Conditions / Wind" strip directly above the new Weather Card — redundant now that the Weather Card covers the same info with live per-area data. Gated out for `zoneType === 'local'` specifically in `ZoneDetailClient.tsx`; other zones' `QuickLookStrip` usage (if any ever populate `zone_quicklook`) is unaffected. Also removed the now-fully-dead `parseWeatherQuicklook()` from `scripts/pipeline/write.ts` — its only possible trigger (a `zoneType: 'local'` `RawArticle` with a `bodySnippet` containing "Temperature:", produced by the old, now-deleted `fetchWeather()`) can never fire again under the new pipeline, so it was pure dead code going forward.

**Recurring problem discovered during this session's testing, resolved by deploying:** because today's pipeline changes weren't deployed to production yet at the time, **GitHub Actions' hourly cron was still invoking the *old* pipeline code** against the same shared Supabase DB — which still called `fetchGuardian('us-news', 'local')` and the old `fetchWeather()`, re-writing stale Guardian/NWS articles and stale `zone_quicklook` rows into `zone_type='local'` every hour, undoing the cleanup each time. This was hit **twice** during this session (once before the image-fix verification, once during it) and both times required deleting the newly re-added rows (with explicit per-instance user confirmation, since the safety classifier correctly blocks unscoped bulk deletes against shared tables). **Fixed by deploying** (`npx vercel --prod`, commit `64e0ec3`) — the next hourly cron run will use the new Google-News-based runner instead.

---

### Session 2026-07-12 (cont'd) — Sports Zone personalization: Scores Card, Updates, Top Stories/Tracking/More

**Sports Zone redefined as personalized, not generic sports news.** Per explicit product direction: the Sports Zone should center on the user's own followed teams (profile-driven), not just aggregate sports headlines like a generic news app. Full personalization (team picker) is deferred to onboarding; for now, teams of interest are stored directly on the test user's sports zone config.

1. **`lib/scores/espn.ts`** (new) — client for ESPN's free, unauthenticated site API (`site.api.espn.com/apis/site/v2/sports/{sport}/{league}/teams/{id}/schedule`), same free/no-key pattern already used for the sports RSS feeds. Confirmed via direct API testing: MLB team id 2 = Red Sox, NFL team id 17 = Patriots, NBA team id 2 = Celtics. The schedule endpoint returns the full season (regular + postseason) regardless of current date, which lets `getScoresForTeams()` derive last/live score and next game without extra calls. **In-season gating uses hardcoded month/day windows per league** (`isInSeason()`), not derived from the schedule response — deliberately, so out-of-season teams (e.g. Patriots/Celtics in July) are skipped before any fetch happens, rather than relying on ESPN's `nextEvent` field, which was confirmed via testing to unreliably return stale postseason data during the off-season instead of nothing.
2. **Teams-of-interest storage** — reused the existing-but-previously-unused `zones.config` jsonb pattern (`updateZoneConfig()` in `lib/db/zones.ts` was dead code before this). Shape: `{ teams: [{ league, teamId, name, shortName, abbrev }] }`. Wrote the user's three teams (Red Sox, Patriots, Celtics) directly into the test account's sports zone row via a one-off service-role script (not a UI flow — there is no settings UI for this yet, matches onboarding being deliberately deferred).
3. **`ScoresCard` component** (`app/zones/[zoneId]/ZoneDetailClient.tsx`) — renders at the top of the Sports Zone detail page (before `QuickLookStrip`/Top Stories), one row per in-season team: last-or-live score, opponent, Final/live status detail, and "Next: {date} vs/@ {opponent}". **Restyled to Distilled's dark theme** rather than mimicking ESPN's native light UI (which the user's reference screenshots used) — dark surface, zone-color (`--sports` green) top accent border and label, no sportsbook odds/broadcast badges, per explicit design-consistency decision. Renders nothing when the team list is empty or all tracked teams are out of season.
4. **Wired into `app/zones/[zoneId]/page.tsx`** — fetches `getScoresForTeams()` server-side only when `zoneType === 'sports'` and the zone has a non-empty `teams` config, passed down as a new `scores` prop.

**Bug hit and fixed during verification:** immediately after writing the new zone config to Supabase, the zone detail page kept rendering the *old* empty config — even after a full dev server restart. Root cause: Next.js App Router's fetch Data Cache persists to `.next/cache` on disk (not just in-memory), so a plain process restart doesn't invalidate it; `supabase-js`'s internal `fetch` calls get swept into this cache like any other fetch. Fixed by clearing `.next/cache`. Separately, the ESPN schedule response is ~3MB, which exceeds Next's 2MB fetch-cache entry limit — `next: { revalidate: 60 }` was silently failing every request with a console warning. Switched to `cache: 'no-store'`, which is a better fit anyway for live score data and eliminates the warning.

**Verified live in browser** (headless Chrome screenshot against local dev, real ESPN + Supabase data, no mocks): Red Sox card shows a real Final/10 score (3–2 win over the Mets) and next game (Fri 1:35 PM vs. Rays); Patriots and Celtics correctly produce no card at all, since both are out-of-season on the current date (2026-07-12).

**Files touched:** `lib/scores/espn.ts` (new), `app/zones/[zoneId]/ZoneDetailClient.tsx` (new `ScoresCard` + `formatGameTime`), `app/zones/[zoneId]/page.tsx` (score fetching + prop wiring). No schema migration — reused existing `zones.config` jsonb column.

5. **Scores Card readability fix** — first version had two bugs, both fixed after a follow-up request: (a) the "3"/"2" score digits didn't line up between the two team rows because each row was its own independent CSS grid, so the `auto`-width third column (blank on the opponent row, "FINAL/10" on the team row) sized each row's `1fr` column differently and shifted the score column sideways — fixed by merging both rows into **one** grid (`gridTemplateRows: 'auto auto'`) so column widths are computed jointly; (b) low-contrast secondary text colors (`--text-2`/`--text-3`) were hard to read — switched all Scores Card text to `--text` (white), using **font-weight instead of color** to indicate the winning team (`isWin === true` → bold, `isWin === false` → regular, both regular while live).
6. **"Updates" section** — new horizontal-scroll section between the Scores Card and Top Stories, visually identical to Home's Breaking/Top Stories `TrackCard` (300px cards, duplicated into `ZoneDetailClient.tsx` per this app's per-file-copy convention rather than extracted/shared). New `searchTeamUpdates()` in `lib/db/articles.ts` runs `searchArticlesByTopic(teamName, ..., 'sports')` per team (reusing the existing ILIKE headline/summary search, now with an added optional `zoneType` filter param), merges results across teams, dedupes by id, sorts by recency. No new external API — reuses the pipeline's already-ingested article pool. **Content is filtered to strictly game-specific stories** (see #8 below) — general team news does not qualify, even though it mentions the team.
7. **Top Stories / Tracking / More restructure** (Sports Zone only — other zones' Top Stories are untouched) — per explicit request, "Top Stories" was reprioritized to be about the user's Teams of Interest instead of generic zone-wide sports news, with two new sections added below it:
   - **Top Stories** sources from the same broad per-team search used for Updates (`searchTeamUpdates`, cap 16, perTeamLimit 8, 14-day window — one shared fetch feeds both sections) minus whatever Updates already claimed (see #8) — vertical `StoryCard` list, mutually exclusive with Updates.
   - **Tracking** — ported from Home (`app/InDepthClient.tsx`): `TrackingTopicCard`/`AddTrackingCard`/`ViewMoreTrackingCard` components and the exact same overflow rule (≤9 topics shows all + Add card; >9 shows first 8 + View More + Add card, 10 slots total), plus the "⋮" options popover (Track a new topic / Edit a tracked topic ["Coming soon"] / View all tracking). The **only** change from Home's version, per explicit instruction: topics are filtered to sports-related only. A tracked topic counts as sports-related if either its `zone_id` matches this sports zone (explicit) or — for the common case of `zone_id: null`, since almost nothing sets it today — its topic text returns at least one match when searched with the `zoneType: 'sports'` filter. Best-matching-article logic (`searchArticlesByTopic(topic, 5, 30, ...)`, `matches[0]` = card article, `matches.length` = article count) is otherwise unchanged from Home.
   - **More** — the zone's original 15-article pool (`getArticlesByZone`), rendered as the same vertical `StoryCard` list, now relabeled "More" and filtered to **exclude** anything already counted as team-of-interest coverage (Updates + Top Stories combined, by id, plus a same-keyword headline/summary check) so nothing repeats across sections. Explicitly re-sorted by `publishedAt` descending (most recent first) after the exclusion filter — `getArticlesByZone`'s default ordering is urgency-first, which the rest of Top Stories/Updates already surfaces via urgency-weighted search, so More deliberately uses pure recency instead, per explicit request.
   - **Known imprecision, not fixed:** team matching (Top Stories/More split) is a plain case-insensitive substring check on headline/summary (same ILIKE-style approach used everywhere else in this codebase for topic matching, e.g. Tracking). Confirmed via live testing this produces at least one false positive: a Detroit Tigers coaching-change article was pulled into Red Sox coverage because its summary mentioned "brother of former Boston Red Sox manager Alex Cora." Acceptable given this matches existing codebase precedent, but worth knowing if Top Stories/Updates content ever looks off-topic.
8. **Updates tightened to game-specific content only** (follow-up fix, same day) — first version of Updates just meant "mentions the team," which let general news (injuries, suspensions, personnel moves) leak in alongside actual game recaps/previews. Per explicit correction, Updates now requires an article to name the **actual opponent** of the team's last/live or next game — pulled straight from the `scores` data already fetched for the Scores Card (`lastOrLiveGame.opponent`/`opponentAbbrev`, `nextGame.opponent`/`opponentAbbrev`), not just any opponent the team has ever played. This is a much sharper filter than generic team-name matching: verified live, it correctly kept only the 2 genuine game-recap/preview articles ("Surging Red Sox cap first 9-0 road trip," "Red Sox plane issues force delayed start vs. Mets" — both name the Mets, the actual last-game opponent) and correctly excluded general news that happened to mention a *different* game's opponent or no opponent at all (an Angels-game injury story, a suspension-reduction story with no opponent named, etc.) — those now land in Top Stories instead. Capped at 5 (`slice(0, 5)`); no artificial minimum — if fewer than 3 genuinely game-specific articles exist on a given day (common, since `dedupeStories()` already collapses multiple articles about the same real-world game down to one), Updates just shows fewer rather than diluting the filter to pad the count. Top Stories now explicitly excludes whatever Updates claimed (`updateIds` exclusion), making the two sections mutually exclusive as requested.
9. **More sorted by recency** (follow-up fix, same day) — More inherited `getArticlesByZone`'s urgency-first ordering, which buried genuinely newer stories under older high-urgency ones. Per explicit correction, `more` is now explicitly re-sorted by `publishedAt` descending after the team-exclusion filter, independent of urgency score.
10. **Section heading style unified** (follow-up fix, same day) — Top Stories and More were using a leftover small/dim/uppercase heading style (10px, `--text-3`, letterSpacing 0.09em) inherited from the pre-restructure page, visibly harder to read than the `SectionHead` component (13px, weight 700, `--text-2`, plus a divider line) already used for Updates and Tracking. Per explicit correction, Top Stories and More now render via the same `SectionHead` component — all four Sports Zone section headings (Updates, Top Stories, Tracking, More) are now visually identical. Also applied to the non-sports-zone Top Stories heading for consistency within the file, even though that branch wasn't explicitly mentioned.
11. **Scores Card recolored to solid zone-color fill** (follow-up fix, same day) — was a dark `--surface` card with a thin green top accent border and a green "SCORES" label; per explicit correction the whole card background is now the zone's primary color (`ZONE_META.sports.color`, `#52C97A`), which made the green label text illegible against the now-green background — label switched to white/bold. Per-team divider line inside the card switched from the very low-contrast `var(--border)` (designed for dark backgrounds) to `rgba(255,255,255,0.25)` so it stays visible against the colored fill; the outer 1px `--border-mid` border and the old top accent border were both dropped as redundant once the whole card carries the zone color. Body text (team names, scores, "Next:" line) was already white from the earlier readability fix, so no change needed there.
12. **Scores Card background darkened for contrast** (follow-up fix, same day) — using `ZONE_META.sports.color` (`#52C97A`) as a full-card fill (from #11) left the card looking washed out against the white body text; computed contrast ratio confirmed it: ~2:1 white-on-`#52C97A`, well under the ~4.5:1 needed for readable text. `#52C97A` is tuned for small text/pills against dark surfaces, not for use as a large solid fill. Replaced with a hand-picked deeper shade of the same hue, `#2E7D4F` (~5:1 contrast with white) — same green identity, actually readable. If any other zone ever gets a similarly-styled solid-fill card, don't reuse `ZONE_META[type].color` directly for the fill — darken it first.
13. **Scores Card background darkened further, per explicit "darker, bolder" follow-up** (same day) — `#2E7D4F` was still judged too light/soft. Replaced with `#1D8348`, a more saturated, deeper green in the same ~140° hue family as `--sports` (`#52C97A`) — bolder and darker while staying a recognizable "sports green," ~5:1 contrast with white maintained.
14. **Scores Card background darkened a 4th time, per a further "needs to be darker" follow-up** (same day) — `#1D8348` still wasn't dark enough. Replaced with `#0F5727`, a deep forest green (same ~140° hue family, lightness dropped to ~20%), ~9:1 contrast with white.
15. **Scores Card background set to an explicit hex, `#098533`** (same day) — user supplied the exact color directly rather than another "darker/bolder" adjustment. No existing design token (`--sports` `#52C97A`, `--finance` `#34D399`, or any other zone color in `styles/tokens.css`) is close enough in hue/saturation to treat as "the closest palette color," so `#098533` is used as a literal one-off value on this card, not tied to a token. This is now the 5th value this card's background has had in one session (`--surface` + accent border → flat `#52C97A` → `#2E7D4F` → `#1D8348` → `#0F5727` → `#098533`) — if asked to adjust again, ask whether to keep iterating ad hoc or to actually add a named token (e.g. `--sports-dark`) to `tokens.css` so it's reusable and this thrash stops.

**Verified live in browser** (headless Chrome screenshots + raw HTML position checks against local dev, real data): Updates shows exactly the 2 game-specific Red Sox stories with no duplication elsewhere on the page; Top Stories leads with the general Red Sox news (Suarez injury, Contreras suspension) that Updates no longer claims; Tracking shows a real "#Celtics" topic card (5 stories, sports-matched) plus the Add-Topic card; More shows general non-Red-Sox sports news below Tracking. Non-sports zones (spot-checked: Tech) still render their original single Top Stories list with no console/server errors.

**Files touched (this sub-session):** `app/zones/[zoneId]/ZoneDetailClient.tsx` (Scores Card fix, `TrackCard`/`SectionHead`/Tracking components, Top Stories/Tracking/More render split), `app/zones/[zoneId]/page.tsx` (team-story fetch reuse, game-specific `isGameSpecific` filter for Updates, `more`/`topStories` mutual-exclusion filtering, sports-filtered tracking fetch), `lib/db/articles.ts` (`searchArticlesByTopic` gained optional `zoneType` param; new `searchTeamUpdates()`). No schema changes.

### Session 2026-07-12 — Hamburger menu, In-Depth View, home page restructure, page swap

**Product work resumed after the 2026-07-10 infrastructure push.** Large, multi-part session — summarized in the order the work happened.

1. **Hamburger menu added to `BottomNav`** (`components/ui/BottomNav.tsx`) — a 5th icon on the right of the bottom nav opens a bottom-sheet menu: Profile, My Zones, Tracking & Saved, (later renamed) Summary View. Fixed a stale `distilled` entry in `~/.claude/launch.json` that pointed at a deleted V2 proxy script.

2. **Built a new "In-Depth View"** as a duplicate of the Today page (initially at `/in-depth`, later promoted to `/` — see #7). Greeting/Tracking/Your Zones sections were kept identical to the original; the Today list was rebuilt as an expanded **"Story Card"** — full-bleed hero image, headline, AI Snapshot summary, and (initially) an in-place "See Full Coverage" expand/collapse accordion fetching coverage via a new `getArticleCoverage` server action.

3. **Zone filter pills added under Today** (and later "More") on both pages — multi-select, unselected = grey/no fill, selected = filled with that zone's color. Iterated twice on bugs: (a) pills were only showing zones that happened to have leftover articles — fixed to always show every zone in `zoneData`; (b) pills were wrapping onto a second line — fixed to a single-row horizontal scroll (`overflowX: 'auto'`, `flexShrink: 0` on each pill).

4. **Major home-page restructure** (`lib/articleUtils.ts` + both `page.tsx` server components + both client components) — replaced the old single "Tracking" section (top stories biased toward tracked topics) with a proper priority pipeline:
   - **Breaking** — new section, `selectBreakingStories()`: urgent (`urgencyScore >= 4`) stories from the last 12h only. Renders only when something qualifies; uses the same 300px `TrackCard` format as Top Stories.
   - **Top Stories** — renamed from the old Tracking section, `selectTopStories()`: pure urgency/recency/zone-distribution scoring (no tracked-topic bias), excludes anything already claimed by Breaking, always returns ≥3.
   - **Your Zones** — unchanged.
   - **Today** — first 5 (Home: capped, extra overflow into a "More" section; In-Depth: paginated 5-at-a-time via a "View More" row, "More" section removed entirely on In-Depth per explicit request).
   - **Tracking** — repositioned lower, redefined to mean the user's *actual* tracked topics (previously it meant general top stories). New `TrackingTopicCard` component reuses the `ZoneCard` (172px) visual format; one card per tracked topic showing its best-matching article. Handles 0/≤9/>9 topic counts (Add-topic card always last; a View-More card appears as the 9th slot when there are more than 9 topics, capping the row at 10 cards).
   - **Story dedup** (`dedupeStories()`) — the pipeline frequently stores several near-duplicate DB rows about the same real-world event (verified via a direct Supabase query: 7 separate rows about one senator's death). A naive "same tag" dedup was rejected after finding tags like "US Senate" and "Politics" shared between genuinely unrelated stories — the shipped heuristic requires **both** a shared tag **and** ≥2 shared significant headline words before treating two rows as duplicates, applied once before the Breaking/Top Stories/Today split.

5. **"Full Coverage" link consistency pass** — Breaking/Top Stories cards originally showed the source name + an "Open in {Zone} →" pill (misleading label; it actually navigated to the story detail page, not the zone page). Replaced across **all four** card types (Breaking, Top Stories, Today, and In-Depth's former accordion) with one consistent treatment: no source name, zone pill + Save/Track icons overlaid top of the image (matching the Story Card pattern), and a plain "Full Coverage →" text link bottom-right in the zone's color — matching `ZoneCard`'s "Open →" link exactly. This removed the in-place expand/collapse accordion entirely (per explicit request for identical behavior across all four sections); `getArticleCoverage` and its related state were deleted as dead code.

6. **Detailed view (`StoryDetailClient.tsx`) brought in line with the new Story Card pattern** — the fixed top bar previously showed a "back to zone" label next to the back chevron, which was genuinely confusing (it actually called `router.back()`, not zone navigation). Split responsibilities: the **fixed** header now only contains "Back"; the zone pill + Save + a **new Track button** (previously missing entirely on this page) now overlay the hero image and scroll away with it, exactly like a Story Card. Also fixed a pre-existing display bug where the zone pill read "Maine Zone Zone" (the zone label already includes the word "Zone"; the template appended it again). "Distilled AI" changed from a pill badge to plain colored text on this page too, and hero→headline spacing was tightened.

7. **Swapped Home and In-Depth View, per explicit request.** `/in-depth` (`InDepthClient.tsx`) is now served at `/` — the app's landing page. The original page moved to `/summary` and its client component was renamed `TodayClient.tsx` → `SummaryClient.tsx`. The hamburger menu's "In-Depth View" entry was renamed **"Summary View"** and now links to `/summary`. The bottom-nav Home/Today icon already pointed at `/`, so no change was needed there — it now opens the new Story-Card-formatted page automatically.

8. **Zone detail page's "Top Stories" switched to the Story Card format** (`app/zones/[zoneId]/ZoneDetailClient.tsx`) — was using the compact `StoryItem` row; now uses the same expanded hero-image/AI-Snapshot/"Full Coverage →" card as Home, for consistency across every list of stories in the app. The `StoryCard` component (plus its `ZONE_GRADIENTS`/`relativeTime` dependencies) was duplicated into this file rather than extracted into a shared component, matching how `TrackCard`/`ZoneCard` are already handled — each top-level page/client component in this app keeps its own copy of shared-looking pieces rather than importing a common one. The zone pill on each card still deep-links to `/zones/{zone.id}` — harmless self-navigation back to the same page, kept for visual/behavioral consistency with the Home page's cards rather than special-cased away.

**Files touched:** `lib/articleUtils.ts` (new `selectBreakingStories`, `selectTopStories`, `dedupeStories`; old `scoredArticlesForTracking` removed), `lib/actions.ts` (`getArticleCoverage` added then removed), `app/page.tsx` + `app/InDepthClient.tsx` (new home page, moved from `app/in-depth/`), `app/summary/page.tsx` + `app/summary/SummaryClient.tsx` (legacy view, moved/renamed from `app/page.tsx` + `app/TodayClient.tsx`), `components/ui/BottomNav.tsx`, `app/zones/[zoneId]/story/[storyId]/StoryDetailClient.tsx`, `app/zones/[zoneId]/ZoneDetailClient.tsx`.

**Verified in browser throughout** (dev server, `/`, `/summary`, and a zone detail page, mobile + desktop viewports): section ordering, dedup correctness (confirmed the 7-row Lindsey Graham case collapsed to 1 per section), shared zone-filter state, pagination on In-Depth, Tracking card Add/View-More logic at 0 and 1 topics (couldn't exercise the >9 overflow case live — the test account had 0–1 tracked topics all session, see Known issues), Full Coverage links navigating to the correct Detailed view via precise ref-based clicks (not just eyeballed coordinates — an earlier eyeballed click missed the target and looked like a bug before this was caught). Also caught one console warning ("Cannot update a component while rendering a different component") on the zone detail page that turned out to be stale Fast Refresh noise from mid-edit, not a real bug — confirmed clean on a fresh tab/navigation before trusting it.

**Noticed but out of scope, flagged as a background task:** `relativeTime()` (duplicated in several client components) computes elapsed time from `Date.now()` at render time, causing a React hydration mismatch warning on first load (confirmed pre-existing on the original page too, not introduced today).

---

### Session 2026-07-10 — Rocky Coast Labs shared platform + Distilled cutover

**What was done (mostly outside this repo — full detail in `rocky-coast-labs/ARCHITECTURE.md`):**

1. **Discovered and fixed a major gap unrelated to the main task** — the entire V3 rebuild (everything in "What's been built" above) had been deployed to production via `vercel --prod` directly from disk for months, but never committed to git. Reconciled against this file's own session log, confirmed it matched, committed and pushed (`efd9851`).

2. **Built the "Rocky Coast Labs" shared platform** — one Supabase free-tier project (`rocky-coast-labs`, ref `kywdezqgrtpzuecxxvfc`) shared across the user's whole app portfolio (Distilled, Sonic Radar, Rocky Coast Guide, PM ReArchitected, Is It Offensive), one Postgres schema per app, to stop the sprawl of separate paid-tier-risk Supabase projects per prototype.

3. **Migrated Distilled onto it** — all 6 tables (1680 articles, 6 zones, 1 test user, 1 save) moved into the new `distilled` schema, preserving IDs/FK relationships. Also migrated Sonic Radar and Rocky Coast Guide the same day (see their own repos). Old standalone project (`qyjkqfgodgnjlvjdyuci`) paused as a dormant backup, not deleted.

4. **Code changes:** all three Supabase clients (`lib/supabase/client.ts`, `server.ts`, `service.ts`) now pass `db: { schema: 'distilled' }`; `types/supabase.ts` regenerated against the new schema; one hardcoded `Database['public']` reference in `lib/articleUtils.ts` fixed. Several columns tightened to `NOT NULL` (position, enabled, urgency_score, tags, all timestamp columns) to match app-level TS assumptions uncovered by the build — the original standalone project apparently had these constraints even though CLAUDE.md's simplified schema docs didn't mention them.

5. **Verified:** local dev (real article headlines, zone names, personalized greeting all render correctly) and production (`distilled-news.vercel.app`, same checks).

6. **Follow-up manual/automated testing pass (same day):** drove the full navigation depth via `DEV_BYPASS_USER_ID` local dev (Today → Zones → Zone Detail → Story Detail, including the AI synthesis section and Full Coverage sources, plus Tracking/Saved/Profile) — all real data, zero errors. Also created a real production sign-in account (`rallen7425+distilled@gmail.com`, ID matched to the migrated user so it shows the same data) and confirmed a real sign-in on `distilled-news.vercel.app` works end-to-end, not just the bypass. At the user's request, that account's password was simplified to a plain 8-digit number (no sensitive data on this test account).

7. **Portfolio-wide, not just Distilled:** the same session also fully migrated Sonic Radar and Rocky Coast Guide onto the shared platform (both deployed and tested — Rocky Coast Guide's full onboarding flow in particular, which had never been tested before at all), fixed PM ReArchitected's broken git history and deployed it to Vercel for the first time, and fixed a plaintext-password leak in Rocky Coast Guide's docs. Full detail lives in `rocky-coast-labs/ARCHITECTURE.md` and `rocky-coast-labs/PLATFORM-OVERVIEW.md` (the latter written for a non-technical/PM audience).

**Explicitly deferred:** all Distilled product work (tracking-fix confirmation, onboarding, UI/content/zone fixes) was held off for this entire session per explicit user instruction, to keep infrastructure work and product work from mixing. See "Next session" for the reordered priority list this produced.

### Session 2026-07-06 — Pipeline fixes, stale article filters, tracking persistence, zone detail redesign

**What was fixed:**

1. **Stale articles on zone pages** (`lib/db/articles.ts`) — `getArticlesByZone` had no time filter; old high-urgency articles (e.g. a 2-week-old tech article with score 5) permanently topped zone pages. Fixed by adding a `days = 14` cutoff. `getTopArticles` (Today page) already had a 72h window. `searchArticlesByTopic` (Tracking page) now has a `days = 30` window.

2. **Work zone had zero articles** (`scripts/pipeline/index.ts`) — Both `work` and `finance` fetched from Guardian `'business'` section. Finance ran first, claimed all articles via dedup hash, leaving work with 0 new articles every run. Fixed by switching work to Guardian `'money'` section (careers/personal finance content). **Important:** Never change work back to `'business'` — it collides with finance.

3. **Weather geocoding failure** (`scripts/pipeline/sources/weather.ts`) — Census API geocoder was broken (invalid `benchmark=2020` URL param). Switched to `api.zippopotam.us/us/{zip}` which is free, no key, returns lat/lng directly.

4. **Tracking topic removal not persisting** (`lib/actions.ts`, `app/tracking/TrackingClient.tsx`) — Root cause was the Next.js router cache (client-side, 30s TTL for dynamic routes). The DB delete was working correctly all along — the cache was serving the old page on navigate-back. Fix: `removeTrack` now calls `revalidatePath('/tracking')` server-side (purges data cache), and `handleDelete` calls `router.refresh()` client-side after success (purges router cache). Both are needed — `revalidatePath` alone doesn't clear the router cache.

5. **Zone detail urgency sections removed** (`app/zones/[zoneId]/ZoneDetailClient.tsx`) — Zone detail was using the same urgency bucketing as Today (`Breaking` / `Your Day` / `On Your Radar`). This was wrong: urgency scores are set at ingestion and never decay, so a 6-day-old score-5 sports story sat in "Breaking" above fresh score-4 stories from an hour ago. Replaced with a single "Top Stories" section sorted by `publishedAt DESC`. Urgency bucketing is intentional and correct on the Today page (where recency is constrained to 72h), but wrong on zone detail pages.

**Key insight documented:** urgency_score is a static label assigned at ingest time. It is only meaningful for ranking when ALSO filtered by recency. The Today page does this correctly (72h window + urgency sort). Zone detail now uses pure recency within a 14-day window.

---

### Session 2026-06-29 — Product vision + design critique

**What was done:**

1. **Product vision document** (`prototypes/distilled-vision.md`) — Full product narrative: "All the signal. None of the noise." Defines 5 use modes (Quick Check, Lunch Catch-up, Mid-afternoon Alert, Evening Deep Dive, Weekend Read), the information architecture (Tracking → Today → Zone status → More Today → Caught Up), and what makes Distilled genuinely different from Apple News (AI synthesis is the product, not a feature).

2. **Design critique** (`prototypes/distilled-design-critique.md`) — Honest assessment of the v3 prototype against the vision. Score: 5/10. What's working: aesthetic direction, floating pill nav, horizontal scroll zone cards, "You're caught up" end card, track cards at top. **Key gaps identified:**
   - Track cards have no urgency state — nothing communicates "something changed" or "closes in 4h"
   - Zone cards feel like preview tiles, not status panels — no new-story count, no urgency signal
   - AI synthesis is invisible on the home screen — users can't tell why this differs from RSS
   - Time-bounded tracking (deadlines/countdowns) has no design language at all
   - Tracking vs. Zones distinction isn't visually clear to a new user

3. **Briefing concepts prototype** (`prototypes/briefing-concepts.html`) — New design concepts for the Today/briefing experience, exploring alternative layouts and AI synthesis presentation.

**Nothing was built in code this session** — this was a design review and vision-setting session.

---

### Session 2026-06-27 — Tracking section + Story detail navigation

**What was built:**

1. **CSS stability system** — All `@keyframes` moved to `globals.css`; removed all inline `<style>` tags from component render bodies (TodayClient, TrackModal, ZonesHubClient). Created `app/error.tsx` dark-theme error boundary. Pattern: React removes component-level `<style>` tags during error recovery — always put keyframes in `globals.css`.

2. **Server actions for all mutations** (`lib/actions.ts`) — All client-side Supabase writes replaced with `'use server'` actions using service role key. Covers: `addTrack`, `removeTrack`, `saveArticle`, `unsaveArticle`. Browser clients never have auth session in dev bypass mode, so direct Supabase calls from the browser were silently failing due to RLS.

3. **Tracking section redesign** — Replaced manual-topic article search with `scoredArticlesForTracking()` (`lib/articleUtils.ts`): scores zone articles on urgency, recency, and fuzzy topic match. Works for all users including those with no tracked topics. Zone articles fetched once per zone and reused for both the zone cards and the tracking scoring pool (no duplicate queries).

4. **TrackCards now clickable** (`app/TodayClient.tsx`) — Full card tap → story detail (`/zones/{zoneType}/story/{articleId}`). Zone badge tap (with stopPropagation) → zone page (`/zones/{zoneUUID}` looked up from `zoneData`).

5. **Story detail page redesigned** (`StoryDetailClient.tsx`) to match `prototypes/distilled-story-detail.html`:
   - Fixed gradient top bar (not sticky) — back button shows zone label, bookmark icon uses server actions
   - 260px hero image (always shown; falls back to zone gradient if no image)
   - Zone pill in hero bottom-left — clickable → zone page (UUID looked up server-side)
   - `router.back()` for back navigation (works regardless of source route)
   - **AI Snapshot** section: zone-color 2px top border, "Distilled AI" badge, prose summary, "Synthesized from N sources" when coverage exists
   - **Full Coverage** section: main article + topic-matched articles from `searchArticlesByTopic()` — each shows publisher initials badge, source name, truncated headline, external link arrow → opens `sourceUrl` in new tab
   - **More from [Zone]** section: remaining zone articles as internal navigation rows (56px thumb + zone label + headline)

6. **Story detail data fetching** (`page.tsx`) — Now fetches: topic-matched coverage articles (up to 5), zone articles for "More from" (up to 3), zone UUID lookup for zone pill. All DB throws wrapped with `.catch(() => [])` so a Supabase error degrades gracefully instead of crashing the page.

**CSS crash root cause (documented for future sessions):**
When any React component throws during render, React's error recovery cycle runs. In Next.js 14 dev mode this removes component-level `<style>` tags AND can corrupt the CSS injection state, making all pages appear unstyled until a clean restart (`rm -rf .next`). The fix is always: (1) remove the root cause throw, (2) ensure all styles are in `globals.css`, (3) `rm -rf .next && npm run dev`.

**Next.js fetch Data Cache persists to disk, not just memory (found 2026-07-12):** after writing new data straight to Supabase (bypassing the app), a page kept serving the stale pre-write value even after killing and restarting `npm run dev`. Next's fetch Data Cache lives in `.next/cache` on disk and survives a plain process restart — only `rm -rf .next/cache` (or a full `.next` wipe) actually busts it. This applies to *any* fetch made during server rendering, including `supabase-js`'s internal fetch calls, not just explicit `fetch()` calls in app code. Relevant whenever data is written directly to the DB outside a normal app mutation path (scripts, SQL, Supabase dashboard) and a page appears not to pick it up. Separately: Next's fetch cache silently refuses to store any response over 2MB (logs a console warning, doesn't error) — large API responses should use `cache: 'no-store'` rather than `next: { revalidate }`, both to avoid the warning and because it won't actually be cached anyway.

---

## Known issues / what's broken

### Resolved — recurring data corruption (confirmed fixed by deploy, 2026-07-14)
- ~~Production's hourly GitHub Actions cron was still running the OLD pipeline code~~ — **confirmed fixed 2026-07-14.** The deploy (`npx vercel --prod`, commit `64e0ec3`) completed at **2026-07-14T01:03:31 UTC** (confirmed via `vercel inspect`). Cross-referencing article `created_at` timestamps against that: every `zone_type='local'` row created *before* 01:03:31 UTC was old Guardian/NWS content (6 more stale batches accumulated in the gap between the last mid-session cleanup and the deploy actually completing); every row created *after* is genuinely local/regional Google News content (Bruins, Celtics, WBUR, Boston Herald, North Andover Patch/Realtor.com/andovertownsman.com stories, etc.) — confirmed by direct inspection, not just absence of Guardian source names. The pipeline itself was never broken post-deploy; the leftover pre-deploy rows just kept outranking the new content by urgency score until a final cleanup pass (2026-07-14, ~47 rows deleted, explicit user confirmation obtained). **Root-cause lesson:** after any deploy meant to fix a content-sourcing bug, check the deploy's exact completion timestamp and do one final stale-data cleanup pass for anything created before it — don't assume the last mid-session cleanup was also the last one needed.

### Not built yet
- **Onboarding flow** (`/onboarding`) — page does not exist. New users get default zones (news + tech) auto-created silently. There is no zone customization, zip code collection, or zone picker. The middleware allows `/onboarding` but the route 404s.
- **Sports Zone team picker** — the Scores Card (added 2026-07-12) reads `teams` from `zones.config`, but there is no UI to set it. Currently hardcoded for the test user only (Red Sox/Patriots/Celtics, written via a one-off script). Building a real team picker is onboarding-adjacent work — revisit when onboarding is built, or sooner if a quick zone-settings UI is wanted first.
- **Local Zone areas picker** — same situation as Sports' team picker: `zones.config.areas` (community/metro/region + up to 3 extra) is hardcoded for the test user only, no UI to add/edit areas yet. Currently has all 4 slots used (3 defaults from zip 01845 + Wells, ME as the one secondary area added 2026-07-14 — 2 more secondary slots remain available). Unlike Sports' `SPORTS_FEEDS` (which needs a code change per new league), adding a new area's content source is automatic — the pipeline just picks up the new area's Google News query from `config.areas` — so this one is lower-effort to eventually wire to a real settings UI.
- **News/Tech Zone "generic template" has no UI for managing tracked topics beyond the shared `TrackModal`** — same as every other zone, not a new gap, just noting the generic template (2026-07-14) inherits whatever Tracking limitations already exist elsewhere.

### Unconfirmed fix
- **Tracking topic removal persistence** — fix was applied (2026-07-06) but still not confirmed working, on production or otherwise. The delete itself works (DB shows 0 tracks after testing). The issue was the router cache. Fix: `revalidatePath('/tracking')` in server action + `router.refresh()` in client handler. As of 2026-07-10 there were 0 tracked topics in the (migrated) data, so this couldn't be exercised during that session's testing pass either — still needs an actual add-then-remove-then-navigate-away-and-back cycle. A real production sign-in account now exists (see Infrastructure above) making this testable at any time. If topics still reappear after navigating away and back, the next thing to check is whether `removeTrack` is actually completing before navigation (add a console.log to confirm).

### Untested at scale
- **Tracking section overflow states** (2026-07-12 redesign — see Session log) — the 0-topic and 1-topic states were verified live, but the 9-and-10-card overflow behavior (first 8 topics + a "View More" card + the Add card) was only verified by code review, since the test account had at most 1 tracked topic all session. Worth adding ~10 tracked topics to a test account and confirming the card count/ordering live before trusting it in production. Applies to both Home's Tracking section and the Sports Zone's sports-filtered one — they share the same overflow logic.
- **Sports Zone personalization not tested on a real phone** (2026-07-12) — Scores Card, Updates, and the Top Stories/Tracking/More restructure were only verified via dev-server emulation and headless-Chrome screenshots at various widths, never a physical device. See "Next session" Priority 1.
- **Local Zone and News/Tech Zone personalization not tested on a real phone** (2026-07-13/14) — Weather Card, Breaking/Top Stories/Today/Tracking/More were only verified via dev-server + headless-Chromium screenshots, same caveat as Sports above. All of it is deployed and confirmed working post-deploy (see Current status) — mobile is the only remaining unverified surface.

### Content precision
- **Team-name matching is a plain case-insensitive substring check**, not real entity recognition — used both for the Top Stories/More split (does this article mention a Team of Interest?) and, more narrowly, for gating what counts as "game-specific" in Updates (does it name the actual last/next opponent?). Confirmed via live testing this produces false positives: a Detroit Tigers coaching-change article was pulled into Red Sox coverage because its summary happened to mention "former Boston Red Sox manager Alex Cora." This matches the substring-matching approach already used elsewhere in the app (e.g. Tracking's `searchArticlesByTopic`), so it's a pre-existing tradeoff, not a new regression — but it's the first thing to check if Sports Zone content ever looks off-topic.
- **Google News RSS is an unofficial/undocumented endpoint** (no formal API contract like the Guardian Content API) — stable in practice for years, but could change without notice. Used for all Local Zone content (community/metro/region tiers).
- ~~Google News queries weren't quoted as exact phrases~~ — **fixed 2026-07-14**: `fetchGoogleNews()` sent multi-word queries unquoted (`q=Wells Maine`), which Google matches as a loose keyword set rather than a phrase — confirmed live to produce false positives (a "Nolan Wells" true-crime story matched the "Wells Maine" town query). Every query (`scripts/pipeline/sources/googlenews.ts`) is now wrapped in literal quotes before encoding. This risk was latent in every prior query (North Andover, Boston, New England) too; they just hadn't triggered it yet.
- **Google News-sourced articles never get real OG images or true in-app embedding** — their `sourceUrl` is a Google redirect page (`news.google.com/rss/articles/...`), not the publisher's real article URL (the actual destination only resolves client-side via JS). `enrich/images.ts` deliberately skips OG-scraping these (would otherwise grab Google's own generic branding image) — they fall back to Unsplash or the zone-color gradient instead. The embedded "Full Coverage" reader (added 2026-07-13) will always show its "open in browser" interstitial for these links rather than truly embedding, since `news.google.com` sends `X-Frame-Options: SAMEORIGIN` — "Open in Browser" still works correctly. This applies to every Local Zone article, not an occasional edge case. ~~The empty-hero-image layout issue this caused~~ — **fixed 2026-07-13**: `StoryCard`/`TrackCard` now render a compact header row instead of a full empty gradient block when `imageUrl` is absent (see Session log Part 3). The images themselves are still generally missing — that's unchanged — just no longer wastes screen space.

### Cosmetic / non-blocking
- **`relativeTime()` hydration mismatch** — several client components (`app/InDepthClient.tsx`, `app/summary/SummaryClient.tsx`, `components/ui/StoryItem.tsx`, `StoryDetailClient.tsx`) each define a local `relativeTime()` helper that computes elapsed time from `Date.now()` at render time. Because these are server-rendered once before hydration, the server's and the client's computed strings ("33m ago" vs "34m ago") can differ, producing a React hydration warning in the console on every page load. Confirmed pre-existing on the original page too, not introduced by the 2026-07-12 restructure. A fix (compute the string only after mount) was spawned as a separate background task on 2026-07-12; check whether it landed before re-investigating from scratch.

### Design gaps (from 2026-06-29 critique — to address in future sessions)
- **Track cards lack urgency state** — nothing communicates "something changed on this story" or "this track closes in 4h." All tracks look the same regardless of urgency or deadline.
- **Time-bounded tracking has no design language** — deadline badges, countdowns, and expiry indicators don't exist anywhere in the UI.
- **AI synthesis is invisible on the home screen** — signal items show headline + source pill, but nothing signals that AI read 23 articles and picked this one. No synthesis prose in the feed.
- **Zone cards feel like preview tiles, not status panels** — no new-story count, no urgency signal, no indication of whether a zone is "buzzing" or quiet today.
- **Tracking vs. Zones distinction unclear** — new users can't tell from the UI why these are fundamentally different things (domain vs. specific story).

### Auth edge cases
- `initializeNewUser` uses service role client and can fail silently if the `users` table FK is not satisfied. Zones page handles empty zones gracefully rather than redirecting.
- Google OAuth not yet tested end-to-end.

---

## Next session: where to pick up

**Updated 2026-07-14 (end of day)** after the zone-preview personalization + 4-zone restructure work, deployed the same day (commit `a6d70d3`) after a real user-facing crash was reported. Priority 0 is now "get it on a phone," not a deploy blocker; everything else keeps its prior ordering. Onboarding is still deliberately last.

### Priority 0 — Get the 2026-07-14 work on a real phone
Both zone-preview personalization (Home/Summary/Zones-hub, `lib/zonePreview.ts`) and the 4-zone restructure (News Zone replacing Maine, Wells ME added to Local, Finance/Entertainment deleted, generic template for News/Tech) are deployed (commit `a6d70d3`) and confirmed working post-deploy. Nothing from any session this week has been checked on a physical phone yet — the reported "Something went wrong" crash (see Current status → "Deploy urgency note" and Session log Part 4) was a code/DB sync gap, not a mobile-specific bug, but worth explicitly re-confirming on a phone now that both are in sync.

### Priority 1 — Verify the 2026-07-12 changes hold up on mobile
Covers both the original home-page restructure AND the same-day Sports Zone personalization work (Scores Card, Updates, Top Stories/Tracking/More restructure) — none of it has been checked on a real phone yet, only dev-server emulation + headless-Chrome screenshots at various widths. Check the hamburger menu bottom sheet, horizontal-scroll rows (pill row, Updates, Tracking), and Story Card layout for touch-target or viewport issues that don't show up in emulation. The real production sign-in account (see Infrastructure) now has live Red Sox data to look at, not just placeholder/empty states.

### Priority 2 — Confirm Tracking section overflow states with real data
Add ~10 tracked topics to the test account and confirm the 9-and-10-card layout (8 topics + View More + Add) actually renders and behaves as designed — see "Untested at scale" in Known issues. This now applies to **two** Tracking sections (Home's and the Sports Zone's sports-filtered one), both share the same overflow logic.

### Priority 3 — Fix the `relativeTime()` hydration warning
A background task was already spawned for this on 2026-07-12 (see Known issues) — check whether it landed before redoing the work.

### Priority 4 — Confirm tracking-topic-removal persistence fix
Still unconfirmed since 2026-07-06 (see Known issues) — a real production account now exists, so this is easy to test whenever it comes up.

### Priority 5 — Remaining content-management inconsistencies
The user's original Priority 2 (2026-07-10 plan) was broader than just story duplication — ask if there are other pipeline/content issues still open before assuming this is fully closed out.

### Priority 6 — Zones work (substantially addressed 2026-07-12 through 2026-07-14, follow-ups below)
Sports and Local both got full personalization build-outs, that personalization now reaches every zone-preview surface (not just the detail page), and the test profile is down to its intended 4 zones (Sports/Local/News/Tech) with a shared generic template for News/Tech — see Session log for the full breakdown. Loose ends, roughly in priority order:
1. **No UI to manage Teams of Interest or Local areas** — both still hardcoded for the test user via one-off scripts (`zones.config.teams`, `zones.config.areas`). A real settings flow is onboarding-adjacent; either fold it into Phase 6 (Priority 7) or build a lightweight standalone settings screen first if onboarding stays blocked.
2. ~~Scores Card background color churned through 5 values with no matching design token~~ — **done 2026-07-13**: `--sports-dark`/`--local-dark` tokens added to `styles/tokens.css`, `ScoresCard` now references `var(--sports-dark)`.
3. **Team-name matching is substring-based (ILIKE-style)** for the Top Stories/More split and the game-specific Updates filter — confirmed false-positive-prone (a Tigers article got pulled in via an incidental "former Red Sox manager" mention). Fine for now, but if content quality complaints come up, this is the first place to look.
4. ~~Other zones (Local, Finance, Work, etc.) got none of this personalization treatment~~ — **Local Zone done 2026-07-13**, and **zone-preview personalization now reaches Home/Summary/Zones-hub too (2026-07-14)**, not just the detail page. Finance/Entertainment zones were deleted for this test profile (rebuildable later); Work zone was never created for this user; ask whether any of those want a real build-out before assuming News/Tech's generic template is the final word for them.
   - ~~Deleted Finance zone still leaked into Home/Summary's Breaking/Top Stories~~ — **fixed 2026-07-14**: `getTopArticles()` (`lib/db/articles.ts`) had no zone filter at all, so content from any zone type with no active zone (the Finance pipeline runner keeps running per the "rebuildable later" decision) could still surface. Now scoped to the user's own active zone types — see Session log Part 5. Same fix protects against `'work'`'s pipeline runner doing the same thing, which was a latent, previously-undetected risk.
5. **Local Zone's own loose ends** (2026-07-13/14): Google News RSS is an unofficial endpoint and its redirect links mean no real OG images or true in-app embedding for any Local/News/Tech-zone article sourced from it (see Known issues → Content precision — the empty-space *layout* issue this caused is fixed, the missing images themselves aren't); the shared-article-pool architecture means content still isn't literally per-user, same limitation Sports already has.
6. **News/Tech Zone's generic template is brand new (2026-07-14) and deployed, but untested on mobile** — see Priority 0.

### Priority 7 — Build Phase 6: Onboarding (deliberately last)
Do this only after the above are solid — the user's reasoning: onboarding is best built/tested against stable surrounding product surfaces rather than a moving target, and is best paired with a fixed/static test user ID rather than rebuilding real signup flows prematurely.

3-step flow at `app/onboarding/page.tsx` (see `BUILDPLAN.md` Phase 6 prompt for full spec):
- Step 1: Zip code (optional, enables Local zone)
- Step 2: Zone template picker — tap cards, not checkboxes; pre-select News + Local
- Step 3: Narrowing question (city for Sports, industry for Work) — skip if neither selected
- Activation screen: calls `addZoneFromTemplate`, triggers pipeline, redirects to `/zones`
- Middleware guard: users with existing zones who visit `/onboarding` → redirect to `/zones`

### Priority 8 — Design fixes from critique
Address the highest-impact gaps from `prototypes/distilled-design-critique.md`:
1. **Track card urgency state** — add "something changed" indicator and deadline countdown badge to track cards (read `prototypes/briefing-concepts.html` for new layout concepts)
2. **AI synthesis in feed** — add 1-sentence AI prose below headline on each signal item in the compact `StoryItem` row (Summary View)
3. **Zone card status signal** — add new-story count or urgency ring to ZoneCard header

### Deploy reminder
Always run `npx vercel --prod` after any code change — GitHub auto-deploy is unreliable (the user is disabling the GitHub Git integration in the Vercel dashboard as of 2026-07-14 to stop it attempting/notifying entirely; confirm next session whether that's done). **New lesson (2026-07-14):** if a session's work includes a one-off script that changes the shape of live DB data (new zone types, deleted zones/rows), deploy the matching code immediately after running that script — don't let DB and deployed-code state drift out of sync, even briefly, since the shared production DB is also what real sign-in accounts use.
