"use client";
import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSavedStories } from "@/components/SavedStoriesProvider";
import TrackModal, { type TrackModalState } from "@/components/v2/TrackModal";

const CAT_COLORS: Record<string, { bg: string; text: string }> = {
  All:      { bg: "#f0f1f3", text: "#475066" },
  News:     { bg: "#E6F1FB", text: "#185FA5" },
  Business: { bg: "#E1F5EE", text: "#0F6E56" },
  Tech:     { bg: "#EEEDFE", text: "#534AB7" },
  Sports:   { bg: "#EAF3DE", text: "#3B6D11" },
  Local:    { bg: "#FEF3E2", text: "#854F0B" },
};

const CAT_TO_FEED: Record<string, string> = {
  News: "news", Business: "business", Tech: "tech", Sports: "sports", Local: "local",
};

type Article = {
  title: string; link: string; pubDate: string;
  source: string; description: string; imageUrl: string; category: string;
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

function relatedHref(article: Article): string {
  const p = new URLSearchParams({
    title: article.title, source: article.source, desc: article.description,
    link: article.link, cat: article.category, time: timeAgo(article.pubDate),
  });
  if (article.imageUrl) p.set("img", article.imageUrl);
  return `/feeds/article?${p.toString()}`;
}

function WebView({ url, source, title, onClose }: { url: string; source: string; title: string; onClose: () => void }) {
  return (
    <div
      className="fixed left-0 right-0 bg-white flex flex-col max-w-[430px] mx-auto"
      style={{ top: 96, bottom: 56, zIndex: 45 }}
    >
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-[#f0f1f3] bg-white flex-shrink-0">
        <button
          onClick={onClose}
          className="text-[14px] font-medium text-[#185FA5] touch-manipulation flex-shrink-0"
        >
          ← Back
        </button>
        <span className="text-[13px] text-[#7a8499] flex-1 truncate">{source}</span>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 touch-manipulation"
          aria-label="Open in browser"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#7a8499" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15 3 21 3 21 9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
        </a>
      </div>
      <iframe
        src={url}
        title={title}
        className="flex-1 w-full border-0"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      />
    </div>
  );
}

function ArticleContent() {
  const params = useSearchParams();
  const router = useRouter();
  const { isSaved, toggle } = useSavedStories();
  const [trackModal, setTrackModal] = useState<TrackModalState>(null);
  const [related, setRelated] = useState<Article[]>([]);
  const [relLoading, setRelLoading] = useState(true);
  const [body, setBody] = useState<string[]>([]);
  const [bodyLoading, setBodyLoading] = useState(true);
  const [bodyError, setBodyError] = useState(false);
  const [resolvedUrl, setResolvedUrl] = useState("");
  const [showWebView, setShowWebView] = useState(false);

  const title    = params.get("title") ?? "";
  const source   = params.get("source") ?? "";
  const desc     = params.get("desc") ?? "";
  const link     = params.get("link") ?? "";
  const cat      = params.get("cat") ?? "News";
  const time     = params.get("time") ?? "";
  const imageUrl = params.get("img") ?? "";

  const saveId = `article-${link || title}`;
  const color  = CAT_COLORS[cat] ?? CAT_COLORS.News;

  // Fetch article body
  useEffect(() => {
    if (!link) { setBodyLoading(false); return; }
    setBodyLoading(true);
    setBodyError(false);
    fetch(`/api/article?url=${encodeURIComponent(link)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.finalUrl) setResolvedUrl(data.finalUrl);
        if (data.paragraphs?.length) {
          setBody(data.paragraphs);
        } else {
          setBodyError(true);
        }
      })
      .catch(() => setBodyError(true))
      .finally(() => setBodyLoading(false));
  }, [link]);

  // Fetch related articles
  useEffect(() => {
    if (!title) return;
    setRelLoading(true);
    const feedKey = CAT_TO_FEED[cat];
    const url = feedKey
      ? `/api/rss?category=${feedKey}`
      : `/api/rss?q=${encodeURIComponent(cat)}`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        const items: Article[] = (data.items ?? []).filter(
          (a: Article) => a.link !== link && a.title !== title
        );
        setRelated(items.slice(0, 4));
      })
      .catch(() => setRelated([]))
      .finally(() => setRelLoading(false));
  }, [title, link, cat]);

  if (!title) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="text-[16px] text-[#7a8499]">Article not found</div>
        <button onClick={() => router.back()} className="text-[14px] text-[#185FA5]">← Back</button>
      </div>
    );
  }

  return (
    <div className="pb-10">
      {/* Back nav */}
      <div className="px-4 pt-3 pb-2.5 border-b border-[#f0f1f3]">
        <button
          onClick={() => router.back()}
          className="text-[14px] font-medium text-[#185FA5] touch-manipulation"
        >
          ← Back
        </button>
      </div>

      {/* Article body */}
      <div className="px-4 pt-4">
        {/* Category pill + save/track */}
        <div className="flex items-center gap-2 mb-3">
          <span
            className="inline-block text-[11px] font-semibold px-2 py-[3px] rounded-[4px]"
            style={{ background: color.bg, color: color.text }}
          >
            {cat}
          </span>
          <div className="flex items-center gap-3 ml-auto">
            <button
              onClick={() => toggle({ id: saveId, title, source, snippet: desc })}
              className="touch-manipulation"
              aria-label={isSaved(saveId) ? "Remove from saved" : "Save"}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill={isSaved(saveId) ? "#185FA5" : "none"} stroke={isSaved(saveId) ? "#185FA5" : "#c0c5d0"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
              </svg>
            </button>
            <button
              onClick={() => setTrackModal({ step: "confirm", topic: title })}
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
        <h1 className="text-[22px] font-bold text-[#0f1117] leading-snug mb-2">{title}</h1>

        {/* Source + time */}
        <div className="text-[13px] text-[#7a8499] mb-4">{source}{time ? ` · ${time}` : ""}</div>
      </div>

      {/* Hero image — full width */}
      {imageUrl && (
        <img
          src={imageUrl}
          alt=""
          className="w-full object-cover mb-4"
          style={{ maxHeight: 240 }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
      )}

      <div className="px-4">
        {/* Subheadline / description */}
        {desc && (
          <p className="text-[17px] font-medium text-[#2c2c2c] leading-relaxed mb-5 border-l-[3px] border-[#dde1e8] pl-3 italic">
            {desc}
          </p>
        )}

        {/* Article body */}
        {bodyLoading && (
          <div className="space-y-3 mb-6 animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div key={i}>
                <div className="h-4 bg-[#f0f1f3] rounded mb-1.5" style={{ width: i % 2 === 0 ? "100%" : "88%" }} />
                <div className="h-4 bg-[#f0f1f3] rounded" style={{ width: i % 3 === 0 ? "75%" : "92%" }} />
              </div>
            ))}
          </div>
        )}

        {!bodyLoading && body.length > 0 && (
          <div className="mb-6 space-y-4">
            {body.map((para, i) => (
              <p key={i} className="text-[16px] text-[#1a1a1a] leading-relaxed">{para}</p>
            ))}
          </div>
        )}

        {!bodyLoading && bodyError && (
          <div className="mb-5 p-3 rounded-[8px] bg-[#f7f8fa] border border-[#e8eaef]">
            <p className="text-[13px] text-[#7a8499] text-center">
              Full article content not available — tap below to read on {source || "the original site"}.
            </p>
          </div>
        )}

        {/* Open in web view */}
        {link && (
          <button
            onClick={() => setShowWebView(true)}
            className="block w-full text-center py-3 rounded-[10px] bg-[#185FA5] text-white text-[15px] font-semibold touch-manipulation active:opacity-80 mb-6"
          >
            Read on {source || "original site"} →
          </button>
        )}
      </div>

      {/* In-app web view overlay */}
      {showWebView && (
        <WebView
          url={resolvedUrl || link}
          source={source}
          title={title}
          onClose={() => setShowWebView(false)}
        />
      )}

      {/* Related section */}
      <div className="border-t border-[#f0f1f3] pt-4">
        <div className="px-4 mb-3">
          <span className="text-[11px] font-semibold tracking-widest text-[#7a8499] uppercase">Related</span>
        </div>

        {relLoading && (
          <div className="flex flex-col">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="px-4 py-3 border-b border-[#f0f1f3] animate-pulse">
                <div className="h-3 bg-[#f0f1f3] rounded w-16 mb-2.5" />
                <div className="h-4 bg-[#f0f1f3] rounded mb-1.5" />
                <div className="h-4 bg-[#f0f1f3] rounded w-3/4" />
              </div>
            ))}
          </div>
        )}

        {!relLoading && related.length === 0 && (
          <p className="px-4 text-[13px] text-[#7a8499]">No related stories found.</p>
        )}

        {!relLoading && related.map((article, idx) => {
          const relColor  = CAT_COLORS[article.category] ?? CAT_COLORS.News;
          const relSaveId = `article-rel-${article.link || article.title}`;
          return (
            <div key={idx} className="px-4 py-3 border-b border-[#f0f1f3] last:border-0">
              {/* Category pill + icons */}
              <div className="flex items-center gap-2 mb-1.5">
                <span
                  className="inline-block text-[11px] font-semibold px-2 py-[3px] rounded-[4px]"
                  style={{ background: relColor.bg, color: relColor.text }}
                >
                  {article.category}
                </span>
                <div className="flex items-center gap-3 ml-auto">
                  <button
                    onClick={() => toggle({ id: relSaveId, title: article.title, source: article.source, snippet: "" })}
                    className="touch-manipulation"
                    aria-label={isSaved(relSaveId) ? "Remove from saved" : "Save"}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill={isSaved(relSaveId) ? "#185FA5" : "none"} stroke={isSaved(relSaveId) ? "#185FA5" : "#c0c5d0"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                    </svg>
                  </button>
                  <button
                    onClick={() => setTrackModal({ step: "confirm", topic: article.title })}
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
                <Link href={relatedHref(article)} className="flex-1 min-w-0 touch-manipulation">
                  <p className="text-[15px] font-semibold text-[#0f1117] leading-snug">{article.title}</p>
                  <p className="text-[12px] text-[#7a8499] mt-0.5">{article.source}{article.pubDate ? ` · ${timeAgo(article.pubDate)}` : ""}</p>
                </Link>
                {article.imageUrl && (
                  <img
                    src={article.imageUrl}
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

      <TrackModal
        modal={trackModal}
        onConfirm={() => setTrackModal((m) => m ? { step: "success", topic: m.topic } : null)}
        onClose={() => setTrackModal(null)}
      />
    </div>
  );
}

export default function ArticlePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-[14px] text-[#7a8499]">Loading…</div>}>
      <ArticleContent />
    </Suspense>
  );
}
