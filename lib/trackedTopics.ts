export type TrackedTopic = {
  id: string;
  name: string;
  addedAt: number;
};

const KEY = "distilled-tracked-topics";

export function loadTopics(): TrackedTopic[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function persistTopics(topics: TrackedTopic[]) {
  localStorage.setItem(KEY, JSON.stringify(topics));
}
