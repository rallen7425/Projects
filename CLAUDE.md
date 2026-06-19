# Distilled — CLAUDE.md

**App names:** "Distilled" (official) · "Distilled News App" (full) · "My News App" (informal)

---

## Deployment & access

| | |
|---|---|
| **Live site** | https://distilled-news.vercel.app |
| **GitHub repo** | git@github.com:rallen7425/Projects.git |
| **Branch** | main |
| **Vercel project** | rick-allen-s-projects/projects-yg1p |
| **Local dev** | `npm run dev` → http://localhost:3000 |

### To deploy after a content update
```bash
git add .
git commit -m "Update content for [date]"
git push origin main
npx vercel --prod
```

> **Note:** GitHub auto-deploy via Vercel is unreliable — always run `npx vercel --prod` manually after pushing. The `.vercel` folder is present and linked; no re-linking needed unless it goes missing (re-link with `npx vercel link`).

---

## What this app is

Distilled is a mobile-first, AI-powered personal news briefing app. It has two primary screens:

- **Briefing** (`/briefing`) — daily digest with four urgency sections: Critical, Your Day, On Your Radar, When You Have a Moment
- **Home / Zones** (`/v2`) — news grouped by topic area: Sports, Local, Maine House, Tech & AI, Finance

This is a working prototype. Content is manually refreshed each session — there is no live RSS pipeline yet.

---

## How to update content (the full workflow)

All content lives in three files under `content/`. Edit these files, then commit and deploy. No TypeScript editing required.

### 1. Briefing page → `content/briefing.md`

Plain markdown. Edit the date, weather line, item counts summary, and each story section. Structure must be preserved exactly:

```
# Distilled — morning briefing
**[Day], [Month] [Date], [Year] · North Andover, MA**
[weather line]
*[N] critical · [N] today · [N] on your radar · [N] when you have a moment*
---
## 🔴 Critical — act or be aware now
### [Headline]
`TAG · TAG`
[2–3 sentence summary]
→ [Link text](url) · → [Link text](url)
---
## 📅 Your day — what's ahead
...
## 👀 On your radar — worth knowing
...
## ☕ When you have a moment — [N] reads
**1. [Title]**
`TAG · N min read`
[Description]
→ [Read on Source](url)
---
*You're up to speed.*
*Next briefing today at 12:00 PM — midday edition*
```

### 2. Home page → `content/home.json`

Controls the date bar, Breaking banner, Your Zones cards (featured headline + secondary bullets), and Trending list.

Key fields to update each session:
- `dateBar` — e.g. `"Fri, June 19 · Juneteenth · North Andover, MA"`
- `breaking[0].headline` and `breaking[0].href`
- Each zone's `featured`, `featuredHref`, and `stories` array
- `trending` array (topic, sub, href, pillLabel)

Zone `bg`, `nameColor`, `bodyBg`, and `id` are design constants — leave them unchanged.

### 3. Zone story detail pages → `content/zones.json`

Controls everything inside each zone: the quickLook stats bar, and all story groups with full headlines, summaries, and source links.

Structure per zone:
```json
"sports": {
  "storyCount": "3 stories today",
  "quickLook": [ { "label": "...", "value": "...", "sub": "..." } ],
  "groups": [
    {
      "label": "LATEST",
      "stories": [
        {
          "id": "unique-story-id",
          "tag": "Celtics",
          "urgent": true,
          "isNew": true,
          "time": "Now",
          "headline": "...",
          "summary": "2–4 sentence summary...",
          "imageUrl": "https://...",
          "sources": [ { "label": "ESPN", "title": "...", "url": "https://..." } ]
        }
      ]
    }
  ]
}
```

> **Important:** Story `id` values in `zones.json` must match the `href` slugs used in `home.json`. For example, `"id": "celtics-draft"` in zones.json corresponds to `"href": "/v2/zones/sports/story/celtics-draft"` in home.json.

---

## Current status (as of June 19, 2026)

- All content updated to June 19, 2026 (Juneteenth, Celtics draft, Sox, World Cup at Gillette, AI news)
- Content refactored out of TypeScript into JSON files — future updates touch only `content/` files
- Live and deployed at https://distilled-news.vercel.app

---

## What's broken / known issues

- **`/tracking` page** — UI works, but tapping a tracked topic shows placeholder article carousels, not live content. Needs `/api/rss` wired into `/v2/tag/[tag]`.
- **`/feeds` page** — RSS fetch proxy works but no caching; reliability depends on third-party sources.
- **`/saved` page** — Save works via localStorage; does not persist across devices or browsers.
- **`/profile` and `/` (root)** — Stub/redirect pages, no real functionality.
- **Vercel GitHub auto-deploy** — Not reliable; always deploy manually with `npx vercel --prod`.
- **Git committer identity warning** — Run `git config --global --edit` to set name/email.

---

## Next session priorities

1. **Wire live data into the Tracking page** — `/v2/tag/[tag]/page.tsx` currently shows placeholder carousels. Connect it to `/api/rss` so tracked topics show real articles.
2. **Consider automating content updates** — `scripts/enrich-briefing.mjs` (`npm run enrich`) exists. Understand what it does and whether it can generate `home.json` and `zones.json` content automatically from live news sources.
3. **Add RSS/NewsAPI to Zones** — Sports, Tech, and Finance zones are the best candidates for live data first.

---

## Key files reference

| File | What to edit | When |
|---|---|---|
| `content/briefing.md` | Briefing page content | Every content refresh |
| `content/home.json` | Home page — date, breaking, zones cards, trending | Every content refresh |
| `content/zones.json` | Zone story detail pages — all stories, quickLook, sources | Every content refresh |
| `lib/v2/zoneData.ts` | TypeScript types + utility functions only — imports from zones.json | Only if adding new zones or changing data structure |
| `app/v2/page.tsx` | Home page component — imports from home.json | Only for layout/UI changes |
| `app/briefing/page.tsx` | Briefing page component | Only for layout/UI changes |
| `lib/parseBriefing.ts` | Markdown → briefing section parser | Only if briefing format changes |
| `app/v2/zones/[zoneId]/page.tsx` | Zone detail page layout | Only for UI changes |
| `app/v2/zones/[zoneId]/story/[storyId]/page.tsx` | Story detail page | Only for UI changes |
| `app/api/rss/route.ts` | RSS fetch proxy | Only for feed changes |
| `scripts/enrich-briefing.mjs` | Briefing enrichment script (`npm run enrich`) | Pipeline work |
