# User Schema

## Modelo de Usuario (Prisma)

El esquema de usuario está definido en `prisma/schema.prisma`.

```prisma
model User {
  id            String    @id @default(cuid())
  email         String   @unique
  username      String?  @unique
  fullName      String
  phone         String?
  role          String   @default("member")
  isActive      Boolean  @default(true)
  image         String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  accounts      Account[]
  sessions      Session[]
  organization  Organization @relation(fields: [organizationId], references: [id])
  organizationId String
}
```

## Roles

| Rol | Descripción |
|-----|-------------|
| `owner` | Propietario de la organización |
| `manager` | Manager de equipo |
| `leader` | Líder de equipo |
| `member` | Usuario estándar |

**Nota:** El rol se asigna durante el registro.

## Campos del Schema

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | String | ID único (CUID) |
| `email` | String | Email único del usuario |
| `username` | String? | Nombre de usuario (opcional, único) |
| `fullName` | String | Nombre completo |
| `phone` | String? | Número de teléfono |
| `role` | String | Rol del usuario |
| `isActive` | Boolean | Estado del usuario |
| `image` | String? | URL de imagen de perfil |
| `organizationId` | String | ID de la organización |
| `createdAt` | DateTime | Fecha de creación |
| `updatedAt` | DateTime | Fecha de actualización |

## API Routes Relacionadas

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/auth/register` | Registro de usuario |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/session` | Obtener sesión |
| GET | `/api/users` | Lista de usuarios |
| GET | `/api/users/[id]` | Usuario por ID |
| PUT | `/api/users/[id]` | Actualizar usuario |
| PUT | `/api/users/[id]/settings` | Actualizar settings |

## Validación

### Registro

```typescript
const registerSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['member', 'leader', 'manager', 'owner']),
});
```

### Login

```typescript
const loginSchema = z.object({
  identifier: z.string().min(1), // email o username
  password: z.string().min(1),
});
```
