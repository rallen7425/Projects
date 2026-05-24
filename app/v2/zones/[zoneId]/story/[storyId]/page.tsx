"use client";
import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ZONES, findStory, getRelated } from "@/lib/v2/zoneData";
import { useSavedStories } from "@/components/SavedStoriesProvider";
import TrackModal, { type TrackModalState } from "@/components/v2/TrackModal";

import NewsCarousel from "@/components/v2/NewsCarousel";
import ZoneSubNav from "@/components/v2/ZoneSubNav";

export default function StoryDetailPage() {
  const params = useParams();
  const zoneId = params.zoneId as string;
  const storyId = params.storyId as string;

  const router = useRouter();
  const { isSaved, toggle } = useSavedStories();
  const zone = ZONES[zoneId] ?? ZONES.sports;
  const story = findStory(zoneId, storyId);
  const related = getRelated(zoneId, storyId, 3);
  const saveId = `story-${zoneId}-${storyId}`;
  const [trackModal, setTrackModal] = useState<TrackModalState>(null);

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

      <ZoneSubNav />

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
          <Link
            href={`/v2/tag/${encodeURIComponent(story.tag)}`}
            className="text-[12px] font-semibold tracking-wide px-2 py-[3px] rounded-[4px] touch-manipulation"
            style={{ background: colors.pillBg, color: colors.pillText }}
          >
            {story.tag}
          </Link>
          {story.isNew  && <span className="w-1.5 h-1.5 rounded-full bg-[#E24B4A] flex-shrink-0" />}
          {story.urgent && <span className="w-1.5 h-1.5 rounded-full bg-[#EF9F27] flex-shrink-0" />}
          <span className="text-[13px] text-[#7a8499] flex-1">{story.time}</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => toggle({ id: saveId, title: story.headline, source: story.tag, snippet: story.summary ?? "" })}
              className="touch-manipulation"
              aria-label={isSaved(saveId) ? "Remove from saved" : "Save"}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill={isSaved(saveId) ? "#185FA5" : "none"} stroke={isSaved(saveId) ? "#185FA5" : "#c0c5d0"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
              </svg>
            </button>
            <button
              onClick={() => setTrackModal({ step: "confirm", topic: story.headline })}
              className="touch-manipulation"
              aria-label="Track topic"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c0c5d0" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
          </div>
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
          </div>
          <p className="text-[17px] text-[#1a1a1a] leading-relaxed">{story.summary}</p>
        </div>

        <NewsCarousel
          items={story.sources}
          pillBg={colors.pillBg}
          pillText={colors.pillText}
        />

        {/* Related Articles */}
        {related.length > 0 && (
          <div className="pt-6">
            <div className="flex items-center gap-2 px-4 mb-3">
              <span className="text-[11px] font-semibold tracking-widest text-[#7a8499] uppercase">Related</span>
              </div>
            <div className="border-t border-[#f0f1f3]">
              {related.map(({ zoneId: relZoneId, story: rel }) => {
                const relZone = ZONES[relZoneId];
const relSaveId = `rel-${rel.id}`;
                const relSaved = isSaved(relSaveId);
                return (
                  <div key={rel.id} className="px-4 py-3 border-b border-[#f0f1f3]">
                    {/* Category pill + icons on same row */}
                    <div className="flex items-center gap-2 mb-1.5">
                      <Link
                        href={`/v2/tag/${encodeURIComponent(rel.tag)}`}
                        className="inline-block text-[11px] font-semibold px-2 py-[3px] rounded-[4px] touch-manipulation"
                        style={{ background: relZone.colors.pillBg, color: relZone.colors.pillText }}
                      >
                        {rel.tag}
                      </Link>
                      <div className="flex items-center gap-3 ml-auto">
                        <button
                          onClick={() => toggle({ id: relSaveId, title: rel.headline, source: rel.tag, snippet: rel.summary ?? "" })}
                          className="touch-manipulation"
                          aria-label={relSaved ? "Remove from saved" : "Save"}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill={relSaved ? "#185FA5" : "none"} stroke={relSaved ? "#185FA5" : "#c0c5d0"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                          </svg>
                        </button>
                        <button
                          onClick={() => setTrackModal({ step: "confirm", topic: rel.headline })}
                          className="touch-manipulation"
                          aria-label="Track topic"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c0c5d0" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                    {/* Headline + thumbnail */}
                    <div className="flex items-start gap-3">
                      <Link
                        href={`/v2/zones/${relZoneId}/story/${rel.id}`}
                        className="flex-1 min-w-0 touch-manipulation"
                      >
                        <p className="text-[15px] font-semibold text-[#0f1117] leading-snug">{rel.headline}</p>
                        {rel.summary && (
                          <p className="text-[13px] text-[#7a8499] mt-0.5 leading-snug line-clamp-2">{rel.summary}</p>
                        )}
                      </Link>
                      {rel.imageUrl && (
                        <img
                          src={rel.imageUrl}
                          alt=""
                          className="flex-shrink-0 w-[64px] h-[64px] rounded-[8px] object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      )}
                    </div>
                  </div>
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

      <TrackModal
        modal={trackModal}
        onConfirm={() => setTrackModal((m) => m ? { step: "success", topic: m.topic } : null)}
        onClose={() => setTrackModal(null)}
      />
    </div>
  );
}
