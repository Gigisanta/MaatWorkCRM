# Team Service

## Metodos

### createTeam()
- **Ruta:** `POST /teams`
- **Permiso:** `manager`, `admin`
- **Logica:**
  1. Valida que el usuario sea `manager` o `admin`
  2. Si es `manager`, el `managerUserId` se asigna al usuario actual
  3. Si es `admin`, puede especificar `managerUserId` en el body
  4. Crea el team en `teams`
  5. Crea membresia inicial del manager como `lead`
  6. Invalida cache de access scope del manager
  7. Invalida cache de metrics del team
- **Respuesta:** `{ success: true, data: newTeam }`

### updateTeam()
- **Ruta:** `PUT /teams/:id`
- **Permiso:** `admin` o `manager` del equipo (`role === 'manager'` en el team)
- **Logica:**
  1. Valida acceso con `requireTeamManageAccessOrThrow`
  2. Actualiza campos del team con `updatedAt = new Date()`
  3. Invalida cache de metrics del team
- **Respuesta:** Team actualizado

### deleteTeam()
- **Ruta:** `DELETE /teams/:id`
- **Permiso:** `admin` o `manager` del equipo
- **Logica:**
  1. Valida acceso con `requireTeamManageAccessOrThrow`
  2. Elimina todas las membresias del team (`teamMembership`)
  3. Elimina el team
- **Respuesta:** `{ deleted: true }`

### addMember() / addTeamMember()
- **Ruta:** `POST /teams/:id/members`
- **Permiso:** `admin` o `manager` del equipo
- **Logica:**
  1. Valida que el usuario a agregar exista
  2. Inserta membresia con rol `member`
  3. Invalida cache de access scope del manager del team
  4. Invalida cache de metrics del team
- **Respuesta:** `{ success: true, data: { added: true } }`

### removeMember() / removeTeamMember()
- **Ruta:** `DELETE /teams/:id/members/:userId`
- **Permiso:** `admin` o `manager` del equipo
- **Logica:**
  1. Elimina membresia del usuario en el team
  2. Invalida cache de access scope del manager del team
  3. Invalida cache de metrics del team
- **Respuesta:** `{ removed: true }`

---

## Permisos

### Resumen de permisos por rol

| Metodo | Admin | Manager (propio team) | Manager (otro team) | Member | Advisor |
|--------|-------|----------------------|---------------------|--------|---------|
| createTeam | SI | SI | NO | NO | NO |
| updateTeam | SI | SI (su team) | NO | NO | NO |
| deleteTeam | SI | SI (su team) | NO | NO | NO |
| addMember | SI | SI (su team) | NO | NO | NO |
| removeMember | SI | SI (su team) | NO | NO | NO |

### Logica de verificacion
- **`checkTeamAccess`**: Verifica si un usuario tiene acceso a un team
- **`requireTeamManageAccessOrThrow`**: Lanza 403 si el usuario no puede gestionar el team
- **`getUserTeams`**: Obtiene equipos del usuario con su rol en cada uno (`manager`, `member`, `lead`)

---

## Notificaciones

### Sistema de invitaciones
El servicio NO envia notificaciones directas al agregar/remover miembros. En su lugar, utiliza un sistema de **invitaciones asyncronas**:

1. **Crear invitacion:** `POST /teams/:id/invitations`
   - Solo `admin` o `manager` del equipo
   - Crea registro en `teamMembershipRequests` con status `invited`

2. **Aceptar invitacion:** `POST /teams/invitations/:id/accept`
   - Solo el invitado (`userId` de la invitacion)
   - Crea membresia automaticamente al aceptar

3. **Rechazar invitacion:** `POST /teams/invitations/:id/reject`
   - Solo el invitado
   - Actualiza status a `rejected`

### Cache invalidation
Al agregar/remover miembros se invalidan:
- `invalidateAccessScope(managerUserId, 'manager')` - Access scope del manager
- `teamMetricsCacheUtil.clear()` - Metrics del equipo

---

## Esquemas

```typescript
// createTeamSchema
{
  name: string,
  managerUserId?: string  // Solo para admins
}

// updateTeamSchema
{
  name?: string,
  calendarUrl?: string,
  managerUserId?: string
}

// addMemberSchema
{
  userId: string
}
```

---

## Modelos DB

- `teams`: Tabla principal de equipos
- `teamMembership`: Relación many-to-many entre users y teams
  - Roles: `lead`, `manager`, `member`
- `teamMembershipRequests`: Solicitudes/invitaciones pendientes
  - Status: `pending`, `invited`, `approved`, `rejected`

