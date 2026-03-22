# AUM Advisor Mapping

## Mapeo de Cuentas a Advisors

El sistema de AUM utiliza una tabla `advisor_account_mapping` para asociar cuentas financieras con advisors. Durante el procesamiento de archivos AUM, antes de realizar el matching de advisors, se aplica este mapping para:

1. **Obtener el `advisorRaw`** original del archivo asociado a la cuenta
2. **Recuperar el `matchedUserId`** si ya existe un match automático confirmado

### Flujo de Aplicacion

```
applyAdvisorAccountMapping(accountNumber)
├── Busca en advisor_account_mapping por accountNumber
├── Si encuentra registro:
│   └── Retorna { advisorRaw, matchedUserId }
└── Si no encuentra:
    └── Retorna { advisorRaw: null, matchedUserId: null }
```

## Fuentes del Mapping

### Tabla `advisor_account_mapping`

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `accountNumber` | text | Numero de cuenta unico (normalizado) |
| `advisorName` | text | Nombre original del asesor del archivo |
| `advisorRaw` | text | Nombre normalizado para matching |
| `matchedUserId` | uuid | User ID si se matcheo automaticamente |
| `createdAt` | timestamp | Fecha de creacion |
| `updatedAt` | timestamp | Fecha de ultima actualizacion |

### Tabla `advisor_aliases` (referencia para auto-match)

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `aliasRaw` | text | Alias original del advisor |
| `aliasNormalized` | text | Alias normalizado para matching |
| `userId` | uuid | Usuario al que corresponde el alias |

### Proceso de Carga (admin/upload)

1. Se parsea archivo con datos de mapeo (cuenta + advisor)
2. Por cada fila:
   - Normaliza el `accountNumber`
   - Normaliza el `advisorName` -> `advisorRaw`
   - Busca si existe mapping previo
   - **Intenta auto-match**: busca en `advisor_aliases` por `aliasNormalized === advisorRaw`
   - Si existe alias, obtiene `matchedUserId`
   - Inserta o actualiza el mapping

## Fallbacks

### Cuando no hay match en `advisor_account_mapping`

- `advisorRaw` retorna `null`
- `matchedUserId` retorna `null`
- El sistema debe usar metodos alternativos de matching (nombre, email, ID externo del archivo AUM)

### Cuando no hay match en `advisor_aliases`

- `matchedUserId` permanece como `null` en el mapping
- Se puede crear el alias manualmente via admin

### Logging

Los errores en el mapping se registran con nivel `warn` pero no rompen el proceso:

```typescript
logger.warn({ err: error, accountNumber }, 'Error applying advisor mapping');
```

### Indices de Optimizacion

- `advisor_account_mapping_account_unique`: UNIQUE index en `accountNumber`
- `idx_advisor_account_mapping_account`: INDEX en `accountNumber` para busquedas rapidas
