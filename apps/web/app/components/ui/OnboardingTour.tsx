import { ChartLine, Clock, Sparkles, UserPlus } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Celebration from "./Celebration";
import StepIndicator from "./StepIndicator";
import TourOverlay from "./TourOverlay";
import TourTooltip from "./TourTooltip";

export type OnboardingStep = {
  id: string;
  title: string;
  description: string;
  selector?: string;
  action?: string;
  illustration?: React.ReactNode;
};

type HighlightRect = {
  top: number;
  left: number;
  width: number;
  height: number;
} | null;

const STEPS: OnboardingStep[] = [
  {
    id: "step-welcome",
    title: "Welcome to MaatWork CRM",
    description: "This guided tour will introduce key features as you first login.",
    selector: "body",
    action: "scrollIntoView",
    illustration: <Sparkles size={18} />,
  },
  {
    id: "step-new-client",
    title: "Create your first client",
    description: "Use the New Client button to add a contact quickly.",
    selector: "#new-client-btn",
    action: "scrollIntoView",
    illustration: <UserPlus size={18} />,
  },
  {
    id: "step-tasks",
    title: "Plan your day",
    description: "Access tasks and reminders from the left panel to stay organized.",
    selector: "#left-panel-tills",
    action: "scrollIntoView",
    illustration: <Clock size={18} />,
  },
  {
    id: "step-analytics",
    title: "Insights at a glance",
    description: "Open Analytics to view activity and performance insights.",
    selector: "#analytics-tab",
    action: "scrollIntoView",
    illustration: <ChartLine size={18} />,
  },
];

const LOCAL_STORAGE_KEY = "maatwork_onboarding_dont_show_again";

const OnboardingTour: React.FC<{ onFinish?: () => void }> = ({ onFinish }) => {
  const [open, setOpen] = useState<boolean>(true);
  const [index, setIndex] = useState<number>(0);
  const [dontShow, setDontShow] = useState<boolean>(false);
  const [celebrate, setCelebrate] = useState<boolean>(false);
  const [highlight, setHighlight] = useState<HighlightRect>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);

  // Initialize from localStorage
  useEffect(() => {
    const skip = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (skip === "true") {
      setOpen(false);
    }
  }, []);

  // Keyboard navigation: arrows and escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "Enter") {
        goNext();
      } else if (e.key === "ArrowLeft") {
        goPrev();
      } else if (e.key === "Escape") {
        close();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, index]);

  // Update highlight target rect for current step
  useEffect(() => {
    if (!open) return;
    const step = STEPS[index];
    const el = step?.selector ? (document.querySelector(step.selector) as HTMLElement | null) : null;
    if (el) {
      const r = el.getBoundingClientRect();
      const top = r.top + window.scrollY - 6;
      const left = r.left + window.scrollX - 6;
      const w = r.width + 12;
      const h = r.height + 12;
      setHighlight({ top, left, width: w, height: h });
    } else {
      // Fallback to center spotlight
      setHighlight({
        top: window.innerHeight * 0.4,
        left: window.innerWidth * 0.2,
        width: window.innerWidth * 0.6,
        height: 120,
      });
    }
  }, [open, index]);

  const close = useCallback(() => {
    setOpen(false);
    if (dontShow) {
      localStorage.setItem(LOCAL_STORAGE_KEY, "true");
    } else {
      localStorage.setItem(LOCAL_STORAGE_KEY, "false");
    }
    onFinish?.();
  }, [dontShow, onFinish]);

  const goNext = useCallback(() => {
    if (index < STEPS.length - 1) {
      setIndex((i) => i + 1);
    } else {
      // Final step completed
      setCelebrate(true);
      setTimeout(() => {
        setCelebrate(false);
        close();
      }, 1500);
    }
  }, [index]);

  const goPrev = useCallback(() => {
    if (index > 0) setIndex((i) => i - 1);
  }, [index]);

  // If user chose not to show again, hide component
  if (!open || celebrate) {
    return celebrate ? (
      <Celebration
        onDone={() => {
          setCelebrate(false);
          close();
        }}
      />
    ) : null;
  }

  const currentStep = STEPS[index];

  return (
    <>
      <TourOverlay highlightRect={highlight} />
      {highlight && currentStep && <TourTooltip step={currentStep} targetRect={highlight} />}
      <div
        ref={cardRef}
        aria-label="onboarding-tour"
        className="fixed z-40 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(680px,92%)] max-w-full rounded-lg shadow-lg border border-white/20 bg-neutral-900 p-5 text-white"
        style={{
          transition: "opacity 250ms ease, transform 250ms ease",
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-violet-900/60 ring-2 ring-violet-400/70">
              <span className="text-xl font-semibold" style={{ color: "#8B5CF6" }}>
                {index + 1}
              </span>
            </div>
            <div>
              <div className="text-sm text-violet-100">Onboarding Tour</div>
              <div className="text-lg font-semibold">{currentStep?.title}</div>
            </div>
          </div>
          <button
            onClick={() => setDontShow((d) => !d)}
            className="text-sm text-violet-300 hover:text-violet-100 transition-colors inline-flex items-center gap-2"
          >
            <span className="w-4 h-4 rounded-full border border-violet-300" /> Don't show again
          </button>
        </div>
        <div className="mt-2 text-sm text-violet-100 max-w-3xl">{currentStep?.description}</div>
        <div className="flex items-center justify-between mt-4">
          <StepIndicator total={STEPS.length} current={index} />
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-2 rounded-md border border-white/20 text-sm text-white hover:bg-white/10"
              onClick={goPrev}
              disabled={index === 0}
            >
              Previous
            </button>
            <button
              className="px-4 py-2 rounded-md bg-gradient-to-br from-violet-600 to-violet-800 text-white shadow-inner hover:from-violet-500 hover:to-violet-700"
              onClick={goNext}
            >
              {index === STEPS.length - 1 ? "Finish" : "Next"}
            </button>
          </div>
        </div>
        <div className="mt-3 border-t border-white/20 pt-3 flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-violet-200">
            <span className="inline-block w-4 h-4 rounded-full bg-violet-500" />
            <span>Tip: You can press Right Arrow to continue</span>
          </div>
          <label className="flex items-center gap-2 text-xs text-violet-200">
            <input type="checkbox" checked={dontShow} onChange={(e) => setDontShow(e.target.checked)} /> Don't show
            again
          </label>
        </div>
      </div>
      {/* Drag target illustration near step */}
      {currentStep?.illustration && (
        <div className="fixed -bottom-6 -right-6 opacity-40 pointer-events-none animate-pulse text-violet-300 text-2xl">
          {currentStep.illustration}
        </div>
      )}
    </>
  );
};

export default OnboardingTour;
