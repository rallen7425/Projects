"use client";
import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ZONES, ZONE_NAV } from "@/lib/v2/zoneData";

export default function ZoneDetailPage() {
  const params = useParams();
  const zoneId = (params.zoneId as string) || "sports";
  const zone = ZONES[zoneId] ?? ZONES.sports;
  const [saved, setSaved] = useState<Set<string>>(new Set());

  function toggleSave(id: string) {
    setSaved((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const { colors } = zone;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-center">
      <div className="w-full max-w-[430px] h-full flex flex-col bg-white">

        {/* Sticky zone header */}
        <div className="flex-shrink-0" style={{ background: colors.dark }}>

          {/* Nav row */}
          <div className="flex items-center px-4 pt-[14px] pb-[10px]">
            <Link href="/v2" className="flex items-center gap-1 text-[13px] touch-manipulation" style={{ color: "rgba(255,255,255,0.6)" }}>
              <svg width="7" height="12" viewBox="0 0 7 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 1L1 6l5 5"/>
              </svg>
              Your zones
            </Link>
            <div className="flex-1 text-center text-[15px] font-semibold text-white">{zone.label}</div>
            <span className="text-[13px] touch-manipulation" style={{ color: "rgba(255,255,255,0.5)" }}>manage</span>
          </div>

          {/* Zone switcher pills */}
          <div className="flex gap-2 px-4 pb-[12px] overflow-x-auto" style={{ scrollbarWidth: "none" }}>
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

          {/* Label row */}
          <div className="flex items-center gap-2 px-4 pb-[14px]">
            <span className="text-[10px] font-semibold tracking-widest" style={{ color: "rgba(255,255,255,0.5)" }}>{zone.chip}</span>
            <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>{zone.storyCount}</span>
          </div>

          {/* Quick Look strip */}
          <div className="px-4 pt-[10px] pb-[12px] border-t" style={{ background: colors.mid, borderColor: "rgba(255,255,255,0.08)" }}>
            <div className="text-[9px] tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em" }}>QUICK LOOK</div>
            <div className="flex gap-[7px] overflow-x-auto" style={{ scrollbarWidth: "none" }}>
              {zone.quickLook.map((chip, i) => (
                <div key={i} className="flex-shrink-0 min-w-[90px] rounded-[8px] px-[10px] py-[7px]" style={{ background: "rgba(255,255,255,0.1)" }}>
                  <div className="text-[8px] mb-[3px]" style={{ color: "rgba(255,255,255,0.4)", letterSpacing: "0.06em" }}>{chip.label}</div>
                  <div className="text-[13px] font-semibold text-white leading-snug">{chip.value}</div>
                  <div className="text-[9px] mt-[2px]" style={{ color: "rgba(255,255,255,0.45)" }}>{chip.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scrollable stories */}
        <div className="flex-1 overflow-y-auto pb-4">
          {zone.groups.map((group) => (
            <div key={group.label}>
              <div className="px-4 pt-[14px] pb-[6px] text-[9px] font-semibold tracking-widest text-[#7a8499] uppercase">{group.label}</div>
              {group.stories.map((story, i) => {
                const isSaved = saved.has(story.id);
                return (
                  <div key={story.id} className="px-4 py-[14px] border-b border-[#f5f5f5]">
                    {/* Meta */}
                    <div className="flex items-center gap-[7px] mb-[6px]">
                      <span className="text-[9px] font-semibold tracking-wide px-[7px] py-[2px] rounded-[4px]"
                        style={{ background: colors.pillBg, color: colors.pillText }}>
                        {story.tag}
                      </span>
                      {story.isNew   && <span className="w-1.5 h-1.5 rounded-full bg-[#E24B4A] flex-shrink-0" />}
                      {story.urgent  && <span className="w-1.5 h-1.5 rounded-full bg-[#EF9F27] flex-shrink-0" />}
                      <span className="ml-auto text-[9px] text-[#7a8499]">{story.time}</span>
                    </div>

                    {/* Headline — links to story detail */}
                    <Link href={`/v2/zones/${zoneId}/story/${story.id}`} className="block mb-[5px]">
                      <div className="text-[15px] font-semibold text-[#111111] leading-snug">{story.headline}</div>
                    </Link>

                    {/* Summary preview */}
                    <div className="text-[13px] text-[#555555] leading-relaxed mb-[10px] line-clamp-3">{story.summary}</div>

                    {/* Footer */}
                    <div className="flex items-center justify-between">
                      <Link
                        href={`/v2/zones/${zoneId}/story/${story.id}`}
                        className="text-[12px] font-medium touch-manipulation"
                        style={{ color: colors.tag }}
                      >
                        Read more →
                      </Link>
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleSave(story.id)}
                          className="w-[30px] h-[30px] rounded-[7px] border flex items-center justify-center text-[14px] touch-manipulation"
                          style={isSaved
                            ? { background: colors.pillBg, borderColor: colors.pillBg, color: colors.tag }
                            : { background: "transparent", borderColor: "rgba(0,0,0,0.1)", color: "#999999" }
                          }
                        >
                          {isSaved ? "♥" : "♡"}
                        </button>
                        <button className="w-[30px] h-[30px] rounded-[7px] border border-[rgba(0,0,0,0.1)] flex items-center justify-center text-[14px] text-[#999999] touch-manipulation">
                          ↗
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
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
