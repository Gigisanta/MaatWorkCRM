# Portfolio Service

## Métodos Públicos

### `getPortfolioLines(portfolioId, options?)`

Obtiene las líneas de un portfolio con metadata de instrumentos y asset classes.

**Parámetros:**
- `portfolioId` (string): ID del portfolio
- `options` (object, opcional):
  - `includeMetadata` (boolean, default: true): Incluye nombres de instrumentos y asset classes

**Retorna:** `Promise<PortfolioLine[]>`

```typescript
interface PortfolioLine {
  id: string;
  targetType: string;
  assetClass: string | null;
  instrumentId: string | null;
  targetWeight: string | number;
  instrumentName: string | null;      // si includeMetadata = true
  instrumentSymbol: string | null;    // si includeMetadata = true
  assetClassName: string | null;       // si includeMetadata = true
}
```

**Implementación:**
- Usa `LEFT JOIN` con `instruments` e `lookupAssetClass` para obtener metadata
- Ordena por `targetType` y `targetWeight` ascendente cuando `includeMetadata` es true

---

### `getAssignmentWithAccessCheck(assignmentId, userId, role)`

Obtiene una asignación de portfolio y verifica acceso al contacto asociado.

**Parámetros:**
- `assignmentId` (string): ID de la asignación
- `userId` (string): ID del usuario
- `role` (UserRole): Rol del usuario

**Retorna:** `Promise<AssignmentWithContact | null>`

```typescript
interface AssignmentWithContact {
  id: string;
  contactId: string;
  portfolioId: string;
}
```

**Implementación:**
1. Busca la asignación en `client_portfolio_assignments`
2. Verifica acceso al contacto usando `canAccessContact()`
3. Retorna `null` si no existe o no tiene acceso

---

## Notas de Implementación

### Métodos No Presentes

Los siguientes métodos fueron solicitados para documentar pero **no existen** en `portfolio-service.ts`:

- `createPortfolio()`
- `updatePortfolio()`
- `deletePortfolio()`
- `addLine()`
- `updateLine()`
- `removeLine()`
- `getPortfolioWithLines()`

Estos métodos podrían estar implementados en:
- `apps/api/src/routes/portfolio/handlers/portfolios.ts`
- `apps/api/src/routes/portfolio/handlers/portfolio-lines.ts`
- O no estar implementados aún

### Cálculo de Valor Total

No implementado en este servicio. El cálculo de valor total de portfolio probablemente se realiza en el módulo de monitoreo (`portfolio_monitoring_snapshot`).

### Asignación a Advisors

La asignación de portfolios a advisors se maneja a través de:
- `client_portfolio_assignments` - tabla de asignaciones
- `getAssignmentWithAccessCheck()` - verificación de acceso

La relación entre portfolios y advisors es indirecta: un advisor tiene acceso a contacts, y los portfolios se asignan a contacts via `client_portfolio_assignments`.
