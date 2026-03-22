# Analytics Endpoints

## Dashboard KPIs

### GET /analytics/dashboard

KPIs de un vistazo segun el rol del usuario. Respuesta cacheada por 5 minutos.

**Autenticacion:** Requiere usuario autenticado.

**Roles permitidos:** `advisor`, `manager`, `admin`, `owner`, `staff`

**Respuesta (Charts Data):**

```json
{
  "success": true,
  "data": {
    "role": "advisor",
    "kpis": {
      "totalAum": 1500000,
      "clientsWithPortfolio": 45,
      "deviationAlerts": 3
    },
    "aumTrend": [
      { "date": "2026-02-18", "value": 1450000 },
      { "date": "2026-02-19", "value": 1460000 }
    ]
  },
  "cached": false
}
```

**KPIs por rol:**

| Rol | KPIs |
|-----|------|
| `advisor` | `totalAum`, `clientsWithPortfolio`, `deviationAlerts`, `aumTrend` |
| `manager` | `teamAum`, `riskDistribution` (arreglo de `{riskLevel, count}`), `topClients` (arreglo de `{contactId, contactName, aum}`) |
| `admin` | `globalAum`, `activeTemplates`, `clientsWithoutPortfolio`, `instrumentsWithoutPrice` |
| `owner` | `globalAum`, `totalTeams`, `totalAdvisors`, `totalClients`, `riskDistribution`, `aumTrend` |
| `staff` | `globalAum`, `totalClients`, `clientsWithoutPortfolio`, `activeTemplates`, `aumTrend` |

---

## Metricas

### GET /analytics/metrics

Catalogo de metricas disponibles para calculos de rendimiento.

**Autenticacion:** Requiere usuario autenticado.

**Roles permitidos:** `advisor`, `manager`, `admin`

**Respuesta (Raw Data):**

```json
{
  "success": true,
  "data": [
    {
      "code": "twr",
      "name": "Time-Weighted Return",
      "description": "Retorno ponderado por tiempo, elimina el efecto de flujos de caja",
      "unit": "%",
      "category": "performance"
    },
    {
      "code": "sharpe",
      "name": "Sharpe Ratio",
      "description": "Retorno excedente por unidad de riesgo (volatilidad)",
      "unit": "ratio",
      "category": "risk"
    }
  ]
}
```

**Categorias de metricas:**

| Categoria | Codigos disponibles |
|-----------|---------------------|
| `performance` | `twr` |
| `risk` | `sharpe`, `volatility`, `drawdown` |
| `benchmark` | `alpha`, `beta`, `te`, `ir` |

---

## Rendimiento

### GET /analytics/performance/:portfolioId

Obtiene el rendimiento de una cartera. Delega calculos al servicio Python (pandas/numpy).

**Autenticacion:** Requiere usuario autenticado.

**Roles permitidos:** `advisor`, `manager`, `admin`

**Parametros de path:**

| Parametro | Tipo | Descripcion |
|-----------|------|------------|
| `portfolioId` | string | ID de la cartera |

**Query parameters:**

| Parametro | Tipo | Default | Valores validos |
|-----------|------|---------|----------------|
| `period` | string | `1Y` | `1M`, `3M`, `6M`, `1Y`, `YTD`, `ALL` |

**Respuesta (Charts Data - Time Series):**

```json
{
  "success": true,
  "data": {
    "portfolioId": "uuid",
    "portfolioName": "Cartera Moderada",
    "period": "1Y",
    "performance": [
      { "date": "2026-01-01", "value": 100 },
      { "date": "2026-01-02", "value": 100.5 }
    ],
    "metrics": {
      "totalReturn": 12.5,
      "annualizedReturn": 11.8,
      "volatility": 8.2,
      "sharpeRatio": 1.4,
      "maxDrawdown": -5.3
    },
    "components": [
      { "symbol": "AAPL", "name": "Apple Inc.", "weight": 0.2 }
    ]
  },
  "timestamp": "2026-03-19T10:00:00.000Z"
}
```

**Errores:**

| Codigo | Descripcion |
|--------|-------------|
| `400` | Periodo invalido |
| `404` | Cartera no encontrada |
| `504` | Timeout del servicio Python |

---

## Comparacion

### POST /analytics/compare

Compara multiples carteras y/o benchmarks. Delega calculos al servicio Python con normalizacion a base 100.

**Autenticacion:** Requiere usuario autenticado.

**Roles permitidos:** `advisor`, `manager`, `admin`

**Body (JSON):**

```json
{
  "portfolioIds": ["uuid1", "uuid2"],
  "benchmarkIds": ["uuid3"],
  "period": "1Y"
}
```

| Campo | Tipo | Requerido | Descripcion |
|-------|------|----------|-------------|
| `portfolioIds` | array[string] | Si (al menos uno) | IDs de carteras a comparar |
| `benchmarkIds` | array[string] | Si (al menos uno) | IDs de benchmarks a comparar |
| `period` | string | No | Default: `1Y`. Valores: `1M`, `3M`, `6M`, `1Y`, `YTD`, `ALL` |

**Respuesta (Charts Data - Multiple Series):**

```json
{
  "success": true,
  "data": {
    "period": "1Y",
    "results": [
      {
        "id": "uuid1",
        "name": "Cartera Moderada",
        "type": "portfolio",
        "performance": [
          { "date": "2026-01-01", "value": 100 },
          { "date": "2026-01-02", "value": 100.5 }
        ],
        "metrics": {
          "totalReturn": 12.5,
          "annualizedReturn": 11.8,
          "volatility": 8.2,
          "sharpeRatio": 1.4,
          "maxDrawdown": -5.3
        }
      },
      {
        "id": "uuid3",
        "name": "S&P 500",
        "type": "benchmark",
        "performance": [
          { "date": "2026-01-01", "value": 100 },
          { "date": "2026-01-02", "value": 100.2 }
        ],
        "metrics": {
          "totalReturn": 10.2,
          "annualizedReturn": 9.8,
          "volatility": 15.1,
          "sharpeRatio": 0.65,
          "maxDrawdown": -8.1
        }
      }
    ],
    "count": 2
  },
  "timestamp": "2026-03-19T10:00:00.000Z"
}
```

**Errores:**

| Codigo | Descripcion |
|--------|-------------|
| `400` | Body invalido o sin carteras/benchmarks |
| `404` | No se encontraron carteras o benchmarks validos |
| `504` | Timeout del servicio Python |

---

## Formato de Respuesta

### Charts Data

Para visualizacion en graficos de linea/area. Incluye series temporales con valores normalizados.

```
GET /analytics/dashboard     -> aumTrend[]
GET /analytics/performance  -> performance[]
GET /analytics/compare      -> results[].performance[]
```

### Raw Data

Para calculos y procesamiento adicional. Estructuras planas con metricas individuales.

```
GET /analytics/metrics       -> Metricas disponibles
GET /analytics/performance   -> metrics{}
GET /analytics/compare      -> results[].metrics{}
```

---

## Ping

### GET /analytics/ping

Verifica que el modulo de analytics esta montado correctamente.

**Respuesta:**

```json
{ "status": "ok", "service": "analytics" }
```
