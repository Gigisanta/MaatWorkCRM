# Tags System

## Modelo de Tag

### Esquema de Base de Datos

```typescript
// packages/db/src/schema/contacts.ts

export const tags = pgTable('tags', {
  id: uuid('id').defaultRandom().primaryKey(),
  scope: text('scope').notNull(),           // 'contact' | 'meeting' | 'note'
  name: text('name').notNull(),
  color: text('color').notNull().default('#6B7280'),
  icon: text('icon'),                         // emoji o icon name
  description: text('description'),
  businessLine: text('business_line'),       // 'inversiones' | 'zurich' | 'patrimonial'
  isSystem: boolean('is_system').notNull().default(false),
  createdByUserId: uuid('created_by_user_id').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  scopeNameUnique: uniqueIndex('tags_scope_name_unique').on(table.scope, table.name),
}));
```

### Campos del Modelo

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `id` | uuid | Identificador unico (PK) |
| `scope` | text | Alcance: `contact`, `meeting`, `note` |
| `name` | text | Nombre de la etiqueta |
| `color` | text | Color hexadecimal (default: `#6B7280`) |
| `icon` | text | Emoji o nombre de icono |
| `description` | text | Descripcion opcional |
| `businessLine` | text | Linea de negocio: `inversiones`, `zurich`, `patrimonial` |
| `isSystem` | boolean | Flag de tag del sistema (no usado activamente en CRUD) |
| `createdByUserId` | uuid | FK a users.id |
| `createdAt` | timestamp | Fecha de creacion |
| `updatedAt` | timestamp | Fecha de actualizacion |

### Relacion con Contactos (contact_tags)

```typescript
export const contactTags = pgTable('contact_tags', {
  id: uuid('id').defaultRandom().primaryKey(),
  contactId: uuid('contact_id').references(() => contacts.id, { onDelete: 'cascade' }),
  tagId: uuid('tag_id').references(() => tags.id, { onDelete: 'cascade' }),
  monthlyPremium: integer('monthly_premium'),  // Prima mensual (solo para Zurich)
  policyNumber: text('policy_number'),          // Numero de poliza (solo para Zurich)
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  contactTagUnique: uniqueIndex('contact_tags_unique').on(table.contactId, table.tagId),
}));
```

---

## CRUD de Tags

### Endpoints

#### GET /tags - Listar Tags
Lista tags con soporte para autocomplete.

**Query Parameters:**
- `scope` (opcional): Filter por `contact`, `meeting`, `note`
- `q` (opcional): Busqueda case-insensitive por nombre (ILIKE)
- `limit` (opcional): Limite de resultados (default: QUICK_SEARCH_LIMIT)

**Respuesta:**
```json
[
  { "id": "...", "name": "...", "color": "...", "icon": "...", "businessLine": "..." }
]
```

**Cache:** Redis con TTL configurable via REDIS_TTL.TAGS

#### POST /tags - Crear Tag (Idempotente)
Crea un tag nuevo o retorna el existente si ya existe con el mismo scope+name (case-insensitive).

**Body:**
```json
{
  "scope": "contact",
  "name": "VIP",
  "color": "#10B981",
  "icon": "star",
  "description": "Cliente VIP",
  "businessLine": null
}
```

**Validacion:**
- `scope`: Requerido, enum `contact | meeting | note`
- `name`: Requerido, string 1-255 caracteres
- `color`: Opcional, regex `^#[0-9A-Fa-f]{6}$`, default `#6B7280`
- `businessLine`: Opcional, enum `inversiones | zurich | patrimonial`

**Respuesta:** 201 Created o 200 si ya existe

#### PUT /tags/:id - Actualizar Tag
Actualiza un tag existente.

**Restricciones de permisos:**
- `advisor`: Solo puede editar tags que creo
- `manager` / `admin`: Puede editar cualquier tag

**Body (partial):**
```json
{
  "name": "VIP Actualizado",
  "color": "#22C55E",
  "businessLine": "zurich"
}
```

#### DELETE /tags/:id - Eliminar Tag
Elimina un tag y en cascada sus relaciones en contact_tags.

**Restricciones de permisos:** Mismo esquema que PUT

**Respuesta:**
```json
{ "id": "...", "deleted": true }
```

---

## Tags Especiales del Sistema

### Tag Rules (Reglas de Asignacion Automatica)

```typescript
export const tagRules = pgTable('tag_rules', {
  id: uuid('id').defaultRandom().primaryKey(),
  tagId: uuid('tag_id').references(() => tags.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  conditions: jsonb('conditions').notNull(),  // Estructura de reglas AND/OR
  isActive: boolean('is_active').notNull().default(true),
  lastEvaluatedAt: timestamp('last_evaluated_at', { withTimezone: true }),
  createdByUserId: uuid('created_by_user_id').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
```

**Endpoints:**
- `GET /rules` - Listar reglas (opcionalmente filtrar por tagId)
- `POST /rules` - Crear regla (requiere role: manager | admin)
- `POST /rules/:id/evaluate` - Evaluar y aplicar regla (pendiente de implementacion)

**Estado:** La evaluacion de reglas esta stubbed - retorna lista vacia de matchedContactIds

### Segments (Segmentos)

