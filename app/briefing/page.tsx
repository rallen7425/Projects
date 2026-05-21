import fs from "fs";
import path from "path";
import { parseBriefing } from "@/lib/parseBriefing";
import BriefingSection from "@/components/BriefingSection";

export default function BriefingPage() {
  const filePath = path.join(process.cwd(), "content", "briefing.md");
  const markdown = fs.readFileSync(filePath, "utf-8");
  const { meta, sections } = parseBriefing(markdown);

  // Format the date line as uppercase: "SATURDAY, MAY 16, 2026 · NORTH ANDOVER, MA"
  const dateLine = meta.date.toUpperCase();
  // Extract just the temperature from weather string
  const tempMatch = meta.weather.match(/(\d+)°F/);
  const temp = tempMatch ? ` ${tempMatch[1]}°F` : "";
  const metaLine = dateLine + temp;

  return (
    <div className="pb-8">
      {/* Page header */}
      <div className="px-4 pt-4 pb-4 border-b border-[#dde1e8]">
        <div className="flex items-start justify-between mb-1">
          <p className="text-[11px] font-semibold text-[#7a8499] uppercase tracking-wide leading-tight pr-2">
            {metaLine}
          </p>
          <button className="flex-shrink-0 touch-manipulation" aria-label="Search">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7a8499" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </button>
        </div>
        <h1 className="text-[28px] font-bold text-[#0f1117] leading-tight">Your Briefing</h1>
        <p className="text-[14px] text-[#475066] mt-0.5">The Executive Briefing for Your Day.</p>
      </div>

      {/* Sections */}
      <div className="px-4 pt-4">
        {sections.map((section) => (
          <BriefingSection key={section.id} section={section} />
        ))}
      </div>

      {/* Completion state */}
      <div className="mx-4 mt-2 py-6 flex flex-col items-center gap-2 rounded-card bg-[#f7f8fa] border border-[#dde1e8]">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center mb-1"
          style={{ background: "#2d59a6" }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5"/>
          </svg>
        </div>
        <p className="text-[16px] font-bold text-[#0f1117]">{meta.completionText}</p>
        {meta.nextBriefing && (
          <p className="text-[13px] text-[#7a8499] text-center px-6">{meta.nextBriefing}</p>
        )}
      </div>

      {/* Customize button */}
      <div className="mx-4 mt-3">
        <button
          className="w-full py-3.5 rounded-card text-[14px] font-semibold text-white touch-manipulation"
          style={{ background: "#2d59a6" }}
        >
          Customize My Briefing
        </button>
      </div>
    </div>
  );
}
