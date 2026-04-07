# Plan: Reports/Analytics Dashboard Overhaul

**Fecha:** 2026-04-07
**Proyecto:** MaatWork CRM v3
**Estado:** Planificado
**Prioridad:** Alta

---

## Resumen Ejecutivo

La sección `/reports` actual es un conjunto de gráficos básicos sin contexto accionable. Este plan la transforma en un **dashboard ejecutivo completo** con métricas que responden: "¿Dónde estoy fallando?", "¿Dónde mejorar?", "¿Qué ajustar?". Todas las agregaciones pesadas se mueven a servidor (API), el frontend se convierte en un orquestador delgado, y se introduce una jerarquía de información clara.

---

## Fase 1: Foundation (Alto Impacto, Esfuerzo Moderado)

### 1.1 Tipos TypeScript Compartidos

**Archivo:** `src/app/reports/types/analytics.ts` (nuevo)

Definir todas las interfaces que comparte el API y los componentes:

```typescript
// Jerarquía de datos del API
interface ReportsAnalyticsResponse {
  generatedAt: string;
  executive: ExecutiveMetrics;
  funnel: FunnelMetrics;
  leadScoring: LeadScoringMetrics;
  goals: GoalsMetrics;
  activity: ActivityMetrics;
  advisor: AdvisorMetrics;
  pipeline: PipelineMetrics;
  contacts: ContactsMetrics;
  trends: TrendsMetrics;
}

interface ExecutiveMetrics {
  pipelineValue: number;
  weightedPipeline: number;       // pipeline * leadScore/30
  pipelineChange: number;          // % vs periodo anterior
  totalContacts: number;
  activeContacts: number;
  contactsChange: number;
  winRate: number;                // 0-100
  avgDealSize: number;
  pipelineVelocity: number;       // avg days to close
  healthScore: number;           // 0-100 composite
  staleContacts: number;          // sin actividad en 14+ días
  overdueTasks: number;
  overdueTasksChange: number;
  avgGoalProgress: number;
  revenueForecast: number;       // weighted pipeline
  revenueForecastChange: number;
}

interface FunnelMetrics {
  stages: FunnelStage[];
  totalContacts: number;
  lostContacts: number;
  lostContactsValue: number;
  overallConversionRate: number;
}

interface FunnelStage {
  id: string;
  name: string;
  color: string;
  order: number;
  count: number;
  value: number;
  conversionRate: number | null;  // % desde etapa anterior
  avgTimeInStage: number | null;   // días
}

// ... (todas las interfaces del diseño arquitectural)
```

### 1.2 Endpoint API Centralizado

**Archivo:** `src/app/api/reports/analytics/route.ts` (nuevo)

- `GET /api/reports/analytics?period=month&include=funnel,goals,activity`
- Usa `Promise.all` para queries paralelas en Prisma
- Traduce `period` (week/month/quarter/year) a fechas con `date-fns`
- Queries clave a implementar:

