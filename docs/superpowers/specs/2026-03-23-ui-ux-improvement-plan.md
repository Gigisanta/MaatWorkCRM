# Plan de Mejora UI/UX — MaatWork CRM v3
**Fecha:** 2026-03-23
**Scope:** Auditoría completa + plan de implementación priorizado

---

## Metodología de auditoría

Se revisaron en profundidad los siguientes archivos:
- Todas las pages (`/dashboard`, `/contacts`, `/pipeline`, `/tasks`, `/calendar`, `/reports`, `/teams`, `/training`, `/notifications`, `/settings`, `/login`)
- Componentes de layout: `app-sidebar.tsx`, `app-header.tsx`, `command-palette.tsx`
- Componentes específicos: `contact-table.tsx`, `contact-drawer.tsx`, `contact-card.tsx` (pipeline)
- Sistema de diseño: `globals.css` completo (tokens, clases, animaciones)

---

## Resumen ejecutivo

La app tiene una base visual sólida (obsidian dark, violet brand, glassmorphism, Framer Motion) pero sufre de **inconsistencias de implementación**, **estados vacíos/error incompletos**, **datos hardcodeados que rompen la UX**, y **oportunidades claras de enriquecer páginas clave** como el dashboard y el pipeline. La prioridad máxima es corregir los problemas funcionales que afectan la percepción de calidad antes de añadir nuevas capas visuales.

---

## NIVEL 1 — Bugs de UX / Problemas críticos (impacto inmediato)

### 1.1 Datos hardcodeados que rompen la experiencia

**Afecta:** Tasks, Calendar, Training (3 páginas)

**Problema:** Tres páginas usan `ORGANIZATION_ID = "org_maatwork_demo"` como constante hardcodeada en lugar de `user.organizationId`. Además, `tasks/page.tsx` tiene un array de usuarios hardcodeado (`const users = [{ id: "user_gio"... }]`) que nunca refleja los usuarios reales de la organización.

**Impacto UX:** El selector "Asignado a" en tareas siempre muestra los mismos 5 nombres ficticios. Un admin que invita a nuevos miembros nunca los verá en ese selector.

**Fix:**
- Reemplazar `ORGANIZATION_ID` hardcodeado con `user?.organizationId` en Tasks, Calendar, Training
- Reemplazar el array `users` en Tasks con un query a `/api/users?organizationId=...` igual que hace Pipeline

---

### 1.2 ThemeToggle en header contradice el brandbook

**Afecta:** Todas las páginas (header)

**Problema:** El header incluye `<ThemeToggle />` (sol/luna), pero el brandbook fuerza dark mode como tema principal. El toggle cambia visualmente la app a un modo claro que rompe completamente el diseño (muchos colores no están probados en light).

**Impacto UX:** Confusión para el usuario. Si activa light mode, la app se ve incompleta.

**Fix:**
- Mover ThemeToggle exclusivamente a `Settings > Apariencia`
- Eliminar `<ThemeToggle />` del header
- Añadir en Settings/apariencia una nota: "El modo claro está en beta"

---

### 1.3 User menu duplicado en header

**Afecta:** Header (todas las páginas)

**Problema:** El dropdown de usuario tiene:
- "Perfil" → `/settings` (con icono `Users` — incorrecto)
- "Configuración" → `/settings` (duplicado exacto)

**Fix:**
- Eliminar el item "Perfil" duplicado
- Cambiar "Configuración" para que use `User` icon, no `Settings`
- Estructura correcta: Perfil → /settings#profile, Configuración → /settings, Mis tareas → /tasks

---

### 1.4 KPI trends estáticos en Dashboard

**Afecta:** Dashboard

**Problema:** Los 4 KPI cards muestran tendencias hardcodeadas:
- "↑ Este mes" (siempre positivo para pipeline y contactos)
- "↓ Esta semana" (siempre negativo para tareas)
- "↑ Este mes" (siempre positivo para objetivos)

Estos valores nunca cambian independientemente de los datos reales.

**Fix:**
- El endpoint `/api/dashboard/stats` debe retornar comparativa con período anterior
- Calcular `trendValue` (%) y `trendDirection` (up/down/neutral) por KPI
- Mostrar porcentaje real: "+12% vs mes anterior" o "-3 esta semana"

---

## NIVEL 2 — Mejoras UX de alto impacto (calidad percibida)

### 2.1 Dashboard — Enriquecer contenido

**Estado actual:** 4 KPI cards + 2x2 mini-stats + lista de tareas simple

**Problemas:**
- Sección inferior es muy escasa para ser la página de inicio
- No hay contexto temporal ni actividad reciente
- Sin gráficos, la app parece estática

