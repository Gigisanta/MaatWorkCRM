// ============================================================
// MaatWork CRM — Design System: Color Tokens
// UI/UX REFINED BY JULES v2
// ============================================================
// Exact Tailwind color values for premium dark theme
// ============================================================

export const colors = {
  // --- Core Backgrounds ---
  background: "#050505", // Deep black
  surface: "#0F0F0F", // Dark surface/card
  surfaceHover: "#18181B", // Surface on hover

  // --- Primary Colors ---
  primary: {
    DEFAULT: "#8B5CF6", // violet-500
    hover: "#7C3AED", // violet-600
    light: "#A78BFA", // violet-400
    subtle: "rgba(139, 92, 246, 0.1)", // violet-500/10
    glow: "rgba(139, 92, 246, 0.15)", // Primary glow
    glowHover: "rgba(139, 92, 246, 0.25)", // Primary glow hover
  },

  // --- Accent Colors ---
  accent: {
    DEFAULT: "#C026D3", // fuchsia-600
    hover: "#A21CAF", // fuchsia-700
    light: "#E879F9", // fuchsia-400
    subtle: "rgba(192, 38, 211, 0.1)", // fuchsia-600/10
  },

  // --- Text Colors ---
  text: {
    primary: "#F5F5F5", // Main text
    secondary: "#A3A3A3", // Secondary text
    muted: "#737373", // Muted text
    inverse: "#FFFFFF", // Inverse (white)
  },

  // --- Status Colors ---
  success: {
    DEFAULT: "#22C55E", // green-500
    hover: "#16A34A", // green-600
    bg: "rgba(34, 197, 94, 0.1)", // green-500/10
    border: "rgba(34, 197, 94, 0.2)", // green-500/20
  },

  danger: {
    DEFAULT: "#EF4444", // red-500
    hover: "#DC2626", // red-600
    bg: "rgba(239, 68, 68, 0.1)", // red-500/10
    border: "rgba(239, 68, 68, 0.2)", // red-500/20
  },

  warning: {
    DEFAULT: "#F59E0B", // amber-500
    hover: "#D97706", // amber-600
    bg: "rgba(245, 158, 11, 0.1)", // amber-500/10
    border: "rgba(245, 158, 11, 0.2)", // amber-500/20
  },

  // --- Neutral/White Accents ---
  white: {
    DEFAULT: "#FFFFFF",
    5: "rgba(255, 255, 255, 0.05)", // white/5
    10: "rgba(255, 255, 255, 0.1)", // white/10
    15: "rgba(255, 255, 255, 0.15)", // white/15
    20: "rgba(255, 255, 255, 0.2)", // white/20
  },

  // --- Border Colors ---
  border: {
    subtle: "rgba(255, 255, 255, 0.05)", // border-white/5
    default: "rgba(255, 255, 255, 0.1)", // border-white/10
    hover: "rgba(255, 255, 255, 0.15)", // border-white/15
    focus: "rgba(139, 92, 246, 0.4)", // border-primary/40
  },

  // --- Shadow System (soft inner glow + outer violet glow) ---
  shadow: {
    sm: "0 1px 3px rgba(0, 0, 0, 0.1)",
    md: "0 4px 6px rgba(0, 0, 0, 0.07)",
    lg: "0 10px 15px rgba(0, 0, 0, 0.05)",
    xl: "0 20px 25px rgba(0, 0, 0, 0.03)",
    primary: "0 0 20px rgba(139, 92, 246, 0.15)", // Violet glow
    primaryLg: "0 0 30px rgba(139, 92, 246, 0.25)", // Large violet glow
    focus: "0 0 0 3px rgba(139, 92, 246, 0.4)", // Focus ring
    inner: "inset 0 1px 2px rgba(0, 0, 0, 0.1)", // Soft inner glow
  },
} as const;
