"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ZONES, ZONE_NAV } from "@/lib/v2/zoneData";
import ZoneSubNav from "@/components/v2/ZoneSubNav";
import { useSavedStories } from "@/components/SavedStoriesProvider";

export default function ZoneDetailPage() {
  const params = useParams();
  const zoneId = (params.zoneId as string) || "sports";
  const zone = ZONES[zoneId] ?? ZONES.sports;
  const { isSaved, toggle } = useSavedStories();

  const { colors } = zone;

  return (
    <div>

      <ZoneSubNav />

      {/* Quick Look strip */}
      <div className="px-4 pt-3 pb-3 border-b border-[#f0f1f3]" style={{ background: colors.pillBg }}>
        <div className="text-[12px] font-semibold tracking-widest mb-2" style={{ color: colors.pillText, opacity: 0.7 }}>QUICK LOOK</div>
        <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {zone.quickLook.map((chip, i) => (
            <div
              key={i}
              className="flex-shrink-0 min-w-[96px] rounded-[8px] px-3 py-2 bg-white/60"
            >
              <div className="text-[11px] mb-[3px] font-semibold tracking-wide" style={{ color: colors.pillText, opacity: 0.65 }}>{chip.label}</div>
              <div className="text-[16px] font-semibold leading-snug" style={{ color: colors.dark }}>{chip.value}</div>
              <div className="text-[12px] mt-[2px]" style={{ color: colors.pillText, opacity: 0.6 }}>{chip.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Stories */}
      {zone.groups.map((group) => (
        <div key={group.label}>
          <div className="px-4 pt-3 pb-1.5 text-[12px] font-semibold tracking-widest text-[#7a8499] uppercase">{group.label}</div>
          {group.stories.map((story) => {
            const saveId = `zone-${zoneId}-${story.id}`;
            return (
              <div key={story.id} className="px-4 py-3.5 border-b border-[#f5f5f5]">
                {/* Meta row: tag pill + save/track icons */}
                <div className="flex items-center gap-[7px] mb-1.5">
                  <Link
                    href={`/v2/tag/${encodeURIComponent(story.tag)}`}
                    className="text-[12px] font-semibold tracking-wide px-[7px] py-[2px] rounded-[4px] touch-manipulation"
                    style={{ background: colors.pillBg, color: colors.pillText }}
                  >
                    {story.tag}
                  </Link>
                  {story.isNew  && <span className="w-1.5 h-1.5 rounded-full bg-[#E24B4A] flex-shrink-0" />}
                  {story.urgent && <span className="w-1.5 h-1.5 rounded-full bg-[#EF9F27] flex-shrink-0" />}
                  <span className="text-[12px] text-[#7a8499] flex-1 text-right">{story.time}</span>
                  <div className="flex items-center gap-2.5 ml-1">
                    <button
                      onClick={() => toggle({ id: saveId, title: story.headline, source: story.tag, snippet: story.summary ?? "" })}
                      className="touch-manipulation"
                      aria-label={isSaved(saveId) ? "Remove from saved" : "Save"}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill={isSaved(saveId) ? "#185FA5" : "none"} stroke={isSaved(saveId) ? "#185FA5" : "#c0c5d0"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Headline */}
                <Link href={`/v2/zones/${zoneId}/story/${story.id}`} className="block mb-1.5">
                  <div className="text-[19px] font-semibold text-[#111111] leading-snug">{story.headline}</div>
                </Link>

                {/* Summary preview */}
                <div className="text-[16px] text-[#555555] leading-relaxed mb-2.5 line-clamp-3">{story.summary}</div>

                {/* Footer */}
                <Link
                  href={`/v2/zones/${zoneId}/story/${story.id}`}
                  className="text-[15px] font-medium touch-manipulation"
                  style={{ color: colors.tag }}
                >
                  Read more →
                </Link>
              </div>
            );
          })}
        </div>
      ))}

    </div>
  );
}