**Plan de mejora:**

#### A) Sección "Actividad Reciente"
Nueva columna derecha en el layout inferior (50/50 → 60/40):
```
Últimas acciones de la organización:
- [emoji] Juan Pérez movido a "Segunda Reunión" — hace 2h
- [✓] Tarea "Llamar a Carlos" completada — hace 3h
- [+] Nuevo contacto "María López" creado — ayer
```
Feed de máximo 8 items con `ActivityFeed` component, paginado con "ver más".

#### B) Mini sparkline en KPI cards
Bajo el valor numérico, añadir un mini gráfico de línea (últimos 7 días) usando Recharts `AreaChart` en 60x24px. Muestra la tendencia visual, no solo el número.

#### C) Pipeline por etapas (mini funnel)
Reemplazar la actual "Estado del Pipeline" (2x2 grid de números) con un mini gráfico de barras horizontal mostrando cuántos contactos hay en cada etapa. Hace el pipeline tangible desde el dashboard.

#### D) Próximas tareas con fecha
En "Mis Tareas", mostrar las 3 próximas tareas con fecha real (no solo el conteo). Cada item con su fecha relativa ("Hoy", "Mañana", "Mar 25") y su prioridad visual.

---

### 2.2 Sidebar — Agrupar y enriquecer

**Estado actual:** Links planos con separadores invisibles, sin labels de grupo, sin badges

**Problemas:**
- El usuario no sabe a qué categoría pertenece cada sección
- Las notificaciones no muestran cuántas no-leídas hay
- El área de usuario inferior no tiene logout rápido

**Plan de mejora:**

#### A) Group labels
Añadir labels de sección encima de cada grupo (solo visibles cuando expandido):
```
PRINCIPAL
  Dashboard / Contactos / Pipeline

PRODUCTIVIDAD
  Tareas / Calendario

EQUIPO
  Equipos / Reportes / Capacitación

SISTEMA
  Configuración
```
Clase: `text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-3 mb-1`

#### B) Badge de notificaciones no leídas
En el nav item "Configuración" (o donde esté el bell en el sidebar), mostrar un badge circular rojo con el count de notificaciones no leídas. Usar el mismo `unreadCount` que ya retorna el API de notificaciones.

```tsx
{unreadCount > 0 && (
  <span className="ml-auto h-4 min-w-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold">
    {unreadCount > 99 ? "99+" : unreadCount}
  </span>
)}
```

#### C) Logout rápido en user section
El área inferior del sidebar (avatar + nombre) actualmente no hace nada al hacer click. Convertir en un dropdown o añadir un icono de logout visible en hover:

```
[Avatar] Juan Pérez          [→ LogOut icon on hover]
         Admin
```

---

### 2.3 Pipeline — Stats bar + mejoras de cards

**Estado actual:** Columnas kanban sin contexto numérico, tarjetas básicas

**Problemas:**
- No hay resumen visible del pipeline total
- Las tarjetas no muestran valor de deal
- Los stages no tienen su total acumulado
- `max-h-[calc(100vh-400px)]` es frágil para columnas largas

**Plan de mejora:**

#### A) Pipeline Stats Bar
Barra superior bajo el header con 3-4 KPIs del board actual:
```
[ Total contactos: 48 ]  [ Valor total: $2.4M ]  [ Tasa de cierre: 23% ]  [ Deals activos: 31 ]
```
Clase: `flex items-center gap-6 px-4 py-2 border-b border-white/6 glass text-sm`

#### B) Column header con valor acumulado
En cada columna, mostrar bajo el nombre y count el valor total de los deals de esa columna:
```
PROSPECTO    [12]
$45,000
```

#### C) Contact card con más info
Expandir `ContactCard` para mostrar:
- Nombre de empresa (si existe) en texto gris bajo el nombre
- Último producto con su valor (ya existe como ProductSubCard)
- Fecha de "último contacto" o "en esta etapa desde" en el footer

#### D) Link "Ver perfil completo" en el modal de edición
El `ContactModal` solo permite cambiar stage y asesor. Añadir un link `→ Ver perfil completo` que navega a `/contacts?contactId=xxx` y abre el drawer.

---

### 2.4 Tasks — Agrupación temporal + vista alternativa

**Estado actual:** Lista plana de tarjetas sin agrupación, filtros básicos

**Problemas:**
- Todas las tareas en una lista plana sin jerarquía temporal
- No hay búsqueda de texto en tareas
- No hay toggle entre lista y vista kanban por status
- La prioridad es un dot de 8px — muy sutil

**Plan de mejora:**

