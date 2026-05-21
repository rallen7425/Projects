export type BriefingLink = {
  text: string;
  url: string;
};

export type BriefingItem = {
  title: string;
  tags: string[];
  body: string;
  links: BriefingLink[];
  readUrl?: string;   // primary external article URL for moment items
  imageUrl?: string;  // thumbnail image URL (og:image)
};

export type BriefingSection = {
  id: string;
  emoji: string;
  label: string;
  color: string;
  items: BriefingItem[];
};

export type BriefingMeta = {
  date: string;
  weather: string;
  summary: string;
  completionText: string;
  nextBriefing: string;
};

const SECTIONS = [
  { emoji: "🔴", label: "Critical", color: "#E24B4A", id: "critical" },
  { emoji: "📅", label: "Your Day", color: "#185FA5", id: "your-day" },
  { emoji: "👀", label: "On Your Radar", color: "#0F6E56", id: "on-radar" },
  { emoji: "☕", label: "When You Have a Moment", color: "#7a8499", id: "moment" },
];

function parseTags(line: string): string[] {
  const match = line.match(/`([^`]+)`/g);
  if (!match) return [];
  return match.map((t) => t.replace(/`/g, "").split("·").map((s) => s.trim())).flat();
}

// Extracts → [text](url) links — only returns entries that have a real URL
function parseLinks(line: string): BriefingLink[] {
  const results: BriefingLink[] = [];
  const pattern = /→\s*\[([^\]]+)\]\(([^)]+)\)/g;
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(line)) !== null) {
    const text = m[1].trim();
    const url = m[2].trim();
    if (text && url) results.push({ text, url });
  }
  return results;
}

function parseItems(sectionText: string, isMoment: boolean): BriefingItem[] {
  const items: BriefingItem[] = [];

  if (isMoment) {
    const chunks = sectionText.split(/(?=\*\*\d+\.\s)/);
    for (const chunk of chunks) {
      const titleMatch = chunk.match(/^\*\*\d+\.\s(.+?)\*\*/);
      if (!titleMatch) continue;
      const title = titleMatch[1].trim();
      const rest = chunk.slice(titleMatch[0].length);
      const lines = rest.split("\n").map((l) => l.trim()).filter(Boolean);
      const tags = lines.filter((l) => l.startsWith("`")).flatMap(parseTags);
      const linkLine = lines.find((l) => l.startsWith("→"));
      const links = linkLine ? parseLinks(linkLine) : [];
      const readUrl = links[0]?.url;
      // Extract thumbnail from standard markdown image syntax: ![alt](url)
      const imageMatch = lines.find((l) => l.match(/^!\[.*?\]\(.+?\)$/));
      const imageUrl = imageMatch?.match(/^!\[.*?\]\((.+?)\)$/)?.[1];
      const body = lines
        .filter((l) => !l.startsWith("`") && !l.startsWith("→") && !l.startsWith("!["))
        .join(" ")
        .trim();
      items.push({ title, tags, body, links, readUrl, imageUrl });
    }
    return items;
  }

  const chunks = sectionText.split(/(?=^### )/m);
  for (const chunk of chunks) {
    const lines = chunk.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lines.length || !lines[0].startsWith("### ")) continue;
    const title = lines[0].replace(/^### /, "").trim();
    const tags = lines.filter((l) => l.startsWith("`")).flatMap(parseTags);
    const linkLine = lines.find((l) => l.startsWith("→"));
    const links = linkLine ? parseLinks(linkLine) : [];
    const imageMatch = lines.find((l) => l.match(/^!\[.*?\]\(.+?\)$/));
    const imageUrl = imageMatch?.match(/^!\[.*?\]\((.+?)\)$/)?.[1];
    const body = lines
      .filter((l) => !l.startsWith("### ") && !l.startsWith("`") && !l.startsWith("→") && !l.startsWith("![") && l !== "---")
      .join(" ")
      .replace(/<br\s*\/?>/gi, " ")
      .trim();
    items.push({ title, tags, body, links, imageUrl });
  }
  return items;
}

export function parseBriefing(markdown: string): {
  meta: BriefingMeta;
  sections: BriefingSection[];
} {
  const lines = markdown.split("\n");

  const dateLine = lines.find((l) => l.startsWith("**") && l.includes("·")) ?? "";
  const date = dateLine.replace(/\*\*/g, "").trim();
  const weather = lines.find((l) => l.match(/°F/)) ?? "";
  const summary = lines.find((l) => l.startsWith("*") && l.includes("critical"))?.replace(/\*/g, "").trim() ?? "";

  const completionMatch = markdown.match(/\*You're up to speed\.\*\s*\n\*([^\*]+)\*/);
  const completionText = "You're up to speed";
  const nextBriefing = completionMatch?.[1]?.trim() ?? "";

  const sections: BriefingSection[] = [];

  for (let i = 0; i < SECTIONS.length; i++) {
    const def = SECTIONS[i];
    const startPattern = new RegExp(`## ${def.emoji}`);
    const startIdx = lines.findIndex((l) => startPattern.test(l));
    if (startIdx === -1) continue;

    let endIdx = lines.length;
    for (let j = i + 1; j < SECTIONS.length; j++) {
      const nextPattern = new RegExp(`## ${SECTIONS[j].emoji}`);
      const idx = lines.findIndex((l) => nextPattern.test(l));
      if (idx !== -1 && idx < endIdx) endIdx = idx;
    }
    const doneIdx = lines.findIndex((l) => l.includes("You're up to speed"));
    if (doneIdx !== -1 && doneIdx < endIdx) endIdx = doneIdx;

    const sectionText = lines.slice(startIdx + 1, endIdx).join("\n");
    sections.push({ ...def, items: parseItems(sectionText, def.id === "moment") });
  }

  return { meta: { date, weather, summary, completionText, nextBriefing }, sections };
}
