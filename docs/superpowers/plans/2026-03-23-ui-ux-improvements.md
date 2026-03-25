# UI/UX Improvements — MaatWork CRM v3 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mejorar UI/UX de toda la app aplicando las mejoras priorizadas del spec `docs/superpowers/specs/2026-03-23-ui-ux-improvement-plan.md`.

**Architecture:** Cambios quirúrgicos sobre el código existente respetando el design system. Sin refactors globales. Cada batch es independiente y puede ejecutarse en paralelo.

**Tech Stack:** Next.js 16, React 19, TypeScript 5.6, Tailwind CSS 4, shadcn/ui, Framer Motion 12, Recharts, TanStack Query v5

**Design System Tokens:**
- Fondo: `#08090B` | Cards: `bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl`
- Brand: `violet-500` (#8B5CF6) | Accent: `violet-400` (#A78BFA)
- Animación entrada: `initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}`
- Borders: `border-white/8` normal | `border-white/15` hover | `border-violet-500/20` active

---

## BATCH 1 — Bugs críticos (ejecutar en paralelo)

### Task 1A: Corregir ORGANIZATION_ID hardcodeado

**Files:**
- Modify: `src/app/tasks/page.tsx`
- Modify: `src/app/calendar/page.tsx`
- Modify: `src/app/training/page.tsx`

**Problema:** Tres páginas usan `ORGANIZATION_ID = "org_maatwork_demo"` hardcodeado. Tasks también tiene un array `users` hardcodeado.

- [ ] **Step 1: Leer tasks/page.tsx completo**

```bash
# buscar la constante hardcodeada
grep -n "ORGANIZATION_ID\|org_maatwork\|const users = \[" src/app/tasks/page.tsx
```

- [ ] **Step 2: En tasks/page.tsx — reemplazar ORGANIZATION_ID**

Encontrar `const ORGANIZATION_ID` o `"org_maatwork_demo"` y reemplazar con:
```tsx
const { user } = useAuth(); // ya importado en la mayoría de páginas
const organizationId = user?.organizationId || null;
```
Todas las referencias a `ORGANIZATION_ID` en queries → `organizationId`.
Añadir `enabled: !!organizationId` a los queries.

- [ ] **Step 3: En tasks/page.tsx — reemplazar users[] hardcodeado**

Encontrar el array `const users = [{ id: "user_gio"...}]` y reemplazarlo con un query real:
```tsx
const { data: usersData } = useQuery({
  queryKey: ["users", organizationId],
  queryFn: async () => {
    if (!organizationId) return { users: [] };
    const res = await fetch(`/api/users?organizationId=${organizationId}`, { credentials: 'include' });
    if (!res.ok) throw new Error("Failed to fetch users");
    return res.json();
  },
  enabled: !!organizationId,
});
const users = usersData?.users || [];
```

- [ ] **Step 4: En calendar/page.tsx — mismo fix**

```bash
grep -n "ORGANIZATION_ID\|org_maatwork" src/app/calendar/page.tsx
```
Reemplazar con `user?.organizationId` usando `useAuth()`.

- [ ] **Step 5: En training/page.tsx — mismo fix**

```bash
grep -n "ORGANIZATION_ID\|org_maatwork" src/app/training/page.tsx
```
Reemplazar con `user?.organizationId` usando `useAuth()`.

- [ ] **Step 6: Verificar que no rompe TypeScript**

```bash
cd /Users/prueba/Desktop/maatworkcrmv3 && npx tsc --noEmit 2>&1 | grep -E "tasks/page|calendar/page|training/page" | head -20
```

- [ ] **Step 7: Commit**

```bash
git add src/app/tasks/page.tsx src/app/calendar/page.tsx src/app/training/page.tsx
git commit -m "fix: replace hardcoded ORGANIZATION_ID with user.organizationId in tasks/calendar/training"
```

---

### Task 1B: Corregir app-header.tsx

**Files:**
- Modify: `src/components/layout/app-header.tsx`

**Problemas:**
1. `<ThemeToggle />` en header contradice el brandbook (dark mode forced)
2. User menu tiene "Perfil" y "Configuración" ambos → `/settings` (duplicado)
3. Icono `Users` en "Perfil" — incorrecto, debería ser `User`

- [ ] **Step 1: Leer app-header.tsx completo**

```bash
cat src/components/layout/app-header.tsx
```

- [ ] **Step 2: Eliminar ThemeToggle del header**

Buscar `<ThemeToggle` y eliminar el import y el componente del JSX.

- [ ] **Step 3: Corregir user menu duplicado**

El menu debe quedar:
```tsx
<DropdownMenuItem asChild>
  <Link href="/settings" className="cursor-pointer">
    <User className="mr-2 h-4 w-4" />
    Perfil
  </Link>
</DropdownMenuItem>
<DropdownMenuItem asChild>
  <Link href="/tasks" className="cursor-pointer">
    <CheckSquare className="mr-2 h-4 w-4" />
    Mis tareas
  </Link>
</DropdownMenuItem>
<DropdownMenuItem asChild>
  <Link href="/calendar" className="cursor-pointer">
    <Calendar className="mr-2 h-4 w-4" />
    Calendario
  </Link>
</DropdownMenuItem>
```
Eliminar el item "Configuración" duplicado. Corregir `Users` → `User` en el import de lucide-react.

- [ ] **Step 4: Verificar TypeScript**

```bash
cd /Users/prueba/Desktop/maatworkcrmv3 && npx tsc --noEmit 2>&1 | grep "app-header" | head -10
```

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/app-header.tsx
git commit -m "fix: remove ThemeToggle from header, fix duplicate user menu items"
```

---

## BATCH 2 — Sidebar + Dashboard KPIs (ejecutar en paralelo tras Batch 1)

### Task 2A: Sidebar — Group labels + notification badge + logout rápido

**Files:**
- Modify: `src/components/layout/app-sidebar.tsx`

- [ ] **Step 1: Leer app-sidebar.tsx completo**

- [ ] **Step 2: Añadir group labels**

Modificar `navigationGroups` para incluir labels:
```tsx
const navigationGroups = React.useMemo(() => [
  {
    label: "PRINCIPAL",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Contactos", href: "/contacts", icon: Users },
      { name: "Pipeline", href: "/pipeline", icon: Target },
    ]
  },
  {
    label: "PRODUCTIVIDAD",
    items: [
      { name: "Tareas", href: "/tasks", icon: CheckSquare },
      { name: "Calendario", href: "/calendar", icon: Calendar },
    ]
  },
  {
    label: "EQUIPO",
    items: [
      { name: "Equipos", href: "/teams", icon: Building2 },
      { name: "Reportes", href: "/reports", icon: BarChart3 },
      { name: "Capacitación", href: "/training", icon: GraduationCap },
    ]
  },
  {
    label: "SISTEMA",
    items: [
      { name: "Configuración", href: "/settings", icon: Settings },
    ]
  },
], []);
```

Renderizar labels cuando `!collapsed`:
```tsx
{!collapsed && (
  <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-3 mb-1 mt-2">
    {group.label}
  </p>
)}
```

- [ ] **Step 3: Añadir notification badge**

Añadir query de unread count:
```tsx
const { data: notifData } = useQuery({
  queryKey: ["notifications-count", user?.organizationId],
  queryFn: async () => {
    if (!user?.organizationId) return { unreadCount: 0 };
    const res = await fetch(`/api/notifications?organizationId=${user.organizationId}&limit=1`, { credentials: 'include' });
    if (!res.ok) return { unreadCount: 0 };
    return res.json();
  },
  enabled: !!user?.organizationId,
  staleTime: 30 * 1000,
  refetchInterval: 60 * 1000,
});
const unreadCount = notifData?.unreadCount || 0;
```

En el nav item de Configuración (o añadir un item Notificaciones si no existe), mostrar badge:
```tsx
{item.name === "Configuración" && unreadCount > 0 && (
  <span className="ml-auto h-4 min-w-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
    {unreadCount > 99 ? "99+" : unreadCount}
  </span>
)}
```

- [ ] **Step 4: Logout rápido en user section**

Añadir `useRouter` y función logout. En el user section, añadir botón de logout visible en hover:
```tsx
import { useAuth } from "@/lib/auth-context";
// ya importado

