# MaatWork CRM - Documentación Técnica

## 📋 Resumen

MaatWork CRM es un sistema de gestión de relaciones con clientes construido con:
- **Frontend**: React 19, TanStack Start, TanStack Query, TailwindCSS
- **Backend**: Nitro (Vercel), better-auth
- **Base de datos**: PostgreSQL (Neon)
- **Autenticación**: better-auth con email/password y Google OAuth

## 🚀 Inicio Rápido

### Requisitos
- Node.js >= 20
- pnpm >= 9

### Instalación

```bash
# Instalar dependencias
pnpm install

# Iniciar servidor de desarrollo
pnpm dev
```

El servidor estará disponible en: http://localhost:3000

## 📁 Estructura del Proyecto

```
MaatWorkCRM/
├── apps/
│   └── web/                    # Aplicación principal
│       ├── app/               # Código fuente del frontend
│       │   ├── components/    # Componentes React
│       │   ├── hooks/        # Custom hooks
│       │   ├── lib/          # Utilidades y librerías
│       │   ├── routes/       # Rutas de TanStack Router
│       │   └── routeTree.gen.ts  # Árbol de rutas generado
│       ├── server/            # Código del servidor
│       │   ├── auth/         # Configuración de better-auth
│       │   ├── db/           # Conexión a BD y esquemas
│       │   └── functions/    # Funciones server-side
│       ├── e2e/              # Tests end-to-end
│       └── package.json
├── package.json                # Workspace root
└── pnpm-workspace.yaml
```

## 🔧 Configuración

### Variables de Entorno

Crea un archivo `apps/web/.env` con:

```env
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
BETTER_AUTH_SECRET=your-secret-key
BETTER_AUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

**Nota**: Las variables de producción están configuradas en Vercel. No commitsear archivos con secretos.

### Base de Datos

```bash
# Generar migraciones
pnpm db:generate

# Ejecutar migraciones
pnpm db:migrate

# Poblar con datos de prueba
pnpm db:seed
```

## 🧪 Testing

```bash
# Tests unitarios
pnpm test

# Tests e2e con Playwright
pnpm test:e2e
```

### Tests e2e Disponibles
- `e2e/auth-flow.spec.ts` - Flujo de autenticación
- `e2e/dashboard.spec.ts` - Dashboard y navegación
- `e2e/contacts-tasks.spec.ts` - Contactos y tareas

## 🌐 Deployment

### Vercel (Producción)

El proyecto está conectado a GitHub. Cada push a `main` triggeréa un deployment.

1. Push a `main`: `git push origin main`
2. Vercel detecta el cambio automáticamente
3. Variables de entorno se configuran en el dashboard de Vercel

### URLs de Producción
- Dashboard: https://crm.maat.work/dashboard
- Login: https://crm.maat.work/login

## 🔐 Autenticación

### better-auth Configuración

El sistema usa better-auth con:
- Email/password: Habilitado
- Google OAuth: Configurado con scopes para Calendar y Drive
- Sesiones: 7 días de duración

### Rutas Protegidas
- `/dashboard`
- `/contacts`
- `/pipeline`
- `/tasks`
- `/calendar`
- `/teams`
- `/reports`

Todas redirigen a `/login` si no hay sesión activa.

## 📊 Características del CRM

### Módulos Implementados
1. **Dashboard** - KPIs y métricas
2. **Contactos** - Directorio de clientes
3. **Pipeline** - Kanban de oportunidades
4. **Tareas** - Gestión de actividades
5. **Calendario** - Integración con Google Calendar
6. **Equipos** - Gestión de asesores

### Base de Datos
- Esquemas para: contacts, deals, tasks, organizations, users
- Tablas de auditoría y métricas
- Perfiles financieros de contactos

## 🐛 Solución de Problemas

### Error: "DATABASE_URL not set"
Asegúrate de que el archivo `.env` existe en `apps/web/` y las variables están cargadas correctamente.

### Error de Build en Vercel
- Verifica que los archivos con node modules solo se usen en server
- Los archivos en `app/lib/` deben ser client-safe

### Errores de Autenticación
- Verifica `BETTER_AUTH_SECRET` y `BETTER_AUTH_URL`
- Confirma que la URL está en `trustedOrigins`

## 📝 Comandos Útiles

```bash
# Desarrollo
pnpm dev              # Iniciar servidor
pnpm build           # Build de producción
pnpm lint            # Verificar código

# Base de datos
pnpm db:generate     # Generar migraciones
pnpm db:migrate      # Ejecutar migraciones
pnpm db:push         # Push esquema a BD
pnpm db:seed         # Poblar datos

# Testing
pnpm test            # Tests unitarios
pnpm test:e2e        # Tests e2e
```

## 🔗 Enlaces

- [Neon](https://neon.tech) - Base de datos PostgreSQL
- [better-auth](https://www.better-auth.com) - Autenticación
- [TanStack Start](https://tanstack.com/start) - Framework
- [Vercel](https://vercel.com) - Hosting
