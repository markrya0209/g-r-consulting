const STEP_LABELS = ["Identidade", "Sessões", "Disponibilidade", "Stripe"];

interface Props {
  currentStep: number;
  onStepClick: (step: number) => void;
}

export default function ProgressBar({ currentStep, onStepClick }: Props) {
  return (
    <div className="flex items-center gap-2 mb-10">
      {STEP_LABELS.map((label, i) => {
        const step = i + 1;
        const isComplete = step < currentStep;
        const isActive = step === currentStep;

        return (
          <div key={step} className="flex items-center gap-2 flex-1">
            <button
              type="button"
              onClick={() => isComplete && onStepClick(step)}
              disabled={!isComplete}
              className={`
                flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold shrink-0
                ${isComplete ? "bg-[--grc-accent] text-white cursor-pointer" : ""}
                ${isActive ? "bg-[--grc-ink] text-white" : ""}
                ${!isComplete && !isActive ? "bg-[--grc-border] text-[--grc-ink-muted]" : ""}
              `}
            >
              {isComplete ? "✓" : step}
            </button>
            <span
              className={`text-sm hidden sm:inline ${
                isActive ? "font-semibold text-[--grc-ink]" : "text-[--grc-ink-muted]"
              }`}
            >
              {label}
            </span>
            {i < STEP_LABELS.length - 1 && (
              <div
                className={`flex-1 h-0.5 ${
                  isComplete ? "bg-[--grc-accent]" : "bg-[--grc-border]"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
