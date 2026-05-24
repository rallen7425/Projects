"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import ZoneSubNav from "@/components/v2/ZoneSubNav";
import { useSavedStories } from "@/components/SavedStoriesProvider";
import TrackModal, { type TrackModalState } from "@/components/v2/TrackModal";

type Article = {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  description: string;
  imageUrl: string;
  category: string;
};

function timeAgo(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  } catch { return ""; }
}

export default function TagPage() {
  const params = useParams();
  const router = useRouter();
  const { isSaved, toggle } = useSavedStories();
  const [trackModal, setTrackModal] = useState<TrackModalState>(null);

  const tag = decodeURIComponent(params.tag as string);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    fetch(`/api/rss?q=${encodeURIComponent(tag)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setArticles(data.items ?? []);
      })
      .catch(() => setError("Could not load stories. Try again."))
      .finally(() => setLoading(false));
  }, [tag]);

  function articleHref(article: Article) {
    const p = new URLSearchParams({
      title:  article.title,
      source: article.source,
      desc:   article.description,
      link:   article.link,
      cat:    tag,
      time:   timeAgo(article.pubDate),
    });
    return `/feeds/article?${p.toString()}`;
  }

  return (
    <div>
      <ZoneSubNav />

      {/* Header */}
      <div className="px-4 pt-3 pb-3 border-b border-[#f0f1f3] flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="text-[14px] font-medium text-[#185FA5] touch-manipulation flex-shrink-0"
        >
          ←
        </button>
        <div className="min-w-0">
          <div className="text-[18px] font-semibold text-[#0f1117]">#{tag}</div>
          {!loading && !error && (
            <div className="text-[13px] text-[#7a8499]">{articles.length} stories</div>
          )}
        </div>
      </div>

      {/* Loading skeletons */}
      {loading && (
        <div className="flex flex-col">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="px-4 py-4 border-b border-[#f0f1f3] animate-pulse">
              <div className="h-3 bg-[#f0f1f3] rounded w-20 mb-3" />
              <div className="h-4 bg-[#f0f1f3] rounded mb-2" />
              <div className="h-4 bg-[#f0f1f3] rounded w-4/5" />
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="m-4 p-4 rounded-[10px] bg-[#fff0f0] border border-[#E24B4A]/30 text-[13px] text-[#E24B4A]">
          {error}
        </div>
      )}

      {/* Article list */}
      {!loading && !error && (
        <div>
          {articles.map((article, idx) => {
            const saveId = `tag-${article.link}`;
            return (
              <div key={idx} className="px-4 py-4 border-b border-[#f0f1f3] last:border-0">
                {/* Source + time + actions */}
                <div className="flex items-center mb-1.5">
                  <span className="text-[12px] text-[#7a8499] flex-1">
                    {article.source}{article.pubDate ? ` · ${timeAgo(article.pubDate)}` : ""}
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggle({ id: saveId, title: article.title, source: article.source, snippet: "" })}
                      className="touch-manipulation"
                      aria-label={isSaved(saveId) ? "Remove from saved" : "Save"}
                    >
                      <svg width="17" height="17" viewBox="0 0 24 24" fill={isSaved(saveId) ? "#185FA5" : "none"} stroke={isSaved(saveId) ? "#185FA5" : "#c0c5d0"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                      </svg>
                    </button>
                    <button
                      onClick={() => setTrackModal({ step: "confirm", topic: article.title })}
                      className="touch-manipulation"
                      aria-label="Track topic"
                    >
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#c0c5d0" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Headline */}
                <Link href={articleHref(article)} className="block touch-manipulation">
                  <h3 className="text-[16px] font-semibold text-[#0f1117] leading-snug">
                    {article.title}
                  </h3>
                </Link>
              </div>
            );
          })}
          {articles.length === 0 && (
            <p className="text-center text-[14px] text-[#7a8499] mt-12">No stories found for #{tag}.</p>
          )}
        </div>
      )}

      <TrackModal
        modal={trackModal}
        onConfirm={() => setTrackModal((m) => m ? { step: "success", topic: m.topic } : null)}
        onClose={() => setTrackModal(null)}
      />
    </div>
  );
}
