# Instagram CRM Module

Módulo para integrar Instagram Direct Messages (DM) con MaatWorkCRM usando Instagram Graph API.

## Quick Start

```typescript
import { 
  InstagramClient,
  syncInstagramConversations,
  getInstagramAccountByOrg 
} from "@/server/instagram";
import { getInstagramAccounts, connectInstagramAccount } from "@/server/functions/instagram";
```

## Requisitos Previos

1. **Facebook Developer Account** - developers.facebook.com
2. **Meta Business Account** con Instagram Business
3. **Facebook App** con Instagram product

## Configuración

### Variables de Entorno (.env)

```env
INSTAGRAM_APP_ID=your_facebook_app_id
INSTAGRAM_APP_SECRET=your_facebook_app_secret
INSTAGRAM_REDIRECT_URI=https://your-domain.com/api/instagram/callback
```

### Permisos Requeridos

En Facebook Developer Portal, solicitar:
- `instagram_business_basic`
- `instagram_business_manage_messages`
- `pages_show_list`
- `pages_read_engagement`

---

## Arquitectura

```
server/instagram/
├── client.ts     # API client + sync logic
├── oauth.ts      # OAuth flow handlers
└── index.ts      # Exports
```

---

## API Reference

### InstagramClient

Cliente de bajo nivel para llamar Instagram Graph API.

```typescript
const client = new InstagramClient(accessToken, pageId);
const conversations = await client.getConversations();
const messages = await client.getMessages(conversationId);
```

#### Constructor

```typescript
new InstagramClient(accessToken: string, pageId: string)
```

| Param | Tipo | Descripción |
|-------|------|-------------|
| accessToken | string | Page Access Token de Instagram |
| pageId | string | ID de la página de Facebook |

#### Métodos

##### getConversations()

```typescript
async getConversations(): Promise<InstagramConversation[]>
```

Obtiene todos los hilos de conversación del account.

**Returns:** Array de `InstagramConversation`

```typescript
interface InstagramConversation {
  id: string;                    // IG conversation ID
  participants: {                 // Participantes del hilo
    username: string;
    profile_picture: string;
  }[];
  updated_time: string;           // Timestamp último mensaje
}
```

**Ejemplo:**
```typescript
const convos = await client.getConversations();
convos.forEach(c => console.log(c.id, c.participants[0].username));
```

---

##### getMessages()

```typescript
async getMessages(conversationId: string): Promise<InstagramMessage[]>
```

Obtiene mensajes de una conversación específica.

| Param | Tipo | Descripción |
|-------|------|-------------|
| conversationId | string | ID de la conversación |

**Returns:** Array de `InstagramMessage`

```typescript
interface InstagramMessage {
  id: string;
  from: { username: string; id: string };
  to: { data: { username: string; id: string }[] };
  message: string;
  created_at: number;  // Unix timestamp
}
```

**Ejemplo:**
```typescript
const messages = await client.getMessages("conv_123");
messages.forEach(m => console.log(m.from.username, m.message));
```

---

##### refreshLongLivedToken()

```typescript
async refreshLongLivedToken(appId: string, appSecret: string): Promise<string>
```

Refresca el token a uno de larga duración (60 días).

| Param | Tipo | Descripción |
|-------|------|-------------|
| appId | string | Facebook App ID |
| appSecret | string | Facebook App Secret |

**Returns:** Nuevo access token

---

## Funciones de Alto Nivel

### syncInstagramConversations()

```typescript
syncInstagramConversations(
  accountId: string,
  config?: InstagramConfig
): Promise<{ synced: number; errors: string[] }>
```

Sincroniza conversaciones y mensajes desde Instagram API a la base de datos local.

| Param | Tipo | Descripción |
|-------|------|-------------|
| accountId | string | ID del account en DB |
| config | InstagramConfig | (opcional) Override de config |

**Returns:**
```typescript
{
  synced: number;      // Cantidad de conversaciones sincronizadas
  errors: string[];    // Errores encontrados durante sync
}
```

