import { NextRequest, NextResponse } from "next/server";

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Cache-Control": "no-cache",
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "url param required" }, { status: 400 });
  }

  try {
    let targetUrl = url;

    // Google News redirect URLs need a second fetch to get the real article URL
    if (url.includes("news.google.com")) {
      const gnRes = await fetch(url, { headers: HEADERS, redirect: "follow" });
      const gnHtml = await gnRes.text();

      // Try to find the real article URL in the Google News page
      const realUrl =
        gnHtml.match(/data-n-au="([^"]+)"/)?.[1] ||
        gnHtml.match(/<a[^>]+href="(https?:\/\/(?!news\.google\.com)[^"]+)"[^>]*>\s*(?:Full coverage|Read more)/i)?.[1] ||
        gnHtml.match(/window\.location\.href\s*=\s*["']([^"']+)["']/)?.[1] ||
        gnHtml.match(/<meta[^>]+http-equiv=["']refresh["'][^>]+content=["'][^;]*;\s*url=([^"']+)["']/i)?.[1] ||
        (gnRes.url !== url ? gnRes.url : null);

      if (realUrl && !realUrl.includes("news.google.com")) {
        targetUrl = realUrl.trim();
      } else {
        // Could not resolve — return empty so caller falls back to browser
        return NextResponse.json({ paragraphs: [], finalUrl: gnRes.url });
      }
    }

    const res = await fetch(targetUrl, {
      headers: HEADERS,
      redirect: "follow",
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return NextResponse.json({ error: `Fetch failed: ${res.status}`, paragraphs: [], finalUrl: targetUrl });
    }

    const finalUrl = res.url;
    const html = await res.text();
    const paragraphs = extractArticle(html);
    return NextResponse.json({ paragraphs, finalUrl });
  } catch (_err) {
    return NextResponse.json({ error: "Could not fetch article", paragraphs: [], finalUrl: url });
  }
}

function extractArticle(html: string): string[] {
  // Strip non-content elements
  let doc = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<aside[\s\S]*?<\/aside>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "");

  // Find the start of the main content container and slice from there.
  // We search for the opening tag only (not trying to close-match nested divs)
  // so the non-greedy regex bug doesn't cut content short.
  const containerPatterns = [
    /<article[^>]*>/i,
    /<div[^>]*\bclass="[^"]*\b(?:article-body|article__body|story-body|post-body|entry-content|article-content|content-body|ArticleBody|article_body|story__body|article__content|post__content|RichTextArticleBody|article-text|body-content|article_content|articleBody)[^"]*"[^>]*>/i,
    /<section[^>]*\bclass="[^"]*\b(?:article|story|content|post)[^"]*"[^>]*>/i,
    /<div[^>]*\bclass="[^"]*\b(?:story|post|entry)[^"]*"[^>]*>/i,
    /<main[^>]*>/i,
  ];

  for (const pattern of containerPatterns) {
    const idx = doc.search(pattern);
    if (idx !== -1) {
      doc = doc.slice(idx);
      break;
    }
  }

  // Extract text from <p>, <h2>, <h3> tags
  const blocks: string[] = [];
  for (const m of doc.matchAll(/<(p|h2|h3)[^>]*>([\s\S]*?)<\/\1>/gi)) {
    const text = m[2]
      .replace(/<[^>]+>/g, " ")
      .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (text.length > 40) blocks.push(text);
  }

  // Deduplicate and cap
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const b of blocks) {
    if (!seen.has(b)) { seen.add(b); unique.push(b); }
  }

  return unique.slice(0, 25);
}
