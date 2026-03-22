# MaatWork CRM - Estructura de Páginas

## Visión General

El proyecto utiliza **Next.js App Router** con una estructura plana en `src/app/`. No es un monorepo - es una aplicación Next.js estándar.

## Estructura de Directorios

```
src/app/
├── page.tsx                      # Dashboard principal (/)
├── layout.tsx                    # Root layout
├── login/page.tsx                # Login
├── register/page.tsx             # Registro
├── contacts/page.tsx             # Gestión de contactos
├── pipeline/page.tsx             # Pipeline de ventas (Kanban)
├── tasks/page.tsx                # Gestión de tareas
├── teams/page.tsx                # Equipos y objetivos
├── calendar/page.tsx             # Calendario
├── reports/page.tsx              # Reportes y analytics
├── training/page.tsx             # Materiales de capacitación
├── settings/page.tsx             # Configuración
└── notifications/page.tsx         # Centro de notificaciones
```

## Página Principal

### `/` - Dashboard

**Archivo:** `src/app/page.tsx`

**Componentes:**
- KPIs animados (contacts, tasks, pipeline value, team performance)
- Today's tasks widget
- Recent activity
- Mini pipeline overview
- Calendar widget

**Características:**
- Metricas animadas con Framer Motion
- Quick navigation cards
- Task list para el dia
- Pipeline mini visualization

---

## Autenticación

### `/login` - Login

**Archivo:** `src/app/login/page.tsx`

**Campos:**
- `identifier` - Email o username
- `password` - Contraseña

**Features:**
- Login con email o username
- Validación con React Hook Form + Zod
- Redirección a página original después del login
- Link a registro

### `/register` - Registro

**Archivo:** `src/app/register/page.tsx`

**Campos:**
- `username` - Opcional
- `fullName` - Nombre completo
- `email` - Email
- `password` - Mínimo 6 caracteres
- `role` - Selector: member, leader, manager, owner

**Validación:**
```typescript
username: /^[a-zA-Z0-9._-]{3,20}$/
password: min 6 characters
email: valid email format
```

---

## Contactos

### `/contacts` - Lista de Contactos

**Archivo:** `src/app/contacts/page.tsx`

**Componentes:**
- `ContactsClient` - Cliente principal
- `ContactDrawer` - Drawer lateral con tabs
- `ContactCard` - Card individual
- `ContactFilters` - Filtros y búsqueda

**Features:**
- Lista con búsqueda en tiempo real
- Filtros por estado, tags, segmento
- Crear/Editar/Eliminar contactos
- Tags y segmentos
- Historial de pipeline
- Notas y tareas relacionadas
- Emoji personalizable

---

## Pipeline

### `/pipeline` - Pipeline de Ventas (Kanban)

**Archivo:** `src/app/pipeline/page.tsx`

**Componentes:**
- `PipelineBoardClient` - Cliente Kanban
- `KanbanColumn` - Columna por etapa
- `DealCard` - Card de deal
- `PipelineStats` - Estadísticas en tiempo real

**Features:**
- 8 etapas configurables
- Drag and drop con @dnd-kit
- Crear/editar deals
- Mover entre etapas con historial automático
- Valor ponderado del pipeline
- Estadísticas en tiempo real

**Etapas típicas:**
Lead → Contacted → Qualified → Proposal → Negotiation → Won/Lost

---

## Tareas

### `/tasks` - Gestión de Tareas

**Archivo:** `src/app/tasks/page.tsx`

**Componentes:**
- `TasksClient` - Cliente principal
- `TaskCard` - Card de tarea
- `TaskFilters` - Filtros múltiples
- `TaskForm` - Formulario de tarea

**Features:**
- CRUD completo de tareas
- 4 niveles de prioridad
- Filtros múltiples (estado, prioridad, fecha, asignado)
- Toggle de estado completado
- Recurrencia (daily, weekly, monthly)
- Detección de tareas vencidas
- Vinculación a contactos

---

## Equipos

### `/teams` - Equipos y Objetivos

**Archivo:** `src/app/teams/page.tsx`