**Ejemplo:**
```typescript
const result = await syncInstagramConversations("acc_xxx");
console.log(`Sincronizadas ${result.synced} conversaciones`);
```

**Flujo interno:**
1. Obtiene account de DB
2. Verifica si token necesita refresh
3. Llama `getConversations()` de API
4. Por cada conversación:
   - Crea o actualiza en DB
   - Obtiene mensajes
   - Inserta mensajes nuevos
5. Actualiza `lastSyncedAt`

---

### getInstagramAccountByOrg()

```typescript
getInstagramAccountByOrg(orgId: string): Promise<InstagramAccount | undefined>
```

Obtiene la cuenta de Instagram vinculada a una organización.

| Param | Tipo | Descripción |
|-------|------|-------------|
| orgId | string | ID de la organización |

**Returns:** `InstagramAccount` o `undefined`

---

### linkConversationToContact()

```typescript
linkConversationToContact(
  conversationId: string,
  contactId: string
): Promise<void>
```

Vincula una conversación de Instagram a un contacto del CRM.

| Param | Tipo | Descripción |
|-------|------|-------------|
| conversationId | string | ID de la conversación |
| contactId | string | ID del contacto en CRM |

---

## Server Functions (UI)

Estas funciones están diseñadas para ser llamadas desde el frontend.

### getInstagramAccounts

```typescript
getInstagramAccounts(
  orgId: string
): Promise<InstagramAccount[]>
```

Obtiene todas las cuentas de Instagram conectadas.

---

### connectInstagramAccount

```typescript
connectInstagramAccount({
  orgId: string;
  userId: string;
}): Promise<{ authUrl: string }>
```

Genera URL de autorización OAuth.

**Retorna:** `{ authUrl: "https://..." }`

**Flujo:**
1. Genera URL de Facebook con permisos
2. Usuario autoriza
3. Callback intercambia código por token
4. Token guardado en DB

---

### disconnectInstagramAccount

```typescript
disconnectInstagramAccount(
  accountId: string
): Promise<void>
```

Desconecta y desactiva una cuenta.

---

### getInstagramConversations

```typescript
getInstagramConversations(
  accountId: string
): Promise<InstagramConversation[]>
```

Obtiene conversaciones desde DB.

---

### getInstagramMessages

```typescript
getInstagramMessages(
  conversationId: string
): Promise<InstagramMessage[]>
```

Obtiene mensajes de una conversación desde DB.

---

### syncInstagramAccount

```typescript
syncInstagramAccount(
  accountId: string
): Promise<{ synced: number }>
```

Dispara sincronización manual.

---

### getInstagramAccountWithConversations

```typescript
getInstagramAccountWithConversations(
  accountId: string
): Promise<InstagramAccount & { conversations: InstagramConversation[] }>
```

Obtiene account con sus conversaciones.

---

## Esquema de Base de Datos

### instagram_accounts

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | UUID | Primary key |
| organizationId | UUID | FK a organization |
| userId | UUID | Usuario que conectó |
| pageId | string | Facebook Page ID |
| pageName | string | Nombre de la página |
| instagramUserId | string | Instagram user ID |
| accessToken | text | OAuth token |
| accessTokenExpiresAt | timestamp | Expiración token |
| isActive | boolean | Cuenta activa |
| lastSyncedAt | timestamp | Último sync |
| createdAt | timestamp | |
| updatedAt | timestamp | |

### instagram_conversations

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | UUID | Primary key |
| accountId | UUID | FK a instagram_accounts |
| igConversationId | string | ID de IG |
| participantIgId | string | ID del usuario IG |
| participantUsername | string | Username |
| participantProfileUrl | string | URL avatar |
| contactId | UUID | FK a contacts (nullable) |
| lastMessageAt | timestamp | |
| lastMessagePreview | text | Preview último mensaje |
| createdAt | timestamp | |
| updatedAt | timestamp | |

### instagram_messages

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | UUID | Primary key |
| conversationId | UUID | FK a instagram_conversations |
| igMessageId | string | ID de mensaje IG |
| content | text | Texto del mensaje |
| fromIgUserId | string | ID del emisor |
| fromMe | boolean | true si es del negocio |
| timestamp | timestamp | |
| createdAt | timestamp | |

