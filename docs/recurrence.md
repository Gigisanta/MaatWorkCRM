# Task Recurrence

## Modelo de Datos

La recurrencia de tareas se maneja a través de la tabla `taskRecurrences` que almacena la definición de la regla de recurrencia.

```typescript
// apps/api/src/services/task-service.ts
recurrence?: {
  rrule: string;
  timezone: string;
  startDate: string | Date;
  endDate?: string | Date;
};
```

### Estructura de taskRecurrences

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | Identificador único |
| `rrule` | text | Formato iCal RRULE (ej: `FREQ=DAILY;INTERVAL=1;COUNT=10`) |
| `timezone` | text | Zona horaria (default: `America/Argentina/Buenos_Aires`) |
| `startDate` | date | Fecha de inicio de la recurrencia |
| `endDate` | date | Fecha de fin (null = sin fin) |
| `nextOccurrence` | date | Próxima fecha a generar |
| `isActive` | boolean | Si la recurrencia está activa |
| `createdAt` | timestamp | Fecha de creación |
| `updatedAt` | timestamp | Última modificación |

### Índice Compuesto

```typescript
taskRecurrencesNextIdx: index('idx_task_recurrences_next').on(
  table.nextOccurrence,
  table.isActive
)
```

## Tipos de Recurrencia

El tipo de recurrencia se define mediante el campo `rrule` usando el formato estándar iCal (RFC 5545).

### Formato RRULE

```
FREQ=<FREQUENCY>;INTERVAL=<INTERVAL>[;COUNT=<COUNT>]
```

### Frecuencias Soportadas

| Frecuencia | Descripción | Ejemplo |
|------------|-------------|---------|
| `DAILY` | Repetir diariamente | `FREQ=DAILY;INTERVAL=1` |
| `WEEKLY` | Repetir semanalmente | `FREQ=WEEKLY;INTERVAL=1` |
| `MONTHLY` | Repetir mensualmente | `FREQ=MONTHLY;INTERVAL=1` |
| `YEARLY` | Repetir anualmente | `FREQ=YEARLY;INTERVAL=1` |

### Ejemplos de RRULE

```typescript
// Diariamente cada 2 días, 10 ocurrencias
FREQ=DAILY;INTERVAL=2;COUNT=10

// Semanalmente cada 1 semana, sin límite
FREQ=WEEKLY;INTERVAL=1

// Mensualmente el día 15, hasta fecha específica
FREQ=MONTHLY;INTERVAL=1;UNTIL=20251231

// Anual el 1 de enero
FREQ=YEARLY;INTERVAL=1
```

## Fin de Recurrencia

La recurrencia puede terminar de tres formas:

### 1. Sin Fin (never)

Cuando `endDate` es `null` y no se especifica `COUNT` en el RRULE:

```typescript
// En task-service.ts createTask
{
  rrule: 'FREQ=DAILY;INTERVAL=1',
  timezone: 'America/Argentina/Buenos_Aires',
  startDate: new Date(),
  endDate: null  // Sin fin
}
```

### 2. Después de N Ocurrencias (after N occurrences)

Usando el parámetro `COUNT` en el RRULE:

```
FREQ=DAILY;INTERVAL=1;COUNT=10  // 10 ocurrencias
```

### 3. En Fecha Específica (on date)

Usando el parámetro `UNTIL` en el RRULE:

```
FREQ=DAILY;INTERVAL=1;UNTIL=20251231
```

O mediante el campo `endDate` de la tabla:

```typescript
{
  rrule: 'FREQ=DAILY;INTERVAL=1',
  startDate: new Date(),
  endDate: new Date('2025-12-31')  // Termina en fecha específica
}
```

## Cálculo de Próxima Fecha

### Campo nextOccurrence

El sistema utiliza el campo `nextOccurrence` en `taskRecurrences` para rastrear la próxima fecha a generar:

```typescript
// apps/api/src/services/task-service.ts - createTask
.insert(taskRecurrences)
.values({
  rrule: data.recurrence.rrule,
  timezone: data.recurrence.timezone,
  startDate: data.recurrence.startDate,
  endDate: data.recurrence.endDate || null,
  nextOccurrence: data.recurrence.startDate,  // Inicia con la fecha de inicio
  isActive: true,
})
```

### Índice para Query de Próximas Ocurrencias

```typescript
idx_task_recurrences_next: index('idx_task_recurrences_next').on(
  table.nextOccurrence,
  table.isActive
)
```

Este índice permite consultar eficientemente las recurrencias que necesitan generar nuevas tareas.

### Lógica de Cálculo (Pendiente de Implementar)

La lógica de cálculo de la próxima fecha a partir del RRULE aún no está implementada en el servicio. Se espera que:

1. Se lea el RRULE para determinar frecuencia e intervalo
2. Se calcule la siguiente fecha basándose en `nextOccurrence` actual
3. Se actualice `nextOccurrence` con el nuevo valor
4. Se genere una nueva tarea hija vinculada a la recurrencia

## Manejo de Exceciones

### Estado Actual

El manejo de excepciones (tareas saltadas o modificadas) aún no está completamente implementado.

### Estructura de Soporte

La tabla `tasks` ya cuenta con campos de soporte para recurrencias:

```typescript
// apps/api/src/db-init.ts (schema tasks)
recurrenceId: uuid('recurrence_id').references(() => taskRecurrences.id),
parentTaskId: uuid('parent_task_id'), // Para tareas recurrentes, referencia a la serie
```

### Patrones Planeados

#### Tarea Saltada (Skip)
- Una tarea se marca como `status = 'skipped'`
- Se genera la siguiente ocurrencia normalmente
- El historial de saltadas se preserva

#### Tarea Modificada
- La tarea hija se desvincula del `recurrenceId`
- Se crea una copia independiente con las modificaciones
- La recurrencia original continúa para las siguientes ocurrencias

#### Tarea Completada con Modificación
- Se marca como `completed`
- Se genera la siguiente ocurrencia normalmente
- Las modificaciones futuras no afectan las completadas

### Sincronización con Google Calendar

Las tareas recurrentes se sincronizan con Google Calendar:

```typescript
// apps/api/src/services/task-service.ts
syncTaskToGoogle(newTask.id, 'create').catch((err) =>
  log.error({ err, taskId: newTask.id }, 'failed to sync task to google')
);
```
