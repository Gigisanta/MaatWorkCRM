import type React from "react";

type OverlayProps = {
  highlightRect: { top: number; left: number; width: number; height: number } | null;
};

const TourOverlay: React.FC<OverlayProps> = ({ highlightRect }) => {
  return (
    <>
      <div
        aria-label="tour-overlay"
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(2px)",
          zIndex: 9999,
          pointerEvents: "none",
        }}
      />
      {highlightRect && (
        <div
          aria-label="tour-highlight"
          style={{
            position: "fixed",
            top: highlightRect.top,
            left: highlightRect.left,
            width: highlightRect.width,
            height: highlightRect.height,
            borderRadius: 12,
            boxShadow: "0 0 0 6px rgba(139,92,246,.75)",
            pointerEvents: "none",
          }}
        />
      )}
    </>
  );
};

export default TourOverlay;
