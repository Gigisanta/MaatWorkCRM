# User Service (Auth)

## Registro

**Endpoint:** `POST /auth/register`

**Validacion:**
- `email`: email valido (schema: emailSchema)
- `fullName`: string, min 1, max 255 caracteres
- `username`: opcional, regex `/^[a-zA-Z0-9._-]{3,20}$/` (normalizado a lowercase para busquedas)
- `password`: string, minimo 6 caracteres
- `role`: enum `['advisor', 'manager', 'owner', 'staff']` (admin solo por admin)
- `requestedManagerId`: uuid opcional (solo para advisors)

**Logica de negocio:**
1. Verificar que el email no exista en la base de datos
2. Si se proporciona username, verificar que no exista (usernameNormalized)
3. Hashear password con bcrypt (salt rounds: 10)
4. Crear usuario con `isActive: false` (pendiente de aprobacion)
5. Si es `advisor` y proporciona `requestedManagerId`, crear registro en `teamMembershipRequests` con status `pending`

**Respuesta exitosa (201):**
```json
{
  "success": true,
  "message": "Registro exitoso! Tu cuenta ha sido creada y esta pendiente de aprobacion...",
  "userId": "uuid",
  "status": "pending_approval",
  "requestId": "uuid"
}
```

---

## Login

**Endpoint:** `POST /auth/login`

**Validacion:**
- `identifier`: string (email o username)
- `password`: string, minimo 6 caracteres
- `rememberMe`: opcional, boolean o string 'true'/'false'

**Logica de negocio:**
1. Normalizar identifier (trim)
2. Buscar usuario por `email` o `usernameNormalized` (una sola query con OR)
3. Verificar que usuario existe
4. Verificar que `isActive: true` (si no, lanzar 403 con code `PENDING_APPROVAL`)
5. Verificar que tiene `passwordHash`
6. Verificar password con bcrypt.compare
7. Validar que el role este en ROLES permitidos
8. Generar JWT con `signUserToken`:
   - Payload: `{ id, email, role, fullName }`
   - Duracion: `1d` por defecto, `30d` si `rememberMe: true`
9. Actualizar `lastLogin` con fecha actual
10. Establecer cookie `token` con opciones de `getAuthCookieOptions`

**Caso especial - Admin:**
- Email: `giolivosantarelli@gmail.com` o username: `gio`
- Si no existe, crea usuario admin con password por defecto `admin123`
- Validacion especial de password

**Respuesta exitosa:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "advisor",
    "fullName": "Nombre Completo"
  }
}
```

---

## Refresh Token

**Endpoint:** `POST /auth/refresh`

**Logica de negocio:**
1. Obtener token de cookie `token` o header `Authorization: Bearer ...`
2. Verificar token con `verifyUserToken` (puede estar expirado pero valido)
3. Si token invalido, lanzar 401
4. Verificar que usuario existe en DB y `isActive: true`
5. Generar nuevo token con duracion `1d`
6. Establecer nueva cookie con `getAuthCookieOptions`

---

## Logout

**Endpoint:** `POST /auth/logout`

**Logica de negocio:**
1. Limpiar cookie `token` con `getAuthCookieClearOptions`

---

## Actualizacion de Perfil

**Endpoint:** `PATCH /users/me`

**Autenticacion:** Requiere `requireAuth` (JWT valido)

**Validacion:**
- `phone`: string, min 1, max 50 caracteres (obligatorio)
- `fullName`: string, min 1, max 255 (opcional)

**Logica de negocio:**
1. Obtener userId del token JWT
2. Actualizar `phone` y `fullName` (si se proporciona) en tabla `users`
3. Incluir `updatedAt` con fecha actual
4. Retornar usuario actualizado con estado de conexion Google

**Respuesta exitosa:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "fullName": "Nombre Actualizado",
    "phone": "+541100000000",
    "role": "advisor",
    "isActive": true,
    "isGoogleConnected": false,
    "googleEmail": null,
    ...
  }
}
```

---

## Cambio de Password

**Endpoint:** `POST /users/change-password`

**Autenticacion:** Requiere `requireAuth` (JWT valido)

**Validacion:**
- `currentPassword`: string, min 1 (obligatorio)
- `newPassword`: string, minimo 6 caracteres (obligatorio)

**Logica de negocio:**
1. Obtener userId del token JWT
2. Verificar que `newPassword` tiene minimo 6 caracteres
3. Obtener usuario actual de DB
4. Verificar que tiene `passwordHash` (si no tiene, no puede cambiar)
5. Verificar `currentPassword` con bcrypt.compare
6. Si password actual es incorrecto, lanzar 401
7. Hashear nueva password con bcrypt (salt rounds: 10)
8. Actualizar `passwordHash` en DB
9. Invalidar todas las sesiones existentes (logout global)

**Respuesta exitosa:**
```json
{
  "success": true,
  "data": {
    "message": "Contrasena actualizada exitosamente"
  }
}
```

**Errores posibles:**
- 400: Nueva password muy corta
- 400: Usuario sin password configurado
- 401: Password actual incorrecta
- 404: Usuario no encontrado
