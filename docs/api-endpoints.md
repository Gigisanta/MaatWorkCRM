# Contacts API Endpoints

## GET /contacts
**Descripcion:** Lista contactos con filtros y paginacion

**Middleware:** `auth`, `contactAccess`, `validate`, `cache`

**Query params:**
| Param | Tipo | Requerido | Descripcion |
|-------|------|-----------|-------------|
| `limit` | number | No | Limite de resultados (default: 50) |
| `offset` | number | No | Offset para paginacion (default: 0) |
| `pipelineStageId` | uuid | No | Filtrar por etapa del pipeline |
| `assignedAdvisorId` | uuid | No | Filtrar por asesor asignado |

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "firstName": "string",
      "lastName": "string",
      "fullName": "string",
      "email": "string | null",
      "phone": "string | null",
      "country": "string",
      "dni": "string | null",
      "pipelineStageId": "uuid | null",
      "source": "string | null",
      "riskProfile": "string | null",
      "assignedAdvisorId": "uuid | null",
      "assignedTeamId": "uuid | null",
      "nextStep": "string | null",
      "contactLastTouchAt": "date | null",
      "customFields": "object",
      "createdAt": "date",
      "updatedAt": "date",
      "deletedAt": "date | null"
    }
  ],
  "pagination": {
    "total": "number",
    "limit": "number",
    "offset": "number"
  }
}
```

**Headers de respuesta:**
- `Cache-Control: no-cache, no-store, must-revalidate`
- `Pragma: no-cache`
- `Expires: 0`

**Errores:**
- `401 Unauthorized` - No autenticado
- `403 Forbidden` - Owner no tiene acceso (solo lectura)

---

## GET /contacts/batch
**Descripcion:** Obtiene multiples contactos con sus tags relacionados

**Middleware:** `auth`, `validate`

**Query params:**
| Param | Tipo | Requerido | Descripcion |
|-------|------|-----------|-------------|
| `contactIds` | string | Si | Lista de IDs separada por comas (max: 50) |
| `includeTags` | boolean | No | Incluir tags en respuesta (default: true) |

**Response:**
```json
[
  {
    "id": "uuid",
    "firstName": "string",
    "lastName": "string",
    "fullName": "string",
    "email": "string | null",
    "phone": "string | null",
    "country": "string",
    "dni": "string | null",
    "pipelineStageId": "uuid | null",
    "source": "string | null",
    "riskProfile": "string | null",
    "assignedAdvisorId": "uuid | null",
    "assignedTeamId": "uuid | null",
    "nextStep": "string | null",
    "contactLastTouchAt": "date | null",
    "customFields": "object",
    "createdAt": "date",
    "updatedAt": "date",
    "deletedAt": "date | null",
    "tags": [
      {
        "id": "uuid",
        "name": "string",
        "color": "string",
        "icon": "string | null"
      }
    ]
  }
]
```

**Errores:**
- `400 Bad Request` - IDs invalidos o exceden maximo (50)
- `401 Unauthorized` - No autenticado

---

## POST /contacts/webhook
**Descripcion:** Exporta contactos a un webhook externo (proxy optimizado con batching)

**Middleware:** `auth`, `rateLimit` (webhook especifico por usuario), `validate`

**Headers:**
- Rate limit: configurable via `WEBHOOK_RATE_LIMIT`

**Body:**
```json
{
  "webhookUrl": "string (URL valida http/https)",
  "contacts": [
    {
      "id": "uuid",
      "firstName": "string",
      "lastName": "string",
      "fullName": "string | optional",
      "email": "string | null | optional",
      "phone": "string | null | optional",
      "country": "string | null | optional",
      "dni": "string | null | optional",
      "pipelineStageId": "uuid | null | optional",
      "source": "string | null | optional",
      "riskProfile": "\"low\" | \"mid\" | \"high\" | null | optional",
      "assignedAdvisorId": "uuid | null | optional",
      "assignedTeamId": "uuid | null | optional",
      "nextStep": "string | null | optional",
      "notes": "string | null | optional",
      "queSeDedica": "string | null | optional",
      "familia": "string | null | optional",
      "expectativas": "string | null | optional",
      "objetivos": "string | null | optional",
      "requisitosPlanificacion": "string | null | optional",
      "prioridades": "string[] | null | optional",
      "preocupaciones": "string[] | null | optional",
      "ingresos": "number | string | null | optional",
      "gastos": "number | string | null | optional",
      "excedente": "number | string | null | optional",
      "customFields": "object | null | optional",
      "tags": "unknown[] | optional"
    }
  ],
  "metadata": {
    "filters": {
      "stage": "string | null | optional",
      "tags": "string[] | optional",
      "search": "string | null | optional",
      "advisorId": "string | null | optional"
    }
  }
}
```

**Response (exito):**
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "string",
    "batchesCount": "number",
    "contactsCount": "number"
  },
  "requestId": "string"
}
```

