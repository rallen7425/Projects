"use client";
import { useState } from "react";
import Link from "next/link";

type TrackedTopic = {
  id: string;
  emoji: string;
  name: string;
  update: string;
  time: string;
  hasNew: boolean;
  zone: string;
  zoneBg: string;
  zoneColor: string;
  paused?: boolean;
  resumeDate?: string;
};

const INITIAL_ACTIVE: TrackedTopic[] = [
  { id: "aj-brown",   emoji: "🏈", name: "AJ Brown trade",     update: "Expected June 1 — cap math confirmed",     time: "2h", hasNew: true,  zone: "Sports",  zoneBg: "#EAF3DE", zoneColor: "#3B6D11" },
  { id: "gemini",     emoji: "🤖", name: "Gemini / Google AI",  update: "Gemini 3.5 Flash announced at I/O",        time: "5h", hasNew: true,  zone: "Tech",    zoneBg: "#EEEDFE", zoneColor: "#534AB7" },
  { id: "maine",      emoji: "🏠", name: "Maine weather",       update: "No changes to weekend forecast",           time: "1h", hasNew: false, zone: "Maine",   zoneBg: "#FAEEDA", zoneColor: "#854F0B" },
  { id: "patriots",   emoji: "🏟", name: "Patriots offseason",  update: "OTAs begin May 27, camp roster set",       time: "3h", hasNew: false, zone: "Sports",  zoneBg: "#EAF3DE", zoneColor: "#3B6D11" },
  { id: "fed",        emoji: "📈", name: "Fed rate decisions",  update: "Next meeting June 11 — hold expected",     time: "6h", hasNew: false, zone: "Finance", zoneBg: "#E1F5EE", zoneColor: "#0F6E56" },
];

const INITIAL_PAUSED: TrackedTopic[] = [
  { id: "memorial",   emoji: "✈️", name: "Memorial Day travel", update: "Traffic and travel outlook for May 24–26", time: "1d", hasNew: false, zone: "Local",   zoneBg: "#E6F1FB", zoneColor: "#185FA5", paused: true, resumeDate: "Resumes May 23" },
];

