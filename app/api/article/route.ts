import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "url param required" }, { status: 400 });
  }

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return NextResponse.json({ error: `Fetch failed: ${res.status}`, paragraphs: [] });
    }

    const html = await res.text();
    const paragraphs = extractArticle(html);
    return NextResponse.json({ paragraphs });
  } catch (_err) {
    return NextResponse.json({ error: "Could not fetch article", paragraphs: [] });
  }
}

function extractArticle(html: string): string[] {
  // Strip scripts, styles, nav, footer, aside, ads
  let doc = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<aside[\s\S]*?<\/aside>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "");

  // Try to isolate the main article container
  const containers = [
    /<article[^>]*>([\s\S]*?)<\/article>/i,
    /<div[^>]*\bclass="[^"]*\b(?:article-body|article__body|story-body|post-body|entry-content|article-content|content-body|paywall-content|ArticleBody|article_body)[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*\bclass="[^"]*\b(?:story|article|post|entry|content)[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<main[^>]*>([\s\S]*?)<\/main>/i,
  ];

  for (const pattern of containers) {
    const m = doc.match(pattern);
    if (m?.[1]) { doc = m[1]; break; }
  }

  // Pull out all <p> and <h2>/<h3> tags as content blocks
  const blocks: string[] = [];
  const matches = doc.matchAll(/<(p|h2|h3)[^>]*>([\s\S]*?)<\/\1>/gi);
  for (const m of matches) {
    const text = m[2]
      .replace(/<[^>]+>/g, " ")
      .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (text.length > 40) blocks.push(text);
  }

  // Deduplicate consecutive identical paragraphs and cap length
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const b of blocks) {
    if (!seen.has(b)) { seen.add(b); unique.push(b); }
  }

  return unique.slice(0, 20);
}
