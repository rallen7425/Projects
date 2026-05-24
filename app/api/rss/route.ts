import { NextRequest, NextResponse } from "next/server";

const BASE = "https://news.google.com/rss";
const FEEDS: Record<string, string> = {
  news:     BASE,
  business: `${BASE}/search?q=business&hl=en-US&gl=US&ceid=US:en`,
  tech:     `${BASE}/search?q=technology&hl=en-US&gl=US&ceid=US:en`,
  sports:   `${BASE}/search?q=sports&hl=en-US&gl=US&ceid=US:en`,
  local:    `${BASE}/search?q=local+news&hl=en-US&gl=US&ceid=US:en`,
};

const ALL_KEYS = ["news", "business", "tech", "sports", "local"] as const;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") ?? "all";
  const q = searchParams.get("q");

  // Topic search — used by tag pages for specific queries like "Celtics" or "Federal Reserve"
  if (q) {
    try {
      const url = `${BASE}/search?q=${encodeURIComponent(q)}&hl=en-US&gl=US&ceid=US:en`;
      const res = await fetch(url, {
        headers: { "User-Agent": "Distilled/1.0 RSS Reader" },
        next: { revalidate: 180 },
      });
      if (!res.ok) throw new Error(`Feed fetch failed: ${res.status}`);
      const xml = await res.text();
      const items = parseRSS(xml, q).slice(0, 20);
      return NextResponse.json({ items, query: q });
    } catch (_err) {
      return NextResponse.json({ error: "Failed to fetch feed", items: [] }, { status: 500 });
    }
  }

  try {
    if (category === "all") {
      // Fetch all category feeds in parallel and merge
      const results = await Promise.allSettled(
        ALL_KEYS.map((key) =>
          fetch(FEEDS[key], {
            headers: { "User-Agent": "Distilled/1.0 RSS Reader" },
            next: { revalidate: 300 },
          }).then((r) => r.text().then((xml) => ({ key, xml })))
        )
      );

      const allItems: RSSItem[] = [];
      const seen = new Set<string>();

      for (const result of results) {
        if (result.status !== "fulfilled") continue;
        const { key, xml } = result.value;
        const label = key.charAt(0).toUpperCase() + key.slice(1);
        for (const item of parseRSS(xml, label)) {
          const dedupeKey = item.title.slice(0, 60).toLowerCase();
          if (!seen.has(dedupeKey)) {
            seen.add(dedupeKey);
            allItems.push(item);
          }
        }
      }

      allItems.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
      return NextResponse.json({ items: allItems.slice(0, 40), category });
    }

    const feedUrl = FEEDS[category] ?? FEEDS.news;
    const label = category.charAt(0).toUpperCase() + category.slice(1);
    const res = await fetch(feedUrl, {
      headers: { "User-Agent": "Distilled/1.0 RSS Reader" },
      next: { revalidate: 300 },
    });

    if (!res.ok) throw new Error(`Feed fetch failed: ${res.status}`);
    const xml = await res.text();
    return NextResponse.json({ items: parseRSS(xml, label), category });
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
  category: string;
};

function parseRSS(xml: string, category = "News"): RSSItem[] {
  const items: RSSItem[] = [];
  const itemMatches = Array.from(xml.matchAll(/<item>([\s\S]*?)<\/item>/g));

  for (const match of itemMatches) {
    const block = match[1];
    const title = getText(block, "title");
    const link = getText(block, "link") || getCDATA(block, "link");
    const pubDate = getText(block, "pubDate");
    const rawDescription = getCDATA(block, "description") || getText(block, "description");
    const imageUrl = "";

    const decoded = rawDescription
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, " ");

    const sourcesInDesc = Array.from(decoded.matchAll(/<font[^>]*>([^<]+)<\/font>/g))
      .map((m) => m[1].trim())
      .filter(Boolean);
    const unique = Array.from(new Set(sourcesInDesc)).slice(0, 4);
    const description = unique.length > 0
      ? unique.join(" · ")
      : decoded.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

    const sourceMatch = block.match(/<source[^>]*>([^<]+)<\/source>/);
    const source = sourceMatch?.[1]?.trim() ?? extractSourceFromTitle(title);

    // The Google News RSS <link> is a redirect URL. The real article URL is
    // in the first <a href> inside the description HTML.
    const realLinkMatch = decoded.match(/<a[^>]+href="(https?:\/\/(?!news\.google\.com)[^"]+)"/i);
    const resolvedLink = realLinkMatch?.[1] ?? link;

    items.push({ title: cleanTitle(title, source), link: resolvedLink, pubDate, source, description, imageUrl, category });
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
  if (source && title.endsWith(` - ${source}`)) {
    return title.slice(0, -(source.length + 3)).trim();
  }
  return title.replace(/\s+-\s+[^-]+$/, "").trim();
}

function extractSourceFromTitle(title: string): string {
  const match = title.match(/\s+-\s+([^-]+)$/);
  return match?.[1]?.trim() ?? "Google News";
}
