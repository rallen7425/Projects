"use client";
import { useState, useEffect } from "react";


type Article = {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  description: string;
  imageUrl: string;
};

const CATEGORIES = ["All", "Business", "Tech", "Sports", "Local"];

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

export default function FeedsPage() {
  const [category, setCategory] = useState("All");
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
      .catch((e) => setError("Could not load feed. Try again."))
      .finally(() => setLoading(false));
  }, [category]);

  const hero = articles[0];
  const rest = articles.slice(1);

  return (
    <div className="pb-4">
      {/* Category chips */}
      <div className="sticky top-0 bg-white z-10 border-b border-[#dde1e8] px-3 py-2 flex gap-2 overflow-x-auto scrollbar-hide">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className="flex-shrink-0 text-[13px] font-medium px-3 py-1.5 rounded-full border touch-manipulation transition-colors"
            style={{
              background: category === cat ? "#2d59a6" : "#f7f8fa",
              color: category === cat ? "#fff" : "#475066",
              borderColor: category === cat ? "#2d59a6" : "#dde1e8",
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex flex-col gap-3 p-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-[#f7f8fa] rounded mb-2 w-1/3" />
              <div className="h-5 bg-[#f7f8fa] rounded mb-1" />
              <div className="h-5 bg-[#f7f8fa] rounded w-3/4" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="m-4 p-4 rounded-card bg-[#fff0f0] border border-[#E24B4A]/30 text-[13px] text-[#E24B4A]">
          {error}
        </div>
      )}

      {!loading && !error && articles.length > 0 && (
        <div>
          {/* Hero article */}
          {hero && (
            <a
              href={hero.link}
              target="_blank"
              rel="noopener noreferrer"
              className="block mx-3 mt-3 rounded-card bg-[#f7f8fa] border border-[#dde1e8] touch-manipulation overflow-hidden"
            >
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[11px] font-semibold text-[#2d59a6] uppercase tracking-wide">{hero.source}</span>
                  <span className="text-[#dde1e8]">·</span>
                  <span className="text-[11px] text-[#7a8499]">{timeAgo(hero.pubDate)}</span>
                </div>
                <h2 className="text-[16px] font-semibold text-[#0f1117] leading-snug">{hero.title}</h2>
                {hero.description && (
                  <p className="text-[13px] text-[#475066] mt-1.5 leading-relaxed">
                    {hero.description}
                  </p>
                )}
                <span className="inline-block mt-2 text-[12px] font-medium text-[#2d59a6]">Read more →</span>
              </div>
            </a>
          )}

          {/* Article list */}
          <div className="mt-2 mx-3 rounded-card border border-[#dde1e8] overflow-hidden bg-white">
            {rest.map((article, idx) => (
              <a
                key={idx}
                href={article.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex gap-3 px-4 py-3 border-b border-[#dde1e8] last:border-b-0 touch-manipulation active:bg-[#f7f8fa]"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[10px] font-semibold text-[#2d59a6] uppercase tracking-wide truncate max-w-[140px]">
                      {article.source}
                    </span>
                    <span className="text-[#dde1e8] flex-shrink-0">·</span>
                    <span className="text-[10px] text-[#7a8499] flex-shrink-0">{timeAgo(article.pubDate)}</span>
                  </div>
                  <p className="text-[13px] font-medium text-[#0f1117] leading-snug line-clamp-2">
                    {article.title}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {!loading && !error && articles.length === 0 && (
        <p className="text-center text-[14px] text-[#7a8499] mt-12">No articles found.</p>
      )}
    </div>
  );
}
