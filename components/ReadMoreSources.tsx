"use client";
import { useSavedStories } from "@/components/SavedStoriesProvider";

export type Source = {
  id: string;
  source: string;
  title: string;
  snippet: string;
};

export default function ReadMoreSources({ sources }: { sources: Source[] }) {
  const { isSaved, toggle } = useSavedStories();

  return (
    <div className="space-y-5">
      {sources.map((src) => {
        const saved = isSaved(src.id);
        return (
          <div key={src.id}>
            <div className="flex items-center justify-between mb-1">
              <p className="text-[11px] font-bold text-[#7a8499] uppercase tracking-wide">
                {src.source}
              </p>
              <button
                onClick={() => toggle({ id: src.id, source: src.source, title: src.title, snippet: src.snippet })}
                className="touch-manipulation p-0.5 -mr-0.5"
                aria-label={saved ? "Remove from saved" : "Save for later"}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill={saved ? "#2d59a6" : "none"}
                  stroke="#2d59a6"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
              </button>
            </div>
            <p className="text-[15px] font-bold text-[#0f1117] leading-snug mb-1">{src.title}</p>
            <p className="text-[13px] text-[#475066] leading-relaxed">{src.snippet}</p>
          </div>
        );
      })}
    </div>
  );
}
