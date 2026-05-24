"use client";

export type TrackModalState =
  | { step: "confirm"; topic: string }
  | { step: "success"; topic: string }
  | null;

type Props = {
  modal: TrackModalState;
  onConfirm: () => void;
  onClose: () => void;
};

export default function TrackModal({ modal, onConfirm, onClose }: Props) {
  if (!modal) return null;
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <div
        className="fixed z-50 left-1/2 -translate-x-1/2 w-[300px] bg-white rounded-[16px] shadow-[0_12px_40px_rgba(0,0,0,0.22)] overflow-hidden"
        style={{ top: "38%" }}
      >
        {modal.step === "confirm" ? (
          <>
            <div className="px-5 pt-5 pb-4">
              <div className="text-[17px] font-semibold text-[#0f1117] leading-snug mb-1">Track this topic?</div>
              <div className="text-[14px] text-[#7a8499] leading-snug line-clamp-2">#{modal.topic}</div>
            </div>
            <div className="flex border-t border-[#f0f1f3]">
              <button
                onClick={onClose}
                className="flex-1 py-3.5 text-[15px] font-medium text-[#7a8499] border-r border-[#f0f1f3] touch-manipulation active:bg-[#f7f8fa]"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 py-3.5 text-[15px] font-semibold text-[#185FA5] touch-manipulation active:opacity-80"
              >
                Add to Tracking
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="px-5 pt-5 pb-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#E1F5EE] flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <div>
                <div className="text-[16px] font-semibold text-[#0f1117] mb-0.5">Added to Tracking</div>
                <div className="text-[13px] text-[#7a8499] line-clamp-2">#{modal.topic}</div>
              </div>
            </div>
            <div className="border-t border-[#f0f1f3]">
              <button
                onClick={onClose}
                className="w-full py-3.5 text-[15px] font-semibold text-[#185FA5] touch-manipulation active:bg-[#f7f8fa]"
              >
                Done
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
