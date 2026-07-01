"use client";

interface ConvertSuccessModalProps {
  entries: number;
  picksAvailable: number;
  onClose: () => void;
}

export default function ConvertSuccessModal({ entries, picksAvailable, onClose }: ConvertSuccessModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6 py-4">
      <div className="relative w-full max-w-sm bg-[url('/images/pop_up_no_text_frame_panel.png')] bg-size-[100%_100%] bg-no-repeat px-10 py-9 flex flex-col items-center text-center">
        <div className="flex flex-row gap-2 items-center mb-2">
          <div className="w-6 h-6 rounded-full bg-yellow-dark flex items-center justify-center text-black text-lg">✓</div>
          <h2 className="font-hitroad text-yellow-dark text-xl">Points converted</h2>
        </div>
        
        <p className="font-hitroad text-sm">
          Converted {entries} {entries === 1 ? "point" : "points"} into {entries} {entries === 1 ? "entry" : "entries"}.
        </p>
        <p className="font-hitroad text-xs text-lavender">
          You now have {picksAvailable} {picksAvailable === 1 ? "pick" : "picks"} total available.
        </p>
        <span className="absolute -bottom-4 left-1/2 -translate-x-1/2">
          <button
            onClick={onClose}
            className="w-24 h-10 sm:w-28 sm:h-12 bg-[url('/images/exit_button_untapped.png')] bg-contain bg-center bg-no-repeat active:bg-[url('/images/exit_button_tapped.png')]"
          />
        </span>
      </div>
    </div>
  );
}
