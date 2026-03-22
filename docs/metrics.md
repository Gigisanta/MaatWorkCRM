# Pipeline Metrics

## Descripcion

El sistema de metricas del pipeline proporciona indicadores clave de rendimiento (KPIs) para cada etapa, incluyendo tasas de conversion, volumenes de contactos y metricas financieras.

## Metricas Por Etapa

### Campos de Metricas

Para cada etapa del pipeline se calculan las siguientes metricas:

| Metrica | Descripcion | Calculo |
|---------|-------------|---------|
| `entered` | Cantidad de contactos que entraron a la etapa | Conteo de registros en `pipelineStageHistory` con `toStage = etapaId` |
| `exited` | Cantidad de contactos que salieron de la etapa | Conteo de registros en `pipelineStageHistory` con `fromStage = etapaId` |
| `current` | Cantidad actual de contactos en la etapa | Conteo de contactos con `pipelineStageId = etapaId` |
| `conversionRate` | Tasa de conversion de la etapa | `(exited / entered) * 100` |

### Respuesta de Metricas

```typescript
interface StageMetric {
  stageId: string;
  stageName: string;
  entered: number;
  exited: number;
  current: number;
  conversionRate: number; // Porcentaje con 2 decimales
}

interface PipelineMetricsResponse {
  stageMetrics: StageMetric[];
  overallConversionRate: number;
  periodFrom: string | null;  // Fecha inicio del periodo (opcional)
  periodTo: string | null;   // Fecha fin del periodo (opcional)
}
```

## Metricas de Contacto

Ademas de las metricas de conversion, el pipeline tambier soporta metricas financieras de los contactos:

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `ingresos` | numeric | Ingresos mensuales del contacto |
| `gastos` | numeric | Gastos mensuales del contacto |
| `excedente` | numeric | Excedente (ingresos - gastos) |

Estas metricas se almacenan en la tabla `contacts` y pueden agregarse a nivel de etapa para obtener el valor total o promedio de los contactos en cada etapa.

## Endpoint de Metricas

### GET /pipeline/metrics

Obtiene las metricas de conversion del pipeline.

**Query Parameters:**

| Parametro | Tipo | Descripcion |
|-----------|------|-------------|
| `fromDate` | date (opcional) | Fecha de inicio para filtrar el historial |
| `toDate` | date (opcional) | Fecha de fin para filtrar el historial |
| `assignedAdvisorId` | uuid (opcional) | Filtrar metricas por asesor |
| `assignedTeamId` | uuid (opcional) | Filtrar metricas por equipo |

**Ejemplo de respuesta:**

```json
{
  "success": true,
  "data": {
    "stageMetrics": [
      {
        "stageId": "uuid-prospecto",
        "stageName": "Prospecto",
        "entered": 150,
        "exited": 120,
        "current": 45,
        "conversionRate": 80.00
      },
      {
        "stageId": "uuid-cliente",
        "stageName": "Cliente",
        "entered": 50,
        "exited": 45,
        "current": 48,
        "conversionRate": 90.00
      }
    ],
    "overallConversionRate": 30.00,
    "periodFrom": "2024-01-01",
    "periodTo": "2024-12-31"
  },
  "cached": false
}
```

## Endpoint de Exportacion

### GET /pipeline/metrics/export

Exporta las metricas en formato CSV.

**Query Parameters:**

| Parametro | Tipo | Descripcion |
|-----------|------|-------------|
| `fromDate` | date (opcional) | Fecha de inicio |
| `toDate` | date (opcional) | Fecha de fin |

**Respuesta:** Archivo CSV con las siguientes columnas:
- `stageName`
- `entered`
- `exited`
- `conversionRate`

## Tasa de Conversion General

La tasa de conversion general se calcula como:

```
overallConversionRate = (contacts_en_ultima_etapa / contacts_en_primera_etapa) * 100
```

Donde:
- **Primera etapa**: La etapa con `order = 1` (Prospecto)
- **Ultima etapa**: La etapa con el mayor `order` (Caido)

## Optimizaciones de Rendimiento

El calculo de metricas utiliza las siguientes optimizaciones:

### Queries Agrupadas

En lugar de N+1 queries, se utilizan consultas agrupadas con GROUP BY:

```typescript
// Query unica para obtener conteos de entrada por etapa
const enteredCounts = await db()
  .select({
    toStage: pipelineStageHistory.toStage,
    count: count(),
  })
  .from(pipelineStageHistory)
  .where(and(
    inArray(pipelineStageHistory.toStage, stageIds),
    ...dateConditions
  ))
  .groupBy(pipelineStageHistory.toStage);
```

### Cache de Metricas

Las metricas se cachean durante 10 minutos para evitar recalculos frecuentes:

```typescript
pipelineMetricsCacheUtil.set(cacheKey, responseData, 600); // 600 segundos
```

### Maps para Busqueda O(1)

Los resultados de las queries se convierten a Maps para busqueda rapida:

```typescript
const enteredMap = new Map(
  enteredCounts.map((ec) => [ec.toStage, Number(ec.count)])
);
```

## Historial de Pipeline

Las metricas se calculan en base a la tabla `pipelineStageHistory`:

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `id` | uuid | Identificador unico del registro |
| `contactId` | uuid | ID del contacto que cambio de etapa |
| `fromStage` | uuid | Etapa origen (null si es la primera vez) |
| `toStage` | uuid | Etapa destino |
| `reason` | text | Razon del cambio (opcional) |
| `changedByUserId` | uuid | Usuario que realizo el cambio |
| `changedAt` | timestamp | Momento del cambio |
