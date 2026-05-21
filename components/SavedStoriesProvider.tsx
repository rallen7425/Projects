"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { type SavedStory, loadSaved, persistSaved } from "@/lib/savedStories";

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

export function SavedStoriesProvider({ children }: { children: React.ReactNode }) {
  const [saved, setSaved] = useState<SavedStory[]>([]);

  useEffect(() => {
    setSaved(loadSaved());
  }, []);

  const isSaved = useCallback((id: string) => saved.some((s) => s.id === id), [saved]);

  const toggle = useCallback((story: Omit<SavedStory, "savedAt">) => {
    setSaved((prev) => {
      const exists = prev.some((s) => s.id === story.id);
      const next = exists
        ? prev.filter((s) => s.id !== story.id)
        : [{ ...story, savedAt: Date.now() }, ...prev];
      persistSaved(next);
      return next;
    });
  }, []);

  return <Ctx.Provider value={{ saved, isSaved, toggle }}>{children}</Ctx.Provider>;
}

export function useSavedStories() {
  return useContext(Ctx);
}
