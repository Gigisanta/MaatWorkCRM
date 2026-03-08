# Google Cloud Console - Configuración Manual

## Paso 1: Crear Proyecto

1. Ve a **Google Cloud Console**: https://console.cloud.google.com/
2. Inicia sesión con tu cuenta de Google
3. Si tienes un proyecto existente, selecciona "Nuevo Proyecto" o usa el selector de proyectos
4. Nombre del proyecto: **MaatWork CRM**
5. Click en "Crear"

## Paso 2: Habilitar APIs

1. En el menú lateral, ve a **APIs & Services** > **Library**
2. Busca y habilita las siguientes APIs:
   - **Google Calendar API**
   - **Google Drive API**

## Paso 3: Configurar OAuth Consent Screen

1. Ve a **APIs & Services** > **OAuth consent screen**
2. Selecciona **External** (para uso externo)
3. Completa los campos:
   - **App name**: MaatWork CRM
   - **User support email**: tu email
   - **Developer contact information**: tu email
4. Click en "Save and continue"

### Agregar Scopes

1. En la sección "Scopes", agrega los siguientes:
   ```
   https://www.googleapis.com/auth/userinfo.email
   https://www.googleapis.com/auth/userinfo.profile
   openid
   https://www.googleapis.com/auth/calendar
   https://www.googleapis.com/auth/calendar.events
   https://www.googleapis.com/auth/drive
   https://www.googleapis.com/auth/drive.file
   ```
2. Click en "Save and continue"

### Agregar Usuarios de Prueba

1. En la sección "Test users", agrega tu email como usuario de prueba
2. Esto permite usar la app sin verificación completa
3. Click en "Save and continue"

## Paso 4: Crear Credenciales OAuth

1. Ve a **APIs & Services** > **Credentials**
2. Click en **Create Credentials** > **OAuth client ID**
3. Application type: **Web application**
4. Name: **MaatWork CRM**
5. **Authorized JavaScript origins**:
   - `http://localhost:3000` (desarrollo)
   - `https://tu-dominio.com` (producción)
6. **Authorized redirect URIs**:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://tu-dominio.com/api/auth/callback/google`
7. Click en **Create**
8. **Importante**: Copia el **Client ID** y **Client Secret**

## Paso 5: Actualizar Variables de Entorno

```bash
# En apps/web/.env
GOOGLE_CLIENT_ID=tu-client-id-aqui
GOOGLE_CLIENT_SECRET=tu-client-secret-aqui
```

## Paso 6: Verificación (Opcional para producción)

Para usar la app públicamente sin warnings de "app no verificada":
1. Completa la información del OAuth consent screen
2. Agrega URLs de Privacy Policy y Terms of Service
3. Envía para verificación

---

## URLs de Redirect

```
Desarrollo:  http://localhost:3000/api/auth/callback/google
Producción:  https://tu-dominio.com/api/auth/callback/google
```

## Soporte

Si tienes problemas, consulta la documentación oficial:
- https://developers.google.com/identity/protocols/oauth2
- https://developers.google.com/workspace/calendar/api
- https://developers.google.com/drive/api
