"use client";
import { useState } from "react";
import Link from "next/link";

const BREAKING = [
  { color: "#E24B4A", tag: "WEATHER · LOCAL", headline: "Heat risk today — 92°F, severe T-storms expected by 2pm", time: "8 min ago", href: "/v2/zones/local/story/heat-spike-storms" },
  { color: "#EF9F27", tag: "CELTICS",         headline: "Stevens confirms Brown not being traded this offseason",  time: "1 hr ago",  href: "/v2/zones/sports/story/celtics-stevens-brown" },
];

const ZONES = [
  { id: "local",   name: "LOCAL",       snap: "Heat spike, storms this afternoon",   count: 2, bg: "#E6F1FB", nameColor: "#185FA5", snapColor: "#0C447C" },
  { id: "sports",  name: "SPORTS",      snap: "Sox win, Celtics offseason in motion", count: 4, bg: "#EAF3DE", nameColor: "#3B6D11", snapColor: "#27500A" },
  { id: "maine",   name: "MAINE HOUSE", snap: "Fri–Sat clear, rain arrives Sunday",  count: 1, bg: "#FAEEDA", nameColor: "#854F0B", snapColor: "#633806" },
  { id: "tech",    name: "TECH & AI",   snap: "Google I/O, Gemini, Meta layoffs",    count: 3, bg: "#EEEDFE", nameColor: "#534AB7", snapColor: "#3C3489" },
  { id: "finance", name: "FINANCE",     snap: "Fed rate outlook, markets steady",     count: 2, bg: "#E1F5EE", nameColor: "#0F6E56", snapColor: "#085041" },
];

// Maps V2 pill labels to Feeds page category param
const PILL_TO_FEED: Record<string, string> = {
  Sports:  "Sports",
  Tech:    "Tech",
  Finance: "Business",
  Maine:   "Local",
  Local:   "Local",
  News:    "News",
};

const TRENDING = [
  { topic: "Giannis trade market",             sub: "Bucks listening; Celtics among potential fits",       href: "/v2/zones/sports/story/celtics-giannis",        pillLabel: "Sports",  pillBg: "#EAF3DE", pillColor: "#3B6D11" },
  { topic: "OpenAI launches Ads Manager",      sub: "Self-serve ad dashboard inside ChatGPT",              href: "/v2/zones/tech/story/openai-ads-manager",       pillLabel: "Tech",    pillBg: "#EEEDFE", pillColor: "#534AB7" },
  { topic: "Fed rate outlook shifts",           sub: "June cut off the table; September now earliest",      href: "/v2/zones/finance/story/fed-rate-hold",         pillLabel: "Finance", pillBg: "#E1F5EE", pillColor: "#0F6E56" },
  { topic: "Maine Turnpike Memorial Day delay", sub: "Peak northbound traffic 2–7pm Friday",               href: "/v2/zones/maine/story/maine-turnpike-traffic",  pillLabel: "Maine",   pillBg: "#FAEEDA", pillColor: "#854F0B" },
  { topic: "Celtics offseason targets",         sub: "Stevens prioritizing rim presence after Game 7 loss", href: "/v2/zones/sports/story/celtics-stevens-brown",  pillLabel: "Sports",  pillBg: "#EAF3DE", pillColor: "#3B6D11" },
];

const TRACKING = [
  { name: "AJ Brown trade",     sub: "Expected June 1 — cap math confirmed",     href: "/v2/zones/sports/story/patriots-aj-brown",  pillLabel: "Sports",  pillBg: "#EAF3DE", pillColor: "#3B6D11", hasNew: true  },
  { name: "Gemini / Google AI", sub: "Gemini 3.5 Flash announced at Google I/O", href: "/v2/zones/tech/story/google-io-gemini",     pillLabel: "Tech",    pillBg: "#EEEDFE", pillColor: "#534AB7", hasNew: true  },
  { name: "Maine weather",      sub: "No changes to weekend forecast",            href: "/v2/zones/maine/story/maine-memorial-day",  pillLabel: "Maine",   pillBg: "#FAEEDA", pillColor: "#854F0B", hasNew: false },
];

const TOPIC_MENU = [
  { label: "Track Topic",  icon: "◎", color: "#185FA5" },
  { label: "Read Later",   icon: "⊕", color: "#475066" },
  { label: "Pause Topic",  icon: "⏸", color: "#475066" },
  { label: "Remove Topic", icon: "✕", color: "#E24B4A" },
];

const TRACKING_MENU = [
  { label: "View Updates",       icon: "◎", color: "#185FA5" },
  { label: "Pause Tracking",     icon: "⏸", color: "#475066" },
  { label: "Remove from Tracking", icon: "✕", color: "#E24B4A" },
];

