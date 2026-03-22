# Contact Service

## Descripcion

Servicio de logica de negocio para el dominio de contactos. Maneja operaciones CRUD, busqueda, asignacion e importacion de contactos con control de acceso basado en roles.

**Archivo fuente:** `apps/api/src/services/contact-service.ts`

---

## Metodos Publicos

### listContacts(...)

**Firma:**
```typescript
export async function listContacts(params: ListContactsParams): Promise<PaginatedResponse<ContactWithTags>>
```

**Interface de parametros:**
```typescript
interface ListContactsParams {
  userId: string;
  userRole: UserRole;
  limit: number;
  offset: number;
  pipelineStageId?: string;
  assignedAdvisorId?: string;
  log: Logger;
}
```

**Reglas de negocio:**
- Filtra contactos por scope de acceso del usuario (owner, team, all)
- Excluye contactos con `deletedAt` no nulo (soft delete)
- Soporta filtros por `pipelineStageId` y `assignedAdvisorId`
- El filtro `pipelineStageId` acepta el valor 'null' o '' para filtrar contactos sin etapa asignada
- Ordena resultados por `updatedAt` descendente (mas reciente primero)
- Incluye conteo de interacciones por contacto y etapa de pipeline

**Validaciones:**
- `userId` es requerido
- `userRole` debe ser un `UserRole` valido
- `limit` debe ser mayor a 0
- `offset` debe ser >= 0
- `pipelineStageId` si se provee, puede ser string valido, 'null', o ''

**Casos edge:**
- Si `assignedAdvisorId` no existe, retorna lista vacia
- Si no hay contactos, retorna `PaginatedResponse` con `items: []` y `total: 0`
- Tags se cargan en una segunda consulta si hay contactos
- Si un contacto no tiene tags, retorna array vacio `[]`

---

## Control de Acceso

### Sistema de Permisos

El servicio utiliza un sistema de scope de acceso jerarquico:

1. **Owner Scope** (`owner`): Usuario ve solo sus propios contactos
2. **Team Scope** (`team`): Usuario ve contactos de su equipo
3. **All Scope** (`all`): Usuario ve todos los contactos

### Funciones de Autorizacion

- `getUserAccessScope(userId, userRole)`: Determina el scope de acceso del usuario
- `buildContactAccessFilter(accessScope)`: Construye el filtro de condiciones segun el scope

### Filtrado de Acceso

El filtro de acceso se aplica automaticamente en `listContacts` mediante `buildContactAccessFilter(accessScope.whereClause)`, agregando una condicion `accessFilter.whereClause` a la query principal.

---

## Estructuras de Datos

### ContactWithTags
```typescript
interface ContactWithTags extends Contact {
  tags: ContactTag[];
}
```

### ContactTagWithInfo
```typescript
interface ContactTagWithInfo {
  contactId: string;
  id: string;
  name: string;
  color: string;
  icon: string;
}
```

### Campos de Contacto Retrievados
- `id`, `firstName`, `lastName`, `fullName`, `email`, `phone`
- `country`, `dni`, `pipelineStageId`, `source`, `riskProfile`
- `assignedAdvisorId`, `assignedAdvisorName`, `assignedTeamId`, `assignedTeamName`
- `nextStep`, `contactLastTouchAt`, `pipelineStageUpdatedAt`
- `deletedAt`, `meetingStatus`, `version`, `createdAt`, `updatedAt`
- `interactionCount`

---

## Dependencias

### Tablas DB
- `contacts` - Tabla principal de contactos
- `contactTags` - Relacion contacto-tag
- `tags` - Catalogo de tags
- `contactStageInteractions` - Conteo de interacciones por etapa
- `users` - Informacion de asesores (left join)
- `teams` - Informacion de equipos (left join)

### Modulos Externos
- `drizzle-orm` - Para queries tipadas
- `pino` - Para logging
- `@maatwork/db` - Esquema de base de datos
- `@maatwork/types` - Tipos compartidos
- `authorization` - Modulo de control de acceso
- `database/db-logger` - Logging de queries
- `pagination` - Utilidades de paginacion

---

## Nota

El archivo fuente `contact-service.ts` actualmente solo implementa el metodo `listContacts`. Los metodos `createContact`, `updateContact`, `deleteContact`, `getContact`, `searchContacts`, `assignContact`, `importContacts` deberan ser documentados cuando sean implementados.
