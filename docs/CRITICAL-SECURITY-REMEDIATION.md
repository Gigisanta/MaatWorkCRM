# ⚠️ ACCIÓN REQUERIDA: Remediación de Credenciales Google OAuth

## Estado: CRÍTICO - Credenciales Expuestas

Las credenciales de Google OAuth fueron encontradas en `.env.local` que está comprometido en el historial de git.

```
GOOGLE_CLIENT_ID: YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET: YOUR_GOOGLE_CLIENT_SECRET
```

## Pasos de Remediación (Ejecutar INMEDIATAMENTE)

### Paso 1: Rotar Credenciales en Google Cloud Console

1. Ir a [Google Cloud Console](https://console.cloud.google.com)
2. Seleccionar proyecto "MaatWork CRM" o el proyecto correspondiente
3. Ir a **APIs y Servicios** > **Credenciales**
4. Encontrar el OAuth 2.0 Client ID para "MaatWork CRM Web"
5. Click en el cliente > **Actualizar cliente OAuth**
6. Se abrirá un modal con el Client ID y Client Secret ACTUALES
7. **NO cerrar esta ventana** - usar estos valores para comparar
8. Click en **Actualizar** (no cambiar nada, solo actualiza para generar nuevos valores si es necesario)
9. O mejor: **Crear un NUEVO cliente OAuth** y luego eliminar el viejo

### Alternativa Rápida - Generar Nuevas Credenciales:

1. En Google Cloud Console > Credenciales
2. Click en **Crear Credenciales** > **ID de cliente OAuth**
3. Tipo: **Aplicación web**
4. Nombre: `MaatWork CRM Web - NUEVO`
5. URI de redireccionamiento autorizado:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://crm.maat.work/api/auth/callback/google`
6. Click **Crear**
7. **COPIAR inmediatamente** el nuevo Client ID y Client Secret
8. Ir a la configuración del cliente VIEJO y click **Eliminar**
9. Agregar las nuevas credenciales a Vercel y .env.local

### Paso 2: Actualizar Variables de Entorno

#### En Vercel (PRODUCCIÓN):
```bash
vercel env add GOOGLE_CLIENT_ID
# Ingresar el nuevo valor

vercel env add GOOGLE_CLIENT_SECRET
# Ingresar el nuevo valor
```

#### En .env.local (DESARROLLO):
```bash
# Regenerar con el script
./scripts/generate-secrets.sh

# O manualmente, solo cambiar estas líneas:
GOOGLE_CLIENT_ID="NUEVO_CLIENT_ID.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="NUEVO_CLIENT_SECRET"
```

### Paso 3: Verificar en Vercel

1. Ir a Vercel Dashboard > MaatWork CRM > Settings > Environment Variables
2. Verificar que `NEXTAUTH_URL=https://crm.maat.work` está configurado
3. Verificar que todos los secrets están configurados (no valores de dev)

## Variables de Entorno Críticas para Producción

| Variable | Valor Esperado |
|----------|----------------|
| `NEXTAUTH_URL` | `https://crm.maat.work` |
| `NEXTAUTH_SECRET` | Generado con `openssl rand -base64 32` |
| `JWT_SECRET` | Generado con `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` | ID real de Google Cloud Console (NUEVO) |
| `GOOGLE_CLIENT_SECRET` | Secret real de Google Cloud Console (NUEVO) |
| `TOKEN_ENCRYPTION_KEY` | 64 caracteres hex |
| `CRON_SECRET` | Generado con `openssl rand -base64 32` |

## Confirmación de Fix

Después de rotator credenciales, verificar:

1. El login con Google funciona en producción
2. Los calendars se sincronizan
3. No hay errores en Vercel logs

## Archivos Modificados Durante Esta Sesión

| Archivo | Cambio |
|---------|--------|
| `.env.local` | Secrets regenerados |
| `middleware.ts` | JWT_SECRET opcional, no crash |
| `src/lib/auth.ts` | Validación startup + debug logging |
| `src/app/api/auth/logout/route.ts` | Ahora limpia ambas cookies |
| `src/app/api/accounts/disconnect/route.ts` | Validación de provider agregada |
| `src/lib/auth-helpers.ts` | linkedProviders agregado |
| `proxy.ts` | ELIMINADO (era duplicado) |
| `.env.example` | Actualizado con documentación |
| `scripts/generate-secrets.sh` | Creado |
| `scripts/test-oauth-flow.sh` | Creado |
| `scripts/validate-env.ts` | Creado |

## Testing Local

Para probar el flujo OAuth en desarrollo:

```bash
# 1. Asegurar que dev server está corriendo
cd /Users/prueba/Desktop/maatworkcrmv3
npm run dev

# 2. Abrir en navegador
open http://localhost:3000/login

# 3. Click en "Continuar con Google"
# 4. Completar login en Google
# 5. Verificar que redirige correctamente

# 6. Verificar en DevTools:
#    - Cookies: next-auth.session-token должна estar configurada
#    - Network: /api/auth/session debe retornar authenticated: true
```

## Notas Importantes

- `.env.local` está en `.gitignore` correctamente ahora
- Las credenciales viejas están COMPROMETIDAS - rotarlas inmediatamente
- El logout ahora funciona correctamente para ambos tipos de sesión
- El sistema de sync de calendario está correctamente configurado
