import { NextRequest, NextResponse } from "next/server";
import { Readability } from "@mozilla/readability";
import { parseHTML } from "linkedom";

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "url param required" }, { status: 400 });
  }

  try {
    // Resolve Google News redirect URLs to the real article URL
    let targetUrl = url;
    if (url.includes("news.google.com")) {
      targetUrl = await resolveGoogleNewsUrl(url);
    }

    const res = await fetch(targetUrl, {
      headers: HEADERS,
      redirect: "follow",
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return NextResponse.json({ paragraphs: [], finalUrl: targetUrl });
    }

    const finalUrl = res.url;
    const html = await res.text();
    const paragraphs = extractWithReadability(html, finalUrl);
    return NextResponse.json({ paragraphs, finalUrl });
  } catch (_err) {
    return NextResponse.json({ paragraphs: [], finalUrl: url });
  }
}

async function resolveGoogleNewsUrl(googleUrl: string): Promise<string> {
  // Strategy 1: try to decode the Base64-encoded URL directly from the path
  try {
    const path = new URL(googleUrl).pathname.replace("/rss/articles/", "");
    const decoded = Buffer.from(path, "base64url").toString("binary");
    const idx = decoded.indexOf("https://");
    if (idx !== -1) {
      const extracted = decoded.slice(idx).split(/[\x00\s]/)[0];
      if (extracted.length > 20 && !extracted.includes("news.google.com")) {
        return extracted;
      }
    }
  } catch { /* fall through */ }

  // Strategy 2: fetch and follow HTTP redirects — res.url is the final URL
  try {
    const res = await fetch(googleUrl, { headers: HEADERS, redirect: "follow" });
    if (res.url && !res.url.includes("news.google.com")) {
      return res.url;
    }
    // Strategy 3: look for the real URL inside the returned HTML
    const html = await res.text();
    const match =
      html.match(/data-n-au="([^"]+)"/) ||
      html.match(/<a[^>]+href="(https?:\/\/(?!news\.google\.com)[^"]+)"[^>]*>/i);
    if (match?.[1]) return match[1];
  } catch { /* fall through */ }

  return googleUrl;
}

function extractWithReadability(html: string, url: string): string[] {
  try {
    const { document } = parseHTML(html);
    const reader = new Readability(document as unknown as Document, {
      charThreshold: 20,
    });
    const article = reader.parse();
    if (!article?.content) return fallbackExtract(html);

    // Turn Readability's HTML content into plain text paragraphs
    const { document: contentDoc } = parseHTML(article.content);
    const blocks: string[] = [];
    const nodes = contentDoc.querySelectorAll("p, h2, h3");
    for (const node of Array.from(nodes)) {
      const text = (node.textContent ?? "").replace(/\s+/g, " ").trim();
      if (text.length > 40) blocks.push(text);
    }
    if (blocks.length > 0) return blocks.slice(0, 30);
  } catch { /* fall through to regex fallback */ }

  return fallbackExtract(html);
}

function fallbackExtract(html: string): string[] {
  let doc = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<aside[\s\S]*?<\/aside>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "");

  const containerPatterns = [
    /<article[^>]*>/i,
    /<div[^>]*\bclass="[^"]*\b(?:article-body|article__body|story-body|post-body|entry-content|article-content|content-body|ArticleBody|article_body|story__body|article__content|post__content|RichTextArticleBody|article-text|body-content)[^"]*"[^>]*>/i,
    /<main[^>]*>/i,
  ];

  for (const pattern of containerPatterns) {
    const idx = doc.search(pattern);
    if (idx !== -1) { doc = doc.slice(idx); break; }
  }

  const blocks: string[] = [];
  for (const m of Array.from(doc.matchAll(/<(p|h2|h3)[^>]*>([\s\S]*?)<\/\1>/gi))) {
    const text = m[2]
      .replace(/<[^>]+>/g, " ")
      .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (text.length > 40) blocks.push(text);
  }

  const seen = new Set<string>();
  const unique: string[] = [];
  for (const b of blocks) {
    if (!seen.has(b)) { seen.add(b); unique.push(b); }
  }
  return unique.slice(0, 25);
}