export default function V2Page() {
  const [zonesExpanded, setZonesExpanded] = useState(false);
  const visibleZones = zonesExpanded ? ZONES : ZONES.slice(0, 4);
  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const [openTrackingMenu, setOpenTrackingMenu] = useState<number | null>(null);

  return (
    <div className="pb-4">

      {/* Greeting bar */}
      <div className="px-4 pt-3 pb-2 border-b border-[#f0f1f3] flex items-center justify-between">
        <div>
          <div className="text-[13px] text-[#7a8499] uppercase tracking-widest">Fri, May 22 · North Andover, MA</div>
          <div className="text-[16px] font-semibold text-[#0f1117] mt-0.5">Good morning, Rick</div>
        </div>
        <span className="text-[12px] italic px-2 py-0.5 rounded bg-[#f0f1f3] text-[#7a8499]">v2 prototype</span>
      </div>

      {/* Breaking */}
      <div className="px-4 py-3 border-b border-[#f0f1f3]">
        <div className="flex items-center gap-2 mb-2.5">
          <span className="w-2 h-2 rounded-full bg-[#E24B4A] flex-shrink-0" />
          <span className="text-[12px] font-semibold tracking-widest text-[#7a8499] uppercase">Breaking</span>
        </div>
        {BREAKING.map((item, i) => (
          <Link key={i} href={item.href} className="flex gap-2.5 py-2.5 border-b border-[#f0f1f3] last:border-0 last:pb-0 touch-manipulation active:opacity-70">
            <div className="w-0.5 rounded-full flex-shrink-0 self-stretch min-h-[18px]" style={{ background: item.color }} />
            <div className="flex-1 min-w-0">
              <div className="text-[12px] text-[#7a8499] uppercase tracking-wide mb-0.5">{item.tag}</div>
              <div className="text-[15px] font-semibold text-[#0f1117] leading-snug">{item.headline}</div>
              <div className="text-[12px] text-[#7a8499] mt-1">{item.time}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Your Zones */}
      <div className="px-4 py-3 border-b border-[#f0f1f3]">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[12px] font-semibold tracking-widest text-[#7a8499] uppercase flex-1">Your Zones</span>
          <button className="flex items-center gap-1 text-[12px] text-[#185FA5] bg-[#E6F1FB] px-2 py-0.5 rounded-[4px] touch-manipulation">
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            edit
          </button>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {visibleZones.map((z) => (
            <Link key={z.id} href={`/v2/zones/${z.id}`} className="rounded-[10px] p-3 text-left touch-manipulation active:opacity-80 block" style={{ background: z.bg }}>
              <div className="text-[11px] font-semibold tracking-widest" style={{ color: z.nameColor }}>{z.name}</div>
              <div className="text-[13px] font-semibold leading-snug mt-1" style={{ color: z.snapColor }}>{z.snap}</div>
              <div className="flex justify-between items-center mt-2.5">
                <span className="text-[11px]" style={{ color: z.nameColor, opacity: 0.6 }}>{z.count} {z.count === 1 ? "story" : "stories"}</span>
                <span className="text-[15px]" style={{ color: z.snapColor, opacity: 0.5 }}>›</span>
              </div>
            </Link>
          ))}
          {zonesExpanded && (
            <button className="rounded-[10px] border border-dashed border-[#c0c5d0] p-3 flex flex-col items-center justify-center gap-1.5 min-h-[88px] touch-manipulation active:bg-[#f7f8fa]">
              <span className="text-[20px] text-[#7a8499] leading-none">+</span>
              <span className="text-[12px] text-[#7a8499]">add zone</span>
            </button>
          )}
        </div>
        <button
          onClick={() => setZonesExpanded(!zonesExpanded)}
          className="w-full mt-2.5 text-[13px] text-[#185FA5] font-medium text-center py-1 touch-manipulation"
        >
          {zonesExpanded ? "Show less ↑" : `Show all ${ZONES.length} zones ↓`}
        </button>
      </div>

      {/* Trending */}
      <div className="px-4 py-3 border-b border-[#f0f1f3]">
        <div className="flex items-center gap-2 mb-2.5">
          <span className="text-[12px] font-semibold tracking-widest text-[#7a8499] uppercase">Trending</span>
        </div>
        {TRENDING.map((item, i) => (
          <div key={i} className="py-2.5 border-b border-[#f0f1f3] last:border-0">
            <Link
              href={`/feeds?category=${PILL_TO_FEED[item.pillLabel] ?? "All"}`}
              className="inline-block text-[11px] font-semibold px-2 py-[3px] rounded-[4px] mb-1 touch-manipulation"
              style={{ background: item.pillBg, color: item.pillColor }}
            >
              {item.pillLabel}
            </Link>
            <div className="flex items-start gap-2">
              <Link href={item.href} className="flex-1">
                <div className="text-[15px] font-semibold text-[#0f1117] leading-snug">{item.topic}</div>
                {item.sub && <div className="text-[13px] text-[#7a8499] mt-0.5 leading-snug">{item.sub}</div>}
              </Link>
              <button
                onClick={() => setOpenMenu(openMenu === i ? null : i)}
                className="flex-shrink-0 mt-[1px] text-[16px] text-[#c0c5d0] leading-none touch-manipulation"
                aria-label="More options"
              >
                ···
              </button>
            </div>
          </div>
        ))}
        <div className="flex justify-end pt-2">
          <button className="text-[12px] text-[#7a8499] touch-manipulation">View more →</button>
        </div>
      </div>

      {/* Topic action menu overlay */}
      {openMenu !== null && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpenMenu(null)}
          />
          <div className="fixed z-50 left-1/2 -translate-x-1/2 w-[260px] bg-white rounded-[14px] shadow-[0_8px_32px_rgba(0,0,0,0.18)] border border-[#f0f1f3] overflow-hidden"
            style={{ top: "40%" }}
          >
            <div className="px-4 pt-3 pb-2 border-b border-[#f0f1f3]">
              <div className="text-[12px] font-semibold text-[#7a8499] uppercase tracking-widest truncate">
                {TRENDING[openMenu].topic}
              </div>
            </div>
            {TOPIC_MENU.map((action) => (
              <button
                key={action.label}
                onClick={() => setOpenMenu(null)}
                className="w-full flex items-center gap-3 px-4 py-3 border-b border-[#f7f8fa] last:border-0 touch-manipulation active:bg-[#f7f8fa] text-left"
              >
                <span className="text-[16px] w-5 text-center flex-shrink-0" style={{ color: action.color }}>{action.icon}</span>
                <span className="text-[15px] font-medium" style={{ color: action.color }}>{action.label}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Tracking */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 mb-2.5">
          <span className="text-[12px] font-semibold tracking-widest text-[#7a8499] uppercase flex-1">Tracking</span>
          <Link href="/v2/tracking" className="flex items-center gap-1 text-[12px] text-[#185FA5] bg-[#E6F1FB] px-2 py-0.5 rounded-[4px] touch-manipulation">
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            manage
          </Link>
        </div>
        {TRACKING.map((item, i) => (
          <div key={i} className="py-2.5 border-b border-[#f0f1f3] last:border-0">
            <div className="flex items-center gap-2 mb-1">
              <Link
                href={`/feeds?category=${PILL_TO_FEED[item.pillLabel] ?? "All"}`}
                className="inline-block text-[11px] font-semibold px-2 py-[3px] rounded-[4px] touch-manipulation"
                style={{ background: item.pillBg, color: item.pillColor }}
              >
                {item.pillLabel}
              </Link>
              {item.hasNew && <span className="w-1.5 h-1.5 rounded-full bg-[#185FA5] flex-shrink-0" />}
            </div>
            <div className="flex items-start gap-2">
              <Link href={item.href} className="flex-1">
                <div className="text-[15px] font-semibold text-[#0f1117] leading-snug">{item.name}</div>
                {item.sub && <div className="text-[13px] text-[#7a8499] mt-0.5 leading-snug">{item.sub}</div>}
              </Link>
              <button
                onClick={() => setOpenTrackingMenu(openTrackingMenu === i ? null : i)}
                className="flex-shrink-0 mt-[1px] text-[16px] text-[#c0c5d0] leading-none touch-manipulation"
                aria-label="More options"
              >
                ···
              </button>
            </div>
          </div>
        ))}
        <div className="flex justify-end pt-2">
          <Link href="/v2/tracking" className="text-[12px] text-[#7a8499] touch-manipulation">View more →</Link>
        </div>
      </div>

      {/* Tracking action menu overlay */}
      {openTrackingMenu !== null && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpenTrackingMenu(null)} />
          <div className="fixed z-50 left-1/2 -translate-x-1/2 w-[260px] bg-white rounded-[14px] shadow-[0_8px_32px_rgba(0,0,0,0.18)] border border-[#f0f1f3] overflow-hidden" style={{ top: "40%" }}>
            <div className="px-4 pt-3 pb-2 border-b border-[#f0f1f3]">
              <div className="text-[12px] font-semibold text-[#7a8499] uppercase tracking-widest truncate">
                {TRACKING[openTrackingMenu].name}
              </div>
            </div>
            {TRACKING_MENU.map((action) => (
              <button
                key={action.label}
                onClick={() => setOpenTrackingMenu(null)}
                className="w-full flex items-center gap-3 px-4 py-3 border-b border-[#f7f8fa] last:border-0 touch-manipulation active:bg-[#f7f8fa] text-left"
              >
                <span className="text-[16px] w-5 text-center flex-shrink-0" style={{ color: action.color }}>{action.icon}</span>
                <span className="text-[15px] font-medium" style={{ color: action.color }}>{action.label}</span>
              </button>
            ))}
          </div>
        </>
      )}

    </div>
  );
}
