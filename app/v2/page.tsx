"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ZoneSubNav from "@/components/v2/ZoneSubNav";
import { useSavedStories } from "@/components/SavedStoriesProvider";
import { useTrackedTopics } from "@/components/TrackedTopicsProvider";
import TrackModal, { type TrackModalState } from "@/components/v2/TrackModal";
import homeContent from "@/content/home.json";

const { dateBar: DATE_BAR, breaking: BREAKING, zones: ZONES, trending: TRENDING } = homeContent;

// Maps V2 pill labels to Feeds page category param
const PILL_TO_FEED: Record<string, string> = {
  Sports:  "Sports",
  Tech:    "Tech",
  Finance: "Business",
  Maine:   "Local",
  Local:   "Local",
  News:    "News",
};

function getGreeting() {
  const h = new Date().getHours();
  if (h >= 4 && h < 12) return "Good morning";
  if (h >= 12 && h < 17) return "Good afternoon";
  if (h >= 17 && h < 21) return "Good evening";
  return "Good night";
}

export default function V2Page() {
  const router = useRouter();
  const { isSaved, toggle } = useSavedStories();
  const { topics: trackedTopics } = useTrackedTopics();
  const [zonesExpanded, setZonesExpanded] = useState(false);
  const visibleZones = zonesExpanded ? ZONES : ZONES.slice(0, 4);
  const [trackingModal, setTrackingModal] = useState<TrackModalState>(null);

  return (
    <div className="bg-[#f4f5f7] min-h-full">
      <ZoneSubNav />

      {/* Greeting bar */}
      <div className="px-4 pt-3 pb-2 flex items-center justify-between">
        <div>
          <div className="text-[13px] text-[#7a8499] uppercase tracking-widest">{DATE_BAR}</div>
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
        <div className="flex flex-col gap-2">
          {visibleZones.map((z) => (
            <div key={z.id} className="rounded-[10px] overflow-hidden border border-[#e8eaef]">
              {/* Colored header — taps to zone page */}
              <button
                onClick={() => router.push(`/v2/zones/${z.id}`)}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-left touch-manipulation"
                style={{ background: z.bg }}
              >
                <span className="text-[11px] font-bold tracking-[0.07em] uppercase text-white">
                  {z.name}
                </span>
                <span className="ml-auto text-[10px] font-medium text-white">
                  View {z.label} zone →
                </span>
              </button>
              {/* Story bullet list */}
              <div style={{ background: z.bodyBg }}>
                {/* Featured story */}
                <Link
                  href={z.featuredHref}
                  className="flex items-start gap-2.5 px-3 py-[8px] border-b border-[#eaecf0] touch-manipulation active:opacity-70"
                >
                  <div className="w-[5px] h-[5px] rounded-full flex-shrink-0 mt-[5px]" style={{ background: z.bg }} />
                  <span className="text-[12px] leading-[1.4] text-[#0f1117] font-medium">{z.featured}</span>
                </Link>
                {/* Secondary stories */}
                {z.stories.map((story, si) => (
                  <Link
                    key={si}
                    href={story.href}
                    className="flex items-start gap-2.5 px-3 py-[7px] touch-manipulation active:opacity-70"
                    style={{ borderBottom: si < z.stories.length - 1 ? "1px solid #eaecf0" : "none" }}
                  >
                    <div className="w-[4px] h-[4px] rounded-full flex-shrink-0 mt-[6px]" style={{ background: `${z.bg}66` }} />
                    <span className="text-[12px] leading-[1.4] text-[#3a4455]">{story.text}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
          {zonesExpanded && (
            <button className="rounded-[10px] border border-dashed border-[#c0c5d0] p-3 flex items-center justify-center gap-2 touch-manipulation active:bg-[#f7f8fa]">
              <span className="text-[18px] text-[#7a8499] leading-none">+</span>
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
                  onClick={() => setTrackingModal({ step: "confirm", topic: item.topic })}
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
        {trackedTopics.length === 0 ? (
          <p className="text-[13px] text-[#7a8499] py-1">
            No topics tracked yet.{" "}
            <Link href="/v2/tracking" className="text-[#185FA5]">Add one →</Link>
          </p>
        ) : (
          trackedTopics.slice(0, 3).map((item) => (
            <div key={item.id} className="py-2.5 border-b border-[#f0f1f3] last:border-0">
              <Link href={`/v2/tag/${encodeURIComponent(item.name)}`} className="block">
                <div className="text-[15px] font-semibold text-[#0f1117] leading-snug">#{item.name}</div>
              </Link>
            </div>
          ))
        )}
        <div className="flex justify-end pt-2">
          <Link href="/v2/tracking" className="text-[12px] text-[#7a8499] touch-manipulation">View all →</Link>
        </div>
      </div>

      <TrackModal
        modal={trackingModal}
        onConfirm={() => setTrackingModal((m) => m ? { step: "success", topic: m.topic } : null)}
        onClose={() => setTrackingModal(null)}
      />

    </div>
  );
}
