// ============================================================
// MaatWork CRM — Design System Index
// UI/UX REFINED BY JULES v2
// ============================================================

import { animations } from "./animations";
import { colors } from "./colors";
import { spacing } from "./spacing";
import { typography } from "./typography";

export const designSystem = {
  colors,
  typography,
  spacing,
  animations,
} as const;

export { colors, typography, spacing, animations };
