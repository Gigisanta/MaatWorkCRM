# Arquitectura del Sistema

## Visión General

MaatWork CRM sigue una arquitectura moderna basada en **Next.js App Router**, que combina renderizado del servidor (RSC) con interactividad del cliente de manera eficiente. Utiliza **next-auth v4** para autenticación, proporcionando un sistema flexible y seguro.

## Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENTE                                     │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    Browser (React 19)                            │    │
│  │  ┌─────────────┐  ┌──────────────┐  ┌───────────────────────┐  │    │
│  │  │  React      │  │ TanStack     │  │  React Hook Form      │  │    │
│  │  │  Components │  │ Query Cache  │  │  + Zod Validation     │  │    │
│  │  └─────────────┘  └──────────────┘  └───────────────────────┘  │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTP/HTTPS
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         NEXT.JS SERVER                                   │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                      App Router                                  │    │
│  │  ┌─────────────┐  ┌──────────────┐  ┌───────────────────────┐  │    │
│  │  │  Server     │  │  API Routes  │  │  Server Actions       │  │    │
│  │  │  Components │  │  (REST API)  │  │  (Mutations)          │  │    │
│  │  └─────────────┘  └──────────────┘  └───────────────────────┘  │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                    │                                     │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                      Middleware                                   │    │
│  │  ┌─────────────┐  ┌──────────────┐  ┌───────────────────────┐  │    │
│  │  │  Auth       │  │  Logging     │  │  Error Handling       │  │    │
│  │  │  Check      │  │  & Tracing   │  │                       │  │    │
│  │  └─────────────┘  └──────────────┘  └───────────────────────┘  │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Prisma ORM
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         BASE DE DATOS                                    │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    SQLite / PostgreSQL                           │    │
│  │  ┌─────────────┐  ┌──────────────┐  ┌───────────────────────┐  │    │
│  │  │  31 Tablas │  │  Relaciones  │  │  Índices Optimizados  │  │    │
│  │  │  Prisma    │  │  Complejas   │  │                       │  │    │
│  │  └─────────────┘  └──────────────┘  └───────────────────────┘  │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
```

## Capas de la Aplicación

### 1. Capa de Presentación (Frontend)

#### Componentes React
- **Server Components**: Renderizados en el servidor, no tienen estado
- **Client Components**: Interactivos, usan hooks y estado

```tsx
// Server Component (default)
export default async function ContactsPage() {
  const contacts = await db.contact.findMany();
  return <ContactList contacts={contacts} />;
}

// Client Component
"use client";
export function ContactList({ contacts }) {
  const [search, setSearch] = useState("");
  // ... client-side interactivity
}
```

#### Estado del Cliente
- **TanStack Query**: Caché de datos del servidor
- **React State**: Estado local de componentes
- **URL State**: Parámetros de búsqueda y ruta
- **Zustand**: Estado global opcional para UI

### 2. Capa de API (Backend)

#### Estructura de API Routes
```
/app/api/
├── auth/
│   ├── login/route.ts        # POST - Autenticación
│   ├── register/route.ts     # POST - Registro
│   ├── logout/route.ts       # POST - Logout
│   ├── session/route.ts      # GET - Sesión actual
│   ├── change-password/route.ts # POST - Cambiar contraseña
│   └── managers/route.ts     # GET - Lista de managers
├── contacts/
│   ├── route.ts              # GET (lista), POST (crear)
│   └── [id]/
│       ├── route.ts          # GET, PUT, DELETE
│       ├── tags/route.ts    # POST - Agregar tag
│       └── tags/[tagId]/route.ts # DELETE - Remover tag
├── deals/
│   ├── route.ts
│   └── [id]/
│       ├── route.ts
│       └── move/route.ts     # POST - Mover etapa
├── tasks/
│   ├── route.ts
│   └── [id]/
│       ├── route.ts
│       └── complete/route.ts # POST - Completar tarea
├── teams/
│   ├── route.ts
│   └── [id]/
│       ├── route.ts
│       └── members/
│           ├── route.ts      # POST - Agregar miembro
│           └── [memberId]/route.ts # DELETE - Remover miembro
├── goals/
│   ├── route.ts
│   └── [id]/route.ts
├── calendar-events/
│   ├── route.ts
│   └── [id]/route.ts
├── notifications/
│   ├── route.ts
│   ├── [id]/read/route.ts
│   └── read-all/route.ts
├── training/
│   ├── route.ts
│   └── [id]/route.ts
├── notes/
│   ├── route.ts
│   └── [id]/route.ts
├── users/
│   ├── route.ts
│   └── [id]/
│       ├── route.ts
│       └── settings/route.ts
├── organizations/
│   ├── route.ts
│   └── [id]/
│       ├── route.ts
│       └── members/route.ts
├── sessions/
│   ├── route.ts
│   └── logout-others/route.ts
├── pipeline-stages/
│   ├── route.ts
│   └── [id]/route.ts
└── instagram/
    └── (endpoints de Instagram)
