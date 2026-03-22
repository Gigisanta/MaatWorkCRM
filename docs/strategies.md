# AUM Strategies

## Strategy Interface

Todas las estrategias siguen la misma firma:

```typescript
export async function findByX(
  row: AumRowInsert,
  broker: string
): Promise<ExistingRow | null>
```

**Parametros:**
- `row: AumRowInsert` - Fila nueva a procesar
- `broker: string` - Broker para filtrar busquedas

**Retorno:** `ExistingRow | null` - Fila existente encontrada o null

**Comportamiento comun:**
- Excluye filas del mismo archivo (`r.file_id != row.fileId`)
- Ordena por `is_normalized DESC, f.created_at DESC, r.created_at DESC`
- Solo devuelve 1 resultado (`LIMIT 1`)

---

## Implementaciones

### 1. `findByIdCuenta` (Prioridad mas alta)

**Archivo:** `apps/api/src/services/aum/strategies/find-by-id-cuenta.ts`

**Logica:** Busca por `id_cuenta` exacto (trimmed)

```typescript
WHERE r.id_cuenta = ${row.idCuenta.trim()}
  AND f.broker = ${broker}
  AND r.file_id != ${row.fileId}
```

**Requisito:** `row.idCuenta` debe existir y no estar vacio

---

### 2. `findByReverseLookup` (Prioridad 2)

**Archivo:** `apps/api/src/services/aum/strategies/find-by-reverse-lookup.ts`

**Logica:** Busca donde `id_cuenta` de una fila existente equals `accountNumber` de la fila nueva

```typescript
WHERE r.id_cuenta = ${row.accountNumber}
  AND f.broker = ${broker}
  AND r.file_id != ${row.fileId}
```

**Proposito:** Maneja casos donde CSV1 guardo el `accountNumber` en el campo `id_cuenta`

**Requisito:** Ambos `row.idCuenta` y `row.accountNumber` deben existir

---

### 3. `findByAccountNumber` (Prioridad 3)

**Archivo:** `apps/api/src/services/aum/strategies/find-by-account-number.ts`

**Logica:** Busca por `accountNumber` normalizado usando `normalizeAccountNumber()`

```typescript
const normalizedAccountNumber = normalizeAccountNumber(row.accountNumber);
WHERE r.account_number = ${normalizedAccountNumber}
  AND f.broker = ${broker}
  AND r.file_id != ${row.fileId}
```

**Proposito:** Maneja variaciones de formato en account numbers

**Requisito:** `row.accountNumber` debe existir y no estar vacio

---

### 4. `findByHolderName` (Prioridad mas baja)

**Archivo:** `apps/api/src/services/aum/strategies/find-by-holder-name.ts`

**Logica:** Busca por `holderName` case-insensitive, pero solo filas existentes que NO tengan `account_number` NI `id_cuenta`

```typescript
WHERE LOWER(TRIM(r.holder_name)) = LOWER(TRIM(${row.holderName}))
  AND (r.account_number IS NULL OR r.account_number = '')
  AND (r.id_cuenta IS NULL OR r.id_cuenta = '')
  AND f.broker = ${broker}
  AND r.file_id != ${row.fileId}
```

**Helper:** `hasOnlyHolderName(row)` - Verifica si una fila solo tiene `holderName` (sin identificadores)

**Proposito:** Enriquecer filas del master que solo tienen `holderName` con identificadores del monthly

---

## Cuando Usar Cada Una

| Escenario | Estrategia a Usar |
|-----------|------------------|
| Tienes `idCuenta` | `findByIdCuenta` |
| `idCuenta` de CSV1 parece ser `accountNumber` de CSV2 | `findByReverseLookup` |
| Tienes `accountNumber` con posibles variaciones de formato | `findByAccountNumber` |
| Master solo tiene `holderName`, monthly tiene `holderName` + identificadores | `findByHolderName` |

### Orden de Ejecucion (Fallback Chain)

El upsert usa estas estrategias en cascada:

1. **`findByIdCuenta`** - Busqueda directa por ID unico
2. **`findByReverseLookup`** - Reverse lookup si fallaron las anteriores
3. **`findByAccountNumber`** - Normalized account number match
4. **`findByHolderName`** - Fallback final por nombre

### Casos de Uso Especificos

**CSV1 (Master):**
```
holderName="Juan", accountNumber=NULL, idCuenta=NULL
```

**CSV2 (Monthly):**
```
holderName="Juan", accountNumber=123, idCuenta=456
```

**Resultado:** `findByHolderName` encuentra la fila del master y la actualiza con los identificadores del monthly.

---

## Types Relacionados

```typescript
interface ExistingRow {
  id: string;
  fileId: string;
  accountNumber: string | null;
  holderName: string | null;
  idCuenta: string | null;
  matchedContactId: string | null;
  matchedUserId: string | null;
  advisorRaw: string | null;
  matchStatus: 'matched' | 'ambiguous' | 'unmatched';
  isPreferred: boolean;
  isNormalized: boolean;
}
```
