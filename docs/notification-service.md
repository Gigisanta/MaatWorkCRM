# Notification Service

## Metodos

### createNotification()

**Endpoint:** `POST /notifications`
**Handler:** `handleCreateManualNotification`
**Roles:** `manager`, `admin`

Crea una notificacion manual para un usuario especifico.

**Parametros del body:**
```typescript
{
  userId: string;              // UUID del usuario destino
  type: string;                // Tipo de notificacion
  templateId?: string;         // UUID de plantilla (opcional)
  severity: 'info' | 'warning' | 'critical';
  contactId?: string;          // UUID de contacto relacionado (opcional)
  taskId?: string;             // UUID de tarea relacionada (opcional)
  payload: Record<string, unknown>;  // Datos estructurados
  renderedSubject?: string;    // Asunto renderizado (opcional)
  renderedBody: string;       // Cuerpo de la notificacion (requerido)
}
```

**Respuesta:** `201 Created`
```json
{
  "success": true,
  "data": { /* notification object */ },
  "requestId": "uuid"
}
```

---

### markAsRead()

**Endpoint:** `POST /notifications/:id/read`
**Handler:** `handleMarkAsRead`
**Autenticacion:** Requiere `requireAuth`

Marca una notificacion individual como leida.

**Parametros:**
- `id` (path): UUID de la notificacion

**Logica:**
1. Verifica que la notificacion pertenezca al usuario autenticado
2. Actualiza `readAt` con la fecha/hora actual
3. Lanza error `404` si la notificacion no existe o no pertenece al usuario

**Respuesta:** Notificacion actualizada

---

### getUnreadCount()

**Endpoint:** `GET /notifications/unread/count`
**Handler:** `handleGetUnreadCount`
**Autenticacion:** Requiere `requireAuth`

Obtiene el conteo de notificaciones no leidas para el usuario autenticado.

**Logica:**
- Cuenta solo notificaciones donde `readAt IS NULL`
- Excluye notificaciones en modo snooze (`snoozedUntil` > ahora)

**Respuesta:**
```json
{
  "count": 5
}
```

---

## Triggers

### MonitorQueryPerformanceJob

**Archivo:** `apps/api/src/jobs/monitor-query-performance.ts`

Job diario que monitorea queries lentas usando `pg_stat_statements` y genera alertas.

**Trigger:** Ejecucion diaria via scheduler

**Logica:**
1. Obtiene resumen de performance via `getPerformanceSummary()`
2. Detecta queries lentas (threshold: 1000ms para warning, 5000ms para critical)
3. Si hay alertas, envia notificaciones a usuarios admin

**Creacion de notificaciones:**
```typescript
// Para cada admin activo:
if (criticalAlerts.length > 0) {
  await db().insert(notifications).values({
    userId: adminId,
    type: 'critical',  // lookup_notification_type
    severity: 'critical',
    renderedBody: formatAlertMessage(criticalAlerts, 'critical'),
    payload: { alerts: criticalAlerts },
  });
}

if (warningAlerts.length > 0) {
  await db().insert(notifications).values({
    userId: adminId,
    type: 'info',
    severity: 'warning',
    renderedBody: formatAlertMessage(warningAlerts, 'warning'),
    payload: { alerts: warningAlerts },
  });
}
```

---

## Batch Operations

### markAllAsRead()

**Endpoint:** `POST /notifications/read-all`
**Handler:** `handleMarkAllAsRead`
**Autenticacion:** Requiere `requireAuth`

Marca todas las notificaciones no leidas del usuario como leidas.

**Logica:**
```typescript
await db()
  .update(notifications)
  .set({ readAt: new Date() })
  .where(and(
    eq(notifications.userId, userId),
    isNull(notifications.readAt)  // Solo no leidas
  ))
  .returning();
```

**Respuesta:**
```json
{
  "marked": 12
}
```

---

### list() - with filtering

**Endpoint:** `GET /notifications`
**Handler:** `handleListNotifications`
**Autenticacion:** Requiere `requireAuth`

Lista notificaciones con soporte para filtrado y paginacion.

**Query params:**
- `limit` (default: 50)
- `offset` (default: 0)
- `unreadOnly` (default: false)
- `severity` (optional): `info`, `warning`, `critical`

**Logica:**
- Filtra por `userId`
- Excluye notificaciones snoozed (`snoozedUntil` <= ahora)
- Ordena por `createdAt` descendente

**Respuesta:**
```json
{
  "items": [ /* notifications array */ ],
  "meta": {
    "limit": 50,
    "offset": 0
  }
}
```

---

### snoozeNotification()

**Endpoint:** `POST /notifications/:id/snooze`
**Handler:** `handleSnoozeNotification`

Pospone una notificacion hasta una fecha/hora especifica.

**Body:**
```typescript
{
  until: string  // ISO datetime
}
```

---

### registerClick()

**Endpoint:** `POST /notifications/:id/click`
**Handler:** `handleRegisterClick`

Registra el click en una notificacion y la marca como leida.

**Efectos:**
- Establece `clickedAt` = ahora
- Establece `readAt` = ahora

---

## Estructura de Datos

### notifications table

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| id | uuid | PK |
| userId | uuid | FK -> users.id |
| type | text | FK -> lookup_notification_type.id |
| templateId | uuid | FK -> notification_templates.id (opcional) |
| severity | text | 'info' \| 'warning' \| 'critical' |
| contactId | uuid | FK -> contacts.id (opcional) |
| taskId | uuid | Referencia a tarea (opcional) |
| payload | jsonb | Datos estructurados |
| renderedSubject | text | Asunto renderizado |
| renderedBody | text | Cuerpo de la notificacion |
| deliveredChannels | text[] | Canales entregados |
| readAt | timestamp | Fecha de lectura (null si no leida) |
| snoozedUntil | timestamp | Fecha hasta la cual esta snoozed |
| processed | boolean | Si fue procesada |
| clickedAt | timestamp | Fecha del ultimo click |
| createdAt | timestamp | Fecha de creacion |

### Indices

- `idx_notifications_unread`: (userId, createdAt) WHERE readAt IS NULL
- `idx_notifications_unprocessed`: (processed) WHERE processed = false
- `idx_notifications_snoozed`: (userId, snoozedUntil)
- `idx_notifications_unread_recent`: (userId, createdAt) WHERE readAt IS NULL
