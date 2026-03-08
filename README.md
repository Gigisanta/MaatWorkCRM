# MaatWork CRM

CRM profesional para asesores financieros. Gestiona clientes, pipeline de ventas, tareas, equipos y objetivos con una interfaz moderna y automatizaciones inteligentes.

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| **Framework** | [TanStack Start](https://tanstack.com/start) (SSR + SPA) |
| **Router** | TanStack Router (file-based, type-safe) |
| **State** | TanStack Query (server state, caching, optimistic updates) |
| **Auth** | [better-auth](https://www.better-auth.com/) (email/password + Google OAuth) |
| **Database** | PostgreSQL — [Neon](https://neon.tech/) (serverless) |
| **ORM** | [Drizzle ORM](https://orm.drizzle.team/) (type-safe SQL) |
| **Automations** | [Inngest](https://www.inngest.com/) (event-driven background jobs) |
| **UI** | Tailwind CSS v4 + Lucide Icons + glassmorphism design system |
| **Monorepo** | Turborepo + pnpm workspaces |
| **Testing** | Vitest (unit) + Playwright (E2E) |
| **Linting** | Biome (lint + format) |
| **CI/CD** | GitHub Actions |

## Módulos

1. **Dashboard** — KPIs, actividad reciente, acciones rápidas, resumen pipeline
2. **Contactos** — CRUD, búsqueda, filtros, tags, segmentos, estados
3. **Pipeline** — Kanban drag-and-drop, deals con valor/probabilidad, 5 etapas
4. **Tareas** — Prioridades, vencimientos, recurrencia, asignación
5. **Equipos** — Miembros, líderes, objetivos mensuales con progreso
6. **Calendario** — Vista mensual, eventos compartidos del equipo
7. **Reportes** — Gráficos, métricas, tendencias, exportación CSV/PDF
8. **Capacitación** — Material categorizado (guías, videos, documentos, cursos)
9. **Configuración** — Perfil, organización, notificaciones
10. **Auditoría** — Log completo de acciones (admin only)

## Quick Start

```bash
# 1. Clonar e instalar
git clone https://github.com/your-org/MaatWorkCRM.git
cd MaatWorkCRM
pnpm install

# 2. Configurar variables de entorno
cp .env.example apps/web/.env
# Editar .env con:
#   DATABASE_URL=postgresql://...@...neon.tech/neondb?sslmode=require
#   BETTER_AUTH_SECRET=tu-secreto-seguro
#   GOOGLE_CLIENT_ID=... (opcional)
#   GOOGLE_CLIENT_SECRET=... (opcional)

# 3. Setup base de datos
cd apps/web
pnpm db:push      # Push schema a Neon
pnpm db:seed      # Cargar datos demo

# 4. Iniciar desarrollo
pnpm dev          # http://localhost:3000
```

## Estructura del Proyecto

```
MaatWorkCRM/
├── apps/web/
│   ├── app/
│   │   ├── routes/              # 12 rutas (file-based routing)
│   │   │   ├── __root.tsx       # HTML shell + SEO meta
│   │   │   ├── _app.tsx         # Layout autenticado (sidebar)
│   │   │   ├── _app/dashboard   # Dashboard con KPIs
│   │   │   ├── _app/contacts    # Lista de contactos
│   │   │   ├── _app/pipeline    # Kanban board
│   │   │   ├── _app/tasks       # Gestión de tareas
│   │   │   ├── _app/teams       # Equipos y metas
│   │   │   ├── _app/calendar    # Calendario compartido
│   │   │   ├── _app/reports     # Reportes y analytics
│   │   │   ├── _app/training    # Capacitaciones
│   │   │   ├── _app/settings    # Config + auditoría
│   │   │   └── _auth/login      # Login page
│   │   ├── components/layout/   # Sidebar component
│   │   ├── lib/                 # Utils, validations, auth client
│   │   └── styles/globals.css   # Design tokens + dark theme
│   ├── server/
│   │   ├── auth/                # better-auth config
│   │   ├── db/schema/           # 14 tablas PostgreSQL (Drizzle)
│   │   ├── db/seed.ts           # Datos demo
│   │   ├── functions/           # Server functions (CRUD)
│   │   └── inngest/             # 3 automatizaciones
│   ├── tests/                   # Vitest unit tests
│   └── e2e/                     # Playwright E2E tests
├── .github/workflows/ci.yml    # GitHub Actions pipeline
├── biome.json                   # Linter config
├── turbo.json                   # Monorepo pipeline
└── .env.example                 # Template de variables
```

## Base de Datos (14 Tablas)

| Módulo | Tablas |
|--------|--------|
| Auth | `users`, `sessions`, `accounts`, `verifications`, `organizations`, `members` |
| CRM | `contacts`, `pipelineStages`, `deals`, `notes`, `attachments`, `tasks` |
| Colaboración | `teams`, `teamMembers`, `teamGoals`, `calendarEvents` |
| Sistema | `notifications`, `trainingMaterials`, `auditLogs` |

## Scripts

```bash
# Desarrollo
pnpm dev                    # Dev server (puerto 3000)
pnpm build                  # Build producción
pnpm start                  # Iniciar producción

# Base de datos
pnpm --filter web db:push   # Push schema a Neon
pnpm --filter web db:seed   # Seed datos demo
pnpm --filter web db:studio # Drizzle Studio UI

# Testing
pnpm --filter web test          # Vitest unit tests
pnpm --filter web test:e2e      # Playwright E2E tests

# Code Quality
pnpm --filter web lint          # Biome lint
pnpm --filter web lint:fix      # Biome auto-fix
```

## Automatizaciones (Inngest)

| Función | Trigger | Acción |
|---------|---------|--------|
| `onContactActivated` | Contact status → active | Enviar notificación de bienvenida |
| `onTaskOverdue` | Cron diario | Detectar tareas vencidas y alertar |
| `onGoalNearTarget` | Goal ≥ 80% progress | Notificar líder del equipo |

## Datos Demo (Seed)

El seed incluye:

- **Organización**: MaatWork Demo
- **Usuarios**: Carlos Admin (admin), Ana García (senior), Pedro Ruiz (junior)
- **Contactos**: María López, Juan Martínez, Lucía Fernández, Roberto Sánchez, Elena Torres
- **Pipeline**: 5 etapas + 4 deals con valores
- **Tareas**: 5 tareas con prioridades y vencimientos
- **Equipo Alfa**: 2 miembros + 2 objetivos mensuales
- **Logs de auditoría**: Historial de acciones del sistema

## Deploy

### Vercel (recomendado)

```bash
# Instalar Vercel CLI
pnpm add -g vercel

# Deploy
cd apps/web
vercel --prod
```

Variables necesarias en Vercel:

- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL` (tu dominio)
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`

## Documentación Adicional

- [Testing Reports](./docs/testing/) — Reportes completos de testing
- [Implementation Progress](./docs/implementation/) — Progreso de implementación de features
- [Architecture](./docs/architecture/) — Decisiones técnicas y análisis
- [Screenshots](./docs/screenshots/) — Capturas de pantalla de la UI

## Contribuir

Lee nuestra [Guía de Contribución](./CONTRIBUTING.md) antes de hacer contribuciones.

## Licencia

MIT License — ver [LICENSE](./LICENSE) para más detalles.
