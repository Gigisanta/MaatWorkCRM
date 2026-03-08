# Workflow: Migración de Funcionalidades ERP → CRM

## Objetivo
Analizar dos repositorios (`erp.maatwork` y `MaatWorkCRM`), copiar funcionalidades del ERP al CRM en loop infinito, verificar manualmente con Playwright, y pulir hasta producción.

---

## FASE 0: Preparación del Entorno

### 0.1 Identificar Repositorios
- **ERP (Fuente):** `/Users/prueba/Desktop/erp.maatwork` - Repositorio legacy con funcionalidades existentes
- **CRM (Destino):** `/Users/prueba/Desktop/MaatWorkCRM` - Repositorio nuevo con TanStack Start

### 0.2 Configurar Worktree Aislado (OBLIGATORIO)
```bash
cd /Users/prueba/Desktop/MaatWorkCRM
git worktree add .worktrees/option-a -b feature/option-a-portfolios-career
cd .worktrees/option-a
pnpm install
```

### 0.3 Verificar Baseline
```bash
pnpm lint  # Debe pasar
pnpm test  # Debe pasar (todos los tests)
```

---

## FASE 1: Análisis del ERP

### 1.1 Explorar Estructura del ERP
Ejecutar en paralelo:
```bash
# Listar estructura
ls -la /Users/prueba/Desktop/erp.maatwork/apps/web/
ls -la /Users/prueba/Desktop/erp.maatwork/apps/web/server/
ls -la /Users/prueba/Desktop/erp.maatwork/apps/web/components/

# Buscar schemas de base de datos
find /Users/prueba/Desktop/erp.maatwork -name "*.ts" -path "*/db/*" | head -20

# Buscar API routes
find /Users/prueba/Desktop/erp.maatwork -name "*.ts" -path "*/api/*" | head -20
```

### 1.2 Identificar Funcionalidades a Migrar
Para cada funcionalidad del ERP:
1. Encontrar el schema de DB对应的
2. Encontrar los API routes
3. Encontrar los componentes UI
4. Documentar dependencias externas (librerías, APIs)

### 1.3 Analizar Patrones del CRM Destino
```bash
# Ver estructura de server functions
ls -la /Users/prueba/Desktop/MaatWorkCRM/.worktrees/option-a/apps/web/server/functions/

# Ver estructura de schemas
ls -la /Users/prueba/Desktop/MaatWorkCRM/.worktrees/option-a/apps/web/server/db/schema/

# Ver ejemplos de componentes
ls -la /Users/prueba/Desktop/MaatWorkCRM/.worktrees/option-a/apps/web/components/
```

---

## FASE 2: Implementación (Loop)

### 2.1 Crear Schema de Base de Datos
Ubicación: `apps/web/server/db/schema/<module>.ts`

```typescript
// Ejemplo: portfolios.ts
import { pgTable, text, timestamp, real } from "drizzle-orm/pg-core";
import { contacts } from "./crm";

export const portfolios = pgTable("portfolios", {
  id: text("id").primaryKey(),
  contactId: text("contact_id").notNull().references(() => contacts.id),
  name: text("name").notNull(),
  type: text("type", { enum: ["individual", "joint", "trust", "corporate"] }).notNull(),
  custodian: text("custodian"),
  accountNumber: text("account_number"),
  totalValue: real("total_value").default("0"),
  lastSyncedAt: timestamp("last_synced_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

### 2.2 Exportar en Index
Archivo: `apps/web/server/db/schema/index.ts`
```typescript
export * from "./portfolios";
```

### 2.3 Crear Server Functions
Ubicación: `apps/web/server/functions/<module>.ts`

```typescript
import { z } from "zod";
import { createServerFn } from "@tanstack/react-start";
import { eq, desc, and } from "drizzle-orm";
import { db } from "../db";
import { portfolios } from "~/server/db/schema/portfolios";

export const getPortfolios = createServerFn({ method: "GET" })
  .inputValidator((input: { contactId?: string }) => input)
  .handler(async ({ data }) => {
    const whereConditions = [];
    if (data.contactId) whereConditions.push(eq(portfolios.contactId, data.contactId));
    
    return db.query.portfolios.findMany({
      where: and(...whereConditions),
      orderBy: [desc(portfolios.createdAt)],
    });
  });
```

### 2.4 Crear Componentes UI
Ubicación: `apps/web/components/<module>/`

- Usar Tailwind CSS v4
- Usar Framer Motion para animaciones
- Usar Radix UI para componentes accesibles
- Seguir patrón de glassmorphism existente

### 2.5 Crear Hooks
Archivo: `apps/web/app/lib/hooks/use-crm.ts`

```typescript
export function usePortfolios() {
  return useQuery({
    queryKey: ["portfolios"],
    queryFn: () => getPortfolios({ data: {} }),
  });
}
```

### 2.6 Crear Rutas
Ubicación: `apps/web/app/routes/`

- Usar TanStack Router file-based routing
-命名: `portfolios/index.tsx`, `portfolios/[portfolioId].tsx`

---

## FASE 3: Verificación con Playwright

### 3.1 Instalar Playwright (si no existe)
```bash
cd /Users/prueba/Desktop/MaatWorkCRM/.worktrees/option-a
pnpm add -D @playwright/test
npx playwright install chromium
```

### 3.2 Crear Test E2E
Ubicación: `apps/web/e2e/<module>.spec.ts`

```typescript
import { test, expect } from "@playwright/test";

