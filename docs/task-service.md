# Task Service

## Métodos Públicos

### createTask(params)
Crea una nueva tarea en el sistema.

**Parámetros:**
- `userId`: ID del usuario que crea la tarea
- `userRole`: Rol del usuario (UserRole)
- `data`: Objeto con los datos de la tarea:
  - `contactId` (requerido): ID del contacto asociado
  - `meetingId` (opcional): ID de la reunión asociada
  - `title` (requerido): Título de la tarea
  - `description` (opcional): Descripción
  - `status` (requerido): Estado de la tarea
  - `dueDate` (opcional): Fecha de vencimiento
  - `dueTime` (opcional): Hora de vencimiento (formato HH:MM)
  - `priority` (requerido): Prioridad
  - `assignedToUserId` (requerido): Usuario asignado
  - `recurrence` (opcional): Configuración de recurrencia (rrule, timezone, startDate, endDate)

**Retorna:** La tarea creada con todos sus campos.

**Comportamiento:**
1. Verifica que el usuario tenga acceso al contacto
2. Si hay recurrencia, crea primero la definición en `taskRecurrences`
3. Inserta la tarea en la base de datos
4. Sincroniza con Google Calendar de forma asíncrona

---

### updateTask(params)
Actualiza una tarea existente.

**Parámetros:**
- `id`: ID de la tarea a actualizar
- `userId`: ID del usuario que actualiza
- `userRole`: Rol del usuario
- `data`: Campos a actualizar (parciales)
- `log`: Logger

**Retorna:** La tarea actualizada.

**Comportamiento:**
1. Verifica que la tarea exista y no esté eliminada
2. Verifica acceso: si la tarea tiene contacto, requiere acceso al contacto; si no, solo el usuario asignado puede editarla
3. Implementa **optimistic locking** con control de versión
4. Si hay conflicto de versión, lanza error "Version conflict"
5. Sincroniza con Google Calendar de forma asíncrona

---

### deleteTask(params)
Elimina una tarea (soft delete).

**Parámetros:**
- `id`: ID de la tarea a eliminar
- `userId`: ID del usuario que elimina
- `userRole`: Rol del usuario
- `log`: Logger

**Retorna:** `{ id, deleted: true }`

**Comportamiento:**
1. Verifica que la tarea exista y no esté eliminada
2. Verifica acceso con las mismas reglas que updateTask
3. Realiza soft delete (establece `deletedAt`)
4. Sincroniza eliminación con Google Calendar de forma asíncrona

---

### listTasks(params)
Lista tareas con filtros y paginación.

**Parámetros:**
- `userId`: ID del usuario
- `userRole`: Rol del usuario
- `query`: Objeto de filtros:
  - `limit` (default: 50)
  - `offset` (default: 0)
  - `status`: Filtrar por estado
  - `assignedToUserId`: Filtrar por usuario asignado
  - `contactId`: Filtrar por contacto
  - `dueDateFrom` / `dueDateTo`: Rango de fechas
  - `priority`: Filtrar por prioridad
  - `includeCompleted` (default: false): Incluir tareas completadas
- `log`: Logger

**Retorna:**
```typescript
{
  data: Task[],
  meta: {
    limit: number,
    offset: number,
    total: number
  }
}
```

**Comportamiento:**
1. Obtiene el scope de acceso del usuario para aislamiento de datos
2. Filtra por acceso: muestra tareas asignadas al usuario O tareas de contactos accesibles
3. Excluye tareas eliminadas (`deletedAt IS NULL`)
4. Por defecto excluye completadas (`completedAt IS NULL`)
5. Incluye información relacionada (contacto, usuario asignado)
6. Usa window function para obtener total count

---

### getTask(params)
Obtiene una tarea por ID.

**Parámetros:**
- `id`: ID de la tarea

**Retorna:** La tarea con su recurrencia asociada (si existe).

**Comportamiento:**
1. Busca la tarea incluyendo join con `taskRecurrences`
2. Lanza error si no existe o está eliminada
3. Formatea el campo `recurrence` (null si no tiene)

---

