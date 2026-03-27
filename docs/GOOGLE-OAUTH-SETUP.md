# Google OAuth + Calendar Sync — Setup Guide

## Índice

1. [Google Cloud Console Setup](#1-google-cloud-console-setup)
2. [Configuración de Variables de Entorno](#2-configuración-de-variables-de-entorno)
3. [Verificación de la App](#3-verificación-de-la-app)
4. [Implementación — Visión General](#4-implementación--visión-general)
5. [Modelos de Base de Datos](#5-modelos-de-base-de-datos)
6. [Flujo de Sincronización](#6-flujo-de-sincronización)
7. [Seguridad](#7-seguridad)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Google Cloud Console Setup

### 1.1 Crear Proyecto y Habilitar APIs

1. Ir a [console.cloud.google.com](https://console.cloud.google.com)
2. Crear proyecto nuevo o seleccionar existente
3. Ir a **APIs y Servicios > Biblioteca**
4. Habilitar:
   - `Google Calendar API`
   - `Google+ API` (OAuth consent)

### 1.2 Configurar OAuth Consent Screen

Ir a **APIs y Servicios > Pantalla de consentimiento OAuth**

**Configuración:**

| Campo | Valor |
|-------|-------|
| Tipo de app | Externo |
| Nombre | MaatWork CRM |
| Email de soporte | tu@email.com |
| Logo | Opcional (300x300px) |

**Scopes agregados:**

```
https://www.googleapis.com/auth/calendar
https://www.googleapis.com/auth/userinfo.email
https://www.googleapis.com/auth/userinfo.profile
openid
```

**Dominios autorizados:**

```
crm.maat.work
maat.work
```

### 1.3 Crear Credenciales OAuth 2.0

Ir a **APIs y Servicios > Credenciales > Crear Credenciales > ID de cliente OAuth**

- **Tipo**: Aplicación web
- **Nombre**: MaatWork CRM Web
- **URIs de redireccionamiento autorizados**:
  ```
  https://crm.maat.work/api/auth/callback/google
  https://localhost:3000/api/auth/callback/google  (desarrollo local)
  ```

**Copiar Client ID y Client Secret** — se usan en las variables de entorno.

### 1.4 Usuarios de Prueba (Evitar Advertencia)

Si la app no está verificada por Google, agregá cuentas de prueba:

**APIs y Servicios > Pantalla de consentimiento OAuth > Usuarios de prueba**

Agregar emails de las personas que van a usar el login con Google:
- Tu cuenta personal
- Cuentas de testers

这些 cuentas NO verán la advertencia "app no verificada".

---

## 2. Configuración de Variables de Entorno

### Variables Requeridas

```env
# Google OAuth
GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu-client-secret

# NextAuth (requerido)
NEXTAUTH_URL=https://crm.maat.work
NEXTAUTH_SECRET=<openssl rand -base64 32>
NEXTAUTH_TRUST_HOST=true

# CRON para sync de calendarios
CRON_SECRET=<openssl rand -base64 32>

# Webhook de Google Calendar
CALENDAR_WEBHOOK_VERIFY_TOKEN=<openssl rand -hex 32>
```

### Generar Secrets

```bash
# NEXTAUTH_SECRET y CRON_SECRET
openssl rand -base64 32

# CALENDAR_WEBHOOK_VERIFY_TOKEN
openssl rand -hex 32
```

### Valores Actuales en Producción

```
GOOGLE_CLIENT_ID=YOUR_CLIENT_ID.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=YOUR_CLIENT_SECRET
NEXTAUTH_URL=https://crm.maat.work
NEXTAUTH_SECRET=YOUR_NEXTAUTH_SECRET
NEXTAUTH_TRUST_HOST=true
CRON_SECRET=YOUR_CRON_SECRET
CALENDAR_WEBHOOK_VERIFY_TOKEN=YOUR_WEBHOOK_VERIFY_TOKEN
```

---

## 3. Verificación de la App

### Estado "Modo de Prueba" (Desarrollo)

- La app está en "Modo de prueba" por defecto
- **Limitación**: Máximo 100 usuarios de prueba
- **Beneficio**: No requiere verificación oficial de Google
- **Advertencia**: Los usuarios NO en la lista de prueba SÍ la ven

### Publicar App (Producción)

Para quitar la advertencia para TODOS los usuarios:

1. Completar la pantalla de consentimiento (logo, política de privacidad, etc.)
2. Enviar a revisión de Google
3. Google tarda **1-4 semanas** en verificar

**Scopes敏感的 (requieren verificación):**
- `https://www.googleapis.com/auth/calendar` — sí requiere verificación

**Alternativa**: Mantener modo de prueba con lista de usuarios de prueba.

---

## 4. Implementación — Visión General

### Archivos Clave

```
src/
├── lib/
│   ├── auth.ts                    # NextAuth config (Google OAuth + Credentials)
│   ├── auth-context.tsx           # Auth context (cliente)
│   ├── auth-helpers.ts            # Helpers server-side
│   ├── crypto.ts                  # AES-256-GCM encryption para tokens
│   └── google-calendar/
│       ├── sync-engine.ts        # Motor de sync bidireccional
│       └── event-mapper.ts       # Conversión de eventos Google ↔ Local
├── app/
│   ├── api/auth/[...nextauth]/   # Handler NextAuth
│   ├── api/auth/session/         # GET session (tokens NO expuestos)
│   ├── api/calendar/
│   │   ├── sync/                 # POST trigger manual sync
│   │   ├── connect/              # POST iniciar conexión
│   │   ├── disconnect/           # POST desconectar
│   │   └── status/               # GET estado de conexión
│   ├── api/cron/sync-calendars/ # GET cron cada 15 min
│   └── api/webhooks/google-calendar/  # POST webhook de Google
├── proxy.ts                      # Route protection (Next.js 16)
└── types/next-auth.d.ts          # Tipos TypeScript
```

### Flujo OAuth

```
1. Usuario clickea "Continuar con Google"
   ↓
2. NextAuth → Google OAuth (PKCE + state validation)
   ↓
3. Google redirect a /api/auth/callback/google
   → NextAuth busca Account con providerAccountId de Google
   ├── Existe → sign in normal
   └── No existe → busca User con mismo email
       ├── Existe → link automático (Account + User)
       └── No existe → crea User + Account (registro)
   ↓
4. NextAuth genera JWE (JSON Web Encryption) con NEXTAUTH_SECRET
5. JWE almacenado en cookie __Secure-next-auth.session-token
6. Session callback retorna: id, email, name, linkedProviders
   (tokens NUNCA expuestos al cliente)
```

---

## 5. Modelos de Base de Datos

### Account (OAuth)

```prisma
model Account {
  id                   String   @id @default(cuid())
  userId               String
  providerType         String   // "oauth"
  providerId           String   // "google"
  providerAccountId    String   // sub de Google OAuth
  access_token         String?  @db.Text  // encriptado en JWT
  refresh_token        String?  @db.Text
  expires_at           Int?
  token_type           String?
  scope                String?
  id_token             String?  @db.Text

  @@unique([providerId, providerAccountId])
  @@unique([userId, providerId])
}
```

### CalendarSyncState

```prisma
model CalendarSyncState {
  id           String   @id @default(cuid())
  userId       String
  calendarId   String   @default("primary")
  syncToken    String?  // Google nextSyncToken (opaco)
  lastSyncedAt DateTime?
  syncStatus   String   @default("idle")  // idle | syncing | error
  errorCount   Int      @default(0)

  @@unique([userId, calendarId])
}
```

### CalendarWebhook

```prisma
model CalendarWebhook {
  id          String   @id @default(cuid())
  userId      String
  calendarId  String
  channelId   String
  expiration  DateTime
  isActive    Boolean  @default(true)

  @@unique([userId, calendarId])
}
```

### CalendarEvent (extendido)

```prisma
model CalendarEvent {
  // ... campos existentes ...
  googleEventId    String?   @unique
  googleEtag       String?
  recurrenceRule   String?   // RRULE
  attendees        String?   // JSON
  reminders        String?
  colorId          String?
  status           String?   // confirmed | tentative | cancelled
  syncDirection    String?   // inbound | outbound
  source           String    @default("local")  // google | local
}
```

---

## 6. Flujo de Sincronización

### Initial Sync (Primera vez)

```
1. Usuario conecta Google Calendar en settings
2. POST /api/calendar/connect
3. registerCalendarWatch() → crea webhook channel en Google
4. CalendarSyncState creado con syncToken=null
5. initialSync():
   - GET calendar.events.list (sin syncToken)
   - Pagina todos los eventos (max 250/página)
   - upsert batch en transacción única
   - Almacena nextSyncToken en CalendarSyncState
6. Listo para delta sync
```

### Delta Sync (Cada 15 min via CRON)

```
1. GET /api/cron/sync-calendars (Vercel Cron)
   - Header x-cron-secret para autenticación
2. Busca CalendarSyncState con syncStatus idle/error
3. deltaSync():
   - Usa syncToken almacenado → Google retorna SOLO cambios
   - Pagina resultados
   - batch upsert/delete
   - Actualiza nextSyncToken
4. Si syncToken expiró (410) → re-run initialSync
```

### Webhook (Tiempo Real)

```
1. Google detecta cambio en calendario
2. POST /api/webhooks/google-calendar
3. Verifica x-goog-resource-state:
   - "exists" → deltaSync()
   - "not_exists" / "deleted" → deactivate webhook
4. Responde 200 OK rápido (sync es async)
```

### Conflict Resolution

- **Estrategia**: Last-write-wins
- **Comparación**: `updatedAt` local vs `updated` de Google
- **Resultado**: La versión más nueva gana

### Push Local → Google (Usuario crea/edita evento)

```
1. Usuario crea evento en CRM
2. POST /api/calendar/events
3. Si googleEventId existe → PATCH /calendar.events.patch
   Si no → POST /calendar.events.insert
4. Actualiza googleEventId y googleEtag en CalendarEvent
```

---

## 7. Seguridad

### Tokens Nunca Expuestos al Cliente

```
✅auth.ts session callback:
   - NO pone googleAccessToken en session
   - linkedProviders sí se expone

✅/api/auth/session:
   - NO retorna googleAccessToken
   - Retorna: id, email, name, image, linkedProviders

✅Tokens almacenados:
   - En JWE (cookie): encriptados por NextAuth con NEXTAUTH_SECRET
   - En db.account: texto plano (PrismaAdapter los necesita para refresh)
```

### Encriptación JWE (NextAuth)

NextAuth usa JWE (JSON Web Encryption) en lugar de JWT simple:
- `alg: dir` (direct encryption)
- `enc: A256GCM` (AES-256-GCM)
- La encriptación/desencriptación la maneja NextAuth internamente
- No requiere TOKEN_ENCRYPTION_KEY separado

### Cron Secret

```typescript
// middleware.ts / proxy.ts
if (pathname.startsWith('/api/cron/')) {
  const cronSecret = request.headers.get('x-cron-secret');
  if (cronSecret !== process.env.CRON_SECRET) {
    return 401 Unauthorized;
  }
}
```

### Webhook Verification

```typescript
// GET /api/webhooks/google-calendar?hub.verify_token=...
if (token !== process.env.CALENDAR_WEBHOOK_VERIFY_TOKEN) {
  return 403;
}
```

---

## 8. Troubleshooting

### "App no verificada" en login

**Solución**: Agregar email del usuario en **Usuarios de prueba** en Google Cloud Console.

### Error: `checks.state argument is missing`

**Causa**: Usaste `checks: []` en GoogleProvider
**Solución**: NO usar `checks: []` - NextAuth maneja state y PKCE automáticamente

### Login con Google no funciona (silent fail, redirige a /login)

1. Verificar `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` en variables de entorno de Vercel
2. Verificar `NEXTAUTH_URL=https://crm.maat.work` en producción
3. Verificar `NEXTAUTH_TRUST_HOST=true` está configurado
4. Verificar `GOOGLE_REDIRECT_URI` en Google Cloud Console = `https://crm.maat.work/api/auth/callback/google`
5. Revisar logs de Vercel: `vercel logs crm.maat.work`

### Sincronización no happen

1. Verificar que `CalendarSyncState` existe para el usuario:
   ```sql
   SELECT * FROM "CalendarSyncState" WHERE "userId" = 'tu-user-id';
   ```
2. Verificar que `Account` con `providerId = 'google'` existe:
   ```sql
   SELECT * FROM "Account" WHERE "userId" = 'tu-user-id' AND "providerId" = 'google';
   ```
3. Revisar logs de Vercel para errores en `/api/cron/sync-calendars`
4. Revisar logs de `/api/webhooks/google-calendar`

### syncToken expira

Los `syncToken` de Google expiran después de ~30 días sin uso. El código maneja esto automáticamente:
- Si `deltaSync` recibe error 410 → limpia `syncToken` → re-run `initialSync`

### Webhook no llega

1. Verificar que el webhook está activo en `CalendarWebhook`
2. Verificar que la URL del webhook es accesible públicamente
3. Google requiere HTTPS; localhost no funciona para webhooks

### Eventos duplicados

Si hay eventos duplicados, puede ser que:
- El `googleEventId` no se guardó correctamente
- Se hizo sync sin `syncToken` (fallback a time-based)
- Ejecutar `initialSync` manualmente para limpiar

### Deploy a Vercel

```bash
# 1. Configurar dominio
vercel domains add crm.maat.work
vercel certs issue crm.maat.work

# 2. Subir variables de entorno
vercel env add GOOGLE_CLIENT_ID
vercel env add GOOGLE_CLIENT_SECRET
# ... todas las variables del .env.local

# 3. Deploy
vercel --prod
```

---

## Checklists

### Setup Inicial

- [ ] Google Cloud Console: Proyecto creado
- [ ] Google Calendar API habilitada
- [ ] OAuth Consent configurado
- [ ] Credenciales OAuth creadas
- [ ] Dominios autorizados configurados
- [ ] Variables de entorno en `.env.local`
- [ ] `npx prisma db push` ejecutado
- [ ] Build exitoso (`npm run build`)

### Verificación OAuth

- [x] Login con Google funciona en desarrollo (`localhost:3000/login`)
- [x] Login con Google funciona en producción (`crm.maat.work/login`) ✅
- [ ] Cuenta Google aparece en `db.account`
- [ ] Settings > Connected Accounts muestra Google como vinculado

### Verificación Calendar Sync

- [ ] Settings > Google Calendar muestra estado conectado
- [ ] `CalendarSyncState` tiene `syncToken` no nulo después de initial sync
- [ ] CRON se ejecuta cada 15 min sin errores
- [ ] Eventos de Google aparecen en `/calendar`
- [ ] Eventos creados en CRM aparecen en Google Calendar
