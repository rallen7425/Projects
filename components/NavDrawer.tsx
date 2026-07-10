"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const ZONES = [
  { id: "sports",  label: "Sports" },
  { id: "local",   label: "Local" },
  { id: "maine",   label: "Maine" },
  { id: "tech",    label: "Tech & AI" },
  { id: "finance", label: "Finance" },
];

type Props = { open: boolean; onClose: () => void };

export default function NavDrawer({ open, onClose }: Props) {
  const pathname = usePathname();
  const [zonesOpen, setZonesOpen] = useState(false);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 transition-opacity duration-200"
        style={{ opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none" }}
        onClick={onClose}
      />

      {/* Slide-in panel */}
      <div
        className="fixed top-0 left-0 z-50 h-full w-[280px] bg-white shadow-[4px_0_32px_rgba(0,0,0,0.20)] flex flex-col transition-transform duration-200 ease-out"
        style={{ transform: open ? "translateX(0)" : "translateX(-100%)" }}
      >
        {/* Drawer header */}
        <div
          className="flex items-center justify-between px-4 flex-shrink-0"
          style={{ height: 52, background: "#1c2b4a" }}
        >
          <span className="text-[20px] font-semibold tracking-tight text-white">Distilled</span>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full touch-manipulation"
            style={{ background: "rgba(255,255,255,0.10)" }}
            aria-label="Close menu"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto">
          <NavItem href="/v2" label="Home" icon={homeIcon} active={pathname === "/v2"} onClick={onClose} />

          {/* Zones — expandable */}
          <button
            onClick={() => setZonesOpen((v) => !v)}
            className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-[#f0f1f3] touch-manipulation active:bg-[#f7f8fa]"
          >
            <span className="text-[#475066]">{zonesIcon}</span>
            <span className="flex-1 text-[15px] font-medium text-[#0f1117] text-left">Zones</span>
            <svg
              width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#c0c5d0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              style={{ transition: "transform 0.18s", transform: zonesOpen ? "rotate(90deg)" : "rotate(0deg)" }}
            >
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>

          {zonesOpen && (
            <div className="bg-[#f7f8fa] border-b border-[#f0f1f3]">
              {ZONES.map((zone) => (
                <Link
                  key={zone.id}
                  href={`/v2/zones/${zone.id}`}
                  onClick={onClose}
                  className="flex items-center pl-11 pr-4 py-3 border-b border-[#eeeff2] last:border-0 touch-manipulation active:bg-[#eaecf2]"
                >
                  <span className="text-[14px] font-medium text-[#475066]">{zone.label}</span>
                </Link>
              ))}
              <Link
                href="/v2/zones"
                onClick={onClose}
                className="flex items-center pl-11 pr-4 py-3 border-t border-[#eeeff2] touch-manipulation active:bg-[#eaecf2]"
              >
                <span className="text-[14px] font-medium text-[#185FA5]">Manage Zones</span>
              </Link>
              <Link
                href="/v2/zones/add"
                onClick={onClose}
                className="flex items-center pl-11 pr-4 py-3 touch-manipulation active:bg-[#eaecf2]"
              >
                <span className="text-[14px] font-medium text-[#185FA5]">+ Add Zone</span>
              </Link>
            </div>
          )}

          <NavItem href="/saved" label="Saved" icon={savedIcon} active={pathname.startsWith("/saved")} onClick={onClose} />
          <NavItem href="/v2/tracking" label="Tracking" icon={trackingIcon} active={pathname === "/v2/tracking"} onClick={onClose} />
          <NavItem href="/v2/tracking/manage" label="Manage Tracking" icon={manageIcon} active={pathname === "/v2/tracking/manage"} onClick={onClose} />

          <div className="border-t border-[#e4e6eb] my-1" />

          <NavItem href="/profile" label="Profile" icon={profileIcon} active={pathname.startsWith("/profile")} onClick={onClose} />
          <NavItem href="/settings" label="Settings" icon={settingsIcon} active={pathname.startsWith("/settings")} onClick={onClose} />
        </nav>
      </div>
    </>
  );
}

function NavItem({ href, label, icon, active, onClick }: {
  href: string; label: string; icon: React.ReactNode; active: boolean; onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-3.5 border-b border-[#f0f1f3] touch-manipulation active:bg-[#f7f8fa]"
      style={{ background: active ? "#EEF2F9" : "transparent" }}
    >
      <span style={{ color: active ? "#185FA5" : "#475066" }}>{icon}</span>
      <span className="text-[15px] font-medium" style={{ color: active ? "#185FA5" : "#0f1117" }}>{label}</span>
    </Link>
  );
}

const homeIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);
const zonesIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
  </svg>
);
const savedIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
  </svg>
);
const trackingIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/>
  </svg>
);
const manageIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
);
const profileIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);
const settingsIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);