**Response (fallo parcial - 207):**
```json
{
  "success": false,
  "error": "string",
  "details": {
    "successful": "number",
    "failed": "number",
    "total": "number",
    "errors": "string[]"
  },
  "requestId": "string"
}
```

**Errores:**
- `400 Bad Request` - Schema invalido o sin contactos
- `401 Unauthorized` - No autenticado
- `503 Service Unavailable` - Webhook deshabilitado
- `207 Multi-Status` - Fallo parcial en batches

**Configuraciones:**
- `WEBHOOK_BATCH_SIZE` - Tamanio de cada batch
- `WEBHOOK_TIMEOUT` - Timeout por batch (ms)
- `WEBHOOK_RATE_LIMIT` - Limite de requests por minuto
- Retry con exponential backoff (max 3 intentos)

---

## POST /contacts/import
**Descripcion:** Importa contactos desde archivo CSV (formato Balanz AUM)

**Middleware:** `auth`, `role:admin`, `upload` (Multer - CSV, max 10MB)

**Body:** `multipart/form-data`
| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `file` | File (CSV) | Archivo CSV a importar |

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "total": "number",
      "created": "number",
      "updated": "number",
      "skipped": "number",
      "errors": "number",
      "unknownAdvisors": "string[]"
    },
    "message": "string"
  }
}
```

**Errores:**
- `400 Bad Request` - Sin archivo o formato CSV invalido
- `401 Unauthorized` - No autenticado
- `403 Forbidden` - Solo admins pueden importar

**Proceso:**
1. Parsea CSV (soporta BOM, columnas: idCuenta, Descripcion, Asesor, comitente)
2. Normaliza nombres de asesores via `advisorAliases`
3. Busca duplicados por `customFields.idCuenta`
4. Crea contactos faltantes o actualiza si falta asesor

---

## GET /contacts/:id
**Descripcion:** Obtiene detalle basico de contacto con timeline y attachments

**Middleware:** `auth`, `contactAccess`, `validate`

**Path params:**
| Param | Tipo | Descripcion |
|-------|------|-------------|
| `id` | uuid | ID del contacto |

**Query params:**
| Param | Tipo | Default | Descripcion |
|-------|------|---------|-------------|
| `includeTimeline` | boolean | true | Incluir tareas recientes en timeline |

**Response:**
```json
{
  "id": "uuid",
  "firstName": "string",
  "lastName": "string",
  "fullName": "string",
  "email": "string | null",
  "phone": "string | null",
  "country": "string",
  "dni": "string | null",
  "pipelineStageId": "uuid | null",
  "source": "string | null",
  "riskProfile": "string | null",
  "assignedAdvisorId": "uuid | null",
  "assignedTeamId": "uuid | null",
  "nextStep": "string | null",
  "contactLastTouchAt": "date | null",
  "customFields": "object",
  "createdAt": "date",
  "updatedAt": "date",
  "deletedAt": "date | null",
  "tags": [
    {
      "id": "uuid",
      "name": "string",
      "color": "string",
      "icon": "string | null"
    }
  ],
  "timeline": [
    {
      "id": "uuid",
      "title": "string",
      "description": "string",
      "type": "task",
      "timestamp": "date",
      "userId": "uuid"
    }
  ],
  "attachments": [
    {
      "id": "uuid",
      "filename": "string",
      "mimeType": "string",
      "url": "string",
      "createdAt": "date"
    }
  ]
}
```

**Errores:**
- `400 Bad Request` - ID invalido
- `401 Unauthorized` - No autenticado
- `403 Forbidden` - Owner no tiene acceso
- `404 Not Found` - Contacto no existe o fue eliminado

---

## GET /contacts/:id/detail
**Descripcion:** Obtiene detalle consolidado del contacto con todos los datos relacionados

**Middleware:** `auth`, `validate`

**Path params:**
| Param | Tipo | Descripcion |
|-------|------|-------------|
| `id` | uuid | ID del contacto |

**Response:**
```json
{
  "contact": {
    "id": "uuid",
    "firstName": "string",
    "lastName": "string",
    "fullName": "string",
    "email": "string | null",
    "phone": "string | null",
    "country": "string",
    "dni": "string | null",
    "pipelineStageId": "uuid | null",
    "source": "string | null",
    "riskProfile": "string | null",
    "assignedAdvisorId": "uuid | null",
    "assignedTeamId": "uuid | null",
    "nextStep": "string | null",
    "queSeDedica": "string | null",
    "familia": "string | null",
    "expectativas": "string | null",
    "objetivos": "string | null",
    "requisitosPlanificacion": "string | null",
    "prioridades": "string[]",
    "preocupaciones": "string[]",
    "ingresos": "object",
    "gastos": "object",
    "excedente": "number | null",
    "customFields": "object",
    "createdAt": "date",
    "updatedAt": "date",
    "tags": [
      {
        "id": "uuid",
        "name": "string",
        "color": "string",
        "icon": "string | null",
        "businessLine": "string | null",
        "monthlyPremium": "string | null",
        "policyNumber": "string | null"
      }
    ]
  },
  "stages": [
    {
      "id": "uuid",
      "name": "string",
      "order": "number"
    }
  ],
  "advisors": [
    {
      "id": "uuid",
      "email": "string",
      "fullName": "string"
    }
  ],
  "tasks": [
    {
      "id": "uuid",
      "title": "string",
      "description": "string | null",
      "status": "string",
      "dueDate": "string | null",
      "priority": "string",
      "assignedToUserId": "uuid",
      "createdAt": "date"
    }
  ],
  "notes": [
    {
      "id": "uuid",
      "content": "string",
      "source": "string",
      "noteType": "string",
      "createdAt": "date"
    }
  ],
  "brokerAccounts": [
    {
      "id": "uuid",
      "broker": "string",
      "accountNumber": "string",
      "holderName": "string | null",
      "status": "string"
    }
  ],
  "portfolioAssignments": [
    {
      "id": "uuid",
      "portfolioId": "uuid",
      "status": "string",
      "startDate": "date",
      "endDate": "date | null"
    }
  ]
}
```

**Errores:**
- `400 Bad Request` - ID invalido
- `401 Unauthorized` - No autenticado
- `404 Not Found` - Contacto no existe

---

## GET /contacts/:id/history
**Descripcion:** Obtiene historial de cambios de campos del contacto

**Middleware:** `auth`, `validate`

**Path params:**
| Param | Tipo | Descripcion |
|-------|------|-------------|
| `id` | uuid | ID del contacto |

**Query params:**
| Param | Tipo | Default | Descripcion |
|-------|------|---------|-------------|
| `limit` | number | 50 | Limite de resultados |
| `offset` | number | 0 | Offset para paginacion |

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "contactId": "uuid",
      "fieldName": "string",
      "oldValue": "string | null",
      "newValue": "string | null",
      "changedByUserId": "uuid",
      "changedAt": "date"
    }
  ],
  "pagination": {
    "total": "number",
    "limit": "number",
    "offset": "number"
  }
}
```

