# Google OAuth - Estado y Configuración — crm.maat.work

## Estado Actual (27 Mar 2026)

**El login con Google OAuth funciona correctamente en producción.**

---

## Arquitectura de Autenticación

### Stack
- **NextAuth.js v4.24.11** con `PrismaAdapter`
- Estrategia de sesión: `strategy: 'jwt'` (JWE en cookies)
- Google OAuth 2.0 con PKCE y state validation
- Base de datos: PostgreSQL (Neon) vía Prisma ORM
- Deploy target: Vercel (Edge + Serverless)

### Flujo de Autenticación

```
1. Usuario click "Continuar con Google"
   → signIn('google', { callbackUrl: '/dashboard' })

2. Redirect a Google OAuth → usuario autoriza

3. Google redirect a /api/auth/callback/google
   → NextAuth crea/encuentra User en BD
   → Crea Account para el provider Google
   → Genera JWE token y lo guarda en cookie

4. Cookie seteada: __Secure-next-auth.session-token (prod)
   → El valor es un JWE (JSON Web Encryption) encriptado

5. Redirect a /dashboard

6. Client-side: usa /api/auth/session de NextAuth
   → auth-context.tsx obtiene sesión
   → Si necesita datos extra (org, providers): /api/auth/user-profile
```

---

## Archivos Clave

### `/src/lib/auth.ts`
- Configuración de NextAuth (providers, callbacks, PrismaAdapter)
- `jwt callback`: setea `token.id = user.id`
- `session callback`: copia `token.id → session.user.id`
- **NO usar `checks: []`** - causa error `checks.state argument is missing`

### `/src/lib/auth-context.tsx`
- AuthProvider con session management
- Usa `/api/auth/session` de NextAuth para sesión
- Usa `/api/auth/user-profile` para datos adicionales (org, providers)

### `/src/app/api/auth/user-profile/route.ts`
- Endpoint para obtener datos extendidos del usuario
- Busca membership y linked accounts

### `/middleware.ts`
- CSP headers para Google OAuth
- Headers de seguridad estándar

---

## Cookies de NextAuth (Producción)

| Cookie | Descripción |
|--------|-------------|
| `__Secure-next-auth.session-token` | JWE con sesión encriptada |
| `__Host-next-auth.csrf-token` | CSRF protection |
| `__Secure-next-auth.callback-url` | URL de callback OAuth |
| `__Secure-next-auth.state` | OAuth state (protección CSRF) |
| `__Secure-next-auth.pkce.code_verifier` | PKCE code verifier |

---

## Cómo Testear OAuth

### 1. Test automático (Playwright)
```bash
node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto('https://crm.maat.work/login');
  await page.click('button:has-text(\"Google\")');
  await page.waitForTimeout(2000);

  // Verificar redirect a Google
  console.log('URL:', page.url().includes('google.com') ? 'OK - Google OAuth' : 'FAIL');

  await browser.close();
})();
"
```

### 2. Verificar sesión en navegador
```javascript
// En DevTools console en crm.maat.work
fetch('/api/auth/session').then(r => r.json()).then(console.log)
// Debería返回 { user: {...}, expires: "..." }
```

### 3. Ver logs de Vercel
```bash
vercel logs crm.maat.work
```

---

## Configuración de Environment Variables (Vercel)

Verificar que estén configuradas en Production:

```bash
vercel env ls
```

Variables requeridas:
- `NEXTAUTH_URL=https://crm.maat.work`
- `NEXTAUTH_SECRET` (min 32 chars)
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `NEXTAUTH_TRUST_HOST=true`

---

## Errores Comunes y Soluciones

### Error: `checks.state argument is missing`
**Causa**: Usaste `checks: []` en GoogleProvider
**Solución**: Remover `checks` o usar default (NextAuth lo maneja)

### Error: `Only JWTs using Compact JWS serialization`
**Causa**: Intentaste usar `jwtVerify` en token de NextAuth
**Solución**: NextAuth usa JWE (encriptado), no JWT (firmado). No necesitas verificar manualmente - NextAuth lo hace internamente.

### Error: Cookies vacías en serverless
**Causa**: Las cookies HttpOnly no se reenvían a serverless functions
**Solución**: Usar endpoint nativo de NextAuth `/api/auth/session`

---

## Scripts de Debug

### Ver sesiones activas en Neon
```sql
SELECT s.token, substring(s.token, 1, 20) as token_prefix,
       u.email, s."expiresAt", s."userId"
FROM "Session" s
JOIN "User" u ON s."userId" = u.id
WHERE s."expiresAt" > NOW()
ORDER BY s."expiresAt" DESC;
```

### Ver usuarios Google
```sql
SELECT u.email, u.name, a.provider, a.provider_account_id
FROM "User" u
JOIN "Account" a ON u.id = a."userId"
WHERE a.provider = 'google';
```

---

## Historial de Cambios

### Fix Final (27 Mar 2026)
- Removido `checks: []` que causaba error de state
- OAuth flow completo funciona en producción
- PKCE + State validation habilitado por defecto

### Commits relevantes
```
xxxxxxx fix: OAuth Google working in production
xxxxxxx fix: use jwtDecrypt for NextAuth JWE tokens
xxxxxxx fix: use database session lookup for NextAuth tokens
```