### bulkAction(params)
Ejecuta una acción masiva sobre múltiples tareas.

**Parámetros:**
- `taskIds`: Array de IDs de tareas
- `action`: Acción a ejecutar ('complete' | 'delete' | 'reassign' | 'change_status')
- `params` (opcional): Parámetros adicionales:
  - `assignedToUserId`: Requerido para acción 'reassign'
  - `status`: Requerido para acción 'change_status'
- `log`: Logger

**Retorna:** `{ affected: number, action: string }`

**Acciones disponibles:**
- `complete`: Marca tareas como completadas (`status: 'completed'`, `completedAt: now`)
- `delete`: Soft delete de las tareas
- `reassign`: Reasigna a otro usuario
- `change_status`: Cambia el estado

**Nota:** bulkAction NO sincroniza con Google Calendar.

---

## Reglas de Negocio

### Control de Acceso

| Operación | Condición |
|-----------|-----------|
| **Crear tarea** | Usuario debe tener acceso al `contactId` asociado |
| **Editar/Eliminar tarea** | Si tiene `contactId`: acceso al contacto. Si no: solo `assignedToUserId` |
| **Listar tareas** | Tareas asignadas al usuario O de contactos accesibles |
| **Ver tarea** | Solo lectura - no hay filtro de acceso en `getTask()` |

### Aislamiento de Datos
- `listTasks()` implementa aislamiento basado en el scope de acceso del usuario
- Se usa `buildContactAccessFilter()` para filtrar contactos accesibles
- El filtro combina: tareas del usuario OR tareas de contactos con acceso

### Optimistic Locking
- `updateTask()` usa control de versiones
- Si la versión esperada no coincide, lanza `Error('Version conflict')`
- Previene actualizaciones concurrentes

### Soft Delete
- Las tareas nunca se eliminan físicamente
- `deleteTask()` establece `deletedAt = new Date()`
- `bulkAction('delete')` también usa soft delete

### Recurrencia
- Las tareas recurrentes tienen una relación `taskRecurrences`
- Se crea la recurrencia antes que la tarea
- `nextOccurrence` se usa para calcular próximas instancias

---

## Integración Google Calendar

### syncTaskToGoogle(taskId, action)
Sincroniza una tarea con Google Calendar.

**Actions:** `'create'` | `'update'` | `'delete'`

### Flujo de Sincronización

1. **Obtener tarea:** Se fetch la tarea con su `contactId` y datos de Google

2. **Determinar calendario objetivo:**
   - **Prioridad 1:** Team Calendar (vía `contact.assignedTeamId`)
   - Se busca el `calendarId` del equipo asociado al contacto
   - Se usa el token OAuth del usuario que conectó el calendario

3. **Manejo de acciones:**
   - **`create`:** Si la tarea tiene `dueDate`, crea evento en Google Calendar
   - **`update`:** Actualiza evento existente si `googleEventId` y `googleCalendarId` coinciden
   - **`delete`:** Elimina el evento de Google Calendar

4. **Casos especiales:**
   - Si la tarea pierde su `dueDate` y tenía evento, se elimina el evento
   - Si cambia el calendario objetivo, se crea un nuevo evento
   - Si no hay token válido o calendario, se ignora la sincronización

### Mapeo de Datos

```typescript
{
  summary: `📝 ${task.title}`,
  description: task.description || '',
  start: { dateTime: 'YYYY-MM-DDTHH:MM:00', timeZone: 'America/Argentina/Buenos_Aires' },
  end: { dateTime: 'YYYY-MM-DDTHH+1:MM:00', timeZone: 'America/Argentina/Buenos_Aires' }
}
```

- Si hay `dueTime`: evento con horario específico (duración 1 hora)
- Si solo hay `dueDate`: evento de día completo

### Notas de Implementación
- La sincronización es **asíncrona** (fire-and-forget con catch)
- Los errores se loguean pero no afectan la operación principal
- `bulkAction()` **NO** sincroniza con Google Calendar
- Se usa `refreshGoogleToken()` si el token está expirado
- Los tokens se desencriptan usando `GOOGLE_ENCRYPTION_KEY`
