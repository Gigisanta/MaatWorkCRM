// ============================================================
// MaatWork CRM — Design System: Typography
// UI/UX REFINED BY JULES v2
// ============================================================

export const typography = {
  // Font Families
  families: {
    display: '"Inter", "Satoshi", system-ui, -apple-system, sans-serif',
    body: '"Inter", system-ui, -apple-system, sans-serif',
    mono: '"JetBrains Mono", monospace',
  },

  // Font Sizes (4px base grid)
  sizes: {
    xs: "0.75rem", // 12px
    sm: "0.875rem", // 14px
    base: "1rem", // 16px
    lg: "1.125rem", // 18px
    xl: "1.25rem", // 20px
    "2xl": "1.5rem", // 24px
    "3xl": "1.875rem", // 30px
    "4xl": "2.25rem", // 36px
    "5xl": "3rem", // 48px
  },

  // Font Weights
  weights: {
    regular: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },

  // Line Heights
  lineHeights: {
    tight: "1.25",
    normal: "1.5",
    relaxed: "1.75",
  },

  // Letter Spacing
  letterSpacing: {
    tight: "-0.025em",
    normal: "0",
    wide: "0.05em",
    tracking: "0.3em", // For uppercase headlines
    trackingWider: "0.2em", // For uppercase buttons
  },
} as const;
