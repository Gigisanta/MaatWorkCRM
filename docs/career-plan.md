# Career Plan

## Lista de Niveles

| # | Nivel | Categoria | Objetivo Anual (USD) | Porcentaje de Bonus |
|---|-------|-----------|----------------------|---------------------|
| 1 | Nivel 1 Junior | AGENTE F. JUNIOR | $30,000 | 37.5% |
| 2 | Nivel 2 Junior | AGENTE F. JUNIOR | $37,000 | 42.5% |
| 3 | Nivel 3 Junior | AGENTE F. JUNIOR | $50,000 | 46.25% |
| 4 | Nivel 4 Junior | AGENTE F. JUNIOR | $70,000 | 48.75% |
| 5 | Nivel 5 Junior | AGENTE F. JUNIOR | $84,000 | 50.0% |
| 6 | Nivel 6 Semi-Senior | AGENTE F. SEMI-SENIOR | $95,000 | 51.25% |
| 7 | Nivel 7 Semi-Senior | AGENTE F. SEMI-SENIOR | $105,000 | 52.25% |
| 8 | Nivel 8 Semi-Senior | AGENTE F. SEMI-SENIOR | $115,000 | 55.0% |
| 9 | Nivel 9 Senior | AGENTE F. SENIOR | $125,000 | 57.5% |
| 10 | Nivel 10 Senior | AGENTE F. SENIOR | $140,000 | 60.0% |

### Detalle de Campos

- **levelNumber**: Orden numerico del nivel (1-10)
- **category**: Categoria profesional (Junior, Semi-Senior, Senior)
- **level**: Nombre descriptivo del nivel
- **annualGoalUsd**: Objetivo anual en USD (puntos requeridos para alcanzar el nivel)
- **percentage**: Porcentaje de bonus asociado al nivel
- **index**: Indice de multiplicador (usado internamente para calculos)

## Transiciones

Las transiciones entre niveles ocurren automaticamente cuando un asesor alcanza el **annualGoalUsd** del siguiente nivel.

### Ruta de Carrera

```
AGENTE F. JUNIOR                         AGENTE F. SEMI-SENIOR                    AGENTE F. SENIOR
├── Nivel 1 Junior ($30,000)             ├── Nivel 6 Semi-Senior ($95,000)       ├── Nivel 9 Senior ($125,000)
├── Nivel 2 Junior ($37,000)             ├── Nivel 7 Semi-Senior ($105,000)      └── Nivel 10 Senior ($140,000)
├── Nivel 3 Junior ($50,000)             └── Nivel 8 Semi-Senior ($115,000)
├── Nivel 4 Junior ($70,000)
└── Nivel 5 Junior ($84,000)
```

### Logica de Transicion

1. Un asesor empieza en el Nivel 1 Junior
2. Al alcanzar el objetivo anual de $30,000 USD, pasa al Nivel 2 Junior
3. Continua ascendentemente hasta Nivel 5 Junior
4. Al superar $84,000 USD, transiciona a AGENTE F. SEMI-SENIOR (Nivel 6)
5. Al superar $115,000 USD, transiciona a AGENTE F. SENIOR (Nivel 9)
6. El nivel maximo es Nivel 10 Senior ($140,000 USD)

## Beneficios

### Por Nivel

| Nivel | Beneficio Principal |
|-------|---------------------|
| Nivel 1-5 (Junior) | Bonus incremental desde 37.5% hasta 50% |
| Nivel 6-8 (Semi-Senior) | Bonus incremental desde 51.25% hasta 55% |
| Nivel 9-10 (Senior) | Bonus incremental desde 57.5% hasta 60% |

### Incrementos por Transicion

- **Junior (1-5)**: Cada nivel aumenta el bonus entre 1.25% y 5%
- **Semi-Senior (6-8)**: Cada nivel aumenta el bonus entre 0.75% y 1%
- **Senior (9-10)**: Cada nivel aumenta el bonus entre 2% y 2.5%

### Escalado de Objetivos

Los objetivos anuales (annualGoalUsd) crecen de forma exponencial:

