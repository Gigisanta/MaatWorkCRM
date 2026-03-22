# Documentación de API

## Visión General

La API de MaatWork CRM sigue principios RESTful y está construida sobre Next.js API Routes. Todos los endpoints retornan JSON.

## Autenticación

La mayoría de endpoints requieren autenticación. Incluir el header:
```
Cookie: session-token=<token>
```

## Formato de Respuesta

### Éxito
```json
{
  "data": { ... },
  "message": "Operation successful"
}
```

### Error
```json
{
  "error": "Error message",
  "details": { ... } // Optional
}
```

---

## Autenticación

### POST /api/auth/login

Autentica un usuario.

**Request Body:**
```json
{
  "identifier": "user@example.com",
  "password": "password123"
}
```

**Response 200:**
```json
{
  "success": true,
  "user": {
    "id": "clx123...",
    "email": "user@example.com",
    "name": "Juan Demo",
    "role": "advisor",
    "organizationId": "org_123"
  }
}
```

**Response 401:**
```json
{
  "error": "Credenciales inválidas"
}
```

---

### POST /api/auth/register

Registra un nuevo usuario.

**Request Body:**
```json
{
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "password": "password123",
  "role": "advisor",
  "managerId": "user_manager" // Requerido si role = advisor
}
```

**Response 201:**
```json
{
  "success": true,
  "message": "Usuario creado. Pendiente de aprobación."
}
```

---

### POST /api/auth/logout

Cierra la sesión del usuario.

**Response 200:**
```json
{
  "success": true
}
```

---

### GET /api/auth/session

Obtiene la sesión actual.

**Response 200:**
```json
{
  "user": {
    "id": "clx123...",
    "email": "user@example.com",
    "name": "Juan Demo",
    "role": "advisor",
    "organizationId": "org_123"
  }
}
```

**Response 401:**
```json
{
  "user": null
}
```

---

## Contactos

### GET /api/contacts

Lista contactos con filtros y paginación.

**Query Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| search | string | Búsqueda por nombre o email |
| stage | string | ID de etapa del pipeline |
| segment | string | Segmento (Premium, Estándar, Corporativo) |
| assignedTo | string | ID del usuario asignado |
| page | number | Página (default: 1) |
| limit | number | Elementos por página (default: 20) |

**Response 200:**
```json
{
  "data": [
    {
      "id": "contact_1",
      "name": "María López",
      "email": "maria@email.com",
      "phone": "+52 55 1234 5678",
      "company": "TechCorp",
      "emoji": "👩‍💼",
      "segment": "Premium",
      "pipelineStage": {
        "id": "stage_1",
        "name": "Apertura",
        "color": "#10b981"
      },
      "tags": [
        { "id": "tag_1", "name": "VIP", "color": "#f59e0b" }
      ],
      "assignedUser": {
        "id": "user_1",
        "name": "Ana García"
      },
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "pages": 3
  }
}
```

---

### POST /api/contacts

Crea un nuevo contacto.

**Request Body:**
```json
{
  "name": "Nuevo Contacto",
  "email": "nuevo@email.com",
  "phone": "+52 55 1111 2222",
  "company": "Empresa ABC",
  "segment": "Estándar",
  "source": "Referido",
  "pipelineStageId": "stage_prospecto",
  "assignedTo": "user_ana"
}
```

**Response 201:**
```json
{
  "id": "contact_new",
  "name": "Nuevo Contacto",
  "email": "nuevo@email.com",
  ...
}
```

---

### GET /api/contacts/[id]

Obtiene un contacto con todas sus relaciones.

**Response 200:**
```json
{
  "id": "contact_1",
  "name": "María López",
  "email": "maria@email.com",
  ...
  "deals": [
    {
      "id": "deal_1",
      "title": "Plan integral",
      "value": 150000,
      "probability": 100
    }
  ],
  "tasks": [
    {
      "id": "task_1",
      "title": "Llamar seguimiento",
      "status": "pending",
      "dueDate": "2024-02-01"
    }
  ],
  "notes": [
    {
      "id": "note_1",
      "content": "Interesada en diversificar",
      "author": { "name": "Ana García" }
    }
  ],
  "stageHistory": [
    {
      "fromStage": "Segunda reunion",
      "toStage": "Apertura",
      "changedAt": "2024-02-01"
    }
  ]
}
```

---

### PUT /api/contacts/[id]

Actualiza un contacto.

**Request Body:**
```json
{
  "name": "María López Actualizado",
  "pipelineStageId": "stage_cliente"
}
```

---

### DELETE /api/contacts/[id]

Elimina un contacto.

**Response 200:**
```json
{
  "success": true,
  "message": "Contacto eliminado"
}
```

---

### POST /api/contacts/[id]/tags