**Componentes:**
- `TeamsClient` - Cliente principal
- `TeamCard` - Card de equipo
- `TeamGoalsCard` - Card de objetivos
- `GoalProgress` - Barra de progreso

**Features:**
- Gestión de equipos
- Miembros con roles (member, leader)
- Objetivos con progreso visual
- Tipos: new_aum, new_clients, meetings, revenue, custom
- Períodos mensuales/año

---

## Calendario

### `/calendar` - Calendario

**Archivo:** `src/app/calendar/page.tsx`

**Componentes:**
- `CalendarClient` - Cliente principal
- `CalendarEventForm` - Formulario de evento
- `EventDetailsModal` - Modal de detalles

**Features:**
- Vista mensual
- 4 tipos: meeting, call, event, reminder
- Crear/editar eventos
- Navegación entre meses
- Widget de próximos eventos
- Eventos de equipo

---

## Reportes

### `/reports` - Reportes y Analytics

**Archivo:** `src/app/reports/page.tsx`

**Componentes:**
- `ReportsClient` - Cliente principal
- Gráficos con Recharts

**Features:**
- KPIs calculados
- Gráficos de performance
- Filtro por período
- Exportación CSV
- Performance por asesor

---

## Capacitación

### `/training` - Materiales de Capacitación

**Archivo:** `src/app/training/page.tsx`

**Componentes:**
- `TrainingClient` - Cliente principal
- `TrainingCard` - Card de material
- `TrainingForm` - Formulario

**Features:**
- Materiales por categoría (course, video, document, guide, other)
- Búsqueda y filtros
- CRUD completo

---

## Configuración

### `/settings` - Configuración

**Archivo:** `src/app/settings/page.tsx`

**Secciones:**
- Perfil de usuario
- Cambio de contraseña
- Organización (admin)
- Preferencias de notificación
- Tema claro/oscuro
- Configuración de cuenta (phone, bio, image)

---

## Notificaciones

### `/notifications` - Centro de Notificaciones

**Archivo:** `src/app/notifications/page.tsx`

**Componentes:**
- `NotificationsClient` - Cliente principal

**Features:**
- Bell con badge
- Lista de notificaciones
- Marcar leídas individual/todas
- Tipos: info, success, warning, error, task, goal, contact

---

## Resumen de Componentes por Página

| Ruta | Componentes Clave |
|------|-------------------|
| `/` | KPIs animados, TasksWidget, Pipeline mini, Calendar widget |
| `/login` | LoginForm con validación |
| `/register` | RegisterForm con selector de rol |
| `/contacts` | ContactsClient, ContactDrawer, ContactCard |
| `/pipeline` | PipelineBoardClient, KanbanColumn, DealCard |
| `/tasks` | TasksClient, TaskCard, TaskFilters |
| `/teams` | TeamsClient, TeamCard, TeamGoalsCard |
| `/calendar` | CalendarClient, CalendarEventForm |
| `/reports` | ReportsClient, gráficos Recharts |
| `/training` | TrainingClient, TrainingCard |
| `/settings` | SettingsClient, secciones de configuración |
| `/notifications` | NotificationsClient |

---

## Loading States

Los archivos de loading usan `loading.tsx` con componentes Skeleton:
- `SkeletonPageHeader`
- `SkeletonCard`
- `SkeletonTable`

---

## Layout Principal

### Root Layout (`src/app/layout.tsx`)

**Orden de providers:**
1. `html` con fonts (Geist Sans)
2. `ThemeProvider` - Tema dark/light
3. `Providers` - QueryClient, Toast
4. `AppHeader` - Header principal
5. `AppSidebar` - Sidebar (colapsable)
6. `CommandPalette` - Cmd+K palette

### Estructura de Layout

```
src/components/
├── ui/                    # shadcn/ui componentes
├── layout/
│   ├── app-header.tsx
│   ├── app-sidebar.tsx
│   └── command-palette.tsx
├── brand/
│   └── maatwork-logo.tsx
├── providers.tsx
├── theme-toggle.tsx
└── notification-bell.tsx
```
