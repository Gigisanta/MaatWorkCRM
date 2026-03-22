# Contacts Filters

## Tipos de Filtros

### Busqueda por Texto

El frontend soporta busqueda por texto libre que filtra contactos por `fullName` y `email`:

```typescript
// En filterContacts() - client-side
const matchesSearch =
  contact.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
  contact.email?.toLowerCase().includes(searchTerm.toLowerCase());
```

- **Campo:** `searchTerm`
- **Debounce:** 300ms antes de aplicar el filtro
- **Busca en:** `fullName` (nombre completo) e `email`
- **Case-insensitive**

> **Nota:** El backend (`listContacts`) no soporta busqueda por texto directamente; el filtrado por texto se realiza client-side luego de obtener los resultados paginados del API.

### Filtros por Estado (Pipeline Stage)

Filtra contactos segun la etapa actual del pipeline de ventas:

```typescript
// Frontend
const matchesStage = selectedStage === 'all' || contact.pipelineStageId === selectedStage;

// Backend - listContacts()
if (pipelineStageId) {
  if (pipelineStageId === 'null' || pipelineStageId === '') {
    conditions.push(isNull(contacts.pipelineStageId));
  } else {
    conditions.push(eq(contacts.pipelineStageId, pipelineStageId));
  }
}
```

- **Campo frontend:** `selectedStage` (string - ID de etapa o `'all'`)
- **Campo backend:** `pipelineStageId`
- **Valores especiales:** `'null'` o `''` = contactos sin etapa asignada (stage es NULL)
- **Pipeline por defecto:** Prospect, Qualify, Proposal, Negotiation, Closing, Won, Lost

### Filtros por Fecha

El sistema soporta filtrado por marcas de tiempo, disponibles en el modelo:

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `contactLastTouchAt` | timestamp | Ultima interaccion (detectar inactividad/cold leads) |
| `pipelineStageUpdatedAt` | timestamp | Cuando se actualizo la etapa del pipeline |
| `createdAt` | timestamp | Fecha de creacion del contacto |
| `updatedAt` | timestamp | Fecha de ultima actualizacion |

> **Nota:** El API `listContacts` no expone filtros por fecha directamente en sus parametros. La ordenacion por defecto es `ORDER BY updatedAt DESC`. Para filtrar por rango de fechas se requiere extender el service.

### Filtros por Tags

Filtra contactos que tengan al menos una de las etiquetas seleccionadas:

```typescript
// Frontend - filterContacts()
const matchesTags =
  selectedTags.length === 0 ||
  selectedTags.some((tagId) => contact.tags?.some((tag) => tag.id === tagId));
```

- **Campo frontend:** `selectedTags` (array de tagIds)
- **Logica:** OR entre tags - un contacto pasa el filtro si tiene AL MENOS una de las tags seleccionadas
- **Tags vacio:** Si `selectedTags.length === 0`, no se filtra (todos los contactos pasan)

Backend resuelve los tags con un JOIN adicional:

```typescript
// listContacts() - Tags query
const contactTagsList = await db()
  .select({ contactId, id, name, color, icon })
  .from(contactTags)
  .innerJoin(tags, eq(contactTags.tagId, tags.id))
  .where(inArray(contactTags.contactId, contactIds));
```

### Filtros por Manager/Owner (Advisor/Team)

Filtra contactos asignados a un asesor especifico:

```typescript
// Backend - listContacts()
if (assignedAdvisorId) {
  conditions.push(eq(contacts.assignedAdvisorId, assignedAdvisorId));
}
```

- **Campo frontend:** `advisorIdFilter` (obtenido de URL searchParams `?advisorId=...`)
- **Campo backend:** `assignedAdvisorId`
- **Relaciones disponibles:**
  - `assignedAdvisorId` - FK a `users.id` (asesor individual)
  - `assignedTeamId` - FK a `teams.id` (equipo asignado)

