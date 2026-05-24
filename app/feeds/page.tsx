"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
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

const CATEGORIES = ["All", "News", "Business", "Tech", "Sports", "Local"];

const CAT_COLORS: Record<string, { bg: string; text: string }> = {
  All:      { bg: "#f0f1f3", text: "#475066" },
  News:     { bg: "#E6F1FB", text: "#185FA5" },
  Business: { bg: "#E1F5EE", text: "#0F6E56" },
  Tech:     { bg: "#EEEDFE", text: "#534AB7" },
  Sports:   { bg: "#EAF3DE", text: "#3B6D11" },
  Local:    { bg: "#FEF3E2", text: "#854F0B" },
};

function timeAgo(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    const diff = (Date.now() - date.getTime()) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  } catch {
    return "";
  }
}

function articleHref(article: Article, category: string): string {
  const p = new URLSearchParams({
    title:  article.title,
    source: article.source,
    desc:   article.description,
    link:   article.link,
    cat:    category,
    time:   timeAgo(article.pubDate),
  });
  if (article.imageUrl) p.set("img", article.imageUrl);
  return `/feeds/article?${p.toString()}`;
}

function FeedsContent() {
  const searchParams = useSearchParams();
  const initial = searchParams.get("category") ?? "All";
  const [category, setCategory] = useState(CATEGORIES.includes(initial) ? initial : "All");
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    fetch(`/api/rss?category=${category.toLowerCase()}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setArticles(data.items ?? []);
      })
      .catch(() => setError("Could not load feed. Try again."))
      .finally(() => setLoading(false));
  }, [category]);

  const chipColor = CAT_COLORS[category] ?? CAT_COLORS.News;
  const { isSaved, toggle } = useSavedStories();
  const [trackModal, setTrackModal] = useState<TrackModalState>(null);

  return (
    <div className="pb-4">
      {/* Category chips */}
      <div className="bg-white border-b border-[#dde1e8] px-3 py-2 flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className="flex-shrink-0 text-[13px] font-medium px-3 py-1.5 rounded-full border touch-manipulation"
            style={{
              background:  category === cat ? chipColor.text : "#f7f8fa",
              color:       category === cat ? "#fff" : "#475066",
              borderColor: category === cat ? chipColor.text : "#dde1e8",
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Loading skeletons */}
      {loading && (
        <div className="flex flex-col">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="px-4 py-4 border-b border-[#f0f1f3] animate-pulse">
              <div className="h-4 bg-[#f0f1f3] rounded w-16 mb-3" />
              <div className="h-4 bg-[#f0f1f3] rounded w-28 mb-2" />
              <div className="h-5 bg-[#f0f1f3] rounded mb-1.5" />
              <div className="h-5 bg-[#f0f1f3] rounded w-4/5 mb-1.5" />
              <div className="h-4 bg-[#f0f1f3] rounded w-2/3" />
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
      {!loading && !error && articles.length > 0 && (
        <div>
          {articles.map((article, idx) => {
            const href = articleHref(article, category);
            const artColor = CAT_COLORS[article.category] ?? CAT_COLORS.News;
            const saveId = `feed-${article.link}`;
            const saved = isSaved(saveId);
            return (
              <div key={idx} className="px-4 py-4 border-b border-[#f0f1f3] last:border-0">
                {/* Category pill — links to filtered feed */}
                <Link
                  href={`/feeds?category=${article.category}`}
                  className="inline-block text-[11px] font-semibold px-2 py-[3px] rounded-[4px] mb-2 touch-manipulation"
                  style={{ background: artColor.bg, color: artColor.text }}
                >
                  {article.category}
                </Link>

                {/* Hero image */}
                {article.imageUrl && (
                  <img
                    src={article.imageUrl}
                    alt=""
                    className="w-full h-[180px] object-cover rounded-[10px] mb-3"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                )}

                {/* Source + time + actions */}
                <div className="flex items-center mb-1.5">
                  <span className="text-[12px] text-[#7a8499] flex-1">{article.source} · {timeAgo(article.pubDate)}</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggle({ id: saveId, title: article.title, source: article.source, snippet: article.description ?? "" })}
                      className="touch-manipulation"
                      aria-label={saved ? "Remove from saved" : "Save"}
                    >
                      <svg width="17" height="17" viewBox="0 0 24 24" fill={saved ? "#185FA5" : "none"} stroke={saved ? "#185FA5" : "#c0c5d0"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

                {/* Headline + subheadline */}
                <Link href={href} className="block touch-manipulation">
                  <h3 className="text-[16px] font-semibold text-[#0f1117] leading-snug mb-1">
                    {article.title}
                  </h3>
                  {article.description && (
                    <p className="text-[13px] text-[#475066] leading-snug line-clamp-2">
                      {article.description}
                    </p>
                  )}
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {!loading && !error && articles.length === 0 && (
        <p className="text-center text-[14px] text-[#7a8499] mt-12">No articles found.</p>
      )}

      <TrackModal
        modal={trackModal}
        onConfirm={() => setTrackModal((m) => m ? { step: "success", topic: m.topic } : null)}
        onClose={() => setTrackModal(null)}
      />
    </div>
  );
}

export default function FeedsPage() {
  return (
    <Suspense fallback={<div />}>
      <FeedsContent />
    </Suspense>
  );
}
