# ERP.MaatWork - Análisis de Repositorio Remoto

**Fecha:** 2026-03-07
**Status:** En Progreso
**Objetivo:** Identificar todas las funcionalidades de ERP.MaatWork para copiarlas a MaatWorkCRM

---

## 1. Arquitectura General del Repositorio

### Stack Tecnológico Identificado:
- **Framework:** Next.js 15 (Frontend) + Express.js (Backend/API)
- **Base de Datos:** PostgreSQL con Drizzle ORM
- **Monorepo:** Turborepo + pnpm workspaces
- **Testing:** Playwright (E2E), Vitest (Unit)
- **Linter:** ESLint + Prettier

### Estructura de Aplicaciones:
1. `apps/web` - Frontend (Next.js 15)
2. `apps/api` - Backend (Express.js)
3. `apps/analytics-service` - Servicio de analytics separado

---

## 2. Módulos Principales Documentados (de RECONSTRUCCION_MAATWORK.md)

### Módulo 1: Identificación y Seguridad
- **Registro e Inicio de Sesión:** Clásico con email/contraseña y recuperación de contraseñas
- **Roles y Permisos:** Sistema de "Asesor normal" vs "Administrador"
- **Plan de Carrera (`Career Plan`):** Formas de medir el nivel del asesor (Junior, Senior, Senior+)
- **Inicio de sesión con Google:** Autenticación con OAuth de Google

### Módulo 2: Gestión de Clientes (El CRM Core)
- **Agenda de Contactos (`Contacts`):** Libreta de direcciones digital con búsquedas avanzadas
- **El Embudo de Ventas (`Pipeline`):** Vista tipo tabla que muestra en qué etapa está cada cliente potencial
- **Etiquetas y Segmentos (`Tags & Segments`):** Clasificar a los clientes
- **Notas y Archivos Adjuntos (`Notes & Attachments`):** Resúmenes de la lluvia de ideas y archivos PDF/DNIs
- **Tareas y Records (`Tasks`):** Tareas con estados (Pendiente, Completada), prioridades y repetitivas

### Módulo 3: Inversiones y Finanzas (Wealth Management)
- **Catálogo de Instrumentos (`Instruments`):** Lista de casas en las que se puede invertir
- **Integración con Brokers (`Broker Integration`):** Conexión con plataformas donde se realiza la inversión
- **AUM (Assets Under Management - Gestión de Activos):**
  - El sistema suma todo el dinero que el asesor está manejando para sus clientes
  - "snapshots" (fotos) mes a mes de cuánto dinero está gestionando
- **Portafolios (`Portfolios`):** "Cartas de Inversión"
- **Benchmarks:** Comparaciones de rendimiento (ej: cómo le va al portafolio de un cliente frente a lo que hizo el índice S&P 500)

### Módulo 4: Trabajo en Equipo
- **Equipos (`Teams`):** Grupos de trabajo
- **Membrecías del Equipo (`Team Memberships`):** Invitar a asesores a un equipo, aceptar invitaciones y definir quién es el líder
- **Metas de Equipo (`Team Goals`):** Objetivos mensuales (ej: "Conseguir $100,000 nuevos clientes este mes")
- **Calendario (`Calendar`):** Lugar centralizado para ver las reuniones del equipo

### Módulo 5: Automatizaciones y Alertas
- **Notificaciones:** Área donde el sistema avisa si un cliente nuevo se registra o si se cumple una meta
- **Automatizaciones (`Automations`):** Reglas de tipo "Si pasa esto, haz aquello"
- **Capacitaciones (`Capacitations`):** Un espacio donde los asesores pueden acceder a cursos o material de estudio

### Módulo 6: Reportes y Auditoría
- **Métricas y Analíticas (`Metrics & Analytics`):** Gráficos que muestran cuántos clientes nuevos hay, cuánto dinero en ingreso y cuánto va al cumplimiento del objetivo
- **Reportes:** Capacidad de exportar esta información
- **Auditoría (`Audit Logs`):** Un registro invisible que anota "Quién hizo qué y a qué hora"

---

## 3. Características Únicas No Presentes en MaatWorkCRM

### Alta Prioridad (Diferenciadores de Negocio):

1. **Sistema AUM (Assets Under Management)**
   - [ ] Gestión de activos bajo administración por asesor
   - [ ] Snapshots mensuales del portafolio de clientes
   - [ ] Seguimiento de crecimiento de AUM en el tiempo
   - [ ] Dashboard por organización/multi-tenancy
   - [ ] Permisos por rol dentro de organizaciones

2. **Integración con Brokers**
   - [ ] Conexión con plataformas de inversión externas
   - [ ] Sincronización de transacciones y posiciones
   - [ ] Precios de mercado en tiempo real
   - [ ] Actualización automática de portafolios

3. **Sistema de Plan de Carrera (`Career Plan`)**
   - [ ] Niveles de asesor: Junior, Senior, Senior+
   - [ ] Métricas de progresión basadas en AUM/comisiones
   - [ ] Definición de objetivos por nivel
   - [ ] Dashboard de progreso de carrera