test("portfolios page loads", async ({ page }) => {
  await page.goto("http://localhost:3000/portfolios");
  await expect(page.locator("h1")).toContainText("Portfolios");
});

test("can create portfolio", async ({ page }) => {
  await page.goto("http://localhost:3000/portfolios");
  await page.click("text=Create Portfolio");
  await page.fill("input[name=name]", "Test Portfolio");
  await page.click("button:has-text=Save)");
  await expect(page.locator("text=Test Portfolio")).toBeVisible();
});
```

### 3.3 Ejecutar Tests
```bash
# Iniciar dev server en background
cd /Users/prueba/Desktop/MaatWorkCRM/.worktrees/option-a
pnpm dev &

# Ejecutar tests
npx playwright test e2e/portfolios.spec.ts
```

### 3.4 Verificación Manual
- Abrir navegador: `http://localhost:3000`
- Navegar a la nueva funcionalidad
- Verificar UI/UX
- Probar interacciones
- Verificar errores en consola

---

## FASE 4: Pulido y Quality Assurance

### 4.1 Linting
```bash
pnpm lint  # Check
pnpm lint:fix  # Auto-fix
```

### 4.2 Testing
```bash
pnpm test  # Unit tests
npx playwright test  # E2E tests
```

### 4.3 Build
```bash
pnpm build  # Verificar que compila
```

---

## FASE 5: Integración con Inngest (Background Jobs)

### 5.1 Crear Funciones Inngest
Ubicación: `apps/web/server/inngest/index.ts`

```typescript
import { Inngest } from "inngest";
import { eq, desc, and } from "drizzle-orm";
import { db } from "../db";
import { portfolios, portfolioSnapshots } from "../db/schema/portfolios";

export const inngest = new Inngest({ id: "maatwork-crm" });

export const createMonthlySnapshot = inngest.createFunction(
  { id: "monthly-aum-snapshot", name: "Monthly AUM Snapshot" },
  { cron: "0 0 1 * *" }, // Monthly
  async ({ step }) => {
    const currentMonth = getCurrentMonth();
    const allPortfolios = await step.run("fetch-portfolios", async () => {
      return db.select().from(portfolios);
    });
    
    // Create snapshots for each portfolio
    // ... implementation
    
    return { success: true, count: allPortfolios.length };
  }
);

export const inngestFunctions = [createMonthlySnapshot];
```

---

## Comandos Útiles

### Git
```bash
# Worktree
git worktree list
git worktree add .worktrees/<name> -b feature/<branch>

# Status
git status
git diff

# Commit
git add .
git commit -m "feat: add portfolios module"
```

### Desarrollo
```bash
# Install
pnpm install

# Dev
pnpm dev

# Lint
pnpm lint
pnpm lint:fix

# Test
pnpm test
npx playwright test

# Build
pnpm build
```

---

## Estructura de Archivos

```
MaatWorkCRM/
├── apps/web/
│   ├── components/
│   │   └── portfolios/
│   │       ├── PortfolioCard.tsx
│   │       ├── EditPortfolioModal.tsx
│   │       └── SnapshotManagement.tsx
│   ├── server/
│   │   ├── db/
│   │   │   ├── schema/
│   │   │   │   ├── portfolios.ts
│   │   │   │   └── index.ts
│   │   │   └── migrations/
│   │   ├── functions/
│   │   │   └── portfolios.ts
│   │   └── inngest/
│   │       └── index.ts
│   ├── app/
│   │   ├── lib/
│   │   │   ├── hooks/
│   │   │   │   └── use-crm.ts
│   │   │   └── utils.ts
│   │   └── routes/
│   │       └── portfolios/
│   │           ├── index.tsx
│   │           └── [portfolioId].tsx
│   └── e2e/
│       └── portfolios.spec.ts
└── .worktrees/
    └── option-a/
```

---

## Reglas de Oro

1. **SIEMPRE usar worktree** - Nunca trabajar en main
2. **Verificar con Playwright** - Antes de reportar "done"
3. **Ejecutar lint + test** - Antes de cada commit
4. **Documentar decisiones** - En el código con comentarios
5. **Mantener consistencia** - Seguir patrones existentes
6. **Iterar** - Loop hasta que esté perfecto

---

## Estado Actual (Para Continuación)

### Completado en Option-A:
- Schema: portfolios, portfolioAllocations, portfolioSnapshots
- Server Functions: CRUD, getTotalAUM, snapshots
- Componentes: AUMCard, PortfolioCard, EditPortfolioModal, SnapshotManagement
- UI: Portfolio list, Portfolio detail, Dashboard AUM widget
- Inngest: Monthly snapshot automation
- Export: CSV download
- Tests: 29 passing
- Lint: Clean

### Pendiente (para continuar):
- [ ] Más funcionalidades del ERP
- [ ] Integración completa con contacts/teams
- [ ] Más tests E2E
- [ ] Manual testing completo