```

#### Patrón de API Route
```typescript
// app/api/contacts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search");
    const stage = searchParams.get("stage");

    const contacts = await db.contact.findMany({
      where: {
        organizationId: session.user.organizationId,
        ...(search && { name: { contains: search } }),
        ...(stage && { pipelineStageId: stage }),
      },
      include: {
        tags: true,
        stage: true,
        assignedUser: true,
      },
    });

    return NextResponse.json(contacts);
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, phone, company, segment, pipelineStageId, assignedTo } = body;

    const contact = await db.contact.create({
      data: {
        name,
        email,
        phone,
        company,
        segment,
        pipelineStageId,
        assignedTo,
        organizationId: session.user.organizationId,
      },
    });

    return NextResponse.json(contact, { status: 201 });
  } catch (error) {
    console.error("Error creating contact:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
```

### 3. Capa de Datos (ORM)

#### Prisma Schema (extracto)
```prisma
model Contact {
  id             String   @id @default(cuid())
  organizationId String
  name           String
  email          String?
  phone          String?
  company        String?
  emoji          String   @default("👤")
  segment        String?
  source         String?

  pipelineStageId String?
  pipelineStage   PipelineStage? @relation(fields: [pipelineStageId], references: [id])

  assignedTo      String?
  assignedUser    User?    @relation("AssignedContacts", fields: [assignedTo], references: [id])

  tags           ContactTag[]
  deals          Deal[]
  tasks          Task[]
  stageHistory   PipelineStageHistory[]

  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
}
```

## Flujo de Autenticación

### Sistema: next-auth v4

MaatWork CRM utiliza **next-auth v4** para autenticación, que proporciona:
- Autenticación por credenciales (email/password)
- Gestión de sesiones con tokens
- Soporte para múltiples providers OAuth
- Tokens seguros en HttpOnly cookies

### Secuencia de Login
```
1. Usuario → POST /api/auth/login
   ├── Body: { identifier, password }

2. Server → Verificar credenciales
   ├── Buscar usuario por email/username
   ├── Comparar password con bcrypt
   └── Crear sesión con token

3. Server → Response
   ├── Set-Cookie: session-token=<token>
   └── Body: { user, success: true }

4. Cliente → Actualizar estado
   ├── AuthContext.login()
   ├── Redireccionar a /dashboard
```

### Protección de Rutas
```tsx
// use-require-auth.ts
export function useRequireAuth(options?: UseRequireAuthOptions) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user) {
      const redirect = options?.redirectWithParams
        ? `${options.redirectTo}?redirect=${pathname}`
        : options?.redirectTo || "/login";
      router.push(redirect);
    }

    if (user && options?.requiredRole) {
      if (!options.requiredRole.includes(user.role)) {
        router.push("/unauthorized");
      }
    }
  }, [user, isLoading]);

  return { user, isLoading };
}
```

## Gestión de Estado

### Estado Global (Auth)
```tsx
// AuthContext.tsx
interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}
```

### Estado del Servidor (TanStack Query)
```tsx
// useQuery para datos
const { data, isLoading, error } = useQuery({
  queryKey: ["contacts", filters],
  queryFn: () => fetchContacts(filters),
  staleTime: 5 * 60 * 1000,
});

