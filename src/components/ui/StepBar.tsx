type StepBarProps = {
  currentStep: 1 | 2 | 3;
};

const LABELS = ['Welcome', 'Your tag', 'Predict'] as const;

export default function StepBar({ currentStep }: StepBarProps) {
  return (
    <div className="bg-purple-dark px-4 py-2 border-b border-purple-line shrink-0">
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
                      ? 'bg-whatsapp text-white'
                      : active
                      ? 'bg-yellow-dark text-purple-dark'
                      : 'bg-white/10 text-lavender-muted border border-purple-line',
                  ].join(' ')}
                >
                  {done ? '✓' : stepNum}
                </div>
                <span
                  className={[
                    'font-hitroad text-[9px] uppercase tracking-wide',
                    active ? 'text-yellow-dark font-bold' : 'text-lavender-muted',
                  ].join(' ')}
                >
                  {label}
                </span>
              </div>
              {i < LABELS.length - 1 && (
                <div
                  className={[
                    'flex-1 h-px mx-1 mb-3',
                    done ? 'bg-whatsapp' : 'bg-white/10',
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
