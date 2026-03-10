# Plan de Implementación - MaatWork CRM

## Overview
3 cambios a implementar:
1. **Sidebar**: Remover "Plan de Carrera" de navegación
2. **Tags System**: Implementar UI para el schema existente
3. **Contacts Table**: Cambiar avatars a emojis con opción de modificar

---

## Fase 1: Sidebar Modification

### Objetivo
Remover "Plan de Carrera" de la navegación manteniendo CareerProgressBar en el header.

### Archivos a modificar:
| Archivo | Cambio |
|---------|--------|
| `apps/web/app/components/layout/Sidebar.tsx` | Línea 395: remover item `{ to: "/career-plan", label: "Plan de Carrera", icon: Zap }` |

### Estado: ✅ Listo para implementar

---

## Fase 2: Tags System

### Objetivo
Implementar UI completa para el sistema de tags existente en la base de datos.

### Schema existente (ya en crm.ts):
- **tags**: id, organizationId, scope, name, color, icon, description, pipelineStageId, isAutoAssign, businessLine (inversiones/zurich/patrimonial), isSystem
- **contactTags**: id, contactId, tagId, monthlyPremium, policyNumber
- **tagRules**: Auto-assignment rules

### Archivos a crear:
| Archivo | Propósito |
|---------|-----------|
| `apps/web/app/components/tags/TagBadge.tsx` | Componente badge para mostrar tags |
| `apps/web/app/components/tags/TagSelector.tsx` | Dropdown para seleccionar/agregar tags |
| `apps/web/app/components/tags/TagsManager.tsx` | Modal CRUD para gestión de tags |

### Archivos a modificar:
| Archivo | Cambio |
|---------|--------|
| `apps/web/server/functions/tags.ts` | Crear funciones CRUD: getTags, createTag, updateTag, deleteTag |
| `apps/web/app/lib/hooks/use-tags.ts` | Crear hooks: useTags, useCreateTag, useUpdateTag, useDeleteTag |
| `apps/web/app/routes/_app/contacts/index.tsx` | Integrar TagSelector en columna de tags |
| `apps/web/app/routes/_app/contacts/$contactId.tsx` | Agregar gestión de tags en drawer |

### Dependencias a verificar:
- Funciones server existentes para tags
- Hooks de tags si ya existen

### Estado: ⚠️ Requiere investigación de funciones existentes

---

## Fase 3: Contacts Table Enhancement

### Objetivo
Cambiar avatars de letra a emoji con opción de modificar, y aplicar colores según stage.

### Archivos a modificar:
| Archivo | Cambio |
|---------|--------|
| `apps/web/app/routes/_app/contacts/index.tsx` | Líneas 126-127: Cambiar avatar a emoji con selector |
| `apps/web/app/components/contacts/AvatarPicker.tsx` | Crear componente para seleccionar emoji |

### Especificaciones:
- **Avatar emoji**: Mostrar emoji en lugar de primera letra
- **Selector**: Click en avatar abre selector de emojis
- **Stage colors** (ya definidos en contacts/index.tsx líneas 49-54):
  - lead: blue
  - prospect: pink  
  - active: emerald
  - inactive: slate
- **Indicador de stage**: Ya existe en línea 129-133 (check verde)

### Estado: ✅ Listo para implementar

---

## Orden de Implementación

1. **Fase 1**: Sidebar - Simple, sin dependencias
2. **Fase 3**: Contacts Table - UI simple, sin dependencias de backend
3. **Fase 2**: Tags System - Requiere más trabajo, puede hacerse en paralelo o después

---

## Tareas Específicas

### Tarea 1.1: Remover "Plan de Carrera" del Sidebar
- [ ] Editar Sidebar.tsx línea 395, remover item de navegación
- [ ] Verificar CareerProgressBar sigue funcionando (línea 460)

### Tarea 3.1: Agregar campo emoji a contacts
- [ ] Editar `apps/web/server/db/schema/crm.ts`
- [ ] Agregar `emoji: text("emoji").default("")` después de `name`

### Tarea 3.2: Crear AvatarPicker Component
- [ ] Crear `apps/web/app/components/contacts/AvatarPicker.tsx`
- [ ] Incluir: selector de emojis, preview, guardar/cancelar

### Tarea 3.3: Actualizar Contacts Table
- [ ] Modificar columna "Contacto" en contacts/index.tsx
- [ ] Reemplazar `<div className="w-10 h-10 rounded-xl bg-gradient-to-br...">{contact.name.charAt(0)}</div>` por AvatarPicker
- [ ] Agregar state para emoji del contacto

### Tarea 2.1: Verificar funciones de Tags
- [ ] Buscar functions/tags.ts o crear si no existe
- [ ] Verificar que contactTags tenga relación con contacts

### Tarea 2.2: Crear hooks de Tags
- [ ] Crear `apps/web/app/lib/hooks/use-tags.ts`
- [ ] Funciones: useTags, useContactTags, useAddTagToContact, useRemoveTagFromContact

### Tarea 2.3: Integrar TagSelector en UI
- [ ] Crear TagBadge component
- [ ] Crear TagSelector con dropdown
- [ ] Integrar en contacts table y drawer
- [ ] Crear TagsManager para CRUD

---

## Notas Adicionales

- **Tags existentes**: Balanz, Z.invest, Z.options, Patrimonial (isSystem=true)
- **businessLine enum**: inversiones, zurich, patrimonial
- **Tags Storage**: Los tags se almacenan como JSON array en `contacts.tags` (NO en contactTags)
- **Avatar emoji**: Requiere agregar campo `emoji` a la tabla contacts
- **contactTags table**: Existe pero no está activa actualmente (potential future use)
