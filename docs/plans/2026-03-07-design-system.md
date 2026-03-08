# MaatWork CRM — Design System Documentation
**UI/UX REFINED BY JULES v2**

---

## Table of Contents

1. [Color Palette](#color-palette)
2. [Typography System](#typography-system)
3. [Spacing & Layout Grid](#spacing--layout-grid)
4. [Shadow System](#shadow-system)
5. [Glassmorphism v2](#glassmorphism-v2)
6. [Component Variants](#component-variants)
7. [Animation System](#animation-system)
8. [Accessibility Standards](#accessibility-standards)
9. [Responsive Breakpoints](#responsive-breakpoints)
10. [Utility Classes](#utility-classes)

---

## Color Palette

### Primary Colors (Violet Theme)

| Token | Value | Usage |
|--------|--------|--------|
| `--color-primary` | `#8B5CF6` (violet-500) | Primary actions, buttons, active states |
| `--color-primary-hover` | `#7C3AED` (violet-600) | Hover states, pressed buttons |
| `--color-primary-light` | `#A78BFA` (violet-400) | Text highlights, lighter accents |
| `--color-primary-subtle` | `rgba(139, 92, 246, 0.1)` | Backgrounds, subtle highlights |
| `--color-primary-glow` | `rgba(139, 92, 246, 0.15)` | Neon glow effects |
| `--color-primary-glow-hover` | `rgba(139, 92, 246, 0.25)` | Enhanced glow on hover |

### Accent Colors (Fuchsia Theme)

| Token | Value | Usage |
|--------|--------|--------|
| `--color-accent` | `#C026D3` (fuchsia-600) | Secondary actions, AI elements |
| `--color-accent-hover` | `#A21CAF` (fuchsia-700) | Accent hover states |
| `--color-accent-light` | `#E879F9` (fuchsia-400) | Accent highlights |
| `--color-accent-subtle` | `rgba(192, 38, 211, 0.1)` | Accent backgrounds |

### Neutral Colors (Dark Theme)

| Token | Value | Usage |
|--------|--------|--------|
| `--color-background` | `#050505` (deep black) | Main background |
| `--color-surface` | `#0F0F0F` (dark gray) | Card backgrounds, panels |
| `--color-surface-hover` | `#18181B` (zinc-800) | Hover states, elevated surfaces |
| `--color-text` | `#F5F5F5` (zinc-50) | Primary text |
| `--color-text-secondary` | `#A3A3A3` (neutral-400) | Secondary text |
| `--color-text-muted` | `#737373` (neutral-600) | Muted text, placeholders |

### Status Colors

| Token | Value | Usage |
|--------|--------|--------|
| `--color-success` | `#22C55E` (green-500) | Success states, positive metrics |
| `--color-success-hover` | `#16A34A` (green-600) | Success hover |
| `--color-success-subtle` | `rgba(34, 197, 94, 0.1)` | Success backgrounds |
| `--color-danger` | `#EF4444` (red-500) | Error states, destructive actions |
| `--color-danger-hover` | `#DC2626` (red-600) | Danger hover |
| `--color-danger-subtle` | `rgba(239, 68, 68, 0.1)` | Error backgrounds |
| `--color-warning` | `#F59E0B` (amber-500) | Warning states |
| `--color-warning-hover` | `#D97706` (amber-600) | Warning hover |
| `--color-warning-subtle` | `rgba(245, 158, 11, 0.1)` | Warning backgrounds |
| `--color-info` | `#3B82F6` (blue-500) | Info states |
| `--color-info-hover` | `#2563EB` (blue-600) | Info hover |
| `--color-info-subtle` | `rgba(59, 130, 246, 0.1)` | Info backgrounds |

### Border Colors

| Token | Value | Usage |
|--------|--------|--------|
| `--color-border` | `rgba(255, 255, 255, 0.05)` | Default borders |
| `--color-border-hover` | `rgba(255, 255, 255, 0.1)` | Hover borders |
| `--color-border-strong` | `rgba(255, 255, 255, 0.15)` | Strong borders |
| `--color-border-focus` | `rgba(139, 92, 246, 0.4)` | Focus rings |

### White Accents

| Token | Value | Usage |
|--------|--------|--------|
| `--color-white` | `#FFFFFF` | Pure white, high contrast |
| `--color-white-5` | `rgba(255, 255, 255, 0.05)` | Subtle white overlays |
| `--color-white-10` | `rgba(255, 255, 255, 0.1)` | Light white overlays |
| `--color-white-15` | `rgba(255, 255, 255, 0.15)` | Medium white overlays |
| `--color-white-20` | `rgba(255, 255, 255, 0.2)` | Strong white overlays |

### Color Usage Rules

1. **Background**: Always use `#050505` - no gradients or patterns
2. **Surfaces**: Use `#0F0F0F` with glassmorphism - never solid black
3. **Primary Actions**: Violet `#8B5CF6` with neon glow on hover
4. **AI Elements**: Fuchsia `#C026D3` for AI features (Copilot, suggestions)
5. **White**: Only for text contrast, icons, and highlight borders
6. **Accessibility**: Ensure WCAG AAA contrast ratio (7:1 minimum) on all text/background combos

---

## Typography System

### Font Families

| Token | Value | Usage |
|--------|--------|--------|
| `--font-display` | `Inter, "Satoshi", system-ui, -apple-system, sans-serif` | Headings, titles, hero text |
| `--font-body` | `Inter, system-ui, -apple-system, sans-serif` | Body text, paragraphs, UI elements |
| `--font-mono` | `JetBrains Mono, monospace` | Code, numbers, keyboard shortcuts |

### Font Weights

| Weight | Value | Usage |
|--------|--------|--------|
| 400 | Regular | Body text, descriptions |
| 500 | Medium | Subheadings, emphasized text |
| 600 | Semibold | Card titles, labels, button text |
| 700 | Bold | Headings, hero text, important labels |
| 800 | Extra Bold | Display headings (rare, use sparingly) |

### Font Sizes (Scale)

| Token | Value | Usage |
|--------|--------|--------|
| `text-xs` | `0.75rem` (12px) | Captions, badges, keyboard shortcuts |
| `text-sm` | `0.875rem` (14px) | Secondary text, labels |
| `text-base` | `1rem` (16px) | Body text, standard content |
| `text-lg` | `1.125rem` (18px) | Section headings |
| `text-xl` | `1.25rem` (20px) | Page headings |
| `text-2xl` | `1.5rem` (24px) | Card titles, hero subtext |
| `text-3xl` | `1.875rem` (30px) | Display headings |
| `text-4xl` | `2.25rem` (36px) | Hero titles (landing) |

### Typography Usage Rules

1. **Display font** (`Inter` 600-700): Headings, titles, page navigation
2. **Body font** (`Inter` 400-500): Content, descriptions, form labels
3. **Mono font** (`JetBrains Mono`): Code, numbers, timestamps
4. **Tracking**:
   - Uppercase text: `tracking-wider` (0.05em)
   - Dense text: `tracking-tight` (-0.025em)
   - Standard: `tracking-normal` (0em)
5. **Line Height**:
   - Headings: `leading-tight` (1.25)
   - Body: `leading-relaxed` (1.625)
   - UI: `leading-none` (1)

---

## Spacing & Layout Grid

### Base Spacing System (4px Grid)

| Token | Value | Usage |
|--------|--------|--------|
| 1 | `4px` (0.25rem) | Tight spacing, icons |
| 2 | `8px` (0.5rem) | Small gaps, button padding |
| 3 | `12px` (0.75rem) | Medium gaps, list spacing |
| 4 | `16px` (1rem) | Standard spacing, card padding |
| 5 | `20px` (1.25rem) | Generous spacing, sections |
| 6 | `24px` (1.5rem) | Large gaps, section separation |
| 8 | `32px` (2rem) | X-large spacing, page padding |
| 10 | `40px` (2.5rem) | XX-large spacing, containers |
| 12 | `48px` (3rem) | Hero spacing, major sections |
| 16 | `64px` (4rem) | Container max padding |

### Container Spacing

| Breakpoint | Padding | Usage |
|------------|---------|--------|
| Mobile | `1rem` (16px) | Small screens |
| Tablet | `1.5rem` (24px) | Medium screens |
| Desktop | `2rem` (32px) | Large screens |
| XL | `3rem` (48px) | Extra large screens |

### Gap System

| Token | Value | Usage |
|--------|--------|--------|
| `gap-1` | `4px` | Icon groups, inline elements |
| `gap-2` | `8px` | Small grid items |
| `gap-3` | `12px` | Medium grid items |
| `gap-4` | `16px` | Standard grid items |
| `gap-6` | `24px` | Section separation |
| `gap-8` | `32px` | Large separation |

---

## Shadow System

### Shadow Tokens

| Token | Value | Usage |
|--------|--------|--------|
| `--shadow-sm` | `0 1px 3px rgba(0, 0, 0, 0.1)` | Small cards, buttons |
| `--shadow-md` | `0 4px 6px rgba(0, 0, 0, 0.07)` | Medium cards, panels |
| `--shadow-lg` | `0 10px 15px rgba(0, 0, 0, 0.05)` | Large cards, modals |
| `--shadow-xl` | `0 20px 25px rgba(0, 0, 0, 0.03)` | Popovers, dropdowns |
| `--shadow-primary` | `0 0 20px rgba(139, 92, 246, 0.15)` | Primary glow effects |
| `--shadow-primary-lg` | `0 0 30px rgba(139, 92, 246, 0.25)` | Enhanced primary glow |
| `--shadow-focus` | `0 0 0 3px rgba(139, 92, 246, 0.4)` | Focus rings |
| `--shadow-inner` | `inset 0 1px 2px rgba(0, 0, 0, 0.1)` | Inner glow, pressed states |

### Shadow Usage Rules

1. **Default**: Use `--shadow-sm` for small elements, `--shadow-md` for cards
2. **Hover**: Add `--shadow-primary` glow to interactive elements
3. **Focus**: Always use `--shadow-focus` violet ring on focusable elements
4. **Elevation**: Increase shadow size with element elevation (sm → md → lg → xl)
5. **Glassmorphism**: Combine `--shadow-inner` + `--shadow-lg` for glass cards

---

## Glassmorphism v2

### Glass Card Base

```css
.glass-card {
  background: rgba(15, 15, 15, 0.7);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: var(--shadow-inner), var(--shadow-md);
  border-radius: 1.25rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.glass-card:hover {
  border-color: rgba(255, 255, 255, 0.1);
  box-shadow: var(--shadow-inner), var(--shadow-lg), var(--color-primary-glow);
}
```

### Enterprise Glass (Elevated)

```css
.enterprise-glass {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: var(--shadow-lg);
}
```

### Landing Glass (High Contrast)

```css
.glass-landing {
  background: rgba(5, 5, 5, 0.85);
  backdrop-filter: blur(32px);
  -webkit-backdrop-filter: blur(32px);
  border: 1px solid rgba(255, 255, 255, 0.15);
}
```

### Glassmorphism Usage Rules

1. **Blur**: Always `backdrop-filter: blur(24px)` for standard glass
2. **Background**: `rgba(15, 15, 15, 0.7)` for cards, darker for overlays
3. **Border**: Subtle white `rgba(255, 255, 255, 0.05)` for seamless look
4. **Shadow**: Combine inner glow + outer shadow for depth
5. **Performance**: Use `-webkit-backdrop-filter` for Safari support

---

## Component Variants

### Button Component

| Variant | Colors | Usage |
|---------|--------|--------|
| `primary` | BG: violet-500, Text: white, Glow: violet | Main actions, CTAs |
| `secondary` | BG: surface, Border: border, Text: text-secondary | Secondary actions |
| `outline` | BG: transparent, Border: border, Text: text | Destructive actions, cancel |
| `ghost` | BG: transparent, Border: none, Text: text-secondary | Subtle actions, icons |
| `danger` | BG: danger-500, Text: white | Delete, destructive |
| `success` | BG: success-500, Text: white | Confirm, positive actions |

### Card Component

| Variant | Style | Usage |
|---------|----------|--------|
| `outlined` | Border: border-60, BG: surface | Standard cards |
| `elevated` | Shadow: lg, BG: surface | Highlighted cards |
| `interactive` | Hover: translate-y-1, Glow: primary | Clickable cards |
| `highlight` | Left border: primary-4px | Featured cards |
| `animated` | Hover: scale, rotate, Glow | Animated cards |
| `glass` | Backdrop blur, BG: surface/70 | Glass cards |
| `cyber` | Gradient overlay, Hover: neon glow | Premium cards |

### Badge Component

| Variant | Colors | Usage |
|---------|--------|--------|
| `default` | BG: surface-hover, Border: border | Neutral badges |
| `primary` | BG: primary/10, Text: primary | Primary badges |
| `success` | BG: success/10, Text: success | Success states |
| `danger` | BG: danger/10, Text: danger | Error states |
| `warning` | BG: warning/10, Text: warning | Warning states |

### Input Component

| State | Border | Ring | Usage |
|--------|---------|-------|--------|
| `default` | border | none | Standard input |
| `focus` | primary/30 | focus-ring | Active input |
| `error` | danger | danger-glow | Validation error |
| `disabled` | border-muted | none | Disabled state |

---

## Animation System

### Easing Functions

| Function | Curve | Duration | Usage |
|-----------|----------|-----------|--------|
| `ease-out` | `cubic-bezier(0.4, 0, 0.2, 1)` | 300ms | Standard transitions |
| `spring` | `spring damping: 25, stiffness: 300` | 400ms | Motion animations |
| `bounce` | `cubic-bezier(0.68, -0.55, 0.265, 1.55)` | 500ms | Delightful bounces |
| `sharp` | `cubic-bezier(0, 0, 0.2, 1)` | 150ms | Micro-interactions |

### Animation Durations

| Token | Duration | Usage |
|--------|-----------|--------|
| `fast` | `150ms` | Button press, hover |
| `standard` | `300ms` | Color changes, opacity |
| `slow` | `500ms` | Layout transitions |
| `page` | `400ms` | Page transitions |

### Framer Motion Presets

```tsx
// Page Transition
<motion.div
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -10 }}
  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
/>

// Hover Lift
<motion.div
  whileHover={{ scale: 1.02, y: -2 }}
  whileTap={{ scale: 0.98 }}
  transition={{ type: "spring", damping: 25, stiffness: 300 }}
/>

// Staggered List
{items.map((item, i) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: i * 0.1, duration: 0.4 }}
  />
))}
```

### Animation Usage Rules

1. **Micro-interactions**: 150ms for button press, 300ms for hover
2. **Page transitions**: 400ms with spring easing
3. **Stagger delays**: 0.1s (100ms) between list items
4. **Reduced motion**: Respect `prefers-reduced-motion` - set duration to 0.01ms
5. **Performance**: Use `transform` and `opacity` - avoid layout thrashing

---

## Accessibility Standards

### WCAG AAA Compliance

| Requirement | Standard | Implementation |
|-------------|-----------|----------------|
| **Focus Rings** | 4.5:1 contrast | Violet ring: `0 0 0 3px rgba(139, 92, 246, 0.4)` |
| **Text Contrast** | 7:1 contrast | Ensure all text meets AAA ratio |
| **Touch Targets** | 44x44px minimum | Buttons, links, interactive elements |
| **Keyboard Nav** | Full tab navigation | All interactive elements focusable |
| **Screen Reader** | ARIA labels | Icons, status, live regions |

### Focus States

```css
*:focus-visible {
  outline: none;
  box-shadow: var(--shadow-focus);
}

*:focus-visible:not(:focus-visible) {
  outline: 2px solid var(--color-border-focus);
  box-shadow: var(--shadow-focus);
}
```

### Reduced Motion Support

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### ARIA Labels

```tsx
// Icon-only buttons
<Button aria-label="Close dialog">
  <X />
</Button>

// Live regions
<div aria-live="polite" aria-atomic="true" id="announcements" />

// Status indicators
<Badge aria-label="Active status">Active</Badge>
```

---

## Responsive Breakpoints

### Tailwind v4 Breakpoints

| Breakpoint | Min Width | Usage |
|------------|------------|--------|
| `sm` | `640px` | Small tablets, large phones |
| `md` | `768px` | Tablets, small laptops |
| `lg` | `1024px` | Desktops, laptops |
| `xl` | `1280px` | Large desktops |
| `2xl` | `1536px` | Extra large displays |

### Responsive Patterns

| Screen Size | Sidebar | Grid | Container |
|-------------|---------|-------|------------|
| Mobile (< 1024px) | Hidden, drawer overlay | 1 column | Full width - 32px |
| Tablet (1024px+) | Collapsed (80px) | 2 columns | Max width - 64px |
| Desktop (1280px+) | Full (256px) | 3-4 columns | Max 1600px |

### Safe Areas (iOS)

```css
.safe-area-top { padding-top: env(safe-area-inset-top, 0px); }
.safe-area-bottom { padding-bottom: env(safe-area-inset-bottom, 0px); }
.safe-area-left { padding-left: env(safe-area-inset-left, 0px); }
.safe-area-right { padding-right: env(safe-area-inset-right, 0px); }
```

---

## Utility Classes

### Hover Effects

| Class | Effect | Usage |
|--------|----------|--------|
| `.hover-lift` | Translate Y -2px + glow | Cards, buttons |
| `.hover-scale` | Scale 1.02 + glow | Images, icons |
| `.hover-glow` | Neon violet glow | Interactive elements |
| `.hover-border` | Border becomes primary/30 | Buttons, inputs |

### Micro-interactions

| Class | Effect | Duration |
|--------|----------|-----------|
| `.animate-fade-in` | Opacity 0 → 1 | 300ms |
| `.animate-fade-in-up` | Opacity 0 → 1, Y 20px → 0 | 400ms |
| `.animate-slide-in` | X -20px → 0, Opacity 0 → 1 | 300ms |
| `.animate-pulse` | Opacity 0.5 ↔ 1 | 2s infinite |

### Gradient Text

```css
.gradient-text {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

### Custom Scrollbar

```css
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 9999px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(139, 92, 246, 0.2);
}
```

---

## Component File Structure

```
apps/web/components/ui/
├── Button.tsx           # Primary/outline/ghost/danger/success variants
├── Card.tsx             # Outlined/elevated/interactive/glass/cyber variants
├── Input.tsx            # Form inputs with focus/error states
├── Badge.tsx            # Status badges with color variants
├── Modal.tsx            # Dialog component
├── Table.tsx            # TanStack Table wrapper
├── EmptyState.tsx       # Empty states with illustrations
├── Icon.tsx             # Lucide icon wrapper
├── ConfirmDialog.tsx     # Confirmation dialog
└── ...
```

---

## Implementation Checklist

For every new/updated component, ensure:

- [ ] Uses exact color tokens from palette
- [ ] Implements glassmorphism with proper blur
- [ ] Has hover states with violet glow
- [ ] Focus states with violet ring (WCAG AAA)
- [ ] Reduced motion support via media query
- [ ] Proper ARIA labels on interactive elements
- [ ] 44x44px minimum touch targets
- [ ] Animations use transform/opacity (performance)
- [ ] Comments: `// UI/UX REFINED BY JULES v2`
- [ ] TypeScript strict mode (no `any`)
- [ ] Responsive design for all breakpoints

---

## Design System Version

**Version:** 2.0
**Last Updated:** 2026-03-07
**Maintainer:** Jules (UI/UX Designer)
**Framework:** TanStack Start + Tailwind CSS v4

---

**This design system is the foundation for all MaatWork CRM UI components. Follow these guidelines strictly for consistency and premium feel.**