#### A) Agrupación por fecha
Dividir la lista en grupos colapsables:
```
VENCIDAS (3)          [badge rojo]
HOY (2)               [badge amber]
MAÑANA (1)            [badge blue]
ESTA SEMANA (5)
MÁS ADELANTE (12)
COMPLETADAS (8)       [colapsado por defecto]
```
Cada grupo tiene su count en badge y un chevron para colapsar/expandir.

#### B) Barra de búsqueda
Añadir un input de búsqueda sobre la lista que filtra por título en tiempo real (debounced 200ms).

#### C) Prioridad más visible
Reemplazar el dot de 8px por una barra vertical izquierda de 3px con el color de prioridad (como el indicador activo del sidebar), o un badge con texto:
```
[URGENTE]  [ALTA]  [MEDIA]  [BAJA]
rojo       amber   azul     slate
```

#### D) Task card con contacto más prominente
El contacto asociado (`task.contact`) aparece muy pequeño. Mostrarlo como chip clickeable que navega al contacto.

---

### 2.5 Calendar — Vistas múltiples + agenda

**Estado actual:** Solo vista mes, sin semana/día, sin agenda lateral

**Problemas:**
- Vista mes solo muestra puntos de colores en cada día
- No hay forma de ver la agenda del día sin hacer click
- No hay vista semanal para planificación
- El panel lateral de "Eventos de hoy" está desconectado del grid

**Plan de mejora:**

#### A) Toggle de vistas: Mes / Semana / Agenda
Tres botones en el header del calendario:
- **Mes**: vista actual (mejorada)
- **Semana**: grid de 7 columnas con slots horarios (7:00 - 20:00)
- **Agenda**: lista cronológica próximas 2 semanas

#### B) Mejorar celdas del mes
En lugar de solo mostrar un punto de color, mostrar el título del evento truncado:
```
┌─────────┐
│ 15      │
│ ● Reunión│
│ ● Llam..│
└─────────┘
```
Si hay más de 2 eventos, mostrar "+N más" clickeable.

#### C) Panel "Hoy" siempre visible
En desktop (lg+), mantener un panel lateral derecho siempre visible con los eventos del día seleccionado. En mobile, mostrar debajo del calendario.

---

### 2.6 Notifications — Agrupación + acciones

**Estado actual:** Lista plana con filtro por tipo y estado

**Problemas:**
- No hay agrupación temporal (hoy, ayer, esta semana)
- No hay opción de eliminar notificación individual
- El badge de no-leído (dot violeta) es muy pequeño
- "Marcar todas como leídas" está escondido en un botón pequeño

**Plan de mejora:**

#### A) Agrupación temporal
```
HOY
  [notif 1]
  [notif 2]

AYER
  [notif 3]

ESTA SEMANA
  [notif 4..6]

MÁS ANTIGUO
  [notif 7+]
```

#### B) Acento de borde izquierdo para no-leídas
En lugar de solo cambiar el fondo, añadir un borde izquierdo de 3px violeta:
```tsx
className={cn(
  "border-l-2",
  !notification.isRead ? "border-l-violet-500" : "border-l-transparent"
)}
```

#### C) Botón de eliminar por notificación
Añadir un `×` visible en hover en cada notificationCard que marca como leída + elimina visualmente (soft delete).

#### D) Header con stats
```
Notificaciones    [12 sin leer]    [Marcar todas leídas]
```

---

## NIVEL 3 — Mejoras de consistencia y pulido

### 3.1 Sistema de Empty States consistente

**Problema:** Los empty states son inconsistentes:
- Pipeline: `<div className="h-24 rounded-lg border-2 border-dashed...">Sin contactos</div>` — básico
- Contacts: ningún empty state si no hay resultados de búsqueda
- Training: ningún empty state si no hay materiales
- Dashboard: sin empty state si no hay datos de stats

**Plan:** Crear un componente `<EmptyState>` reutilizable:
```tsx
<EmptyState
  icon={Users}
  title="No hay contactos aún"
  description="Crea tu primer contacto para empezar a trabajar"
  action={{ label: "Crear contacto", onClick: () => {} }}
/>
```
Implementar en todas las páginas con listas vacías.

---

### 3.2 Sistema de Error States consistente

**Problema:** Algunos errores muestran un `<Alert>` genérico, otros no muestran nada. No hay una estrategia uniforme.

**Plan:** Crear un componente `<ErrorState>` para errores de fetch:
```tsx
<ErrorState
  title="No se pudo cargar"
  description="Hubo un problema al conectar con el servidor."
  onRetry={() => refetch()}
/>
```
Usar en: dashboard stats, pipeline, contacts, tasks, calendar, teams, reports.