Agrega un tag al contacto.

**Request Body:**
```json
{
  "tagId": "tag_vip"
}
```

---

### DELETE /api/contacts/[id]/tags/[tagId]

Remueve un tag del contacto.

---

## Deals (Pipeline)

### GET /api/deals

Lista deals con filtros.

**Query Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| stageId | string | Filtrar por etapa |
| assignedTo | string | Filtrar por asignado |
| contactId | string | Filtrar por contacto |

**Response 200:**
```json
{
  "data": [
    {
      "id": "deal_1",
      "title": "Plan integral María López",
      "value": 150000,
      "probability": 100,
      "stage": {
        "id": "stage_apertura",
        "name": "Apertura",
        "color": "#10b981"
      },
      "contact": {
        "id": "contact_1",
        "name": "María López",
        "emoji": "👩‍💼"
      },
      "assignedUser": {
        "id": "user_ana",
        "name": "Ana García"
      },
      "expectedCloseDate": "2024-03-01"
    }
  ]
}
```

---

### POST /api/deals

Crea un nuevo deal.

**Request Body:**
```json
{
  "title": "Nuevo Deal",
  "value": 50000,
  "probability": 30,
  "stageId": "stage_prospecto",
  "contactId": "contact_1",
  "assignedTo": "user_ana"
}
```

---

### POST /api/deals/[id]/move

Mueve un deal a otra etapa.

**Request Body:**
```json
{
  "toStageId": "stage_cliente"
}
```

**Response 200:**
```json
{
  "success": true,
  "deal": { ... },
  "historyCreated": true
}
```

---

## Tareas

### GET /api/tasks

Lista tareas con filtros.

**Query Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| status | string | pending, in_progress, completed |
| priority | string | low, medium, high, urgent |
| assignedTo | string | ID del usuario |
| contactId | string | ID del contacto |
| overdue | boolean | Solo tareas vencidas |

**Response 200:**
```json
{
  "data": [
    {
      "id": "task_1",
      "title": "Llamar a María López",
      "description": "Seguimiento mensual",
      "status": "pending",
      "priority": "high",
      "dueDate": "2024-02-01",
      "isRecurrent": true,
      "recurrenceRule": "monthly",
      "assignedUser": { "name": "Ana García" },
      "contact": { "name": "María López" }
    }
  ]
}
```

---

### POST /api/tasks

Crea una nueva tarea.

**Request Body:**
```json
{
  "title": "Nueva Tarea",
  "description": "Descripción",
  "priority": "medium",
  "dueDate": "2024-02-15",
  "assignedTo": "user_ana",
  "contactId": "contact_1",
  "isRecurrent": true,
  "recurrenceRule": "weekly"
}
```

---

### POST /api/tasks/[id]/complete

Marca una tarea como completada.

**Response 200:**
```json
{
  "success": true,
  "task": { "status": "completed" },
  "nextRecurrenceCreated": true
}
```

---

## Equipos

### GET /api/teams

Lista equipos.

**Response 200:**
```json
{
  "data": [
    {
      "id": "team_1",
      "name": "Equipo Alfa",
      "description": "Equipo senior",
      "leader": {
        "id": "user_ana",
        "name": "Ana García"
      },
      "members": [
        { "id": "user_ana", "name": "Ana García", "role": "leader" },
        { "id": "user_pedro", "name": "Pedro Ruiz", "role": "member" }
      ],
      "goals": [
        {
          "id": "goal_1",
          "title": "$50k nuevos clientes",
          "currentValue": 30000,
          "targetValue": 50000
        }
      ]
    }
  ]
}
```

---

### POST /api/teams

Crea un nuevo equipo.

**Request Body:**
```json
{
  "name": "Equipo Beta",
  "description": "Equipo de crecimiento",
  "leaderId": "user_ana"
}
```

---

### POST /api/teams/[id]/members

Agrega un miembro al equipo.

**Request Body:**
```json
{
  "userId": "user_pedro",
  "role": "member"
}
```

---

## Objetivos (Goals)

### GET /api/goals

Lista objetivos por equipo.

**Query Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| teamId | string | ID del equipo |

---

### POST /api/goals

Crea un nuevo objetivo.

**Request Body:**
```json
{
  "teamId": "team_1",
  "title": "15 reuniones agendadas",
  "type": "meetings",
  "targetValue": 15,
  "currentValue": 0,
  "unit": "count",
  "period": "2024-02"
}
```

---

### PUT /api/goals/[id]

Actualiza el progreso del objetivo.

**Request Body:**
```json
{
  "currentValue": 9
}
```

---

## Eventos de Calendario

### GET /api/calendar-events

Lista eventos en un rango de fechas.

