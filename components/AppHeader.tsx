"use client";
import Link from "next/link";
import { useState } from "react";
import NavDrawer from "./NavDrawer";

export default function AppHeader() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 px-4 flex items-center justify-between flex-shrink-0" style={{ height: 52, background: "#1c2b4a" }}>
        <button
          onClick={() => setDrawerOpen(true)}
          className="w-9 h-9 flex items-center justify-center rounded-full touch-manipulation"
          style={{ background: "rgba(255,255,255,0.08)" }}
          aria-label="Open menu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="2" strokeLinecap="round">
            <path d="M3 12h18M3 6h18M3 18h18"/>
          </svg>
        </button>

        <span className="text-[22px] font-semibold tracking-tight" style={{ color: "white", fontFamily: "Inter, sans-serif" }}>
          Distilled
        </span>

        <Link
          href="/profile"
          className="w-9 h-9 flex items-center justify-center rounded-full touch-manipulation"
          style={{ background: "rgba(255,255,255,0.08)" }}
          aria-label="Profile"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </Link>
      </header>

      <NavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
