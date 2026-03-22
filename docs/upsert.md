# AUM Upsert

## Logica de Upsert Batch

El proceso de upsert batch procesa filas en chunks para optimizar memoria y performance:

```typescript
const batchSize = AUM_LIMITS.BATCH_INSERT_SIZE; // 500 filas por batch

for (let i = 0; i < rows.length; i += batchSize) {
  const chunk = rows.slice(i, i + batchSize);
  await Promise.allSettled(
    chunk.map(async (row) => { /* ... */ })
  );
}
```

### Logica INSERT vs UPDATE

**Decision Tree:**

1. **Find Existing Row** - Se busca una fila existente usando estrategias en orden de prioridad:
   - `findByIdCuenta` (id_cuenta exacto)
   - `findByReverseLookup` (id_cuenta = accountNumber)
   - `findByAccountNumber` (accountNumber normalizado)
   - `findByHolderName` (holderName, solo filas sin identificadores)

2. **Si existe** → `updateExistingRow()`
3. **Si no existe** → `insertNewRow()`

### Campos en INSERT

```typescript
await dbi.insert(aumImportRows).values({
  fileId, raw, accountNumber, holderName, idCuenta,
  advisorRaw, matchedContactId, matchedUserId, matchStatus,
  isPreferred, conflictDetected,
  aumDollars, bolsaArg, fondosArg, bolsaBci, pesos, mep, cable, cv7000
});
```

### Campos en UPDATE

```typescript
await dbi.update(aumImportRows).set({
  fileId, holderName, accountNumber, idCuenta, advisorRaw,
  matchedContactId, matchedUserId, matchStatus,
  isPreferred, conflictDetected, isNormalized,
  aumDollars, bolsaArg, fondosArg, bolsaBci, pesos, mep, cable, cv7000,
  raw, updatedAt: new Date()
});
```

## Transacciones

**Nota:** El upsert batch NO usa transacciones explícitas. Cada fila se procesa de forma independiente con `Promise.allSettled`.

### Chunk Processing

- **Batch size:** 500 filas (configurable via `AUM_LIMITS.BATCH_INSERT_SIZE`)
- **Paralelización:** `Promise.allSettled` permite que todas las filas del chunk se procesen concurrentemente
- **Logging:** Se loguea progreso cada 10 batches o al finalizar
- **Garbage Collection:** Se sugiere GC cada 5 batches para archivos muy grandes (`global.gc()` si esta habilitado)

### Stats Tracking

```typescript
const stats: UpsertStats = {
  inserted: 0,    // Filas insertadas
  updated: 0,     // Filas actualizadas
  errors: 0,     // Errores
  updatedOnlyHolderName: 0, // Updates de filas que solo tenian holderName
};
```

## Validaciones

### Campos Requeridos (AumRowInsert)

| Campo | Tipo | Requerido | Notas |
|-------|------|-----------|-------|
| `fileId` | string | Si | Reference al archivo importado |
| `holderName` | string | Si | Nombre del titular |
| `accountNumber` | string | No | Numero de cuenta |
| `idCuenta` | string | No | ID de cuenta |
| `advisorRaw` | string | No | Asesor en formato raw |
| `matchedContactId` | string | No | Contacto relacionado |
| `matchedUserId` | string | No | Usuario relacionado |
| `matchStatus` | enum | Si | 'matched', 'ambiguous', 'unmatched' |
| `isPreferred` | boolean | No | Flag de fila preferida |
| `conflictDetected` | boolean | No | Indica conflicto en matching |
| `aumDollars` | number | No | Monto en dolares |
| `bolsaArg` | number | No | Monto bolsa Argentina |
| `fondosArg` | number | No | Monto fondos Argentina |
| `bolsaBci` | number | No | Monto bolsa BCI |
| `pesos` | number | No | Monto pesos |
| `mep` | number | No | Monto MEP |
| `cable` | number | No | Monto cable |
| `cv7000` | number | No | Monto CV7000 |
| `raw` | string | No | Datos crudos del archivo |

### Validacion de Tipos

- `hasOnlyHolderName()` valida que una fila solo tenga holderName (sin accountNumber ni idCuenta)
- `hasValidAdvisorRaw()` valida que advisorRaw sea string no vacio

## Manejo de Duplicates

### Estrategia de Deduplicacion

Cuando se actualiza una fila como `isPreferred=true`, se desmarca el flag en filas duplicadas:

```typescript
if (newRow.isPreferred) {
  await unsetPreferredOnDuplicates(existingRow, newRow, broker);
}
```

### Criterios para Desduplicacion

**Si la nueva fila tiene ambos identificadores** (accountNumber + idCuenta):

```sql
-- Se marcan como no preferred las filas que:
-- 1. Tienen el mismo accountNumber Y el mismo idCuenta, O
-- 2. Tienen el mismo accountNumber Y idCuenta NULL/vacio, O
-- 3. Tienen el mismo idCuenta Y accountNumber NULL/vacio
```

**Si solo tiene accountNumber:**

```sql
-- Marcar filas con el mismo accountNumber
r.account_number = ${newRow.accountNumber}
```

**Si solo tiene idCuenta:**

```sql
-- Marcar filas con el mismo idCuenta
r.id_cuenta = ${newRow.idCuenta}
```

### Preservacion de Datos Normalizados

**Regla:** Las filas normalizadas preservan sus datos durante updates:

- `isNormalized=true` → `advisorRaw` y `matchedUserId` se preservan siempre
- `isPreferred` se preserva si la fila existente era preferred y la nueva tiene conflictos

### Enriquecimiento de Filas

Cuando el archivo monthly tiene mas informacion que el master (ej: master solo tiene holderName, monthly tiene holderName + accountNumber + idCuenta):

1. Se busca la fila del master por holderName (sin identificadores)
2. Se actualiza con los nuevos identificadores
3. Se preservan los datos ya normalizados del master
