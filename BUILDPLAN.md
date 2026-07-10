# Distilled — Build Plan & Claude Code Prompts

This document contains the exact prompts to use in Claude Code, one per phase. Complete each phase fully and commit before starting the next. Claude Code starts each session with no memory of prior sessions — every prompt is self-contained.

---

## How to use this document

1. Open the `distilled` folder in Claude Code
2. Read the phase goal and "before you start" checklist
3. Paste the prompt exactly as written
4. Verify the "done checklist" before committing
5. `git add . && git commit -m "Phase N: [description]"` then start the next phase
6. After each commit, update `CLAUDE.md` → "Current build phase" to reflect where you are

**One phase per Claude Code session.** Context windows are finite — a focused session on one phase produces better output than trying to do everything at once.

---

## Phase 1 — Design System & Core Components

**Goal:** Dark theme in place, all shared UI components built from the HTML prototypes. No data fetching. No page changes yet.

**Before you start:**
- No prerequisites — this is the first phase

---

### PROMPT — Phase 1

```
We're building Distilled, a mobile-first AI-powered personal news app. Read CLAUDE.md first for full context.

This session is Phase 1: design system and core UI components. We are NOT touching pages, data fetching, or the database yet. Components only.

## Step 1: Read the design prototypes

Read these files in full before writing any code. They are the authoritative design spec:
- prototypes/distilled-v3-concept.html
- prototypes/distilled-zones.html
- prototypes/distilled-tracking.html
- prototypes/distilled-read-later.html

## Step 2: Design tokens

Create `styles/tokens.css` containing the CSS custom properties from CLAUDE.md (Design tokens section). Then update `app/globals.css` to:
- Import tokens.css
- Set html/body background to var(--bg)
- Set default text color to var(--text)
- Remove all light-theme styles from the existing globals.css

Update `tailwind.config.ts` to extend colors with the zone colors and primary colors as Tailwind aliases so they can be used as `text-sports`, `bg-tech`, etc.

## Step 3: Build these components

Build each component in `components/ui/`. Each must be a typed React component. Extract the exact CSS patterns from the prototype HTML files — do not invent styles.

**`components/ui/BottomNav.tsx`**
Floating pill nav with blur backdrop. 4 tabs: Today, Zones, Tracking, Read Later. Props: `activeTab: 'today' | 'zones' | 'tracking' | 'saved'`. Each tab has an icon (SVG inline) and label. Active tab uses `--primary-subtle` background, icon and label in `--primary`. Inactive tabs at 0.62 opacity. Reference: `.bottom-nav` in distilled-v3-concept.html.

**`components/ui/AppHeader.tsx`**
Sticky header with blur backdrop (`rgba(9,9,14,0.92)`), `backdrop-filter: blur(24px)`. Props: `title: string`, `rightSlot?: React.ReactNode`. Padding: `52px top 20px sides 14px bottom` (accounts for status bar). Reference: `.app-header` in distilled-v3-concept.html.

**`components/ui/ZonePill.tsx`**
Small colored zone label chip. Props: `zone: ZoneType`, `size?: 'sm' | 'md'`. Renders the zone name ("Sports Zone", "Local Zone", etc.) with zone-appropriate color and background. Reference: `.zpill` in distilled-v3-concept.html.

**`components/ui/StoryItem.tsx`**
Single article row. Props: `article: ArticleDisplay`, `onSave: () => void`, `onTrack: () => void`, `isSaved: boolean`. Layout (top to bottom): meta row (ZonePill + tag + new/urgent dots + timestamp + save button + track button), headline, summary (3-line clamp), source chips. The meta row must appear ABOVE the headline. Reference: `.signal-item` in distilled-v3-concept.html.

**`components/ui/ZoneSubNav.tsx`**
Horizontal zone navigation tabs. Props: `activeZone: ZoneType | 'all'`, `onSelect: (zone: ZoneType | 'all') => void`. Uses `display: flex` (NOT overflow scroll) so all tabs fit without scrolling. Each tab is two lines: zone name (11px, bold) on line 1, "Zone" or "Zones" (9px, uppercase) on line 2. Both lines same color — set on the parent element, not individually. Active tab shows zone color underline. Reference: `.zone-subnav` in distilled-zones.html.

**`components/ui/QuickLookStrip.tsx`**
Horizontal scrolling stat chips. Props: `items: Array<{label: string, value: string, sub?: string}>`, `zoneType: ZoneType`. Each chip has colored left border using zone color. Reference: `.quick-look` in distilled-zone-detail.html.

**`components/ui/TrackModal.tsx`**
Bottom sheet modal for tracking a topic. Props: `open: boolean`, `onClose: () => void`, `initialTopic?: string`, `initialZone?: ZoneType`, `aiMode?: boolean`. When `aiMode` is true, show "✦ Analyzing article…" placeholder with purple border glow, input readonly and confirm disabled, then after 750ms populate with initialTopic/initialZone and show "✦ AI" tag. Zone chips: No zone, then all 5 zones. Deadline toggle. Reference: full TrackModal in distilled-v3-concept.html.

**`components/ui/Toast.tsx`**
Simple toast notification. Props: `message: string`, `visible: boolean`. Positioned above bottom nav. Reference: `.toast` in distilled-v3-concept.html.

**`components/zones/ZoneCard.tsx`**
Zone hub card with three hero template variants. Props: `zone: ZoneConfig`, `heroVariant: 'schedule' | 'stat' | 'headline'`, `heroData: ScheduleHero | StatHero | HeadlineHero`, `stories: ArticleDisplay[]`, `onClick: () => void`. Each card: colored gradient header (zone color at 22% opacity), zone pill + story dots row, hero content, 2 story rows with colored left bar, "View [Zone Name] →" footer link. Reference: `.zone-card` in distilled-zones.html.

## Step 4: Shared types

Create `types/index.ts` with:
```typescript
export type ZoneType = 'sports' | 'local' | 'maine' | 'tech' | 'finance' | 'work' | 'entertainment'

