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
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="text-[18px] font-semibold text-[#0f1117]">Story not found</div>
        <Link href={`/v2/zones/${zoneId}`} className="text-[15px] text-[#185FA5]">← Back to zone</Link>
      </div>
    );
  }

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
                background:  isActive ? colors.pillBg  : "#f7f8fa",
                color:       isActive ? colors.pillText : "#475066",
                borderColor: isActive ? colors.pillText : "#dde1e8",
              }}
            >
              {z.label}
            </Link>
          );
        })}
      </div>

      <div className="pb-6">

        {/* Tag + time */}
        <div className="flex items-center gap-2 px-4 pt-4 mb-3">
          <span
            className="text-[12px] font-semibold tracking-wide px-2 py-[3px] rounded-[4px]"
            style={{ background: colors.pillBg, color: colors.pillText }}
          >
            {story.tag}
          </span>
          {story.isNew  && <span className="w-1.5 h-1.5 rounded-full bg-[#E24B4A] flex-shrink-0" />}
          {story.urgent && <span className="w-1.5 h-1.5 rounded-full bg-[#EF9F27] flex-shrink-0" />}
          <span className="text-[13px] text-[#7a8499]">{story.time}</span>
          <button
            onClick={() => setSaved((s) => !s)}
            className="ml-auto text-[22px] touch-manipulation"
            style={{ color: saved ? colors.tag : "#c0c5d0" }}
          >
            {saved ? "♥" : "♡"}
          </button>
        </div>

        {/* Headline */}
        <h1 className="px-4 text-[22px] font-bold text-[#0f1117] leading-snug mb-4">
          {story.headline}
        </h1>

        {/* Hero image */}
        {story.imageUrl ? (
          <img
            src={story.imageUrl}
            alt=""
            className="w-full h-[200px] object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        ) : (
          <div className="mx-4 h-[120px] rounded-[10px] mb-2" style={{ background: colors.pillBg }} />
        )}

        {/* AI Summary */}
        <div className="px-4 pt-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-semibold tracking-widest text-[#7a8499] uppercase">AI Summary</span>
            <div className="h-px flex-1 bg-[#f0f1f3]" />
          </div>
          <p className="text-[17px] text-[#1a1a1a] leading-relaxed">{story.summary}</p>
        </div>

        {/* Top Stories carousel */}
        <div className="pt-6">
          <div className="flex items-center gap-2 px-4 mb-3">
            <span className="text-[11px] font-semibold tracking-widest text-[#7a8499] uppercase">Top Stories</span>
            <div className="h-px flex-1 bg-[#f0f1f3]" />
          </div>
          <div className="flex gap-3 overflow-x-auto px-4 pb-1" style={{ scrollbarWidth: "none" }}>
            {story.sources.slice(0, 10).map((src, i) => (
              <a
                key={i}
                href={src.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 w-[190px] rounded-[12px] border border-[#ebebeb] bg-[#f5f5f5] overflow-hidden touch-manipulation active:opacity-80 flex flex-col"
              >
                {/* Card image or colored band */}
                {src.imageUrl ? (
                  <img
                    src={src.imageUrl}
                    alt=""
                    className="w-full h-[100px] object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div className="w-full h-[6px]" style={{ background: colors.pillBg }} />
                )}
                {/* Card text */}
                <div className="flex-1 flex flex-col justify-between p-3">
                  <p className="text-[13px] font-semibold text-[#111111] leading-snug line-clamp-3 mb-2">{src.title}</p>
                  <span
                    className="self-start text-[10px] font-semibold px-2 py-[2px] rounded-[4px]"
                    style={{ background: colors.pillBg, color: colors.pillText }}
                  >
                    {src.label}
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Related Articles */}
        {related.length > 0 && (
          <div className="px-4 pt-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[11px] font-semibold tracking-widest text-[#7a8499] uppercase">Related</span>
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
                    <span
                      className="flex-shrink-0 mt-0.5 px-2 py-[2px] rounded-[4px] text-[11px] font-semibold"
                      style={{ background: relZone.colors.pillBg, color: relZone.colors.pillText }}
                    >
                      {rel.tag}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-medium text-[#0f1117] leading-snug line-clamp-2">{rel.headline}</p>
                      <p className="text-[13px] text-[#7a8499] mt-0.5">{rel.time}</p>
                    </div>
                    <span className="text-[16px] text-[#7a8499] flex-shrink-0 mt-0.5">›</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