```sql
-- Pipeline Value por etapa
SELECT ps.id, ps.name, ps.color, ps."order",
  COUNT(c.id) as contact_count,
  COALESCE(SUM(ct.value), 0) as stage_value
FROM "PipelineStage" ps
LEFT JOIN "Contact" c ON c."pipelineStageId" = ps.id
LEFT JOIN "ContactTag" ct ON ct."contactId" = c.id
WHERE ps."organizationId" = $orgId
GROUP BY ps.id;

-- Contacts at Risk (stale = sin update en 14 días)
SELECT COUNT(*) FROM "Contact"
WHERE "organizationId" = $orgId
  AND "updatedAt" < NOW() - INTERVAL '14 days';

-- Lead Score Distribution
SELECT
  CASE
    WHEN "leadScore" BETWEEN 0 AND 5 THEN 'cold'
    WHEN "leadScore" BETWEEN 6 AND 10 THEN 'warm'
    WHEN "leadScore" BETWEEN 11 AND 20 THEN 'hot'
    WHEN "leadScore" BETWEEN 21 AND 30 THEN 'scorching'
  END as bucket,
  COUNT(*),
  AVG(COALESCE(SUM(ct.value), 0)) as avg_value
FROM "Contact" c
LEFT JOIN "ContactTag" ct ON ct."contactId" = c.id
GROUP BY bucket;

-- Win Rate
SELECT
  COUNT(*) FILTER (WHERE d.value > 0) as total_deals,
  COUNT(*) FILTER (WHERE d.value > 0 AND c."pipelineStageId" NOT IN (
    SELECT id FROM "PipelineStage" WHERE name IN ('Caído','Caida','Cuenta vacia','Cuenta Vacía')
  )) as active_deals,
FROM "Deal" d
JOIN "Contact" c ON c.id = d."contactId"
WHERE d."organizationId" = $orgId;

-- Goal Progress por tipo
SELECT type,
  SUM("targetValue") as target,
  SUM("currentValue") as current,
  CASE WHEN SUM("targetValue") > 0
    THEN SUM("currentValue") / SUM("targetValue") * 100
    ELSE 0 END as progress
FROM "TeamGoal"
WHERE "organizationId" = $orgId
GROUP BY type;

-- Weighted Pipeline (value * probability/100)
SELECT
  SUM(value * probability / 100) as weighted_pipeline
FROM "Deal"
WHERE "organizationId" = $orgId
  AND "contactId" IS NOT NULL;
```

### 1.3 Reescribir page.tsx como Orquestador

**Archivo:** `src/app/reports/page.tsx` (reescribir)

- ~150 líneas (reducido de 1100+)
- Solo maneja: auth check, periodo selector, layout grid, fetch al API central
- Importa y compone los componentes de sección
- Elimina TODOS los `useMemo` de cálculo (se mueven al API)

```tsx
// Estructura nueva de page.tsx
export default function ReportsPage() {
  const { user, isAuthenticated } = useAuth();
  const [period, setPeriod] = useState<PeriodFilter>("month");

  // Un solo query al endpoint centralizado
  const { data, isLoading } = useQuery({
    queryKey: ["reports-analytics", user?.organizationId, period],
    queryFn: () => fetch(`/api/reports/analytics?period=${period}`).then(r => r.json()),
    enabled: !!user?.organizationId && isAuthenticated,
  });

  // Layout grid con secciones
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-12 gap-4">
      <ExecutiveSummary data={data?.executive} className="col-span-full" />
      <FunnelAnalytics data={data?.funnel} />
      <GoalPerformance data={data?.goals} />
      <PipelineInsights data={data?.pipeline} />
      <ContactsInsights data={data?.contacts} />
      <AdvisorPerformance data={data?.advisor} />
      <ActivityOverview data={data?.activity} />
      <TimeTrends data={data?.trends} className="col-span-full" />
    </div>
  );
}
```

---

## Fase 2: Componentes de Sección (Alto Impacto, Alto Esfuerzo)

### 2.1 Executive Summary

**Archivo:** `src/app/reports/components/executive-summary.tsx` (nuevo)

6 KPI cards en fila superior:

| KPI | Fuente | color |
|-----|--------|-------|
| Pipeline Value | `executive.pipelineValue` | violet |
| Win Rate | `executive.winRate` | emerald |
| Health Score | `executive.healthScore` (0-100) | violet con ring |
| Goal Progress | `executive.avgGoalProgress` | amber |
| Revenue Forecast | `executive.revenueForecast` | sky |
| Contacts at Risk | `executive.staleContacts` | rose si >0 |

**Health Score** se calcula así:
```
healthScore = (
  (winRate/100 * 0.25) +
  (goalProgress/100 * 0.25) +
  (activityRate * 0.25) +
  (1 - staleContacts/totalContacts) * 0.25
) * 100
```

Cada card muestra: valor principal, cambio % vs periodo anterior (con `TrendingUp/Down`), icono con glow.

### 2.2 Funnel Analytics

**Archivo:** `src/app/reports/components/funnel-analytics.tsx` (nuevo)

