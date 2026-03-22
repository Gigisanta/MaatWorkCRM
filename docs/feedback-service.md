# Feedback Service

## Metodos

### createFeedback()
- **Endpoint:** `POST /v1/feedback`
- **Autenticacion:** Requiere usuario autenticado
- **Schema de entrada:**
  - `type`: enum (`feedback`, `feature_request`, `bug`) - valor por defecto `feedback`
  - `content`: string (10-2000 caracteres)
- **Retorna:** Feedback creado con campos: `id`, `userId`, `type`, `content`, `status`, `createdAt`, `updatedAt`
- **Notas:** El status inicial es siempre `new`

### updateStatus()
- **Endpoint:** `PATCH /v1/feedback/:id`
- **Autenticacion:** Requiere rol `admin`
- **Schema de entrada:**
  - `status`: enum (`new`, `in_progress`, `completed`, `closed`)
  - `adminNotes`: string opcional (max 1000 caracteres)
- **Retorna:** Feedback actualizado
- **Errores:** Lanza excepcion si no encuentra el feedback

### listByStatus()
- **Endpoint:** `GET /v1/feedback`
- **Autenticacion:** Requiere rol `admin`
- **Query params:**
  - `status`: enum opcional - filtrar por estado
  - `type`: enum opcional - filtrar por tipo
  - `page`: numero (default 1)
  - `limit`: numero (default 20, max 100)
- **Retorna:** Objeto con:
  - `items`: array de feedbacks
  - `meta`: `{ page, limit, total, totalPages }`
- **Ordenamiento:** Por `createdAt` descendente (mas recientes primero)

## Workflow

```
submitted (new) --> reviewed (in_progress) --> addressed (completed) --> closed (closed)
```

| Estado | Descripcion |
|--------|-------------|
| `new` | Feedback recien recibido, pendiente de revision |
| `in_progress` | Feedback revisado y en proceso de atencion |
| `completed` | Feedback procesado y resuelto |
| `closed` | Feedback archivado/cerrado |

**Transiciones validas:**
- `new` → `in_progress`
- `new` → `closed`
- `in_progress` → `completed`
- `in_progress` → `closed`
- `completed` → `closed`
- `completed` → `in_progress` (reabrir)

## Notificaciones

### Notificacion a Administradores (al crear feedback)
Cuando un usuario envia feedback:
1. Se notifica a todos los usuarios activos con rol `admin` o `staff`
2. Tipo de notificacion: `feedback_received`
3. Severidad: `info`
4. Contenido: Incluye tipo de feedback y preview del contenido (primeros 50 caracteres)
5. Payload: `{ feedbackId, type, contentPreview }`

### Notificacion al Usuario (NO implementada)
**Nota:** El flujo actual **no envia notificaciones** al usuario que envio el feedback cuando su estado cambia. Los admins pueden agregar notas en `adminNotes` pero el usuario no recibe alerta automatica.

