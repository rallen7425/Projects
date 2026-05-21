"use client";
import { useSavedStories } from "@/components/SavedStoriesProvider";

function timeAgo(ts: number): string {
  const diff = (Date.now() - ts) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function SavedPage() {
  const { saved, toggle } = useSavedStories();

  return (
    <div className="px-3 pt-4">
      {/* Search bar */}
      <div className="flex items-center gap-2 bg-[#f7f8fa] border border-[#dde1e8] rounded-card px-3 py-2.5 mb-3">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7a8499" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <span className="text-[14px] text-[#7a8499]">Search saved articles…</span>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-4">
        {["All", "Briefings", "Feeds", "Starred"].map((f, i) => (
          <span
            key={f}
            className="flex-shrink-0 text-[12px] font-medium px-3 py-1.5 rounded-full border touch-manipulation"
            style={{
              background: i === 0 ? "#2d59a6" : "#f7f8fa",
              color: i === 0 ? "#fff" : "#475066",
              borderColor: i === 0 ? "#2d59a6" : "#dde1e8",
            }}
          >
            {f}
          </span>
        ))}
      </div>

      {saved.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="w-14 h-14 rounded-full bg-[#f7f8fa] border border-[#dde1e8] flex items-center justify-center mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7a8499" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <p className="text-[15px] font-semibold text-[#0f1117] mb-1">Nothing saved yet</p>
          <p className="text-[13px] text-[#7a8499] leading-relaxed">
            Tap the bookmark icon on any article to save it here.
          </p>
        </div>
      ) : (
        /* Saved articles list */
        <div className="rounded-card border border-[#dde1e8] overflow-hidden bg-white">
          {saved.map((story) => (
            <div
              key={story.id}
              className="flex items-start gap-3 px-4 py-3 border-b border-[#dde1e8] last:border-b-0"
            >
              {/* Placeholder thumbnail */}
              <div className="flex-shrink-0 w-14 h-14 rounded-[8px] bg-[#f7f8fa] border border-[#dde1e8]" />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[10px] font-bold text-[#2d59a6] uppercase tracking-wide">
                    {story.source}
                  </span>
                  <span className="text-[#dde1e8]">·</span>
                  <span className="text-[10px] text-[#7a8499]">{timeAgo(story.savedAt)}</span>
                </div>
                <p className="text-[13px] font-semibold text-[#0f1117] leading-snug line-clamp-2">
                  {story.title}
                </p>
              </div>

              {/* Filled bookmark — tap to unsave */}
              <button
                onClick={() => toggle(story)}
                className="flex-shrink-0 pt-0.5 touch-manipulation"
                aria-label="Remove from saved"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#2d59a6" stroke="#2d59a6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
