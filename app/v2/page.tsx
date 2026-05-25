"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSavedStories } from "@/components/SavedStoriesProvider";
import TrackModal, { type TrackModalState } from "@/components/v2/TrackModal";

// ── Design tokens ──────────────────────────────────────────────
const BG       = "#0f0f11";
const SURFACE  = "#18181c";
const BORDER   = "rgba(255,255,255,0.07)";
const BORDER_M = "rgba(255,255,255,0.13)";
const TEXT     = "#f0f0f2";
const DIM      = "rgba(240,240,242,0.55)";
const MUTED    = "rgba(240,240,242,0.35)";
const BLUE     = "#5B9CF6";
const AMBER    = "#EF9F27";
const GREEN    = "#52C97A";

// ── Data ───────────────────────────────────────────────────────

const ALERTS = [
  {
    level: "Watch", color: AMBER,
    pill: "Sports", pillBg: "#1b4332", pillColor: "#9FE1CB",
    headline: "AJ Brown deal: agreement in principle, official after June 1 post-designation",
    time: "2h ago", href: "/v2/zones/sports/story/patriots-aj-brown",
  },
  {
    level: "Watch", color: AMBER,
    pill: "Tech & AI", pillBg: "#2a1d6e", pillColor: "#AFA9EC",
    headline: "Google I/O: Gemini 2.5 Pro officially GA, Flash pricing drops 50%",
    time: "5h ago", href: "/v2/zones/tech/story/google-io-gemini",
  },
];

const INTELLIGENCE = [
  {
    name: "AJ Brown Trade",
    update: "Agreement in principle. Official after June 1. Eagles land 2026 first-round pick.",
    badge: "New", badgeBg: "rgba(82,201,122,0.15)", badgeColor: GREEN,
    iconBg: "rgba(82,201,122,0.12)", href: "/v2/zones/sports/story/patriots-aj-brown",
  },
  {
    name: "Gemini / Google AI",
    update: "2.5 Pro GA confirmed at I/O. Flash down 50%. NotebookLM now with audio.",
    badge: "Updated", badgeBg: "rgba(239,159,39,0.12)", badgeColor: AMBER,
    iconBg: "rgba(239,159,39,0.10)", href: "/v2/zones/tech/story/google-io-gemini",
  },
  {
    name: "Maine Weather",
    update: "Holiday weekend clear. Highs near 74°F Sat–Sun. Showers possible Monday PM.",
    badge: null, badgeBg: "", badgeColor: "",
    iconBg: "rgba(91,156,246,0.10)", href: "/v2/zones/maine/story/maine-memorial-day",
  },
];

const ZONES = [
  {
    id: "sports",  label: "Sports",
    headerBg: "#1b4332", headerColor: "#9FE1CB", bodyBg: "rgba(27,67,50,0.35)",
    count: 4,
    stories: [
      { text: "AJ Brown trade details — cap implications detailed",       href: "/v2/zones/sports/story/patriots-aj-brown" },
      { text: "Stevens: two rim targets in trade talks",                   href: "/v2/zones/sports/story/celtics-stevens-brown" },
      { text: "Giannis market: Celtics, Warriors leading",                 href: "/v2/zones/sports/story/celtics-giannis" },
      { text: "Sox beat A's 6–2, Crawford HR",                            href: "/v2/zones/sports/story/sox-royals-recap" },
    ],
  },
  {
    id: "tech",    label: "Tech & AI",
    headerBg: "#2a1d6e", headerColor: "#AFA9EC", bodyBg: "rgba(42,29,110,0.35)",
    count: 3,
    stories: [
      { text: "Google I/O: Gemini 2.5 Pro GA, pricing drops across fleet", href: "/v2/zones/tech/story/google-io-gemini" },
      { text: "OpenAI Ads Manager open — first brand results in",           href: "/v2/zones/tech/story/openai-ads-manager" },
      { text: "WWDC June 2 — Apple AI expected front and center",           href: "/v2/zones/tech/story/exa-labs-funding" },
    ],
  },
  {
    id: "local",   label: "Local",
    headerBg: "#0c2d5e", headerColor: "#85B7EB", bodyBg: "rgba(12,45,94,0.35)",
    count: 2,
    stories: [
      { text: "Memorial Day weekend: I-93 expects heaviest travel Sat morning",  href: "/v2/zones/local/story/heat-spike-storms" },
      { text: "Memorial Day parade: Main St closed 9:30am–noon",                 href: "/v2/zones/local/story/town-meeting-budget" },
    ],
  },
  {
    id: "maine",   label: "Maine",
    headerBg: "#5c3208", headerColor: "#FAC775", bodyBg: "rgba(92,50,8,0.35)",
    count: 3,
    stories: [
      { text: "Coastal weekend forecast: sun through Sunday, watch Monday PM",    href: "/v2/zones/maine/story/maine-memorial-day" },
      { text: "Memorial Day weekend: ferry reservations, bridge traffic notes",   href: "/v2/zones/maine/story/maine-turnpike-traffic" },
      { text: "What's open in coastal Maine this weekend",                        href: "/v2/zones/maine/story/maine-things-to-do" },
    ],
  },
  {
    id: "finance", label: "Finance",
    headerBg: "#1a2e1a", headerColor: "#8FD4A0", bodyBg: "rgba(26,46,26,0.35)",
    count: 2,
    stories: [
      { text: "S&P closes at 5,304 Friday — 8th straight winning week",          href: "/v2/zones/finance/story/fed-rate-hold" },
      { text: "Markets closed Mon — PCE and Fed speakers next week",              href: "/v2/zones/finance/story/markets-steady" },
    ],
  },
];