- Junior: $30,000 -> $84,000 (factor 2.8x del primer al ultimo nivel)
- Semi-Senior: $95,000 -> $115,000 (factor 1.2x)
- Senior: $125,000 -> $140,000 (factor 1.12x)

---

# Career Plan Progress System

## Overview

El sistema de progreso del plan de carrera calcula automaticamente el nivel actual de un usuario y su progreso hacia el siguiente nivel basado en su produccion anual estimada.

## Calculo de Produccion Anual

**Formula:**
```
produccion_anual = suma(primas_mensuales_contactos_zurich) * 12
```

### Detalles de Calculo

1. Se suman todas las `monthlyPremium` de `contact_tags` donde:
   - El contacto tiene `assignedAdvisorId` asignado al usuario
   - El tag tiene `businessLine = 'zurich'`
   - `monthlyPremium` no es null

2. El resultado se multiplica por 12 para obtener la produccion anual estimada

### Para Managers

Si el usuario tiene rol `manager`, la produccion incluye la de sus miembros del equipo:

1. Se obtienen todos los miembros del equipo a traves de `teamMembership`
2. Se incluyen los contactos del manager Y de todos los miembros del equipo
3. Si hay un error al obtener miembros, solo se usa la produccion del manager

**Archivo:** `apps/api/src/utils/career-plan.ts` - `calculateUserAnnualProduction()`

## Determinacion de Nivel

El nivel se determina comparando la produccion anual con el `annualGoalUsd` de cada nivel:

1. Se obtienen todos los niveles activos ordenados por `levelNumber`
2. Se busca el nivel mas alto cuyo `annualGoalUsd` sea menor o igual a la produccion
3. Se usa `determineLevelFromProduction()` para este calculo

## Calculo de Progreso

**Formula:**
```
progreso = (produccion / objetivo) * 100
```

Donde `objetivo` es el `annualGoalUsd` del nivel actual.

### Logica de Ascenso Automatico

1. Si `progreso > 100%` Y existe un siguiente nivel:
   - El usuario asciende automaticamente al siguiente nivel
   - El progreso se recalcula contra el objetivo del nuevo nivel

2. Si `progreso <= 100%` o no hay siguiente nivel:
   - El usuario permanece en su nivel actual
   - El progreso se muestra contra el objetivo actual

**Archivo:** `apps/api/src/utils/career-plan.ts` - `calculateUserCareerProgress()`

## Modelo UserCareerProgress

```typescript
interface UserCareerProgress {
  currentLevel: CareerPlanLevel | null;   // Nivel actual (puede ser null si no alcanza el primer nivel)
  annualProduction: number;                // Produccion anual estimada (suma primas * 12)
  progressPercentage: number;              // Porcentaje de progreso (0-100+)
  nextLevel: CareerPlanLevel | null;       // Siguiente nivel (null si esta en el maximo nivel)
}
```

**Archivo:** `packages/types/src/career-plan.ts`

## Endpoint

```
GET /api/career-plan/user-progress
```

Requiere autenticacion. Retorna el `UserCareerProgress` del usuario autenticado.

**Archivo:** `apps/api/src/routes/career-plan/index.ts`

**Handler:** `apps/api/src/routes/career-plan/handlers/progress.ts`

## Limitaciones de la Implementacion Actual

**NO existe persistencia de historico de transiciones.**

- El nivel se calcula en tiempo real cada vez que se consulta
- No se guarda registro de cuando un usuario ascendio de nivel
- No hay forma de consultar el historial de niveles de un usuario
- El ascenso es automatico y no requiere aprobacion manual

## Archivos Relacionados

| Archivo | Descripcion |
|---------|-------------|
| `apps/api/src/utils/career-plan.ts` | Logica de calculo de produccion y progreso |
| `apps/api/src/routes/career-plan/index.ts` | Rutas del API |
| `apps/api/src/routes/career-plan/handlers/progress.ts` | Handler del endpoint user-progress |
| `apps/api/src/routes/career-plan/schemas.ts` | Schemas de validacion |
| `packages/types/src/career-plan.ts` | Definicion de tipos TypeScript |

---

**Fuente**: `packages/db/migrations/0019_clear_switch.sql`
**Modelo**: `packages/db/src/schema/users.ts` - `careerPlanLevels`