// useMutation para cambios
const mutation = useMutation({
  mutationFn: createContact,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["contacts"] });
  },
});
```

### Estado Local
- Formularios: react-hook-form
- UI temporal: useState
- Modales/drawers: estado de visibilidad

## Sistema de Módulos

### Módulos Principales

| Módulo | Entidad Principal | Rutas |
|--------|-------------------|-------|
| Auth | User | /login, /register |
| Contacts | Contact | /contacts, /contacts/[id] |
| Pipeline | Deal | /pipeline |
| Tasks | Task | /tasks |
| Teams | Team | /teams, /teams/[id] |
| Calendar | CalendarEvent | /calendar |
| Reports | - | /reports |
| Training | TrainingMaterial | /training |
| Settings | User, Organization | /settings |
| Notifications | Notification | /notifications |
| Instagram | InstagramConversation | /instagram (opcional) |

### Dependencias entre Módulos
```
Auth (base)
    │
    ├── Contacts ──────┬── Deals (pipeline)
    │                   │
    │                   └── Tasks
    │
    ├── Teams ─────────── Goals
    │
    ├── Calendar
    │
    └── Instagram (opcional)
```

## Sistema de Eventos

### Notificaciones
```typescript
// Tipos de notificación
type NotificationType = "info" | "success" | "warning" | "error" | "task" | "goal" | "contact";

// Crear notificación
await createNotification({
  userId: "user-123",
  type: "task",
  title: "Tarea vencida",
  message: "La tarea 'Llamar a María' está vencida",
  actionUrl: "/tasks/123",
});
```

### Triggers Automáticos (Automation)
```typescript
// Trigger types
type TriggerType = "contact_activated" | "task_overdue" | "goal_near_target";

// AutomationConfig
{
  name: "Notificar tarea vencida",
  triggerType: "task_overdue",
  triggerConfig: { priority: "high" },
  enabled: true,
  webhookUrl: "https://api.example.com/webhook"
}
```

## Optimizaciones de Performance

### 1. Code Splitting
- Cada página se carga de forma independiente
- Componentes grandes con dynamic import

### 2. Caching
- TanStack Query con staleTime
- Service Worker para assets

### 3. Optimistic Updates
```tsx
const mutation = useMutation({
  mutationFn: updateTask,
  onMutate: async (newTask) => {
    await queryClient.cancelQueries({ queryKey: ["tasks"] });
    const previous = queryClient.getQueryData(["tasks"]);
    queryClient.setQueryData(["tasks"], (old) =>
      old.map((t) => t.id === newTask.id ? newTask : t)
    );
    return { previous };
  },
  onError: (err, newTask, context) => {
    queryClient.setQueryData(["tasks"], context.previous);
  },
});
```

### 4. Pagination
- Server-side pagination en listas grandes
- Cursor-based para datasets grandes

## Seguridad

### Autenticación
- bcrypt para passwords (costo 12)
- Session tokens con expiración
- HttpOnly cookies
- next-auth v4 para gestión segura

### Autorización
- Role-based access control (RBAC)
- Middleware de verificación
- Helper functions: `isAdmin()`, `canManageTeam()`

### Validación
- Zod schemas en API routes
- Sanitización de inputs
- Rate limiting (recomendado para producción)

## Escalabilidad

### Horizontal
- Stateless server design
- Database connection pooling
- CDN para assets estáticos

### Vertical
- Database indexing
- Query optimization
- Caching strategies

## Instagram Integration (Opcional)

El módulo de Instagram permite:
- Conectar cuentas de Instagram Business
- Sincronizar conversaciones
- Registrar mensajes y participantes
- Tracking de respuestas a anuncios

```
InstagramAccount
    └── InstagramConversation
            ├── InstagramMessage
            └── InstagramMessageTag
```

## Automation System

El sistema de automatización permite:
- Configurar triggers basados en eventos
- Ejecutar webhooks cuando se cumplen condiciones
- Notificaciones automáticas

```
Trigger Types:
- contact_activated: Cuando un contacto entra en una etapa
- task_overdue: Cuando una tarea se vence
- goal_near_target: Cuando un objetivo está cerca de cumplirse
```
