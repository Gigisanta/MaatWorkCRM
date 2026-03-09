# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.0.0] - 2025-03-08

### Added

- **Pipeline Kanban** - Drag-and-drop con 8 etapas (Prospecto → Cliente → Caido → Cuenta vacia)
- **Dashboard** con métricas, Google Calendar personal
- **Contact Drawer** - Panel lateral con detalles completos al hacer click
- **Team Calendar** - Calendario del equipo con eventos
- **Google Calendar Integration** - Sincronización bidireccional
- **Drawer Component** - Componente UI reutilizable

### Performance

- Vite code splitting: vendor-ui, vendor-motion, vendor-router chunks
- QueryClient: staleTime 5min, gcTime 30min
- Router: defaultPreload intent, zero preloadStaleTime
- tsconfig incremental build enabled
- vercel.json con headers de cache y seguridad

### Fixed

- Contactos no cargaban - Faltaba columna pipeline_stage_id
- Dropdown de etapas no se abría en contactos
- Panel de contacto no funcionaba

### Database

- Migración para agregar pipeline_stage_id a contacts
- 8 pipeline stages en seed

---

## [1.0.0] - 2024-03-07

### Added

- Complete CRM core functionality
- Contact management with CRUD operations
- Pipeline management with Kanban board
- Task management with priorities and assignments
- Team collaboration with goals tracking
- Calendar integration for event scheduling
- Analytics and reporting with AI insights
- Command palette for quick navigation
- Authentication with better-auth
- Database schema with Drizzle ORM

### Features

- Dashboard with KPIs and real-time updates
- Contact directory with search and filters
- Visual pipeline with deal tracking
- Task management with overdue detection
- Team management with goal progress
- Monthly calendar view
- Reports with CSV/PDF export
- Global search with command palette
- Responsive design with dark mode support

---

## Migration from ERP.MaatWork

This is the next generation of MaatWork CRM, rebuilt from the ground up with modern technologies:

- TanStack Start for SSR + SPA
- TanStack Router for type-safe routing
- Drizzle ORM for type-safe database operations
- Tailwind CSS v4 for styling
- Radix UI for accessible components
- Framer Motion for animations

Migration documentation available in `docs/architecture/`.