---

### 3.3 Skeleton loading screens mejorados

**Problema:** Algunos loaders son buenos (Calendar tiene `<CalendarSkeleton>`), otros son spinners genéricos (`<Loader2 className="animate-spin">`).

**Plan:** Para cada vista principal, crear un skeleton que aproxime el layout real:
- **Dashboard:** 4 skeleton KPI cards + 2 skeleton panel boxes
- **Pipeline:** 3 columnas skeleton con 3 cards cada una
- **Tasks:** 6 skeleton task cards con priority dot y fecha
- **Contacts table:** 10 filas skeleton con las columnas reales

---

### 3.4 Header — Breadcrumb contextual

**Problema:** El header siempre muestra lo mismo (search + acciones). No hay indicación de en qué sección está el usuario más allá del sidebar.

**Plan:** Añadir un breadcrumb simple en el área izquierda del header (entre el sidebar y la búsqueda):

```
Dashboard  /  Contactos  /  María López
```

En mobile (cuando el sidebar está oculto), el breadcrumb muestra la sección actual como título.

```tsx
// En cada page, pasar el breadcrumb al header via contexto
<AppHeader breadcrumb={[
  { label: "Contactos", href: "/contacts" },
  { label: contact.name }
]} />
```

---

### 3.5 Contacts — Toolbar de selección múltiple

**Problema:** La tabla de contactos soporta selección múltiple (hay `selectedContacts` state y checkboxes), pero no hay una toolbar visible que aparezca cuando se seleccionan contactos.

**Plan:** Cuando `selectedContacts.length > 0`, mostrar una toolbar flotante sobre la tabla:
```
[×] 3 contactos seleccionados    [Asignar asesor ▾]  [Mover a etapa ▾]  [Eliminar]
```
Animada con `framer-motion` (slide up desde abajo).

---

### 3.6 Reports — Mejoras de charts y export

**Problema:** Los charts de Recharts probablemente usan estilos por defecto que no encajan con el design system. El botón "Descargar" (Download) existe pero no tiene implementación.

**Plan:**
- Configurar Recharts con colores brand: `stroke="#8B5CF6"`, `fill="rgba(139,92,246,0.1)"`, tooltip glass-styled
- Implementar export a CSV: serializar los datos del state a CSV y descargar via `URL.createObjectURL`
- Añadir un rango de fechas personalizado con un date range picker (shadcn Calendar en Popover)
- Añadir filtro por asesor en todos los charts

---

### 3.7 Settings — Iconos en tabs y mejoras de layout

**Problema:** Las tabs de Settings (`Perfil`, `Organización`, `Notificaciones`, `Seguridad`, `Apariencia`) no tienen iconos. El layout es denso y poco escaneble.

**Plan:**
- Añadir iconos a cada tab: `User`, `Building`, `Bell`, `Shield`, `Palette`
- Añadir separadores visuales entre secciones dentro de cada tab
- Mejorar el formulario de perfil: mostrar la foto de avatar como preview antes de guardar
- En Apariencia: mover el ThemeToggle aquí desde el header (con preview de ambos temas)

---

### 3.8 Training — Cards mejoradas + progreso

**Problema:** Las training cards son básicas (icono + título + descripción). No hay tracking de progreso por usuario. No hay filtros por categoría visibles.

**Plan:**
- Añadir tabs/pills de categoría en el top: `Todos | Cursos | Videos | Documentos | Guías`
- Añadir un estado "Completado" per-user (checkbox + marca visual)
- Mejorar las cards con: thumbnail placeholder según tipo, duración estimada si existe, fecha de actualización
- Card footer: `[Ver recurso →]` button más prominente

---

### 3.9 Teams — Mejoras de visualización

**Problema:** Las team cards muestran Progress bars para los objetivos pero sin valores relativos claros. La lista de miembros es solo avatares superpuestos.

**Plan:**
- En cada goal, mostrar: `${currentValue} / ${targetValue} ${unit}` bajo la progress bar
- Añadir un badge de estado del objetivo: "En camino", "En riesgo", "Completado"
- Expandir la lista de miembros: en lugar de solo avatares, mostrar nombre en hover (tooltip ya existe en shadcn)
- Añadir un "Activity" mini-feed por equipo con últimos eventos del calendario del equipo

---

## NIVEL 4 — Nuevas funcionalidades UX

### 4.1 Global: FAB (Floating Action Button) en mobile

En mobile, los quick-actions del header desaparecen. Añadir un FAB circular violeta en esquina inferior derecha visible solo en mobile:

```
[+ Nuevo ▾]
  → Contacto
  → Tarea
  → Evento
```

Expandible con `framer-motion` stagger animation.

---

### 4.2 Command Palette — Ampliar capacidades

La command palette actual ya funciona bien. Mejoras:

- Añadir sección "Recientes" que persiste en localStorage (últimos 5 contactos/tareas visitados)
- Añadir preview de contacto al hovear en los resultados de búsqueda
- Añadir atajos de teclado documentados visibles en cada item
- Añadir soporte para `>` prefix: `>tema oscuro` para cambiar tema, `>cerrar sesión` para logout

---

### 4.3 Onboarding / Estado inicial de organización vacía

Si la organización no tiene contactos/deals/tareas, las páginas muestran listas vacías sin contexto.

**Plan:** Detectar organizaciones nuevas (0 contactos) y mostrar un "Welcome flow":
- En Dashboard: un banner de "Bienvenido, aquí están los primeros pasos"
- Steps: Crear primer contacto → Mover a pipeline → Crear primera tarea → Invitar un compañero
- Progress indicator: 0/4 pasos completados

---

### 4.4 Pipeline — Vista de lista alternativa

Algunos usuarios prefieren una lista flat del pipeline en lugar del kanban. Añadir un toggle Vista Kanban / Vista Lista en el header del pipeline, que muestre los mismos contactos en una tabla con columnas: Nombre, Etapa, Asesor, Valor, Última actividad.

---

## Resumen de implementación

### Prioridad ALTA (corregir primero — impactan calidad básica)
| # | Mejora | Archivo(s) |
|---|--------|-----------|
| 1 | Reemplazar ORGANIZATION_ID hardcodeado | `tasks/page.tsx`, `calendar/page.tsx`, `training/page.tsx` |
| 2 | Reemplazar users[] hardcodeado en Tasks | `tasks/page.tsx` |
| 3 | Eliminar ThemeToggle del header | `app-header.tsx` |
| 4 | Corregir user menu duplicado | `app-header.tsx` |
| 5 | KPI trends dinámicos | `dashboard/page.tsx` + `/api/dashboard/stats` |

### Prioridad MEDIA (mejoran percepción de calidad)
| # | Mejora | Archivo(s) |
|---|--------|-----------|
| 6 | Task grouping temporal | `tasks/page.tsx` |
| 7 | Sidebar group labels + notification badge | `app-sidebar.tsx` |
| 8 | Pipeline stats bar | `pipeline/page.tsx` |
| 9 | Notification grouping + borde izquierdo | `notifications/page.tsx` |
| 10 | Empty states consistentes | Todas las páginas |
| 11 | Contacts bulk action toolbar | `contacts/page.tsx`, `contact-table.tsx` |
| 12 | Header breadcrumb | `app-header.tsx` + contexto |

### Prioridad NORMAL (enriquecen la experiencia)
| # | Mejora | Archivo(s) |
|---|--------|-----------|
| 13 | Dashboard: actividad reciente + mini sparklines | `dashboard/page.tsx` |
| 14 | Dashboard: pipeline funnel mini chart | `dashboard/page.tsx` |
| 15 | Calendar: toggle mes/semana/agenda | `calendar/page.tsx` |
| 16 | Settings: iconos en tabs + mover ThemeToggle aquí | `settings/page.tsx` |
| 17 | Reports: chart styling brand + export CSV | `reports/page.tsx` |
| 18 | Training: category pills + progreso | `training/page.tsx` |
| 19 | Teams: goal status badges + member details | `teams/page.tsx` |
| 20 | Skeleton loaders mejorados | Múltiples páginas |

### Prioridad BAJA (nuevas features)
| # | Mejora | Archivo(s) |
|---|--------|-----------|
| 21 | Mobile FAB | Nuevo componente |
| 22 | Command palette: recientes + preview | `command-palette.tsx` |
| 23 | Onboarding welcome flow | `dashboard/page.tsx` + nuevo componente |
| 24 | Pipeline: vista lista alternativa | `pipeline/page.tsx` |

---

## Principios de implementación

1. **No refactorizar lo que no está roto.** Hacer cambios quirúrgicos sobre el código existente.
2. **Respetar el design system.** Todos los nuevos elementos usan los tokens existentes (`violet-*`, `border-white/8`, `.glass`, etc.).
3. **Animaciones consistentes.** Usar siempre `initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}` para entradas.
4. **Mobile first en nuevos componentes.** Los nuevos componentes deben funcionar en mobile antes de desktop.
5. **Prueba con datos vacíos.** Cada mejora debe contemplar el estado vacío.
