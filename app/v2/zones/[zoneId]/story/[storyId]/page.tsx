"use client";
import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ZONES, ZONE_NAV, findStory, getRelated } from "@/lib/v2/zoneData";

export default function StoryDetailPage() {
  const params = useParams();
  const zoneId = params.zoneId as string;
  const storyId = params.storyId as string;

  const zone = ZONES[zoneId] ?? ZONES.sports;
  const story = findStory(zoneId, storyId);
  const related = getRelated(zoneId, storyId, 3);
  const [saved, setSaved] = useState(false);

  const { colors } = zone;

  if (!story) {
    return (
      <div className="fixed inset-0 z-50 flex justify-center">
        <div className="w-full max-w-[430px] h-full flex flex-col items-center justify-center bg-white gap-3">
          <div className="text-[16px] font-semibold text-[#0f1117]">Story not found</div>
          <Link href={`/v2/zones/${zoneId}`} className="text-[13px] text-[#185FA5]">← Back to zone</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-center">
      <div className="w-full max-w-[430px] h-full flex flex-col bg-white">

        {/* Sticky header */}
        <div className="flex-shrink-0" style={{ background: colors.dark }}>

          {/* Nav row */}
          <div className="flex items-center px-4 pt-[14px] pb-[10px]">
            <Link
              href={`/v2/zones/${zoneId}`}
              className="flex items-center gap-1 text-[13px] touch-manipulation"
              style={{ color: "rgba(255,255,255,0.6)" }}
            >
              <svg width="7" height="12" viewBox="0 0 7 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 1L1 6l5 5"/>
              </svg>
              {zone.label}
            </Link>
            <div className="flex-1 text-center text-[15px] font-semibold text-white">{zone.chip}</div>
            <button
              onClick={() => setSaved((s) => !s)}
              className="text-[18px] touch-manipulation"
              style={{ color: saved ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.4)" }}
              aria-label={saved ? "Unsave" : "Save"}
            >
              {saved ? "♥" : "♡"}
            </button>
          </div>

          {/* Zone switcher pills */}
          <div className="flex gap-2 px-4 pb-[14px] overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {ZONE_NAV.map((z) => {
              const isActive = z.id === zoneId;
              return (
                <Link
                  key={z.id}
                  href={`/v2/zones/${z.id}`}
                  className="flex-shrink-0 text-[11px] font-semibold px-3 py-1 rounded-full touch-manipulation"
                  style={isActive
                    ? { background: "rgba(255,255,255,0.95)", color: colors.dark }
                    : { background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.65)" }
                  }
                >
                  {z.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">

          {/* Tag + time */}
          <div className="flex items-center gap-2 px-4 pt-4 mb-3">
            <span
              className="text-[10px] font-semibold tracking-wide px-2 py-[3px] rounded-[4px]"
              style={{ background: colors.pillBg, color: colors.pillText }}
            >
              {story.tag}
            </span>
            {story.isNew   && <span className="w-1.5 h-1.5 rounded-full bg-[#E24B4A] flex-shrink-0" />}
            {story.urgent  && <span className="w-1.5 h-1.5 rounded-full bg-[#EF9F27] flex-shrink-0" />}
            <span className="text-[11px] text-[#7a8499]">{story.time}</span>
          </div>

          {/* Headline */}
          <h1 className="px-4 text-[20px] font-bold text-[#0f1117] leading-snug mb-4">
            {story.headline}
          </h1>

          {/* Hero image or zone-colored gradient */}
          {story.imageUrl ? (
            <img
              src={story.imageUrl}
              alt=""
              className="w-full h-[200px] object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <div className="mx-4 h-[140px] rounded-[10px] mb-4" style={{ background: `linear-gradient(135deg, ${colors.dark}, ${colors.mid})` }} />
          )}

          {/* AI Summary */}
          <div className="px-4 pt-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[9px] font-semibold tracking-widest text-[#7a8499] uppercase">AI Summary</span>
              <div className="h-px flex-1 bg-[#f0f1f3]" />
            </div>
            <p className="text-[15px] text-[#1a1a1a] leading-relaxed">{story.summary}</p>
          </div>

          {/* Top Stories */}
          <div className="px-4 pt-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[9px] font-semibold tracking-widest text-[#7a8499] uppercase">Top Stories</span>
              <div className="h-px flex-1 bg-[#f0f1f3]" />
            </div>
            <div className="flex flex-col gap-2">
              {story.sources.map((src, i) => (
                <a
                  key={i}
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 p-3 rounded-[10px] border border-[#f0f1f3] bg-[#fafafa] touch-manipulation active:bg-[#f0f1f3]"
                >
                  {/* Source badge */}
                  <div
                    className="flex-shrink-0 mt-0.5 px-2 py-[3px] rounded-[4px] text-[9px] font-semibold"
                    style={{ background: colors.pillBg, color: colors.pillText }}
                  >
                    {src.label}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-[#0f1117] leading-snug line-clamp-2">{src.title}</p>
                  </div>
                  <span className="text-[14px] flex-shrink-0 mt-0.5" style={{ color: colors.tag }}>↗</span>
                </a>
              ))}
            </div>
          </div>

          {/* Related Articles */}
          {related.length > 0 && (
            <div className="px-4 pt-6 pb-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[9px] font-semibold tracking-widest text-[#7a8499] uppercase">Related</span>
                <div className="h-px flex-1 bg-[#f0f1f3]" />
              </div>
              <div className="flex flex-col gap-2">
                {related.map(({ zoneId: relZoneId, story: rel }) => {
                  const relZone = ZONES[relZoneId];
                  return (
                    <Link
                      key={rel.id}
                      href={`/v2/zones/${relZoneId}/story/${rel.id}`}
                      className="flex items-start gap-3 p-3 rounded-[10px] border border-[#f0f1f3] bg-white touch-manipulation active:bg-[#f7f8fa]"
                    >
                      {/* Zone + tag badges */}
                      <div className="flex flex-col gap-1 flex-shrink-0 mt-0.5">
                        <span
                          className="px-2 py-[2px] rounded-[4px] text-[9px] font-semibold"
                          style={{ background: relZone.colors.pillBg, color: relZone.colors.pillText }}
                        >
                          {rel.tag}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-[#0f1117] leading-snug line-clamp-2">{rel.headline}</p>
                        <p className="text-[11px] text-[#7a8499] mt-0.5">{rel.time}</p>
                      </div>
                      <span className="text-[14px] text-[#7a8499] flex-shrink-0 mt-0.5">›</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Bottom nav */}
        <div className="flex-shrink-0 bg-white border-t border-[#dde1e8]" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
          <div className="flex">
            <NavTab label="Home" href="/v2">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7a8499" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </NavTab>
            <NavTab label="Zones" active>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2d59a6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
              </svg>
            </NavTab>
            <NavTab label="Saved">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7a8499" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
              </svg>
            </NavTab>
            <NavTab label="Tracking" href="/v2/tracking">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7a8499" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </NavTab>
          </div>
        </div>

      </div>
    </div>
  );
}

function NavTab({ label, active, href, children }: { label: string; active?: boolean; href?: string; children: React.ReactNode }) {
  const inner = (
    <div className="flex flex-col items-center justify-center gap-0.5 py-2 touch-manipulation w-full">
      {children}
      <span className="text-[10px] font-medium" style={{ color: active ? "#2d59a6" : "#7a8499" }}>{label}</span>
    </div>
  );
  if (href) return <Link href={href} className="flex-1">{inner}</Link>;
  return <div className="flex-1">{inner}</div>;
}
