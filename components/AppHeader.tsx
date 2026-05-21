"use client";
import Link from "next/link";

export default function AppHeader() {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#dde1e8] px-4 flex items-center justify-between" style={{ height: 52 }}>
      <button
        className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#f7f8fa] touch-manipulation"
        aria-label="Menu"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#475066" strokeWidth="2" strokeLinecap="round">
          <path d="M3 12h18M3 6h18M3 18h18"/>
        </svg>
      </button>

      <span className="text-[22px] font-semibold tracking-tight" style={{ color: "#2d59a6", fontFamily: "Inter, sans-serif" }}>
        Distilled
      </span>

      <Link
        href="/profile"
        className="w-9 h-9 flex items-center justify-center rounded-full bg-[#f7f8fa] border border-[#dde1e8] touch-manipulation"
        aria-label="Profile"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#475066" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      </Link>
    </header>
  );
}
