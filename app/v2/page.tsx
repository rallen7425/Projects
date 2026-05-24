"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ZoneSubNav from "@/components/v2/ZoneSubNav";
import { useSavedStories } from "@/components/SavedStoriesProvider";

const BREAKING = [
  { color: "#E24B4A", tag: "WEATHER · LOCAL", headline: "Heat risk today — 92°F, severe T-storms expected by 2pm", time: "8 min ago", href: "/v2/zones/local/story/heat-spike-storms" },
];

const ZONES = [
  {
    id: "local",   name: "LOCAL",
    featured: "92°F today — heat risk, severe T-storms expected by 2pm",
    stories: ["Town meeting: $48M school budget approved"],
    count: 2, bg: "#0c2d5e", nameColor: "#85B7EB",
  },
  {
    id: "sports",  name: "SPORTS",
    featured: "Stevens: Brown stays — targeting rim presence this offseason",
    stories: ["AJ Brown trade closing around June 1", "Giannis market opens — Celts a fit?", "Sox beat Royals 4–3, Duran HR"],
    count: 4, bg: "#1b4332", nameColor: "#9FE1CB",
  },
  {
    id: "maine",   name: "MAINE HOUSE",
    featured: "Good Fri–Sat, rain arrives Sunday — 60% chance Memorial Day",
    stories: ["Turnpike: heavy northbound traffic Friday afternoon"],
    count: 2, bg: "#5c3208", nameColor: "#FAC775",
  },
  {
    id: "tech",    name: "TECH & AI",
    featured: "Google I/O: Gemini 3.5 Flash across every product",
    stories: ["OpenAI launches Ads Manager in ChatGPT", "Exa Labs raises $250M at $2.2B"],
    count: 3, bg: "#2a1d6e", nameColor: "#AFA9EC",
  },
  {
    id: "finance", name: "FINANCE",
    featured: "Dow hits all-time high 50,579 — 8th straight winning week",
    stories: ["Fed holds: June cut off table, September earliest"],
    count: 2, bg: "#0c3322", nameColor: "#6EDCB8",
  },
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


function getGreeting() {
  const h = new Date().getHours();
  if (h >= 4 && h < 12) return "Good morning";
  if (h >= 12 && h < 17) return "Good afternoon";
  if (h >= 17 && h < 21) return "Good evening";
  return "Good night";
}

type TrackingItem = typeof TRACKING[number];
type TrackingModal =
  | { step: "confirm"; topic: string; item: TrackingItem }
  | { step: "success"; topic: string }
  | null;

export default function V2Page() {
  const router = useRouter();
  const { isSaved, toggle } = useSavedStories();
  const [zonesExpanded, setZonesExpanded] = useState(false);
  const visibleZones = zonesExpanded ? ZONES : ZONES.slice(0, 4);
  const [savedStories, setSavedStories] = useState<Set<string>>(new Set());
  const [trackedTopics, setTrackedTopics] = useState<TrackingItem[]>(TRACKING);
  const [trackingModal, setTrackingModal] = useState<TrackingModal>(null);

  function confirmAddTracking() {
    if (!trackingModal || trackingModal.step !== "confirm") return;
    setTrackedTopics((prev) => {
      const exists = prev.some((t) => t.name === trackingModal.item.name);
      return exists ? prev : [{ ...trackingModal.item, hasNew: false }, ...prev];
    });
    setTrackingModal({ step: "success", topic: trackingModal.topic });
  }

  return (
    <div className="bg-[#f4f5f7] min-h-full">
      <ZoneSubNav />

      {/* Greeting bar */}
      <div className="px-4 pt-3 pb-2 flex items-center justify-between">
        <div>
          <div className="text-[13px] text-[#7a8499] uppercase tracking-widest">Fri, May 22 · North Andover, MA</div>
          <div className="text-[16px] font-semibold text-[#0f1117] mt-0.5">{getGreeting()}, Rick</div>
        </div>
        <span className="text-[12px] italic px-2 py-0.5 rounded bg-[#f0f1f3] text-[#7a8499]">v2 prototype</span>
      </div>

      {/* Breaking */}
      {BREAKING.map((item, i) => (
        <Link key={i} href={item.href} className="flex items-center gap-2 px-4 py-2 touch-manipulation active:opacity-70">
          <span className="w-[5px] h-[5px] rounded-full bg-[#E24B4A] flex-shrink-0" />
          <span className="text-[10px] font-semibold tracking-[0.09em] text-[#7a8499] uppercase flex-shrink-0">Breaking</span>
          <span className="text-[13px] font-medium text-[#0f1117] leading-snug flex-1 line-clamp-1">{item.headline}</span>
        </Link>
      ))}

      {/* Your Zones */}
      <div className="mx-3 mt-3 rounded-[12px] bg-white border border-[#e8eaef] overflow-hidden px-4 py-3">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[12px] font-semibold tracking-widest text-[#7a8499] uppercase flex-1">Your Zones</span>
          <button
            onClick={() => setZonesExpanded(!zonesExpanded)}
            className="text-[12px] font-medium text-[#185FA5] touch-manipulation"
          >
            {zonesExpanded ? "View less" : "View all"}
          </button>
          <button className="flex items-center justify-center text-[#185FA5] bg-[#E6F1FB] w-6 h-6 rounded-[4px] touch-manipulation" aria-label="Edit zones">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {visibleZones.map((z) => (
            <div
              key={z.id}
              className="rounded-[11px] overflow-hidden flex flex-col touch-manipulation active:opacity-90 cursor-pointer"
              style={{ background: z.bg }}
              onClick={() => router.push(`/v2/zones/${z.id}`)}
            >
              {/* Zone name + featured headline */}
              <div className="px-[9px] pt-[8px] pb-[6px]">
                <div className="text-[8px] font-semibold tracking-[0.1em] mb-[5px]" style={{ color: z.nameColor }}>{z.name}</div>
                <div className="text-[11px] font-semibold leading-[1.35] mb-[2px]" style={{ color: "white" }}>{z.featured}</div>
              </div>
              {/* Secondary stories */}
              {z.stories.map((story, si) => {
                const key = `${z.id}-${si}`;
                const saved = savedStories.has(key);
                return (
                  <div key={si} className="flex items-start justify-between gap-1 px-[9px] py-[5px]" style={{ borderTop: "0.5px solid rgba(255,255,255,0.12)" }}>
                    <span className="text-[9px] leading-[1.35] flex-1" style={{ color: "rgba(255,255,255,0.75)" }}>{story}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSavedStories((prev) => {
                          const next = new Set(prev);
                          next.has(key) ? next.delete(key) : next.add(key);
                          return next;
                        });
                      }}
                      className="flex-shrink-0 text-[12px] leading-none touch-manipulation"
                      style={{ color: saved ? "rgba(255,255,255,1)" : "rgba(255,255,255,0.4)" }}
                    >
                      {saved ? "♥" : "♡"}
                    </button>
                  </div>
                );
              })}
              {/* Footer */}
              <div className="flex items-center justify-between px-[9px] py-[5px] pb-[8px] mt-auto" style={{ borderTop: "0.5px solid rgba(255,255,255,0.15)" }}>
                <span className="text-[8px]" style={{ color: "rgba(255,255,255,0.4)" }}>{z.count} {z.count === 1 ? "story" : "stories"}</span>
                <span className="text-[9px] font-semibold" style={{ color: "rgba(255,255,255,0.8)" }}>open →</span>
              </div>
            </div>
          ))}
          {zonesExpanded && (
            <button className="rounded-[10px] border border-dashed border-[#c0c5d0] p-3 flex flex-col items-center justify-center gap-1.5 min-h-[88px] touch-manipulation active:bg-[#f7f8fa]">
              <span className="text-[20px] text-[#7a8499] leading-none">+</span>
              <span className="text-[12px] text-[#7a8499]">add zone</span>
            </button>
          )}
        </div>
      </div>

      {/* Trending */}
      <div className="mx-3 mt-3 rounded-[12px] bg-white border border-[#e8eaef] overflow-hidden px-4 py-3">
        <div className="flex items-center gap-2 mb-2.5">
          <Link href="/v2/trending" className="text-[12px] font-semibold tracking-widest text-[#7a8499] uppercase touch-manipulation">Trending</Link>
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
              <div className="flex items-center gap-2 flex-shrink-0 mt-[2px]">
                {/* Save bookmark */}
                <button
                  onClick={() => toggle({ id: `trending-${i}`, title: item.topic, source: item.pillLabel, snippet: item.sub ?? "" })}
                  className="touch-manipulation"
                  aria-label={isSaved(`trending-${i}`) ? "Remove from saved" : "Save"}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill={isSaved(`trending-${i}`) ? "#185FA5" : "none"} stroke={isSaved(`trending-${i}`) ? "#185FA5" : "#c0c5d0"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                  </svg>
                </button>
                {/* Add to tracking */}
                <button
                  onClick={() => setTrackingModal({ step: "confirm", topic: item.topic, item: { name: item.topic, sub: item.sub, href: item.href, pillLabel: item.pillLabel, pillBg: item.pillBg, pillColor: item.pillColor, hasNew: false } })}
                  className="touch-manipulation"
                  aria-label="Track topic"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c0c5d0" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
        <div className="flex justify-end pt-2">
          <Link href="/v2/trending" className="text-[12px] text-[#7a8499] touch-manipulation">View more →</Link>
        </div>
      </div>

      {/* Tracking */}
      <div className="mx-3 mt-3 rounded-[12px] bg-white border border-[#e8eaef] overflow-hidden px-4 py-3">
        <div className="flex items-center gap-2 mb-2.5">
          <Link href="/v2/tracking" className="text-[12px] font-semibold tracking-widest text-[#7a8499] uppercase flex-1 touch-manipulation">Tracking</Link>
          <Link href="/v2/tracking" className="flex items-center justify-center text-[#185FA5] bg-[#E6F1FB] w-6 h-6 rounded-[4px] touch-manipulation" aria-label="Manage tracking">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </Link>
        </div>
        {trackedTopics.map((item, i) => {
          const savedId = `tracking-${item.name}`;
          return (
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
                  onClick={() => toggle({ id: savedId, title: item.name, source: item.pillLabel, snippet: item.sub ?? "" })}
                  className="flex-shrink-0 mt-[2px] touch-manipulation"
                  aria-label={isSaved(savedId) ? "Remove from saved" : "Save"}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill={isSaved(savedId) ? "#185FA5" : "none"} stroke={isSaved(savedId) ? "#185FA5" : "#c0c5d0"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
        <div className="flex justify-end pt-2">
          <Link href="/v2/tracking" className="text-[12px] text-[#7a8499] touch-manipulation">View more →</Link>
        </div>
      </div>

      {/* Tracking modal */}
      {trackingModal !== null && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setTrackingModal(null)} />
          <div className="fixed z-50 left-1/2 -translate-x-1/2 w-[300px] bg-white rounded-[16px] shadow-[0_12px_40px_rgba(0,0,0,0.22)] overflow-hidden" style={{ top: "38%" }}>
            {trackingModal.step === "confirm" ? (
              <>
                <div className="px-5 pt-5 pb-4">
                  <div className="text-[17px] font-semibold text-[#0f1117] leading-snug mb-1">Track this topic?</div>
                  <div className="text-[14px] text-[#7a8499] leading-snug">
                    #{trackingModal.topic}
                  </div>
                </div>
                <div className="flex border-t border-[#f0f1f3]">
                  <button
                    onClick={() => setTrackingModal(null)}
                    className="flex-1 py-3.5 text-[15px] font-medium text-[#7a8499] border-r border-[#f0f1f3] touch-manipulation active:bg-[#f7f8fa]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmAddTracking}
                    className="flex-1 py-3.5 text-[15px] font-semibold touch-manipulation active:opacity-80"
                    style={{ color: "#185FA5" }}
                  >
                    Add to Tracking
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="px-5 pt-5 pb-4 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#E1F5EE] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-[16px] font-semibold text-[#0f1117] mb-0.5">Added to Tracking</div>
                    <div className="text-[13px] text-[#7a8499]">#{trackingModal.topic}</div>
                  </div>
                </div>
                <div className="border-t border-[#f0f1f3]">
                  <button
                    onClick={() => setTrackingModal(null)}
                    className="w-full py-3.5 text-[15px] font-semibold touch-manipulation active:bg-[#f7f8fa]"
                    style={{ color: "#185FA5" }}
                  >
                    Done
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}

    </div>
  );
}
