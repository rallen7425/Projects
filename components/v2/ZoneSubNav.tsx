"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ZONES = [
  { id: "local",   label: "Local",     pillBg: "#E6F1FB", pillColor: "#185FA5" },
  { id: "sports",  label: "Sports",    pillBg: "#EAF3DE", pillColor: "#3B6D11" },
  { id: "maine",   label: "Maine",     pillBg: "#FAEEDA", pillColor: "#854F0B" },
  { id: "tech",    label: "Tech & AI", pillBg: "#EEEDFE", pillColor: "#534AB7" },
  { id: "finance", label: "Finance",   pillBg: "#E1F5EE", pillColor: "#0F6E56" },
];

export default function ZoneSubNav() {
  const pathname = usePathname();

  // Hide on tracking and trending pages
  if (pathname.startsWith("/v2/tracking") || pathname.startsWith("/v2/trending")) return null;

  const zoneMatch = pathname.match(/^\/v2\/zones\/([^/]+)/);
  const activeZoneId = zoneMatch ? zoneMatch[1] : null;

  return (
    <div className="flex items-center border-b border-[#e8eaef] bg-white">
      <span className="pl-3 pr-2 text-[10px] font-semibold tracking-[0.08em] text-[#7a8499] uppercase flex-shrink-0">
        Zones
      </span>
      <div
        className="flex items-center gap-1.5 py-2 pr-3 overflow-x-auto"
        style={{ scrollbarWidth: "none" }}
      >
        {ZONES.map((z) => {
          const active = activeZoneId === z.id;
          return (
            <Link
              key={z.id}
              href={`/v2/zones/${z.id}`}
              className="flex-shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-[5px] touch-manipulation"
              style={{
                background: active ? z.pillColor : z.pillBg,
                color: active ? "white" : z.pillColor,
              }}
            >
              {z.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