**Errores:**
- `400 Bad Request` - ID o parametros invalidos
- `401 Unauthorized` - No autenticado

---

## POST /contacts
**Descripcion:** Crea un nuevo contacto

**Middleware:** `auth`, `writeAccess`, `validate`

**Body:**
```json
{
  "firstName": "string (required, max 255)",
  "lastName": "string (required, max 255)",
  "email": "string | null (optional, formato email)",
  "phone": "string | null (optional, max 50)",
  "phoneSecondary": "string | null (optional, max 50)",
  "whatsapp": "string | null (optional, max 50)",
  "address": "string | null (optional)",
  "city": "string | null (optional)",
  "country": "string (default: AR)",
  "dateOfBirth": "string | null (optional, ISO date)",
  "dni": "string | null (optional, max 50)",
  "source": "string | null (optional, max 100)",
  "riskProfile": "\"low\" | \"mid\" | \"high\" | null (optional)",
  "nextStep": "string | null (optional, max 500)",
  "pipelineStageId": "uuid | null (optional)",
  "assignedAdvisorId": "uuid | null (optional)",
  "queSeDedica": "string | null (optional)",
  "familia": "string | null (optional)",
  "expectativas": "string | null (optional)",
  "objetivos": "string | null (optional)",
  "requisitosPlanificacion": "string | null (optional)",
  "prioridades": "string[] (default: [])",
  "preocupaciones": "string[] (default: [])",
  "ingresos": "object (required)",
  "gastos": "object (required)",
  "excedente": "number | string | null (optional)",
  "customFields": "object (default: {})",
  "notes": "string | null (optional, max 2000)"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "firstName": "string",
    "lastName": "string",
    "fullName": "string",
    "email": "string | null",
    "phone": "string | null",
    "country": "string",
    "dni": "string | null",
    "pipelineStageId": "uuid | null",
    "source": "string | null",
    "riskProfile": "string | null",
    "assignedAdvisorId": "uuid | null",
    "assignedTeamId": "uuid | null",
    "nextStep": "string | null",
    "contactLastTouchAt": "date | null",
    "customFields": "object",
    "createdAt": "date",
    "updatedAt": "date",
    "deletedAt": "date | null"
  },
  "warning": "string | null (asesor auto-asignado si aplica)",
  "requestId": "string"
}
```