export default function TrackingPage() {
  const [active, setActive] = useState<TrackedTopic[]>(INITIAL_ACTIVE);
  const [paused, setPaused] = useState<TrackedTopic[]>(INITIAL_PAUSED);
  const [search, setSearch] = useState("");
  const [addValue, setAddValue] = useState("");

  function removeActive(id: string) {
    setActive((prev) => prev.filter((t) => t.id !== id));
  }

  function removePaused(id: string) {
    setPaused((prev) => prev.filter((t) => t.id !== id));
  }

  function resumeTopic(id: string) {
    const topic = paused.find((t) => t.id === id);
    if (!topic) return;
    const resumed = { ...topic, paused: false, resumeDate: undefined };
    setPaused((prev) => prev.filter((t) => t.id !== id));
    setActive((prev) => [...prev, resumed]);
  }

  const filteredActive = active.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );
  const filteredPaused = paused.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>

        {/* Page title row */}
        <div className="px-4 pt-3 pb-2 border-b border-[#f0f1f3] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="text-[20px] font-semibold text-[#0f1117]">Tracking</div>
            <button
              className="flex items-center justify-center text-[#185FA5] bg-[#E6F1FB] w-6 h-6 rounded-[4px] touch-manipulation"
              aria-label="Manage tracking"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
          </div>
          <button className="flex items-center gap-1 text-[14px] font-medium bg-[#E6F1FB] text-[#185FA5] px-3 py-1.5 rounded-[6px] touch-manipulation active:bg-[#d0e5f7]">
            <span className="text-[18px] leading-none">+</span>
            Add topic
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-2.5 border-b border-[#f0f1f3] bg-white">
          <div className="flex items-center gap-2 bg-[#f7f8fa] border border-[#dde1e8] rounded-[8px] px-3 py-2">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#7a8499" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Search topics..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-[15px] text-[#0f1117] placeholder-[#7a8499] outline-none"
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-[#7a8499] text-[18px] leading-none touch-manipulation">×</button>
            )}
          </div>
        </div>

          {/* Active topics */}
          <div className="px-4 pt-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[12px] font-semibold tracking-widest text-[#7a8499] uppercase">Active</span>
              <span className="text-[12px] font-semibold text-[#7a8499]">· {filteredActive.length} {filteredActive.length === 1 ? "topic" : "topics"}</span>
            </div>
            <div className="rounded-[10px] border border-[#dde1e8] overflow-hidden bg-white">
              {filteredActive.length === 0 && (
                <div className="px-4 py-4 text-[15px] text-[#7a8499] text-center">No active topics</div>
              )}
              {filteredActive.map((topic, i) => (
                <div
                  key={topic.id}
                  className="flex items-center gap-3 px-3 py-3 border-b border-[#f0f1f3] last:border-0"
                >
                  {/* Drag handle */}
                  <span className="text-[#c0c5d0] text-[18px] leading-none flex-shrink-0 cursor-grab">⠿</span>

                  {/* Emoji icon */}
                  <div className="w-9 h-9 rounded-[8px] bg-[#f7f8fa] flex items-center justify-center text-[20px] flex-shrink-0">{topic.emoji}</div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[15px] font-semibold text-[#0f1117] truncate">{topic.name}</span>
                      {topic.hasNew && <span className="w-1.5 h-1.5 rounded-full bg-[#185FA5] flex-shrink-0" />}
                    </div>
                    <div className="text-[13px] text-[#7a8499] line-clamp-1">{topic.update}</div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-[4px]" style={{ background: topic.zoneBg, color: topic.zoneColor }}>{topic.zone}</span>
                      <span className="text-[12px] text-[#7a8499]">{topic.time}</span>
                    </div>
                  </div>

                  {/* Delete */}
                  <button
                    onClick={() => removeActive(topic.id)}
                    className="w-6 h-6 flex items-center justify-center text-[#c0c5d0] text-[20px] leading-none touch-manipulation active:text-[#E24B4A] flex-shrink-0"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Paused topics */}
          {(filteredPaused.length > 0 || !search) && (
            <div className="px-4 pt-4 pb-2">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[12px] font-semibold tracking-widest text-[#7a8499] uppercase">Paused</span>
                <span className="text-[12px] font-semibold text-[#7a8499]">· {filteredPaused.length} {filteredPaused.length === 1 ? "topic" : "topics"}</span>
              </div>
              <div className="rounded-[10px] border border-[#dde1e8] overflow-hidden bg-white">
                {filteredPaused.length === 0 && (
                  <div className="px-4 py-4 text-[15px] text-[#7a8499] text-center">No paused topics</div>
                )}
                {filteredPaused.map((topic) => (
                  <div
                    key={topic.id}
                    className="flex items-center gap-3 px-3 py-3 border-b border-[#f0f1f3] last:border-0"
                    style={{ opacity: 0.5 }}
                  >
                    <span className="text-[#c0c5d0] text-[18px] leading-none flex-shrink-0">⠿</span>
                    <div className="w-9 h-9 rounded-[8px] bg-[#f7f8fa] flex items-center justify-center text-[20px] flex-shrink-0">{topic.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[15px] font-semibold text-[#0f1117] truncate mb-0.5">{topic.name}</div>
                      <div className="text-[13px] text-[#7a8499] line-clamp-1">{topic.update}</div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-[4px]" style={{ background: topic.zoneBg, color: topic.zoneColor }}>{topic.zone}</span>
                        {topic.resumeDate && <span className="text-[12px] text-[#7a8499]">{topic.resumeDate}</span>}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => resumeTopic(topic.id)}
                        className="text-[12px] font-medium text-[#185FA5] bg-[#E6F1FB] px-2 py-1 rounded-[5px] touch-manipulation"
                        style={{ opacity: 1 }}
                      >
                        Resume
                      </button>
                      <button
                        onClick={() => removePaused(topic.id)}
                        className="w-6 h-6 flex items-center justify-center text-[#c0c5d0] text-[20px] leading-none touch-manipulation"
                        style={{ opacity: 1 }}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* Add new topic */}
        <div className="px-4 pt-3 pb-6">
            <div className="text-[12px] font-semibold tracking-widest text-[#7a8499] uppercase mb-2">Track a new topic</div>
            <div className="rounded-[10px] border border-dashed border-[#c0c5d0] bg-[#f7f8fa] p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter a topic, person, or event…"
                  value={addValue}
                  onChange={(e) => setAddValue(e.target.value)}
                  className="flex-1 bg-white border border-[#dde1e8] rounded-[7px] px-3 py-2 text-[15px] text-[#0f1117] placeholder-[#7a8499] outline-none focus:border-[#185FA5]"
                />
                <button
                  className="px-3 py-2 rounded-[7px] text-[15px] font-medium touch-manipulation"
                  style={{
                    background: addValue.trim() ? "#185FA5" : "#dde1e8",
                    color: addValue.trim() ? "#fff" : "#7a8499",
                  }}
                  disabled={!addValue.trim()}
                >
                  Track
                </button>
              </div>
              <div className="mt-2.5 text-[13px] text-[#7a8499] leading-snug">
                Distilled will monitor this topic and surface updates in your daily briefing.
              </div>
            </div>
          </div>

    </div>
  );
}
