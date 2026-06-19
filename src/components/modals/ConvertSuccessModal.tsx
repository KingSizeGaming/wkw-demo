"use client";

import PillButton from "@/components/ui/PillButton";

interface ConvertSuccessModalProps {
  entries: number;
  picksAvailable: number;
  onClose: () => void;
}

export default function ConvertSuccessModal({ entries, picksAvailable, onClose }: ConvertSuccessModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6">
      <div className="w-full max-w-xs rounded-2xl border border-purple-light bg-violet-dark p-6 flex flex-col items-center gap-3 text-center">
        <div className="w-12 h-12 rounded-full bg-whatsapp/15 border border-whatsapp flex items-center justify-center text-whatsapp text-2xl">✓</div>
        <h2 className="font-hitroad text-yellow-dark text-xl">Points converted</h2>
        <p className="font-hitroad text-sm text-lavender">
          Converted {entries} {entries === 1 ? "point" : "points"} into {entries} {entries === 1 ? "entry" : "entries"}.
        </p>
        <p className="font-hitroad text-xs text-lavender-muted">
          You now have {picksAvailable} {picksAvailable === 1 ? "pick" : "picks"} available.
        </p>
        <PillButton variant="primary" onClick={onClose} className="mt-2">Done</PillButton>
      </div>
    </div>
  );
}
