# Calendar

## CRUD de Eventos

### Create Event
**Endpoint:** `POST /calendar/personal/events`

Crea un evento en el calendario personal del usuario autenticado.

**Autenticacion:** Requiere Google OAuth conectado (`requireAuth` + validacion de token Google).

**Request Body:**
```typescript
{
  summary: string;           // Requerido, max 255 chars
  description?: string;      // Opcional, max 5000 chars
  start: { dateTime: string; timeZone?: string } | { date: string };
  end: { dateTime: string; timeZone?: string } | { date: string };
  attendees?: Array<{ email: string; displayName?: string }>;
  location?: string;         // Opcional, max 500 chars
}
```

**Respuesta:** Evento creado por Google Calendar API.

**Notas:**
- Genera automaticamente Google Meet link via `conferenceData` ( HangoutsMeet )
- Invalidacion de cache tras creacion

### List Events
**Endpoint:** `GET /calendar/personal/events`

Obtiene eventos del calendario personal con filtrado por tiempo.

**Query Params:**
```typescript
{
  calendarId?: string;       // ID del calendario especifico
  calendarType?: 'primary' | 'meetingRoom';
  timeMin?: string;          // ISO datetime
  timeMax?: string;          // ISO datetime
  maxResults?: number;       // Default 100, max 2500
}
```

**Respuesta:** Array de eventos de Google Calendar.

**Notas:**
- Usa cache en memoria (`calendarEventsCacheUtil`)
- Sync en background asincrono (`syncUserCalendar`) para mantener DB actualizada

### Update Event
**Endpoint:** `PATCH /calendar/personal/events/:eventId`

Actualiza un evento existente.

**Request Body:** Partial de createEventSchema (todos los campos opcionales).

**Respuesta:** Evento actualizado por Google Calendar API.

**Notas:**
- Invalidacion de cache tras actualizacion
- Solo actualiza campos provistos (undefined se omiten)

### Delete Event
**Endpoint:** `DELETE /calendar/personal/events/:eventId`

Elimina un evento del calendario.

**Respuesta:** `{ success: true }`

**Notas:**
- Invalidacion de cache tras eliminacion

---

## Permisos de Acceso

### Owner (Personal Calendar)
- Acceso completo CRUD a su calendario personal
- Requiere conexion Google OAuth activa
- Token se refresca automaticamente si expira
- Errores conocidos:
  - `GOOGLE_NOT_CONNECTED` (401): Usuario no tiene Google conectado
  - `GOOGLE_RECONNECT_REQUIRED` (401): Token invalido/revocado, requiere reconectar

### Attendee
- Puede ver eventos en los que esta invitado
- Atendees se almacenan en `attendees` array del evento
- Response status: `needsAction`, `declined`, `tentative`, `accepted`

### Team Access

#### Lectura (Todos los miembros del equipo)
**Endpoint:** `GET /calendar/team/:teamId/events`

- Verifica acceso via `checkTeamAccess`
- any member con acceso al equipo puede ver eventos
- Dos tipos de calendario: `primary` y `meetingRoom`

#### Escritura (Solo Managers/Admins)
| Accion | Endpoint | Permiso |
|--------|----------|---------|
| Conectar calendario | `POST /calendar/team/:teamId/connect` | Manager o Admin |
| Desconectar calendario | `DELETE /calendar/team/:teamId/connect` | Manager o Admin |
| Asignar evento | `POST /calendar/team/:teamId/events/assign` | Manager o Admin |

**Asignacion de eventos:**
- Manager asigna reunion a un advisor
- Crea/actualiza Contact automaticamente si hay email de cliente
- Genera notificacion `meeting_assignment` para el advisor

---

## Actualizaciones en Tiempo Real

### Arquitectura
**No implementada via WebSocket/SSE.** Se utiliza estrategia de polling con cache:

1. **Cache en memoria** (`calendarEventsCacheUtil`)
   - Key normalizada por `userId + calendarId + timeMin + timeMax + maxResults`
   - Invalidacion explicita en create/update/delete

2. **Sync en background**
   - `syncUserCalendar` se ejecuta asincrono tras cada GET
   - Sincroniza ultimos 30 dias + proximos 90 dias
   - Actualiza tabla `calendarEvents` local con estado de meetings
   - Detecta eventos eliminados en Google y los limpia en DB

3. **Timeout en API calls**
   - 10 segundos maximo por request a Google API
   - Previene requests colgados

### Flujo de datos
```
Usuario -> GET /calendar/personal/events
         -> Cache hit? return cached
         -> Cache miss? -> Google Calendar API
                        -> Guardar en cache
                        -> Trigger async syncUserCalendar
                        -> Return events
```

---

## Attachments

### Estado actual
**No hay manejo explicito de archivos adjuntos en la API.**

Los eventos de Google Calendar pueden contener attachment (campo `attachments` en `calendar_v3.Schema$Event`), pero:

- No se expican en los schemas de validacion (`createEventSchema`, `updateEventSchema`)
- No se procesan ni almacenan en `calendarEvents` local
- El campo existe en el tipo `calendar_v3.Schema$Event` pero no se extrae en `syncUserCalendar`