4. **Portafolios y Benchmarks**
   - [ ] Gestión de portafolios de inversión por cliente
   - [ ] Comparación con benchmarks (S&P 500, índices)
   - [ ] Gráficos de rendimiento histórico
   - [ ] Análisis de desviación vs benchmark

### Media Prioridad (Mejoras de UX/Productividad):

5. **Sistema de Notificaciones Avanzado**
   - [ ] Centro de notificaciones centralizado
   - [ ] Priorización de alertas
   - [ ] Agrupación inteligente
   - [ ] Configuración de preferencias

6. **Automatizaciones de Negocio**
   - [ ] Motor de reglas "Si esto, entonces aquello"
   - [ ] Respuestas inmediatas optimistas (Optimistic UI)
   - [ ] Integración con servicios externos

7. **Sistema de Capacitaciones**
   - [ ] Repositorio de material de estudio
   - [ ] Videos, guías, documentos, cursos
   - [ ] Progreso de aprendizaje por usuario

8. **Importación Masiva**
   - [ ] Wizard de 7 pasos para importar clientes
   - [ ] Mapeo de columnas
   - [ ] Validación de datos
   - [ ] Preview de importación

### Baja Prioridad (Mejoras Visuales):

9. **Onboarding Tour**
   - [ ] Tour guiado para primeros usuarios
   - [ ] Celebración al completar onboarding
   - [ ] Tips contextualizados

10. **Paleta de Colores Premium**
    - [ ] Sistema de diseño consistentemente aplicado
    - [ ] Animaciones fluidas
    - [ ] Glassmorphism mejorado

---

## 4. Archivos Clave Identificados

### Documentación:
- `RECONSTRUCCION_MAATWORK.md` - Guía detallada de reconstrucción
- `REORGANIZACION_RESUMEN.md` - Resumen de reorganización
- `AGENTS.md` - Instrucciones para agentes
- `CHANGELOG.md` - Historial de cambios

### Imágenes de Referencia:
- `login_page_final.png` - Diseño final de página de login
- `production_debug_state.png` - Estado de depuración en producción
- `production_definitive_diagnostic.png` - Diagnóstico definitivo de producción

---

## 5. Comparación con MaatWorkCRM Actual

### Características ya implementadas en MaatWorkCRM:
✅ Autenticación (better-auth)
✅ Dashboard con KPIs
✅ Gestión de Contactos
✅ Pipeline (Kanban)
✅ Tareas
✅ Equipos y Metas
✅ Calendario
✅ Reportes
✅ Capacitaciones
✅ Configuración

### Características faltantes (GAP Analysis):

✅ **CONFIRMADAS - Encontradas en código de ERP.MaatWork:**

❌ **Sistema de Plan de Carrera** (`/apps/web/app/career-plan`)
   - Niveles de asesor: Junior, Senior, Senior+
   - Dashboard de progreso por nivel
   - Métricas de progresión

❌ **Portafolios y AUM** (`/apps/web/app/portfolios`)
   - Gestión de portafolios de inversión por cliente
   - Snapshots mensuales del AUM
   - Dashboard de activos bajo administración

❌ **Centro de Notificaciones** (`/apps/web/app/notifications`)
   - Panel centralizado de notificaciones
   - Priorización y agrupación
   - Historial de alertas

❌ **Motor de Automatizaciones** (`/apps/web/app/automations`)
   - Reglas tipo "Si esto, entonces aquello"
   - Automatizaciones de negocio
   - Respuestas optimísticas

❌ **Analytics Avanzado** (`/apps/web/app/analytics`)
   - Métricas detalladas
   - Análisis de tendencias
   - Reportes avanzados

❌ **Panel de Admin** (`/apps/web/app/admin`)
   - Gestión administrativa
   - Configuración del sistema
   - Auditoría avanzada

📋 **Aún no confirmadas (requiere más exploración):**
- Integración con brokers externos
- Benchmarks de rendimiento vs índices
- Importación masiva wizard
- Onboarding tour
- Multi-tenancy avanzada

---

## 6. Próximos Pasos

### COMPLETADO ✅:
1. ✅ **Análisis general del repositorio** - Stack tecnológico y estructura
2. ✅ **Deep Dive en apps/web** - Identificadas rutas principales
3. ✅ **Deep Dive en apps/api** - Estructura de backend (Express.js)

### PENDIENTE 📋:
4. **Explorar módulos específicos faltantes:**
   - `apps/web/app/career-plan` - Plan de carrera por niveles
   - `apps/web/app/portfolios` - Gestión de AUM y portafolios
   - `apps/web/app/notifications` - Centro de notificaciones
   - `apps/web/app/automations` - Motor de automatizaciones
   - `apps/web/app/analytics` - Analytics avanzado
   - `apps/web/app/admin` - Panel administrativo

5. **Explorar servicios backend:**
   - `apps/api/src/services` - Lógica de negocio
   - `apps/api/src/routes` - Endpoints REST
   - `apps/api/src/jobs` - Background jobs
   - `apps/api/src/monitoring` - Monitoreo del sistema

6. **Identificar patrones de diseño premium:**
   - Componentes UI reutilizables
   - Utilidades y hooks
   - Sistema de animaciones

---

**Análisis continúa...**
