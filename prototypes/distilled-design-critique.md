# Distilled — Design Critique
## Current v3 Prototype vs. Vision

*Honest assessment as of June 2026. Prototype: `distilled-v3-concept.html`*

---

## The Short Version

The v3 prototype is pointing in the right direction aesthetically and structurally, but it's a frame without a soul. The dark palette, floating pill nav, horizontal scroll cards, and "You're caught up" end card are all correct moves. What's missing is the intelligence layer — the prototype looks like Distilled could be an AI-powered news OS, but doesn't yet feel like one. And several core features from the vision have no visual presence at all.

Score against vision: **5 / 10**

---

## What's Working

**The aesthetic is right.** Dark (#09090e), blue-undertoned, clean. Zone colors as thin accents rather than fills. This reads as sophisticated and tech-forward, not legacy. The direction is correct.

**Floating pill nav is a genuine upgrade.** The previous full-width sticky nav felt like a mobile website. The floating pill reads like a native app. The reference (Apple Home) translated well.

**Horizontal scroll pattern is the right call.** Forcing zone cards into a vertical scroll would have made this feel like a content list. The horizontal scroll creates the status-panel feel we want — you're scanning across domains, not reading down a feed.

**Thumbnail-left signal items are readable.** This fixed the "colored dots" confusion from the earlier version. The format — image on the left, zone pill + headline + time on the right — lets the eye orient quickly without forcing a read.

**"You're caught up" end card exists.** This is the most important single design element in the entire app and it's there. The green checkmark, the timestamp, the explicit end state — this is the product promise made visible.

**Track cards are at the top.** Correct placement. The mid-afternoon use case depends entirely on tracked stories surfacing at the top of the experience, before Today's feed.

---

## What's Falling Short

### 1. Tracking Has No Visual Urgency
The track cards look like slightly wider zone cards. But tracked stories and zone cards represent completely different things — a zone is an always-on domain, a track is a specific story you're watching right now, often with a countdown. There's nothing in the current design that communicates:
- Why this story is being tracked
- Whether anything has changed since you last looked
- Whether it's time-sensitive (e.g., "Trade deadline closes in 4h")

**Gap against vision:** The mid-afternoon use case — "a coworker mentioned a big trade" — requires the tracked story to surface with enough visual weight that the user sees it the moment they open the app. Currently, it would get lost in the horizontal scroll.

### 2. Zone Cards Are Status Panels in Theory, Preview Tiles in Practice
Each zone card has a header image, zone name, and one or two bullet headlines. This communicates "here's some sports news" but not "here's the state of your Sports zone today." The user can't tell at a glance whether Sports is quiet, buzzing, or has something breaking. There's no urgency signal, no story count, no indication of what's new vs. stale.

**Gap against vision:** Zones should feel like dashboards you're scanning, not cards you're being invited to open. The current design is one step up from a menu item.

### 3. AI Synthesis Is Invisible
Every item in the Today feed could be a manually curated headline or an RSS title — there's no indication that intelligence is involved. The signal items have a headline and a source pill, but no AI-written synthesis prose. The vision requires the synthesis to be palpable. Right now it isn't.

This is partially a content problem (the prototype uses placeholder-style content) but it's also a design problem — there's no UI element that communicates "Distilled synthesized 23 articles about this story and this is what actually matters."

**Gap against vision:** The entire value proposition of AI curation is visually absent. A user looking at the prototype can't tell why this is different from Apple News.

### 4. Read Later Has No Presence
There is no bookmark icon, no "save for later" affordance, and no indication that Read Later exists as a feature. None of the signal items or zone cards have a tap target for flagging. The nav has no Read Later icon.

This is a missing feature, not just a missing polish detail — users can't build the habit of flagging articles if the affordance isn't there.

**Gap against vision:** Complete absence. The feature needs: (a) a bookmark/flag icon on each signal item and story card, (b) a Read Later destination in the nav.

### 5. Time-Bounded Tracking Has No Design Language
The vision for Tracking includes time-sensitive deadlines — "Patriots trade closes Tuesday 4pm," "OpenAI announcement in 2h." Nothing in the current track card design can express this. There's no countdown, no deadline badge, no visual difference between a track that expires Tuesday vs. one that's evergreen.

**Gap against vision:** The time-bounded tracking use case is the strongest differentiator (especially for the mid-afternoon alert mode) and it has no design representation at all.

### 6. Tracking vs. Zones Distinction Isn't Visual
Tracks and zones currently feel like the same component at different widths. A new user would not understand from the design alone that these represent fundamentally different things — one is a broad domain set at onboarding, the other is a specific story you personally decided to watch. The visual language should communicate this difference immediately.

**Gap against vision:** Users shouldn't need to read documentation to understand the distinction between the two primary organizational structures of the app.

### 7. The Story Detail Experience Doesn't Exist Yet
The most important reading experience in Distilled — tap a story, get an AI synthesis + multi-source links — has no representation in the prototype at all. The home screen prototype is the only screen that exists. There's no story detail view, no AI snapshot panel, no source link layout.

This matters because the AI synthesis is the core differentiator. A user looking at the home screen prototype sees a well-curated list of headlines. They have no way of knowing that tapping one would give them a synthesized brief + three source links instead of bouncing them to a single article. Without the story detail screen, the central product promise ("AI reads everything, you read one thing") is completely invisible.

The V2 app already has the data model for this — `zones.json` has `summary` text and a `sources` array per story. The design of the story detail experience needs to be the next design priority after the home screen is complete.

**Gap against vision:** The feature that makes Distilled worth using over Apple News or Twitter is not visible anywhere in the prototype.

### 8. "Worth Your Time" Section Feels Disconnected
The long-read cards at the bottom are visually nice but contextually floating — there's no zone attribution, no indication of why Distilled surfaced them for you specifically. They feel like a "top stories from the internet" module rather than something curated to your zones and interests.

**Gap against vision:** Worth Your Time should feel like it belongs to your Distilled, not a generic editorial list.

### 8. The App Has No Voice
The greeting ("Good morning, Rick") is functional but the AI synthesis prose that should be the personality of the app — the reason this feels different from any other aggregator — doesn't exist anywhere on screen. The vision describes AI prose, not bullets. Right now there is no prose.

**Gap against vision:** This is the biggest single gap. Distilled's personality is the intelligence of how it writes about news. That voice isn't present in the prototype.

---

## What to Fix First

Ranked by impact on the core vision:

1. **Design the story detail / AI snapshot screen.** This is the core product experience and it doesn't exist yet. The screen needs: AI synthesis prose at the top, source links below (labeled by publication), and a clean reading layout. Without this, the central value proposition of Distilled is invisible to anyone using the app.

2. **Add AI synthesis prose to signal items on the home screen.** Even one sentence of AI-written context below the headline on each feed item signals that intelligence is involved. This is a content + design fix.

3. **Add Read Later affordance.** Bookmark icon on signal items and story cards. Read Later tab in nav. Without this, a core feature simply doesn't exist in the UI.

4. **Differentiate track cards from zone cards visually.** Tracks need: urgency state (something happened / watching / deadline soon), optional countdown/deadline badge, and a "why I'm tracking this" micro-label. The distinction between a tracked story and a zone should be immediately obvious.

5. **Give zone cards a status signal.** A simple count ("3 new"), a recency indicator, or a subtle urgency ring on the zone card image would communicate "your Sports zone is active today" vs. "quiet today."

6. **Add time-bounded tracking design language.** Deadline badge, countdown, or expiry indicator on track cards.

---

## The Honest Summary

The prototype proves the aesthetic direction is correct and avoids several earlier mistakes (text-only, legacy-feeling nav, no visuals). But it's a visual shell around an intelligence-driven product concept that the design doesn't yet express. A user picking up this prototype today would see a well-designed dark news app. They wouldn't see a personal AI news operating system. The gap between those two things is the work still ahead.

---

*June 2026*
