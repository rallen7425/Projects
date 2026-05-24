"use client";
import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ZONES, findStory, getRelated } from "@/lib/v2/zoneData";

export default function StoryDetailPage() {
  const params = useParams();
  const zoneId = params.zoneId as string;
  const storyId = params.storyId as string;

  const router = useRouter();
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

      {/* Back navigation */}
      <div className="px-4 pt-3 pb-2 border-b border-[#f0f1f3]">
        <button
          onClick={() => router.back()}
          className="text-[14px] font-medium text-[#185FA5] touch-manipulation"
        >
          ← Back
        </button>
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
        {story.imageUrl && (
          <img
            src={story.imageUrl}
            alt=""
            className="w-full h-[200px] object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        )}

        {/* AI Summary */}
        <div className="px-4 pt-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-semibold tracking-widest text-[#7a8499] uppercase">AI Summary</span>
            <div className="h-px flex-1 bg-[#f0f1f3]" />
          </div>
          <p className="text-[17px] text-[#1a1a1a] leading-relaxed">{story.summary}</p>
        </div>

        {/* Read More carousel */}
        <div className="pt-6">
          <div className="flex items-center gap-2 px-4 mb-3">
            <span className="text-[11px] font-semibold tracking-widest text-[#7a8499] uppercase">Read More</span>
            <div className="h-px flex-1 bg-[#f0f1f3]" />
          </div>
          <div className="flex gap-3 overflow-x-auto px-4 pb-1" style={{ scrollbarWidth: "none" }}>
            {story.sources.slice(0, 10).map((src, i) => (
              <a
                key={i}
                href={src.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 w-[260px] rounded-[12px] border border-[#e0e0e0] bg-white overflow-hidden flex flex-col touch-manipulation active:opacity-80"
              >
                {src.imageUrl && (
                  <img
                    src={src.imageUrl}
                    alt=""
                    className="w-full h-[130px] object-cover flex-shrink-0"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                )}
                <div className="p-3 flex flex-col flex-1 justify-between">
                  <div>
                    <p className="text-[13px] font-semibold text-[#111111] leading-snug line-clamp-2 mb-1">{src.title}</p>
                    {src.sub && <p className="text-[12px] text-[#555555] leading-snug line-clamp-2">{src.sub}</p>}
                  </div>
                  <span
                    className="mt-2 self-start text-[10px] font-semibold px-2 py-[2px] rounded-[4px]"
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
          <div className="pt-6">
            <div className="flex items-center gap-2 px-4 mb-3">
              <span className="text-[11px] font-semibold tracking-widest text-[#7a8499] uppercase">Related</span>
              <div className="h-px flex-1 bg-[#f0f1f3]" />
            </div>
            <div className="border-t border-[#f0f1f3]">
              {related.map(({ zoneId: relZoneId, story: rel }) => {
                const relZone = ZONES[relZoneId];
                return (
                  <Link
                    key={rel.id}
                    href={`/v2/zones/${relZoneId}/story/${rel.id}`}
                    className="block px-4 py-3 border-b border-[#f0f1f3] touch-manipulation active:bg-[#f7f8fa]"
                  >
                    <span
                      className="inline-block text-[11px] font-semibold px-2 py-[3px] rounded-[4px] mb-1.5"
                      style={{ background: relZone.colors.pillBg, color: relZone.colors.pillText }}
                    >
                      {rel.tag}
                    </span>
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-[15px] font-semibold text-[#0f1117] leading-snug">{rel.headline}</p>
                        {rel.summary && (
                          <p className="text-[13px] text-[#7a8499] mt-0.5 leading-snug line-clamp-2">{rel.summary}</p>
                        )}
                      </div>
                      {rel.imageUrl && (
                        <img
                          src={rel.imageUrl}
                          alt=""
                          className="flex-shrink-0 w-[64px] h-[64px] rounded-[8px] object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
            <div className="px-4 pt-2 pb-2 flex justify-end">
              <Link
                href={`/v2/zones/${zoneId}`}
                className="text-[14px] font-medium text-[#185FA5] touch-manipulation"
              >
                View more →
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