export type ArticleDisplay = {
  id: string
  headline: string
  summary: string
  imageUrl?: string
  sourceName: string
  sourceUrl: string
  publishedAt: string
  urgencyScore: number
  zoneType: ZoneType
  tags: string[]
  isNew?: boolean
  isUrgent?: boolean
}

export type ZoneConfig = {
  id: string
  type: ZoneType
  label: string          // "Sports Zone", "Local Zone", etc.
  enabled: boolean
  position: number
}
```

## Do NOT do in this phase
- No Supabase imports
- No data fetching
- No changes to page files in app/
- No deletion of existing V2 pages (leave them in place)

## Verify before finishing
- Run `npm run build` — must compile with no errors
- All components accept their typed props
- No light-theme colors remain in globals.css
- tokens.css exists and is imported
```

---

**Done checklist — Phase 1:**
- [ ] `styles/tokens.css` created
- [ ] `app/globals.css` is dark-themed, imports tokens
- [ ] `tailwind.config.ts` has zone color aliases
- [ ] All 8 components exist in `components/ui/` and `components/zones/`
- [ ] `types/index.ts` exists with ZoneType and ArticleDisplay
- [ ] `npm run build` passes

---

## Phase 2 — Supabase Setup & Database Schema

**Goal:** Database schema created and migrated, typed Supabase client in place, environment variables configured.

**Before you start:**
- Complete the Supabase setup checklist in CLAUDE.md
- Have `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`

---

### PROMPT — Phase 2

```
We're building Distilled, a mobile-first AI-powered news app. Read CLAUDE.md first for full context.

This session is Phase 2: Supabase setup and database schema. We are NOT building the pipeline or auth UI yet — just the database layer and typed client.

## Step 1: Install dependencies

```bash
npm install @supabase/supabase-js @supabase/ssr
```

## Step 2: Create migration files

Create a `supabase/migrations/` directory. Create `supabase/migrations/001_initial_schema.sql` containing the complete schema from CLAUDE.md (Database schema section). Include:
- All 6 tables: users, zones, articles, user_saves, user_tracks, zone_quicklook
- Indexes: `articles(external_id)` unique, `articles(zone_type, published_at)`, `articles(urgency_score)`, `user_saves(user_id)`, `user_tracks(user_id)`
- RLS enable on all tables
- RLS policies: users/zones/user_saves/user_tracks require `auth.uid() = user_id`; articles and zone_quicklook are readable by any authenticated user; articles and zone_quicklook are writable only by service role

## Step 3: Supabase client helpers

Create `lib/supabase/client.ts` — browser client (uses anon key):
```typescript
import { createBrowserClient } from '@supabase/ssr'
export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
```

Create `lib/supabase/server.ts` — server client (for Server Components and API routes):
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
export const createServerSupabase = () => {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  )
}
```