**Query Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| startDate | string | Fecha inicio (ISO) |
| endDate | string | Fecha fin (ISO) |
| teamId | string | Filtrar por equipo |

---

### POST /api/calendar-events

Crea un nuevo evento.

**Request Body:**
```json
{
  "title": "Reunión con cliente",
  "description": "Revisión de cartera",
  "startAt": "2024-02-15T10:00:00Z",
  "endAt": "2024-02-15T11:00:00Z",
  "location": "Oficina Principal",
  "type": "meeting"
}
```

---

## Notificaciones

### GET /api/notifications

Lista notificaciones del usuario.

**Query Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| unread | boolean | Solo no leídas |

---

### POST /api/notifications/[id]/read

Marca una notificación como leída.

---

### POST /api/notifications/read-all

Marca todas las notificaciones como leídas.

---

## Materiales de Capacitación

### GET /api/training

Lista materiales.

**Query Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| category | string | course, video, document, guide |
| search | string | Búsqueda por título |

---

### POST /api/training

Crea un nuevo material.

**Request Body:**
```json
{
  "title": "Guía de Onboarding",
  "description": "Guía para nuevos asesores",
  "category": "guide",
  "url": "https://...",
  "content": "..."
}
```

---

## Notas

### GET /api/notes

Lista notas por entidad.

**Query Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| entityType | string | contact, deal, task |
| entityId | string | ID de la entidad |

---

### POST /api/notes

Crea una nueva nota.

**Request Body:**
```json
{
  "entityType": "contact",
  "entityId": "contact_1",
  "content": "Cliente interesado en diversificar cartera"
}
```

---

## Cambio de Contraseña

### POST /api/auth/change-password

Cambia la contraseña del usuario autenticado.

**Request Body:**
```json
{
  "currentPassword": "password123",
  "newPassword": "newpassword456"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Contraseña actualizada"
}
```

---

## Managers

### GET /api/auth/managers

Lista todos los managers disponibles (para registro de nuevos usuarios).

**Response 200:**
```json
{
  "data": [
    {
      "id": "user_manager",
      "name": "Juan Manager",
      "email": "juan.manager@maatwork.com",
      "role": "manager"
    }
  ]
}
```

---

## Sessions

### GET /api/sessions

Lista las sesiones activas del usuario.

**Response 200:**
```json
{
  "data": [
    {
      "id": "sess_123",
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "createdAt": "2024-01-15T10:00:00Z",
      "expiresAt": "2024-01-16T10:00:00Z"
    }
  ]
}
```

---

### POST /api/sessions/logout-others

Cierra todas las sesiones excepto la actual.

**Response 200:**
```json
{
  "success": true,
  "message": "Sesiones cerradas"
}
```

---

## Pipeline Stages

### GET /api/pipeline-stages

Lista las etapas del pipeline.

**Query Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| organizationId | string | ID de organización |

**Response 200:**
```json
{
  "data": [
    {
      "id": "stage_1",
      "name": "Prospecto",
      "description": "Contacto nuevo",
      "order": 1,
      "color": "#6366f1",
      "wipLimit": null,
      "slaHours": 48,
      "isDefault": true,
      "isActive": true
    }
  ]
}
```

---

### POST /api/pipeline-stages

Crea una nueva etapa.

**Request Body:**
```json
{
  "name": "Nueva Etapa",
  "description": "Descripción",
  "order": 5,
  "color": "#ff0000"
}
```

---

## Organizations

### GET /api/organizations

Lista las organizaciones.

**Response 200:**
```json
{
  "data": [
    {
      "id": "org_123",
      "name": "Mi Empresa",
      "slug": "mi-empresa",
      "logo": null
    }
  ]
}
```

---

### GET /api/organizations/[id]

Obtiene una organización específica con sus miembros.

**Response 200:**
```json
{
  "id": "org_123",
  "name": "Mi Empresa",
  "slug": "mi-empresa",
  "members": [
    {
      "id": "member_1",
      "role": "owner",
      "user": {
        "id": "user_1",
        "name": "Juan Demo",
        "email": "demo@maatwork.com"
      }
    }
  ]
}
```

---

### GET /api/organizations/[id]/members

Lista los miembros de una organización.

**Response 200:**
```json
{
  "data": [
    {
      "id": "member_1",
      "role": "owner",
      "user": {
        "id": "user_1",
        "name": "Juan Demo",
        "email": "demo@maatwork.com"
      }
    }
  ]
}
```

---

## Códigos de Estado HTTP

| Código | Descripción |
|--------|-------------|
| 200 | OK |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 500 | Internal Server Error |

## Rate Limiting

Para producción, se recomienda implementar rate limiting:
- 100 requests/minuto por usuario
- 1000 requests/minuto por IP para endpoints públicos
