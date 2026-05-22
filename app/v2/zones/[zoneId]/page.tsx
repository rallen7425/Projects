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
    <div>

      {/* Sticky zone pill nav */}
      <div className="sticky top-0 z-10 bg-white border-b border-[#dde1e8] px-3 py-2 flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        {ZONE_NAV.map((z) => {
          const isActive = z.id === zoneId;
          return (
            <Link
              key={z.id}
              href={`/v2/zones/${z.id}`}
              className="flex-shrink-0 text-[15px] font-medium px-3 py-1.5 rounded-full border touch-manipulation"
              style={{
                background:   isActive ? colors.pillBg  : "#f7f8fa",
                color:        isActive ? colors.pillText : "#475066",
                borderColor:  isActive ? colors.pillText : "#dde1e8",
              }}
            >
              {z.label}
            </Link>
          );
        })}
      </div>

      {/* Quick Look strip */}
      <div className="px-4 pt-3 pb-3 border-b border-[#f0f1f3]" style={{ background: colors.pillBg }}>
        <div className="text-[11px] font-semibold tracking-widest mb-2" style={{ color: colors.pillText, opacity: 0.7 }}>QUICK LOOK</div>
        <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {zone.quickLook.map((chip, i) => (
            <div
              key={i}
              className="flex-shrink-0 min-w-[90px] rounded-[8px] px-3 py-2 bg-white/60"
            >
              <div className="text-[10px] mb-[3px] font-semibold tracking-wide" style={{ color: colors.pillText, opacity: 0.65 }}>{chip.label}</div>
              <div className="text-[15px] font-semibold leading-snug" style={{ color: colors.dark }}>{chip.value}</div>
              <div className="text-[11px] mt-[2px]" style={{ color: colors.pillText, opacity: 0.6 }}>{chip.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Stories */}
      {zone.groups.map((group) => (
        <div key={group.label}>
          <div className="px-4 pt-3 pb-1.5 text-[11px] font-semibold tracking-widest text-[#7a8499] uppercase">{group.label}</div>
          {group.stories.map((story) => {
            const isSaved = saved.has(story.id);
            return (
              <div key={story.id} className="px-4 py-3.5 border-b border-[#f5f5f5]">
                {/* Meta */}
                <div className="flex items-center gap-[7px] mb-1.5">
                  <span
                    className="text-[11px] font-semibold tracking-wide px-[7px] py-[2px] rounded-[4px]"
                    style={{ background: colors.pillBg, color: colors.pillText }}
                  >
                    {story.tag}
                  </span>
                  {story.isNew  && <span className="w-1.5 h-1.5 rounded-full bg-[#E24B4A] flex-shrink-0" />}
                  {story.urgent && <span className="w-1.5 h-1.5 rounded-full bg-[#EF9F27] flex-shrink-0" />}
                  <span className="ml-auto text-[11px] text-[#7a8499]">{story.time}</span>
                </div>

                {/* Headline */}
                <Link href={`/v2/zones/${zoneId}/story/${story.id}`} className="block mb-1.5">
                  <div className="text-[17px] font-semibold text-[#111111] leading-snug">{story.headline}</div>
                </Link>

                {/* Summary preview */}
                <div className="text-[15px] text-[#555555] leading-relaxed mb-2.5 line-clamp-3">{story.summary}</div>

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <Link
                    href={`/v2/zones/${zoneId}/story/${story.id}`}
                    className="text-[14px] font-medium touch-manipulation"
                    style={{ color: colors.tag }}
                  >
                    Read more →
                  </Link>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleSave(story.id)}
                      className="w-[30px] h-[30px] rounded-[7px] border flex items-center justify-center text-[16px] touch-manipulation"
                      style={isSaved
                        ? { background: colors.pillBg, borderColor: colors.pillBg, color: colors.tag }
                        : { background: "transparent", borderColor: "rgba(0,0,0,0.1)", color: "#999999" }
                      }
                    >
                      {isSaved ? "♥" : "♡"}
                    </button>
                    <button className="w-[30px] h-[30px] rounded-[7px] border border-[rgba(0,0,0,0.1)] flex items-center justify-center text-[16px] text-[#999999] touch-manipulation">
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
  );
}