Create `lib/supabase/service.ts` — service role client (pipeline use only, never call from browser):
```typescript
import { createClient } from '@supabase/supabase-js'
export const createServiceClient = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
```

## Step 4: Generate TypeScript types

After running the migration in the Supabase dashboard, run:
```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/supabase.ts
```
If the CLI isn't available, create `types/supabase.ts` manually with types matching the schema from CLAUDE.md.

## Step 5: Data access helpers

Create `lib/db/articles.ts`:
- `getArticlesByZone(zoneType, limit = 15)` — fetch articles for a zone, ordered by urgency_score desc, published_at desc
- `getArticleById(id)` — fetch single article
- `getTopArticles(limit = 20)` — fetch highest urgency articles across all zones for Today page
- `searchArticlesByTopic(topic)` — for Tracking page

Create `lib/db/zones.ts`:
- `getUserZones(userId)` — fetch user's zones ordered by position
- `updateZoneConfig(zoneId, config)` — update zone jsonb config
- `toggleZone(zoneId, enabled)` — enable/disable a zone

Create `lib/db/saves.ts`:
- `getSavedArticles(userId)` — fetch user_saves joined with articles
- `saveArticle(userId, articleId)` — insert user_save
- `unsaveArticle(userId, articleId)` — delete user_save
- `isSaved(userId, articleId)` — boolean check

Create `lib/db/tracks.ts`:
- `getTrackedTopics(userId)` — fetch user_tracks
- `trackTopic(userId, topic, zoneId?, deadlineAt?)` — insert user_track
- `untrackTopic(id)` — delete user_track

## Step 6: Middleware for auth

Create `middleware.ts` at the project root:
- Protect all routes except `/`, `/auth/signin`, `/auth/signup`, `/auth/callback`
- Redirect unauthenticated users to `/auth/signin`
- Use `@supabase/ssr` middleware pattern for session refresh

## Verify before finishing
- `npm run build` passes
- `supabase/migrations/001_initial_schema.sql` exists and is complete
- All 4 `lib/supabase/*.ts` files exist
- All 4 `lib/db/*.ts` files exist with typed return values
- `middleware.ts` exists at project root
- No Supabase client created with service role key anywhere in `app/` or `components/`
```

---

**Done checklist — Phase 2:**
- [ ] Migration file complete and applied in Supabase dashboard
- [ ] `types/supabase.ts` generated
- [ ] `lib/supabase/client.ts`, `server.ts`, `service.ts` exist
- [ ] `lib/db/articles.ts`, `zones.ts`, `saves.ts`, `tracks.ts` exist
- [ ] `middleware.ts` exists and protects routes
- [ ] `npm run build` passes

---

## Phase 3 — Content Pipeline

**Goal:** Automated content ingestion running on a schedule via GitHub Actions. Articles appearing in Supabase. Images resolved. Summaries generated by Claude.

**Before you start:**
- Phase 2 complete and deployed
- All API keys in `.env.local` and Vercel environment: `GUARDIAN_API_KEY`, `ALPHA_VANTAGE_KEY`, `ANTHROPIC_API_KEY`, `UNSPLASH_ACCESS_KEY`, `CRON_SECRET`
- `CRON_SECRET` added to GitHub Actions repository secrets (Settings → Secrets → Actions)

---

### PROMPT — Phase 3

```
We're building Distilled, a mobile-first AI-powered news app. Read CLAUDE.md first for full context.

This session is Phase 3: the content pipeline. This is the most complex phase. Read CLAUDE.md carefully — especially the "Content pipeline" and "Cost constraints" sections. Every cost constraint must be enforced in code.

## Install dependencies

```bash
npm install rss-parser cheerio @anthropic-ai/sdk
npm install -D @types/cheerio
```

## Step 1: Shared types

Create `scripts/pipeline/types.ts`:
```typescript
export type ZoneType = 'sports' | 'local' | 'tech' | 'finance' | 'entertainment' | 'work'

export type RawArticle = {
  externalId: string        // sha256 hash of (sourceUrl + headline), truncated to 32 chars
  headline: string
  bodySnippet?: string      // first 500 chars of article body, for Claude context only
  imageUrl?: string
  sourceUrl: string
  sourceName: string
  publishedAt: string
  zoneType: ZoneType
}

export type ProcessedArticle = RawArticle & {
  summary: string
  urgencyScore: number      // 1–5
  tags: string[]
}
```

## Step 2: Source adapters