const { logout } = useAuth();
const router = useRouter();

// En user section, wrap en grupo con hover:
<div className="group flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/5 transition-all duration-200 cursor-pointer">
  {/* ... avatar + info existente ... */}
  {!collapsed && (
    <button
      onClick={async () => { await logout(); }}
      className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 rounded-md hover:bg-white/10 text-slate-500 hover:text-rose-400"
      title="Cerrar sesión"
    >
      <LogOut className="h-3.5 w-3.5" />
    </button>
  )}
</div>
```

- [ ] **Step 5: Verificar TypeScript**

```bash
cd /Users/prueba/Desktop/maatworkcrmv3 && npx tsc --noEmit 2>&1 | grep "app-sidebar" | head -10
```

- [ ] **Step 6: Commit**

```bash
git add src/components/layout/app-sidebar.tsx
git commit -m "feat: sidebar group labels, notification badge, quick logout"
```

---

### Task 2B: Dashboard — KPI trends dinámicos + mejoras de layout

**Files:**
- Modify: `src/app/dashboard/page.tsx`
- Modify: `src/app/api/dashboard/stats/route.ts` (o donde esté el endpoint)

- [ ] **Step 1: Leer dashboard/page.tsx y el endpoint de stats**

```bash
find src/app/api/dashboard -name "*.ts" -o -name "*.tsx"
cat src/app/api/dashboard/stats/route.ts
```

- [ ] **Step 2: Actualizar endpoint para retornar trends**

En el endpoint de stats, añadir comparativa con período anterior:
```ts
// Comparar contactos activos hace 30 días vs hoy
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