const RISING = [
  { rank: 1, topic: "AJ Brown Trade",          pill: "Sports",  pillBg: "#1b4332", pillColor: "#9FE1CB", trend: "↑ Hot",    trendColor: GREEN,  href: "/v2/zones/sports/story/patriots-aj-brown" },
  { rank: 2, topic: "Google I/O Recap",        pill: "Tech",    pillBg: "#2a1d6e", pillColor: "#AFA9EC", trend: "↑ Rising", trendColor: GREEN,  href: "/v2/zones/tech/story/google-io-gemini" },
  { rank: 3, topic: "Memorial Day Travel",     pill: "Local",   pillBg: "#0c2d5e", pillColor: "#85B7EB", trend: "→ Steady", trendColor: AMBER,  href: "/v2/zones/local/story/heat-spike-storms" },
  { rank: 4, topic: "Maine Summer Rentals",    pill: "Maine",   pillBg: "#5c3208", pillColor: "#FAC775", trend: null,       trendColor: "",     href: "/v2/zones/maine/story/maine-things-to-do" },
  { rank: 5, topic: "OpenAI $40B Funding",     pill: "Finance", pillBg: "#1a2e1a", pillColor: "#8FD4A0", trend: "↑ New",    trendColor: GREEN,  href: "/v2/zones/finance/story/fed-rate-hold" },
];

// ── Sub-components ─────────────────────────────────────────────

function SecHeader({ label, count }: { label: string; count?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "18px 16px 8px" }}>
      <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: MUTED, whiteSpace: "nowrap" }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: BORDER }} />
      {count && <span style={{ fontSize: 9, color: MUTED, whiteSpace: "nowrap" }}>{count}</span>}
    </div>
  );
}

function Pill({ label, bg, color }: { label: string; bg: string; color: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", fontSize: 9, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", padding: "2px 6px", borderRadius: 4, background: bg, color }}>
      {label}
    </span>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h >= 4 && h < 12) return "Good morning";
  if (h >= 12 && h < 17) return "Good afternoon";
  if (h >= 17 && h < 21) return "Good evening";
  return "Good night";
}

// ── Page ───────────────────────────────────────────────────────

