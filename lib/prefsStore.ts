import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import type { SavedStory } from "@/lib/savedStories";
import type { TrackedTopic } from "@/lib/trackedTopics";

const DIR  = join(process.cwd(), "data");
const FILE = join(DIR, "prefs.json");

type UserPrefs = { saved: SavedStory[]; tracked: TrackedTopic[] };
type Store     = Record<string, UserPrefs>;

function read(): Store {
  if (!existsSync(FILE)) return {};
  try { return JSON.parse(readFileSync(FILE, "utf8")); } catch { return {}; }
}

function write(store: Store) {
  if (!existsSync(DIR)) mkdirSync(DIR, { recursive: true });
  writeFileSync(FILE, JSON.stringify(store, null, 2), "utf8");
}

export function getPrefs(clientId: string): UserPrefs {
  return read()[clientId] ?? { saved: [], tracked: [] };
}

export function setPrefs(clientId: string, prefs: UserPrefs): void {
  const store = read();
  store[clientId] = prefs;
  write(store);
}
