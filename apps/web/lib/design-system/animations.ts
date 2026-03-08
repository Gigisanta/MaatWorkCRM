// ============================================================
// MaatWork CRM — Design System: Animations
// UI/UX REFINED BY JULES v2
// ============================================================

export const animations = {
  // Spring Physics (for premium feel)
  spring: {
    subtle: {
      type: "spring" as const,
      stiffness: 300,
      damping: 30,
    },
    default: {
      type: "spring" as const,
      stiffness: 400,
      damping: 25,
    },
    bouncy: {
      type: "spring" as const,
      stiffness: 500,
      damping: 20,
    },
    snappy: {
      type: "spring" as const,
      stiffness: 600,
      damping: 15,
    },
  },

  // Duration (ms)
  duration: {
    fast: 150,
    normal: 300,
    slow: 500,
  },

  // Easing
  easing: {
    easeIn: [0.4, 0, 0.2, 1],
    easeOut: [0, 0, 0.2, -1],
    easeInOut: [0.4, 0, 0.2, -1],
  },

  // Page Transitions
  page: {
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 300, ease: "easeInOut" },
    },
    slide: {
      initial: { opacity: 0, x: 20 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: -20 },
      transition: { duration: 300, ease: "easeInOut" },
    },
    scale: {
      initial: { opacity: 0, scale: 0.95 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 1.05 },
      transition: { duration: 300, ease: "easeInOut" },
    },
  },

  // Hover Effects
  hover: {
    lift: {
      y: -2,
      transition: { duration: 200, type: "spring" },
    },
    glow: {
      boxShadow: "0 0 20px rgba(139, 92, 246, 0.25)",
      transition: { duration: 300 },
    },
    scale: {
      scale: 1.02,
      transition: { duration: 200, type: "spring" },
    },
  },

  // Tap Effects
  tap: {
    press: { scale: 0.96, transition: { duration: 100, type: "spring" } },
  },

  // Loaders
  loader: {
    pulse: {
      opacity: [0.5, 1, 0.5],
      transition: { duration: 1500, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" },
    },
    shimmer: {
      x: ["-100%", "100%"],
      backgroundPosition: ["0% 0%", "100% 0%"],
      transition: { duration: 2000, repeat: Number.POSITIVE_INFINITY, ease: "linear" },
    },
  },
} as const;