Create each adapter in `scripts/pipeline/sources/`. Each adapter returns `RawArticle[]`. Cap at 15 articles per call — enforced in each adapter.

**`sources/guardian.ts`** — Guardian API
- Endpoint: `https://content.guardianapis.com/search`
- Include fields: `headline,bodyText,thumbnail`
- Map `thumbnail` to `imageUrl`
- Use `bodyText` first 500 chars as `bodySnippet`
- Accept a `section` param to target zones (e.g., `sport`, `technology`, `business`)
- API key from `process.env.GUARDIAN_API_KEY`

**`sources/rss.ts`** — Generic RSS adapter
- Accept a `feedUrl` and `zoneType` param
- Use `rss-parser` npm package
- Map `enclosure?.url` or `content` OG image (extract with simple regex) to `imageUrl`
- Return max 15 most recent items

**`sources/weather.ts`** — NWS weather for Local zone
- Step 1: Convert zip to lat/lng using Census geocoding: `https://geocoding.geo.census.gov/geocoder/locations/address?benchmark=2020&format=json&zip={ZIP}`
- Step 2: Get NWS grid point: `https://api.weather.gov/points/{lat},{lng}`
- Step 3: Get hourly forecast from the `forecastHourly` URL in the response
- Return a RawArticle with a weather summary headline and formatted summary
- Store current temp, conditions, wind in `bodySnippet` for quicklook parsing
- No image needed for weather

**`sources/sports.ts`** — ESPN RSS + team feeds
- Feed URLs to try: ESPN Top Headlines RSS, and team-specific feeds (Patriots, Celtics, Red Sox, Bruins)
- ESPN RSS: `https://www.espn.com/espn/rss/nfl/news`
- Reuse the generic rss.ts adapter with these URLs
- Zone type: 'sports'

**`sources/finance.ts`** — Alpha Vantage market data
- Fetch: `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=SPY&apikey={KEY}`
- Also fetch DOW (DIA) and NASDAQ (QQQ)
- Construct a RawArticle with headline like "S&P 500 at 7,473 — markets open/closed"
- Store index values in bodySnippet for quicklook parsing
- API key from `process.env.ALPHA_VANTAGE_KEY`

## Step 3: Image enrichment

Create `scripts/pipeline/enrich/images.ts`:
- Accept a `RawArticle[]` where some have no imageUrl
- For each article missing imageUrl: fetch the sourceUrl, use cheerio to parse `og:image` or `twitter:image` meta tag
- Set a 3-second timeout on each fetch — skip if timeout or error
- Return the same array with imageUrl filled in where found
- For articles still missing imageUrl after OG extraction: call Unsplash `/search/photos?query={firstTag}&per_page=1` using `process.env.UNSPLASH_ACCESS_KEY`, use `results[0].urls.small`
- Never block the pipeline on image failures — imageUrl stays undefined if all methods fail

## Step 4: Claude summarization (BATCHED — read cost constraints in CLAUDE.md)

Create `scripts/pipeline/enrich/summarize.ts`:
- Accept a `RawArticle[]` of NEW articles only (already deduplicated)
- NEVER call Claude more than once per pipeline run per zone
- Build a single prompt containing all articles as a numbered list: headline + bodySnippet
- Ask Claude to return a JSON array: `[{id: externalId, summary: string, urgency: 1-5, tags: string[]}]`
- Parse response, merge back into articles
- If batch > 20 articles, split into chunks of 20 and make multiple calls (still far fewer than per-article)
- Model: `claude-haiku-4-5-20251001`
- Temperature: 0

Prompt template for summarize.ts:
```
You are summarizing news articles for a personal news app. For each article below, provide:
- summary: 2-3 sentence plain English summary, no jargon
- urgency: 1-5 (5=breaking/critical, 4=important today, 3=worth knowing, 2=background, 1=when you have time)
- tags: array of 1-3 short topic tags (e.g. "Celtics", "NBA Draft", "Boston")

Return ONLY a JSON array, no other text:
[{"id":"...","summary":"...","urgency":1,"tags":["..."]}]

Articles:
{articles.map((a, i) => `${i+1}. ID:${a.externalId}\nHeadline: ${a.headline}\n${a.bodySnippet ? 'Context: ' + a.bodySnippet : ''}`).join('\n\n')}
```

## Step 5: Deduplication and write