**Logica de negocio:**
- Si `assignedAdvisorId` no es valido para el rol, se auto-asigna
- Si `pipelineStageId` no existe, se omite
- Registra `pipelineStageHistory` al crear

**Errores:**
- `400 Bad Request` - Schema invalido
- `401 Unauthorized` - No autenticado
- `403 Forbidden` - Owner no tiene acceso de escritura
- `500 Internal Server Error` - Error en creacion

---

## POST /contacts/:id/interaction
**Descripcion:** Incrementa o decrementa el contador de interacciones de un contacto en una etapa

**Middleware:** `auth`, `validate`

**Path params:**
| Param | Tipo | Descripcion |
|-------|------|-------------|
| `id` | uuid | ID del contacto |

**Body:**
```json
{
  "stageId": "uuid (required)",
  "action": "\"increment\" | \"decrement\" (required)"
}
```

**Response:**
```json
{
  "interactionCount": "number",
  "lastInteractionAt": "date"
}
```

**Logica de negocio:**
- Usa transaccion para atomicidad
- Previene contadores negativos (reset a 0 si < 0)
- Actualiza `contactLastTouchAt` y `updatedAt` del contacto
- Invalidacion de cache: `crm:contacts:*`, `crm:contacts:{userId}:*`, `crm:pipeline:*`

**Errores:**
- `400 Bad Request` - Schema invalido
- `401 Unauthorized` - No autenticado
- `403 Forbidden` - Sin permiso para modificar contacto
- `404 Not Found` - Contacto o etapa no encontrada

---

## PATCH /contacts/:id/next-step
**Descripcion:** Actualiza solo el campo nextStep del contacto

**Middleware:** `auth`, `validate`

**Path params:**
| Param | Tipo | Descripcion |
|-------|------|-------------|
| `id` | uuid | ID del contacto |

**Body:**
```json
{
  "nextStep": "string | null (optional, max 500)"
}
```

**Response:**
```json
{
  "id": "uuid",
  "nextStep": "string | null",
  "updatedAt": "date"
}
```

**Logica de negocio:**
- Registra cambio en `contactFieldHistory` si el valor cambia

**Errores:**
- `400 Bad Request` - Schema invalido
- `401 Unauthorized` - No autenticado
- `404 Not Found` - Contacto no encontrado

---

## PUT /contacts/:id
**Descripcion:** Actualizacion completa (full update) de un contacto

**Middleware:** `auth`, `writeAccess`, `validate`

**Path params:**
| Param | Tipo | Descripcion |
|-------|------|-------------|
| `id` | uuid | ID del contacto |