const prevContacts = await prisma.contact.count({
  where: { organizationId, createdAt: { lt: thirtyDaysAgo } }
});

// Calcular trend
const contactsTrend = prevContacts > 0
  ? Math.round(((activeContacts - prevContacts) / prevContacts) * 100)
  : 0;

// Retornar en el response:
// contactsTrend: number (+ positivo, - negativo)
// pipelineTrend: number
// tasksTrend: number
```

- [ ] **Step 3: Actualizar kpiConfig en dashboard/page.tsx**

Añadir `trendValue` y `trendDirection` dinámicos desde `stats`:
```tsx
const kpiValues: Record<string, { value: string; trend: number | null }> = {
  pipeline: { value: `$${pipelineValue.toLocaleString()}`, trend: stats?.pipelineTrend ?? null },
  contacts: { value: String(activeContacts), trend: stats?.contactsTrend ?? null },
  tasks: { value: String(pendingTasks), trend: stats?.tasksTrend ?? null },
  goals: { value: `${Math.round(avgGoalProgress)}%`, trend: null },
};
```

En el KPI card, mostrar trend real:
```tsx
{kpiValues[kpi.key].trend !== null && (
  <span className={cn(
    "text-xs font-medium px-2 py-0.5 rounded-full",
    kpiValues[kpi.key].trend >= 0
      ? "bg-emerald-500/10 text-emerald-400"
      : "bg-rose-500/10 text-rose-400"
  )}>
    {kpiValues[kpi.key].trend >= 0 ? "↑" : "↓"} {Math.abs(kpiValues[kpi.key].trend)}%
  </span>
)}
```

- [ ] **Step 4: Añadir próximas tareas con fecha real**

Añadir query de próximas tareas al dashboard:
```tsx
const { data: upcomingTasksData } = useQuery({
  queryKey: ["dashboard-upcoming-tasks", user?.organizationId],
  queryFn: async () => {
    if (!user?.organizationId) return { tasks: [] };
    const res = await fetch(
      `/api/tasks?organizationId=${user.organizationId}&status=pending&limit=3&sort=dueDate`,
      { credentials: 'include' }
    );
    if (!res.ok) return { tasks: [] };
    return res.json();
  },
  enabled: !!user?.organizationId && isAuthenticated,
});
const upcomingTasks = upcomingTasksData?.tasks || [];
```

Reemplazar el "Mis Tareas" section con una lista de las próximas 3 tareas con fecha relativa:
```tsx
{upcomingTasks.length > 0 ? upcomingTasks.map((task: any) => (
  <div key={task.id} className="flex items-center gap-3 p-3 bg-white/4 rounded-lg">
    <div className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0",
      task.priority === "urgent" ? "bg-rose-400" :
      task.priority === "high" ? "bg-amber-400" : "bg-slate-500"
    )} />
    <div className="flex-1 min-w-0">
      <p className="text-sm text-slate-200 truncate">{task.title}</p>
      {task.dueDate && (
        <p className="text-xs text-slate-500">
          {isToday(new Date(task.dueDate)) ? "Hoy" :
           isTomorrow(new Date(task.dueDate)) ? "Mañana" :
           format(new Date(task.dueDate), "d MMM")}
        </p>
      )}
    </div>
  </div>
)) : (
  <p className="text-sm text-slate-500 text-center py-4">No hay tareas pendientes</p>
)}
```

- [ ] **Step 5: Verificar TypeScript**

```bash
cd /Users/prueba/Desktop/maatworkcrmv3 && npx tsc --noEmit 2>&1 | grep "dashboard" | head -10
```

- [ ] **Step 6: Commit**

```bash
git add src/app/dashboard/page.tsx src/app/api/dashboard/
git commit -m "feat: dynamic KPI trends in dashboard, upcoming tasks with real dates"
```

---

## BATCH 3 — Tasks grouping + Pipeline stats (en paralelo)

### Task 3A: Tasks — Agrupación temporal + búsqueda + prioridad visual

**Files:**
- Modify: `src/app/tasks/page.tsx`

- [ ] **Step 1: Leer tasks/page.tsx completo**

- [ ] **Step 2: Añadir búsqueda de texto**

Añadir estado de búsqueda y filtrado local:
```tsx
const [taskSearch, setTaskSearch] = React.useState("");
```

Añadir input en el UI sobre la lista:
```tsx
<div className="relative">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
  <input
    value={taskSearch}
    onChange={(e) => setTaskSearch(e.target.value)}
    placeholder="Buscar tareas..."
    className="w-full pl-9 pr-4 py-2 text-sm bg-white/4 border border-white/8 rounded-lg text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-violet-500/40 focus:bg-white/6 transition-all duration-200"
  />
