"use client";
import { useState } from "react";
import Link from "next/link";
import type { BriefingSection as BriefingSectionType } from "@/lib/parseBriefing";

function MomentItem({
  item,
  color,
  href,
}: {
  item: BriefingSectionType["items"][number];
  color: string;
  href: string;
}) {
  const thumb = item.imageUrl ? (
    <img
      src={item.imageUrl}
      alt=""
      className="flex-shrink-0 w-14 h-14 rounded-[8px] object-cover bg-[#f7f8fa]"
    />
  ) : (
    <div
      className="flex-shrink-0 w-14 h-14 rounded-[8px]"
      style={{ background: color + "18" }}
    />
  );

  return (
    <div className="flex gap-3 py-3 border-b border-[#dde1e8] last:border-b-0">
      {item.readUrl ? (
        <a
          href={item.readUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="touch-manipulation flex-shrink-0"
          aria-label="Read article"
        >
          {thumb}
        </a>
      ) : (
        <Link href={href} className="flex-shrink-0 touch-manipulation">
          {thumb}
        </Link>
      )}
      <Link href={href} className="flex-1 min-w-0 touch-manipulation">
        <p className="text-[13px] font-semibold text-[#0f1117] leading-snug line-clamp-2 mb-1">
          {item.title}
        </p>
        {item.tags.length > 0 && (
          <p className="text-[11px] text-[#7a8499]">{item.tags.join(" · ")}</p>
        )}
      </Link>
    </div>
  );
}

function ArticleItem({
  item,
  color,
  href,
}: {
  item: BriefingSectionType["items"][number];
  color: string;
  href: string;
}) {
  return (
    <div
      className="border-b border-[#dde1e8] last:border-b-0"
      style={{ borderLeft: `3px solid ${color}` }}
    >
      <div className="py-3 pl-3 pr-4">
        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-1.5">
            {item.tags.map((tag, ti) => (
              <span
                key={ti}
                className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded"
                style={{ background: color + "18", color }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        <Link href={href} className="touch-manipulation">
          <h3 className="text-[14px] font-semibold text-[#0f1117] leading-snug mb-1.5">
            {item.title}
          </h3>
        </Link>
        {item.body && (
          <div className="relative mb-2">
            <p className="text-[13px] text-[#475066] leading-relaxed line-clamp-5">
              {item.body}
            </p>
            <Link
              href={href}
              className="absolute bottom-0 right-0 text-[13px] font-medium touch-manipulation pl-8"
              style={{ background: "linear-gradient(to right, transparent, white 40%)", color: "#2d59a6" }}
            >
              Read More
            </Link>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-3">
          {item.links.map((link, li) => (
            <a
              key={li}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[12px] font-medium text-[#2d59a6] touch-manipulation"
            >
              → {link.text}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function BriefingSection({ section }: { section: BriefingSectionType }) {
  const [open, setOpen] = useState(true);
  const isMoment = section.id === "moment";

  return (
    <div className="mb-5">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-2 touch-manipulation"
      >
        <span className="text-[17px] font-bold text-[#0f1117]">{section.label}</span>
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#7a8499"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ transform: open ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.2s" }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="mt-1">
          {section.items.map((item, idx) => {
            const href = `/briefing/${section.id}/${idx}`;
            return isMoment ? (
              <MomentItem key={idx} item={item} color={section.color} href={href} />
            ) : (
              <ArticleItem key={idx} item={item} color={section.color} href={href} />
            );
          })}
        </div>
      )}
    </div>
  );
}

