"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/v2", label: "Home" },
  { href: "/briefing", label: "Briefing" },
  { href: "/feeds", label: "Feeds" },
  { href: "/saved", label: "Saved" },
  { href: "/v2/tracking", label: "Tracking" },
];

export default function TopTabNav() {
  const pathname = usePathname();

  function isTabActive(href: string) {
    if (href === "/v2") return pathname === "/v2" || (pathname.startsWith("/v2/") && !pathname.startsWith("/v2/tracking"));
    return pathname.startsWith(href);
  }

  return (
    <nav className="bg-white border-b border-[#dde1e8] flex px-1 flex-shrink-0">
      {TABS.map((tab) => {
        const active = isTabActive(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="relative flex-1 text-center py-2.5 text-[13px] font-medium touch-manipulation"
            style={{ color: active ? "#2d59a6" : "#7a8499" }}
          >
            {tab.label}
            {active && (
              <span
                className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full"
                style={{ background: "#2d59a6" }}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
