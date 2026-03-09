import React, { useEffect, useState } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";

interface AnimatedCounterProps {
  value: number;
  duration?: number;
}

export function AnimatedCounter({ value, duration = 1500 }: AnimatedCounterProps) {
  const motionValue = useMotionValue(0);
  const display = useTransform(motionValue, (latest) => Math.floor(latest).toLocaleString());
  const [displayValue, setDisplayValue] = useState("0");

  useEffect(() => {
    motionValue.set(0);
    const id = setTimeout(() => {
      motionValue.set(value);
    }, 50);
    return () => clearTimeout(id);
  }, [value, motionValue]);

  useEffect(() => {
    const unsubscribe = display.on("change", (latest) => {
      setDisplayValue(latest);
    });
    return () => unsubscribe();
  }, [display]);

  return (
    <motion.div className="tabular-nums font-mono font-bold text-text">
      {displayValue}
    </motion.div>
  );
}
