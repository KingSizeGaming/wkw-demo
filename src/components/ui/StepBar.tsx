type StepBarProps = {
  currentStep: 1 | 2 | 3;
};

const LABELS = ['Welcome', 'Your tag', 'Predict'] as const;

export default function StepBar({ currentStep }: StepBarProps) {
  return (
    <div className="bg-[#2d0044] px-4 py-2 border-b border-[#3a005a] flex-shrink-0">
      <div className="flex items-center">
        {LABELS.map((label, i) => {
          const stepNum = (i + 1) as 1 | 2 | 3;
          const done = stepNum < currentStep;
          const active = stepNum === currentStep;
          return (
            <div key={label} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-0.5">
                <div
                  className={[
                    'w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black',
                    done
                      ? 'bg-[#25D366] text-white'
                      : active
                      ? 'bg-[#f6e8a0] text-[#220037]'
                      : 'bg-white/10 text-[#6b21a8] border border-[#3a005a]',
                  ].join(' ')}
                >
                  {done ? '✓' : stepNum}
                </div>
                <span
                  className={[
                    'text-[9px] uppercase tracking-wide',
                    active ? 'text-[#f6e8a0] font-bold' : 'text-[#9b59b6]',
                  ].join(' ')}
                >
                  {label}
                </span>
              </div>
              {i < LABELS.length - 1 && (
                <div
                  className={[
                    'flex-1 h-px mx-1 mb-3',
                    done ? 'bg-[#25D366]' : 'bg-white/10',
                  ].join(' ')}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
