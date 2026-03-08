import React from "react";

const StepIndicator: React.FC<{ total: number; current: number }> = ({ total, current }) => {
  return (
    <div className="flex items-center gap-2" aria-label="step-indicator">
      {Array.from({ length: total }).map((_, i) => {
        const isActive = i <= current;
        return (
          <span
            key={i}
            className={[
              "flex items-center justify-center rounded-full",
              isActive ? "w-6 h-6 bg-violet-500 text-white" : "w-6 h-6 border border-white/40 bg-transparent text-white/60",
            ].join(" ")}
          >
            {i + 1}
          </span>
        );
      })}
    </div>
  );
};

export default StepIndicator;
