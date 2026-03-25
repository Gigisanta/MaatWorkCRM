# UI/UX Refinement Round 2 — MaatWork CRM v3
**Fecha:** 2026-03-25
**Basado en:** auditoría de código real post-plan-anterior

## Qué fue completado en Round 1
- Sidebar group labels, notification badge, quick logout
- Header user menu limpio
- Dashboard: KPI trends, upcoming tasks con priority bars, mini-calendar, MobileFAB
- Pipeline: toggle kanban/lista
- Tasks: search, priority bar vertical
- Settings: ThemePreviewCard + Apariencia tab
- EmptyState y ErrorState components

## Nuevos problemas encontrados (Round 2 audit)
- Dashboard PipelineSummary bug: muestra `activeContacts` DOS VECES (mismo valor)
- Pipeline: sin stats bar, sin column value totals
- Notifications: agrupación/border/delete no verificados
- Reports: Recharts sin brand colors, sin CSV export
- Training: sin category pills, cards básicas
- Teams: sin goal status badges, sin member tooltips
- Calendar: solo vista mes
- Tasks: grouping render pendiente de verificar

## Plan de ejecución (4 rondas × 3 agentes en paralelo)

### RONDA 1
- 1A: Dashboard overhaul (fix bug + mini funnel + activity feed)
- 1B: Pipeline stats bar + column value totals + contact card mejoras
- 1C: Notifications temporal grouping + left border + delete button

### RONDA 2
- 2A: Reports brand charts (Recharts brand colors) + CSV export
- 2B: Training category pills + improved cards
- 2C: Teams goal status badges + member tooltips + progress values

### RONDA 3
- 3A: Tasks grouping render (colapsable groups)
- 3B: Calendar week/agenda view toggle
- 3C: Settings tabs icons + contacts empty state polish

### RONDA 4
- 4A: Command palette "Recientes" + keyboard shortcuts
- 4B: Global micro-interactions + Mobile FAB expansion

## Design tokens (NUNCA usar indigo, siempre violet)
- Fondo: `#08090B`
- Cards: `bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl`
- Brand: `violet-500` (#8B5CF6), accent: `violet-400` (#A78BFA)
- Border normal: `border-white/8`, hover: `border-white/15`, active: `border-violet-500/20`
- Animación: `initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}`
- Glass: usar clase `.glass` de globals.css
- Content padding: `collapsed ? "lg:pl-[80px]" : "lg:pl-[220px]"`
