# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Proyecto: MaatWork CRM v3

**Stack**: Next.js 16 + React 19 + TypeScript 5.6 · Tailwind CSS v4 + shadcn/ui · Prisma 6 + PostgreSQL · TanStack Query v5 · Framer Motion 12 · Zustand · Recharts · @dnd-kit · Bun runtime

## Comandos Principales

```bash
# Desarrollo
bun run dev              # Dev server (3000) con hot reload
bun run dev:quick        # Dev sin limpiar cache ni matar puerto
bun run dev:clean        # Limpia .next cache antes de iniciar

# Base de datos
bun run db:push          # Push schema a PostgreSQL (dev, sin migraciones)
bun run db:generate       # Generar Prisma client
bun run db:migrate        # Crear migración con historial
bun run db:studio         # Abrir Prisma Studio

# Build y Deploy
bun run build            # Build production con Prisma generate
bun run start            # Start production server desde .next/standalone
bun run lint             # ESLint
bun run lint:fix         # ESLint --fix

# Testing
bun run test             # Vitest (desarrollo)
bun run test:ci          # Vitest --run (CI, sin watch)
bun run test:coverage    # Vitest con coverage
```

**Puerto default**: 3000 · **Memoria recomendada**: 8GB+ · **Package manager**: Bun (no npm/yarn)

## Arquitectura General

### Flujo de datos

```
Browser (React 19)
    ├── App Router (Next.js 16) — Server Components + API Routes
    │       ├── src/app/**/page.tsx    — Páginas
    │       ├── src/app/api/**/route.ts — REST API
    │       └── src/lib/auth.ts         — Middleware de auth (Better Auth)
    │
    ├── TanStack Query v5  — Cache de datos del servidor
    ├── React Hook Form + Zod — Validación de formularios
    ├── Zustand  — Estado global UI (sidebar, modales)
    └── Framer Motion — Animaciones de entrada y transiciones
```

### Providers (src/components/providers.tsx)

```tsx
RootLayout
├── ThemeProvider (next-themes, forcedTheme="dark")
├── QueryClientProvider (TanStack Query, staleTime: 60s)
├── AuthProvider (Better Auth — session via jose HttpOnly cookies)
└── Toaster (sonner, richColors, bottom-right)
```

### Auth (src/lib/auth.ts)

- Usa **Better Auth** (no next-auth v4) con jose para JWT en HttpOnly cookies
- Middleware protege rutas `/api/*` y `/contacts`, `/pipeline`, `/tasks`, `/calendar`, `/teams`, `/reports`, `/training`, `/settings`
- Auto-refresh de sesión cada 5 min + sync entre tabs via localStorage
- Roles: `developer`, `dueno`, `owner`, `manager`, `admin`, `advisor`, `asesor`, `staff`, `member`

### Layout por página

Cada página instancia `AppSidebar` + `AppHeader` directamente — NO hay DashboardLayout wrapper global.

- Sidebar: 220px expandido / 80px colapsado / overlay en mobile
- Content padding: `sidebarCollapsed ? "lg:pl-[80px]" : "lg:pl-[220px]"` (NO 280px)
- Command palette: `Cmd+K` global (src/components/layout/command-palette.tsx)

### API Routes patrón (src/app/api/**/route.ts)

```typescript
// 1. Importar auth y db
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// 2. Auth check en cada handler
const session = await auth();
if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

// 3. Responder
return NextResponse.json(data);
```

## Base de Datos (Prisma + PostgreSQL)

**26 tablas** organizadas en módulos: Auth (User, Session, Account, Member, Organization) · CRM Core (Contact, Deal, Task, Note, PipelineStage, PipelineStageHistory) · Tags (Tag, ContactTag, Segment) · Equipos (Team, TeamMember, TeamGoal) · Calendario (CalendarEvent) · Sistema (Notification, TrainingMaterial, AuditLog) · Instagram (InstagramAccount, Conversation, Message, MessageTag) · Automation (AutomationConfig)

**Pipeline stages por defecto**: Prospecto → Contactado → Primera reunion → Segunda reunion → Apertura → Cliente → Caido → Cuenta vacia

## Sistema de Diseño

**Forced dark theme** (`forcedTheme="dark"` en next-themes).

| Token | Valor | Uso |
|-------|-------|-----|
| Background | `#08090B` | Fondo obsidian |
| Primary | `#8B5CF6` (violet-500) | CTAs, highlights — **usar `violet-*` NO `indigo-*`** |
| Accent | `#A78BFA` (violet-400) | Hover states |
| Card | `bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl` | Cards glass |
| Border normal | `border-white/8` | Separadores sutiles |
| Border hover | `border-white/15` | Hover en elementos |
| Border active | `border-violet-500/20` | Elementos activos |

**Animaciones de entrada** (Framer Motion):
```tsx
initial={{ opacity: 0, y: 12 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
```

Stagger con `.stagger-item` (nth-child delays 0–420ms). KPI cards: línea accent en top + icon con glow + trend badge.

## Directorios a IGNORAR

```
node_modules/          # ~1.1GB dependencias
.next/                 # Build cache
.playwright-mcp/       # MCP de Playwright
.vercel/               # Config Vercel
public/                # Archivos estáticos
*.png, *.jpg, *.gif    # Imágenes
```

## Errores TypeScript Pre-Existentes (no bloquean dev/build)

Estos archivos tienen type mismatches entre react-hook-form y Zod resolver — ignorar, no arregarlos:

- `contact-drawer.tsx` · `calendar/page.tsx` · `create-contact-modal.tsx` · `tasks/page.tsx` · `teams/page.tsx`

## Documentación Relacionada

```
docs/
├── ARCHITECTURE.md    — Diagrama de arquitectura completa
├── DATABASE.md        — Schema Prisma con 26 tablas, relaciones y tipos
├── DESIGN_SYSTEM.md   — Colores, tipografía, spacing, animaciones, tokens CSS
├── LAYOUT.md          — Sidebar, providers, auth context, command palette
├── DEVELOPMENT.md     — Setup, convenciones, debugging, testing
├── PROJECT_SUMMARY.md — Estado actual, módulos implementados, stats
└── api-endpoints.md   — Endpoints REST documentados
```
