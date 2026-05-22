"use client";
import { useState } from "react";
import Link from "next/link";

const BREAKING = [
  { color: "#E24B4A", tag: "WEATHER · LOCAL", headline: "Heat risk today — 92°F, severe T-storms expected by 2pm", time: "8 min ago" },
  { color: "#EF9F27", tag: "CELTICS", headline: "Stevens confirms Brown not being traded this offseason", time: "1 hr ago" },
];

const ZONES = [
  { id: "local",   name: "LOCAL",       snap: "Heat spike, storms this afternoon",   count: 2, bg: "#E6F1FB", nameColor: "#185FA5", snapColor: "#0C447C" },
  { id: "sports",  name: "SPORTS",      snap: "Sox win, Celtics offseason in motion", count: 4, bg: "#EAF3DE", nameColor: "#3B6D11", snapColor: "#27500A" },
  { id: "maine",   name: "MAINE HOUSE", snap: "Fri–Sat clear, rain arrives Sunday",  count: 1, bg: "#FAEEDA", nameColor: "#854F0B", snapColor: "#633806" },
  { id: "tech",    name: "TECH & AI",   snap: "Google I/O, Gemini, Meta layoffs",    count: 3, bg: "#EEEDFE", nameColor: "#534AB7", snapColor: "#3C3489" },
  { id: "finance", name: "FINANCE",     snap: "Fed rate outlook, markets steady",     count: 2, bg: "#E1F5EE", nameColor: "#0F6E56", snapColor: "#085041" },
];

const TRENDING = [
  { topic: "Giannis trade market",             pillLabel: "Sports",  pillBg: "#EAF3DE", pillColor: "#3B6D11" },
  { topic: "OpenAI launches Ads Manager",      pillLabel: "Tech",    pillBg: "#EEEDFE", pillColor: "#534AB7" },
  { topic: "Fed rate outlook shifts",           pillLabel: "Finance", pillBg: "#E1F5EE", pillColor: "#0F6E56" },
  { topic: "Maine Turnpike Memorial Day delay", pillLabel: "Maine",   pillBg: "#FAEEDA", pillColor: "#854F0B" },
  { topic: "Celtics offseason targets",         pillLabel: "Sports",  pillBg: "#EAF3DE", pillColor: "#3B6D11" },
];

const TRACKING = [
  { emoji: "🏈", name: "AJ Brown trade",     update: "Expected June 1 — cap math confirmed", time: "2h", hasNew: true  },
  { emoji: "🤖", name: "Gemini / Google AI", update: "Gemini 3.5 Flash announced at I/O",    time: "5h", hasNew: true  },
  { emoji: "🏠", name: "Maine weather",      update: "No changes to weekend forecast",        time: "1h", hasNew: false },
];

export default function V2Page() {
  const [zonesExpanded, setZonesExpanded] = useState(false);
  const visibleZones = zonesExpanded ? ZONES : ZONES.slice(0, 4);

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
          <div key={i} className="flex gap-2.5 py-2.5 border-b border-[#f0f1f3] last:border-0 last:pb-0">
            <div className="w-0.5 rounded-full flex-shrink-0 self-stretch min-h-[18px]" style={{ background: item.color }} />
            <div className="flex-1 min-w-0">
              <div className="text-[12px] text-[#7a8499] uppercase tracking-wide mb-0.5">{item.tag}</div>
              <div className="text-[15px] font-semibold text-[#0f1117] leading-snug">{item.headline}</div>
              <div className="text-[12px] text-[#7a8499] mt-1">{item.time}</div>
            </div>
          </div>
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
            <span
              className="inline-block text-[11px] font-semibold px-2 py-[3px] rounded-[4px] mb-1"
              style={{ background: item.pillBg, color: item.pillColor }}
            >
              {item.pillLabel}
            </span>
            <div className="text-[15px] font-semibold text-[#0f1117] leading-snug">{item.topic}</div>
          </div>
        ))}
        <div className="flex justify-end pt-2">
          <button className="text-[12px] text-[#7a8499] touch-manipulation">View more →</button>
        </div>
      </div>

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
          <div key={i} className="flex items-center gap-3 py-2.5 border-b border-[#f0f1f3] last:border-0">
            <div className="w-9 h-9 rounded-[8px] bg-[#f7f8fa] flex items-center justify-center text-[20px] flex-shrink-0">{item.emoji}</div>
            <div className="flex-1 min-w-0">
              <div className="text-[15px] font-semibold text-[#0f1117]">{item.name}</div>
              <div className="text-[13px] text-[#7a8499] mt-0.5 line-clamp-1">{item.update}</div>
            </div>
            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
              <span className="text-[12px] text-[#7a8499]">{item.time}</span>
              {item.hasNew && <span className="w-2 h-2 rounded-full bg-[#185FA5]" />}
            </div>
          </div>
        ))}
        <div className="text-center pt-2">
          <Link href="/v2/tracking" className="text-[13px] text-[#185FA5] font-medium touch-manipulation">View 3 more tracked topics →</Link>
        </div>
      </div>

    </div>
  );
}
