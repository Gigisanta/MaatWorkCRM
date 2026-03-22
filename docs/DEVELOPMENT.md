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

### Tests Unitarios

```bash
# Instalar vitest
bun add -D vitest @testing-library/react

# Crear test
# src/app/contacts/page.test.tsx
```

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

describe("ContactsPage", () => {
  it("renders contacts list", () => {
    render(<ContactsPage />);
    expect(screen.getByText("Contactos")).toBeDefined();
  });
});
```

### Tests de API

```tsx
import { describe, it, expect } from "vitest";

describe("/api/contacts", () => {
  it("returns contacts list", async () => {
    const res = await fetch("/api/contacts");
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
  });
});
```

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