</div>
```

- [ ] **Step 3: Implementar agrupación temporal**

Añadir función de agrupación:
```tsx
const groupTasks = (tasks: Task[]) => {
  const now = new Date();
  const today = startOfDay(now);
  const tomorrow = addDays(today, 1);
  const endOfWeek = addDays(today, 7);

  const filtered = tasks.filter(t =>
    !taskSearch || t.title.toLowerCase().includes(taskSearch.toLowerCase())
  );

  return {
    overdue: filtered.filter(t => t.dueDate && new Date(t.dueDate) < today && t.status !== 'completed'),
    today: filtered.filter(t => t.dueDate && isToday(new Date(t.dueDate)) && t.status !== 'completed'),
    tomorrow: filtered.filter(t => t.dueDate && isTomorrow(new Date(t.dueDate)) && t.status !== 'completed'),
    thisWeek: filtered.filter(t => t.dueDate && new Date(t.dueDate) > tomorrow && new Date(t.dueDate) <= endOfWeek && t.status !== 'completed'),
    later: filtered.filter(t => (!t.dueDate || new Date(t.dueDate) > endOfWeek) && t.status !== 'completed'),
    completed: filtered.filter(t => t.status === 'completed'),
  };
};
```

Renderizar grupos con header colapsable y badge de count:
```tsx
{Object.entries(groupedTasks).map(([group, groupTasks]) => (
  <TaskGroup key={group} label={GROUP_LABELS[group]} tasks={groupTasks} color={GROUP_COLORS[group]} />
))}
```

- [ ] **Step 4: Mejorar prioridad visual**

En cada task card, reemplazar el dot de 8px por una barra vertical izquierda:
```tsx
<div className={cn(
  "absolute left-0 top-3 bottom-3 w-[3px] rounded-full",
  task.priority === "urgent" ? "bg-rose-500" :
  task.priority === "high" ? "bg-amber-500" :
  task.priority === "medium" ? "bg-sky-500" : "bg-slate-600"
)} />
```
Y añadir padding-left al card: `pl-4` para que el contenido no tape la barra.

- [ ] **Step 5: Verificar TypeScript**

```bash
cd /Users/prueba/Desktop/maatworkcrmv3 && npx tsc --noEmit 2>&1 | grep "tasks/page" | head -10
```

- [ ] **Step 6: Commit**

```bash
git add src/app/tasks/page.tsx
git commit -m "feat: task grouping by date, text search, improved priority visual"
```

---

### Task 3B: Pipeline — Stats bar + mejoras de columns + contact cards

**Files:**
- Modify: `src/app/pipeline/page.tsx`
- Modify: `src/app/pipeline/components/contact-card.tsx` (si existe)

- [ ] **Step 1: Leer pipeline/page.tsx y contact-card.tsx**

```bash
cat src/app/pipeline/page.tsx
find src/app/pipeline -name "contact-card.tsx"
cat src/app/pipeline/components/contact-card.tsx
```

- [ ] **Step 2: Añadir Pipeline Stats Bar**

Calcular stats desde los datos del pipeline:
```tsx
const totalContacts = stages.reduce((sum, s) => sum + s.contacts.length, 0);
const totalValue = stages.reduce((sum, s) =>
  sum + s.contacts.reduce((cs, c) =>
    cs + (c.products?.reduce((ps, p) => ps + (p.value || 0), 0) || 0)
  , 0)
, 0);
```

Añadir barra justo después del `<AppHeader />`:
```tsx
<div className="flex items-center gap-6 px-4 lg:px-6 py-2.5 border-b border-white/6 glass">
  <div className="flex items-center gap-2">
    <span className="text-xs text-slate-500">Contactos</span>
    <span className="text-sm font-semibold text-white">{totalContacts}</span>
  </div>
  <div className="w-px h-4 bg-white/10" />
  <div className="flex items-center gap-2">
    <span className="text-xs text-slate-500">Valor total</span>
    <span className="text-sm font-semibold text-white">${totalValue.toLocaleString()}</span>
  </div>
  {/* más stats */}