### Datos sincronizados por evento
```typescript
{
  googleId: string;
  summary: string;
  description?: string;
  startAt: Date;
  endAt: Date;
  attendees: Array<{
    email: string;
    displayName?: string;
    responseStatus?: string;
    organizer?: boolean;
    self?: boolean;
  }>;
  status: string;
  htmlLink?: string;
  updatedAt: Date;
}
```

### Para agregar soporte de attachments
1. Extender `createEventSchema` con campo `attachments`
2. Modificar `calendar-sync.ts` para extraer y guardar attachments
3. Considerar upload a storage (S3/GCS) para archivos

---

# Google Calendar Integration

## OAuth2 Flow

### Configuration
The integration uses OAuth2 via `google-auth-library` with the following credentials:
- `GOOGLE_CLIENT_ID` - OAuth2 client ID
- `GOOGLE_CLIENT_SECRET` - OAuth2 client secret
- `GOOGLE_REDIRECT_URI` - Redirect URI for callback

### Authentication Flow
1. User authorizes the application via Google OAuth2 consent screen
2. Application receives authorization code
3. Code is exchanged for access token (handled externally, not in this service)
4. Access token is passed to service functions

### Client Creation
```typescript
function createCalendarClient(accessToken: string): calendar_v3.Calendar {
  const oauth2Client = new OAuth2Client(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    env.GOOGLE_REDIRECT_URI
  );
  oauth2Client.setCredentials({ access_token: accessToken });
  return google.calendar({ version: 'v3', auth: oauth2Client });
}
```

### Timeout Protection
All API requests implement a 10-second timeout using `AbortController` to prevent hanging requests.

---

## Operaciones

### getCalendarEvents
Lists events from a calendar with optional time range filtering.

```typescript
async function getCalendarEvents(
  accessToken: string,
  calendarId: string = 'primary',
  timeMin?: Date,
  timeMax?: Date,
  maxResults: number = 100
): Promise<calendar_v3.Schema$Event[]>
```

**Parameters:**
- `accessToken` - Google OAuth2 access token
- `calendarId` - Calendar ID (default: 'primary')
- `timeMin` - Start of time range (optional)
- `timeMax` - End of time range (optional)
- `maxResults` - Max events to return (default: 100, max: 2500)

**Returns:** Array of Google Calendar events

---

### createCalendarEvent
Creates a new event in the calendar.

```typescript
async function createCalendarEvent(
  accessToken: string,
  calendarId: string = 'primary',
  event: {
    summary: string;
    description?: string;
    start: { dateTime: string; timeZone?: string } | { date: string };
    end: { dateTime: string; timeZone?: string } | { date: string };
    attendees?: Array<{ email: string }>;
    conferenceData?: calendar_v3.Schema$ConferenceData;
  }
): Promise<calendar_v3.Schema$Event>
```

**Parameters:**
- `summary` - Event title
- `description` - Event description (optional)
- `start` - Start time (dateTime for timed events, date for all-day events)
- `end` - End time (dateTime for timed events, date for all-day events)
- `attendees` - List of attendees with email addresses (optional)
- `conferenceData` - Video conference data (optional)

---

### updateCalendarEvent
Updates an existing event.

```typescript
async function updateCalendarEvent(
  accessToken: string,
  calendarId: string,
  eventId: string,
  event: Partial<calendar_v3.Schema$Event>
): Promise<calendar_v3.Schema$Event>
```

**Note:** Does not implement timeout protection (uses default Google API timeout).

---

### deleteCalendarEvent
Deletes an event from the calendar.

```typescript
async function deleteCalendarEvent(
  accessToken: string,
  calendarId: string,
  eventId: string
): Promise<void>
```

---

### listCalendars
Lists all calendars accessible by the user.

```typescript
async function listCalendars(
  accessToken: string
): Promise<calendar_v3.Schema$CalendarListEntry[]>
```

---

## Mapeo de Campos

### Google Event → Database Event (calendarEvents table)

| Google Event Field | Database Field | Notes |
|-------------------|----------------|-------|
| `event.id` | `googleId` | Primary key for sync |
| `event.summary` | `summary` | Event title |
| `event.description` | `description` | Event description |
| `event.start.dateTime` | `startAt` | DateTime parsing from ISO string |
| `event.start.date` | `startAt` | Fallback for all-day events |
| `event.end.dateTime` | `endAt` | DateTime parsing from ISO string |
| `event.end.date` | `endAt` | Fallback for all-day events |
| `event.attendees` | `attendees` | JSON array of attendee objects |
| `event.status` | `status` | 'confirmed' as default |
| `event.htmlLink` | `htmlLink` | Link to event in Google Calendar |
| - | `userId` | Set during sync from user context |
| - | `updatedAt` | Set to current timestamp on sync |

### Attendee Object Mapping

