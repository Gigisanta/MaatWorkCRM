# Esquema de Base de Datos

## Visión General

MaatWork CRM utiliza **Prisma ORM** con soporte para SQLite (desarrollo) y PostgreSQL (producción). El esquema consta de **26 tablas** organizadas en módulos funcionales.

## Diagrama Entidad-Relación

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         ORGANIZACIÓN                                    │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ Organization ──┬── Member ──── User                              │    │
│  │                │                                                │    │
│  │                ├── Contact ──┬── ContactTag ── Tag              │    │
│  │                │             ├── Deal                           │    │
│  │                │             ├── Task                           │    │
│  │                │             ├── Note                           │    │
│  │                │             └── PipelineStageHistory           │    │
│  │                │                                                │    │
│  │                ├── PipelineStage                                │    │
│  │                │                                                │    │
│  │                ├── Team ──┬── TeamMember                        │    │
│  │                │          └── TeamGoal                          │    │
│  │                │                                                │    │
│  │                ├── CalendarEvent                                │    │
│  │                ├── Notification                                 │    │
│  │                ├── TrainingMaterial                             │    │
│  │                ├── AuditLog                                     │    │
│  │                ├── InstagramAccount ──┬── InstagramConversation  │    │
│  │                │                      └── InstagramMessage       │    │
│  │                │                                                │    │
│  │                └── AutomationConfig                             │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
```

## Módulos

### 1. Autenticación (`auth`)

#### User
```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  username      String?   @unique // Login con username
  name          String?
  image         String?
  password      String?      // Hash bcrypt
  emailVerified DateTime?
  role          String    @default("member")
  careerLevel   String?      // junior, mid, senior, lead
  isActive      Boolean   @default(true)
  managerId     String?      // Para advisors, puntos a su manager
  phone         String?
  bio           String?
  settings      String?      // JSON string para preferencias

  // Relaciones
  sessions      Session[]
  accounts      Account[]
  contacts      Contact[]     @relation("AssignedContacts")
  tasks         Task[]        @relation("AssignedTasks")
  teams         Team[]        @relation("TeamLeader")
  teamMembers   TeamMember[]
  deals         Deal[]        @relation("AssignedDeals")
  notes         Note[]        @relation("NoteAuthor")
  notifications Notification[]
  auditLogs     AuditLog[]
  createdEvents CalendarEvent[] @relation("EventCreator")
  members       Member[]
  manager       User?          @relation("AdvisorManager", fields: [managerId], references: [id])
  advisors      User[]         @relation("AdvisorManager")
}
```

**Roles:**
| Rol | Descripción |
|-----|-------------|
| developer | Acceso completo técnico |
| dueno | Propietario de organización |
| owner | Propietario |
| manager | Gestor de equipos |
| admin | Administrador |
| advisor | Asesor financiero |
| asesor | Asesor (sinónimo) |
| staff | Personal |
| member | Miembro |

#### Session
```prisma
model Session {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  ipAddress String?
  userAgent String?

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

#### Account
```prisma
model Account {
  id           String  @id @default(cuid())
  userId       String
  accountId    String
  providerId   String  // credentials, google, etc.
  accessToken  String?
  refreshToken String?
  scope        String?
  idToken      String?
  expiresAt    DateTime?

  user         User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

#### Member
```prisma
model Member {
  id             String   @id @default(cuid())
  userId         String
  organizationId String
  role           String   @default("member") // owner, admin, member

  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  createdAt      DateTime @default(now())
}
```

#### Organization
```prisma
model Organization {
  id      String  @id @default(cuid())
  name    String
  slug    String  @unique
  logo    String?

  // Relaciones
  members          Member[]
  contacts         Contact[]
  pipelineStages   PipelineStage[]
  deals            Deal[]
  notes            Note[]
  tasks            Task[]
  tags             Tag[]
  segments         Segment[]
  teams            Team[]
  calendarEvents   CalendarEvent[]
  notifications    Notification[]
  trainingMaterials TrainingMaterial[]
  auditLogs        AuditLog[]
  instagramAccounts InstagramAccount[]
  automationConfigs AutomationConfig[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

---

### 2. CRM Core

#### Contact
```prisma
model Contact {
  id             String   @id @default(cuid())
  organizationId String
  name           String
  email          String?
  phone          String?
  company        String?
  emoji          String   @default("👤")
  segment        String?  // Premium, Estándar, Corporativo
  source         String?  // Referido, Evento, Website

  pipelineStageId String?
  pipelineStage   PipelineStage? @relation(...)

  assignedTo      String?
  assignedUser    User?    @relation(...)

  tags           ContactTag[]
  deals          Deal[]
  tasks          Task[]
  stageHistory   PipelineStageHistory[]

  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
}
```

#### PipelineStage
```prisma
model PipelineStage {
  id             String   @id @default(cuid())
  organizationId String
  name           String
  description    String?
  order          Int
  color          String   @default("#6366f1")
  wipLimit       Int?
  slaHours       Int?
  isDefault      Boolean  @default(false)
  isActive       Boolean  @default(true)

  contacts       Contact[]
  deals          Deal[]
  historyFrom    PipelineStageHistory[] @relation("FromStage")
  historyTo      PipelineStageHistory[] @relation("ToStage")

  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  createdAt      DateTime @default(now())
}
```

#### PipelineStageHistory
```prisma
model PipelineStageHistory {
  id              String   @id @default(cuid())
  organizationId  String
  contactId       String
  fromStageId     String?
  toStageId       String?
  reason          String?
  changedByUserId String?
  changedAt       DateTime @default(now())

  contact         Contact  @relation(fields: [contactId], references: [id], onDelete: Cascade)
  fromStage       PipelineStage? @relation("FromStage", fields: [fromStageId], references: [id])
  toStage         PipelineStage? @relation("ToStage", fields: [toStageId], references: [id])
}
```

**Etapas del Pipeline:**
| Etapa | Color | WIP Limit | SLA |
|-------|-------|-----------|-----|
| Prospecto | #6366f1 | - | 48h |
| Contactado | #8b5cf6 | 10 | 72h |
| Primera reunion | #f59e0b | 8 | 168h |
| Segunda reunion | #3b82f6 | 5 | 72h |
| Apertura | #10b981 | - | - |
| Cliente | #22c55e | - | - |
| Caido | #ef4444 | - | - |
| Cuenta vacia | #f97316 | - | - |

#### Deal
```prisma
model Deal {
  id                String   @id @default(cuid())
  organizationId    String
  contactId         String?
  stageId           String?
  title             String
  value             Float    @default(0)
  probability       Int      @default(50)
  expectedCloseDate DateTime?

  assignedTo        String?
  assignedUser      User?    @relation(...)

  contact           Contact? @relation(fields: [contactId], references: [id])
  stage             PipelineStage? @relation(fields: [stageId], references: [id])

  organization      Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

#### Task
```prisma
model Task {
  id             String    @id @default(cuid())
  organizationId String
  title          String
  description    String?
  status         String    @default("pending")
  priority       String    @default("medium")
  dueDate        DateTime?

  assignedTo     String?
  assignedUser   User?     @relation(...)

  contactId      String?
  contact        Contact?  @relation(fields: [contactId], references: [id])

  isRecurrent    Boolean   @default(false)
  recurrenceRule String?   // RRULE format (daily, weekly, monthly, etc.)
  parentTaskId   String?

  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  completedAt    DateTime?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
}
```

**Status:**
- pending
- in_progress
- completed
- cancelled

**Priority:**
- low
- medium
- high
- urgent

**Recurrence Rules (RRULE format):**
- daily
- weekly
- monthly
- Frecuencias más complejas con INTERVAL y COUNT

#### Note
```prisma
model Note {
  id             String   @id @default(cuid())
  organizationId String
  entityType     String   // contact, deal, task
  entityId       String
  content        String
  authorId       String?

  author         User?    @relation("NoteAuthor", fields: [authorId], references: [id])

  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@index([entityType, entityId])
}
```

---

### 3. Tags y Segmentos

#### Tag
```prisma
model Tag {
  id             String   @id @default(cuid())
  organizationId String
  name           String
  color          String   @default("#6366f1")
  icon           String?
  description    String?

  contactTags    ContactTag[]

  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  createdAt      DateTime @default(now())
}
```

#### ContactTag
```prisma
model ContactTag {
  id         String  @id @default(cuid())
  contactId  String
  tagId      String

  contact    Contact @relation(fields: [contactId], references: [id], onDelete: Cascade)
  tag        Tag     @relation(fields: [tagId], references: [id], onDelete: Cascade)
}
```

#### Segment
```prisma
model Segment {
  id             String   @id @default(cuid())
  organizationId String
  name           String
  description    String?
  filters        String?  // JSON string
  isDynamic      Boolean  @default(false)
  contactCount   Int      @default(0)

  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  lastRefreshedAt DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

---

### 4. Colaboración

#### Team
```prisma
model Team {
  id            String   @id @default(cuid())
  organizationId String
  name          String
  description   String?
  leaderId      String?

  leader        User?    @relation("TeamLeader", fields: [leaderId], references: [id])
  members       TeamMember[]
  goals         TeamGoal[]
  calendarEvents CalendarEvent[]

  organization  Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

#### TeamMember
```prisma
model TeamMember {
  id        String   @id @default(cuid())
  teamId    String
  userId    String
  role      String   @default("member") // member, leader

  team      Team     @relation(fields: [teamId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  joinedAt  DateTime @default(now())
}
```

#### TeamGoal
```prisma
model TeamGoal {
  id          String   @id @default(cuid())
  teamId      String
  title       String
  description String?
  type        String   // new_aum, new_clients, meetings, revenue, custom
  targetValue Float
  currentValue Float   @default(0)
  unit        String   // currency, count, percentage
  period      String   // 2026-03 format
  month       Int
  year        Int
  startDate   DateTime?
  endDate     DateTime?
  status      String   @default("active") // active, completed, missed, cancelled

  team        Team     @relation(fields: [teamId], references: [id], onDelete: Cascade)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

---

### 5. Calendario

#### CalendarEvent
```prisma
model CalendarEvent {
  id             String   @id @default(cuid())
  organizationId String
  teamId         String?
  title          String
  description    String?
  startAt        DateTime
  endAt          DateTime
  location       String?
  type           String   @default("meeting") // meeting, call, event, reminder

  createdBy      String?
  creator        User?    @relation("EventCreator", fields: [createdBy], references: [id])
  team           Team?    @relation(fields: [teamId], references: [id])

  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
```

**Event Types:**
- meeting
- call
- event
- reminder

---

### 6. Sistema

#### Notification
```prisma
model Notification {
  id             String   @id @default(cuid())
  userId         String
  organizationId String
  type           String   // info, success, warning, error, task, goal, contact
  title          String
  message        String
  isRead         Boolean  @default(false)
  actionUrl      String?

  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  createdAt      DateTime @default(now())
}
```

#### TrainingMaterial
```prisma
model TrainingMaterial {
  id             String   @id @default(cuid())
  organizationId String
  title          String
  description    String?
  url            String?
  content        String?
  category       String   @default("other") // course, video, document, guide, other
  createdBy      String?

  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
```

#### AuditLog
```prisma
model AuditLog {
  id             String   @id @default(cuid())
  organizationId String
  userId         String?
  action         String   // create, update, delete, login, logout, export, invite
  entityType     String   // contact, deal, task, user, organization, etc.
  entityId       String?
  description    String
  oldData        String?  // JSON string
  newData        String?  // JSON string
  ipAddress      String?
  userAgent      String?

  user           User?    @relation(fields: [userId], references: [id])
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  createdAt      DateTime @default(now())
}
```

---

### 7. Instagram Integration (Opcional)

#### InstagramAccount
```prisma
model InstagramAccount {
  id                   String   @id @default(cuid())
  organizationId       String
  userId               String
  pageId               String
  pageName             String?
  instagramUserId      String
  accessToken          String
  accessTokenExpiresAt DateTime?
  refreshToken         String?
  isActive             Boolean  @default(true)
  lastSyncedAt         DateTime?

  conversations        InstagramConversation[]

  organization         Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
}
```

#### InstagramConversation
```prisma
model InstagramConversation {
  id                    String   @id @default(cuid())
  accountId             String
  igConversationId      String   @unique
  contactId             String?
  participantIgId       String?
  participantUsername   String?
  participantProfileUrl String?
  participantName       String?
  lastMessageAt         DateTime?
  lastMessagePreview    String?
  unreadCount           Int      @default(0)
  respondedToAd         Boolean  @default(false)
  respondedToStory      Boolean  @default(false)
  iSentMessage          Boolean  @default(false)
  daysSinceLastContact  Int?

  account               InstagramAccount @relation(fields: [accountId], references: [id], onDelete: Cascade)
  messages              InstagramMessage[]
  tags                  InstagramMessageTag[]

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}
```

#### InstagramMessage
```prisma
model InstagramMessage {
  id              String   @id @default(cuid())
  conversationId  String
  igMessageId     String   @unique
  content         String?
  messageType     String   @default("text")
  fromIgUserId    String?
  fromMe          Boolean  @default(false)
  attachments     String?  // JSON string
  timestamp       DateTime

  conversation    InstagramConversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)

  createdAt       DateTime @default(now())
}
```

#### InstagramMessageTag
```prisma
model InstagramMessageTag {
  id             String   @id @default(cuid())
  conversationId String
  tag            String

  conversation   InstagramConversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)

  addedAt        DateTime @default(now())
}
```

---

### 8. Automation

#### AutomationConfig
```prisma
model AutomationConfig {
  id             String   @id @default(cuid())
  organizationId String
  name           String
  displayName    String?
  triggerType    String   // contact_activated, task_overdue, goal_near_target
  triggerConfig  String?  // JSON string
  enabled        Boolean  @default(true)
  config         String?  // JSON string
  webhookUrl     String?

  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
```

**Trigger Types:**
- contact_activated
- task_overdue
- goal_near_target

---

## Índices

### Índices Creados Automáticamente

Prisma crea índices automáticamente para:
- `@id` en todos los modelos
- `@unique` en campos únicos (email, username, slug, token, etc.)
- Claves foráneas (relation fields)

### Índices Adicionales

```sql
-- Notes - para búsqueda por entidad
CREATE INDEX note_entity ON Note(entityType, entityId);
```

---

## Migraciones

### Aplicar migraciones

```bash
bun run db:push    # Desarrollo (sin migraciones)
bun run db:migrate  # Producción (con migraciones)
bun run db:generate # Generar cliente Prisma
```

### Seed Data

```bash
bun run db:seed
```

El seed crea:
- 1 organización
- 5 usuarios
- 8 etapas del pipeline
- 5 tags
- 5 contactos
- 4 deals
- 4 tareas
- 1 equipo con 2 objetivos
- 2 notificaciones
- 2 materiales de capacitación

---

## Backups

### SQLite
```bash
cp prisma/dev.db prisma/backups/dev-$(date +%Y%m%d).db
```

### PostgreSQL
```bash
pg_dump maatwork > backup-$(date +%Y%m%d).sql
```

---

## Resumen de Tablas

| Módulo | Tablas |
|--------|--------|
| Auth | User, Session, Account, Member, Organization |
| CRM Core | Contact, PipelineStage, PipelineStageHistory, Deal, Task, Note |
| Tags | Tag, ContactTag, Segment |
| Colaboración | Team, TeamMember, TeamGoal |
| Calendario | CalendarEvent |
| Sistema | Notification, TrainingMaterial, AuditLog |
| Instagram | InstagramAccount, InstagramConversation, InstagramMessage, InstagramMessageTag |
| Automation | AutomationConfig |
| **Total** | **26 tablas** |