---

# Team Members

## Perfil de Member

El perfil de member se compose de datos del usuario y su relacion con el equipo.

### Campos

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `id` | `uuid` | ID unico del usuario (PK de `users`) |
| `email` | `string` | Email del usuario |
| `fullName` | `string` | Nombre completo del usuario |
| `userId` | `uuid` | ID del usuario en `team_membership` |
| `teamId` | `uuid` | ID del equipo en `team_membership` |
| `role` | `enum` | Rol en el equipo: `member` \| `manager` |
| `joinedAt` | `timestamp` | Fecha de ingreso al equipo (usa `createdAt` de `team_membership`) |

### Schema de Base de Datos

```typescript
// packages/db/src/schema/users.ts
teamMembership = pgTable('team_membership', {
  id: uuid('id').defaultRandom().primaryKey(),
  teamId: uuid('team_id').references(() => teams.id),
  userId: uuid('user_id').references(() => users.id),
  role: text('role').notNull(), // member, lead
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
```

### Endpoints Relacionados

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| `GET` | `/teams/members` | Listar todos los miembros (admin/manager) |
| `GET` | `/teams/:id/members` | Listar miembros de un equipo |
| `GET` | `/teams/:id/members/:memberId` | Obtener un miembro especifico |
| `POST` | `/teams/:id/members` | Agregar miembro al equipo |
| `DELETE` | `/teams/:id/members/:userId` | Remover miembro del equipo |

### Agregar Member

```typescript
// apps/api/src/routes/teams/handlers/members.ts
addTeamMember = async (req, res) => {
  const { id } = req.params;           // teamId
  const { userId: memberUserId } = req.body;
  const { role = 'member' } = req.body; // default: 'member'

  await db().insert(teamMembership).values({
    teamId: id,
    userId: memberUserId,
    role: 'member', // siempre 'member' al agregar
  });
}
```

---

## Metricas por Member

Metrics retrieval endpoint: `GET /teams/:id/members/:memberId/metrics`

### Campos de Metricas

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `totalAum` | `number` | AUM total del advisor (suma de `aum_snapshots.aum_total`) |
| `clientCount` | `number` | Cantidad de clientes asignados (contacts con `assigned_advisor_id = memberId`) |
| `portfolioCount` | `number` | Cantidad de portfolios activos del member |
| `deviationAlerts` | `number` | Alertas de desviacion de portfolio (>10% desviacion) |
| `aumTrend` | `array` | Historial de AUM de los ultimos 30 dias `[{date, value}]` |

### Metricas de Actividad

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `lastLogin` | `string \| null` | Ultima fecha de login (ISO string) |
| `daysSinceLogin` | `number \| null` | Dias transcurridos desde el ultimo login |
| `contactsCreatedThisMonth` | `number` | Contactos creados en el mes actual |
| `contactsCreatedLast30Days` | `number` | Contactos creados en los ultimos 30 dias |
| `firstMeetingsLast30Days` | `number` | Contactos que entraron a "Primera reunion" en 30 dias |
| `secondMeetingsLast30Days` | `number` | Contactos que entraron a "Segunda reunion" en 30 dias |
| `tasksCompletedLast30Days` | `number` | Tareas completadas en los ultimos 30 dias |

### Actividad del Equipo

Endpoint: `GET /teams/:id/members-activity`

Retorna un resumen de actividad para todos los miembros del equipo:

```typescript
{
  members: [
    {
      id, email, fullName, role,
      lastLogin, daysSinceLogin, isActive,
      contactsCreatedThisMonth, contactsCreatedLast30Days,
      firstMeetingsLast30Days, secondMeetingsLast30Days,
      tasksCompletedLast30Days, openTasks, clientCount, totalAum,
      activityStatus: 'active' | 'moderate' | 'inactive' | 'critical'
    }
  ],
  summary: {
    totalMembers,
    activeMembers, moderateMembers, inactiveMembers, criticalMembers,
    totalContactsCreatedThisMonth, totalFirstMeetingsLast30Days
  }
}
```

### Logica de Activity Status

```typescript
function getActivityStatus(daysSinceLogin) {
  if (daysSinceLogin === null) return 'critical';
  if (daysSinceLogin <= 3)      return 'active';
  if (daysSinceLogin <= 7)      return 'moderate';
  if (daysSinceLogin <= 14)     return 'inactive';
  return 'critical';
}
```

### Permisos

- Solo `admin` y `manager` (del equipo especifico) pueden ver metricas de members
- Los `member` no pueden ver metricas de sus companeros
