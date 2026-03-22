# Pipeline Stages

Sistema de pipeline kanban para el seguimiento de contactos/leads a traves de etapas definidas.

## 7 Etapas Por Defecto

El sistema viene configurado con 7 etapas que representan el ciclo de vida de un contacto en el pipeline de ventas:

| Orden | Nombre | Descripcion | Color | WIP Limit | SLA Hours |
|-------|--------|-------------|-------|-----------|-----------|
| 1 | Prospecto | Contacto inicial identificado | #3b82f6 (Azul) | null | null |
| 2 | Contactado | Primer contacto realizado | #8b5cf6 (Morado) | null | null |
| 3 | Primera reunion | Primera reunion agendada o realizada | #f59e0b (Amarillo/Naranja) | null | null |
| 4 | Segunda reunion | Segunda reunion agendada o realizada | #f97316 (Naranja) | null | null |
| 5 | Cliente | Cliente activo | #10b981 (Verde) | null | null |
| 6 | Cuenta vacia | Cliente sin saldo | #6b7280 (Gris) | null | null |
| 7 | Caido | Cliente perdido o inactivo | #ef4444 (Rojo) | null | null |

## Estados del Pipeline

### Propiedades de una Etapa

```typescript
interface PipelineStage {
  id: string;                    // UUID
  name: string;                  // Nombre de la etapa
  description: string | null;    // Descripcion opcional
  order: number;                 // Orden en el pipeline (1-7)
  color: string;                 // Color hex (#RRGGBB)
  wipLimit: number | null;       // Limite de trabajo en progreso (Work In Progress)
  slaHours: number | null;       // SLA en horas para esta etapa
  isActive: boolean;             // Si la etapa esta activa
  createdAt: Date;              // Timestamp de creacion
  updatedAt: Date;               // Timestamp de ultima actualizacion
}
```

### Indice compuesto

- `idx_pipeline_stages_order` - Optimiza consultas ordenadas por `order`

## Transiciones

### Transiciones Validas

**Cualquier contacto puede moverse de cualquier etapa a cualquier otra etapa.** El sistema no impone restricciones de transicion secuencial.

```
Prospecto <-> Contactado <-> Primera reunion <-> Segunda reunion <-> Cliente <-> Cuenta vacia <-> Caido
```

### Sistema Abierto

El pipeline utiliza un **sistema abierto** - cualquier contacto puede moverse de cualquier etapa a cualquier otra etapa. No hay restricciones de transicion predefinidas.

Esto significa que un contacto puede:
- Ir de "Prospecto" directamente a "Cliente"
- Moverse de "Cliente" a "Caido" si pierde el cliente
- Saltar entre cualquier combinacion de etapas segun la logica de negocio

### Logica de Movimiento

1. Se verifica que el contacto existe y el usuario tiene acceso
2. Se verifica que la etapa destino existe
3. Se valida el WIP limit de la etapa destino (si esta definido)
4. Se actualiza `pipelineStageId` del contacto
5. Se registra el movimiento en `pipelineStageHistory`
6. Se invalida cache de metricas y contactos
7. Se disparan automaciones de tipo `pipeline_stage_change`

## Logica de WIP Limit

### Que es el WIP Limit?

El WIP (Work In Progress) Limit es un mecanismo de control que limita la cantidad de contactos que pueden estar simultaneamente en una etapa.

### Comportamiento

1. **Verificacion dentro de transaccion**: Cuando se intenta mover un contacto a una etapa, el sistema verifica el WIP limit dentro de una transaccion para evitar race conditions.

2. **Bloqueo condicional**: Si la etapa tiene `wipLimit` definido y la cantidad actual de contactos en esa etapa es mayor o igual al limite, el movimiento es rechazado con el error "WIP limit exceeded".

3. **Etapas sin limite**: Si `wipLimit` es `null`, no hay restriccion - la etapa puede tener infinitos contactos.

### Implementacion

```typescript
// En move.ts - verificacion de WIP limit
if (toStage.wipLimit !== null) {
  const [{ count: currentCount }] = await tx
    .select({ count: count() })
    .from(contacts)
    .where(and(
      eq(contacts.pipelineStageId, toStageId),
      isNull(contacts.deletedAt)
    ));

  if (Number(currentCount) >= toStage.wipLimit) {
    throw new Error('WIP limit exceeded');
  }
}
```

## Historial de Cambios

Cada movimiento entre etapas se registra en la tabla `pipelineStageHistory`:

| Campo | Descripcion |
|-------|-------------|
| `contactId` | ID del contacto movido |
| `fromStage` | Etapa origen (null si es la primera) |
| `toStage` | Etapa destino |
| `reason` | Razon opcional del movimiento |
| `changedByUserId` | Usuario que realizo el cambio |
| `changedAt` | Timestamp del cambio |

## Gestion de Etapas

### Crear Nueva Etapa

Solo usuarios con rol `manager` o `admin` pueden crear etapas.

```typescript
// Schema de validacion (stages.ts)
const createStageSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional().nullable(),
  order: z.number().int().min(0),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#6B7280'),
  wipLimit: z.number().int().min(0).optional().nullable(),
});
```

### Garantia de Etapas Por Defecto

El sistema incluye una funcion `ensureDefaultPipelineStages()` que se ejecuta automaticamente antes de consultar las etapas. Esta funcion:

