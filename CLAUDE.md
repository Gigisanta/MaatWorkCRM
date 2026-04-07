# CLAUDE.md - MaatWork CRM v3

## Información del Proyecto

- **Tipo**: Next.js 15 CRM con App Router
- **UI**: Tailwind CSS + shadcn/ui + Radix UI
- **Base de datos**: PostgreSQL + Prisma ORM
- **Auth**: NextAuth.js
- **Gestor**: Bun
- **Testing**: Vitest + Playwright

## Estructura del Proyecto

```
maatworkcrmv3/
├── src/
│   ├── app/              # App Router (Next.js 15)
│   ├── components/      # Componentes React
│   ├── lib/             # Utilidades y configuraciones
│   └── types/           # Tipos TypeScript
├── prisma/
│   └── schema.prisma    # Schema de base de datos
└── docs/                # Documentación (46 archivos)
```

## Comandos Principales

```bash
# Desarrollo
bun run dev              # Iniciar dev server
bun run dev:quick        # Dev sin limpiar cache

# Base de datos
bun run db:push          # Push schema a DB
bun run db:generate      # Generar Prisma client
bun run db:migrate       # Migraciones
bun run db:studio        # Abrir Prisma Studio

# Build y Deploy
bun run build            # Build production
bun run start            # Start production server

# Testing
bun run test            # Run tests (Vitest)
bun run test:ci          # CI mode tests
bun run test:coverage    # Tests con coverage
```

## Directorios a IGNORAR

Claude Code debe ignorar estos directorios para mejorar rendimiento:

```
node_modules/            # 1.1GB - dependencias (NO indexar)
.next/                   # Cache de build (NO indexar)
.playwright-mcp/         # MCP de Playwright (NO indexar)
.vercel/                 # Config Vercel (NO indexar)
public/                  # Archivos estáticos (ignorar en búsquedas)
*.png, *.jpg, *.gif      # Imágenes (ignorar)
```

## Patrones de Código

- **Componentes**: Usar shadcn/ui como base
- **Estado**: React hooks (useState, useEffect)
- **Forms**: React Hook Form + Zod
- **DB**: Prisma con PostgreSQL
- **Auth**: NextAuth.js con providers configurados

## Configuración de Linting

- ESLint configurado en `eslint.config.mjs`
- Prettier configurado en `components.json`
- TypeScript strict mode habilitado

## Notas Importantes

- Proyecto usa **Bun** como package manager (no npm/yarn)
- Memoria: 8GB+ recomendado para desarrollo
- Puerto default: 3000

---

**Última actualización**: 2026-04-06
