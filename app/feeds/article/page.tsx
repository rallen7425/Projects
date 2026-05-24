"use client";
import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

const CAT_COLORS: Record<string, { bg: string; text: string }> = {
  All:      { bg: "#f0f1f3", text: "#475066" },
  News:     { bg: "#E6F1FB", text: "#185FA5" },
  Business: { bg: "#E1F5EE", text: "#0F6E56" },
  Tech:     { bg: "#EEEDFE", text: "#534AB7" },
  Sports:   { bg: "#EAF3DE", text: "#3B6D11" },
  Local:    { bg: "#FEF3E2", text: "#854F0B" },
};

function ArticleContent() {
  const params = useSearchParams();
  const router = useRouter();

  const title    = params.get("title") ?? "";
  const source   = params.get("source") ?? "";
  const desc     = params.get("desc") ?? "";
  const link     = params.get("link") ?? "";
  const cat      = params.get("cat") ?? "News";
  const time     = params.get("time") ?? "";
  const imageUrl = params.get("img") ?? "";

  const color = CAT_COLORS[cat] ?? CAT_COLORS.News;
  const pillLabel = cat;

  if (!title) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="text-[16px] text-[#7a8499]">Article not found</div>
        <button onClick={() => router.back()} className="text-[14px] text-[#185FA5]">← Back to feeds</button>
      </div>
    );
  }

  return (
    <div className="pb-10">
      {/* Back nav */}
      <div className="px-4 pt-4 pb-3 border-b border-[#f0f1f3]">
        <button
          onClick={() => router.back()}
          className="text-[14px] font-medium text-[#185FA5] touch-manipulation"
        >
          ← Feeds
        </button>
      </div>

      <div className="px-4 pt-4">
        {/* Category pill */}
        <span
          className="inline-block text-[11px] font-semibold px-2 py-[3px] rounded-[4px] mb-3"
          style={{ background: color.bg, color: color.text }}
        >
          {pillLabel}
        </span>

        {/* Hero image */}
        {imageUrl && (
          <img
            src={imageUrl}
            alt=""
            className="w-full h-[200px] object-cover rounded-[10px] mb-4"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        )}

        {/* Source + time */}
        <div className="text-[13px] text-[#7a8499] mb-2">
          {source}{time ? ` · ${time}` : ""}
        </div>

        {/* Headline */}
        <h1 className="text-[20px] font-bold text-[#0f1117] leading-snug mb-3">{title}</h1>

        {/* Subheadline / coverage */}
        {desc && (
          <p className="text-[15px] text-[#475066] leading-relaxed mb-6">{desc}</p>
        )}

        {/* Read full article */}
        {link && (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center py-3 rounded-[10px] bg-[#185FA5] text-white text-[15px] font-semibold touch-manipulation active:opacity-80"
          >
            Read full article →
          </a>
        )}
      </div>
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
