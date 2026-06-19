import zonesJson from "@/content/zones.json";

export type StorySource = {
  label: string;
  title: string;
  sub?: string;
  url: string;
  imageUrl?: string;
};

export type Story = {
  id: string;
  tag: string;
  urgent?: boolean;
  isNew?: boolean;
  time: string;
  headline: string;
  summary: string;
  imageUrl?: string;
  sources: StorySource[];
};

export type StoryGroup = { label: string; stories: Story[] };

export type ZoneColors = {
  dark: string; mid: string; accent: string;
  pillBg: string; pillText: string; tag: string;
};

export type ZoneData = {
  label: string;
  chip: string;
  storyCount: string;
  colors: ZoneColors;
  quickLook: { label: string; value: string; sub: string }[];
  groups: StoryGroup[];
};

export const ZONE_NAV = [
  { id: "sports",  label: "Sports" },
  { id: "local",   label: "Local" },
  { id: "maine",   label: "Maine" },
  { id: "tech",    label: "Tech & AI" },
  { id: "finance", label: "Finance" },
];

export const ZONES = zonesJson as Record<string, ZoneData>;

/** Flatten all stories across all zones for cross-zone related lookup */
export function getAllStories(): { zoneId: string; story: Story }[] {
  return Object.entries(ZONES).flatMap(([zoneId, zone]) =>
    zone.groups.flatMap((g) => g.stories.map((story) => ({ zoneId, story })))
  );
}

/** Find a story by zone + story ID */
export function findStory(zoneId: string, storyId: string): Story | undefined {
  const zone = ZONES[zoneId];
  if (!zone) return undefined;
  return zone.groups.flatMap((g) => g.stories).find((s) => s.id === storyId);
}

/** Get related stories: same zone (excluding current) + cross-zone by matching tag */
export function getRelated(zoneId: string, storyId: string, limit = 3): { zoneId: string; story: Story }[] {
  const current = findStory(zoneId, storyId);
  if (!current) return [];

  const all = getAllStories().filter((s) => s.story.id !== storyId);

  const sameZone = all.filter((s) => s.zoneId === zoneId);
  const crossZone = all.filter(
    (s) => s.zoneId !== zoneId && s.story.tag === current.tag
  );

  return [...sameZone, ...crossZone].slice(0, limit);
}
