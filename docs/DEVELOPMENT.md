# Guía de Desarrollo

## Configuración del Entorno

### Requisitos Previos

- **Node.js** 18.17 o superior
- **Bun** 1.0 o superior
- **Git**
- **VS Code** (recomendado)

### Extensiones Recomendadas para VS Code

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "Prisma.prisma",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

### Instalación Inicial

```bash
# Clonar repositorio
git clone <repo-url>
cd maatwork-crm

# Instalar dependencias
bun install

# Configurar variables de entorno
cp .env.example .env

# Inicializar base de datos
bun run db:push
bun run db:seed

# Iniciar servidor
bun dev
```

### Variables de Entorno

```env
# Base de datos
DATABASE_URL="file:./dev.db"

# Autenticación (next-auth v4)
NEXTAUTH_SECRET="super-secret-key-change-in-production"
NEXTAUTH_URL="http://localhost:3000"

# OAuth (opcional)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

---

## Comandos Disponibles

| Comando | Descripción |
|---------|-------------|
| `bun dev` | Servidor de desarrollo |
| `bun build` | Build de producción |
| `bun start` | Servidor de producción |
| `bun run lint` | Linting con ESLint |
| `bun run test` | Tests en watch mode |
| `bun run test:ci` | Tests una vez (CI) |
| `bun run test:coverage` | Tests con coverage |
| `bun run db:push` | Sincronizar schema con DB |
| `bun run db:migrate` | Crear migración |
| `bun run db:seed` | Poblar con datos demo |
| `bun run db:generate` | Generar cliente Prisma |

---

## Estructura de Archivos

### Páginas

```
src/app/
├── page.tsx           # Dashboard (/)
├── login/page.tsx     # Login
├── register/page.tsx  # Registro
├── contacts/
│   └── page.tsx       # Lista de contactos
├── pipeline/
│   └── page.tsx       # Pipeline Kanban
├── tasks/
│   └── page.tsx       # Gestión de tareas
├── teams/
│   └── page.tsx       # Equipos
├── calendar/
│   └── page.tsx       # Calendario
├── reports/
│   └── page.tsx       # Reportes
├── training/
│   └── page.tsx       # Capacitación
├── settings/
│   └── page.tsx       # Configuración
└── notifications/
    └── page.tsx       # Notificaciones
```

### API Routes

```
src/app/api/
├── auth/
│   ├── login/route.ts
│   ├── register/route.ts
│   ├── logout/route.ts
│   ├── session/route.ts
│   ├── change-password/route.ts
│   └── managers/route.ts
├── contacts/
│   ├── route.ts        # GET, POST
│   └── [id]/
│       ├── route.ts    # GET, PUT, DELETE
│       ├── tags/route.ts
│       └── tags/[tagId]/route.ts
├── deals/
│   ├── route.ts
│   └── [id]/
│       ├── route.ts
│       └── move/route.ts
├── tasks/
│   ├── route.ts
│   └── [id]/
│       ├── route.ts
│       └── complete/route.ts
├── teams/
│   ├── route.ts
│   └── [id]/
│       ├── route.ts
│       └── members/
│           ├── route.ts
│           └── [memberId]/route.ts
├── goals/
│   ├── route.ts
│   └── [id]/route.ts
├── calendar-events/
│   ├── route.ts
│   └── [id]/route.ts
├── notifications/
│   ├── route.ts
│   ├── [id]/read/route.ts
│   └── read-all/route.ts
├── training/
│   ├── route.ts
│   └── [id]/route.ts
├── notes/
│   ├── route.ts
│   └── [id]/route.ts
├── users/
│   ├── route.ts
│   └── [id]/
│       ├── route.ts
│       └── settings/route.ts
├── organizations/
│   ├── route.ts
│   └── [id]/
│       ├── route.ts
│       └── members/route.ts
├── sessions/
│   ├── route.ts
│   └── logout-others/route.ts
├── pipeline-stages/
│   ├── route.ts
│   └── [id]/route.ts
└── instagram/
    └── (endpoints)
```

### Librerías

```
src/lib/
├── db.ts              # Cliente Prisma
├── auth-context.tsx   # Contexto de autenticación
├── auth-helpers.ts    # Funciones de autorización
├── use-require-auth.ts # Hook de protección
└── notifications.ts   # Servicio de notificaciones
```

---

## Convenciones de Código

### Nomenclatura

```tsx
// Componentes: PascalCase
function ContactCard() {}

// Variables y funciones: camelCase
const contactList = [];
function handleSubmit() {}

// Constantes: UPPER_SNAKE_CASE
const MAX_ITEMS = 100;

// Tipos: PascalCase
interface Contact {}
type Status = "pending" | "completed";

// Archivos: kebab-case
// contact-card.tsx
// use-contacts.ts
```

### Organización de Componentes

```tsx
// 1. Imports
import { useState } from "react";
import { Button } from "@/components/ui/button";

// 2. Tipos
interface ContactCardProps {
  contact: Contact;
}

// 3. Componente
export function ContactCard({ contact }: ContactCardProps) {
  // 3.1 Hooks
  const [isOpen, setIsOpen] = useState(false);

  // 3.2 Derived state
  const fullName = `${contact.name}`;

  // 3.3 Effects
  useEffect(() => {}, []);

  // 3.4 Handlers
  function handleClick() {}

  // 3.5 Render
  return (
    <Card>
      {/* JSX */}
    </Card>
  );
}
```

### Manejo de Errores

```tsx
// API Route
try {
  const result = await db.contact.create(...);
  return NextResponse.json(result);
} catch (error) {
  console.error("Error:", error);
  return NextResponse.json(
    { error: "Internal Server Error" },
    { status: 500 }
  );
}