Create `scripts/pipeline/write.ts`:
- Accept `ProcessedArticle[]`
- Query Supabase for existing `external_id` values in this batch: `select external_id from articles where external_id = any($1)`
- Filter out already-known articles
- Upsert remaining articles using service role client (import from `lib/supabase/service.ts`)
- Return count of new articles written
- Also update `zone_quicklook` table: for weather zone, parse the weather bodySnippet into quicklook chips; for finance, parse index values; for sports, parse schedule info

## Step 6: Pipeline orchestrator

Create `scripts/pipeline/index.ts`:
- Export `async function runPipeline(zones?: ZoneType[])` 
- Default: run all zones
- For each zone:
  1. Fetch raw articles from appropriate source adapter(s)
  2. Filter to 15 max
  3. Compute externalIds, check which are new (query Supabase)
  4. If zero new articles, skip enrichment and write for this zone
  5. Extract OG images for new articles without imageUrl
  6. Batch summarize new articles with Claude
  7. Write to Supabase
- Log: zone name, articles fetched, new articles, articles written

## Step 7: API trigger route

Create `app/api/pipeline/trigger/route.ts`:
```typescript
// POST only. Verify CRON_SECRET header before running.
// Call runPipeline() from scripts/pipeline/index.ts
// Return {success: true, results: [...]} or {error: string}
```
Verify with: `if (req.headers.get('x-cron-secret') !== process.env.CRON_SECRET) return 401`

## Step 8: GitHub Actions workflow

Create `.github/workflows/pipeline.yml`:
```yaml
name: Content Pipeline
on:
  schedule:
    - cron: '0 * * * *'    # every hour
    - cron: '*/15 6-22 * * *'  # every 15 min during waking hours (6am-10pm)
  workflow_dispatch:        # allow manual trigger from GitHub UI
jobs:
  run-pipeline:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger pipeline
        run: |
          curl -X POST \
            -H "x-cron-secret: ${{ secrets.CRON_SECRET }}" \
            -H "Content-Type: application/json" \
            https://distilled-news.vercel.app/api/pipeline/trigger
```

## Step 9: npm script for local testing

Add to `package.json`:
```json
"pipeline": "npx tsx scripts/pipeline/index.ts"
```