export default function V2Page() {
  const router = useRouter();
  const { isSaved, toggle } = useSavedStories();
  const [trackModal, setTrackModal] = useState<TrackModalState>(null);

  return (
    <div style={{ background: BG, minHeight: "100%" }}>

      {/* ── Greeting ── */}
      <div style={{ padding: "22px 16px 14px" }}>
        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".09em", textTransform: "uppercase", color: MUTED, marginBottom: 5 }}>
          Saturday, May 24 · Memorial Day Weekend · North Andover, MA
        </div>
        <div style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.2, color: TEXT, letterSpacing: "-.01em" }}>
          {getGreeting()},<br />
          <span style={{ color: BLUE }}>Rick.</span>
        </div>
      </div>

      {/* ── Situation Summary ── */}
      <div style={{ margin: "0 16px 18px", background: SURFACE, border: `1px solid ${BORDER_M}`, borderRadius: 10, padding: 14, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${BLUE},transparent)` }} />
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: BLUE, marginBottom: 8 }}>
          Situation Summary
        </div>
        <p style={{ fontSize: 13, lineHeight: 1.6, color: DIM, margin: 0 }}>
          It&apos;s a <strong style={{ color: TEXT, fontWeight: 500 }}>holiday weekend</strong> with low breaking-news pressure.
          The <strong style={{ color: TEXT, fontWeight: 500 }}>AJ Brown trade</strong> is the big developing story — official after June 1.
          In Tech, <strong style={{ color: TEXT, fontWeight: 500 }}>Google I/O</strong> wrapped with key Gemini announcements.
          Your <strong style={{ color: TEXT, fontWeight: 500 }}>Maine weekend</strong> looks clear through Sunday.
        </p>
      </div>

      {/* ── Alerts ── */}
      <SecHeader label="Alerts" count={String(ALERTS.length)} />
      <div style={{ padding: "0 16px 4px", display: "flex", flexDirection: "column", gap: 7 }}>
        {ALERTS.map((a, i) => (
          <Link key={i} href={a.href} style={{ display: "flex", gap: 10, background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 9, padding: 11, alignItems: "flex-start", textDecoration: "none" }}>
            <div style={{ width: 3, borderRadius: 2, background: a.color, alignSelf: "stretch", flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: a.color }}>{a.level}</span>
                <Pill label={a.pill} bg={a.pillBg} color={a.pillColor} />
                <span style={{ fontSize: 10, color: MUTED, marginLeft: "auto" }}>{a.time}</span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.4, color: TEXT }}>{a.headline}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Your Intelligence ── */}
      <SecHeader label="Your Intelligence" count={`${INTELLIGENCE.length} tracked`} />
      <div style={{ padding: "0 16px 4px" }}>
        {INTELLIGENCE.map((item, i) => (
          <Link
            key={i}
            href={item.href}
            style={{ borderBottom: i < INTELLIGENCE.length - 1 ? `1px solid ${BORDER}` : "none", padding: "11px 0", display: "flex", gap: 10, alignItems: "flex-start", textDecoration: "none" }}
          >
            <div style={{ width: 30, height: 30, borderRadius: 8, background: item.iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={item.badgeColor || BLUE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: TEXT, marginBottom: 2, display: "flex", alignItems: "center", gap: 6 }}>
                {item.name}
                {item.badge && (
                  <span style={{ background: item.badgeBg, color: item.badgeColor, fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 3, marginLeft: "auto" }}>
                    {item.badge}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 12, lineHeight: 1.5, color: DIM }}>{item.update}</div>
            </div>
          </Link>
        ))}
        <div style={{ paddingTop: 10, textAlign: "right" }}>
          <Link href="/v2/tracking" style={{ fontSize: 11, color: MUTED, textDecoration: "none" }}>
            View all tracking →
          </Link>
        </div>
      </div>

      {/* ── Zone Briefings ── */}
      <SecHeader label="Zone Briefings" />
      <div style={{ padding: "0 16px 4px", display: "flex", flexDirection: "column", gap: 8 }}>
        {ZONES.map((z) => (
          <div key={z.id} style={{ borderRadius: 9, overflow: "hidden", border: `1px solid ${BORDER}` }}>
            {/* Zone header — tappable to open zone */}
            <button
              onClick={() => router.push(`/v2/zones/${z.id}`)}
              style={{ width: "100%", background: z.headerBg, padding: "9px 12px", display: "flex", alignItems: "center", gap: 8, border: "none", cursor: "pointer" }}
            >
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", color: z.headerColor }}>
                {z.label}
              </span>
              <span style={{ fontSize: 10, color: `${z.headerColor}80`, marginLeft: "auto" }}>{z.count} stories</span>
              <span style={{ fontSize: 11, color: `${z.headerColor}66` }}>→</span>
            </button>
            {/* Story bullets */}
            <div style={{ background: z.bodyBg }}>
              {z.stories.map((s, si) => (
                <Link
                  key={si}
                  href={s.href}
                  style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "8px 12px", borderBottom: si < z.stories.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", textDecoration: "none" }}
                >
                  <div style={{ width: 4, height: 4, borderRadius: "50%", background: "rgba(255,255,255,0.2)", flexShrink: 0, marginTop: 6 }} />
                  <div style={{ fontSize: 12, lineHeight: 1.4, color: DIM }}>{s.text}</div>
                </Link>
              ))}
            </div>
          </div>
        ))}
        <Link
          href="/v2/zones"
          style={{ display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, border: `1px dashed rgba(255,255,255,0.15)`, padding: "10px 12px", fontSize: 12, color: MUTED, textDecoration: "none" }}
        >
          + Add Zone
        </Link>
      </div>

      {/* ── What's Rising ── */}
      <SecHeader label="What's Rising" count="ranked for you" />
      <div style={{ padding: "0 16px 28px", display: "flex", flexDirection: "column", gap: 6 }}>
        {RISING.map((item, i) => (
          <Link
            key={i}
            href={item.href}
            style={{ display: "flex", alignItems: "center", gap: 8, background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 7, padding: "9px 11px", textDecoration: "none" }}
          >
            <span style={{ fontSize: 12, fontWeight: 800, color: MUTED, width: 16, flexShrink: 0 }}>{item.rank}</span>
            <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: TEXT }}>{item.topic}</span>
            <Pill label={item.pill} bg={item.pillBg} color={item.pillColor} />
            {item.trend && (
              <span style={{ fontSize: 10, fontWeight: 600, color: item.trendColor, whiteSpace: "nowrap", marginLeft: 4 }}>{item.trend}</span>
            )}
            <button
              onClick={(e) => { e.preventDefault(); toggle({ id: `rising-${i}`, title: item.topic, source: item.pill, snippet: "" }); }}
              style={{ background: "none", border: "none", padding: 0, cursor: "pointer", marginLeft: 4, flexShrink: 0 }}
              aria-label={isSaved(`rising-${i}`) ? "Remove from saved" : "Save"}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill={isSaved(`rising-${i}`) ? BLUE : "none"} stroke={isSaved(`rising-${i}`) ? BLUE : "rgba(255,255,255,0.2)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
              </svg>
            </button>
          </Link>
        ))}
      </div>

      <TrackModal
        modal={trackModal}
        onConfirm={() => setTrackModal((m) => m ? { step: "success", topic: m.topic } : null)}
        onClose={() => setTrackModal(null)}
      />
    </div>
  );
}