> **Nota:** El backend soporta filtrado por `assignedAdvisorId` pero no directamente por `assignedTeamId`.

---

## Logica de Combinacion

### Frontend (Client-Side)

Los filtros del frontend se combinan con **AND** logico:

```typescript
return matchesSearch && matchesStage && matchesTags;
```

| Filtro | Condicion |
|--------|-----------|
| `searchTerm` | `matchesSearch` (fullName OR email contiene texto) |
| `selectedStage` | `matchesStage` (stage exacto o 'all') |
| `selectedTags` | `matchesTags` (al menos una tag, o ninguna = sin filtro) |

### Backend (Server-Side)

Los filtros del backend se combinan con **AND** logico via `drizzle-orm.and()`:

```typescript
const conditions = [
  isNull(contacts.deletedAt),        // Siempre: solo contactos activos
  accessFilter.whereClause,           // Filtro de acceso basado en rol
  eq(contacts.assignedAdvisorId, assignedAdvisorId),  // Opcional
  eq(contacts.pipelineStageId, pipelineStageId)         // Opcional
];

.where(and(...conditions))
```

| Condicion | Siempre? | Descripcion |
|-----------|----------|-------------|
| `deletedAt IS NULL` | Si | Soft-delete: solo contactos activos |
| `accessFilter` | Si | Control de acceso segun rol del usuario |
| `assignedAdvisorId` | No | Filtro opcional por asesor |
| `pipelineStageId` | No | Filtro opcional por etapa |

---

## Sorting

### Campo de Ordenamiento

| Campo | Direccion | Descripcion |
|-------|-----------|-------------|
| `updatedAt` | DESC (default) | Ultima actualizacion del contacto |

```typescript
// Backend - listContacts()
.orderBy(desc(contacts.updatedAt))
```

> **Nota:** Solo se soporta ordenamiento por `updatedAt` en orden descendente. No hay soporte para cambiar el campo o la direccion de ordenamiento via API.

---

## Paginacion

### Parametros de Paginacion

| Parametro | Tipo | Descripcion |
|-----------|------|-------------|
| `limit` | number | Cantidad de resultados por pagina |
| `offset` | number | Desplazamiento desde el inicio (page * limit) |

```typescript
// Backend - listContacts()
interface ListContactsParams {
  userId: string;
  userRole: UserRole;
  limit: number;      // pageSize
  offset: number;     // page * limit
  pipelineStageId?: string;
  assignedAdvisorId?: string;
  log: Logger;
}
```

### Respuesta Paginada

El API retorna un `PaginatedResponse<ContactWithTags>` con formato:

```typescript
// formatPaginatedResponse(items, total, { limit, offset })
{
  items: ContactWithTags[],   // Lista de contactos con sus tags
  total: number,              // Total de registros que coinciden (del window function)
  page: number,               // Numero de pagina actual (calculado en el hook)
  pageSize: number,           // Tamano de pagina
  totalPages: number          // Total de paginas (calculado en el hook)
}
```

El total se obtiene del window function SQL:

```typescript
total: sql<number>`COUNT(*) OVER()`.as('total')
```

### Frontend (useContactsFilters)

El frontend maneja `limit`/`offset` en el hook o componente que consume el servicio. Los params se pasan via searchParams de Next.js:

```
/contacts?advisorId=<id>&page=<n>
```

---

## Vistas Guardadas (Saved Views)

El frontend permite guardar combinaciones de filtros localmente en `localStorage`:

```typescript
interface SavedView {
  id: string;
  name: string;
  filters: {
    searchTerm: string;
    selectedStage: string;
    selectedTags: string[];
  };
  createdAt: string;
}
```

- **Storage key:** `contacts_saved_views`
- **Max saved views:** 10
- **Scope:** Solo guardan `searchTerm`, `selectedStage` y `selectedTags`. No guardan `advisorIdFilter` (viene de URL).