| Google Attendee Field | Database Field |
|----------------------|----------------|
| `email` | `email` |
| `displayName` | `displayName` |
| `responseStatus` | `responseStatus` |
| `organizer` | `organizer` |
| `self` | `self` |

---

# Calendar Sync

## Estrategia de Sync

**Tipo:** Polling (no webhooks)

La sincronización se realiza mediante polling contra Google Calendar API. No se utilizan webhooks de Google Calendar para recibir notificaciones de cambios en tiempo real.

### Desencadenantes del Sync

1. **Post-GET (background):** `syncUserCalendar` se ejecuta de forma asíncrona después de cada `GET /calendar/personal/events`
2. **Rango de tiempo:** Se sincronizan eventos desde 30 días atrás hasta 90 días en el futuro

### Proceso de Sync

```
syncUserCalendar(userId, accessToken, calendarId)
  1. Calcular timeMin (now - 30 días) y timeMax (now + 90 días)
  2. Obtener eventos de Google Calendar API (max 2500)
  3. Para cada evento:
     a. Extraer startAt, endAt, attendees
     b. Upsert en calendarEvents (ON CONFLICT DO UPDATE)
     c. Recolectar emails de attendees para actualizar contactos
  4. Limpiar eventos eliminados:
     - DELETE de calendarEvents donde googleId NOT IN (ids de Google)
     - Solo para eventos dentro del rango de tiempo sincronizado
  5. Actualizar estados de meeting de contactos afectados
```

---

## Conflict Resolution

**Fuente de verdad:** Google Calendar

### Estrategias de Resolution

| Escenario | Resolution |
|-----------|------------|
| Evento existe en DB y Google | `ON CONFLICT DO UPDATE` - Se actualiza con datos de Google |
| Evento existe en DB pero no en Google (en rango) | `DELETE` - Evento "fantasma" eliminado |
| Evento existe solo en Google | `INSERT` - Creado en DB |

### Campos Sincronizados

```typescript
{
  summary: string;
  description: string | null;
  startAt: Date;
  endAt: Date;
  attendees: Array<{
    email: string;
    displayName: string | null;
    responseStatus: string | null;
    organizer: boolean | null;
    self: boolean | null;
  }>;
  status: string;  // confirmed, tentative, cancelled
  htmlLink: string | null;
  updatedAt: Date;
}
```

### Conflictos No Resueltos

- **Ediciones locales:** No hay soporte para ediciones locales que luego se intenten sincronizar a Google. El flujo es unidireccional: Google -> DB local.
- **Eliminaciones remotas:** Si un evento se elimina en Google pero se editó localmente, la eliminación en Google prevalece (se borra de DB).

---

## Frecuencia de Sync

| Aspecto | Valor |
|---------|-------|
| Rango temporal | 30 días atrás + 90 días adelante |
| Máximo de eventos | 2500 por sync |
| Frecuencia de触发 | Por request GET a `/calendar/personal/events` |
| Tipo | Asíncrono (no bloquea la respuesta) |

### Consideraciones de Performance

- El sync no bloquea la respuesta al cliente (se ejecuta en background)
- Solo se sincronizan attendees que tienen email para actualizar contactos relacionados
- Limpieza de eventos eliminados solo sobre el rango activo (no hace cleanup de eventos fuera del rango de tiempo)

---

## Manejo de Errores

### Errores capturados

| Error | Acción | Mensaje |
|-------|--------|---------|
| Token OAuth inválido/expirado | Log error + throw | "OAuth token may be invalid or expired" |
| Fallo en Google Calendar API | Log error + throw | Contexto completo (userId, calendarId, timeMin, timeMax) |
| Fallo en cleanup de eventos | Log warning + continúa | No interrumpe el sync |
| Fallo en update de contactos | Log warning + continúa | No interrumpe el sync |

### Logging

```typescript
logger.error({
  err: error,
  userId,
  calendarId,
  timeMin: timeMin.toISOString(),
  timeMax: timeMax.toISOString(),
  operation: 'syncUserCalendar',
}, 'Failed to sync calendar');
```

### Reintentos

**No hay reintentos automáticos en `syncUserCalendar`.**

Si el sync falla, el error se propaga y el próximo request GET volverá a intentar el sync.

### Errores en Cascada

| Etapa | Error | Impacto |
|-------|-------|---------|
| 1. Obtener eventos de Google | Fail | Se corta el sync, no se ejecuta nada más |
| 2. Upsert eventos | Fail | Se corta el sync |
| 3. Cleanup de eliminados | Fail | Se loguea warning, sync continúa |
| 4. Update contactos | Fail | Se loguea warning, sync continúa |

---

## Integración con Contact Matching

El sync de calendario Trigger automático de contact matching:

1. Se recolectan todos los emails únicos de attendees
2. Se buscan contactos que tengan esos emails Y estén asignados al advisor (userId)
3. Se llama a `updateContactsMeetingStatus(contactIds)` para actualizar el estado de meeting de los contactos encontrados

Esta integración permite que cuando un advisor tiene una reunión programada con un contacto, el sistema registre automáticamente ese contacto como "con reunión pendiente" o similar.
