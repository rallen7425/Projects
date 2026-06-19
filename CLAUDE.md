# Distilled — CLAUDE.md

**App names:** "Distilled" (official) · "Distilled News App" (full) · "My News App" (informal)
**Live site:** https://distilled-news.vercel.app
**GitHub remote:** git@github.com:rallen7425/Projects.git (branch: main)
**Local dev:** `npm run dev` → http://localhost:3000
**Deploy:** `npx vercel --prod` from this directory (`.vercel` folder is present and linked)

---

## What this app is

Distilled is a mobile-first, AI-powered personal news briefing app. The core experience is the **daily briefing** — a pre-generated, personalized news digest organized into four urgency sections (Critical, Your Day, On Your Radar, When You Have a Moment). The home screen is a **Zones** view grouping news by topic area: Sports, Local, Maine House, Tech & AI, Finance.

This is a prototype / proof-of-concept at this stage. Content is manually updated, not pulled live from RSS or an API.

---

## Current status (as of June 19, 2026)

The app is deployed and working on mobile. Both the Briefing page and the Home/Zones pages were updated today with June 19, 2026 content and are live.

---

## What was completed this session

- Updated `content/briefing.md` with a fresh June 19 morning briefing (Celtics draft, Sox, World Cup at Gillette today, Juneteenth, AI news)
- Updated `app/v2/page.tsx` — home page date bar, Breaking banner, Your Zones cards, and Trending list
- Updated `lib/v2/zoneData.ts` — all five zones (Sports, Local, Maine, Tech & AI, Finance) with current stories, quickLook stats, and source links
- Re-established Vercel connection (`.vercel` folder was missing; re-linked via `npx vercel link` and deployed with `npx vercel --prod`)
- Both commits pushed to GitHub (`b34e0db`, `3ed0495`)

---

## What's broken / known issues

- **Content is hardcoded.** The Briefing page reads from `content/briefing.md` (easy to update). But the Home page (`app/v2/page.tsx`) and all Zone stories (`lib/v2/zoneData.ts`) are hardcoded TypeScript constants — they must be manually edited and redeployed every session. There is no CMS, no RSS ingestion, and no live data pipeline hooked up yet.
- **Vercel GitHub auto-deploy is not reliable.** The `.vercel` link was lost at some point. Manual deploys via `npx vercel --prod` work fine. If the site doesn't update after a `git push`, run the manual deploy command.
- **Git committer identity shows a warning** — `git config --global --edit` to set name/email and clean this up.
- **`/tracking` page** — Tracking input works but topic feeds are not real; tapping a tracked topic shows placeholder/mock article carousels, not live content.
- **`/feeds` page** — RSS feed fetching is wired up via `/api/rss` but reliability depends on third-party RSS sources. No caching layer.
- **`/saved` page** — Save functionality works (localStorage-based via `SavedStoriesProvider`), but saved items don't persist across devices or browsers.
- **`/profile` and `/` (root)** — Both redirect/stub pages; no real functionality yet.

---

## Next session should pick up from

1. **Decide on a content update workflow.** The manual edit-and-deploy cycle works but doesn't scale. Options: (a) move briefing content to a simple JSON file both the Briefing and Zones pages read from, (b) wire up the pre-MVP Node.js pipeline (`scripts/`) to generate content automatically, (c) integrate a headless CMS. This is the most important structural decision before continuing content work.

2. **Content pipeline in `scripts/`** — There is an `enrich-briefing.mjs` script (`npm run enrich`). Understand what it does and whether it can be extended to also generate zone content, not just the briefing markdown.

3. **Live data for Zones** — Zone stories are currently all static. The logical next step is connecting the Sports, Tech, and Finance zones to real RSS feeds or NewsAPI so they update automatically.

4. **Tracking page** — The UI is built; the missing piece is real article results when a user taps a tracked topic. This likely means wiring `/api/rss` into the `/v2/tag/[tag]` page.

---

## Key files

| File | Purpose |
|---|---|
| `content/briefing.md` | Live briefing content — edit this to update the Briefing page |
| `app/v2/page.tsx` | Home page — hardcoded BREAKING, ZONES, TRENDING arrays |
| `lib/v2/zoneData.ts` | All zone stories and quickLook stats — hardcoded |
| `app/briefing/page.tsx` | Briefing page — reads and parses `content/briefing.md` |
| `lib/parseBriefing.ts` | Markdown parser for briefing sections |
| `app/v2/zones/[zoneId]/page.tsx` | Zone detail page |
| `app/v2/zones/[zoneId]/story/[storyId]/page.tsx` | Individual story page |
| `app/api/rss/route.ts` | RSS fetch proxy |
| `app/api/article/route.ts` | Article reader (uses Mozilla Readability) |
| `scripts/enrich-briefing.mjs` | Briefing enrichment script (`npm run enrich`) |
| `components/v2/ZoneSubNav.tsx` | Scrollable zone pill nav |
| `components/SavedStoriesProvider.tsx` | Save state (localStorage) |
| `components/TrackedTopicsProvider.tsx` | Tracking state (localStorage + server) |
