"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useTrackedTopics } from "@/components/TrackedTopicsProvider";

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

function articleHref(article: Article, topic: string) {
  const p = new URLSearchParams({
    title: article.title, source: article.source,
    desc: article.description, link: article.link,
    cat: topic, time: timeAgo(article.pubDate),
  });
  if (article.imageUrl) p.set("img", article.imageUrl);
  return `/feeds/article?${p.toString()}`;
}

// ---------- Topic card ----------

type ConfirmState =
  | { type: "delete" }
  | { type: "edit"; draft: string }
  | null;

function TopicCard({ id, name }: { id: string; name: string }) {
  const { removeTopic, updateTopic } = useTrackedTopics();
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [editDraft, setEditDraft] = useState(name);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep editDraft in sync if name prop changes
  useEffect(() => { setEditDraft(name); }, [name]);

  useEffect(() => {
    if (confirm?.type === "edit") inputRef.current?.focus();
  }, [confirm]);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/rss?q=${encodeURIComponent(name)}`)
      .then((r) => r.json())
      .then((data) => setArticles((data.items ?? []).slice(0, 8)))
      .catch(() => setArticles([]))
      .finally(() => setLoading(false));
  }, [name]);

  // Build a brief summary from the top 3 article descriptions
  const summary = articles
    .slice(0, 3)
    .map((a) => a.description)
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="border-b border-[#f0f1f3] pb-4 pt-4">
      {/* ── Topic header row ── */}
      <div className="px-4">
        {confirm?.type === "delete" ? (
          /* Delete confirmation */
          <div className="flex items-center gap-3 py-1">
            <span className="flex-1 text-[15px] text-[#E24B4A] font-medium">Remove #{name}?</span>
            <button
              onClick={() => removeTopic(id)}
              className="text-[13px] font-semibold text-white bg-[#E24B4A] px-3 py-1.5 rounded-[6px] touch-manipulation"
            >
              Remove
            </button>
            <button
              onClick={() => setConfirm(null)}
              className="text-[13px] font-medium text-[#7a8499] touch-manipulation"
            >
              Cancel
            </button>
          </div>
        ) : confirm?.type === "edit" ? (
          /* Edit mode */
          <div className="flex items-center gap-2 py-1">
            <span className="text-[17px] font-semibold text-[#7a8499]">#</span>
            <input
              ref={inputRef}
              value={editDraft}
              onChange={(e) => setEditDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
                if (e.key === "Escape") setConfirm(null);
              }}
              className="flex-1 text-[17px] font-semibold text-[#0f1117] bg-[#f7f8fa] border border-[#185FA5] rounded-[6px] px-2 py-0.5 outline-none"
            />
            <button
              onClick={handleSave}
              disabled={!editDraft.trim() || editDraft.trim() === name}
              className="text-[13px] font-semibold text-white bg-[#185FA5] px-3 py-1.5 rounded-[6px] touch-manipulation disabled:opacity-40"
            >
              Save
            </button>
            <button
              onClick={() => { setEditDraft(name); setConfirm(null); }}
              className="text-[13px] font-medium text-[#7a8499] touch-manipulation"
            >
              Cancel
            </button>
          </div>
        ) : (
          /* Normal view */
          <div className="flex items-center gap-2">
            <span className="text-[17px] font-semibold text-[#0f1117] flex-1">#{name}</span>
            {/* Pencil */}
            <button
              onClick={() => setConfirm({ type: "edit", draft: name })}
              className="w-7 h-7 flex items-center justify-center rounded-[6px] touch-manipulation active:bg-[#f0f1f3]"
              aria-label="Edit topic"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7a8499" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            {/* Delete */}
            <button
              onClick={() => setConfirm({ type: "delete" })}
              className="w-7 h-7 flex items-center justify-center rounded-[6px] touch-manipulation active:bg-[#f0f1f3]"
              aria-label="Remove topic"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#c0c5d0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        )}

        {/* AI summary */}
        {!confirm && (
          <div className="mt-2 mb-1">
            {loading ? (
              <div className="h-3 bg-[#f0f1f3] rounded animate-pulse w-4/5 mb-1.5" />
            ) : summary ? (
              <p className="text-[13px] text-[#7a8499] leading-snug line-clamp-2">{summary}</p>
            ) : (
              <p className="text-[13px] text-[#c0c5d0] italic">No recent stories found.</p>
            )}
            {!loading && summary && (
              <div className="flex items-center gap-1 mt-1">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#b0b8c8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
                </svg>
                <span className="text-[11px] text-[#b0b8c8]">AI summary · based on latest headlines</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Article carousel */}
      {!confirm && (
        <div className="mt-3">
          {loading ? (
            <div className="flex gap-3 px-4 overflow-hidden">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex-shrink-0 w-[72vw] h-[88px] bg-[#f0f1f3] rounded-[10px] animate-pulse" />
              ))}
            </div>
          ) : articles.length === 0 ? null : (
            <div className="flex gap-3 overflow-x-auto px-4 pb-1" style={{ scrollbarWidth: "none" }}>
              {articles.map((article, i) => (
                <Link
                  key={i}
                  href={articleHref(article, name)}
                  className="flex-shrink-0 w-[72vw] rounded-[10px] border border-[#e8eaef] bg-white p-3 flex gap-3 touch-manipulation active:opacity-70"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-[#0f1117] leading-snug line-clamp-3 mb-1.5">
                      {article.title}
                    </p>
                    <p className="text-[11px] text-[#7a8499]">
                      {article.source}{article.pubDate ? ` · ${timeAgo(article.pubDate)}` : ""}
                    </p>
                  </div>
                  {article.imageUrl && (
                    <img
                      src={article.imageUrl}
                      alt=""
                      className="flex-shrink-0 w-[60px] h-[60px] rounded-[7px] object-cover self-start"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  function handleSave() {
    const trimmed = editDraft.trim();
    if (!trimmed || trimmed === name) { setConfirm(null); return; }
    updateTopic(id, trimmed);
    setConfirm(null);
  }
}

// ---------- Add topic bar ----------

function AddTopicBar() {
  const { addTopic } = useTrackedTopics();
  const [value, setValue] = useState("");

  function handleAdd() {
    const trimmed = value.trim();
    if (!trimmed) return;
    addTopic(trimmed);
    setValue("");
  }

  return (
    <div className="px-4 py-3 border-t border-[#f0f1f3] bg-white flex-shrink-0">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Track a new topic, person, or event…"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
          className="flex-1 bg-[#f7f8fa] border border-[#dde1e8] rounded-[8px] px-3 py-2 text-[14px] text-[#0f1117] placeholder-[#b0b8c8] outline-none focus:border-[#185FA5]"
        />
        <button
          onClick={handleAdd}
          disabled={!value.trim()}
          className="px-3 py-2 rounded-[8px] text-[14px] font-semibold touch-manipulation disabled:opacity-40"
          style={{ background: "#185FA5", color: "#fff" }}
        >
          + Track
        </button>
      </div>
    </div>
  );
}

// ---------- Page ----------

export default function TrackingPage() {
  const { topics } = useTrackedTopics();

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="px-4 pt-3 pb-2.5 border-b border-[#f0f1f3]">
        <div className="text-[20px] font-semibold text-[#0f1117]">Tracking</div>
        {topics.length > 0 && (
          <div className="text-[13px] text-[#7a8499] mt-0.5">
            {topics.length} {topics.length === 1 ? "topic" : "topics"}
          </div>
        )}
      </div>

      {/* Topic list */}
      {topics.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center px-8 py-16 text-center">
          <div className="w-12 h-12 rounded-full bg-[#f0f1f3] flex items-center justify-center mb-4">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c0c5d0" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
            </svg>
          </div>
          <div className="text-[16px] font-semibold text-[#0f1117] mb-1">No topics yet</div>
          <div className="text-[14px] text-[#7a8499] leading-snug">
            Add a topic below — Distilled will surface the latest stories and a summary for each one.
          </div>
        </div>
      ) : (
        <div className="flex-1">
          {topics.map((topic) => (
            <TopicCard key={topic.id} id={topic.id} name={topic.name} />
          ))}
        </div>
      )}

      {/* Add topic bar pinned at bottom of content */}
      <AddTopicBar />
    </div>
  );
}