1. Verifica que las 7 etapas por defecto existan
2. Si no existen, las crea
3. Si existen pero tienen valores incorrectos, las actualiza
4. Es idempotente - puede ejecutarse multiples veces sin problemas

---

# Kanban Board Logic

## Descripcion General

El board kanban es la interfaz principal para visualizar y gestionar los contactos en el pipeline. Muestra cada etapa como una columna vertical con los contactos como tarjetas arrastrables.

## Estructura del Board

### Columnas por Etapa

Cada etapa del pipeline se representa como una columna en el board:

```
+------------------+------------------+------------------+
|    Prospecto     |    Contactado    | Primera reunion |
|    (Azul)        |    (Morado)       | (Amarillo)       |
|                  |                  |                  |
| +--------------+ | +--------------+ | +--------------+ |
| | Juan Perez   | | | Maria Garcia | | | Carlos Rodriguez |
| | +--------------+ | | +--------------+ | | +--------------+ |
| | Proximo paso:| | | Proximo paso:| | | Proximo paso:| |
| | Llamar manana| | | Enviar email  | | | Reunirviernes| |
| +--------------+ | +--------------+ | +--------------+ |
+------------------+------------------+------------------+
```

## Tarjetas de Contacto

### Informacion Mostrada

Cada tarjeta (card) de contacto en el board incluye:

| Campo | Descripcion | Fuente |
|-------|-------------|--------|
| Nombre completo | Nombre y apellido del contacto | `contacts.firstName` + `contacts.lastName` |
| Proximo paso | Accion a realizar proximamente | `contacts.nextStep` |
| Ultima actividad | Fecha de ultima interaccion | `contacts.contactLastTouchAt` |

### Interacciones

- **Click**: Abre el detalle completo del contacto
- **Drag & Drop**: Permite mover el contacto entre etapas

## Endpoints

### GET /pipeline/board

Obtiene el board kanban completo con todos los contactos organizados por etapa.

**Query Parameters:**

| Parametro | Tipo | Descripcion |
|-----------|------|-------------|
| `assignedAdvisorId` | uuid (opcional) | Filtrar por asesor asignado |
| `assignedTeamId` | uuid (opcional) | Filtrar por equipo asignado |

**Respuesta:**

```typescript
interface BoardStage {
  id: string;
  name: string;
  description: string | null;
  order: number;
  color: string;
  wipLimit: number | null;
  slaHours: number | null;
  isActive: boolean;
  currentCount: number;
  contacts: Contact[];
}

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  pipelineStageId: string | null;
  nextStep: string | null;
  assignedAdvisorId: string | null;
  // ... otros campos
}
```

## Filtros

### Por Asesor

Filtra los contactos del board para mostrar solo los asignados a un asesor especifico:

```
GET /pipeline/board?assignedAdvisorId=uuid-del-asesor
```

### Por Equipo

Filtra los contactos del board para mostrar solo los asignados a un equipo especifico:

```
GET /pipeline/board?assignedTeamId=uuid-del-equipo
```

### Por Fecha de Ultima Actividad

El campo `contactLastTouchAt` en cada contacto indica cuando fue la ultima interaccion. Este campo se usa para:

- Mostrar en la tarjeta cuando fue la ultima actividad
- Detectar contactos inactivos (para alertas o automatizaciones)
- Ordenar o filtrar si es necesario

## Moviment de Contactos (Drag & Drop)

### Logica de Movimiento

El movimiento se realiza mediante el endpoint `POST /pipeline/move`:

```typescript
const moveContactSchema = z.object({
  contactId: uuidSchema,
  toStageId: uuidSchema,
  reason: z.string().max(500).optional().nullable(),
});
```

### Proceso de Drag & Drop

1. Usuario arrastra una tarjeta a otra columna
2. Frontend envia `POST /pipeline/move` con `contactId` y `toStageId`
3. Backend verifica:
   - Permisos del usuario sobre el contacto
   - WIP limit de la etapa destino
4. Si todo OK:
   - Actualiza `pipelineStageId` del contacto
   - Registra el cambio en `pipelineStageHistory`
   - Invalida caches de metrics y pipeline
5. Frontend actualiza la vista

### Validaciones

1. **Acceso al contacto**: El usuario debe tener permisos sobre el contacto
2. **WIP Limit**: Si la etapa destino tiene WIP limit, no se permite si ya esta en el maximo
3. **Etapa existe**: La etapa destino debe existir y estar activa

## Optimizaciones de Rendimiento

El endpoint del board utiliza las siguientes optimizaciones:

1. **Query unica**: En lugar de N+1 queries, obtiene todos los contactos en una sola consulta
2. **Grouping en memoria**: Los contactos se agrupan por stageId en JavaScript (O(n))
3. **Cache Redis**: El resultado se cachea con TTL configurable
4. **Auto-garantia de etapas**: Verifica que las etapas por defecto existan antes de consultar

```typescript
// Single query para todos los contactos
const allContacts = await db()
  .select()
  .from(contacts)
  .where(and(...conditions));

// Grouping en memoria
const contactsByStageId = new Map<string, Contact[]>();
for (const contact of allContacts) {
  if (contact.pipelineStageId) {
    const existing = contactsByStageId.get(contact.pipelineStageId) || [];
    existing.push(contact);
    contactsByStageId.set(contact.pipelineStageId, existing);
  }
}
```

## Pipeline Metrics

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
| `changedAt` | timestamp | Momento del cambio
