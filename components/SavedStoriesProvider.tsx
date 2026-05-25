"use client";
import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { type SavedStory, loadSaved, persistSaved } from "@/lib/savedStories";
import { getClientId } from "@/lib/clientId";

type SavedCtx = {
  saved: SavedStory[];
  isSaved: (id: string) => boolean;
  toggle: (story: Omit<SavedStory, "savedAt">) => void;
};

const Ctx = createContext<SavedCtx>({
  saved: [],
  isSaved: () => false,
  toggle: () => {},
});

async function fetchServerSaved(clientId: string): Promise<SavedStory[]> {
  try {
    const res = await fetch(`/api/prefs?clientId=${encodeURIComponent(clientId)}`);
    const data = await res.json();
    return data.saved ?? [];
  } catch { return []; }
}

async function pushToServer(clientId: string, saved: SavedStory[], tracked: unknown[]) {
  try {
    await fetch(`/api/prefs?clientId=${encodeURIComponent(clientId)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ saved, tracked }),
    });
  } catch { /* non-critical — localStorage is source of truth */ }
}

export function SavedStoriesProvider({ children }: { children: React.ReactNode }) {
  const [saved, setSaved] = useState<SavedStory[]>([]);
  const clientIdRef = useRef("");

  useEffect(() => {
    const clientId = getClientId();
    clientIdRef.current = clientId;
    const local = loadSaved();

    // Load local immediately, then merge with server
    setSaved(local);
    fetchServerSaved(clientId).then((serverSaved) => {
      if (!serverSaved.length) return;
      // Merge: union by id, prefer whichever has the most recent savedAt
      const merged = [...local];
      for (const s of serverSaved) {
        const existing = merged.findIndex((m) => m.id === s.id);
        if (existing === -1) merged.push(s);
        else if (s.savedAt > merged[existing].savedAt) merged[existing] = s;
      }
      merged.sort((a, b) => b.savedAt - a.savedAt);
      setSaved(merged);
      persistSaved(merged);
    });
  }, []);

  const isSaved = useCallback((id: string) => saved.some((s) => s.id === id), [saved]);

  const toggle = useCallback((story: Omit<SavedStory, "savedAt">) => {
    setSaved((prev) => {
      const exists = prev.some((s) => s.id === story.id);
      const next = exists
        ? prev.filter((s) => s.id !== story.id)
        : [{ ...story, savedAt: Date.now() }, ...prev];
      persistSaved(next);
      // Sync to server (fire-and-forget; tracked list synced by TrackedTopicsProvider)
      fetch(`/api/prefs?clientId=${encodeURIComponent(clientIdRef.current)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          saved: next,
          tracked: JSON.parse(localStorage.getItem("distilled-tracked-topics") ?? "[]"),
        }),
      }).catch(() => {});
      return next;
    });
  }, []);

  return <Ctx.Provider value={{ saved, isSaved, toggle }}>{children}</Ctx.Provider>;
}

export function useSavedStories() {
  return useContext(Ctx);
}
