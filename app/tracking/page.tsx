export default function TrackingPage() {
  return (
    <div className="px-3 pt-4">
      {/* Search bar */}
      <div className="flex items-center gap-2 bg-[#f7f8fa] border border-[#dde1e8] rounded-card px-3 py-2.5 mb-5">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7a8499" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <span className="text-[14px] text-[#7a8499]">Search tracked topics…</span>
      </div>

      {/* Empty state */}
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="w-14 h-14 rounded-full bg-[#f7f8fa] border border-[#dde1e8] flex items-center justify-center mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7a8499" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
        </div>
        <p className="text-[15px] font-semibold text-[#0f1117] mb-1">No tracked topics</p>
        <p className="text-[13px] text-[#7a8499] leading-relaxed">
          Your tracked topics will appear here.
        </p>
      </div>
    </div>
  );
}