## Verify before finishing
- `npm run pipeline` runs without errors (will need valid API keys in .env.local)
- At least one article appears in Supabase after a run
- No per-article Claude API calls — check that summarize.ts only calls Claude once per zone per run
- `npm run build` passes (pipeline scripts don't need to be importable by Next.js, but ensure no type errors)
- `.github/workflows/pipeline.yml` exists
```

---

**Done checklist — Phase 3:**
- [ ] All 5 source adapters exist and return typed `RawArticle[]`
- [ ] `enrich/images.ts` does OG extraction with cheerio + Unsplash fallback
- [ ] `enrich/summarize.ts` batches Claude calls (max 20 per batch, max 1 batch per zone per run)
- [ ] `write.ts` deduplicates before any enrichment
- [ ] `app/api/pipeline/trigger/route.ts` exists with secret verification
- [ ] `.github/workflows/pipeline.yml` exists
- [ ] `npm run pipeline` successfully writes articles to Supabase
- [ ] `npm run build` passes

---

## Phase 4 — Auth & User Model

**Goal:** Users can sign up and sign in. Zone configs are created for each new user from templates. All user data is tied to their account.

**Before you start:**
- Phases 1–3 complete
- Supabase Auth configured with Google OAuth provider
- Redirect URLs added in Supabase dashboard

---

### PROMPT — Phase 4

```
We're building Distilled, a mobile-first AI-powered news app. Read CLAUDE.md first for full context.

This session is Phase 4: authentication and user model. Users need to sign up, sign in, and get default zones created on first sign-in.

## Step 1: Sign-in page

Create `app/auth/signin/page.tsx`:
- Minimal dark-themed page matching the app design system (use CSS custom properties from styles/tokens.css)
- Email + password sign-in form
- "Continue with Google" button using Supabase OAuth
- Link to sign-up page
- On success: redirect to `/zones`
- Use Supabase browser client from `lib/supabase/client.ts`

Create `app/auth/signup/page.tsx`:
- Same minimal design
- Email, password, confirm password fields
- On success: redirect to `/onboarding` (not `/zones` — new users need onboarding)

Create `app/auth/callback/route.ts`:
- Handle OAuth callback from Google
- Exchange code for session
- Check if user has any zones: if not, redirect to `/onboarding`; if yes, redirect to `/zones`

## Step 2: Zone templates

Create `lib/zone-templates.ts`:
```typescript
import { ZoneType } from '@/types'

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
  headlines: {
    type: 'tech',       // reuses tech zone type for now
    label: 'Headlines Zone',
    position: 2,
    defaultConfig: {},
    sources: ['guardian', 'rss'],
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
```

## Step 3: User initialization

Create `lib/user-init.ts`:
```typescript
// Called after first sign-up to create default zones
export async function initializeNewUser(userId: string, zipCode?: string) {
  // Create the 3 default zones: local (if zip provided), headlines, tech
  // Use service role client (this runs server-side only)
  // Insert into zones table
}

// Called to add a specific zone template to a user
export async function addZoneFromTemplate(
  userId: string, 
  templateKey: string, 
  config?: Record<string, unknown>
) { ... }
```

## Step 4: Update middleware

Update `middleware.ts`:
- Add `/auth/signin`, `/auth/signup`, `/auth/callback` to the public routes list
- Add `/onboarding` to the list of routes that require auth but don't redirect to onboarding
- All other routes: require auth, and if user has no zones, redirect to `/onboarding`

## Step 5: Profile page stub

Create `app/profile/page.tsx` (replace the existing stub):
- Show user email
- Show zip code with edit option
- Show "Manage Zones" link → `/zones` (which has manage zones sheet)
- Sign out button using Supabase `signOut()`
- Use `AppHeader` and `BottomNav` components from Phase 1

## Verify before finishing
- Sign up flow creates a user in Supabase Auth AND in the `users` table
- Signing in with Google works (test this manually)
- New users are redirected to `/onboarding` after signup
- Returning users are redirected to `/zones` after signin
- `npm run build` passes
```

---

**Done checklist — Phase 4:**
- [ ] `app/auth/signin/page.tsx` and `app/auth/signup/page.tsx` exist
- [ ] `app/auth/callback/route.ts` handles OAuth callback
- [ ] `lib/zone-templates.ts` exists with all 7 templates
- [ ] `lib/user-init.ts` exists
- [ ] `middleware.ts` handles auth and onboarding redirect
- [ ] `app/profile/page.tsx` is functional (not a stub)
- [ ] Sign-up → Supabase Auth user created → zones initialized → redirect to onboarding works end-to-end
- [ ] `npm run build` passes

---

## Phase 5 — Pages Wired to Live Data

**Goal:** All six app pages fetching real data from Supabase and using the component library from Phase 1. The old `/v2/` pages are replaced and can be deleted.

**Before you start:**
- Phases 1–4 complete
- Pipeline has run at least once (articles exist in Supabase)
- Signed-in user with zones exists

---

### PROMPT — Phase 5

```
We're building Distilled, a mobile-first AI-powered news app. Read CLAUDE.md first for full context.

This session is Phase 5: connecting all pages to live Supabase data. The component library (Phase 1) and database layer (Phase 2) are complete. Use them — do not rebuild what already exists.

Before writing any page, re-read the corresponding HTML prototype file from prototypes/ to confirm the layout.

Build pages in this order. Each is a Next.js Server Component that fetches data and passes it to a client component for interactivity.

## Page 1: Zone Hub (/zones)

File: `app/zones/page.tsx`

Server component:
- Get current user from Supabase session
- Call `getUserZones(userId)` to get their zones
- For each zone, call `getArticlesByZone(zone.type, 2)` to get 2 preview articles
- Call `getZoneQuicklook(zone.type)` to get quicklook chips
- Pass all data to `ZonesHubClient`

Client component `app/zones/ZonesHubClient.tsx`:
- Render `AppHeader` with title "Zones" and "Manage zones" button
- Render `ZoneSubNav` with activeZone='all'
- Render a `ZoneCard` for each zone with the appropriate heroVariant:
  - sports → 'schedule' (schedule rows from quicklook data)
  - local → 'stat' (weather stat from quicklook)
  - finance → 'stat' (market number from quicklook)
  - tech, entertainment, work, maine → 'headline' (first article headline)
- Render `ManageZonesSheet` (extract from distilled-zones.html modal pattern)
- Render `BottomNav` with activeTab='zones'

## Page 2: Zone Detail (/zones/[zoneId])

File: `app/zones/[zoneId]/page.tsx`

Server component:
- Get zone config for this zoneId
- Fetch articles: `getArticlesByZone(zone.type, 15)`
- Fetch quicklook: `getZoneQuicklook(zone.type)`
- Pass to `ZoneDetailClient`

Client component:
- Render `AppHeader` with back button → /zones and zone pill + count badge
- Render `ZoneSubNav` with active zone
- Render `QuickLookStrip`
- Group articles by urgency_score into sections (5-4: Latest, 3: On Radar, 1-2: On Your Radar)
- Render each article as `StoryItem` with save/track handlers
- Render `TrackModal` and `Toast`
- Render `BottomNav` activeTab='zones'

## Page 3: Today (/)

File: `app/page.tsx` (replace existing)

Server component:
- Fetch `getTopArticles(30)` — highest urgency across all zones
- Group into 4 urgency buckets: Critical (5), Your Day (4), On Your Radar (3), When You Have a Moment (1-2)
- Pass to `TodayClient`

Client component:
- Render `AppHeader` with wordmark "Distilled" and date
- For each non-empty urgency bucket, render a section header and list of `StoryItem` components
- Render `TrackModal`, `Toast`
- Render `BottomNav` activeTab='today'

## Page 4: Story Detail (/zones/[zoneId]/story/[storyId])

File: `app/zones/[zoneId]/story/[storyId]/page.tsx`

Server component:
- Fetch `getArticleById(storyId)`
- Fetch `getArticlesByZone(zone.type, 3)` for related articles (exclude current)
- Pass to `StoryDetailClient`

Client component:
- Reference `prototypes/distilled-story-detail.html` for exact layout
- Hero image (if imageUrl exists), zone pill, headline, summary
- Source links
- Related articles section
- Save and track buttons
- Back button to zone detail

## Page 5: Tracking (/tracking)

File: `app/tracking/page.tsx`

Server component:
- Get userId from session
- Fetch `getTrackedTopics(userId)` 
- For each topic, fetch `searchArticlesByTopic(topic.topic, 5)` for article cards
- Pass to `TrackingClient`

Client component:
- Reference `prototypes/distilled-tracking.html` for exact layout
- `AppHeader` "Tracking" + topic count badge + add button
- Zone filter pills (All, No zone, each zone)
- For each tracked topic: two-line header (zone pill on line 1, #Topic on line 2), horizontal scroll of story cards
- Edit/delete inline controls
- `TrackModal` for adding new topics
- `BottomNav` activeTab='tracking'

## Page 6: Read Later (/saved)

File: `app/saved/page.tsx`

Server component:
- Fetch `getSavedArticles(userId)` — articles joined with user_saves
- Pass to `SavedClient`

Client component:
- Reference `prototypes/distilled-read-later.html` for exact layout
- `AppHeader` "Read Later" + count badge + "Clear all" button
- Zone filter pills
- Each article as a `StoryItem` with bookmark toggle behavior (unsave keeps item visible, dimmed)
- Empty state if nothing saved
- `BottomNav` activeTab='saved'

## Cleanup

Once all 6 pages work:
- Delete `app/v2/` directory entirely
- Delete `app/briefing/` directory (replaced by Today page)
- Delete `app/feeds/` directory
- Update any remaining links that pointed to /v2/

## Verify before finishing
- All 6 pages render without errors when logged in
- Articles appear from Supabase (not static JSON)
- Save/unsave updates Supabase in real time
- Track topic creates a user_tracks row in Supabase
- Zone filter pills correctly filter the displayed content
- Back navigation works between pages
- `npm run build` passes
```

---

**Done checklist — Phase 5:**
- [ ] All 6 pages exist and load real data
- [ ] `app/v2/` deleted
- [ ] `app/briefing/` deleted
- [ ] Save/track interactions write to Supabase
- [ ] Zone filter pills work on Tracking and Read Later pages
- [ ] `npm run build` passes with no type errors

---

## Phase 6 — Onboarding & Zone Setup

**Goal:** A new user can go from sign-up to live content in under 60 seconds, using a template picker that requires minimal input.

**Before you start:**
- Phases 1–5 complete and deployed
- Test with a fresh user account

---

### PROMPT — Phase 6

```
We're building Distilled, a mobile-first AI-powered news app. Read CLAUDE.md first for full context.

This session is Phase 6: the onboarding flow. This is the first thing a new user sees after signing up. The design goal: live content in under 60 seconds, minimal input required, no checkbox lists of topics or sources.

## Onboarding flow (3 steps)

Create `app/onboarding/page.tsx` — a client component with 3-step state:

**Step 1 — Zip code**
- Large input, centered, "What's your zip code?" heading
- Subtext: "We'll use this for local news and weather"
- "Skip" link (small, below input) → goes to step 2 with no zip
- "Continue" button → validates zip format, saves to user record, goes to step 2

**Step 2 — Zone template picker**
- Heading: "Pick what matters to you"
- Subtext: "You can always add or remove zones later"
- 4-6 card options (NOT checkboxes — full tap cards). Each card:
  - Zone color accent on left edge
  - Zone name (large)
  - One-line description of what it covers
  - Tap to toggle selected/unselected (can select multiple)
- Cards to show:
  - **My Local** — "Weather, news, and events near [zip or 'your area']"
  - **Sports** — "Your local teams, scores, and schedules"
  - **Headlines** — "Top national and world news, summarized"
  - **Tech & AI** — "Technology, AI, and the people building it"
  - **Finance** — "Markets, economic news, and your portfolio"
  - **Entertainment** — "Music, movies, TV, and culture"
- Pre-select: My Local + Headlines by default
- "Continue" button (always visible, even if nothing selected)

**Step 3 — One narrowing question (conditional)**
- Only show if user selected a template that needs more info
- Priority: if "Sports" selected → "Which city are your teams in?" (text input, pre-filled from zip if available)
- If "Work" selected → "What industry are you in?" (dropdown: Tech, Finance, Healthcare, Legal, Marketing, Real Estate, Education, Other)
- Skip if no narrowing question needed → go straight to activation

**Activation screen (shown after step 3)**
- Full-screen with zone color gradient background
- "Setting up your Distilled..." heading
- Animated progress indicator
- Calls `addZoneFromTemplate()` for each selected template
- Triggers initial pipeline run for selected zones: `POST /api/pipeline/trigger` with zone list
- After 3–4 seconds (or when pipeline responds): redirect to `/zones`
- If pipeline call fails: still redirect — content will appear within the hour when cron runs

## Design requirements
- All 3 steps use the dark design system (tokens from styles/tokens.css)
- Full-screen mobile layout, centered content, generous padding
- Smooth step transitions (CSS opacity + translate)
- No step indicator dots or "Step 1 of 3" labels — keep it minimal
- "Skip" is always available at every step

## Guard against repeated onboarding
- In `middleware.ts`: if a user navigates to `/onboarding` and already has zones, redirect to `/zones`

## Verify before finishing
- Fresh signup → onboarding → zone hub with live content works end-to-end
- Skipping all steps creates at least one default zone (Headlines) so the app isn't empty
- Selected zones appear in Supabase `zones` table after activation
- User with existing zones who navigates to /onboarding is redirected to /zones
- `npm run build` passes
```

---

**Done checklist — Phase 6:**
- [ ] `/onboarding` has 3-step flow with zone template picker
- [ ] Skipping creates at least one default zone
- [ ] Selected templates create rows in `zones` table
- [ ] Pipeline is triggered for selected zones on activation
- [ ] Middleware prevents re-onboarding for existing users
- [ ] End-to-end test: new user → sign up → onboard → see real articles in zones hub
- [ ] `npm run build` passes

---

## After all phases: PWA setup

Once Phase 6 is complete and the app is stable, add installability:

```
Read public/manifest.json (already exists — update it):
- Set name: "Distilled"
- Set short_name: "Distilled"  
- Set background_color and theme_color to #09090e
- Set display: "standalone"
- Verify icons at public/icons/ (192px and 512px already exist)

Add to app/layout.tsx <head>:
- <link rel="manifest" href="/manifest.json">
- <meta name="apple-mobile-web-app-capable" content="yes">
- <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
- <meta name="theme-color" content="#09090e">

Test: open in Safari on iPhone, "Add to Home Screen" should work.
```

---

## Quick reference: environment variables

| Variable | Used in | Where to get it |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Client + Server | Supabase dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + Server | Supabase dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Pipeline only | Supabase dashboard → Settings → API |
| `GUARDIAN_API_KEY` | Pipeline | open-platform.theguardian.com |
| `ALPHA_VANTAGE_KEY` | Pipeline | alphavantage.co (free registration) |
| `ANTHROPIC_API_KEY` | Pipeline | console.anthropic.com |
| `UNSPLASH_ACCESS_KEY` | Pipeline | unsplash.com/developers |
| `CRON_SECRET` | Pipeline trigger | Generate: `openssl rand -hex 16` |
