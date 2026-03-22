# Admin Settings

## AUM Settings

### Advisor Account Mappings

Gestiona el mapeo entre cuentas de inversión y asesores.

**Tablas relacionadas:**
- `advisorAccountMapping` - Mapeo de número de cuenta a nombre de asesor
- `advisorAliases` - Alias normalizados de asesores

**Endpoints:**

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/admin/aum/advisor-mapping/upload` | Upload de archivo CSV/XLSX con mapeos advisor-cuenta |

**Esquema del archivo de upload:**
```csv
accountNumber,advisorName
1234567890,Maria Garcia
0987654321,Juan Perez
```

**Flujo de procesamiento:**
1. Se parsea el archivo (CSV o XLSX)
2. Por cada fila, se normaliza el número de cuenta
3. Se busca coincidencia automática con `advisorAliases` usando `aliasNormalized`
4. Se inserta o actualiza el registro en `advisorAccountMapping`

**Campos del mapping:**
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `accountNumber` | string | Número de cuenta normalizado |
| `advisorName` | string | Nombre raw del asesor |
| `advisorRaw` | string | Alias normalizado |
| `matchedUserId` | uuid | ID del usuario matched en `advisorAliases` |
| `createdAt` | timestamp | Fecha de creación |
| `updatedAt` | timestamp | Fecha de última actualización |

---

### Advisor Aliases (Settings)

CRUD para gestión de alias de asesores.

**Base URL:** `/v1/admin/settings/advisors`

**Endpoints:**

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/aliases` | Lista todos los aliases |
| POST | `/aliases` | Crea un nuevo alias |
| PUT | `/aliases/:id` | Actualiza un alias existente |
| DELETE | `/aliases/:id` | Elimina un alias |

**Esquemas Zod:**

```typescript
// Create
{
  alias: string;      // min 1, max 200
  userId: uuid;
}

// Update
{
  alias?: string;     // min 1, max 200
  userId?: uuid;
}
```

**Respuesta GET:**
```json
{
  "ok": true,
  "aliases": [
    {
      "id": "uuid",
      "aliasRaw": "Maria Garcia",
      "aliasNormalized": "maria garcia",
      "userId": "uuid",
      "createdAt": "2026-03-19T..."
    }
  ]
}
```

**Validaciones:**
- Advisors solo pueden ver/modificar sus propios aliases
- Managers y admins tienen acceso irrestricto
- No se permiten aliases duplicados (`aliasNormalized` unique)
- El usuario asociado debe existir y estar activo

---

## Settings de Organización

> **Nota:** La configuración general de organización (nombre, logo, timezone, etc.) se gestiona a través de variables de entorno y configuración de Vercel. No existe un endpoint admin dedicado para organización en esta versión.

### Variables de entorno relacionadas
```bash
ORGANIZATION_NAME=MaatWork
DEFAULT_TIMEZONE=America/Argentina/Buenos_Aires
```

---

## Integrations

### Bloomberg Integration

**Archivo:** `apps/api/src/routes/bloomberg.ts`

Provee sincronización de datos de mercado y portfolios via Bloomberg API.

**Endpoints:**

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/bloomberg/portfolio/:id` | Obtiene datos de portfolio |
| POST | `/bloomberg/sync` | Fuerza sincronización |

**Configuración:**
```typescript
// apps/api/src/config/bloomberg.ts
{
  apiKey: process.env.BLOOMBERG_API_KEY,
  baseUrl: 'https://api.bloomberg.com',
  cache: {
    portfolioTTL: 300,    // 5 minutos
    marketDataTTL: 60     // 1 minuto
  }
}
```

**Tablas relacionadas:**
- `portfolio` - Portfolios sincronizados
- `aum_snapshots` - Snapshots de AUM

---

### Google Calendar Integration

**Archivo:** `apps/api/src/routes/calendar/`

Permite sync bidireccional con Google Calendar.

**Endpoints:**

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/calendar/events` | Lista eventos |
| POST | `/calendar/events` | Crea evento |
| PUT | `/calendar/events/:id` | Actualiza evento |
| DELETE | `/calendar/events/:id` | Elimina evento |
| POST | `/calendar/sync` | Sincroniza con Google |

**Scopes requeridos:**
- `https://www.googleapis.com/auth/calendar`
- `https://www.googleapis.com/auth/calendar.events`

---

## Variables de Configuración

### AUM Limits
**Archivo:** `apps/api/src/config/aum-limits.ts`

```typescript
{
  MAX_FILE_SIZE: 10 * 1024 * 1024,  // 10MB
  BATCH_SIZE: 1000,                   // Registros por batch
  SUPPORTED_FORMATS: ['csv', 'xlsx']
}
```

### Upload Configuration
**Archivo:** `apps/api/src/utils/file/file-upload.ts`

```typescript
{
  DEFAULT_UPLOAD_DIR: process.env.UPLOAD_DIR || '/tmp/uploads',
  MAX_FILE_SIZE: AUM_LIMITS.MAX_FILE_SIZE
}
```
