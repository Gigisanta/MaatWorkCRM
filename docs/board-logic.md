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
