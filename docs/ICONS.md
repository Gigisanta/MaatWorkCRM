# MaatWork CRM - Iconos y Elementos Visuales

## Librería de Iconos

**Paquete:** `lucide-react`

No hay wrapper de Icon custom - se importan directamente de `lucide-react`.

### Importación

```tsx
import { Bell, Users, Settings, Check, Plus } from 'lucide-react';

// Uso directo
<Bell size={20} />
<Users size={24} className="text-muted-foreground" />
```

---

## Iconos Principales

### Navegación

| Icono | Uso |
|-------|-----|
| `LayoutDashboard` | Dashboard |
| `Users` | Contactos, Equipos |
| `Target` | Pipeline |
| `CheckSquare` | Tareas |
| `Calendar` | Calendario |
| `BarChart3` | Reportes |
| `GraduationCap` | Capacitación |
| `Settings` | Configuración |
| `Menu` | Menú móvil |
| `ChevronLeft` / `ChevronRight` | Navegación |
| `X` | Cerrar |

### Acciones

| Icono | Uso |
|-------|-----|
| `Plus` | Agregar, Crear |
| `Check` | Confirmar |
| `Search` | Buscar |
| `Edit` | Editar |
| `Trash2` | Eliminar |
| `Download` | Descargar |
| `RefreshCw` | Recargar |
| `Eye` / `EyeOff` | Mostrar/Ocultar |

### Estado

| Icono | Uso |
|-------|-----|
| `CheckCircle` | Éxito |
| `AlertCircle` | Info |
| `AlertTriangle` | Advertencia |
| `XCircle` | Error |
| `Info` | Información |

### Misc

| Icono | Uso |
|-------|-----|
| `Bell` | Notificaciones |
| `LogOut` | Cerrar sesión |
| `Loader` | Cargando |
| `ExternalLink` | Links externos |
| `MoreVertical` | Menú contextual |

---

## Componentes UI

El proyecto usa **shadcn/ui** para componentes. Ubicación: `src/components/ui/`

### Componentes Principales

| Componente | Archivo | Uso |
|------------|---------|-----|
| Button | `button.tsx` | Botones |
| Input | `input.tsx` | Inputs |
| Card | `card.tsx` | Tarjetas |
| Badge | `badge.tsx` | Badges |
| Dialog | `dialog.tsx` | Modales |
| DropdownMenu | `dropdown-menu.tsx` | Menús dropdown |
| Tabs | `tabs.tsx` | Tabs |
| Select | `select.tsx` | Selectores |
| Sheet | `sheet.tsx` | Drawers |
| Toast | `toast.tsx` / `sonner.tsx` | Notificaciones |

---

## Animaciones

### Framer Motion

El proyecto usa **Framer Motion** para animaciones.

```tsx
import { motion } from 'framer-motion';

// Ejemplo de fade in
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
>
  {children}
</motion.div>

// Ejemplo de stagger
<motion.div
  initial="hidden"
  animate="show"
  variants={{
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  }}
>
```

### Clases CSS de Animación

El proyecto usa Tailwind CSS con animaciones predefinidas:

```tsx
// Transiciones
<Button className="transition-all duration-200 hover:scale-105" />

// Opacity
<div className="opacity-0 hover:opacity-100" />

// Transform
<div className="hover:-translate-y-1" />
```

---

## Badges

**Archivo:** `src/components/ui/badge.tsx`

```tsx
<Badge variant="default">Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="outline">Outline</Badge>
<Badge variant="destructive">Destructive</Badge>
```

---

## Skeleton Loading

**Archivo:** `src/components/ui/skeleton.tsx`

```tsx
import { Skeleton } from "@/components/ui/skeleton";

<Skeleton className="w-full h-4" />
<Skeleton className="w-12 h-12 rounded-full" />
```

---

## Toasts (Sonner)

**Archivo:** `src/components/ui/sonner.tsx`

```tsx
import { toast } from 'sonner';

toast.success('Guardado correctamente');
toast.error('Error al guardar');
toast.info('Información');
```

Usage en componentes:
```tsx
import { Toaster } from "@/components/ui/sonner";

<Toaster position="bottom-right" richColors closeButton />
```

---

## Lucide Icon Sizes Standard

| Uso | Size |
|-----|------|
| Sidebar items | 20px |
| Botones con texto | 16px |
| Iconos solos | 20-24px |
| Badges | 14px |
| Inputs | 16px |

---

## SVG Favicon

El favicon es un SVG inline definido en el layout o en `app/icon.tsx`.

---

## Gradients y Decorativos

El proyecto usa gradientes CSS para fondos:

```css
/* Gradiente de fondo típico */
bg-gradient-to-br from-purple-900/20 via-transparent to-green-900/20

/* Glass effect */
backdrop-blur-xl bg-white/5 border border-white/10
```
