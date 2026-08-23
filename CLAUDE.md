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
- **Zones** (`/zones`) — hub showing one horizontal-scroll row per zone (changed 2026-07-15; previously one card per zone). Header is the zone's name in its own color, sized to match Home's Breaking/Top Stories headings. Row content uses the same black-rectangle story-card format as Home's Breaking/Top Stories (Sports/Local lead with their live Scores/Weather card, reformatted to match — no more solid zone-color fill), up to 9 stories, ending with a "View {Zone} →" link card
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

Two independent paths supply zone content — don't conflate them:

**1. Batch pipeline (hourly, via GitHub Actions)** — the only path that writes to the shared `articles` table. This is what Today/Top Stories/every zone's story list renders from.

```
GitHub Actions (cron: every hour)
  └── calls POST /api/pipeline/trigger (secret-protected)
        └── for each zone runner (see table below):
              1. Fetch raw articles from that zone's source adapter(s), merge, sort by
                 recency, cap at 15 — **except Local Zone**, which round-robin interleaves
                 per-source and per-area instead of a flat recency sort (fixed 2026-07-15,
                 see "Local Zone sourcing" below — a plain recency sort let one prolific
                 source starve another completely, every run, for weeks)
              2. Deduplicate against articles table (skip known external_ids) — both
                 against existing DB rows and within the batch itself (the same real
                 story can appear in more than one feed)
              3. Extract OG images for articles missing imageUrl (cheerio, skipped for
                 Google News redirect links); Unsplash search as a last-resort fallback
                 for whatever's still missing, cached by query
              4. Batch new articles → single Claude Haiku call → summaries + urgency
                 scores + tags (max 20 articles/call)
              5. Write to Supabase articles table
              6. Update zone_quicklook — **Finance only** as of 2026-07-13 (parses the
                 Alpha Vantage bodySnippet into index-quote rows); Sports/Local no
                 longer write quicklook rows at all, see path 2 below
```

**2. Live, request-time fetches** — never touch the `articles` table, run fresh on every page load of the relevant zone, same free/no-key pattern as the batch sources:
- **Sports Zone's Scores Card** — `lib/scores/espn.ts`, ESPN's free unauthenticated site API, keyed off the zone's `config.teams` (Teams of Interest).
- **Local Zone's Weather Card** — `lib/weather/nws.ts`, NWS `api.weather.gov`, keyed off the zone's `config.areas`.

These replaced an earlier design (retired 2026-07-13) where a `weather` pipeline runner wrote a synthetic "article" row and a `zone_quicklook` stat per hourly run — live data doesn't need to be batched or persisted, and per-request freshness is strictly better for scores/weather than an hourly snapshot.

### Zone runners (`scripts/pipeline/index.ts`)