**Gráfico principal:** `FunnelChart` (nuevo, ver 3.1)

Muestra cada etapa del pipeline con:
- Ancho proporcional a `count` o `value`
- Tasa de conversión entre etapas
- Tiempo promedio en etapa
- Color codificado: verde → amarillo → rojo según conversión

**Métricas adicionales:**
- `lostContacts` (en etapas "Caído"/"Caida"/"Cuenta vacía") con valor perdido
- `overallConversionRate` (primera etapa → última)

### 2.3 Goal Performance

**Archivo:** `src/app/reports/components/goal-performance.tsx` (nuevo)

- **Barras de progreso por tipo de objetivo** (new_aum, new_clients, meetings, revenue)
- Cada barra: `currentValue / targetValue`, código de color:
  - Verde: ≥ 75%
  - Amarillo: 50-74%
  - Rojo: < 50%
- **Pacing Index**: `(currentValue/targetValue) / (daysElapsed/totalDays)` — si < 1, está atrasado
- **Resumen:** goals activos, completados, en riesgo

### 2.4 Pipeline Insights

**Archivo:** `src/app/reports/components/pipeline-insights.tsx` (nuevo)

- **Revenue Forecast Waterfall:**
  - Closed Won (periodo actual)
  - Weighted Pipeline (best case)
  - Expected Close (probability-adjusted, most likely)
- **Stage Velocity:** avg días en cada etapa + bottleneck (etapa más lenta)
- **Stage Distribution:** bar chart con count + value por etapa

### 2.5 Contacts Insights

**Archivo:** `src/app/reports/components/contacts-insights.tsx` (nuevo)

- **Lead Score Gauge:** distribución horizontal (Cold/Warm/Hot/Scorching)
- **Score Effectiveness:** `highScoreAvgValue / lowScoreAvgValue` — lift ratio
- **Contacts at Risk List:** tabla con:
  - Contact name
  - Days since activity
  - Assigned advisor
  - Risk score badge (calculado: `daysInactive * 2 + (unassigned ? 20 : 0)`)
- **By Source:** pie chart con avg lead score por fuente
- **By Segment:** bar chart con count + value

### 2.6 Advisor Performance

**Archivo:** `src/app/reports/components/advisor-performance.tsx` (nuevo)

