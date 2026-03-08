# MaatWork CRM - Design System v2 (Jules)

## 🎨 Color Palette (Dark Mode Only)

The application uses a strict dark mode palette to convey a premium, professional feel.

### Core Backgrounds
- **Background**: `#050505` (Deep black)
- **Surface**: `#0F0F0F` (Dark surface/card)
- **Surface Hover**: `#18181B`

### Primary & Accent
- **Primary**: `#8B5CF6` (violet-500)
  - Hover: `#7C3AED`
  - Light: `#A78BFA`
  - Subtle: `rgba(139, 92, 246, 0.1)`
- **Accent**: `#C026D3` (fuchsia-600)
  - Hover: `#A21CAF`
  - Light: `#E879F9`
  - Subtle: `rgba(192, 38, 211, 0.1)`

### Text
- **Primary**: `#F5F5F5`
- **Secondary**: `#A3A3A3`
- **Muted**: `#737373`
- **Inverse**: `#050505`

### Status
- **Success**: `#22C55E` (soft green)
- **Danger**: `#EF4444`
- **Warning**: `#F59E0B`
- **Info**: `#3B82F6`

---

## 🔤 Typography

- **Display Font**: `Inter`, `Satoshi`, system-ui
- **Body Font**: `Inter`, system-ui
- **Mono Font**: `JetBrains Mono`, monospace

### Font Weights
- Regular: `400`
- Medium: `500`
- Semibold: `600`
- Bold: `700`

---

## 📏 Spacing & Grid

The system uses a strict **4px base grid**.

- `0.5`: 2px
- `1`: 4px
- `2`: 8px
- `3`: 12px
- `4`: 16px
- `5`: 20px
- `6`: 24px
- `8`: 32px
- `10`: 40px
- `12`: 48px
- `16`: 64px

---

## 🌟 Shadows & Elevation (Glassmorphism v2)

The UI relies on soft inner glows and outer violet glows for focus and elevation.

- **sm**: `0 1px 3px rgba(0, 0, 0, 0.1)`
- **md**: `0 4px 6px rgba(0, 0, 0, 0.07)`
- **lg**: `0 10px 15px rgba(0, 0, 0, 0.05)`
- **Primary Glow**: `0 0 20px rgba(139, 92, 246, 0.15)`
- **Focus Ring**: `0 0 0 3px rgba(139, 92, 246, 0.4)`
- **Inner Glow**: `inset 0 1px 2px rgba(0, 0, 0, 0.1)`

### Utility Classes
- `.glass-card`: Standard glassmorphism card with blur and subtle border.
- `.enterprise-glass`: Premium glass effect with linear gradient.
- `.glass-landing`: High-blur glass for landing/hero sections.

---

## 🎬 Animations

Micro-interactions use spring physics for a premium feel.

- **Spring Subtle**: stiffness 300, damping 30
- **Spring Default**: stiffness 400, damping 25
- **Spring Bouncy**: stiffness 500, damping 20

### Hover Effects
- **Lift**: `y: -2`
- **Glow**: `boxShadow: 0 0 20px rgba(139, 92, 246, 0.25)`
- **Scale**: `scale: 1.02`
