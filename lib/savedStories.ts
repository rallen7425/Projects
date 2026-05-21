export type SavedStory = {
  id: string;
  source: string;
  title: string;
  snippet: string;
  savedAt: number;
};

const KEY = "distilled-saved-stories";

export function loadSaved(): SavedStory[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function persistSaved(stories: SavedStory[]) {
  localStorage.setItem(KEY, JSON.stringify(stories));
}
