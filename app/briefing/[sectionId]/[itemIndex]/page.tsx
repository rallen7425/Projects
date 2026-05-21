import fs from "fs";
import path from "path";
import Link from "next/link";
import { notFound } from "next/navigation";
import { parseBriefing } from "@/lib/parseBriefing";

function parseSource(text: string): { title: string; source: string } {
  const idx = text.lastIndexOf(" — ");
  if (idx !== -1) return { title: text.slice(0, idx).trim(), source: text.slice(idx + 3).trim() };
  const dashIdx = text.lastIndexOf(" - ");
  if (dashIdx !== -1) return { title: text.slice(0, dashIdx).trim(), source: text.slice(dashIdx + 3).trim() };
  return { title: text, source: "" };
}

type Params = { sectionId: string; itemIndex: string };

export default function ReadMorePage({ params }: { params: Params }) {
  const filePath = path.join(process.cwd(), "content", "briefing.md");
  const markdown = fs.readFileSync(filePath, "utf-8");
  const { meta, sections } = parseBriefing(markdown);

  const section = sections.find((s) => s.id === params.sectionId);
  const idx = parseInt(params.itemIndex, 10);
  if (!section || isNaN(idx) || idx < 0 || idx >= section.items.length) notFound();

  const item = section.items[idx];

  // Related items: other briefing items sharing at least one tag with this one
  const currentTagSet = new Set(item.tags);
  const relatedItems = sections.flatMap((s) =>
    s.items.map((candidate, i) => ({ candidate, sectionId: s.id, itemIndex: i, sectionLabel: s.label, sectionColor: s.color }))
  ).filter(({ candidate, sectionId, itemIndex }) =>
    !(sectionId === params.sectionId && itemIndex === idx) &&
    candidate.tags.some((t) => currentTagSet.has(t))
  ).slice(0, 5);

  // Compute flat ordered item list for prev/next navigation
  const flat: { sectionId: string; itemIndex: number }[] = sections.flatMap((s) =>
    s.items.map((_, i) => ({ sectionId: s.id, itemIndex: i }))
  );
  const flatIdx = flat.findIndex(
    (f) => f.sectionId === params.sectionId && f.itemIndex === idx
  );
  const prev = flat[flatIdx - 1];
  const next = flat[flatIdx + 1];

  const dateLine = meta.date.toUpperCase();
  const tempMatch = meta.weather.match(/(\d+)°F/);
  const metaLine = dateLine + (tempMatch ? ` · ${tempMatch[1]}°F` : "");

  return (
    <div className="pb-10">
      {/* Page header context */}
      <div className="px-4 pt-4 pb-4 border-b border-[#dde1e8]">
        <p className="text-[11px] font-semibold text-[#7a8499] uppercase tracking-wide mb-1">{metaLine}</p>
        <h1 className="text-[28px] font-bold text-[#0f1117] leading-tight">Daily Briefing</h1>
        <p className="text-[13px] text-[#475066] mt-0.5">The Executive Briefing for Your Day</p>
      </div>

      {/* Article content */}
      <div className="px-4 pt-5">
        {/* Section label */}
        <p
          className="text-[11px] font-bold uppercase tracking-widest mb-2"
          style={{ color: section.color }}
        >
          {section.label}
        </p>

        {/* Tags */}
        {item.tags.length > 0 && (
          <p className="text-[12px] font-semibold text-[#7a8499] mb-2">
            {item.tags.join(" · ")}
          </p>
        )}

        {/* Headline */}
        <h2 className="text-[26px] font-bold text-[#0f1117] leading-tight mb-4">
          {item.title}
        </h2>

        {/* Hero image */}
        {item.imageUrl && (
          <img
            src={item.imageUrl}
            alt=""
            className="w-full h-48 object-cover rounded-[10px] mb-5"
          />
        )}

        {/* Full body — split on sentence boundaries for paragraph breaks */}
        <div className="space-y-4">
          {splitIntoParagraphs(item.body).map((para, i) => (
            <p key={i} className="text-[15px] text-[#0f1117] leading-relaxed">
              {para}
            </p>
          ))}
        </div>
      </div>

      {/* Read More — actual article links */}
      {item.links.length > 0 && (
        <div className="mt-8 px-4">
          <h3 className="text-[18px] font-bold text-[#0f1117] mb-4">Read More</h3>
          <div className="space-y-5">
            {item.links.map((link, i) => {
              const { title, source } = parseSource(link.text);
              return (
                <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="block">
                  {source && (
                    <p className="text-[11px] font-bold text-[#7a8499] uppercase tracking-wide mb-0.5">
                      {source}
                    </p>
                  )}
                  <p className="text-[15px] font-semibold text-[#0f1117] leading-snug">{title}</p>
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* Related Topics — other briefing items sharing a tag */}
      {relatedItems.length > 0 && (
        <div className="mt-8 px-4">
          <h3 className="text-[18px] font-bold text-[#0f1117] mb-4">Related Topics</h3>
          <div className="space-y-4">
            {relatedItems.map(({ candidate, sectionId, itemIndex, sectionLabel, sectionColor }, i) => (
              <Link
                key={i}
                href={`/briefing/${sectionId}/${itemIndex}`}
                className="block touch-manipulation"
              >
                <p className="text-[11px] font-bold uppercase tracking-wide mb-0.5" style={{ color: sectionColor }}>
                  {sectionLabel}
                </p>
                <p className="text-[15px] font-semibold text-[#0f1117] leading-snug">{candidate.title}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Prev / Next navigation */}
      <div className="mt-10 mx-4 pt-4 border-t border-[#dde1e8] flex items-center justify-between">
        {prev ? (
          <Link
            href={`/briefing/${prev.sectionId}/${prev.itemIndex}`}
            className="flex items-center gap-1.5 text-[13px] font-medium text-[#2d59a6] touch-manipulation"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
            Previous
          </Link>
        ) : (
          <Link
            href="/briefing"
            className="flex items-center gap-1.5 text-[13px] font-medium text-[#2d59a6] touch-manipulation"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
            Briefing
          </Link>
        )}

        {next ? (
          <Link
            href={`/briefing/${next.sectionId}/${next.itemIndex}`}
            className="flex items-center gap-1.5 text-[13px] font-medium text-[#2d59a6] touch-manipulation"
          >
            Next
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </Link>
        ) : (
          <Link
            href="/briefing"
            className="flex items-center gap-1.5 text-[13px] font-medium text-[#2d59a6] touch-manipulation"
          >
            Back to Briefing
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </Link>
        )}
      </div>
    </div>
  );
}

function splitIntoParagraphs(body: string): string[] {
  if (!body) return [];
  // Try to split on double-sentence breaks (period followed by capital letter with spacing)
  const parts = body.split(/(?<=\.\s{1,2})(?=[A-Z])/g);
  // Group into ~2-3 sentence paragraphs
  const paragraphs: string[] = [];
  let current = "";
  let sentenceCount = 0;
  for (const part of parts) {
    current += (current ? " " : "") + part.trim();
    sentenceCount++;
    if (sentenceCount >= 3) {
      paragraphs.push(current.trim());
      current = "";
      sentenceCount = 0;
    }
  }
  if (current.trim()) paragraphs.push(current.trim());
  return paragraphs.length > 0 ? paragraphs : [body];
}
