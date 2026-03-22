# MaatWork CRM - Design System

## Tabla de Contenidos
1. [Visión General](#visión-general)
2. [Paleta de Colores](#paleta-de-colores)
3. [Sistema de Tipografía](#sistema-de-tipografía)
4. [Espaciado y Tamaños](#espaciado-y-tamaños)
5. [Sombras](#sombras)
6. [Radio de Borde](#radio-de-borde)
7. [Animaciones](#animaciones)
8. [Tokens CSS](#tokens-css)

---

## Visión General

| Propiedad | Valor |
|-----------|-------|
| Nombre del Brand | MaatWork |
| Tipografía Display | Outfit |
| Tipografía Body | DM Sans |
| Tipografía Mono | Geist Mono |
| Tema Default | Dark |

---

## Paleta de Colores

### Colores Primarios (Purple - CTAs, Highlights)

| Token | Hex | HSL | Uso |
|-------|-----|-----|-----|
| primary-50 | #f5f3ff | 266 96% 96% | Fondos sutiles |
| primary-100 | #ede9fe | 266 96% 94% | Hover states |
| primary-200 | #ddd6fe | 266 96% 89% | Bordes suaves |
| primary-300 | #c4b5fd | 266 96% 84% | Estados intermedios |
| primary-400 | #a78bfa | 266 92% 82% | Dark mode primary |
| **primary-500** | **#8b5cf6** | **266 96% 76%** | **Color principal** |
| primary-600 | #7c3aed | 266 96% 73% | Hover principal |
| primary-700 | #6d28d9 | 266 96% 70% | Active state |
| primary-800 | #5b21b6 | 266 96% 67% | Dark mode hover |
| primary-900 | #4c1d95 | 266 96% 63% | Dark mode active |
| primary-950 | #2e1065 | 266 96% 54% | Dark mode más oscuro |

### Colores Secundarios (Warm Stone/Black - Professional, Grounded)

| Token | Hex | HSL | Uso |
|-------|-----|-----|-----|
| secondary-50 | #fafaf9 | 20 6% 98% | Fondos sutiles |
| secondary-100 | #f5f5f4 | 20 6% 96% | Hover backgrounds |
| secondary-200 | #e7e5e4 | 20 5% 92% | Bordes suaves |
| secondary-300 | #d6d3d1 | 20 5% 86% | Estados intermedios |
| secondary-400 | #a8a29e | 20 5% 76% | Text muted |
| secondary-500 | #78716c | 20 5% 67% | Text secondary |
| secondary-600 | #57534e | 20 5% 58% | Text secondary hover |
| secondary-700 | #44403c | 20 5% 50% | Dark mode text |
| secondary-800 | #292524 | 20 6% 35% | Dark mode surface |
| **secondary-900** | **#1c1917** | **20 6% 27%** | **Color base negro** |
| secondary-950 | #0c0a09 | 20 6% 15% | Dark mode background |

### Colores Acent (Soft Green - Growth, Success)

| Token | Hex | HSL | Uso |
|-------|-----|-----|-----|
| accent-50 | #ecfdf5 | 160 84% 96% | Fondos sutiles |
| accent-100 | #d1fae5 | 160 84% 90% | Hover backgrounds |
| accent-200 | #a7f3d0 | 160 84% 85% | Bordes suaves |
| accent-300 | #6ee7b7 | 160 84% 80% | Estados intermedios |
| accent-400 | #34d399 | 160 64% 52% | Dark mode accent |
| **accent-500** | **#10b981** | **160 84% 39%** | **Color accent principal** |
| accent-600 | #059669 | 160 84% 35% | Hover accent |
| accent-700 | #047857 | 160 84% 32% | Active accent |
| accent-800 | #065f46 | 160 84% 29% | Dark mode accent |
| accent-900 | #064e3b | 160 84% 26% | Dark mode más oscuro |
| accent-950 | #022c22 | 160 84% 20% | Dark mode最深 |

### Colores de Status

#### Success (Green)

| Token | Hex |
|-------|-----|
| success-50 | #f0fdf4 |
| success-100 | #dcfce7 |
| success-200 | #bbf7d0 |
| success-300 | #86efac |
| success-400 | #4ade80 |
| **success-500** | **#22c55e** |
| success-600 | #16a34a |
| success-700 | #15803d |
| success-800 | #166534 |
| success-900 | #14532d |
| success-950 | #052e16 |

#### Warning (Orange)

| Token | Hex |
|-------|-----|
| warning-50 | #fff7ed |
| warning-100 | #ffedd5 |
| warning-200 | #fed7aa |
| warning-300 | #fdba74 |
| warning-400 | #fb923c |
| **warning-500** | **#f97316** |
| warning-600 | #ea580c |
| warning-700 | #c2410c |
| warning-800 | #9a3412 |
| warning-900 | #7c2d12 |
| warning-950 | #431407 |

#### Error (Red)

| Token | Hex |
|-------|-----|
| error-50 | #fef2f2 |
| error-100 | #fee2e2 |
| error-200 | #fecaca |
| error-300 | #fca5a5 |
| error-400 | #f87171 |
| **error-500** | **#ef4444** |
| error-600 | #dc2626 |
| error-700 | #b91c1c |
| error-800 | #991b1b |
| error-900 | #7f1d1d |
| error-950 | #450a0a |

#### Info (Blue)

| Token | Hex |
|-------|-----|
| info-50 | #eff6ff |
| info-100 | #dbeafe |
| info-200 | #bfdbfe |
| info-300 | #93c5fd |
| info-400 | #60a5fa |
| **info-500** | **#3b82f6** |
| info-600 | #2563eb |
| info-700 | #1d4ed8 |
| info-800 | #1e40af |
| info-900 | #1e3a8a |
| info-950 | #172554 |

### Colores Joy (Orange/Yellow - Delight)

| Token | Hex |
|-------|-----|
| joy-50 | #fffbeb |
| joy-100 | #fef3c7 |
| joy-200 | #fde68a |
| joy-300 | #fcd34d |
| joy-400 | #fbbf24 |
| **joy-500** | **#f59e0b** |
| joy-600 | #d97706 |
| joy-700 | #b45309 |
| joy-800 | #92400e |
| joy-900 | #78350f |
| joy-950 | #451a03 |

### Colores de Superficie (Surface)

| Token | Hex | Uso |
|-------|-----|-----|
| surface-white | #ffffff | Cartas, elementos elevados |
| surface-cream | #fdfcf8 | Background principal light |
| surface-light | #fafaf9 | Superficies secundarias |
| surface-dark | #1c1917 | Dark mode surface |
| surface-darker | #0c0a09 | Dark mode background |

---

## Sistema de Tipografía

### Familias de Fuentes

```css
/* Display - Para títulos */
--font-outfit: 'Outfit', system-ui, sans-serif;

/* Body - Para texto general */
--font-dm-sans: 'DM Sans', system-ui, sans-serif;

/* Mono - Para código */
--font-geist-mono: 'Geist Mono', Consolas, monospace;
```

### Tamaños de Fuente

| Token | rem | px | Uso |
|-------|-----|-----|-----|
| text-xs | 0.75rem | 12px | Labels pequeños, badges |
| text-sm | 0.875rem | 14px | Texto secundario |
| text-base | 1rem | 16px | Texto principal |
| text-lg | 1.125rem | 18px | Texto destacado |
| text-xl | 1.25rem | 20px | Subtítulos |
| text-2xl | 1.5rem | 24px | Títulos pequeños |
| text-3xl | 1.875rem | 30px | Títulos de sección |
| text-4xl | 2.25rem | 36px | Títulos grandes |
| text-5xl | 3rem | 48px | Display pequeño |
| text-6xl | 3.75rem | 60px | Display medio |
| text-7xl | 4.5rem | 72px | Display grande |
| text-8xl | 6rem | 96px | Hero text |

### Tamaños Display (con tracking especial)

| Token | Size | Line Height | Letter Spacing |
|-------|------|-------------|----------------|
| display-2xl | 4.5rem (72px) | 1.1 | -0.02em |
| display-xl | 3.75rem (60px) | 1.1 | -0.02em |
| display-lg | 3rem (48px) | 1.2 | -0.02em |
| display-md | 2.25rem (36px) | 1.25 | -0.02em |
| display-sm | 1.875rem (30px) | 1.3 | -0.01em |
| display-xs | 1.5rem (24px) | 1.4 | -0.01em |

### Pesos de Fuente

| Token | Valor | Uso |
|-------|-------|-----|
| font-normal | 400 | Texto regular |
| font-medium | 500 | Texto énfasis |
| font-semibold | 600 | Labels, botones |
| font-bold | 700 | Títulos, highlights |

### Line Heights

| Token | Valor | Uso |
|-------|-------|-----|
| leading-none | 1 | Títulos tight |
| leading-tight | 1.25 | Subtítulos |
| leading-snug | 1.375 | Textos destacados |
| leading-normal | 1.5 | Texto base |
| leading-relaxed | 1.625 | Textos largos |
| leading-loose | 2 | Textos muy espaciados |

### Letter Spacing

| Token | Valor | Uso |
|-------|-------|-----|
| tracking-tighter | -0.05em | Títulos grandes |
| tracking-tight | -0.025em | Subtítulos |
| tracking-normal | 0em | Texto normal |
| tracking-wide | 0.025em | Labels |
| tracking-wider | 0.05em | Tags, badges |
| tracking-widest | 0.1em | headlines |

---

## Espaciado y Tamaños

### Sistema de Spacing (Tailwind)

| Token | rem | px | Uso común |
|-------|-----|-----|-----------|
| spacing-0 | 0rem | 0px | - |
| spacing-0.5 | 0.125rem | 2px | Separación mínima |
| spacing-1 | 0.25rem | 4px | Entre elementos cercanos |
| spacing-1.5 | 0.375rem | 6px | Padding interno |
| spacing-2 | 0.5rem | 8px | Gap pequeño |
| spacing-2.5 | 0.625rem | 10px | Padding inputs |
| spacing-3 | 0.75rem | 12px | Margen interno |
| spacing-3.5 | 0.875rem | 14px | Padding botones sm |
| spacing-4 | 1rem | 16px | Padding base |
| spacing-5 | 1.25rem | 20px | Gap componentes |
| spacing-6 | 1.5rem | 24px | Padding cards |
| spacing-7 | 1.75rem | 28px | Secciones |
| spacing-8 | 2rem | 32px | Margen secciones |
| spacing-9 | 2.25rem | 36px | Headers |
| spacing-10 | 2.5rem | 40px | Padding lg |
| spacing-12 | 3rem | 48px | Secciones grandes |
| spacing-16 | 4rem | 64px | Page padding |
| spacing-20 | 5rem | 80px | Espaciado hero |
| spacing-24 | 6rem | 96px | Secciones majeures |

### Breakpoints

| Breakpoint | px | Descripción |
|------------|-----|-------------|
| xs | 475px | Phones landscape |
| sm | 640px | Tablets portrait |
| md | 768px | Tablets landscape |
| lg | 1024px | Laptops pequeñas |
| xl | 1280px | Desktops |
| 2xl | 1536px | Large desktops |

### Tamaños de Componentes

#### Button Heights

| Size | Height | Padding | Font Size |
|------|--------|---------|-----------|
| sm | 36px (h-9) | px-3 py-1.5 | text-sm |
| md | 40px (h-10) | px-4 py-2 | text-sm |
| lg | 48px (h-12) | px-6 py-3 | text-base |

#### Input Heights

| Size | Height | Padding |
|------|--------|---------|
| sm | 36px (h-9) | px-3 |
| md | 40px (h-10) | px-3 |
| lg | 48px (h-12) | px-4 |

#### Icon Sizes

| Token | Size | Uso |
|-------|------|-----|
| icon-sm | 16px | Inputs, badges |
| icon-md | 18px | Sidebar desktop |
| icon-lg | 20px | Botones, headers |
| icon-xl | 22px | Mobile sidebar |
| icon-2xl | 24px | Features |

---

## Sombras

### Sombras Light Mode

| Token | CSS | Uso |
|-------|-----|-----|
| shadow-sm | 0 2px 4px -1px rgb(28 25 23 / 0.04), 0 1px 2px -1px rgb(28 25 23 / 0.04) | Elementos sutiles |
| shadow-base | 0 4px 6px -1px rgb(28 25 23 / 0.08), 0 2px 4px -2px rgb(28 25 23 / 0.08) | Cards básicos |
| shadow-md | 0 8px 16px -2px rgb(28 25 23 / 0.08), 0 4px 8px -2px rgb(28 25 23 / 0.04) | Dropdowns |
| shadow-lg | 0 12px 24px -4px rgb(28 25 23 / 0.1), 0 6px 12px -4px rgb(28 25 23 / 0.06) | Modals |
| shadow-xl | 0 20px 40px -8px rgb(28 25 23 / 0.12), 0 10px 20px -8px rgb(28 25 23 / 0.04) | Dialogs grandes |
| shadow-2xl | 0 25px 50px -12px rgb(28 25 23 / 0.25) | Notificaciones |
| shadow-primary | 0 10px 30px -4px rgba(139, 92, 246, 0.2), 0 6px 14px -4px rgba(139, 92, 246, 0.15) | Botones primary |
| shadow-primary-lg | 0 20px 40px -6px rgba(139, 92, 246, 0.3), 0 12px 24px -6px rgba(139, 92, 246, 0.2) | Primary hover |
| shadow-joy | 0 10px 30px -4px rgba(245, 158, 11, 0.15), 0 6px 14px -4px rgba(245, 158, 11, 0.1) | Botones joy |
| shadow-accent | 0 10px 30px -4px rgba(16, 185, 129, 0.15), 0 6px 14px -4px rgba(16, 185, 129, 0.1) | Botones accent |

### Sombras Dark Mode

| Token | CSS |
|-------|-----|
| shadow-dark-sm | 0 2px 4px -1px rgba(0, 0, 0, 0.4) |
| shadow-dark-md | 0 8px 16px -2px rgba(0, 0, 0, 0.4) |
| shadow-dark-lg | 0 12px 24px -4px rgba(0, 0, 0, 0.5) |
| shadow-dark-primary | 0 10px 30px -4px rgba(139, 92, 246, 0.3), 0 6px 14px -4px rgba(139, 92, 246, 0.2) |

---

## Radio de Borde

| Token | rem | px | Uso |
|-------|-----|-----|-----|
| radius-none | 0px | 0px | Sin radio |
| radius-sm | 0.25rem | 4px | Inputs, buttons |
| radius-base | 0.375rem | 6px | Elementos pequeños |
| radius-md | 0.5rem | 8px | Cards, buttons |
| radius-lg | 0.75rem | 12px | Modals, dropdowns |
| radius-xl | 1rem | 16px | Cards grandes |
| radius-2xl | 1.5rem | 24px | Imágenes, features |
| radius-3xl | 2rem | 32px | Secciones |
| radius-full | 9999px | 9999px | Pills, avatars, badges |

---

## Animaciones

### Duraciones

| Token | Valor | Uso |
|-------|-------|-----|
| transition-fast | 100ms | Micro-interacciones |
| transition-base | 200ms | Transiciones normales |
| transition-normal | 300ms | Animaciones suaves |
| transition-slow | 500ms | Transiciones grandes |
| transition-slower | 700ms | Page transitions |

### Timing Functions

| Token | Valor | Uso |
|-------|-------|-----|
| ease | cubic-bezier(0.25, 0.1, 0.25, 1) | Default |
| spring | cubic-bezier(0.34, 1.56, 0.64, 1) | Bounce effects |
| smooth | cubic-bezier(0.4, 0, 0.2, 1) | Enter/Exit |
| bouncy | cubic-bezier(0.68, -0.55, 0.265, 1.55) | Joy effects |

### Keyframe Animations

#### Fade Animations
- `fade-in`: Opacity 0 → 1 (300ms)
- `fade-in-up`: Opacity 0 → 1, translateY(20px → 0) (400ms)
- `fade-in-down`: Opacity 0 → 1, translateY(-20px → 0) (400ms)
- `fade-in-left`: Opacity 0 → 1, translateX(-20px → 0) (400ms)
- `fade-in-right`: Opacity 0 → 1, translateX(20px → 0) (400ms)

#### Scale Animations
- `scale-in`: Opacity 0 → 1, scale(0.95 → 1) (300ms)
- `scale-in-bounce`: Opacity 0 → 1, scale(0.9 → 1) con bounce (400ms)
- `scale-in-elastic`: Elastic bounce effect (500ms)

#### Slide Animations
- `slide-in-scale`: scale(0.92) + translateY(10px) → scale(1) (350ms)
- `slide-in-bottom`: translateY(100%) → translateY(0) (400ms)
- `slide-in-top`: translateY(-100%) → translateY(0) (400ms)
- `slide-in-left`: translateX(-100%) → translateX(0) (400ms)
- `slide-in-right`: translateX(100%) → translateX(0) (400ms)

#### Continuous Animations
- `shimmer`: Background position animation (1.5s infinite)
- `skeleton-wave`: Loading skeleton effect (1.8s infinite)
- `pulse-soft`: Soft pulse (2s infinite)
- `float`: Float up/down effect (3s infinite)
- `purple-glow`: Purple glow pulse (2s infinite)
- `spin`: 360° rotation (1s infinite)
- `bounce`: Y translation bounce (1s infinite)

#### Interactive Animations
- `ripple`: Click ripple effect (0.6s)
- `subtle-pop`: Pop in animation (0.3s)
- `shake`: Shake effect (0.5s)
- `expand`: Expand from center (0.3s)

#### Page Transitions
- `page-enter`: fade-in-up (400ms)
- `reveal-up`: Opacity + translateY(30px) (600ms)

### Clases de Animación Disponibles

```css
.animate-fade-in-up
.animate-slide-in-left
.animate-slide-in-right
.animate-scale-in
.animate-float
.animate-pulse-slow
.animate-blob
.animate-whatsapp-pulse
.animate-count-up

/* Staggered delays */
.animate-delay-100 { animation-delay: 100ms; }
.animate-delay-200 { animation-delay: 200ms; }
.animate-delay-300 { animation-delay: 300ms; }
.animate-delay-400 { animation-delay: 400ms; }
.animate-delay-500 { animation-delay: 500ms; }
.animate-delay-600 { animation-delay: 600ms; }
.animate-delay-700 { animation-delay: 700ms; }
.animate-delay-800 { animation-delay: 800ms; }
```

---

## Tokens CSS

### Variables CSS Globales (globals.css)

```css
:root {
  /* shadcn Compatibility */
  --background: 0 0% 100%;
  --foreground: 0 0% 0%;
  --card: 0 0% 100%;
  --card-foreground: 0 0% 0%;
  --popover: 0 0% 100%;
  --popover-foreground: 0 0% 0%;
  
  /* Primary: #8b5cf6 */
  --primary: 266 96% 76%;
  --primary-foreground: 0 0% 100%;
  
  --secondary: 0 0% 0%;
  --secondary-foreground: 0 0% 100%;
  
  --muted: 0 0% 98%;
  --muted-foreground: 0 0% 26%;
  
  /* Accent: #10b981 */
  --accent: 160 84% 39%;
  --accent-foreground: 0 0% 0%;
  
  /* Destructive: #ef4444 */
  --destructive: 0 84% 60%;
  --destructive-foreground: 0 0% 100%;
  
  --border: 0 0% 88%;
  --input: 0 0% 88%;
  --ring: 266 96% 76%;
  
  /* Status Colors */
  --success: 142 71% 45%;
  --warning-text: 45 93% 47%;
  --info: 217 91% 60%;
  
  --radius: 0.5rem;
  
  /* Table Row Colors */
  --row-client-bg: 142 70% 96%;
  --row-client-border: 142 76% 36%;
  --row-no-interaction-bg: 0 100% 98%;
  --row-no-interaction-border: 0 84% 60%;
  
  --color-surface: #fafaf9;
  --color-surface-hover: #f5f5f4;
}

.dark,
[data-theme='dark'] {
  --background: 0 0% 4%;
  --foreground: 0 0% 100%;
  --card: 0 0% 8%;
  --card-foreground: 0 0% 100%;
  --popover: 0 0% 8%;
  --popover-foreground: 0 0% 100%;
  
  /* Primary Dark: #a78bfa */
  --primary: 261 92% 82%;
  --primary-foreground: 0 0% 100%;
  
  --secondary: 0 0% 100%;
  --secondary-foreground: 0 0% 0%;
  
  --muted: 0 0% 12%;
  --muted-foreground: 0 0% 69%;
  
  /* Accent Dark: #34d399 */
  --accent: 158 64% 52%;
  --accent-foreground: 0 0% 0%;
  
  --destructive: 0 84% 60%;
  --destructive-foreground: 0 0% 100%;
  
  --border: 0 0% 18%;
  --input: 0 0% 18%;
  --ring: 261 92% 82%;
  
  /* Status Colors (Dark) */
  --success: 142 60% 35%;
  --warning-text: 45 80% 45%;
  --info: 217 80% 55%;
  
  --color-surface: #1c1917;
  --color-surface-hover: #292524;
}
```

---

## Uso en Tailwind

### Clases Tailwind Derivadas

```css
/* Colores */
bg-primary, text-primary, border-primary
hover:bg-primary-hover, hover:bg-primary-active
bg-primary-light, bg-primary-subtle
text-primary-foreground

bg-secondary, text-secondary, border-secondary
bg-accent, text-accent, border-accent

bg-success, text-success, border-success
bg-warning, text-warning, border-warning
bg-error, text-error, border-error
bg-info, text-info, border-info

bg-surface, bg-surface-hover
text-text, text-text-secondary, text-text-muted
border-border, hover:border-border-hover

/* Sombras */
shadow-sm, shadow-md, shadow-lg, shadow-xl
shadow-primary, shadow-primary-lg

/* Border Radius */
rounded-sm, rounded, rounded-md, rounded-lg
rounded-xl, rounded-2xl, rounded-3xl, rounded-full

/* Tipografía */
font-display, font-body, font-mono
text-display-2xl, text-display-xl, etc.
tracking-tighter, tracking-tight, tracking-wide

/* Animaciones */
animate-fade-in, animate-fade-in-up, animate-scale-in
animate-spin, animate-bounce, animate-pulse
animate-float, animate-shimmer

/* Transiciones */
transition-all-smooth (custom class)
duration-fast, duration-base, duration-slow
```

---

## Notas

Este documento describe el sistema de diseño actual del proyecto MaatWork CRM.
El proyecto utiliza **shadcn/ui** como base para los componentes.
