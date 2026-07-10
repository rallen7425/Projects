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

**The four core screens:**
- **Today** (`/`) — urgency-sorted briefing across all zones: Critical, Your Day, On Your Radar, When You Have a Moment
- **Zones** (`/zones`) — hub showing all user zones as cards with live hero stats/schedules/headlines; tap into any zone for full story list
- **Tracking** (`/tracking`) — topics the user is actively following, with live article carousels
- **Read Later** (`/saved`) — bookmarked articles, filterable by zone

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
--maine:         #EF9F27
--tech:          #A78BFA
--finance:       #34D399

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
  type        text not null,   -- 'sports' | 'local' | 'maine' | 'tech' | 'finance' | 'work' | 'entertainment'
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
| Local weather | NWS | `api.weather.gov` — no key, zip → coordinates via `api.zippopotam.us` (Census API was broken) |
| Sports | ESPN + team RSS | Public RSS feeds (no API key) |
| Finance | Alpha Vantage | Free tier (25 calls/day — sufficient for indices) |
| Images (fallback) | OG extraction | `cheerio` scrapes `og:image` from article URL |
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
    weather.ts      ← NWS weather adapter
    sports.ts       ← ESPN + team RSS adapter
    finance.ts      ← Alpha Vantage adapter
  enrich/
    images.ts       ← OG image extraction with cheerio
    summarize.ts    ← batched Claude Haiku calls
  write.ts          ← dedup check + Supabase upsert
  types.ts          ← shared RawArticle and ProcessedArticle types

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

**Important:** The `headlines` template maps to `type: 'maine'` — Maine/general headlines share the same zone type. New users get `headlines` (→ maine) + `tech` zones auto-created via `initializeNewUser()` in `lib/user-init.ts`.

```typescript
// lib/zone-templates.ts — abbreviated
headlines → type: 'maine'   // general news, Guardian + RSS
tech      → type: 'tech'    // Guardian tech + HN RSS
sports    → type: 'sports'  // ESPN RSS (requiresZip)
local     → type: 'local'   // NWS weather + local RSS (requiresZip)
finance   → type: 'finance' // Alpha Vantage + Guardian finance
work      → type: 'work'    // Guardian money/careers (requiresIndustry) — NOT 'business'; finance uses that section
entertainment → type: 'entertainment' // Guardian culture
```

---

## Current status

**Phase 5 complete — app is live and functional.**

All V2 code has been deleted. The full V3 app is deployed at https://distilled-news.vercel.app.

### What's been built

| Phase | What | Status |
|---|---|---|
| 1 | Design system, components (`components/ui/`, `styles/tokens.css`) | ✅ Done |
| 2 | Supabase schema (6 tables), RLS policies, `types/supabase.ts` | ✅ Done |
| 3 | Content pipeline — Guardian, RSS, NWS weather, ESPN, Alpha Vantage, Claude Haiku summarization | ✅ Done |
| 4 | Auth — email/password sign-up/sign-in, OAuth callback, `middleware.ts`, `initializeNewUser` | ✅ Done |
| 5 | All 6 pages wired to live Supabase: Today, Zones hub, Zone detail, Story detail, Tracking, Read Later | ✅ Done |
| 6 | Onboarding flow | ❌ Not built |

### Route inventory

```
/                          Today page — top 30 articles, urgency buckets
/zones                     Zones hub — user's zones as cards with live hero data
/zones/[zoneId]            Zone detail — "Top Stories" sorted by recency (zoneId = zone UUID)
/zones/[zoneId]/story/[storyId]  Story detail (zoneId = zone TYPE string e.g. 'sports')
/tracking                  Tracked topics with article carousels
/saved                     Read Later with zone filter pills
/auth/signin               Email + Google sign-in
/auth/signup               Email sign-up → "check your email" confirmation screen
/auth/callback             OAuth + email confirmation handler
/profile                   Profile page with sign out
/api/pipeline/trigger      POST — runs content pipeline (requires x-cron-secret header)
```

**URL asymmetry to be aware of:** Zone detail uses the zone's database UUID (`/zones/{uuid}`). Story detail uses zone type string (`/zones/sports/story/{uuid}`). This is intentional — stories link directly without knowing the user's zone UUID.

### Infrastructure

- **Supabase project:** `qyjkqfgodgnjlvjdyuci` (us-east-1)
- **All env vars set** in Vercel and `.env.local` (SUPABASE_URL, SUPABASE_ANON_KEY, SERVICE_ROLE_KEY, GUARDIAN_API_KEY, ANTHROPIC_API_KEY, ALPHA_VANTAGE_KEY, CRON_SECRET)
- **Pipeline is running hourly** via GitHub Actions — ~90–95 articles per day across 7 zones
- **`zone_quicklook` unique constraint** added: `unique(zone_type, label)` ✅

---

## Session log

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

---

## Known issues / what's broken

### Not built yet
- **Onboarding flow** (`/onboarding`) — page does not exist. New users get default zones (maine + tech) auto-created silently. There is no zone customization, zip code collection, or zone picker. The middleware allows `/onboarding` but the route 404s.

### Unconfirmed fix
- **Tracking topic removal persistence** — fix was applied (2026-07-06) but not yet confirmed working on production. The delete itself works (DB shows 0 tracks after testing). The issue was the router cache. Fix: `revalidatePath('/tracking')` in server action + `router.refresh()` in client handler. If topics still reappear after navigating away and back, the next thing to check is whether `removeTrack` is actually completing before navigation (add a console.log to confirm).

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

### Priority 0 — Confirm tracking fix
If the user reports topics still reappearing after navigating away and back, the router cache fix may not be enough. Next step: add a `console.log` inside `removeTrack` on the server and `handleDelete` on the client to confirm the delete is completing before navigation. If it is, the issue is purely the router cache and `router.push('/tracking')` (hard navigation) instead of `router.refresh()` may be needed.

### Priority 1 — Build Phase 6: Onboarding
3-step flow at `app/onboarding/page.tsx` (see `BUILDPLAN.md` Phase 6 prompt for full spec):
- Step 1: Zip code (optional, enables Local zone)
- Step 2: Zone template picker — tap cards, not checkboxes; pre-select Headlines + Local
- Step 3: Narrowing question (city for Sports, industry for Work) — skip if neither selected
- Activation screen: calls `addZoneFromTemplate`, triggers pipeline, redirects to `/zones`
- Middleware guard: users with existing zones who visit `/onboarding` → redirect to `/zones`

### Priority 2 — Design fixes from critique (after onboarding)
Address the highest-impact gaps from `prototypes/distilled-design-critique.md`:
1. **Track card urgency state** — add "something changed" indicator and deadline countdown badge to track cards (read `prototypes/briefing-concepts.html` for new layout concepts)
2. **AI synthesis in feed** — add 1-sentence AI prose below headline on each signal item in TodayClient
3. **Zone card status signal** — add new-story count or urgency ring to ZoneCard header

### Deploy reminder
Always run `npx vercel --prod` after any code change — GitHub auto-deploy is unreliable.
