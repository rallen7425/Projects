"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const PILL_TO_FEED: Record<string, string> = {
  Sports:  "Sports",
  Tech:    "Tech",
  Finance: "Business",
  Maine:   "Local",
  Local:   "Local",
};

const ALL_TRENDING = [
  { topic: "Giannis trade market",              sub: "Bucks listening; Celtics among potential fits",        href: "/v2/zones/sports/story/celtics-giannis",        pillLabel: "Sports",  pillBg: "#EAF3DE", pillColor: "#3B6D11" },
  { topic: "OpenAI launches Ads Manager",       sub: "Self-serve ad dashboard inside ChatGPT",               href: "/v2/zones/tech/story/openai-ads-manager",       pillLabel: "Tech",    pillBg: "#EEEDFE", pillColor: "#534AB7" },
  { topic: "Fed rate outlook shifts",            sub: "June cut off the table; September now earliest",       href: "/v2/zones/finance/story/fed-rate-hold",         pillLabel: "Finance", pillBg: "#E1F5EE", pillColor: "#0F6E56" },
  { topic: "Maine Turnpike Memorial Day delay",  sub: "Peak northbound traffic 2–7pm Friday",                href: "/v2/zones/maine/story/maine-turnpike-traffic",  pillLabel: "Maine",   pillBg: "#FAEEDA", pillColor: "#854F0B" },
  { topic: "Celtics offseason targets",          sub: "Stevens prioritizing rim presence after Game 7 loss",  href: "/v2/zones/sports/story/celtics-stevens-brown",  pillLabel: "Sports",  pillBg: "#EAF3DE", pillColor: "#3B6D11" },
  { topic: "AJ Brown trade to Patriots",         sub: "Deal expected after June 1 — 2028 first-rounder to Philly", href: "/v2/zones/sports/story/patriots-aj-brown", pillLabel: "Sports",  pillBg: "#EAF3DE", pillColor: "#3B6D11" },
  { topic: "Google I/O: Gemini 3.5 Flash",       sub: "AI is now the primary lens for every Google product", href: "/v2/zones/tech/story/google-io-gemini",         pillLabel: "Tech",    pillBg: "#EEEDFE", pillColor: "#534AB7" },
  { topic: "Red Sox win streak — 3 straight",    sub: "Duran go-ahead HR, home series vs Twins starts tonight", href: "/v2/zones/sports/story/sox-royals-recap",    pillLabel: "Sports",  pillBg: "#EAF3DE", pillColor: "#3B6D11" },
  { topic: "Maine Memorial Day weekend outlook", sub: "Fri–Sat clear, rain arrives Sunday afternoon",        href: "/v2/zones/maine/story/maine-memorial-day",      pillLabel: "Maine",   pillBg: "#FAEEDA", pillColor: "#854F0B" },
  { topic: "Markets at all-time highs",          sub: "Dow hits record 50,579 — 8th straight winning week",  href: "/v2/zones/finance/story/markets-steady",        pillLabel: "Finance", pillBg: "#E1F5EE", pillColor: "#0F6E56" },
];

const TOPIC_MENU = [
  { label: "Track Topic",  icon: "◎", color: "#185FA5" },
  { label: "Read Later",   icon: "⊕", color: "#475066" },
  { label: "Pause Topic",  icon: "⏸", color: "#475066" },
  { label: "Remove Topic", icon: "✕", color: "#E24B4A" },
];

const PAGE_SIZE = 10;

export default function TrendingPage() {
  const router = useRouter();
  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const [visible, setVisible] = useState(PAGE_SIZE);

  const shown = ALL_TRENDING.slice(0, visible);

  return (
    <div className="pb-6">

      {/* Back + header */}
      <div className="px-4 pt-3 pb-2 border-b border-[#f0f1f3] flex items-center gap-3">
        <button onClick={() => router.back()} className="text-[14px] font-medium text-[#185FA5] touch-manipulation">←</button>
        <div>
          <div className="text-[18px] font-semibold text-[#0f1117]">Trending</div>
          <div className="text-[13px] text-[#7a8499]">Top topics right now</div>
        </div>
      </div>

      {/* Trending list */}
      <div className="px-4 pt-2">
        {shown.map((item, i) => (
          <div key={i} className="py-3 border-b border-[#f0f1f3] last:border-0">
            <Link
              href={`/feeds?category=${PILL_TO_FEED[item.pillLabel] ?? "All"}`}
              className="inline-block text-[11px] font-semibold px-2 py-[3px] rounded-[4px] mb-1.5 touch-manipulation"
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
      </div>

      {/* View more */}
      {visible < ALL_TRENDING.length ? (
        <div className="px-4 pt-3 flex justify-center">
          <button
            onClick={() => setVisible((v) => v + PAGE_SIZE)}
            className="text-[14px] font-medium text-[#185FA5] bg-[#E6F1FB] px-4 py-2 rounded-[8px] touch-manipulation active:opacity-80"
          >
            View more
          </button>
        </div>
      ) : (
        <div className="px-4 pt-3 flex justify-end">
          <Link href="/feeds" className="text-[13px] text-[#7a8499] touch-manipulation">
            See all news in Feeds →
          </Link>
        </div>
      )}

      {/* Topic action menu overlay */}
      {openMenu !== null && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpenMenu(null)} />
          <div
            className="fixed z-50 left-1/2 -translate-x-1/2 w-[260px] bg-white rounded-[14px] shadow-[0_8px_32px_rgba(0,0,0,0.18)] border border-[#f0f1f3] overflow-hidden"
            style={{ top: "40%" }}
          >
            <div className="px-4 pt-3 pb-2 border-b border-[#f0f1f3]">
              <div className="text-[12px] font-semibold text-[#7a8499] uppercase tracking-widest truncate">
                {ALL_TRENDING[openMenu].topic}
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

    </div>
  );
}