// Cliente
try {
  await mutation.mutateAsync(data);
  toast.success("Guardado");
} catch (error) {
  toast.error("Error al guardar");
}
```

---

## Flujo de Trabajo Git

### Branches

```
main          # Producción
develop       # Desarrollo
feature/xxx   # Nuevas features
fix/xxx       # Bug fixes
hotfix/xxx    # Fixes urgentes
```

### Commits

```
feat: agregar exportación CSV
fix: corregir drag and drop
docs: actualizar documentación
refactor: simplificar lógica de filtros
test: agregar tests de API
chore: actualizar dependencias
```

### Pull Request

1. Crear branch desde `develop`
2. Hacer commits
3. Push y crear PR
4. Review
5. Merge a `develop`

---

## Debugging

### Logs del Servidor

```tsx
// En API routes
console.log("Request:", request);
console.error("Error:", error);
```

### React Query DevTools

```tsx
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

function App() {
  return (
    <>
      {/* App */}
      <ReactQueryDevtools initialIsOpen={false} />
    </>
  );
}
```

### Prisma Studio

```bash
bun prisma studio
```

---

## Testing

### Stack de Testing

- **Vitest** — Test runner (framework de test)
- **@testing-library/react** — Testing de componentes React
- **@testing-library/jest-dom** — Matchers DOM (toBeInTheDocument, etc.)
- **@vitest/coverage-v8** — Coverage reporting con v8
- **Playwright** — E2E tests

### Comandos

```bash
# Tests (watch mode durante dev)
bun run test

# Tests una vez (CI)
bun run test:ci

# Tests con coverage
bun run test:coverage
```

### Estructura de Tests

```
src/
├── lib/
│   └── __tests__/
│       ├── utils.test.ts          # cn() utility
│       ├── permissions.test.ts     # Role/permission helpers
│       ├── roles.test.ts          # Role utility functions
│       ├── schemas.test.ts        # Zod schema validation
│       ├── task-utils.test.ts     # Task CRUD helpers + schema
│       ├── goal-tracking.test.ts  # Goal progress tracking
│       ├── goal-health.test.ts    # Goal health calculation
│       ├── auth-helpers.test.ts        # Server auth helpers
│       └── auth-helpers-client.test.ts # Client auth helpers
├── components/
│   └── __tests__/
│       └── ui/
│           ├── button.test.tsx
│           ├── badge.test.tsx
│           └── card.test.tsx
e2e/
├── login.spec.ts        # Login E2E
└── dashboard.spec.ts   # Dashboard E2E
```

### Configuración

`vitest.config.mts` — environment jsdom, globals true, setup en `src/test/setup.ts`

### Coverage

- **Meta: 80%** en líneas, funciones, branches y statements
- Provider: v8
- Reporters: text, json, html

### Ejemplo de Test Unitario

```tsx
import { describe, it, expect } from 'vitest';
import { taskSchema } from '@/lib/task-utils';

describe('taskSchema', () => {
  it('parses a valid minimal task', () => {
    const result = taskSchema.safeParse({ title: 'Follow up' });
    expect(result.success).toBe(true);
  });

  it('rejects empty title', () => {
    const result = taskSchema.safeParse({ title: '' });
    expect(result.success).toBe(false);
  });
});
```

### Ejemplo de Test de Componente

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('is disabled when disabled prop is set', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

### E2E con Playwright

```bash
# Instalar browsers (solo la primera vez)
npx playwright install chromium

# Correr E2E tests
npx playwright test

# Con UI interactivo
npx playwright test --ui
```

Config: `playwright.config.ts` — chromium, baseURL `http://localhost:3000`

---

## Performance

### Optimizaciones Recomendadas

#### 1. React Query
```tsx
const { data } = useQuery({
  queryKey: ["contacts"],
  queryFn: fetchContacts,
  staleTime: 5 * 60 * 1000, // 5 minutos
  gcTime: 30 * 60 * 1000,   // 30 minutos
});
```

#### 2. Componentes Pesados
```tsx
const HeavyChart = dynamic(
  () => import("./heavy-chart"),
  { loading: () => <Skeleton /> }
);
```

#### 3. Paginación
```tsx
// Server-side
const contacts = await db.contact.findMany({
  skip: (page - 1) * limit,
  take: limit,
});
```

#### 4. Índices DB
```prisma
@@index([organizationId, pipelineStageId])
```

---

## Deployment

### Build

```bash
bun build
```

### Variables de Producción

```env
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="production-secret"
NEXTAUTH_URL="https://app.maatwork.com"
```

### Plataformas Recomendadas

- **Vercel** (frontend + serverless)
- **Railway** (full stack)
- **AWS** (EC2 + RDS)

### Checklist Pre-Deploy

- [ ] Variables de entorno configuradas
- [ ] Base de datos con backups
- [ ] HTTPS habilitado
- [ ] Rate limiting
- [ ] Logs centralizados
- [ ] Monitoreo (opcional)

---

## Troubleshooting

### Error: Hydration Failed

```tsx
// Usar useEffect para estado dependiente del cliente
const [mounted, setMounted] = useState(false);

useEffect(() => {
  setMounted(true);
}, []);

if (!mounted) return null;
```

### Error: Prisma Client Not Generated

```bash
bun run db:generate
```

### Error: Cannot Find Module

```bash
# Limpiar cache
rm -rf node_modules .next
bun install
```

### Error: Database Locked (SQLite)

```bash
# Reiniciar DB
rm prisma/dev.db
bun run db:push
bun run db:seed
```

---

## Recursos

- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [TanStack Query](https://tanstack.com/query/latest)
- [shadcn/ui](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com/docs)
