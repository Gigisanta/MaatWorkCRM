# AUM Matcher

## Estrategias de Matching

El sistema utiliza 4 estrategias de matching en orden de prioridad (de mayor a menor):

### 1. by-id-cuenta (Prioridad mas alta)

Busca coincidencias exactas por `id_cuenta`.

- **Score:** 1.0 (perfect match)
- **Tabla consultada:** `brokerAccounts`
- **Condicion:** `broker = :broker AND id_cuenta = :id_cuenta`

### 2. by-reverse-lookup (Prioridad 2)

Busca cuando `id_cuenta` de la fila nueva coincide con `accountNumber` de una fila existente.

- **Score:** 1.0 (perfect match)
- **Caso de uso:** Cuando el monthly tiene `id_cuenta` pero el master tiene ese valor solo como `accountNumber`
- **Logica:** Intercambio bidireccional entre identificadores

### 3. by-account-number (Prioridad 3)

Busca coincidencias por `accountNumber` normalizado.

- **Score:** 1.0 (perfect match)
- **Tabla consultada:** `brokerAccounts`
- **Metodo:** `broker_account` (match exacto por numero de cuenta)

### 4. by-holder-name (Prioridad mas baja)

Busca por nombre del titular, con dos variantes:

- **name_exact (score 1.0):** Match exacto via servicio de alias
- **name_similarity (score 0.0 - 1.0):** Busqueda con pg_trgm si esta habilitado

#### Configuracion de similitud

```
MIN_NAME_SIMILARITY: 0.7 (threshold minimo para aceptar match)
MAX_SIMILARITY_RESULTS: 5 (maximo candidatos a considerar)
```

### Flujo de ejecucion

```
findExistingRow(row, broker):
  1. findByIdCuenta      -> si encuentra, retornar
  2. findByReverseLookup -> si encuentra, retornar
  3. findByAccountNumber -> si encuentra, retornar
  4. findByHolderName    -> si encuentra, retornar
  5. retornar null
```

---

## Score de Confianza

### ContactMatch

| Metodo | Score | Descripcion |
|--------|-------|-------------|
| `broker_account` | 1.0 | Match exacto por account number |
| `name_exact` | 1.0 | Match exacto via alias service |
| `name_similarity` | 0.0 - 1.0 | Similitud via pg_trgm (umbral minimo 0.7) |

### AdvisorMatch

| Metodo | Score | Descripcion |
|--------|-------|-------------|
| `email` | 1.0 | Match exacto por email |
| `alias` | 1.0 | Match por alias normalizado |
| `alias` (full name) | 0.9 | Match por nombre completo normalizado |

### Funcion computeMatchStatus

```typescript
computeMatchStatus(result: MatchResult):
  - contactMatch.score >= 0.95 -> 'matched'
  - contactMatch.score >= 0.7  -> 'ambiguous'
  - otherwise                  -> 'unmatched'
```

---

## Casos Ambiguos

### Definicion

Un match es **ambiguo** cuando:
- `score >= 0.7` pero `< 0.95`
- Existen multiples candidatos posibles

### Estrategias de resolucion

1. **Verificacion por identificadores cruzados**
   - Si holderName genera multiples candidatos
   - Intentar validar con `accountNumber` o `id_cuenta`

2. **Re-procesamiento asincronico**
   ```typescript
   reprocessUnmatchedRowsForContact(contactId, aliases?)
   ```
   - Se invoca cuando se confirma un match manual
   - Permite re-procesar filas que ahora tienen nuevo alias disponible

### Deteccion de duplicados

```typescript
isDuplicateRow(broker, accountNumber?, holderName?):
  - Verifica si existe en ultimos 30 dias
  - Usa accountNumber o holderName como condiciones
  - Retorna boolean
```

### Manejo de errores

- Si similarity search falla (pg_trgm no disponible), se hace log debug y se continua
- Errores de base de datos se loguean pero no rompen el flujo
- Si no hay condiciones para buscar, retorna `false` (no duplicado)
