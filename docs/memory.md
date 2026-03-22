# Admin Memory & Diagnostics

## Endpoints de Diagnóstico

### GET /v1/admin/memory

Endpoint de diagnóstico de memoria con recomendaciones automáticas.

**Autenticación:** Requiere rol `admin`

**Respuesta:**
```json
{
  "memory": {
    "heap": {
      "used": "<bytes>",
      "total": "<bytes>",
      "usedMB": "<string>",
      "totalMB": "<string>",
      "usedPercent": "<string>",
      "maxMB": "384"
    },
    "rss": {
      "bytes": "<bytes>",
      "mb": "<string>",
      "percent": "<string>"
    },
    "external": {
      "bytes": "<bytes>",
      "mb": "<string>"
    }
  },
  "cache": {
    "totalMemoryBytes": "<number>",
    "totalMemoryMB": "<string>",
    "maxMemoryBytes": "<number>",
    "maxMemoryMB": "<string>",
    "usagePercent": "<string>",
    "caches": [
      {
        "name": "<string>",
        "hits": "<number>",
        "misses": "<number>",
        "hitRate": "<string>",
        "keys": "<number>",
        "sizeMB": "<string>",
        "largestValueMB": "<string>"
      }
    ]
  },
  "etagCache": {
    "size": "<number>",
    "maxSize": "<number>",
    "hitRate": "<string>"
  },
  "queries": {
    "totalTracked": "<number>",
    "topByMemory": [
      {
        "operation": "<string>",
        "count": "<number>",
        "avgDuration": "<number>",
        "estimatedMemoryMB": "<string>",
        "p95Duration": "<number>",
        "nPlusOneCount": "<number>"
      }
    ],
    "nPlusOneCount": "<number>",
    "slowQueriesCount": "<number>"
  },
  "recommendations": ["<string>"],
  "timestamp": "<ISO8601>"
}
```

**Recomendaciones generadas automáticamente:**
- Alerta si heap memory > 80%
- Alerta si RSS memory > 80%
- Alerta si cache memory > 80%
- Alerta si hay queries con patrones N+1
- Alerta si hay slow queries (p95 > 1s)

### GET /v1/admin/performance/pool

Estado del pool de conexiones a base de datos.

**Autenticación:** Requiere rol `admin`

**Respuesta:**
```json
{
  "available": true,
  "totalCount": "<number>",
  "idleCount": "<number>",
  "waitingCount": "<number>",
  "activeCount": "<number>",
  "utilization": "<number>",
  "health": "healthy | warning"
}
```

## Query Performance

### GET /v1/admin/query-metrics

Métricas detalladas de queries de base de datos.

**Autenticación:** Requiere rol `admin` o `manager`

**Query params:**
- `threshold` (number, default: 500): Threshold en ms para considerar slow query

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "allMetrics": [<QueryMetric>],
    "slowQueries": [<SlowQuery>],
    "nPlusOneQueries": [<NPlusOneQuery>],
    "cacheHealth": { ... },
    "summary": {
      "totalQueries": "<number>",
      "slowQueriesCount": "<number>",
      "nPlusOneQueriesCount": "<number>",
      "threshold": "<number>"
    }
  }
}
```

### GET /v1/admin/query-analysis

Análisis completo de queries con recomendaciones.

**Autenticación:** Requiere rol `admin` o `manager`

**Query params:**
- `threshold` (number, default: 500): Threshold en ms para slow queries
- `format` (string, optional): Si es `text`, devuelve reporte en texto plano

**Respuesta (JSON):**
```json
{
  "success": true,
  "data": {
    "summary": { ... },
    "slowQueries": [ ... ],
    "nPlusOneQueries": [ ... ],
    "recommendations": [ ... ]
  }
}
```

## Cache Stats

### Métricas de Cache Disponibles

| Cache | TTL | Max Keys | Max Value | Uso |
|-------|-----|----------|-----------|-----|
| `pipeline` | 30 min | 600 | 512 KB | Pipeline stages |
| `instruments` | 1 hour | 300 | 512 KB | Búsqueda de instrumentos |
| `benchmarks` | 1 hour | 80 | 256 KB | Definiciones de benchmarks |
| `lookupTables` | 1 hour | 30 | 64 KB | Tablas de lookup |
| `benchmarkComponents` | 15 min | 120 | 128 KB | Componentes de benchmarks |
| `contactsList` | 3 min | 100 | 512 KB | Listas de contactos por advisor |
| `teamMetrics` | 5 min | 60 | 256 KB | Métricas de equipo |
| `portfolioAssignments` | 15 min | 300 | 512 KB | Asignaciones de portfolio |
| `aumAggregations` | 15 min | 120 | 128 KB | Totales AUM por advisor |
| `pipelineMetrics` | 5 min | 60 | 256 KB | Métricas por etapa |
| `taskStatistics` | 5 min | 150 | 128 KB | Estadísticas de tareas por usuario |
| `dashboardKpis` | 3 min | 100 | 256 KB | KPIs de dashboard |

### GET /v1/admin/memory (sección cache)

Incluye stats detallados de cada cache:

```json
{
  "cache": {
    "totalMemoryBytes": "<number>",
    "totalMemoryMB": "<string>",
    "maxMemoryBytes": "<number>",
    "maxMemoryMB": "<string>",
    "usagePercent": "<string>",
    "caches": [
      {
        "name": "pipeline",
        "hits": 1234,
        "misses": 56,
        "hitRate": "95.66",
        "keys": 45,
        "sizeMB": "2.34",
        "largestValueMB": "0.12"
      }
    ]
  }
}
```

### Prometheus Metrics

Métricas Prometheus disponibles para scraping:

| Métrica | Tipo | Labels | Descripción |
|---------|------|--------|-------------|
| `nodejs_heap_used_bytes` | Gauge | - | Heap usado en bytes |
| `nodejs_heap_total_bytes` | Gauge | - | Heap total en bytes |
| `nodejs_external_memory_bytes` | Gauge | - | Memoria externa en bytes |
| `nodejs_rss_bytes` | Gauge | - | RSS en bytes |
| `cache_size_bytes` | Gauge | `cache_type` | Tamaño estimado del cache |
| `cache_key_count` | Gauge | `cache_type` | Cantidad de keys |
| `cache_hits_total` | Counter | `cache_type` | Total de cache hits |
| `cache_misses_total` | Counter | `cache_type` | Total de cache misses |
| `db_query_duration_seconds` | Histogram | `operation`, `table` | Duración de queries |
| `db_queries_total` | Counter | `operation`, `table` | Total de queries |
| `http_request_duration_seconds` | Histogram | `method`, `route`, `status` | Duración de requests HTTP |
| `active_connections` | Gauge | - | Conexiones activas |
