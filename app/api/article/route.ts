import { NextRequest, NextResponse } from 'next/server'
import { Readability } from '@mozilla/readability'
import { parseHTML } from 'linkedom'
import { createServerSupabase, getEffectiveUser } from '@/lib/supabase/server'
import { articleUrl, fetchArticlePage } from '@/lib/security/safeArticleFetch'
import { acquireArticleRead } from '@/lib/security/articleAccess'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
const json = (body: unknown, status = 200) => NextResponse.json(body, {
  status, headers: { 'Cache-Control': 'private, no-store' },
})

export async function GET(request: NextRequest) {
  const user = await getEffectiveUser()
  if (!user) return json({ error: 'Unauthorized' }, 401)
  const release = acquireArticleRead(user.id)
  if (!release) return json({ error: 'Too many requests' }, 429)
  let sourceUrl = ''
  try {
    const id = request.nextUrl.searchParams.get('id')
    const suppliedUrl = request.nextUrl.searchParams.get('url')
    if ((!id && !suppliedUrl) || (id && !/^[0-9a-f-]{36}$/i.test(id)) || (suppliedUrl && suppliedUrl.length > 4096)) {
      return json({ error: 'Valid article id or stored url required' }, 400)
    }
    const supabase = createServerSupabase()
    let query = supabase.from('articles').select('source_url')
    query = id ? query.eq('id', id) : query.eq('source_url', suppliedUrl!)
    const { data, error } = await query.limit(1).maybeSingle()
    if (error) return json({ error: 'Article lookup failed' }, 503)
    if (!data?.source_url) return json({ error: 'Article not found' }, 404)
    sourceUrl = articleUrl(data.source_url).href
    const signal = AbortSignal.timeout(8000)
    let page = await fetchArticlePage(sourceUrl, signal)
    if (new URL(page.finalUrl).hostname === 'news.google.com') {
      // Every discovered destination passes the same pinned-address transport.
      const match = page.html.match(/data-n-au="([^"]+)"/) || page.html.match(/<a[^>]+href="(https?:\/\/[^"]+)"/i)
      if (match?.[1]) page = await fetchArticlePage(match[1].replace(/&amp;/g, '&'), signal)
    }
    return json({ paragraphs: extractWithReadability(page.html), finalUrl: page.finalUrl })
  } catch {
    return json({ paragraphs: [], ...(sourceUrl ? { finalUrl: sourceUrl } : {}) })
  } finally {
    release()
  }
}

function extractWithReadability(html: string): string[] {
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
