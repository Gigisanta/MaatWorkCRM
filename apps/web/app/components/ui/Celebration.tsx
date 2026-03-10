import React, { useEffect, useRef } from "react";

const CelebrationBackdrop: React.FC = () => (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "radial-gradient(circle at 30% 20%, rgba(139,92,246,0.25), rgba(0,0,0,0.7) 60%)",
    }}
  />
);

const ConfettiCanvas: React.FC<{ durationMs?: number; colors?: string[] }> = ({
  durationMs = 1800,
  colors = ["#8B5CF6", "#FF4D99", "#4ADE80", "#F59E0B"],
}) => {
  const ref = useRef<HTMLCanvasElement | null>(null);
  React.useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = (canvas.width = Math.floor(window.innerWidth * dpr));
    const h = (canvas.height = Math.floor(window.innerHeight * dpr));
    const pieces = Array.from({ length: 120 }).map(() => {
      return {
        x: Math.random() * w,
        y: Math.random() * -h,
        vel: Math.random() * 3 + 2,
        size: Math.random() * 6 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rot: Math.random() * Math.PI,
        rotSpeed: Math.random() * 0.2 - 0.1,
      };
    });
    let t = 0;
    const loop = () => {
      t += 16;
      ctx.clearRect(0, 0, w, h);
      for (const p of pieces) {
        p.y += p.vel;
        p.rot += p.rotSpeed;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      }
      if (t < durationMs) {
        requestAnimationFrame(loop);
      }
    };
    requestAnimationFrame(loop);
    const onResize = () => {
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [durationMs, colors]);
  return (
    <canvas
      ref={ref}
      style={{ position: "fixed", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 999999 }}
    />
  );
};

const Celebration: React.FC<{ onDone?: () => void }> = ({ onDone }) => {
  useEffect(() => {
    const t = setTimeout(() => onDone?.(), 2500);
    return () => clearTimeout(t);
  }, []);
  return (
    <div aria-label="celebration" style={{ position: "fixed", inset: 0, zIndex: 999999 }}>
      <CelebrationBackdrop />
      <ConfettiCanvas durationMs={1800} />
      <div style={{ position: "fixed", bottom: 40, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <div style={{ padding: 12, borderRadius: 999, background: "rgba(0,0,0,0.5)", color: "white" }}>
          Congrats! You’re all set.
        </div>
      </div>
    </div>
  );
};

export default Celebration;
