# MaatWork CRM — AI Development Prompts

25+ prompts para desarrollo AI-asistido del CRM. Ordenados por módulo y complejidad.

---

## 1. Contacts

```
"Agrega un campo 'company' al contacto y actualiza el formulario y la lista para mostrarlo."
```

```
"Implementa paginación infinita en la lista de contactos usando TanStack Query + useInfiniteQuery."
```

```
"Agrega un modal para crear contacto rápido desde cualquier página usando Radix Dialog."
```

```
"Implementa búsqueda fuzzy en contactos que busque por nombre, email, teléfono y tags simultáneamente."
```

```
"Agrega la vista de detalle de contacto ($contactId) con historial de notas, deals asociados y tareas."
```

## 2. Pipeline

```
"Migra el drag-and-drop del pipeline de HTML5 nativo a @dnd-kit para mejor accesibilidad y touch support."
```

```
"Agrega un formulario modal para crear deals directamente desde una columna del Kanban."
```

```
"Implementa filtros en el pipeline: por asesor asignado, rango de valor, y probabilidad mínima."
```

```
"Agrega un 'deal detail drawer' que se abra al hacer click en una tarjeta del Kanban."
```

## 3. Tasks

```
"Implementa lógica de recurrencia: cuando se completa una tarea recurrente, crear la siguiente automáticamente."
```

```
"Agrega vista de calendario para tareas además de la vista lista, usando la misma data."
```

```
"Implementa notificaciones push cuando una tarea está por vencer (1 día antes)."
```

## 4. Teams & Goals

```
"Agrega sistema de invitación por email para nuevos miembros del equipo con token de verificación."
```

```
"Implementa un leaderboard del equipo mostrando ranking de asesores por deals cerrados y contactos activos."
```

```
"Agrega gráficos de progreso de metas del equipo usando Recharts (line chart mensual)."
```

## 5. Analytics & Reports

```
"Implementa export a PDF del reporte mensual con los KPIs, breakdown por etapa y tendencias."
```

```
"Agrega un dashboard de conversión que muestre el funnel completo: lead → prospecto → activo con tasas."
```

```
"Crea un reporte comparativo mes a mes para los últimos 6 meses."
```

## 6. Auth & Security

```
"Implementa middleware de autorización basado en roles: admin accede a todo, asesor solo a su org."
```

```
"Agrega 2FA (two-factor authentication) usando TOTP con better-auth."
```

```
"Implementa RLS (Row Level Security) para que cada asesor solo vea sus contactos y deals."
```

## 7. Automations

```
"Configura Inngest para enviar un email de bienvenida real usando Resend cuando se activa un contacto."
```

```
"Agrega una automatización que archive deals sin actividad por más de 30 días."
```

```
"Implementa un resumen semanal por email para cada asesor con sus métricas de la semana."
```

## 8. Infrastructure

```
"Configura Sentry para error tracking con source maps y performance monitoring."
```

```
"Implementa optimistic updates en todas las mutaciones del pipeline para respuesta instantánea."
```

```
"Agrega un health check endpoint y configura Uptime Robot para monitoreo de disponibilidad."
```

## 9. UI/UX

```
"Agrega un tema claro (light mode) con toggle en settings, guardando preferencia en localStorage."
```

```
"Implementa skeleton loaders en todas las páginas durante la carga de datos."
```

```
"Agrega shortcuts de teclado: N=nuevo contacto, T=nueva tarea, P=ir a pipeline."
```

---

> **Tip**: Usa estos prompts secuencialmente para evolucionar el CRM de MVP a producción.
