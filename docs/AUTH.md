# MaatWork CRM - Sistema de Autenticación

## Visión General

### Arquitectura

```
Cliente (Next.js)                 API (Next.js Routes)
┌─────────────────────┐          ┌─────────────────────┐
│  AuthContext        │          │  /api/auth/*        │
│  ├── login()        │─────────→│  Login endpoint     │
│  ├── register()     │          │  Register endpoint  │
│  ├── logout()       │          │  Session endpoint   │
│  └── refreshSession │←─────────│  Returns user       │
└─────────────────────┘          └─────────────────────┘
         │
         ▼
┌─────────────────────┐
│  httpOnly Cookie   │
│  (session token)   │
└─────────────────────┘
```

### Tecnologías

- **Auth:** next-auth v4 (credenciales)
- **Estado:** React Context (AuthContext)
- **Storage:** httpOnly cookies para tokens
- **API:** Next.js API Routes en `/api/auth/*`

---

## AuthContext

**Archivo:** `src/lib/auth-context.tsx`

### Provider

```tsx
<AuthProvider>
  {children}
</AuthProvider>
```

### API

```typescript
interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  session: SessionData | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  mutateUser: (user: AuthUser | null) => void;
}

interface RegisterData {
  fullName: string;
  email: string;
  password: string;
  role: string;
  managerId?: string;
}
```

---

## Login

### Página

**Archivo:** `src/app/login/page.tsx`

### Campos

| Campo | Tipo | Validación |
|-------|------|------------|
| identifier | string | Requerido (email o username) |
| password | string | Requerido |

### Flujo

```typescript
// 1. Llamar API
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ identifier: email, password, rememberMe }),
});

// 2. Si éxito, AuthContext actualiza el usuario
// 3. Redirect a / o ?redirect=...
```

---

## Registro

### Página

**Archivo:** `src/app/register/page.tsx`

### Campos

| Campo | Tipo | Validación | Requerido |
|-------|------|------------|-----------|
| fullName | string | min 2 chars | ✅ |
| email | string | email válido | ✅ |
| username | string | /^[a-zA-Z0-9._-]{3,20}$/ | ❌ |
| password | string | min 6 chars | ✅ |
| role | enum | member, leader, manager, owner | ✅ |

### Roles

| Rol | Descripción |
|-----|-------------|
| `member` | Usuario estándar |
| `leader` | Líder de equipo |
| `manager` | Manager |
| `owner` | Owner/Admin |

---

## Protección de Rutas

### Hook useRequireAuth

**Archivo:** `src/lib/use-require-auth.ts`

### Uso

```typescript
'use client';

import { useRequireAuth } from '@/lib/use-require-auth';

export default function ProtectedPage() {
  const { user, isLoading } = useRequireAuth({
    requiredRole: ['admin', 'owner'],
    redirectTo: '/login',
  });

  if (isLoading) return <Spinner />;
  if (!user) return null; // Redirect happening

  return <ProtectedContent user={user} />;
}
```

### Props

```typescript
interface UseRequireAuthOptions {
  requiredRole?: string[];      // Roles permitidos
  redirectTo?: string;           // Redirect si no auth (default: /login)
}
```

---

## API Endpoints

### Endpoints Disponibles

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login con credenciales |
| POST | `/api/auth/register` | Registro de usuario |
| POST | `/api/auth/logout` | Cerrar sesión |
| GET | `/api/auth/session` | Obtener sesión actual |
| POST | `/api/auth/change-password` | Cambiar contraseña |
| GET | `/api/auth/managers` | Lista de managers |

### Login

```
POST /api/auth/login
Content-Type: application/json

Body:
{
  "identifier": "user@example.com",
  "password": "password123"
}

Response (200):
{
  "user": { "id", "email", "name", "role", ... },
  "authenticated": true
}

Response (401):
{
  "error": "Credenciales inválidas"
}
```

### Registro

```
POST /api/auth/register
Content-Type: application/json

Body:
{
  "fullName": "Juan Pérez",
  "email": "juan@example.com",
  "password": "password123",
  "role": "member"
}

Response (201):
{
  "success": true,
  "message": "Usuario creado exitosamente"
}
```

### Session

```
GET /api/auth/session

Response (200):
{
  "authenticated": true,
  "user": { "id", "email", "name", "role", ... },
  "session": { "expiresAt": "..." }
}
```

### Logout

```
POST /api/auth/logout

Response (200):
{
  "success": true
}
```

### Change Password

```
POST /api/auth/change-password
Content-Type: application/json

Body:
{
  "currentPassword": "oldpass",
  "newPassword": "newpass123"
}

Response (200):
{
  "success": true
}
```

---

## Helpers de Autorización

**Archivo:** `src/lib/auth-helpers.ts`

### Funciones

```typescript
import { isAdmin, isManagerOrAdmin, canManageTeam } from '@/lib/auth-helpers';

// Usage
{isAdmin(user?.role) && <AdminOnlyComponent />}
{canManageTeam(user) && <TeamManagementButton />}
```

### Implementación

```typescript
export function isAdmin(role?: string): boolean {
  return role === 'admin' || role === 'owner';
}

export function isManagerOrAdmin(role?: string): boolean {
  return role === 'manager' || role === 'admin' || role === 'owner';
}

export function canManageTeam(user?: AuthUser): boolean {
  if (!user) return false;
  return isManagerOrAdmin(user.role);
}
```

---

## Flujo Completo

### Login

```
User → /login page
       ↓
Fill credentials
       ↓
Submit → POST /api/auth/login
       ↓
API validates → Sets httpOnly cookie
       ↓
Response → { user, authenticated: true }
       ↓
AuthContext.login() → Updates user state
       ↓
Redirect to /
```

### Logout

```
User clicks logout
       ↓
AuthContext.logout()
       ↓
Clear local state
       ↓
POST /api/auth/logout (clear cookie server-side)
       ↓
Redirect to /login
```

### Auto-Refresh

El session se refresca automáticamente cada 5 minutos:

```typescript
const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

useEffect(() => {
  const interval = setInterval(() => {
    if (user) refreshSession();
  }, REFRESH_INTERVAL);
  return () => clearInterval(interval);
}, [user]);
```

### Multi-Tab Sync

```typescript
const AUTH_SYNC_KEY = 'maatwork_auth_sync';

useEffect(() => {
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === AUTH_SYNC_KEY) {
      fetchSession(); // Session changed in another tab
    }
  };
  window.addEventListener('storage', handleStorageChange);
  return () => window.removeEventListener('storage', handleStorageChange);
}, [fetchSession]);
```

---

## Notas de Implementación

- Los tokens se almacenan en **httpOnly cookies** (no localStorage)
- La cookie tiene el prefijo `session-` seguido del token
- El servidor valida el token en cada request a `/api/*`
- No hay refresh token separado - el session endpoint renueva la sesión
