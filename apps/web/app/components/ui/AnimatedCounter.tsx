import React from "react";
import { useSpring, animated, useMotionValue } from "framer-motion";

interface AnimatedCounterProps {
  value: number;
  duration?: number;
}

export function AnimatedCounter({ value, duration = 1500 }: AnimatedCounterProps) {
  const spring = useSpring(value, { duration, bounce: 0 });
  const display = useMotionValue(value);

  return (
    <animated.div
      style={spring}
      className="tabular-nums font-mono font-bold text-text"
    >
      {Math.floor(display.get()).toLocaleString()}
    </animated.div>
  );
}