</div>
```

- [ ] **Step 3: Column header con valor acumulado**

En `StageColumn`, calcular y mostrar el valor total de la columna:
```tsx
const columnValue = stage.contacts.reduce((sum, c) =>
  sum + (c.products?.reduce((ps, p) => ps + (p.value || 0), 0) || 0)
, 0);

// En el header de columna, añadir:
{columnValue > 0 && (
  <p className="text-xs text-slate-500 mt-0.5">${columnValue.toLocaleString()}</p>
)}
```

- [ ] **Step 4: Contact card mejorado**

En `contact-card.tsx`, añadir nombre de empresa y mejorar el footer:
```tsx
{contact.company && (
  <p className="text-xs text-slate-500 truncate -mt-0.5">{contact.company}</p>
)}
```

- [ ] **Step 5: Verificar TypeScript**

```bash
cd /Users/prueba/Desktop/maatworkcrmv3 && npx tsc --noEmit 2>&1 | grep "pipeline" | head -10
```

- [ ] **Step 6: Commit**

```bash
git add src/app/pipeline/
git commit -m "feat: pipeline stats bar, column value totals, improved contact cards"
```

---

## BATCH 4 — Notifications + Empty/Error States (en paralelo)

### Task 4A: Notifications — Agrupación + borde + eliminar + header stats

**Files:**
- Modify: `src/app/notifications/page.tsx`

- [ ] **Step 1: Leer notifications/page.tsx completo**

- [ ] **Step 2: Añadir agrupación temporal**

```tsx
const groupNotifications = (notifications: Notification[]) => {
  const now = new Date();
  const todayStart = startOfDay(now);
  const yesterdayStart = subDays(todayStart, 1);
  const weekStart = subDays(todayStart, 7);

  return {
    today: notifications.filter(n => new Date(n.createdAt) >= todayStart),
    yesterday: notifications.filter(n => new Date(n.createdAt) >= yesterdayStart && new Date(n.createdAt) < todayStart),
    thisWeek: notifications.filter(n => new Date(n.createdAt) >= weekStart && new Date(n.createdAt) < yesterdayStart),
    older: notifications.filter(n => new Date(n.createdAt) < weekStart),
  };
};
```

- [ ] **Step 3: Añadir borde izquierdo para no-leídas**

En cada notification card, añadir:
```tsx
className={cn(
  "relative overflow-hidden rounded-xl border bg-[#0E0F12]/80 backdrop-blur-sm p-4 transition-all duration-200",
  !notification.isRead
    ? "border-violet-500/30 border-l-violet-500 border-l-2"
    : "border-white/8"
)}
```

- [ ] **Step 4: Botón eliminar individual**

En cada notification card, añadir botón `×` visible en hover:
```tsx
<button
  className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity h-5 w-5 rounded-md flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-white/8"
  onClick={(e) => { e.stopPropagation(); handleDelete(notification.id); }}
>
  <X className="h-3 w-3" />
</button>
```

- [ ] **Step 5: Header con stats mejorado**

```tsx
<div className="flex items-center justify-between mb-6">
  <div>
    <h1 className="text-2xl font-bold text-white">Notificaciones</h1>
    {unreadCount > 0 && (
      <p className="text-sm text-slate-500 mt-0.5">
        <span className="text-violet-400 font-medium">{unreadCount}</span> sin leer
      </p>
    )}
  </div>
  {unreadCount > 0 && (
    <Button variant="outline" size="sm" onClick={handleMarkAllRead}
      className="text-xs border-white/10 text-slate-400 hover:text-white">
      Marcar todas como leídas
    </Button>
  )}