**Body:** Mismo schema que POST /contacts (todos los campos opcionales)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "firstName": "string",
    "lastName": "string",
    "fullName": "string",
    "email": "string | null",
    "phone": "string | null",
    "country": "string",
    "dni": "string | null",
    "pipelineStageId": "uuid | null",
    "source": "string | null",
    "riskProfile": "string | null",
    "assignedAdvisorId": "uuid | null",
    "assignedTeamId": "uuid | null",
    "nextStep": "string | null",
    "contactLastTouchAt": "date | null",
    "customFields": "object",
    "createdAt": "date",
    "updatedAt": "date",
    "deletedAt": "date | null",
    "version": "number"
  },
  "warning": "string | null",
  "requestId": "string"
}
```

**Logica de negocio:**
- Optimistic locking con `version` field
- Validacion de reasignacion de asesor (rol advisor solo puede asignarse a si mismo)
- Si `pipelineStageId` cambia, registra `pipelineStageHistory`
- Notifica al nuevo asesor asignado
- Triggers de automaciones (email) al cambiar etapa
- Invalidacion de cache: `contactsListCacheUtil.clear()`, `crm:contacts:*`, `crm:pipeline:*` (si cambio etapa)

**Errores:**
- `400 Bad Request` - Schema invalido
- `401 Unauthorized` - No autenticado
- `403 Forbidden` - Owner no tiene acceso de escritura
- `404 Not Found` - Contacto no encontrado
- `409 Conflict` - Version conflict (otro usuario modifico el registro)

---

## PATCH /contacts/:id
**Descripcion:** Actualizacion parcial (partial update) de un contacto

**Middleware:** `auth`, `writeAccess`, `validate`

**Path params:**
| Param | Tipo | Descripcion |
|-------|------|-------------|
| `id` | uuid | ID del contacto |

**Body:**
```json
{
  "fields": [
    {
      "field": "string (nombre del campo)",
      "value": "unknown (nuevo valor)"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "firstName": "string",
    "lastName": "string",
    "fullName": "string",
    "email": "string | null",
    "phone": "string | null",
    "country": "string",
    "dni": "string | null",
    "pipelineStageId": "uuid | null",
    "source": "string | null",
    "riskProfile": "string | null",
    "assignedAdvisorId": "uuid | null",
    "assignedTeamId": "uuid | null",
    "nextStep": "string | null",
    "contactLastTouchAt": "date | null",
    "customFields": "object",
    "createdAt": "date",
    "updatedAt": "date",
    "deletedAt": "date | null",
    "version": "number"
  },
  "warning": "string | null",
  "requestId": "string"
}
```

**Logica de negocio:**
- Misma logica que PUT para version conflict, reasignacion, notificaciones y automaciones
- Registra cada campo cambiado en `contactFieldHistory`

**Errores:**
- `400 Bad Request` - Schema invalido
- `401 Unauthorized` - No autenticado
- `403 Forbidden` - Owner no tiene acceso de escritura
- `404 Not Found` - Contacto no encontrado
- `409 Conflict` - Version conflict

---

## DELETE /contacts/:id
**Descripcion:** Eliminacion logica (soft delete) de un contacto

**Middleware:** `auth`, `role:manager|admin`

**Path params:**
| Param | Tipo | Descripcion |
|-------|------|-------------|
| `id` | uuid | ID del contacto |

**Response:**
```json
{
  "id": "uuid",
  "deleted": true
}
```

**Logica de negocio:**
- Solo managers y admins pueden eliminar
- No elimina fisicamente, solo establece `deletedAt`
- Invalidacion de cache: `crm:contacts:*`, `crm:pipeline:*`

**Errores:**
- `400 Bad Request` - ID invalido
- `401 Unauthorized` - No autenticado
- `403 Forbidden` - No tiene rol manager o admin
- `404 Not Found` - Contacto no encontrado

---

## Middlewares Aplicados

| Middleware | Descripcion |
|------------|-------------|
| `auth` | Requiere autenticacion JWT valida |
| `contactAccess` | Bloquea acceso a Owner (solo lectura para demas roles) |
| `writeAccess` | Bloquea Owner de operaciones de escritura |
| `role:admin` | Requiere rol admin |
| `role:manager\|admin` | Requiere rol manager o admin |
| `validate` | Validacion de schemas Zod |
| `cache` | Redis cache con TTL configurable |
| `rateLimit` | Rate limiting por usuario (webhook) |
| `upload` | Upload de archivos Multer (CSV) |

## Códigos de Error Comunes

| Codigo | Descripcion |
|--------|-------------|
| `400` | Bad Request - Schema invalido o parametros incorrectos |
| `401` | Unauthorized - No autenticado o token invalido |
| `403` | Forbidden - Sin permisos para la operacion |
| `404` | Not Found - Recurso no encontrado |
| `409` | Conflict - Version conflict (optimistic locking) |
| `500` | Internal Server Error - Error inesperado del servidor |
| `503` | Service Unavailable - Servicio deshabilitado (webhooks) |
| `207` | Multi-Status - Fallo parcial en operacion multi-recurso |
