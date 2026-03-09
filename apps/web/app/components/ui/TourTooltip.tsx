import type React from "react";
import type { OnboardingStep } from "./OnboardingTour";

type Props = {
  step: OnboardingStep;
  targetRect: { top: number; left: number; width: number; height: number } | null;
  onNext?: () => void;
  onPrev?: () => void;
  onClose?: () => void;
};

const TourTooltip: React.FC<Props> = ({ step, targetRect }) => {
  // Simple floating bubble; positioning is handled by parent overlay in real use
  const style: React.CSSProperties = {
    position: "absolute",
    top: (targetRect?.top ?? window.innerHeight * 0.3) + 20,
    left: (targetRect?.left ?? window.innerWidth * 0.25) + 20,
    maxWidth: 320,
    background: "rgba(0,0,0,0.7)",
    color: "white",
    padding: 12,
    borderRadius: 12,
    boxShadow: "0 20px 60px rgba(0,0,0,.4)",
  };
  return (
    <div style={style} role="dialog" aria-label={step?.title}>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>{step?.title}</div>
      <div style={{ fontSize: 12 }}>{step?.description}</div>
    </div>
  );
};

export default TourTooltip;