| Zone | Sources | Notes |
|---|---|---|
| `sports` | ESPN RSS ×4 (NFL, NBA, MLB, NHL) | `sources/sports.ts`. Live Scores Card is a separate path, see above — not part of this runner. |
| `local` | Google News RSS search (every configured area) + curated direct RSS/BLOX sources (per-area, where configured) | See "Local Zone sourcing" below. |
| `news` | Guardian `world` + Guardian `us-news` | National/global — added 2026-07-14, replaced the retired `maine` zone (see Zone templates). |
| `tech` | Guardian `technology` + Hacker News RSS + TechCrunch + The Verge + Ars Technica + Wired | 6 sources total, each capped at 6 before merging — the last 4 added 2026-07-14 for coverage diversity (Guardian/HN were already producing real images, so this wasn't an image fix). |
| `finance` | Alpha Vantage (SPY/DIA/QQQ quotes, synthesized into one "Markets: S&P 500 ▲/▼ ..." article) + Guardian `business` | Alpha Vantage's synthetic quote article is prepended ahead of the Guardian articles. |
| `work` | Guardian `money` | **Never switch this to `business`** — that's Finance's section; using it here previously let Finance's dedup claim every article first and starve Work of new content entirely (fixed 2026-07-06). |
| `entertainment` | Guardian `culture` | No active zone for the test profile as of 2026-07-14 (deleted, see Zone templates); the runner and template stay valid for a future rebuild. |

Every runner sorts its merged results by recency and caps at 15 (`slice(0, 15)`) — enforced per-zone regardless of how many sources feed into it. **Local Zone is the one exception** (fixed 2026-07-15, see below): a plain recency sort let one high-publish-frequency source completely starve a lower-frequency one despite this per-zone cap, so it uses a fairness-preserving round-robin interleave instead.

### Local Zone sourcing (hybrid, per configured area)

Local Zone content is driven by whichever `local` zone(s) have `config.areas` set (see Zone templates below) — `fetchLocalAreaConfigs()` unions areas across all enabled local zones by query text, same shared-article-pool architecture as every other zone (no per-user pipeline runs). For each area:
- **Google News RSS search** (`sources/googlenews.ts`) always runs — query wrapped in literal quotes for exact-phrase matching (a bare multi-word query is matched as a loose keyword set, which produced a real false positive — see Known issues), 14-day window, browser-like desktop User-Agent. Its item links are Google redirect pages, not the publisher's real URL, so these articles never get a real OG image or true in-app embedding (see Known issues).
- **Curated direct sources** (`area.directSources`, optional, added Phase 11 / 2026-07-14) run in parallel alongside Google News wherever configured:
  - `kind: 'blox'` → `sources/blox.ts` — query-scoped search-as-RSS for BLOX/TownNews-CMS papers (Eagle-Tribune, Salem News, Newburyport Daily News, Derry News, Andover Townsman). Requires a mobile Safari User-Agent — a desktop UA got a 429 from eagletribune.com. **Client-side 14-day freshness filter added 2026-07-15**: unlike Google News' `when:14d` param, this search endpoint ranks by relevance, not recency, so a well-matched but over-a-year-old evergreen article could otherwise win a slot ahead of genuinely fresh coverage (confirmed live: a 2024 article). Items with no parseable date are kept rather than dropped.
  - `kind: 'rss'` → the generic `sources/rss.ts` adapter — plain outlet feeds with no query needed (Boston.com, Universal Hub, Portland Press Herald, WGME, NHPR).

  Direct sources return real article URLs, so normal OG-image scraping works on them — this is what fixed Local Zone's near-total lack of real images (Phase 11), except where a source itself blocks scraping (Universal Hub returns 403 regardless of User-Agent — accepted limitation, see Known issues).

**Two-level round-robin interleave, replacing a plain merge+sort+cap (fixed 2026-07-15):** the old approach — cap each source at 6, merge everything, sort by recency, cap the whole area (and later the whole zone) at a flat number — looked reasonable but had a real starvation bug, confirmed live: the North Andover BLOX papers (Eagle-Tribune, Salem News, Newburyport, Derry News, Andover Townsman) were fetching real content successfully on *every single hourly run*, but their articles never once survived the final recency sort, because higher-frequency sources (Portland Press Herald and WGME on the Wells, ME secondary area; even NHPR *within* North Andover's own source list) always had something more recent. Zero articles from those five papers existed in the `articles` table despite weeks of "working" fetches. Fixed with `interleaveRoundRobin()` (`scripts/pipeline/index.ts`) applied at two levels:
1. **Within an area**, across its own sources — each source's items are recency-sorted and capped at 6, then interleaved one-per-source per round (instead of merged-then-globally-sorted) so a single prolific source (e.g. NHPR) can't fill an area's whole allocation.
2. **Across areas**, using each area's own interleaved-and-capped-at-8 list — same round-robin, so a high-frequency area (e.g. one with two statewide direct sources) can't fill the whole zone's 15-article cap.

Verified live (dry run against real feeds, zero DB writes, then a real triggered pipeline run): North Andover's own bucket went from 6-of-8 slots held by NHPR alone to genuine representation across all its configured sources; the zone's final 15 went from zero North-Andover-tied articles to several real ones (Eagle-Tribune, Salem News, Andover Townsman, Newburyport, plus a Google News "Patch" hit).

**Read-time prioritization on top of the above (`lib/zonePreview.ts`, added 2026-07-15):** `LocalArea.id` follows a `community-primary` / `metro-primary` / `region-primary` / `community-secondary-N` naming convention (see `scripts/setup-local-zone.ts`) — areas without `-secondary` are the user's actual home community/metro/region. `classifyLocalArticle()` tags each article `'primary' | 'secondary' | 'neutral'` (source-name match against an area's curated `directSources` first, since that's the strongest signal for outlets like WGME/Portland Press Herald whose stories rarely mention the area by name; falls back to a headline/summary keyword match otherwise). `applyLocalAreaPriority()` gives primary-classified articles a +1 urgency boost (capped at 5) and re-sorts by (boosted urgency, recency) — the existing urgency/recency-based selection functions (`selectTopStories`, plain sort) are untouched, only their input ranking is biased. Secondary-area articles are never penalized, only left unboosted, so the result is a mix, not an exclusion. Used by:
- The Zone Detail page's Top Stories/Today (`app/zones/[zoneId]/page.tsx`) — pulls from a separately-fetched, larger 45-row pool (vs. the generic 15) specifically for Local, since a 15-row pool can already be starved before re-ranking gets a chance to help. **Breaking is deliberately excluded** from this boost — it stays purely urgency/recency-driven, zone-wide, so a genuinely urgent story from any configured area (primary or secondary) still surfaces there.
- `getZoneArticles()` (`lib/zonePreview.ts`) for Local specifically — flows through to the Zones hub row and Home/Summary's "Your Zones" preview card automatically.

### Source adapters (all free)

| Source | Used by | API / method |
|---|---|---|
| The Guardian Content API | News, Tech, Finance, Work, Entertainment (different `section` per zone — see Zone runners table) | `content.guardianapis.com/search`, `GUARDIAN_API_KEY`. `sources/guardian.ts` |
| Generic RSS (`rss-parser`) | Sports (ESPN feeds), Tech (TechCrunch/Verge/Ars Technica/Wired/HN), Local (direct-RSS outlets) | `sources/rss.ts` — handles RSS 2.0 and Atom transparently (The Verge is Atom) |
| Google News RSS search | Local Zone (every area, always runs) | `news.google.com/rss/search?q="..."` — no key, unofficial/undocumented endpoint. `sources/googlenews.ts` |
| BLOX/TownNews query-scoped search RSS | Local Zone (North Andover-area papers, where configured) | `https://{domain}/search/?q=...&f=rss&t=article`, mobile UA required; results filtered client-side to the last 14 days (added 2026-07-15 — the endpoint ranks by relevance, not recency, see "Local Zone sourcing"). `sources/blox.ts` |
| Alpha Vantage | Finance (index quotes) | Free tier, 25 calls/day — sufficient for 3 index symbols once/run. `sources/finance.ts` |
| ESPN site API (live, request-time) | Sports Zone's Scores Card — **not** the batch pipeline | `site.api.espn.com`, no key. `lib/scores/espn.ts` |
| NWS (live, request-time) | Local Zone's Weather Card — **not** the batch pipeline | `api.weather.gov`, no key; zip → coordinates via `lib/geo/zip.ts` (`api.zippopotam.us`). `lib/weather/nws.ts` |
| OG-image extraction | Fallback for any article missing `imageUrl` after its source adapter ran | `cheerio` scrapes `og:image`/`twitter:image`; skipped for `news.google.com` links (would scrape Google's own branding image, not real article art). `enrich/images.ts` |
| Unsplash | Last-resort image fallback | `api.unsplash.com/search/photos`, `UNSPLASH_ACCESS_KEY`, 50 req/hour free tier — active since 2026-07-14, results cached by query (reusing `zone_quicklook`'s label/value shape under a sentinel `zone_type`, not a new table) to conserve the rate limit. Doesn't help hyperlocal proper-noun queries (e.g. "North Andover High" → 0 results) — direct RSS sourcing is what actually solves that for Local Zone. |

### Cost constraints — must be enforced in code

1. **Never call Claude API per-article.** Always batch: collect all new articles for a run into one prompt, return JSON array of `{id, summary, urgency, tags}`. Max 20 articles per batch call.
2. **Deduplicate before any API call.** Check `external_id` against Supabase before fetching OG images or calling Claude.
3. **Cap articles per zone per run: 15.** Fetch top 15 newest, skip the rest.
4. **Do not store article body text.** Store only: headline, summary (AI), image_url, source_url, source_name, published_at, urgency_score, tags, zone_type.
5. **Do not use NewsAPI.** Terms prohibit production use on free tier; paid tier is $449/month.

### Pipeline file structure

```
scripts/pipeline/
  index.ts          ← orchestrator (called by API route) — ZONE_RUNNERS table, dedup-before-
                       enrichment, per-zone try/catch so one zone's failure doesn't block others,
                       interleaveRoundRobin() fairness helper (Local Zone's per-source/per-area
                       interleave, added 2026-07-15 — see "Local Zone sourcing")
  sources/
    guardian.ts     ← Guardian API adapter (section param → zone-specific content)
    rss.ts          ← generic RSS/Atom adapter
    googlenews.ts   ← Google News RSS search adapter (Local Zone, every area)
    blox.ts         ← BLOX/TownNews query-scoped search RSS adapter (Local Zone, curated direct
                       sources) — 14-day freshness filter added 2026-07-15
    sports.ts       ← ESPN RSS adapter (4 leagues)
    finance.ts      ← Alpha Vantage adapter
  enrich/
    images.ts       ← OG image extraction with cheerio (skips news.google.com links) + Unsplash
                       fallback with query-based caching
    summarize.ts    ← batched Claude Haiku calls
  write.ts          ← dedup check + Supabase insert + zone_quicklook update (Finance only)
  types.ts          ← shared RawArticle and ProcessedArticle types

lib/
  geo/
    zip.ts          ← zip → lat/lng/city/state geocoding (api.zippopotam.us)
    metros.ts       ← curated major-metro list + nearestMetro() haversine lookup
    regions.ts      ← state → broad US region lookup (e.g. MA → New England)
  weather/
    nws.ts          ← live, request-time NWS fetch for the Local Zone's Weather Card (not pipeline-stored)
  scores/
    espn.ts         ← live, request-time ESPN fetch for the Sports Zone's Scores Card (not pipeline-stored)
  zonePreview.ts    ← getZoneArticles()/getZonePreview() (Sports team-of-interest filtering, Local
                       area-priority boost via applyLocalAreaPriority()/classifyLocalArticle(),
                       added 2026-07-15 — see "Local Zone sourcing"); read-time only, feeds the
                       Zones hub row and Home/Summary's "Your Zones" preview card

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

**Phase 16 built — Zone Management + Tracking overhaul + Profile reference view (2026-08-22).** Not yet deployed — see Session log.

Phase 15 (Zones page horizontal-scroll rework + Local Zone pipeline starvation fix, 2026-07-15) **is committed** (`72c8f30`) — the "not yet committed" note from that session was stale; confirmed via `git log`/`git status` at the start of this session. All V2 code has been deleted. The full app is deployed at https://distilled-news.vercel.app, running on the shared Rocky Coast Labs Supabase platform (see Infrastructure below).

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
| 11 | Real images everywhere — Unsplash fallback activated + cached, curated direct RSS for Local Zone (BLOX-network papers, boston.com/Universal Hub, Press Herald/WGME), Tech Zone diversified with TechCrunch/Verge/Ars Technica/Wired | ✅ Done 2026-07-14 |
| 12 | Zones hub card reformat — plain colored header (zone name + story count only, no hero text), live Scores Card (Sports)/Weather Card (Local) rendered below the header, 3 story rows (up from 2) | ✅ Done 2026-07-14 |
| 13 | Hamburger menu's "My Zones" item gained direct sub-links to each zone (colored dot + label → `/zones/{id}`), via a new small `/api/zones/menu` route fetched client-side by `BottomNav` | ✅ Done 2026-07-14 |
| 14 | Fetch-efficiency review — 60s in-memory TTL cache (`lib/cache/ttlCache.ts`) added around the live ESPN/NWS fetches (Phase 12 doubled their call frequency by adding them to the hub alongside the zone detail page), dead `getZoneQuicklook` query removed from the hub | ✅ Done 2026-07-14 |
| 15 | Zones page rework — one horizontal-scroll row per zone (black-rectangle story-card format matching Home's Breaking/Top Stories, replacing one-card-per-zone), Home/Summary headers + "Your Zones"/Tracking cards restyled to match; Local Zone pipeline starvation bug found and fixed (two-level round-robin interleave + BLOX freshness filter) plus a read-time primary-area priority boost | ✅ Done 2026-07-15 |
| 16 | Zone Management — Default Zone Catalog (`ZoneTemplate` gained `description`/`personalization`/`specialCard`), full zone CRUD (`createZoneFromTemplate`/`deleteZone`/`reorderZones`/`getZoneById`/`getAllUserZones`), `/zones/manage` page — one unified list of all 7 default zones, toggle-only on/off (no separate delete), zone name doubles as a link when the zone exists, native-Pointer-Events drag-and-drop reorder, inline zip/industry prompt only when turning on a template that needs it — per-zone Customize sheet (Sports Teams of Interest picker backed by a real ESPN-sourced 4-league team catalog, Local extra-areas editor, Work industry field) replacing the one-off setup scripts, Sports Zone now defaults to the nearest metro's teams from zip (new curated metro→team mapping) the same way Local defaults its 3 areas. Same session: Tracking overhaul (pencil-to-edit, a real `zone_id`-write bug fixed across every track-creation path, Today-page Tracking cards redesigned to match Your Zones' 3-story format) and a Profile rewrite (reference-only Personalization section summarizing each personalized zone with a link to its own Customize sheet, rather than duplicating the editors) | ✅ Built 2026-08-22, not yet deployed |
| — | In-app embedded reader for "Full Coverage" source links (replaces `target="_blank"`), with an interstitial fallback for sites that block framing | ✅ Done 2026-07-13 |
| — | Migrate onto shared Rocky Coast Labs Supabase platform, verify end-to-end | ✅ Done 2026-07-10 |

### Route inventory

```
/                          Home / In-Depth View — Breaking, Top Stories, Your Zones, paginated Today, Tracking
                            (app/page.tsx + app/InDepthClient.tsx)
/summary                   Summary View — same sections, compact StoryItem rows for Today + a More section
                            (app/summary/page.tsx + app/summary/SummaryClient.tsx)
/zones/manage               Zone Management — add/remove/enable-disable/reorder zones, add-zone flow (template
                            catalog + inline zip/industry collection), links out to each zone's own Customize
                            sheet (Teams of Interest / Local Areas / Industry) on its detail page
/zones                     Zones hub — one horizontal-scroll row per zone (changed 2026-07-15; previously one
                            card per zone). Header is the zone's name in its own color, sized to match Home's
                            Breaking/Top Stories headings. Row content: for Sports/Local, the live Scores Card /
                            Weather Card leads it (reformatted to the same black-rectangle story-card style as
                            every other card in the row, replacing the old solid zone-color fill) — then up to
                            9 team/area-aware stories (see lib/zonePreview.ts) in the same TrackCard format used
                            on Home's Breaking/Top Stories, then a "View {Zone} →" link card closes the row
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
/api/zones/menu            GET — user's zones (id, label, color) for the hamburger menu's "My Zones" sub-links
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

### Session 2026-08-22 — Phase 16: Zone Management

Per explicit direction, this session was scoped to **Zone management only** (add/remove/customize zones from a set of defaults) — User Profile and Onboarding, originally raised alongside this, were deferred to future planning sessions since Zone management doesn't depend on either. Planned in plan mode first (grounded via 3 parallel Explore passes over zone-management/profile/onboarding code), then the plan was narrowed at your request to defer custom zones too, with an explicit first step: formalize a **Default Zone Catalog** documenting each of the 7 templates' setup requirements, personalization, and special card.

**Part 1: Default Zone Catalog.** `ZoneTemplate` (`lib/zone-templates.ts`) gained `description`, `personalization: {kind, label}`, and `specialCard` fields, populated for all 7 templates — this became the single source the Add Zone and Customize UIs read from instead of ad hoc per-type branching. Also dropped, then re-added (see Part 4), Sports' `requiresZip` flag.

**Part 2: Zone CRUD.** `lib/db/zones.ts` gained `getAllUserZones` (enabled + disabled, for the management page), `getZoneById`, `createZoneFromTemplate` (moved and hardened from `lib/user-init.ts`'s previously-uncalled `addZoneFromTemplate`, which was deleted as dead code once superseded — now rejects a true duplicate and re-enables a matching disabled zone instead, since the whole app assumes one zone per type per user), `deleteZone`, `reorderZones`. Wrapped in server actions in `lib/actions.ts` (`addZone`, `removeZone`, `toggleZoneEnabled`, `reorderZonesAction`, `updateZoneCustomization`, `addLocalArea`/`removeLocalArea`), matching the existing `'use server'` mutation convention.

**Part 3: `/zones/manage` page** (new, `app/zones/manage/page.tsx` + `ZoneManageClient.tsx`) — first built as a two-part flow (a list of the user's zones with delete + up/down reorder, plus a separate "+ Add Zone" sheet of catalog cards), then redesigned per explicit follow-up feedback into what actually shipped — see Part 5. Linked from the hamburger Menu's "My Zones" item (a new entry above the existing per-zone sub-links) and from Profile's existing "Manage Zones" link (previously pointed at `/zones`, now correctly points here).

**Part 4: Per-zone Customize UI** (`components/zones/CustomizeSheet.tsx`, opened via a new "Customize" pill in the zone detail header for Sports/Local/Work) — this is what actually retires the one-off setup scripts:
- **Sports → Teams of Interest.** New `lib/scores/teams.ts` — all 30/32 teams across MLB/NFL/NBA/NHL, pulled directly from ESPN's own team-list endpoint (`site.api.espn.com/.../teams`) rather than hand-typed, so ids are guaranteed to match what `lib/scores/espn.ts`'s per-team schedule fetch expects. Searchable, league-grouped multi-select with removable chips for the current selection.
- **Local → Areas editor.** Shows the 3 zip-derived defaults read-only, plus add/remove for up to 3 extra areas (zip in, geocoded via the existing `lib/geo/*` helpers) — same logic `scripts/setup-local-zone.ts` ran by hand, now a real form.
- **Work → Industry field.** Simple text input — closes a gap where `ZONE_TEMPLATES.work.requiresIndustry` existed but nothing ever actually read or wrote `zones.config.industry`.
- Mid-session, you asked for Sports Zone to default to the nearest metro's major-league teams at creation, the same way Local defaults its 3 areas from zip — added `lib/scores/metroTeams.ts`, a curated metro→team mapping (covering the ~45 of the 55 `lib/geo/metros.ts` metros that actually have a major-league team; verified correct for Boston/San Francisco/Chicago/Boise — including the empty-result case — via an isolated throwaway script before wiring it into `addZone`). Sports' `requiresZip` was re-added to `ZONE_TEMPLATES` for this (having been dropped as an unused flag in Part 1 — this session's own "future feature" caveat on that removal turned out to be exactly what got asked for next).

**Bug found and fixed during verification:** `app/zones/[zoneId]/page.tsx` was missing `export const dynamic = 'force-dynamic'` (present on `app/zones/page.tsx` but never added here) — after saving a Customize change, the zone detail page kept serving pre-save data even across a full hard reload, matching the exact Next.js fetch Data Cache gotcha already documented in this file's 2026-06-27 entry. A `rm -rf .next` + dev server restart confirmed the write itself was correct (verified directly against Supabase) before landing on the real fix: added `force-dynamic` to both `app/zones/[zoneId]/page.tsx` and the new `app/zones/manage/page.tsx`, so this class of bug can't recur on either page regardless of dev-server cache state.

**Part 5: `/zones/manage` redesign, per explicit follow-up feedback.** You pointed out the first version didn't match the intent: it should be one list of every default zone (not just ones already added), toggle-only (no separate delete — "the user can just toggle it off"), the zone name itself clickable instead of a separate "Customize →" link, single-line rows, and drag-and-drop instead of up/down arrows. Rebuilt accordingly:
- **One unified list** — all 7 templates always render, merged with the user's actual zone rows by type. A zone that exists (enabled or disabled) is a real, draggable row; a zone that's never been added is a dimmed "phantom" row with no drag handle.
- **Toggle is the only lifecycle control.** Turning on a phantom row for a template with `requiresZip`/`requiresIndustry` opens a compact one-field prompt (reusing the same zip/industry collection Part 2 already built) before calling `addZone`; a template with neither requirement turns on immediately. Turning off an existing zone calls `toggleZoneEnabled` — it stays as a disabled row, never deleted. `removeZone` (Part 2) is no longer called from any UI; kept in `lib/actions.ts` as it's still a reasonable primitive.
- **Single-line rows**: drag handle, color dot, zone name (a `Link` to `/zones/{id}` when the zone exists, plain text otherwise), toggle.
- **Drag-and-drop reorder** via native Pointer Events (`setPointerCapture` on the handle, no library) — dragging past half a row's height swaps it with its neighbor; on release, persists the final order via `reorderZonesAction`.

**Bug found and fixed during this redesign:** the first drag implementation tracked the dragged row's array index in a plain ref, used both for bounds-checking and for indexing into the reordered array. Rapid pointermove events (a normal mouse drag generates many) could read a stale `order.length` from an outer closure while the ref's index kept incrementing past it, letting a swap write `undefined` into the array — the very next render crashed with "Cannot read properties of undefined (reading 'zone')" (caught live via `left_click_drag` in testing, confirmed by the exact error text and a `NotFoundErrorBoundary` stack pointing at the component). Fixed by deriving the dragged row's index fresh from the *live* array inside the `setOrder` functional updater on every move (`prev.findIndex(...)`) instead of trusting a separately-tracked ref, and by reading the final order for persistence from a ref mirror (`orderRef`) kept in sync via `useEffect` rather than the drag-handler's own possibly-stale closure. Re-tested the same drag gesture repeatedly afterward with no recurrence.

**Second pre-existing bug found (not introduced this session):** the `/zones` hub page already had its own "Manage zones" button — more discoverable than the Menu/Profile links — that opened a completely different, dead-end sheet (`ZonesHubClient.tsx`, `manageOpen` state): a read-only zone list with a static "Add zones during onboarding or from your profile" placeholder and just a "Done" button, predating this session and never wired to any real functionality. This is almost certainly what you first landed on when reporting "Manage Zones doesn't make sense." Fixed by pointing that button at `/zones/manage` and deleting the ~40-line dead sheet outright.

**Third bug hit during verification:** after a `deleteZone` call (run directly via a one-off cleanup script, not through the UI, to remove test rows), the `/zones/manage` page kept showing the deleted rows — through a full hard reload, a `location.href` self-navigation, and even a cache-busting query string. This was **not** the Data Cache gotcha it first resembled: the underlying dev server process itself needed a full stop + `rm -rf .next` + restart before the fresh DB state showed up, exactly matching the precedent in the 2026-06-27 log entry (a plain reload or `router.refresh()` isn't always enough; the running process can hold state a mere cache-clear doesn't reach). Confirmed correct immediately after the restart.

**Fourth bug, reported directly by you after using it:** off-state toggles looked like they'd vanished entirely. Root cause was two compounding issues — the off-state knob color was `var(--bg)`, identical to the page's own background, so it had near-zero contrast against its own track even in isolation; on top of that, the whole row (toggle included) was dimmed to 55% opacity for any off/not-added zone, pushing the already-invisible knob further toward nothing. Fixed by changing the off-knob color to `var(--text-3)` (a visible grey) and removing the row-level opacity dimming entirely — the toggle now always renders at full clarity (dark track, grey knob left when off; white track, dark knob right when on), with just the zone name text and color dot getting a lighter touch (dimmed color/opacity) to distinguish inactive zones instead of fading the whole row.

**Verified live** (dev server, real Supabase/ESPN/geo data, zero mocks): every template toggled on/off at least once, including the zip/industry prompt flow for Local/Sports/Work; dragged a zone up several positions, confirmed the new order survived a full reload; confirmed a toggled-off zone disappears from Home/Summary/Zones-hub/Menu while its tracked topics survive; confirmed a Sports Zone's real team config (Red Sox/Patriots/Celtics) was untouched by unrelated toggling elsewhere; confirmed off-state toggles are now clearly visible (dark track, grey knob) rather than blending into the background; console errors from the drag bug and the stale-cache episode both confirmed resolved via a **fresh browser tab** (its console history starts empty, ruling out stale accumulated log entries from before each fix — the same tab's console understandably still showed old entries after a same-tab reload, which cost some time to correctly attribute as history rather than a live recurrence). `npx tsc --noEmit` and `next lint` both clean on every new/changed file throughout (pre-existing unrelated lint debt elsewhere untouched). Left the test account exactly as found (Sports/Local/News/Tech enabled, in original order) — Finance/Work were toggled on to test, then off, then their now-orphaned disabled rows deleted via a one-off script since this session's design has no in-UI delete. Also fixed, per direct follow-up: the page's back arrow went to `/profile`, but the primary entry point is the Zones hub's "Manage zones" button — changed to `/zones` and relabeled "Zones" to match.

**Part 6: Home/Summary "Your Zones" card resize, per explicit follow-up request (unrelated to `/zones/manage` but touched the same day).** The `ZoneCard` component (Home's `InDepthClient.tsx` and `SummaryClient.tsx`, one copy each per this app's established per-file-duplication convention) was 172px wide — narrower than the 300px `TrackCard` used for Breaking/Top Stories directly above it in the same scroll stack, so the row visually didn't match. Widened to 300px (same as `TrackCard`) and removed both story-count indicators per explicit request: the "N NEW"/"QUIET" pill (upper right) and the "N stories today" line (lower left) — the card now shows just the zone pill, a 2-line headline clamp (widened from 3, since more width means less wrapping), and a right-aligned "View {Zone} →" link. The link's color-dimming when a zone has no articles (`hasArticles`) was kept even though the count itself is gone — still a reasonable subtle "quiet zone" signal. `TrackingTopicCard` (same file, same 172px format) was deliberately left untouched — the request was specific to "Your Zones," not Tracking.

**Part 7: "Your Zones" cards upgraded from 1 headline to top-3-stories-per-zone, per explicit follow-up request.** `ZoneCard` went from a single `topArticle` headline to a stacked list of up to 3 stories, each row borrowing the exact format from Story Detail's "More from {Zone}" section (56px rounded thumbnail + headline, divider between rows) instead of inventing a new one. Data plumbing: `lib/zonePreview.ts`'s `ZonePreview` type gained `topArticles: ArticleDisplay[]` (alongside the existing `topArticle`/`articleCount` which other call sites still use) — no new query, since `getZoneArticles` already fetched up to `limit` (10) articles and only `[0]` was ever read before. `ZoneCard`'s single `onClick` (→ zone detail) split into two callbacks: `onZoneOpen` (zone pill header + footer link) and `onStoryOpen(article)` (each story row → that story's own Story Detail page, `/zones/{article.zoneType}/story/{article.id}`) — clicking a specific story now goes straight to it rather than always landing on the zone hub first. `TrackingTopicCard` was again left untouched (request was specific to Your Zones).

**Part 7b: two follow-up tweaks, same day.** (1) The story-row headline's line-clamp was bumped from 2 to 3 (`WebkitLineClamp`, both files) — the 56px thumbnail already reserved enough vertical room for a 3rd line that was going unused. (2) **Dedup against Breaking/Top Stories** — a story already shown in Breaking or Top Stories higher up the same page could also show up in its zone's Your Zones card, which read as a real repeat. Fixed by NOT pre-slicing `topArticles` to 3 inside `getZonePreview` (it now returns the full fetched pool, up to `limit`) and instead filtering it in `app/page.tsx`/`app/summary/page.tsx` — `zoneData` is now built *after* `breakingIds`/`topStoryIds` are computed (previously built before, reordered for this), excluding any article whose `id` is in either set before taking the first 3 remaining. Plain `id`-based exclusion, not the fuzzier tag+keyword `dedupeStories()` heuristic used to collapse near-duplicate rows about the same real-world event elsewhere on the page — deliberately simpler, matching the existing precedent for "already counted" exclusion sets (e.g. Sports Zone's "More" section). Verified live: cross-checked every Breaking/Top Stories headline against every Your Zones headline on a real page load, zero overlaps, across all 4 zones.

**Part 8: Tracking overhaul — pencil-to-edit, zone-association fix, and a matching 3-story card redesign for the Today page.** Three separate but related requests, all touching the tracked-topic pipeline:

1. **Real bug found: the zone-of-interest chip in `TrackModal` was non-functional, and in one path actively broken.** `addTrack(topic)` hardcoded `zone_id: null`, silently discarding whatever zone chip the user picked in every caller. Worse, `ZoneDetailClient.tsx`'s own "track from this zone" flow bypassed `lib/actions.ts` entirely with a raw client-side insert — `zone_id: zoneId ?? null` where `zoneId` was actually whatever `TrackModal.onConfirm`'s 2nd argument is, a `ZoneType` string like `"sports"`, not a UUID. That would fail against the `zone_id uuid` column outright. Root-caused via a live DB query (`user_tracks` for this user: all 3 real rows had `zone_id: null`), confirming the chip had never actually worked end to end.
2. **Fix: every write path now resolves `ZoneType → real zone row id`.** New `resolveZoneId()` helper in `lib/actions.ts` (looks up the caller's own zones via `getUserZones`); `addTrack(topic, zoneType?)` and new `updateTrack(id, topic, zoneType?)` both use it. `ZoneDetailClient.tsx`'s raw insert was deleted outright in favor of calling the (now-correct) `addTrack` action, closing the UUID bug. All 4 `addTrack(topic)` call sites (`InDepthClient.tsx`, `SummaryClient.tsx`, `ZonesHubClient.tsx`, `TrackingClient.tsx`) updated to pass the zone through instead of discarding it.
3. **Data fix for the 3 pre-existing tracks** (`#Roman Anthony`, `#Celtics` → Sports; `#Trump Administration` → News, the closest built-in equivalent since there's no Politics zone) — one-off script, matching your explicit correction.
4. **Pencil-to-edit on `/tracking`.** New edit icon next to the existing delete "X" on each topic row; `TrackModal` gained a `mode?: 'add' | 'edit'` prop (swaps heading/button copy only — "Edit tracked topic" / "Save Changes" — no structural change since `initialTopic`/`initialZone` pre-fill already existed). `TrackingClient.tsx` tracks `editingTopic` state, resolves its current zone via `resolveTrackedTopicZone` for the modal's pre-selected chip, and calls `updateTrack` on confirm. The Today page's long-dead "Edit a tracked topic" menu item (previously just toasted "Coming soon") now routes to `/tracking`, where editing actually lives.
5. **Root cause of the wrong badge, and the real fix.** Home/Summary's Tracking cards derived their zone badge from `matches[0].zoneType` — whichever zone's article happened to be *most recent*, completely independent of what the topic was actually about. New shared `lib/trackingPreview.ts` (`getTrackingPreview`) makes the explicit `zone_id` (once set, per fixes above) win: badge = that zone, search scoped to it via `searchArticlesByTopic`'s existing 4th `zoneType` param — same "explicit zone_id wins" pattern `fetchZoneTracking` (Zone Detail page) already established. A **client-safe split** was required: `lib/trackedTopicZone.ts` holds just the pure `resolveTrackedTopicZone()` function with zero server imports, because `trackingPreview.ts` also pulls in `lib/db/articles.ts` → `lib/supabase/server.ts` (`next/headers`), which broke the build the moment `TrackingClient.tsx` (`'use client'`) imported anything from the combined file — caught live via the dev server's own compile error, not a guess.
6. **Second real bug, caught only by testing after the badge fix: strict zone-scoping made a genuinely active topic look dead.** Every DB article mentioning "Roman Anthony" is tagged `zone_type: 'local'` (Boston/Maine papers cover the Portland Sea Dogs; Sports Zone's ESPN feeds don't), confirmed via a direct query. Badging the topic Sports (correct, per your instruction) while *also* scoping the search to `zone_type='sports'` returned zero results — visually indistinguishable from "nothing's happening" when 5 real, current articles existed one zone_type over. Fixed with a fallback: if the zone-scoped search comes back empty, `getTrackingPreview` (and `/tracking`'s own fetch) retries unscoped — the badge still reflects the topic's true zone, only the article pool widens. Verified live: #Roman Anthony went from a correct-but-empty green card to a correct green card with 3 real Sea Dogs articles.
7. **Today page card redesign to match "Your Zones."** `TrackingTopicCard` (`InDepthClient.tsx` + `SummaryClient.tsx`) rebuilt from the old 172px "1 headline + NEW/QUIET badge" format to 300px with up to 3 stories, each row using the same 56px-thumbnail/headline pattern as the new `ZoneCard`. `AddTrackingCard`/`ViewMoreTrackingCard` widened to 300px to match. Footer link reads "View #{topic} →" instead of "View {Zone} →". Per your immediate follow-up, the topic-name pill at the very top of the card (redundant with the footer link and the zone-color stripe) was removed entirely — the card now goes straight from the color stripe into the story rows.
8. **`TrackingTopicData` gained `zoneType`/`articles`** (was `article`/`articleCount` only); `openTrackingTopic` split into `openTrackingTopic()` (→ `/tracking`, used by the footer link) and `openTrackingStory(article)` (→ that story's own page, used by each row) — mirroring the `onZoneOpen`/`onStoryOpen` split already done for `ZoneCard`.

**Verified live**, including two real bugs neither typecheck nor lint could have caught (both required actually loading the page): the wrong-badge-color regression (a stale dev-server cache initially masked whether the fix even applied — resolved with the same full `rm -rf .next` + restart this file already documents as a recurring gotcha) and the empty-card-despite-real-coverage issue. Confirmed all 3 real topics show correct badges with real content (#Roman Anthony/#Celtics green via Sports, #Trump Administration orange via News), pencil icon opens pre-filled with the right topic and zone chip, `npx tsc --noEmit` and lint clean throughout (only pre-existing unrelated debt elsewhere).

**Not yet committed or deployed** — built and verified live against the dev server only this session.

**Part 9: Profile rewrite, per explicit direction — "Profile is just reference and can link out to each zone's Customize sheet."** Ruled out earlier in the session (a dismissed clarifying question had offered rebuilding the team/area/industry editors directly on Profile as an alternative) — you confirmed the link-out design instead, so Profile does no personalization writes of its own. New **Personalization** section reads the user's enabled zones, matches each to its `ZONE_TEMPLATES` entry, and — for any zone whose template declares a `personalization` kind (Sports/Local/Work, the same 3 from the Default Zone Catalog) — renders a summary row (color dot + kind label + a formatted one-line summary: team short names joined for Sports, area labels joined for Local, the raw string for Work) linking to that zone's own detail page, where the real Customize pill already lives. A zone that's disabled or has no `personalization` entry (News/Tech/Finance/Entertainment) simply doesn't produce a row — no empty placeholders. Also addressed the "sign out and switch accounts" ask: confirmed this app has no multi-account session infrastructure to build (signing out and signing back in with different credentials, including a different Google account, already works via the existing sign-in screen), so this shipped as a one-line caption under the existing `SignOutButton` clarifying that signing out is how you switch accounts, rather than inventing a second mechanism. The pre-existing `zip_code` reference row was left as-is (out of scope — nothing currently writes it, a separate known gap, not touched here).

**Verified live:** Personalization section shows real data — "Teams of Interest: Red Sox, Patriots, Celtics" (green dot) and "Local Areas: North Andover, MA, Boston, MA, New England..." (blue dot) — Work's row correctly absent since that zone is currently disabled; clicking a row navigates to that zone's detail page with its Customize pill visible; zero console errors; `npx tsc --noEmit` and lint clean.

**Files touched:** `lib/zone-templates.ts`, `lib/db/zones.ts`, `lib/actions.ts`, `lib/user-init.ts` (dead code removed), `lib/scores/teams.ts` (new), `lib/scores/metroTeams.ts` (new), `lib/geo/localAreas.ts` (new), `app/zones/manage/page.tsx` + `ZoneManageClient.tsx` (new, then redesigned per Part 5), `components/zones/CustomizeSheet.tsx` (new), `app/zones/[zoneId]/ZoneDetailClient.tsx` (Customize button + sheet, `ZoneRow` type; then Part 8's `handleTrack` fix), `app/zones/[zoneId]/page.tsx` (`force-dynamic`), `app/profile/page.tsx` (rewritten twice — link fix, then the full Personalization section per Part 9), `components/ui/BottomNav.tsx` (Manage Zones menu entry), `app/zones/ZonesHubClient.tsx` (dead `manageOpen` sheet removed, its button repointed; then Part 8's `handleTrack` fix), `app/InDepthClient.tsx` + `app/summary/SummaryClient.tsx` (`ZoneCard` resized to 300px + story-count UI removed — Part 6; upgraded to top-3-stories-per-zone — Part 7; `TrackingTopicCard` redesign + pill removal — Part 8), `lib/zonePreview.ts` (`topArticles` field — Part 7), `app/page.tsx` + `app/summary/page.tsx` (`topArticles` passthrough — Part 7; `trackingTopics` via `getTrackingPreview` — Part 8), `lib/trackingPreview.ts` (new, Part 8), `lib/trackedTopicZone.ts` (new, client-safe split, Part 8), `components/ui/TrackModal.tsx` (`mode` prop, Part 8), `app/tracking/page.tsx` + `TrackingClient.tsx` (zone-scoped search + fallback, pencil/edit flow, Part 8). No schema changes — everything reuses the existing `user_tracks.zone_id` column (previously unused by any working write path) and `zones.config`.

---

### Session 2026-07-15 — Zones page horizontal-scroll rework + Local Zone pipeline starvation fix

**Part 1: Zones page rework.** Per explicit request, replaced the one-card-per-zone `/zones` hub layout with one horizontal-scroll row per zone, matching Home's Breaking/Top Stories pattern instead of inventing a new one.

1. **Header** — zone name in the zone's own color, font size bumped to match (21px/800, up from the old 13px/700 section-head style). Applied consistently: also bumped Home's and Summary's own Breaking/Top Stories/Your Zones/Today/Tracking headers to the same size (same color scheme, just larger) per an explicit follow-up request, so all section headings across the app read at one consistent scale.
2. **Row content** — up to 9 stories per zone in the same 300px `TrackCard` format already used for Breaking/Top Stories (image hero or compact no-image header, zone pill, Save/Track buttons, "Full Coverage →"), fetched via `getZoneArticles(zoneType, config, 9)` (`lib/zonePreview.ts`, limit bumped from 3). Row ends with a new `ViewZoneCard` link card ("View {Zone} →", circular arrow icon) that navigates to `/zones/{id}`.
3. **Scores/Weather card reformat** (Sports/Local only) — per explicit follow-up correction, the lead card in these two zones' rows was changed from a solid `--sports-dark`/`--local-dark` fill covering the whole card to the same black-rectangle (`var(--surface)` + `var(--border-mid)` outline) format as the story cards: 3px zone-color top stripe, zone-name pill in the upper-left (not a "SCORES"/"WEATHER" label), score/weather rows on the plain black background, "View {Zone} →" bottom-right. Two structural bugs caught and fixed during this same follow-up, both explicit corrections:
   - The "View Zone" link wasn't bottom-aligned with the neighboring TrackCard's "Full Coverage →" — root cause: the flex row already stretches every card to the tallest card's height (confirmed via direct DOM measurement, both cards were exactly 251.97px tall), but the *inner content* wasn't filling that stretched height, so the link sat wherever the (shorter) natural content ended. Fixed by making the card a flex column (`display:flex, flexDirection:'column'`) with the link's container using `marginTop:'auto'` to push to the true bottom. Verified via direct pixel measurement: both links' `getBoundingClientRect().bottom` matched exactly (410.47px) after the fix.
   - The zone-name pill stretched to the card's full width instead of sizing to its own text — a side effect of the above flex-column change (a flex column's default `align-items: stretch` stretches direct children horizontally, including a `display:'inline-block'` span). Fixed with `alignSelf:'flex-start'` on the pill.
   - Also fixed, same follow-up: both teams'/rows' font sizes in the Scores Card weren't matching (opponent row was 13px/14px vs. the team's own row at 14.5px/15px) — unified to 14.5px (team name) / 15px (score) for both rows, keeping only font-*weight* (bold vs. regular) to indicate the winning team, as originally designed.
4. **"Your Zones" and Tracking cards restyled to match** (`app/InDepthClient.tsx` + `app/summary/SummaryClient.tsx`, kept in sync per the usual convention) — per explicit request, the 172px `ZoneCard`/`TrackingTopicCard` components dropped their image-hero-with-gradient-overlay look (`ZONE_GRADIENTS` background, "NEW"/"QUIET" badge over the image) for the same black-rectangle format: zone-color top stripe, zone pill + NEW/QUIET badge in a plain top row, headline, "View {Zone Label} →" bottom-right (Tracking cards keep "Open →" since a tracked topic doesn't map to one zone). `AddTrackingCard`/`ViewMoreTrackingCard` border-radius bumped 14px→16px to match.
5. **Dead code removed** — `components/zones/ZoneCard.tsx` (the old one-card-per-zone component) had no remaining callers after the rework and was deleted outright, not deprecated in place.

Verified live throughout (headless Chromium via `npx playwright`, real Supabase/ESPN/NWS data, direct DOM `getBoundingClientRect()` measurements for the alignment fixes rather than eyeballing screenshots — the bottom nav overlay obscures enough of the viewport that visual alignment checks alone were inconclusive on one comparison): all 4 zone rows render correctly, Sports/Local's Scores/Weather cards match the story-card format with a correctly-sized pill and bottom-aligned link, story-card and "View Zone" link-card clicks navigate correctly, zero console errors.

**Files touched (Part 1):** `app/zones/ZonesHubClient.tsx` (full rework), `app/zones/page.tsx` (fetch limit bump to 9, `initialSavedIds` added since the new cards are interactive), `app/InDepthClient.tsx` + `app/summary/SummaryClient.tsx` (header sizes, `ZoneCard`/`TrackingTopicCard`/`AddTrackingCard`/`ViewMoreTrackingCard` restyle), `components/zones/ZoneCard.tsx` (deleted). No schema changes.

**Part 2: Diagnosed and fixed a real Local Zone content-pipeline bug.** Mid-conversation, user reported Local Zone content still skewed heavily toward Wells/Maine content despite North Andover being the primary community. Investigation (not assumed — confirmed via direct Supabase queries and live dry-run scripts before touching any code):

1. **Root cause #1 — cross-source and cross-area starvation, not a fetch failure.** Queried the full `articles` table for `zone_type='local'`: zero rows ever from Eagle-Tribune, Salem News, Newburyport Daily News, Derry News, or Andover Townsman (the five curated North Andover-primary BLOX sources), despite 32 Portland Press Herald + 16 WGME rows (both tied to the Wells, ME secondary area). Reproduced the exact `fetchBloxSearch()` call path live (same `rss-parser` + mobile UA) — all 5 sources returned real, current North Andover content immediately; the fetch was never broken. The actual cause: the pipeline's final step merged every source's results and did a flat `sort by recency, cap at 15/8` — since WGME/Portland Press Herald (and, one level deeper, NHPR *within* North Andover's own source list) simply publish more frequently, their items were always more recent and completely filled every available slot, every single hourly run, regardless of the existing per-source cap of 6.
2. **Fix — two-level round-robin interleave** (`interleaveRoundRobin()`, `scripts/pipeline/index.ts`): within an area, each source's own items are capped at 6 and interleaved one-per-source per round (instead of merged-then-sorted); across areas, each area's own interleaved-and-capped-at-8 list is interleaved again the same way for the final 15. Verified via a read-only dry-run script (real live fetches, zero DB writes, dedup-checked against the live table) before touching production: North Andover's own bucket went from 6-of-8 slots held by NHPR alone to real representation across Eagle-Tribune, Salem News, Newburyport, Derry News, Andover Townsman, and NHPR; the final 15 went from zero North-Andover-tied articles to four.
3. **Root cause #2 — BLOX search has no recency filter.** After deploying fix #2 and triggering a real pipeline run, most of the newly-written BLOX articles turned out to have `published_at` over a year old (one from 2024) — the search endpoint ranks by relevance, not date, unlike Google News' `when:14d` param. These would never actually display (the app's own 14-day read-time window excludes them), so the fix, while structurally correct, yielded little visible improvement on this run. **Fixed:** added a client-side 14-day freshness filter to `fetchBloxSearch()` (`scripts/pipeline/sources/blox.ts`), verified live against all 5 sources before deploying — correctly surfaced genuinely fresh, real content (e.g. "Fireworks will illuminate Andover, North Andover") and correctly returned zero results for sources with no recent match, rather than falling back to stale evergreen content.
4. **Read-time prioritization, applied on top of the ingestion fix** (`lib/zonePreview.ts`, new `classifyLocalArticle()`/`applyLocalAreaPriority()`) — since ingestion-time fairness alone doesn't stop a genuinely-abundant secondary source from still winning individual slots by chance, primary-area articles (identified via `LocalArea.id`'s `-primary`/`-secondary` naming convention, source-name matched against each area's curated `directSources` first, headline/summary keyword match as a fallback for Google News results) get a +1 urgency boost before the existing `selectTopStories`/sort logic runs — the selection criteria themselves are untouched, only the input ranking is biased. Deliberately **not** applied to Breaking, which stays purely urgency/recency-driven zone-wide so a genuinely urgent story from any configured area still surfaces there. Wired into the Zone Detail page's Top Stories/Today (which now also fetches a separate, larger 45-row pool for Local specifically, since the standard 15-row pool can already be starved before re-ranking gets a chance to help) and into `getZoneArticles()`, which flows through to the Zones hub row and Home/Summary's zone-preview card automatically.

Both pipeline fixes were deployed (`npx vercel --prod`, two separate deploys) and verified against the live production pipeline via `POST /api/pipeline/trigger` (`{"zones":["local"]}`) — first run wrote 12 new articles including real Salem News/Newburyport/Derry News content (before the freshness filter); second run, after the freshness filter, wrote 4 new articles including genuinely current Eagle-Tribune and Andover Townsman content. Confirmed via direct Supabase queries after each run, not just trusting the trigger endpoint's summary counts.

**Known limitation surfaced by this investigation, not fixed:** Salem News, Newburyport, and Derry News currently have zero results matching "North Andover" within the new 14-day freshness window — not a bug, just an honest reflection that these town papers don't publish about North Andover specifically every day. This will fluctuate run to run as they publish; nothing to act on unless it persists.

**Files touched (Part 2):** `scripts/pipeline/index.ts` (`interleaveRoundRobin()`, local runner rewired), `scripts/pipeline/sources/blox.ts` (14-day freshness filter), `lib/zonePreview.ts` (`classifyLocalArticle()`, `applyLocalAreaPriority()`, local branch in `getZoneArticles()`), `app/zones/[zoneId]/page.tsx` (larger local-specific pool fetch, Breaking/Top-Stories/Today split updated to apply the boost after Breaking, saved-status lookup extended to cover the larger pool). No schema changes.

**Not yet committed to git** — both parts deployed straight from disk via `npx vercel --prod` (matching this repo's established deploy pattern), per CLAUDE.md update instructions at end of session; `git status` will show all touched files as modified/deleted until a commit is made.

---

### Session 2026-07-14 (cont'd) — Content-pipeline docs review + fetch-efficiency pass

Per explicit request, did two things: (1) brought the Content pipeline architecture section of this file back in line with the actual code (it had drifted — see below), and (2) reviewed the day's Zones hub/Menu changes for fetch efficiency and fixed what that review found.

**Docs drift found and fixed:** `scripts/pipeline/sources/blox.ts` (Local Zone's curated direct-RSS adapter, live since Phase 11) and `lib/scores/espn.ts` (Sports Zone's live Scores Card, live since Phase 8) were both missing from the "Pipeline file structure" tree despite being in production for weeks — only ever mentioned in Session log prose, not the reference architecture. The source-adapters table had no explicit News Zone row and didn't distinguish the two independent content paths that now exist: the hourly batch pipeline (writes to `articles`) vs. live, request-time fetches (ESPN scores, NWS weather — never touch `articles`, fetched fresh per page load). Rewrote the section with a full per-zone runner table, a dedicated Local Zone hybrid-sourcing subsection, and an accurate file tree.

**Fetch-efficiency findings (from reviewing today's Zones hub redesign, Phase 12):**
1. **Real, uncached duplication**: the hub now fetches live ESPN scores for Sports (new this session) and NWS weather for Local (pre-existing, but previously only truncated to `weather[0]`) — and a zone's own detail page fetches the *exact same data* again moments later when the user taps in from the hub, a very normal navigation path. ESPN's schedule response is ~3MB per team and both endpoints use `cache: 'no-store'` (Next's built-in fetch cache can't hold a response that size anyway — see the pre-existing comment in `espn.ts`), so this was a genuine, avoidable doubling of external API traffic, made concretely worse by today's hub change. **Fixed:** a small in-memory 60-second TTL cache (`lib/cache/ttlCache.ts`), wrapping the per-team ESPN fetch and per-zip NWS fetch. Best-effort only (no cross-instance persistence, doesn't survive a cold start) — but Vercel's Fluid Compute reuses warm instances across nearby requests, which is exactly the hub→detail navigation pattern this targets. Failed fetches are never cached (the helper only stores truthy results), so a transient upstream error still retries on the very next request instead of getting stuck for the full 60s window.
2. **Dead query**: `app/zones/page.tsx` still called `getZoneQuicklook(z.type)` per zone and passed a `quicklook` prop into `ZonesHubClient`, even though Phase 12 deleted the hub card's only quicklook-driven content (the old Finance stat-hero, part of the removed `buildHeroData()`). One fewer Supabase query per zone on every `/zones` load now. The zone *detail* page still legitimately uses quicklook for its `QuickLookStrip` (Finance only; gated off for Local) — that call site is untouched.

**Not changed, flagged as a smaller/optional follow-up:** the new `/api/zones/menu` route (Phase 13) duplicates a `getUserZones()` query that 5 of its 9 caller pages (Home, Summary, Zones hub, Zone Detail, Story Detail) already ran server-side moments earlier for the same user — `BottomNav` re-fetches it client-side anyway rather than accepting an optional prop, since 4 of the 9 call sites (Profile, Tracking, Saved, the embedded reader) don't otherwise have zone data at all. Threading a `zones` prop through the 5 pages that already have it (falling back to the client fetch only on the other 4) would close this, but touches several files' prop signatures for a small, on-demand (menu-open-only), small-payload query — lower priority than the ESPN/NWS fix above. Worth doing if/when those pages get touched for other reasons anyway.

Verified live (dev server, real ESPN/NWS/Supabase data): `/zones`, the Sports Zone detail page, and the Local Zone detail page all still render correct live Scores/Weather data after the cache + dead-query changes; zero console errors; timing spot-check showed a clear speedup on the second of two sequential `/zones` requests.

**Files touched:** `CLAUDE.md` (Content pipeline section rewrite), `lib/cache/ttlCache.ts` (new), `lib/scores/espn.ts`, `lib/weather/nws.ts`, `app/zones/page.tsx`, `app/zones/ZonesHubClient.tsx`. No schema changes. Deployed as commit `928d631`.

### Session 2026-07-14 (cont'd) — Direct zone links in the hamburger menu

Per explicit request, the Menu's "My Zones" item now expands to show a direct link to each of the user's zones, not just the `/zones` hub link. `BottomNav.tsx` (a single shared component, unlike most of this app's per-file-duplicated pieces — it's rendered from 9 different page trees: Home, Summary, Zones hub, Zone detail, Story detail, the embedded reader, Tracking, Saved, Profile) had no zone data available at several of those call sites (Profile, Tracking, Saved don't otherwise fetch zones at all). Rather than threading a `zones` prop through all 9 call sites' server components, added a small new route, `GET /api/zones/menu` (auth via the same `getEffectiveUser()` every page already uses, returns `{ id, label, color }[]`), and had `BottomNav` fetch it client-side the first time the menu is opened (not on every page load).

Sub-links render indented under "My Zones" with a small dot in the zone's own color, and navigate straight to `/zones/{id}` — bypassing the hub. Verified live: all 4 zones (Sports/Local/News/Tech) appear with correct colors, clicking one navigates directly to that zone's detail page, zero console errors, `/api/zones/menu` returns 200.

**Files touched:** `app/api/zones/menu/route.ts` (new), `components/ui/BottomNav.tsx`. No schema changes. Deployed as commit `db548b4`.

### Session 2026-07-14 (cont'd) — Zones hub card reformat

Per explicit request, the `/zones` hub card (`components/zones/ZoneCard.tsx`) was reformatted: the colored header now shows only the zone-name pill and the story-count indicator (dots + "N stories") — no headline/stat/schedule hero content. Any zone with a live data card on its own zone detail page (currently Sports' Scores Card, Local's Weather Card) shows that same card as its own block directly below the header, rendered as a `specialCard?: ReactNode` prop rather than the old `heroVariant`/`heroData` variant system. `ScheduleHeroContent`/`StatHeroContent`/`HeadlineHeroContent` and their `SPORT_DOT_COLORS` constant were deleted as dead code along with `buildHeroData()` (`app/zones/ZonesHubClient.tsx`). Story rows bumped from 2 to 3 per card, per explicit request ("up to 3 story cards").

`ScoresCard`/`WeatherCard`/`formatGameTime` were duplicated into `ZonesHubClient.tsx` from `ZoneDetailClient.tsx` (same per-file-copy convention already used for `TrackCard`/`ZoneCard` elsewhere), styled identically (solid `--sports-dark`/`--local-dark` fill, no card-level margin/border-radius since it now sits flush between the header above and story rows below, rather than as a standalone floating card like on the zone detail page). `app/zones/page.tsx` now fetches live scores (`getScoresForTeams`, sports only, mirroring the exact pattern in `app/zones/[zoneId]/page.tsx`) and passes the **full** weather array (previously only `weather[0] ?? null`) so the Zones hub can show every configured Local area (North Andover + Wells, ME), not just the first one.

Verified live (headless Chrome, mobile viewport, real Supabase/ESPN/NWS data): all 4 zone cards (Sports, Local, News, Tech) render correctly — headers show only zone name + story count; Sports/Local show their Scores/Weather card with clean header/card/story-row boundaries and no color-contrast issues; News/Tech have no special card and go straight to story rows; every card shows 3 stories; footer links unchanged. Zero console errors, zero failed network requests.

**Files touched:** `components/zones/ZoneCard.tsx`, `app/zones/ZonesHubClient.tsx`, `app/zones/page.tsx`. No schema/type changes. Deployed as commit `d96131a`.

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

**Part 6: Unsplash fallback activated, then rate-limit caching added.** The Unsplash fallback in `enrich/images.ts` had existed since the V3 rebuild but was never wired up — `UNSPLASH_ACCESS_KEY` was unset everywhere. User created a free Unsplash developer account and provided the Access Key (added to `.env.local` and Vercel's Production + Preview environments). Direct testing found real hit-rate limits: broad queries work well ("Boston" → 3989 results) but hyperlocal proper nouns often return zero ("North Andover High" → 0, "Wells HarborFest" → 0, "Northern New England faces" → 0) — roughly 3 of 7 realistic Local Zone headlines got no match using the existing "first 3 words of headline" query strategy. Not fixed this session (flagged, not addressed) — Unsplash simply won't help the most hyperlocal content, direct RSS sourcing (Part 7) is what actually solves that. Separately, user flagged the 50 req/hour free-tier limit — added query-result caching: `getCachedImage`/`setCachedImage` in `enrich/images.ts` reuse the `zone_quicklook` table's existing label/value shape under a sentinel `zone_type = '_image_cache'` (no new table — no direct Postgres/migration credentials were available to create one safely against the shared production DB). Verified live: a repeat query resolved from cache in ~130ms vs. a fresh ~1000ms Unsplash API call, same image reused.

**Part 7: Hybrid direct-RSS sourcing for Local Zone (real images) + Tech Zone diversification, same day.** Google News' redirect-link limitation (Part 3) meant Local Zone images could only ever be generic Unsplash stock photos at best. Per explicit request, investigated real news sources within ~20 miles of North Andover (01845) and Wells, ME (04090), plus named candidates (Eagle-Tribune, Salem Evening News, Portland Press Herald, Manchester Union Leader) — live-tested roughly 20 candidate URLs (newspapers, TV, radio) with a browser-like mobile User-Agent (desktop UA got a 429 from eagletribune.com; mobile did not). Confirmed working, in order of usefulness:
- **North Andover area**: Eagle-Tribune, Salem News, Newburyport Daily News, Derry News, Andover Townsman — all the same North of Boston Media Group CMS (BLOX/TownNews). The bare `/search/?f=rss` feed is a noisy "everything recent" dump (wire/syndicated press releases, raw image-asset filenames as fake titles) — querying with `?q=<town>&t=article` filters to genuinely clean local content. Plus NHPR (NH Public Radio) for regional flavor.
- **Boston metro**: `boston.com/feed/` and `universalhub.com/uhub.xml` (a well-established independent Boston-area aggregator) — both clean out of the box.
- **Wells, ME area**: `pressherald.com/feed/` (already known-good) and `wgme.com/news/local.rss` (Portland CBS affiliate) — both clean, though their coverage is Southern-Maine-broad rather than Wells-specific; Seacoastonline (the natural hyperlocal paper) has no working direct query endpoint (their on-site search returns 0 results even for terms Google News matches fine), so Wells' truly hyperlocal content (HarborFest, town votes) still comes via the Google News fallback.
- **Confirmed non-working**: Lowell Sun (403), Haverhill Gazette (connection failed), Boston Globe regional feeds (404, retired), Portsmouth Herald/York County Coast Star (connection failed), Journal Tribune (redirects to a dormant Press Herald subsection with stale syndicated content), WMUR/WMTW/Maine Public direct feeds (404/redirect, not pursued further).

Implementation: `LocalArea` (`types/index.ts`) gained an optional `directSources` array (`{ kind: 'blox', domain, name }` or `{ kind: 'rss', url, name }`); new `fetchBloxSearch()` (`scripts/pipeline/sources/blox.ts`) handles the query-scoped BLOX pattern with a defensive filter stripping any raw image-asset filenames that still slip through; the local zone pipeline runner (`scripts/pipeline/index.ts`) now fetches Google News + each area's `directSources` in parallel, caps each individual source before merging (so no one feed dominates), then sorts/caps at 15 as before. Since these are real article URLs (not Google redirects), the existing OG-image-scraping step works normally for all of them — no `enrich/images.ts` changes needed. Test profile's Local Zone areas were updated via a one-off script with the above curated sources. **Verified live: 14 of 15 fetched Local Zone articles now carry real article images (up from 0)**, sourced across Portland Press Herald, WGME, Boston.com, NHPR, and Universal Hub.

Same conversation, user asked for the same source-investigation treatment for Tech Zone. Unlike Local Zone, Tech Zone already had real images (Guardian's thumbnails + successful OG-scraping on HN's real external links) — so this was purely a coverage-diversity question, not an image fix. Live-tested a dozen leading tech-news RSS feeds; confirmed working with genuinely current, high-signal content: TechCrunch, The Verge (Atom format — `rss-parser` handles this transparently, no special-casing needed), Ars Technica, Wired, 9to5Mac, 9to5Google, Engadget, MIT Technology Review, ZDNet, VentureBeat (redirects to `/feed`), TechRadar (redirects to `feeds.xml`); Axios Technology 404'd. Per explicit choice, added the 4 most authoritative/highest-signal (TechCrunch, The Verge, Ars Technica, Wired) alongside the existing Guardian tech section + Hacker News (kept, since neither of those 4 replaces HN's community/startup-culture flavor or Guardian's broader framing), same per-source-cap-then-merge pattern as Local Zone. Verified live: all 6 sources contributing, 15/15 fetched articles carry real images, genuinely diverse current coverage (OpenAI hardware/lawsuit stories, Meta AI-driven layoffs, Windows 11 patch news, Instagram's AI image generator).

**Files touched (Parts 6–7):** `scripts/pipeline/enrich/images.ts` (Unsplash cache), `.env.local` + Vercel env vars (`UNSPLASH_ACCESS_KEY`), `types/index.ts` (`DirectSource`, `LocalArea.directSources`), `scripts/pipeline/sources/blox.ts` (new), `scripts/pipeline/index.ts` (local runner direct-sources wiring + tech runner's 4 new feeds). No schema changes.

**Part 8: Post-deploy follow-up, same day — stale pre-hybrid content + a bot-blocked source found.** User reported several Local Zone stories (including Home's "Your Zones" card and the Local Zone page's own Top Stories row) still had no image. Two distinct causes, both resolved:
1. **27 articles predating the hybrid-sourcing pipeline run** (all old Google-News-only content, created before `2026-07-14T22:17:47`) were still ranking above the new real-image content in the urgency-sorted selection used by both surfaces. Unlike earlier stale-data cleanups this session, most of this content was still genuinely on-topic (Wells HarborFest, North Andover HS football, Red Sox, Celtics) — not junk — just older and imageless. Deleted with explicit user confirmation; re-verified live: both surfaces now show real images throughout.
2. **Universal Hub (one of the new curated direct sources) blocks OG-image scraping** — confirmed via direct testing: `www.universalhub.com` returns `403` to the pipeline's scraper regardless of User-Agent (tried both the bot UA and a full desktop browser UA), unlike Eagle-Tribune's earlier 429 (which *was* fixable with a browser-like UA). This looks like CDN/Cloudflare-level bot protection, not a UA string issue — not fixed, accepted as a known per-source limitation; those articles fall through to Unsplash or the zone-color gradient, same as any other imageless article.

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

### Resolved — Local Zone pipeline starvation (confirmed fixed by deploy + live pipeline trigger, 2026-07-15)
- ~~Local Zone content skewed heavily toward the Wells, ME secondary area despite North Andover being primary~~ — **confirmed fixed 2026-07-15.** Two distinct, confirmed-via-live-testing root causes, both fixed: (1) the pipeline's final "merge everything, sort by recency, cap" step let high-frequency sources (WGME/Portland Press Herald on the secondary area; NHPR even *within* the primary area's own source list) completely starve lower-frequency sources — the five North Andover BLOX papers were fetching real content successfully on every run but never once survived the cut, for weeks — fixed with a two-level round-robin interleave (`interleaveRoundRobin()`, `scripts/pipeline/index.ts`); (2) the BLOX search endpoint has no recency filter (unlike Google News), so a well-matched but over-a-year-old article could win a slot ahead of fresh content — fixed with a 14-day client-side freshness filter (`scripts/pipeline/sources/blox.ts`). A third, read-time-only layer (`lib/zonePreview.ts`'s `applyLocalAreaPriority()`) further biases Top Stories/Today toward primary-area content without touching Breaking. See Session log 2026-07-15 for the full root-cause writeup, including the dry-run scripts used to verify each fix against live feeds before deploying.

### Resolved — recurring data corruption (confirmed fixed by deploy, 2026-07-14)
- ~~Production's hourly GitHub Actions cron was still running the OLD pipeline code~~ — **confirmed fixed 2026-07-14.** The deploy (`npx vercel --prod`, commit `64e0ec3`) completed at **2026-07-14T01:03:31 UTC** (confirmed via `vercel inspect`). Cross-referencing article `created_at` timestamps against that: every `zone_type='local'` row created *before* 01:03:31 UTC was old Guardian/NWS content (6 more stale batches accumulated in the gap between the last mid-session cleanup and the deploy actually completing); every row created *after* is genuinely local/regional Google News content (Bruins, Celtics, WBUR, Boston Herald, North Andover Patch/Realtor.com/andovertownsman.com stories, etc.) — confirmed by direct inspection, not just absence of Guardian source names. The pipeline itself was never broken post-deploy; the leftover pre-deploy rows just kept outranking the new content by urgency score until a final cleanup pass (2026-07-14, ~47 rows deleted, explicit user confirmation obtained). **Root-cause lesson:** after any deploy meant to fix a content-sourcing bug, check the deploy's exact completion timestamp and do one final stale-data cleanup pass for anything created before it — don't assume the last mid-session cleanup was also the last one needed.

### Not built yet
- **Onboarding flow** (`/onboarding`) — page does not exist (confirmed 2026-08-22: the directory itself exists but is empty — no `page.tsx`). New users still get default zones (news + tech, + local if a zip happens to be passed, which nothing currently does) auto-created silently via `initializeNewUser()`. There is no zip collection or zone picker at signup — `/zones/manage` (Phase 16) is the real UI for this now, but nothing routes a new user there yet. The middleware has a harmless no-op passthrough for `/onboarding` but nothing redirects into it.
- **News/Tech Zone "generic template" has no UI for managing tracked topics beyond the shared `TrackModal`** — same as every other zone, not a new gap, just noting the generic template (2026-07-14) inherits whatever Tracking limitations already exist elsewhere.
- **Custom zones (arbitrary user-defined topics, multi-source like Tech Zone's structure)** — deliberately deferred out of Phase 16's scope, see Session log 2026-08-22. Would need a new `articles.zone_id` column (today's `zone_type` column assumes one shared pool per built-in type, which breaks for per-user custom topics) and a per-zone pipeline runner, a genuinely different architecture from every zone built so far.

### Resolved — Sports/Local personalization now has real UI (2026-08-22, Phase 16)
- ~~Sports Zone team picker~~ / ~~Local Zone areas picker~~ — **both replaced the one-off setup scripts** (`scripts/setup-local-zone.ts` and the deleted sports-teams script) with real UI: a "Customize" button on the Sports/Local/Work Zone detail pages opens `components/zones/CustomizeSheet.tsx` — Sports gets a searchable, league-grouped multi-select (`lib/scores/teams.ts`, all 30/32 teams per MLB/NFL/NBA/NHL sourced directly from ESPN's own team-list endpoint, not hand-typed), Local gets an add/remove editor for up to 3 extra areas beyond the 3 zip-derived defaults (reuses `lib/geo/*`, same logic the old script ran by hand), Work gets a plain industry field (closing a gap where `requiresIndustry` existed but nothing ever read/wrote it). Additionally, adding a new Sports Zone via `/zones/manage` now auto-fills Teams of Interest from the zip's nearest metro (`lib/scores/metroTeams.ts`, a curated metro→team mapping covering ~45 of the 55 metros in `lib/geo/metros.ts` that actually have a major-league team) — same "derive a sensible default from zip, fully editable after" pattern Local Zone already established for its areas.

### Unconfirmed fix
- **Tracking topic removal persistence** — fix was applied (2026-07-06) but still not confirmed working, on production or otherwise. The delete itself works (DB shows 0 tracks after testing). The issue was the router cache. Fix: `revalidatePath('/tracking')` in server action + `router.refresh()` in client handler. As of 2026-07-10 there were 0 tracked topics in the (migrated) data, so this couldn't be exercised during that session's testing pass either — still needs an actual add-then-remove-then-navigate-away-and-back cycle. A real production sign-in account now exists (see Infrastructure above) making this testable at any time. If topics still reappear after navigating away and back, the next thing to check is whether `removeTrack` is actually completing before navigation (add a console.log to confirm).

### Untested at scale
- **Tracking section overflow states** (2026-07-12 redesign — see Session log) — the 0-topic and 1-topic states were verified live, but the 9-and-10-card overflow behavior (first 8 topics + a "View More" card + the Add card) was only verified by code review, since the test account had at most 1 tracked topic all session. Worth adding ~10 tracked topics to a test account and confirming the card count/ordering live before trusting it in production. Applies to both Home's Tracking section and the Sports Zone's sports-filtered one — they share the same overflow logic.
- **Sports Zone personalization not tested on a real phone** (2026-07-12) — Scores Card, Updates, and the Top Stories/Tracking/More restructure were only verified via dev-server emulation and headless-Chrome screenshots at various widths, never a physical device. See "Next session" Priority 2.
- **Local Zone and News/Tech Zone personalization not tested on a real phone** (2026-07-13/14) — Weather Card, Breaking/Top Stories/Today/Tracking/More were only verified via dev-server + headless-Chromium screenshots, same caveat as Sports above. All of it is deployed and confirmed working post-deploy (see Current status) — mobile is the only remaining unverified surface.
- **Zones hub card reformat and Menu zone sub-links not tested on a real phone** (Phases 12–13, 2026-07-14) — both verified only via dev-server + headless-Chrome screenshots at a 390px emulated viewport. Worth checking on an actual device: the Scores/Weather card's touch-target spacing right where it meets the header above and story rows below, and the Menu's indented zone sub-links (small tap targets, colored dots) for legibility/tap-accuracy at real phone scale.
- **Zones page horizontal-scroll rework not tested on a real phone** (Phase 15, 2026-07-15) — verified only via headless Chromium at a 390px emulated viewport, including precise `getBoundingClientRect()` measurements for the alignment fixes. Worth checking specifically: horizontal-scroll momentum/snap feel on a real touchscreen (emulation doesn't reproduce this), and whether the "View {Zone} →" link card at the end of each row is an obvious/discoverable affordance at real thumb-scroll speed.

### Content precision
- **Team-name matching is a plain case-insensitive substring check**, not real entity recognition — used both for the Top Stories/More split (does this article mention a Team of Interest?) and, more narrowly, for gating what counts as "game-specific" in Updates (does it name the actual last/next opponent?). Confirmed via live testing this produces false positives: a Detroit Tigers coaching-change article was pulled into Red Sox coverage because its summary happened to mention "former Boston Red Sox manager Alex Cora." This matches the substring-matching approach already used elsewhere in the app (e.g. Tracking's `searchArticlesByTopic`), so it's a pre-existing tradeoff, not a new regression — but it's the first thing to check if Sports Zone content ever looks off-topic.
- **Google News RSS is an unofficial/undocumented endpoint** (no formal API contract like the Guardian Content API) — stable in practice for years, but could change without notice. Used for all Local Zone content (community/metro/region tiers).
- ~~Google News queries weren't quoted as exact phrases~~ — **fixed 2026-07-14**: `fetchGoogleNews()` sent multi-word queries unquoted (`q=Wells Maine`), which Google matches as a loose keyword set rather than a phrase — confirmed live to produce false positives (a "Nolan Wells" true-crime story matched the "Wells Maine" town query). Every query (`scripts/pipeline/sources/googlenews.ts`) is now wrapped in literal quotes before encoding. This risk was latent in every prior query (North Andover, Boston, New England) too; they just hadn't triggered it yet.
- **Google News-sourced articles never get real OG images or true in-app embedding** — their `sourceUrl` is a Google redirect page (`news.google.com/rss/articles/...`), not the publisher's real article URL (the actual destination only resolves client-side via JS). `enrich/images.ts` deliberately skips OG-scraping these (would otherwise grab Google's own generic branding image) — they fall back to Unsplash or the zone-color gradient instead. The embedded "Full Coverage" reader (added 2026-07-13) will always show its "open in browser" interstitial for these links rather than truly embedding, since `news.google.com` sends `X-Frame-Options: SAMEORIGIN` — "Open in Browser" still works correctly. ~~This applied to every Local Zone article~~ — **substantially addressed 2026-07-14**: curated direct RSS sources (Session log Part 7) now cover most of the North Andover/Boston/Wells content, so most Local Zone articles have real images again; Google News is still the fallback for whatever those direct sources don't cover (e.g. Wells' truly hyperlocal news, since Seacoastonline's own search doesn't cooperate), and that subset still has the redirect-link limitation. ~~The empty-hero-image layout issue this caused~~ — **fixed 2026-07-13**: `StoryCard`/`TrackCard` render a compact header row instead of a full empty gradient block when `imageUrl` is absent, regardless of cause.
- **Unsplash's stock library has no coverage for hyperlocal proper nouns** — confirmed 2026-07-14: "North Andover High," "Wells HarborFest," and similar town/event-specific queries return zero results even with the fallback active. It helps broad topics (city names, weather, sports) but not the most hyperlocal content — direct RSS sourcing is what actually solves that, not Unsplash.
- **Universal Hub (one of the curated Local Zone direct sources) blocks OG-image scraping** — confirmed 2026-07-14: `www.universalhub.com` returns `403` to the pipeline's scraper regardless of User-Agent (tried both the bot UA and a full desktop browser UA). Looks like CDN/Cloudflare-level bot protection rather than a simple UA-string check (unlike Eagle-Tribune's earlier 429, which a browser-like UA did fix). Not resolved — accepted as a per-source limitation; those articles fall through to Unsplash or the zone-color gradient.

### Fetch efficiency
- **`/api/zones/menu` (Phase 13) duplicates a `getUserZones()` query 5 of its 9 caller pages already ran server-side moments earlier** — Home, Summary, Zones hub, Zone Detail, and Story Detail all already fetch the user's zones for their own render, but `BottomNav` still re-fetches its own copy client-side on menu-open rather than accepting it as an optional prop, since the other 4 call sites (Profile, Tracking, Saved, the embedded reader) don't have zone data available at all. Fine as-is (small payload, on-demand only) — worth closing if any of those 5 pages get touched for other reasons anyway. See Session log 2026-07-14 (fetch-efficiency pass) for the full writeup.

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

**Updated 2026-08-22 (end of day)**, now covering Phase 16 (Zone Management + Tracking overhaul + Profile) on top of everything through Phase 15. Priority 0 is committing and deploying Phase 16 — it's built and verified against the dev server only, not yet in git or on Vercel.

**Explicit direction for next session's Zones work:** continue refining how each zone is customized, **starting with Sports Zone** — the current Customize sheet (team picker) works but hasn't had a real design/UX pass yet. **Custom zones (arbitrary user-defined topics) are on hold** — deliberately not part of this next round, revisit only when asked.

### Priority 0 — Commit and deploy Phase 16
`git status` will show Phase 16's new/changed files (see Session log 2026-08-22 for the full list) as untracked/modified — none of it is committed or deployed (`npx vercel --prod`) yet. This repo has hit the "built but not committed" gap before (the V3 rebuild sat uncommitted for months, see `project_git_deploy_gap` in memory) — commit and deploy before starting further work, don't let it compound.

### Priority 0.5 — Get Phase 16 on a real phone
Same caveat as every UI phase before it — `/zones/manage`, the Customize sheets, the redesigned Tracking cards, and the new Profile Personalization section were only verified via dev-server + headless Chromium (drag-and-drop specifically only via simulated mouse drag, never a real touch gesture). Specifically worth checking on a real device: the Sports team picker's search input and league-grouped chip grid at real thumb-scroll speed, the pointer-based drag-and-drop's feel with actual touch input, and the turn-on setup prompt's inline zip/industry field (native mobile keyboard behavior, `inputMode="numeric"` on the zip field).

### Priority 0.6 — Sports Zone Customize refinements (explicit next-session starting point)
The team picker (search + league-grouped chip grid) is functional but was built quickly to close the "one-off script" gap — worth a real pass on layout/interaction now that the underlying data (real ESPN team catalog) and write path (`updateZoneCustomization`) are solid. Revisit each zone's Customize sheet one at a time, Sports first; hold off on custom (arbitrary-topic) zones per the explicit direction above.

### Priority 1 — Get Phase 15 (2026-07-15) on a real phone
The Zones page horizontal-scroll rework was only verified via headless Chromium at a 390px emulated viewport, including the bottom-alignment/pill-width fixes (done via precise `getBoundingClientRect()` measurements, not eyeballing). Specifically worth checking on a real device: horizontal-scroll momentum/snap feel (emulation doesn't reproduce this), and whether the "View {Zone} →" link card at the end of each row reads as an obvious affordance at real thumb-scroll speed. Separately, confirm the Local Zone pipeline fix is visibly working — check `/zones/{local-zone-id}` for genuine North Andover-tied stories (Eagle-Tribune/Salem News/Andover Townsman/Newburyport/Derry News source names) mixed in alongside Boston/Wells content, not just Maine-heavy like before. Content will keep improving run-over-run as the hourly cron picks up fresher BLOX articles — if it still looks entirely Maine-heavy after a few hours, re-open the investigation (see Session log 2026-07-15 for the full diagnostic approach, reusable for future pipeline-mix complaints).

### Priority 2 — Get Phases 10–14 (2026-07-14) on a real phone
Covers both the original home-page restructure AND the same-day Sports Zone personalization work (Scores Card, Updates, Top Stories/Tracking/More restructure) — none of it has been checked on a real phone yet, only dev-server emulation + headless-Chrome screenshots at various widths. Check the hamburger menu bottom sheet, horizontal-scroll rows (pill row, Updates, Tracking), and Story Card layout for touch-target or viewport issues that don't show up in emulation. The real production sign-in account (see Infrastructure) now has live Red Sox data to look at, not just placeholder/empty states.

### Priority 3 — Confirm Tracking section overflow states with real data
Add ~10 tracked topics to the test account and confirm the 9-and-10-card layout (8 topics + View More + Add) actually renders and behaves as designed — see "Untested at scale" in Known issues. This now applies to **two** Tracking sections (Home's and the Sports Zone's sports-filtered one), both share the same overflow logic.

### Priority 4 — Fix the `relativeTime()` hydration warning
A background task was already spawned for this on 2026-07-12 (see Known issues) — check whether it landed before redoing the work.

### Priority 5 — Confirm tracking-topic-removal persistence fix
Still unconfirmed since 2026-07-06 (see Known issues) — a real production account now exists, so this is easy to test whenever it comes up.

### Priority 6 — Remaining content-management inconsistencies
The user's original Priority 2 (2026-07-10 plan) was broader than just story duplication — ask if there are other pipeline/content issues still open before assuming this is fully closed out.

### Priority 7 — Zones work (substantially addressed 2026-07-12 through 2026-07-15, follow-ups below)
Sports and Local both got full personalization build-outs, that personalization now reaches every zone-preview surface (not just the detail page), and the test profile is down to its intended 4 zones (Sports/Local/News/Tech) with a shared generic template for News/Tech — see Session log for the full breakdown. Loose ends, roughly in priority order:
1. **No UI to manage Teams of Interest or Local areas** — both still hardcoded for the test user via one-off scripts (`zones.config.teams`, `zones.config.areas`). A real settings flow is onboarding-adjacent; either fold it into Phase 6 (Priority 8) or build a lightweight standalone settings screen first if onboarding stays blocked.
2. ~~Scores Card background color churned through 5 values with no matching design token~~ — **done 2026-07-13**: `--sports-dark`/`--local-dark` tokens added to `styles/tokens.css`, `ScoresCard` now references `var(--sports-dark)`.
3. **Team-name matching is substring-based (ILIKE-style)** for the Top Stories/More split and the game-specific Updates filter — confirmed false-positive-prone (a Tigers article got pulled in via an incidental "former Red Sox manager" mention). Fine for now, but if content quality complaints come up, this is the first place to look.
4. ~~Other zones (Local, Finance, Work, etc.) got none of this personalization treatment~~ — **Local Zone done 2026-07-13**, and **zone-preview personalization now reaches Home/Summary/Zones-hub too (2026-07-14)**, not just the detail page. Finance/Entertainment zones were deleted for this test profile (rebuildable later); Work zone was never created for this user; ask whether any of those want a real build-out before assuming News/Tech's generic template is the final word for them.
   - ~~Deleted Finance zone still leaked into Home/Summary's Breaking/Top Stories~~ — **fixed 2026-07-14**: `getTopArticles()` (`lib/db/articles.ts`) had no zone filter at all, so content from any zone type with no active zone (the Finance pipeline runner keeps running per the "rebuildable later" decision) could still surface. Now scoped to the user's own active zone types — see Session log Part 5. Same fix protects against `'work'`'s pipeline runner doing the same thing, which was a latent, previously-undetected risk.
5. **Local Zone's own loose ends** (2026-07-13/14): Google News RSS is an unofficial endpoint and its redirect links mean no real OG images or true in-app embedding for any Local/News/Tech-zone article sourced from it (see Known issues → Content precision — the empty-space *layout* issue this caused is fixed, the missing images themselves aren't); the shared-article-pool architecture means content still isn't literally per-user, same limitation Sports already has. ~~Local Zone content mix skewed heavily toward the secondary (Wells, ME) area~~ — **fixed 2026-07-15**: a two-level pipeline starvation bug plus a BLOX search freshness gap, see Known issues → Resolved and Session log 2026-07-15. Genuinely fresh North Andover content had never once survived the pipeline's old selection step, despite fetching successfully every run for weeks — worth remembering as the first thing to check if any *other* zone's content mix ever looks unexpectedly skewed toward one source.
6. **News/Tech Zone's generic template is brand new (2026-07-14) and deployed, but untested on mobile** — see Priority 2.
7. **`/api/zones/menu` duplicates a zones query 5 pages already have server-side** (Phase 13/14, see Known issues → Fetch efficiency) — small and on-demand, not urgent, but worth closing by threading a `zones` prop through Home/Summary/Zones-hub/Zone-Detail/Story-Detail (falling back to the client fetch only on Profile/Tracking/Saved/the embedded reader) if any of those pages get touched for other reasons anyway.

### Priority 8 — Build Phase 6: Onboarding (deliberately last)
Do this only after the above are solid — the user's reasoning: onboarding is best built/tested against stable surrounding product surfaces rather than a moving target, and is best paired with a fixed/static test user ID rather than rebuilding real signup flows prematurely.

3-step flow at `app/onboarding/page.tsx` (see `BUILDPLAN.md` Phase 6 prompt for full spec):
- Step 1: Zip code (optional, enables Local zone)
- Step 2: Zone template picker — tap cards, not checkboxes; pre-select News + Local
- Step 3: Narrowing question (city for Sports, industry for Work) — skip if neither selected
- Activation screen: calls `addZoneFromTemplate`, triggers pipeline, redirects to `/zones`
- Middleware guard: users with existing zones who visit `/onboarding` → redirect to `/zones`

### Priority 9 — Design fixes from critique
Address the highest-impact gaps from `prototypes/distilled-design-critique.md`:
1. **Track card urgency state** — add "something changed" indicator and deadline countdown badge to track cards (read `prototypes/briefing-concepts.html` for new layout concepts)
2. **AI synthesis in feed** — add 1-sentence AI prose below headline on each signal item in the compact `StoryItem` row (Summary View)
3. **Zone card status signal** — add new-story count or urgency ring to ZoneCard header

### Deploy reminder
Always run `npx vercel --prod` after any code change — GitHub auto-deploy is unreliable (the user is disabling the GitHub Git integration in the Vercel dashboard as of 2026-07-14 to stop it attempting/notifying entirely; confirm next session whether that's done). **New lesson (2026-07-14):** if a session's work includes a one-off script that changes the shape of live DB data (new zone types, deleted zones/rows), deploy the matching code immediately after running that script — don't let DB and deployed-code state drift out of sync, even briefly, since the shared production DB is also what real sign-in accounts use.