</div>
```

- [ ] **Step 6: Commit**

```bash
git add src/app/notifications/page.tsx
git commit -m "feat: notification grouping, left border for unread, delete button, header stats"
```

---

### Task 4B: Empty States + Error States + Skeleton Loaders

**Files:**
- Create: `src/components/ui/empty-state.tsx`
- Create: `src/components/ui/error-state.tsx`
- Modify: `src/app/contacts/page.tsx` (añadir EmptyState)
- Modify: `src/app/training/page.tsx` (añadir EmptyState)
- Modify: `src/app/pipeline/page.tsx` (mejorar EmptyState)
- Modify: `src/app/tasks/page.tsx` (añadir EmptyState)

- [ ] **Step 1: Crear EmptyState component**

```tsx
// src/components/ui/empty-state.tsx
import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "flex flex-col items-center justify-center py-16 px-4 text-center",
        "border-2 border-dashed border-white/8 rounded-xl",
        className
      )}
    >
      <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center mb-4">
        <Icon className="h-6 w-6 text-violet-400" strokeWidth={1.5} />
      </div>
      <h3 className="text-base font-semibold text-white mb-1">{title}</h3>
      {description && <p className="text-sm text-slate-500 max-w-xs mb-4">{description}</p>}
      {action && (
        <Button size="sm" onClick={action.onClick}
          className="bg-violet-500 hover:bg-violet-600 text-white">
          {action.label}
        </Button>
      )}
    </motion.div>
  );
}
```

- [ ] **Step 2: Crear ErrorState component**

```tsx
// src/components/ui/error-state.tsx
import * as React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "./button";
import { motion } from "framer-motion";

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "No se pudo cargar",
  description = "Hubo un problema al conectar con el servidor.",
  onRetry
}: ErrorStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center mb-4">
        <AlertCircle className="h-6 w-6 text-rose-400" strokeWidth={1.5} />
      </div>
      <h3 className="text-base font-semibold text-white mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-xs mb-4">{description}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}
          className="border-white/10 text-slate-400 hover:text-white gap-2">
          <RefreshCw className="h-3.5 w-3.5" />
          Reintentar
        </Button>
      )}
    </motion.div>
  );
}
```

- [ ] **Step 3: Integrar EmptyState en contacts/page.tsx**

Buscar donde se renderiza la tabla de contactos cuando no hay resultados y añadir:
```tsx
{contacts.length === 0 && !isLoading && (
  <EmptyState
    icon={Users}
    title={search ? "Sin resultados" : "No hay contactos aún"}
    description={search ? `No se encontraron contactos para "${search}"` : "Crea tu primer contacto para empezar"}
    action={!search ? { label: "Crear contacto", onClick: () => setCreateOpen(true) } : undefined}
  />
)}
```

- [ ] **Step 4: Integrar en training/page.tsx**

Cuando no hay materiales:
```tsx
{materials.length === 0 && !isLoading && (
  <EmptyState
    icon={GraduationCap}
    title="No hay materiales de capacitación"
    description="Añade recursos de formación para tu equipo"
    action={{ label: "Añadir material", onClick: () => setCreateOpen(true) }}
  />
)}
```

- [ ] **Step 5: Integrar ErrorState en pipeline y tasks**

En cada página donde hay un `isError`, reemplazar mensajes genéricos con `<ErrorState onRetry={() => refetch()} />`.

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/empty-state.tsx src/components/ui/error-state.tsx src/app/contacts/page.tsx src/app/training/page.tsx src/app/pipeline/page.tsx src/app/tasks/page.tsx
git commit -m "feat: reusable EmptyState and ErrorState components, integrate across pages"
```

---

## BATCH 5 — Settings + Training (en paralelo)

### Task 5A: Settings — Iconos en tabs + ThemeToggle

**Files:**
- Modify: `src/app/settings/page.tsx`

- [ ] **Step 1: Leer settings/page.tsx completo**

- [ ] **Step 2: Añadir iconos a tabs**

```tsx
// En los TabsTrigger, añadir iconos:
<TabsTrigger value="profile" className="flex items-center gap-2">
  <User className="h-4 w-4" />
  <span className="hidden sm:inline">Perfil</span>
</TabsTrigger>
<TabsTrigger value="organization" className="flex items-center gap-2">
  <Building className="h-4 w-4" />
  <span className="hidden sm:inline">Organización</span>
</TabsTrigger>
<TabsTrigger value="notifications" className="flex items-center gap-2">
  <Bell className="h-4 w-4" />
  <span className="hidden sm:inline">Notificaciones</span>
</TabsTrigger>
<TabsTrigger value="security" className="flex items-center gap-2">
  <Shield className="h-4 w-4" />
  <span className="hidden sm:inline">Seguridad</span>
</TabsTrigger>
<TabsTrigger value="appearance" className="flex items-center gap-2">
  <Palette className="h-4 w-4" />
  <span className="hidden sm:inline">Apariencia</span>
</TabsTrigger>
```

- [ ] **Step 3: Mover ThemeToggle a tab Apariencia**

En el tab "appearance", añadir la sección de tema:
```tsx
<div className="space-y-4">
  <div>
    <h3 className="text-sm font-semibold text-white mb-1">Tema</h3>
    <p className="text-xs text-slate-500 mb-3">El modo claro está en beta y puede tener inconsistencias visuales.</p>
    <div className="flex items-center gap-4">
      <button onClick={() => setTheme("dark")}
        className={cn("px-4 py-2 rounded-lg border text-sm font-medium transition-all",
          theme === "dark" ? "border-violet-500/40 bg-violet-500/10 text-violet-300" : "border-white/10 text-slate-400 hover:border-white/20")}>
        Oscuro (recomendado)
      </button>
      <button onClick={() => setTheme("light")}
        className={cn("px-4 py-2 rounded-lg border text-sm font-medium transition-all",
          theme === "light" ? "border-violet-500/40 bg-violet-500/10 text-violet-300" : "border-white/10 text-slate-400 hover:border-white/20")}>
        Claro (beta)
      </button>
    </div>
  </div>
</div>
```

