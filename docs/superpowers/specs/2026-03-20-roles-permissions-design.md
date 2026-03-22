# Sistema de Permisos Granulares - MaatWork CRM

## Overview

Este documento describe el rediseño del sistema de roles y permisos para implementar acceso granular a recursos basado en el rol del usuario.

## Problema Actual

1. No hay middleware de Next.js para proteger rutas automáticamente
2. Verificación client-side puede ser saltada
3. Permisos binarios (puede/no puede)
4. Advisor requiere managerId pero no tiene restricciones de acceso claras

## Solución Propuesta

### Arquitectura de 3 Capas

```
Request → proxy.ts → API Route Guards → UI Conditional
```

#### Capa 1: proxy.ts (Middleware)

- **Ubicación**: `proxy.ts` (raíz del proyecto, Next.js 16+)
- **Responsabilidad**: Verificación de sesión JWT
- **Optimización**: NO consulta base de datos (~1-2ms)
- **Flujo**:
  1. Lee cookie `session_token`
  2. Decodifica JWT
  3. Si inválido → redirect a `/login`
  4. Si válido → agrega headers: `x-user-id`, `x-user-role`, `x-user-manager-id`
  5. Pasa request al siguiente handler

#### Capa 2: API Route Guards

- **Ubicación**: Cada API route verifica permisos
- **Responsabilidad**: Verificación granular de permisos al recurso
- **Acceso**: Headers del proxy.ts + consulta DB cuando sea necesario
- **Retorno**: 403 Forbidden si no tiene permisos

#### Capa 3: UI Conditional Rendering

- **Ubicación**: Componentes React
- **Responsabilidad**: Ocultar/mostrar elementos según permisos
- **Nota**: Seguridad complementaria, no primaria

---

## Definición de Permisos Granulares

```typescript
// src/lib/permissions.ts

export type Permission =
  // Contacts
  | 'contacts:read:own'
  | 'contacts:read:team'
  | 'contacts:read:all'
  | 'contacts:create'
  | 'contacts:update:own'
  | 'contacts:update:team'
  | 'contacts:update:all'
  | 'contacts:delete:own'
  | 'contacts:delete:team'
  | 'contacts:delete:all'
  // Team
  | 'team:view'
  // Users
  | 'users:manage'
  // Settings
  | 'settings:view'
  | 'settings:manage';

// Aliases: 'dueno' = 'owner', 'asesor' = 'advisor'
export type Role = 'admin' | 'developer' | 'owner' | 'manager' | 'advisor' | 'staff' | 'member' | 'dueno' | 'asesor';

export const ROLE_ALIASES: Record<string, Role> = {
  dueno: 'owner',
  asesor: 'advisor',
};

export function normalizeRole(role: string): Role {
  return ROLE_ALIASES[role] ?? (role as Role);
}

export function hasPermission(role: string, permission: Permission): boolean {
  const normalizedRole = normalizeRole(role);
  return ROLE_PERMISSIONS[normalizedRole]?.includes(permission) ?? false;
}

export function isManager(role: string): boolean {
  const normalizedRole = normalizeRole(role);
  return normalizedRole === 'manager';
}

export function canBeManager(role: string): boolean {
  const normalizedRole = normalizeRole(role);
  return ['manager', 'owner', 'admin', 'developer'].includes(normalizedRole);
}

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  // Admin completo
  admin: [
    'contacts:read:all', 'contacts:create', 'contacts:update:all', 'contacts:delete:all',
    'team:view', 'users:manage', 'settings:view', 'settings:manage',
  ],
  developer: [
    'contacts:read:all', 'contacts:create', 'contacts:update:all', 'contacts:delete:all',
    'team:view', 'users:manage', 'settings:view', 'settings:manage',
  ],
  owner: [
    'contacts:read:all', 'contacts:create', 'contacts:update:all', 'contacts:delete:all',
    'team:view', 'users:manage', 'settings:view', 'settings:manage',
  ],
  // Manager: ve sus contactos + equipo + puede editarlos, sin settings
  manager: [
    'contacts:read:own', 'contacts:read:team', 'contacts:create',
    'contacts:update:own', 'contacts:update:team',
    'contacts:delete:own', 'contacts:delete:team',
    'team:view',
  ],
  // Staff: admin de contactos, sin team ni settings
  staff: [
    'contacts:read:all', 'contacts:create', 'contacts:update:all', 'contacts:delete:all',
  ],
  // Advisor: solo sus contactos
  advisor: [
    'contacts:read:own', 'contacts:create', 'contacts:update:own',
  ],
  // Member: solo sus contactos
  member: [
    'contacts:read:own', 'contacts:create', 'contacts:update:own',
  ],
};
```

---

## Matriz de Accesos por Rol

| Recurso | Admin | Owner | Developer | Manager | Advisor | Staff | Member |
|---------|-------|-------|-----------|---------|---------|-------|--------|
| `/contacts` (propios) | ✅ RW | ✅ RW | ✅ RW | ✅ RW | ✅ RW | ✅ RW | ✅ RW |
| `/contacts` (equipo) | ✅ RW | ✅ RW | ✅ RW | ✅ RW | ❌ | ✅ RW | ❌ |
| `/contacts` (todos) | ✅ RW | ✅ RW | ✅ RW | ❌ | ❌ | ✅ RW | ❌ |
| `/teams` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Admin Settings | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Invitar usuarios | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## Estructura de Archivos

### Archivos a Crear

| Archivo | Descripción |
|---------|-------------|
| `src/lib/permissions.ts` | Sistema de permisos granulares |
| `proxy.ts` | Middleware de autenticación (Next.js 16+) |

### Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `src/lib/auth-helpers.ts` | Actualizar tipos, agregar `hasPermission()`, `normalizeRole()` |
| `src/lib/auth-context.tsx` | Integrar sistema de permisos |
| `src/lib/use-require-auth.ts` | Soporte para permisos granulares |
| `src/app/api/contacts/route.ts` | Verificar permisos `contacts:*`, filtrar por rol |
| `src/app/api/contacts/[id]/route.ts` | Verificar permisos `contacts:*` |
| `src/app/api/contacts/[id]/tags/route.ts` | Verificar permisos `contacts:*` |
| `src/app/api/teams/route.ts` | Agregar auth + verificar `team:view` |
| `src/app/api/teams/[id]/route.ts` | Agregar auth + verificar `team:view` |
| `src/app/contacts/page.tsx` | Filtrar según permisos |
| `src/app/teams/page.tsx` | Mostrar según rol |

---

## Implementación del Proxy (proxy.ts)

```typescript
// proxy.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function proxy(request: NextRequest) {
  const sessionToken = request.cookies.get('session_token')?.value;
  const url = new URL(request.url);

  // Rutas públicas no requieren auth
  if (url.pathname.startsWith('/login') || url.pathname.startsWith('/register')) {
    return NextResponse.next();
  }

  if (!sessionToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const { payload } = await jwtVerify(sessionToken, JWT_SECRET);
    const response = NextResponse.next();
    response.headers.set('x-user-id', payload.userId as string);
    response.headers.set('x-user-role', payload.role as string);
    response.headers.set('x-user-manager-id', (payload.managerId as string) || '');
    return response;
  } catch {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

---

## Flujo de Verificación en API Routes

```typescript
// Ejemplo: GET /api/contacts
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  const userRole = normalizeRole(request.headers.get('x-user-role') as string);
  const managerId = request.headers.get('x-user-manager-id');

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Admin/Staff/Owner/Developer ven todos
  if (hasPermission(userRole, 'contacts:read:all')) {
    return NextResponse.json(await getAllContacts());
  }

  // Manager ve sus contactos + equipo
  if (hasPermission(userRole, 'contacts:read:team')) {
    return NextResponse.json(await getTeamAndOwnContacts(userId, managerId));
  }

  // Advisor/Member solo ven propios
  if (hasPermission(userRole, 'contacts:read:own')) {
    return NextResponse.json(await getOwnContacts(userId));
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

---

## UI: usePermission Hook

```typescript
// src/lib/use-require-auth.ts
export function usePermission() {
  const { user } = useAuth();

  return {
    can: (permission: Permission) => {
      if (!user?.role) return false;
      return ROLE_PERMISSIONS[user.role as Role]?.includes(permission) ?? false;
    },
    isAdmin: hasPermission(user?.role, 'users:manage'),
    isManager: hasPermission(user?.role, 'team:view') && !hasPermission(user?.role, 'users:manage'),
    canViewTeam: hasPermission(user?.role, 'team:view'),
    canManageContacts: hasPermission(user?.role, 'contacts:delete:all'),
  };
}
```

---

## Validación de Registro

### Advisor Requiere Manager

```typescript
// API de registro
if (role === 'advisor') {
  if (!managerId) {
    return NextResponse.json(
      { error: 'Advisors must have a manager assigned' },
      { status: 400 }
    );
  }
  // Verificar que el manager existe y es manager/owner/admin
  const manager = await getUser(managerId);
  if (!manager || !canBeManager(manager.role)) {
    return NextResponse.json(
      { error: 'Invalid manager assignment' },
      { status: 400 }
    );
  }
}
```

---

## Testing

### Permisos por Rol

```typescript
describe('ROLE_PERMISSIONS', () => {
  it('admin has all contact permissions', () => {
    expect(ROLE_PERMISSIONS.admin).toContain('contacts:read:all');
    expect(ROLE_PERMISSIONS.admin).toContain('contacts:delete:all');
  });

  it('advisor only has own contact permissions', () => {
    expect(ROLE_PERMISSIONS.advisor).toContain('contacts:read:own');
    expect(ROLE_PERMISSIONS.advisor).not.toContain('contacts:read:all');
    expect(ROLE_PERMISSIONS.advisor).not.toContain('team:view');
  });

  it('manager has team view but not settings', () => {
    expect(ROLE_PERMISSIONS.manager).toContain('team:view');
    expect(ROLE_PERMISSIONS.manager).not.toContain('settings:manage');
  });
});
```

---

## Métricas de Éxito

1. Todos los endpoints de API verifican permisos correctamente
2. proxy.ts responde < 5ms
3. UI no muestra elementos para los que el usuario no tiene permisos
4. Advisor no puede acceder a `/teams`
5. Manager ve contactos del equipo en `/teams`

---

## Notas de Seguridad

1. **proxy.ts NO consulta DB** - Solo decodifica JWT para performance
2. **API routes SI verifican** - Cada route verifica el permiso específico
3. **UI es complementaria** - Nunca confiar en ocultar elementos para seguridad
4. **Manager contact filtering** - Se hace en query SQL, no en frontend
5. **Todas las API routes necesitan auth** - Incluso `/teams` que actualmente no tiene verificación
6. **Validación de rol en registro** - Advisor requiere managerId válido

---

## Equivalencias de Roles

| Rol Actual | Alias de | Permisos Equivalentes a |
|------------|----------|------------------------|
| `dueno` | `owner` | Owner |
| `asesor` | `advisor` | Advisor |

Estos alias existen en la DB pero se normalizan a los roles canónicos listados en `Role`. La tabla de usuarios no necesita migración.