### instagram_message_tags

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | UUID | Primary key |
| messageId | UUID | FK a instagram_messages |
| tag | string | Tag (e.g., "lead", "support") |
| createdAt | timestamp | |

---

## OAuth Flow

### 1. Generar Auth URL

```typescript
import { getInstagramAuthUrl } from "@/server/instagram/oauth";

const url = getInstagramAuthUrl(appId, redirectUri);
// Redirigir usuario a URL
```

### 2. Exchange Code por Token

```typescript
import { completeInstagramOAuth } from "@/server/instagram/oauth";

const account = await completeInstagramOAuth({
  code: "AQxxxxx",        // Code del callback
  orgId: "org_xxx",
  userId: "user_xxx"
});
```

**Flujo interno:**
1. Intercambia code por short-lived token
2. Obtiene long-lived token (60 días)
3. Obtiene Instagram Business Account
4. Obtiene Facebook Page asociada
5. Guarda todo en DB

### 3. Refresh Token

```typescript
import { refreshInstagramToken } from "@/server/instagram/oauth";

const success = await refreshInstagramToken(accountId);
```

**Automatización:** Llamar antes de que expire (>1 día antes).

---

## CLI Script

### Sincronización Manual

```bash
pnpm instagram:sync
```

**Script:** `apps/web/scripts/instagram-sync.ts`

Proceso:
1. Carga todas las cuentas activas
2. Por cada cuenta:
   - Verifica si token necesita refresh
   - Sincroniza conversaciones
   - Actualiza lastSyncedAt

### Cron Job

```bash
# Ejecutar cada 15 minutos
*/15 * * * * cd /path/to/app && pnpm instagram:sync >> /var/log/instagram-sync.log 2>&1
```

---

## Troubleshooting

### Error: "OAuth error" o "Invalid credential"

**Causa:** App ID/Secret incorrectos o token expirado.

**Solución:**
1. Verificar INSTAGRAM_APP_ID y INSTAGRAM_APP_SECRET en .env
2. Llamar `refreshInstagramToken()` para obtener nuevo token

---

### Error: "Permission denied"

**Causa:** Permisos no aprobados en Facebook Developer.

**Solución:**
1. Ir a App Dashboard → Instagram → Permissions
2. Submitir para review con caso de uso
3. O testar con roles de developer/admin

---

### Error: "Page not found"

**Causa:** Instagram Business no vinculada a Facebook Page.

**Solución:**
1. En Instagram → Settings → Business → Set Up
2. Vincular a una Facebook Page

---

### Sync no trae mensajes

**Causa:** Token sin permiso instagram_business_manage_messages.

**Solución:**
1. Verificar permisos en token con Graph API Explorer
2. Solicitar permiso via App Review

---

### Rate Limit

**Causa:** >200 llamadas/hora.

**Solución:**
1. Reducir frecuencia de sync
2. Implementar backoff exponencial
3. Usar webhooks para tiempo real

---

## Debugging

### Verificar cuenta conectada

```sql
SELECT * FROM instagram_accounts 
WHERE organizationId = 'org_xxx';
```

### Ver conversaciones

```sql
SELECT * FROM instagram_conversations 
WHERE accountId = 'acc_xxx';
```

### Ver mensajes

```sql
SELECT * FROM instagram_messages 
WHERE conversationId = 'conv_xxx'
ORDER BY timestamp DESC;
```

### Logs de API

Los errores de API se loguean en consola:

```typescript
// En client.ts
throw new Error(`Instagram API Error: ${JSON.stringify(error)}`);
```

---

## Archivos Relevantes

| Archivo | Propósito |
|---------|-----------|
| `server/db/schema/instagram.ts` | Definición de tablas |
| `server/instagram/client.ts` | Cliente API + sync |
| `server/instagram/oauth.ts` | Handlers OAuth |
| `server/functions/instagram.ts` | Server functions para UI |
| `scripts/instagram-sync.ts` | CLI sync script |
| `package.json` | Script `instagram:sync` |