```typescript
export const segments = pgTable('segments', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  filters: jsonb('filters').notNull(),        // Estructura de filtros
  isDynamic: boolean('is_dynamic').notNull().default(true),
  contactCount: integer('contact_count').notNull().default(0),
  lastRefreshedAt: timestamp('last_refreshed_at', { withTimezone: true }),
  refreshSchedule: text('refresh_schedule'),  // cron expression
  ownerId: uuid('owner_id').references(() => users.id),
  isShared: boolean('is_shared').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
```

**Endpoints:**
- `GET /segments` - Listar segmentos (propios + compartidos)
- `POST /segments` - Crear segmento
- `POST /segments/:id/refresh` - Refrescar segmento dinamico (pendiente de implementacion)
- `GET /segments/:id/contacts` - Listar contactos del segmento
- `GET /segments/:id/export` - Exportar segmento a CSV

### Tags de Lineas de Negocio

Los tags con `businessLine: 'zurich'` tienen campos adicionales en contact_tags:
- `monthlyPremium`: Prima mensual (integer positivo)
- `policyNumber`: Numero de poliza (string)

**Validacion:** PUT /contacts/:contactId/tags/:tagId solo permite actualizar estos campos para tags con `businessLine === 'zurich'`

---

## Normalizacion

### Case-Insensitive

**Busqueda por nombre (ILIKE):**
```typescript
// GET /tags con query q - busqueda autocomplete
conditions.push(sql`LOWER(${tags.name}) LIKE LOWER(${'%' + q + '%'})`);
```

**Creacion de tag - deteccion de duplicados:**
```typescript
// Verifica si ya existe un tag con el mismo scope y nombre (case-insensitive)
const [existingTag] = await db()
  .select()
  .from(tags)
  .where(
    and(
      eq(tags.scope, validated.scope),
      sql`LOWER(${tags.name}) = LOWER(${validated.name})`
    )
  )
  .limit(1);
```

### Trimming

**Frontend (useTagManagement.ts):**
```typescript
// Auto-save
if (editedTagName.trim() !== tagToEdit.name) { ... }

// Create tag
await createTag({
  name: newTagName.trim(),  // trimming antes de enviar
  ...
});

// Update tag
await updateTag(tagToEdit.id, {
  name: editedTagName.trim(),
  ...
});
```

### Uniqueness Constraint

**Database level:**
```typescript
uniqueIndex('tags_scope_name_unique').on(table.scope, table.name)
```

Garantiza que no existan dos tags con el mismo `scope` + `name` exacto. La aplicacion maneja duplicados case-insensitive a nivel logico.

### Scope Filtering

Los tags siempre se filtran por `scope` en queries relevantes:
- `contact`: Tags asociados a contactos
- `meeting`: Tags para reuniones
- `note`: Tags para notas

---

## Frontend Hook: useTagManagement

**Ubicacion:** `apps/web/src/app/contacts/hooks/useTagManagement.ts`

### Estado

```typescript
interface TagFormState {
  name: string;
  color: string;
  businessLine: 'inversiones' | 'zurich' | 'patrimonial' | null;
}

interface TagManagementState {
  showCreateTagModal: boolean;
  showManageTagsModal: boolean;
  tagToEdit: Tag | null;
  isCreatingTag: boolean;
  isAutoSavingTag: boolean;
  newTag: TagFormState;
  editedTag: TagFormState;
}
```

### Acciones Principales

| Accion | Descripcion |
|--------|-------------|
| `handleCreateTag()` | Crea tag con trimming de nombre, invalida cache |
| `handleEditTag()` | Actualiza tag con trimming, cierra modal |
| `handleDeleteTag(tagId, onConfirm)` | Delega confirmacion al caller |
| `openEditTag(tag)` | Pre-carga datos del tag en el formulario |
| `resetCreateForm()` | Resetea formulario de creacion |

### Auto-save

El hook implementa auto-guardado con debounce de 2 segundos al editar tags:
- Detecta cambios en `name`, `color`, `businessLine`
- Guarda automaticamente si hay cambios
- No guarda si el nombre queda vacio
- Invalida cache de tags y contactos

---

## Tags Predefinidos (Seeds)

**Business Line Tags:**
- `Options` (zurich) - `#003399`
- `Invest` (zurich) - `#0055CC`
- `Impact` (zurich) - `#0077FF`
- `InvestorsTrust` (investorstrust) - `#10B981`
- `Balanz` (inversiones) - `#F59E0B`
- `Auto` (patrimonial) - `#6B7280`
- `Hogar` (patrimonial) - `#4B5563`

**Investment Profile Tags:**
- `Conservador` - `#3B82F6`
- `Moderado` - `#8B5CF6`
- `Agresivo` - `#EF4444`
- `Muy Agresivo` - `#DC2626`

**Client Type Tags:**
- `VIP` - `#10B981`
- `Premium` - `#F59E0B`
- `Standard` - `#6B7280`
- `Nuevo` - `#06B6D4`

**Interest Tags:**
- `Acciones`, `Bonos`, `FCI`, `CEDEARs`, `Crypto`, `Real Estate`

**Origin Tags:**
- `Referido`, `Evento`, `Web`, `LinkedIn`, `WhatsApp`

**Status Tags:**
- `Activo`, `Inactivo`, `En proceso`, `Requiere seguimiento`