- **AdvisorsTable:** tabla ordenable con:
  - Rank (badge #1, #2, ...)
  - Nombre
  - Contacts asignados
  - Pipeline Value
  - Deals cerrados
  - Revenue
  - Goal Attainment %
  - Composite Score (ranking ponderado)
- **Comparisons:** mejor performer, más mejorado, necesita atención
- Inline bar charts en cada celda

### 2.7 Activity Overview

**Archivo:** `src/app/reports/components/activity-overview.tsx` (nuevo)

- **Tasks:** completadas, pendientes, vencidas, tasa de completitud
- **Meetings:** total en periodo vs objetivo
- **Activity Trend:** line chart semana a semana
- **Alerts:** si overdueTasks > 0, mostrar banner rojo con count

### 2.8 Time Trends

**Archivo:** `src/app/reports/components/time-trends.tsx` (nuevo)

- **MultiLineChart:** overlay de periodo actual vs anterior
  - Contacts creados
  - Revenue
  - Activity (tasks completadas + meetings)
- **Cumulative Revenue:** area chart con running total
- Selector de métrica (contacts / revenue / activity)

---

## Fase 3: Nuevos Componentes de Gráficos

### 3.1 FunnelChart

**Archivos:**
- `src/components/charts/lazy-funnel-chart.tsx` (wrapper)
- `src/components/charts/funnel-chart-impl.tsx` (implementación)

Usa Recharts `BarChart` con `layout="vertical"` y formas personalizadas para simular embudo. Cada barra es un trapezoide.

```tsx
interface FunnelChartProps {
  data: FunnelStage[];           // de funnel.stages
  height?: number;
  showConversionRate?: boolean;  // default true
  metric?: "count" | "value";    // qué mostrar
}
```

### 3.2 AreaChart / MultiLineChart

**Archivos:**
- `src/components/charts/lazy-area-chart.tsx`
- `src/components/charts/area-chart-impl.tsx`

Usa Recharts `AreaChart` con gradient fill. Support para múltiples dataKeys (periodo actual + anterior).

```tsx
interface AreaChartProps {
  data: Array<{ label: string; [key: string]: number | string }>;
  dataKeys: Array<{ key: string; name: string; color: string; dashed?: boolean }>;
  height?: number;
  showCumulative?: boolean;
  showComparison?: boolean;      // overlay periodo anterior
}
```

### 3.3 GoalProgressRing

**Archivos:**
- `src/components/charts/lazy-goal-progress-ring.tsx`
- `src/components/charts/goal-progress-ring-impl.tsx`

Donut chart con valor central. Para health score y goal progress individuales.

```tsx
interface GoalProgressRingProps {
  value: number;         // 0-100
  size?: number;         // default 120
  strokeWidth?: number;  // default 12
  color?: string;        // default violet-500
  label?: string;        // texto bajo el número
}
```

---

## Fase 4: Detalles de Implementación

### 4.1 API Route Completo

```typescript
// src/app/api/reports/analytics/route.ts
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const period = searchParams.get('period') || 'month';
  const include = searchParams.get('include')?.split(',') || ALL_SECTIONS;

  // Calcular rango de fechas según periodo
  const { start, end } = getDateRange(period);
  const { start: prevStart, end: prevEnd } = getPreviousPeriodRange(start, end);

  // Queries en paralelo
  const [funnel, goals, activity, advisor, pipeline, contacts, trends] =
    await Promise.all([
      include.includes('funnel') ? computeFunnel(orgId, start, end, prevStart) : null,
      include.includes('goals') ? computeGoals(orgId, start, end) : null,
      include.includes('activity') ? computeActivity(orgId, start, end, prevStart) : null,
      include.includes('advisor') ? computeAdvisor(orgId, start, end) : null,
      include.includes('pipeline') ? computePipeline(orgId, start, end) : null,
      include.includes('contacts') ? computeContacts(orgId, start, end) : null,
      include.includes('trends') ? computeTrends(orgId, start, end, prevStart) : null,
    ]);

  return Response.json({ generatedAt: new Date().toISOString(), ... });
}
```

### 4.2 Health Score Calculation

```typescript
function calculateHealthScore(metrics: ExecutiveMetrics): number {
  const winRateScore = metrics.winRate / 100;
  const goalProgressScore = metrics.avgGoalProgress / 100;
  const activityScore = metrics.overdueTasks === 0 ? 1 :
    Math.max(0, 1 - (metrics.overdueTasks / metrics.totalTasks * 2));
  const pipelineHealth = metrics.staleContacts === 0 ? 1 :
    Math.max(0, 1 - (metrics.staleContacts / metrics.totalContacts));

  return Math.round(
    (winRateScore * 0.25 +
     goalProgressScore * 0.25 +
     activityScore * 0.25 +
     pipelineHealth * 0.25) * 100
  );
}
```

### 4.3 Lead Scoring Effectiveness

```typescript
// En computeContacts()
const highScoreContacts = contacts.filter(c => c.leadScore >= 20);
const lowScoreContacts = contacts.filter(c => c.leadScore < 10);

const highScoreAvgValue = avg(highScoreContacts.map(c => totalTagValue(c)));
const lowScoreAvgValue = avg(lowScoreContacts.map(c => totalTagValue(c)));

const scoreEffectiveness = {
  highScoreAvgValue,
  lowScoreAvgValue,
  lift: lowScoreAvgValue > 0 ? highScoreAvgValue / lowScoreAvgValue : 0,
};
```

### 4.4 Risk Score por Contact

```typescript
function calculateRiskScore(contact: Contact): number {
  const daysInactive = daysSince(contact.updatedAt);
  const score = daysInactive * 2;  // 2 puntos por día inactivo

  if (!contact.assignedTo) score += 20;   // no asignado = +20
  if (contact.leadScore < 5) score += 10; // lead score bajo = +10
  if (contact.urgencyLevel === 'low') score += 5;

  return score;
}
```

---

## Orden de Implementación

| # | Tarea | Dificultad | Impacto | Archivos |
|---|-------|-------------|---------|----------|
| 1 | Tipos TypeScript (`analytics.ts`) | Baja | Foundation | 1 archivo nuevo |
| 2 | API endpoint centralizado | Alta | Alto | 1 archivo nuevo |
| 3 | Reescribir `page.tsx` orchestrator | Media | Alto | 1 archivo modificado |
| 4 | `executive-summary.tsx` | Media | Alto | 1 archivo nuevo |
| 5 | `GoalProgressRing` chart | Media | Medio | 2 archivos nuevos |
| 6 | `funnel-analytics.tsx` + `FunnelChart` | Alta | Alto | 4 archivos nuevos |
| 7 | `goal-performance.tsx` | Media | Medio | 1 archivo nuevo |
| 8 | `pipeline-insights.tsx` | Alta | Alto | 1 archivo nuevo |
| 9 | `contacts-insights.tsx` | Media | Alto | 1 archivo nuevo |
| 10 | `LeadScoreGauge` chart | Media | Medio | 2 archivos nuevos |
| 11 | `advisor-performance.tsx` + `AdvisorsTable` | Alta | Alto | 3 archivos nuevos |
| 12 | `activity-overview.tsx` | Baja | Medio | 1 archivo nuevo |
| 13 | `time-trends.tsx` + `AreaChart` | Media | Alto | 4 archivos nuevos |
| 14 | Export CSV endpoint (`/api/reports/export`) | Media | Medio | 1 archivo nuevo |

---

## Métricas Clave Implementadas

| Categoría | Métrica | Valor para el Usuario |
|-----------|---------|----------------------|
| **Executive** | Health Score (0-100) | "En general, ¿cómo está mi negocio?" |
| **Executive** | Weighted Pipeline | Valor real considerando probabilidad |
| **Executive** | Revenue Forecast | "¿Cuánto voy a cerrar?" |
| **Funnel** | Stage Conversion Rates | "¿Qué etapa está perdiendo contactos?" |
| **Funnel** | Avg Time in Stage | "¿Dónde se estancan los deals?" |
| **Funnel** | Lost Contacts Value | "¿Cuánto dinero perdí en contactos caídos?" |
| **Goals** | Pacing Index | "¿Voy al ritmo correcto para cumplir?" |
| **Goals** | At-Risk Goals | "¿Qué objetivos no voy a cumplir?" |
| **Pipeline** | Weighted Win Rate | "¿Cuánto valen realmente mis deals?" |
| **Pipeline** | Bottleneck Stage | "¿Qué etapa es el atasco?" |
| **Contacts** | Lead Score Distribution | "¿Tengo leads de calidad?" |
| **Contacts** | Score Effectiveness (lift) | "¿Mi lead scoring funciona?" |
| **Contacts** | Risk Score per Contact | "¿Qué contacto necesita atención inmediata?" |
| **Advisor** | Composite Ranking | "¿Quién está rindiendo mejor/peor?" |
| **Activity** | Overdue Tasks Alert | "¿Qué tareas vencidas tengo?" |
| **Activity** | Meeting vs Goal | "¿Estoy haciendo las reuniones que debería?" |

---

## Verificación Post-Implementación

- [ ] El dashboard carga en < 2 segundos con datos reales
- [ ] Todas las métricas muestran valores (no "no hay datos")
- [ ] Period selector cambia todos los gráficos
- [ ] Health Score se calcula y muestra correctamente
- [ ] Contacts at Risk muestra lista priorizada
- [ ] Funnel muestra tasas de conversión entre etapas
- [ ] Goal pacing index identifica metas atrasadas
- [ ] Export CSV incluye todas las métricas nuevas
- [ ] No hay errores TypeScript
- [ ] No hay `console.log` en código de producción