- [ ] **Step 4: Commit**

```bash
git add src/app/settings/page.tsx
git commit -m "feat: settings tabs with icons, move ThemeToggle to appearance tab"
```

---

### Task 5B: Training — Category pills + mejoras de cards

**Files:**
- Modify: `src/app/training/page.tsx`

- [ ] **Step 1: Leer training/page.tsx completo**

- [ ] **Step 2: Añadir filtro de categorías**

```tsx
const [categoryFilter, setCategoryFilter] = React.useState<string>("all");

const CATEGORY_LABELS: Record<string, string> = {
  all: "Todos",
  course: "Cursos",
  video: "Videos",
  document: "Documentos",
  guide: "Guías",
};

// Pills de categoría
<div className="flex items-center gap-2 flex-wrap">
  {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
    <button
      key={key}
      onClick={() => setCategoryFilter(key)}
      className={cn(
        "px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200",
        categoryFilter === key
          ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
          : "bg-white/4 text-slate-400 border border-white/8 hover:bg-white/8 hover:text-slate-300"
      )}
    >
      {label}
    </button>
  ))}
</div>
```

- [ ] **Step 3: Mejorar training cards**

En cada card, añadir:
- Icono prominente según tipo (Video→`Video`, Document→`FileText`, Course→`BookOpen`)
- Footer con botón "Ver recurso →" más prominente
- Duración estimada si `duration` existe en el modelo
- Badge de tipo en la esquina superior derecha

```tsx
// Card header mejorado:
<div className="relative p-5 pb-3">
  <div className="flex items-start gap-3">
    <div className="p-2.5 rounded-xl bg-violet-500/10 flex-shrink-0">
      <TypeIcon className="h-5 w-5 text-violet-400" strokeWidth={1.5} />
    </div>
    <div className="flex-1 min-w-0">
      <h3 className="text-sm font-semibold text-white truncate">{material.title}</h3>
      {material.description && (
        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{material.description}</p>
      )}
    </div>
  </div>
</div>
// Card footer:
<div className="px-5 pb-4">
  <a href={material.url} target="_blank" rel="noopener noreferrer"
    className="flex items-center gap-1.5 text-xs font-medium text-violet-400 hover:text-violet-300 transition-colors">
    Ver recurso
    <ExternalLink className="h-3 w-3" />
  </a>
</div>
```

- [ ] **Step 4: Commit**

```bash
git add src/app/training/page.tsx
git commit -m "feat: training category pills, improved cards with type icons and footer"
```

---

## BATCH 6 — Teams + Mobile FAB (en paralelo)

### Task 6A: Teams — Goal badges + member details

**Files:**
- Modify: `src/app/teams/page.tsx`

- [ ] **Step 1: Leer teams/page.tsx completo**

- [ ] **Step 2: Añadir goal status badges**

```tsx
const getGoalStatus = (current: number, target: number) => {
  const pct = target > 0 ? (current / target) * 100 : 0;
  if (pct >= 100) return { label: "Completado", color: "emerald" };
  if (pct >= 70) return { label: "En camino", color: "sky" };
  if (pct >= 30) return { label: "En riesgo", color: "amber" };
  return { label: "Retrasado", color: "rose" };
};

// En cada goal:
const status = getGoalStatus(goal.currentValue, goal.targetValue);
<span className={cn("text-xs font-medium px-2 py-0.5 rounded-full",
  status.color === "emerald" ? "bg-emerald-500/10 text-emerald-400" :
  status.color === "sky" ? "bg-sky-500/10 text-sky-400" :
  status.color === "amber" ? "bg-amber-500/10 text-amber-400" :
  "bg-rose-500/10 text-rose-400"
)}>
  {status.label}
</span>
```

- [ ] **Step 3: Mostrar valores relativos bajo progress bar**

```tsx
<div className="flex justify-between text-xs text-slate-500 mb-1.5">
  <span>{goal.title}</span>
  <span>{goal.currentValue} / {goal.targetValue} {goal.unit}</span>
</div>
```

- [ ] **Step 4: Tooltips en avatares de miembros**

