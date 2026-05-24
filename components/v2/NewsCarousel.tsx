"use client";

export type CarouselItem = {
  title: string;
  sub?: string;
  label: string;
  url: string;
  imageUrl?: string;
};

type Props = {
  items: CarouselItem[];
  pillBg: string;
  pillText: string;
  heading?: string;
};

export default function NewsCarousel({ items, pillBg, pillText, heading = "Read More" }: Props) {
  if (!items.length) return null;

  return (
    <div className="pt-6">
      <div className="flex items-center gap-2 px-4 mb-3">
        <span className="text-[11px] font-semibold tracking-widest text-[#7a8499] uppercase">{heading}</span>
      </div>
      <div className="flex gap-3 overflow-x-auto px-4 pb-1" style={{ scrollbarWidth: "none" }}>
        {items.slice(0, 10).map((item, i) => (
          <a
            key={i}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 w-[80vw] rounded-[12px] border border-[#e0e0e0] bg-white p-3 flex gap-3 touch-manipulation active:opacity-80"
          >
            {/* Text — left */}
            <div className="flex-1 min-w-0 flex flex-col justify-between">
              <div>
                <p className="text-[13px] font-semibold text-[#111111] leading-snug line-clamp-2 mb-1">{item.title}</p>
                {item.sub && <p className="text-[12px] text-[#555555] leading-snug line-clamp-2">{item.sub}</p>}
              </div>
              <span
                className="mt-2 self-start text-[10px] font-semibold px-2 py-[2px] rounded-[4px]"
                style={{ background: pillBg, color: pillText }}
              >
                {item.label}
              </span>
            </div>
            {/* Thumbnail — right */}
            {item.imageUrl && (
              <img
                src={item.imageUrl}
                alt=""
                className="flex-shrink-0 w-[72px] h-[72px] rounded-[8px] object-cover self-start"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            )}
          </a>
        ))}
      </div>
    </div>
  );
}
