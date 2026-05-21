import { NextRequest, NextResponse } from "next/server";

const BASE = "https://news.google.com/rss";
const FEEDS: Record<string, string> = {
  all: BASE,
  business: `${BASE}/search?q=business&hl=en-US&gl=US&ceid=US:en`,
  tech: `${BASE}/search?q=technology&hl=en-US&gl=US&ceid=US:en`,
  sports: `${BASE}/search?q=sports&hl=en-US&gl=US&ceid=US:en`,
  local: `${BASE}/search?q=local+news&hl=en-US&gl=US&ceid=US:en`,
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") ?? "all";
  const feedUrl = FEEDS[category] ?? FEEDS.all;

  try {
    const res = await fetch(feedUrl, {
      headers: { "User-Agent": "Distilled/1.0 RSS Reader" },
      next: { revalidate: 300 },
    });

    if (!res.ok) throw new Error(`Feed fetch failed: ${res.status}`);
    const xml = await res.text();

    // Parse XML to extract articles
    const items = parseRSS(xml);

    return NextResponse.json({ items, category });
  } catch (_err) {
    return NextResponse.json({ error: "Failed to fetch feed", items: [] }, { status: 500 });
  }
}

type RSSItem = {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  description: string;
  imageUrl: string;
};

function parseRSS(xml: string): RSSItem[] {
  const items: RSSItem[] = [];
  const itemMatches = Array.from(xml.matchAll(/<item>([\s\S]*?)<\/item>/g));

  for (const match of itemMatches) {
    const block = match[1];
    const title = getText(block, "title");
    const link = getText(block, "link") || getCDATA(block, "link");
    const pubDate = getText(block, "pubDate");
    const rawDescription = getCDATA(block, "description") || getText(block, "description");

    // Google News RSS has no images — imageUrl stays empty
    const imageUrl = "";

    // Description is HTML-encoded in Google News — decode entities first, then strip tags
    const decoded = rawDescription
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, " ");
    // Google News descriptions are lists of related articles — extract source names as coverage line
    const sourcesInDesc = Array.from(decoded.matchAll(/<font[^>]*>([^<]+)<\/font>/g))
      .map((m) => m[1].trim())
      .filter(Boolean);
    const unique = Array.from(new Set(sourcesInDesc)).slice(0, 4);
    const description = unique.length > 0 ? unique.join(" · ") : decoded.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

    // Source is often in <source url="...">Name</source>
    const sourceMatch = block.match(/<source[^>]*>([^<]+)<\/source>/);
    const source = sourceMatch?.[1]?.trim() ?? extractSourceFromTitle(title);

    items.push({ title: cleanTitle(title, source), link, pubDate, source, description, imageUrl });
  }

  return items.slice(0, 40);
}

function getText(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}>([^<]*)<\\/${tag}>`));
  return match?.[1]?.trim() ?? "";
}

function getCDATA(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`));
  return match?.[1]?.trim() ?? "";
}

function cleanTitle(title: string, source: string): string {
  // Google News appends " - Source Name" to titles
  if (source && title.endsWith(` - ${source}`)) {
    return title.slice(0, -(source.length + 3)).trim();
  }
  // Remove any trailing " - Anything" pattern
  return title.replace(/\s+-\s+[^-]+$/, "").trim();
}

function extractSourceFromTitle(title: string): string {
  const match = title.match(/\s+-\s+([^-]+)$/);
  return match?.[1]?.trim() ?? "Google News";
}