Envolver cada avatar en TooltipProvider/Tooltip:
```tsx
<TooltipProvider delayDuration={0}>
  <Tooltip>
    <TooltipTrigger asChild>
      <Avatar className="h-7 w-7 border-2 border-[#08090B] -ml-2 first:ml-0">
        {/* ... */}
      </Avatar>
    </TooltipTrigger>
    <TooltipContent side="top" className="text-xs">
      {member.name}
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

- [ ] **Step 5: Commit**

```bash
git add src/app/teams/page.tsx
git commit -m "feat: teams goal status badges, relative values, member name tooltips"
```

---

### Task 6B: Mobile FAB + Contacts bulk action toolbar

**Files:**
- Create: `src/components/ui/mobile-fab.tsx`
- Modify: `src/app/contacts/page.tsx` (bulk action toolbar)
- Modify: `src/app/dashboard/page.tsx` (añadir FAB)

- [ ] **Step 1: Crear Mobile FAB component**

```tsx
// src/components/ui/mobile-fab.tsx
"use client";
import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Users, CheckSquare, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface FABAction {
  label: string;
  icon: React.ElementType;
  onClick: () => void;
}

interface MobileFABProps {
  actions: FABAction[];
  className?: string;
}

export function MobileFAB({ actions, className }: MobileFABProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className={cn("fixed bottom-6 right-6 z-50 lg:hidden flex flex-col items-end gap-2", className)}>
      <AnimatePresence>
        {open && actions.map((action, i) => (
          <motion.button
            key={action.label}
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.8 }}
            transition={{ duration: 0.2, delay: i * 0.05 }}
            onClick={() => { action.onClick(); setOpen(false); }}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-[#0E0F12] border border-white/12 text-sm font-medium text-slate-200 shadow-lg shadow-black/40 hover:bg-white/8 transition-colors"
          >
            <action.icon className="h-4 w-4 text-violet-400" />
            {action.label}
          </motion.button>
        ))}
      </AnimatePresence>
      <motion.button
        onClick={() => setOpen(!open)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-14 h-14 rounded-full bg-violet-500 hover:bg-violet-600 text-white shadow-lg shadow-violet-500/30 flex items-center justify-center transition-colors"
      >
        <motion.div animate={{ rotate: open ? 45 : 0 }} transition={{ duration: 0.2 }}>
          <Plus className="h-6 w-6" />
        </motion.div>
      </motion.button>
    </div>
  );
}
```

- [ ] **Step 2: Añadir FAB al dashboard**

```tsx
// En dashboard/page.tsx, importar MobileFAB y añadir al final del return:
import { MobileFAB } from "@/components/ui/mobile-fab";

// Al final del componente, antes del cierre del div principal:
<MobileFAB actions={[
  { label: "Nuevo contacto", icon: Users, onClick: () => setCreateContactOpen(true) },
  { label: "Nueva tarea", icon: CheckSquare, onClick: () => setCreateTaskOpen(true) },
]} />
```

- [ ] **Step 3: Contacts bulk action toolbar**

En `contacts/page.tsx`, añadir toolbar flotante cuando hay selección:
```tsx
<AnimatePresence>
  {selectedContacts.length > 0 && (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.2 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#0E0F12] border border-white/12 shadow-xl shadow-black/50"
    >
      <span className="text-sm text-slate-300 font-medium">
        {selectedContacts.length} seleccionados
      </span>
      <div className="w-px h-4 bg-white/10" />
      <Button variant="ghost" size="sm" className="text-xs text-slate-400 hover:text-white">
        Asignar asesor
      </Button>
      <Button variant="ghost" size="sm" className="text-xs text-rose-400 hover:text-rose-300">
        Eliminar
      </Button>
      <button onClick={() => setSelectedContacts([])}
        className="p-1 rounded-md text-slate-500 hover:text-slate-300 hover:bg-white/8">
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  )}
</AnimatePresence>
```

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/mobile-fab.tsx src/app/dashboard/page.tsx src/app/contacts/page.tsx
git commit -m "feat: mobile FAB, contacts bulk action floating toolbar"
```

---

## Notas de implementación

### Convenciones a respetar
- NO usar `indigo-*` — siempre `violet-*`
- Borders: `border-white/8` normal, `border-white/15` hover, `border-violet-500/20` active
- Cards: `bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl`
- Glass: `.glass` y `.glass-strong` disponibles en globals.css
- Animación: `initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}`
- Content padding: `collapsed ? "lg:pl-[80px]" : "lg:pl-[220px]"` (NO 280px)

### Imports date-fns necesarios
```tsx
import { isToday, isTomorrow, startOfDay, addDays, subDays, format } from "date-fns";
```

### TypeScript existentes (ignorar)
Los errores en `contact-drawer.tsx`, `create-contact-modal.tsx` son pre-existentes y no deben bloquearte.
