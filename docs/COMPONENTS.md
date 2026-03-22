# MaatWork UI Components - Especificación Completa

## Estructura de Componentes

```
src/components/
├── ui/                    # Componentes base de shadcn/ui
│   ├── button.tsx
│   ├── input.tsx
│   ├── card.tsx
│   ├── badge.tsx
│   ├── dialog.tsx
│   ├── dropdown-menu.tsx
│   ├── select.tsx
│   ├── checkbox.tsx
│   ├── switch.tsx
│   ├── tabs.tsx
│   ├── toast.tsx
│   ├── toaster.tsx
│   ├── sonner.tsx
│   ├── tooltip.tsx
│   ├── progress.tsx
│   ├── skeleton.tsx
│   ├── avatar.tsx
│   ├── alert.tsx
│   ├── separator.tsx
│   ├── pagination.tsx
│   ├── breadcrumb.tsx
│   ├── sheet.tsx
│   ├── drawer.tsx
│   ├── table.tsx
│   ├── form.tsx
│   ├── label.tsx
│   ├── textarea.tsx
│   ├── calendar.tsx
│   ├── popover.tsx
│   ├── command.tsx
│   ├── slider.tsx
│   ├── radio-group.tsx
│   ├── toggle.tsx
│   ├── toggle-group.tsx
│   ├── accordion.tsx
│   ├── collapsible.tsx
│   ├── context-menu.tsx
│   ├── menubar.tsx
│   ├── navigation-menu.tsx
│   ├── scroll-area.tsx
│   ├── resizable.tsx
│   ├── aspect-ratio.tsx
│   ├── alert-dialog.tsx
│   ├── carousel.tsx
│   ├── hover-card.tsx
│   └── input-otp.tsx
├── layout/                # Componentes de layout
│   ├── app-header.tsx
│   ├── app-sidebar.tsx
│   └── command-palette.tsx
├── brand/                 # Componentes de marca
│   ├── maatwork-logo.tsx
│   └── index.ts
├── providers.tsx          # Providers globales (QueryClient, Theme, etc.)
├── theme-toggle.tsx       # Toggle de tema claro/oscuro
└── notification-bell.tsx  # Campana de notificaciones
```

## Tabla de Contenidos

1. [Brand Components](#brand-components)
2. [Layout Components](#layout-components)
3. [Button](#button)
4. [Input](#input)
5. [Select](#select)
6. [Checkbox](#checkbox)
7. [Switch](#switch)
8. [Badge](#badge)
9. [Card](#card)
10. [Alert](#alert)
11. [Dialog](#dialog)
12. [Toast](#toast)
13. [Tooltip](#tooltip)
14. [DropdownMenu](#dropdownmenu)
15. [Tabs](#tabs)
16. [Pagination](#pagination)
17. [Breadcrumbs](#breadcrumbs)
18. [Skeleton](#skeleton)
19. [Progress](#progress)
20. [Drawer](#drawer)
21. [Table](#table)
22. [Form](#form)
23. [Providers](#providers)
24. [ThemeToggle](#themetoggle)
25. [NotificationBell](#notificationbell)

---

## BRAND COMPONENTS

### MaatworkLogo

**Ubicación:** `@/components/brand/maatwork-logo.tsx`

Logo de la marca MaatWork con soporte para modo claro/oscuro.

```tsx
import { MaatworkLogo } from "@/components/brand";

// Variantes
<MaatworkLogo variant="full" />    // Logo completo con texto
<MaatworkLogo variant="icon" />   // Solo icono
<MaatworkLogo variant="compact" /> // Version compacta
```

---

## LAYOUT COMPONENTS

### AppHeader

**Ubicación:** `@/components/layout/app-header.tsx`

Header principal de la aplicación con navegación y acciones de usuario.

```tsx
import { AppHeader } from "@/components/layout/app-header";

<AppHeader
  title="Dashboard"
  showNavToggle
  actions={<Button>Action</Button>}
/>
```

### AppSidebar

**Ubicación:** `@/components/layout/app-sidebar.tsx`

Sidebar de navegación principal de la aplicación.

```tsx
import { AppSidebar } from "@/components/layout/app-sidebar";

<AppSidebar
  items={sidebarItems}
  collapsed={isCollapsed}
  onToggle={() => setIsCollapsed(!isCollapsed)}
/>
```

### CommandPalette

**Ubicación:** `@/components/layout/command-palette.tsx`

Palette de comandos estilo Spotlight/Cmd+K para navegación rápida.

```tsx
import { CommandPalette } from "@/components/layout/command-palette";

<CommandPalette
  open={isOpen}
  onOpenChange={setIsOpen}
  items={commands}
  onSelect={(cmd) => handleCommand(cmd)}
/>
```

---

## BUTTON

**Ubicación:** `@/components/ui/button.tsx`

### Props

```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost' | 'destructive' | 'joy';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
}
```

### Variants

| Variant | Descripción | Estilo |
|---------|-------------|--------|
| `primary` | CTA principal | Purple background, white text, shadow-primary, hover:-translate-y-0.5 |
| `secondary` | Acciones secundarias | Black background, white text, hover:shadow-lg |
| `accent` | Success/growth | Green background, dark text, hover:shadow-lg |
| `joy` | Delight/warning | Orange background, white text |
| `outline` | Botón bordered | Transparent bg, purple border on hover |
| `ghost` | Botón transparente | Transparent, purple on hover |
| `destructive` | Peligro | Red background, white text |

### Sizes

| Size | Height | Padding | Gap |
|------|--------|---------|-----|
| `sm` | 36px (h-9) | px-3 py-1.5 | gap-1.5 |
| `md` | 40px (h-10) | px-4 py-2 | gap-2 |
| `lg` | 48px (h-12) | px-6 py-3 | gap-2.5 |

### Estados

- **Default**: Estilo base del variant
- **Hover**: `-translate-y-0.5` + shadow-lg + variant hover color
- **Active**: `scale-[0.98]` + `brightness-95`
- **Disabled**: `opacity-50 cursor-not-allowed`
- **Loading**: Spinner SVG + `cursor-wait`
- **Focus**: `ring-2 ring-offset-2` con color del variant

### Ejemplo de Uso

```tsx
<Button variant="primary" size="md">
  Guardar Cambios
</Button>

<Button variant="secondary" size="lg" fullWidth>
  Comenzar Prueba
</Button>

<Button variant="accent" loading={isLoading}>
  Procesando...
</Button>

<Button variant="destructive" size="sm">
  Eliminar
</Button>
```

---

## INPUT

**Ubicación:** `@/components/ui/input.tsx`

### Props

```typescript
interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string | null | undefined;
  placeholder?: string;
  leftIcon?: IconName | undefined;
  rightIcon?: IconName | undefined;
  onRightIconClick?: (() => void) | undefined;
  size?: 'sm' | 'md' | 'lg';
  showPasswordToggle?: boolean;
}
```

### Tamaños

| Size | Height | Padding | Icon Padding |
|------|--------|---------|-------------|
| `sm` | 36px (h-9) | px-3 | pl-10 / pr-10 |
| `md` | 40px (h-10) | px-3 | pl-10 / pr-10 |
| `lg` | 48px (h-12) | px-4 | pl-12 / pr-12 |

### Estados

- **Default**: `border-border`
- **Hover**: `border-border-hover`
- **Focus**: `ring-2 ring-primary/30 border-primary shadow-[0_0_0_3px_rgba(139,92,246,0.1)]`
- **Error**: `border-error focus:border-error focus:ring-error/30 animate-shake`
- **Disabled**: `opacity-50 cursor-not-allowed bg-surface`

### Ejemplo de Uso

```tsx
<Input
  label="Email"
  placeholder="tu@email.com"
  type="email"
/>

<Input
  label="Contraseña"
  type="password"
  showPasswordToggle
/>

<Input
  label="Buscar"
  placeholder="Escribe para buscar..."
  leftIcon="search"
  rightIcon="x"
  onRightIconClick={() => setValue('')}
/>

<Input
  label="Campo requerido"
  error="Este campo es obligatorio"
/>
```

---

## SELECT

**Ubicación:** `@/components/ui/select.tsx`

### Props

```typescript
interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  error?: string | null | undefined;
  placeholder?: string;
  options: SelectItem[];
  size?: 'sm' | 'md' | 'lg';
}

interface SelectItem {
  value: string;
  label: string;
  disabled?: boolean;
}
```

### Estados

- Default, Hover, Focus, Error, Disabled - igual que Input

### Ejemplo de Uso

```tsx
<Select
  label="Estado"
  placeholder="Selecciona un estado"
  options={[
    { value: 'active', label: 'Activo' },
    { value: 'inactive', label: 'Inactivo' },
    { value: 'pending', label: 'Pendiente', disabled: true },
  ]}
/>
```

---

## CHECKBOX

**Ubicación:** `@/components/ui/checkbox.tsx`

### Props

```typescript
interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string | null | undefined;
}
```

### Ejemplo de Uso

```tsx
<Checkbox label="Acepto los términos y condiciones" />
<Checkbox label="Suscribirse al newsletter" defaultChecked />
<Checkbox label="Opción deshabilitada" disabled />
```

---

## SWITCH

**Ubicación:** `@/components/ui/switch.tsx`

### Props

```typescript
interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}
```

### Ejemplo de Uso

```tsx
<Switch label="Modo oscuro" />
<Switch label="Notificaciones" defaultChecked />
```

---

## BADGE

**Ubicación:** `@/components/ui/badge.tsx`

### Props

```typescript
interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error' | 'joy' | 'info' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  children: React.ReactNode;
}
```

### Variants y Colores

| Variant | Background | Text | Border |
|---------|------------|------|--------|
| `default` | surface-hover | text | none |
| `primary` | primary-subtle | primary | primary/10 |
| `secondary` | secondary-subtle | secondary | secondary/10 |
| `accent` | accent-subtle | accent-hover | accent/10 |
| `success` | success-subtle | success | success/10 |
| `warning` | warning-subtle | warning | warning/10 |
| `error` | error-subtle | error | error/10 |
| `joy` | joy-subtle | joy-hover | joy/10 |
| `info` | info-subtle | info-hover | info/10 |
| `outline` | transparent | text | border |

### Sizes

| Size | Padding | Font Size |
|------|---------|-----------|
| `sm` | px-2 py-0.5 | text-xs |
| `md` | px-2.5 py-1 | text-sm |
| `lg` | px-3 py-1.5 | text-base |

### Ejemplo de Uso

```tsx
<Badge variant="primary">Nuevo</Badge>
<Badge variant="success">Activo</Badge>
<Badge variant="warning">Pendiente</Badge>
<Badge variant="error">Error</Badge>
<Badge variant="info">Info</Badge>
<Badge variant="accent" animated>¡Nuevo!</Badge>
```

---

## CARD

**Ubicación:** `@/components/ui/card.tsx`

### Props

```typescript
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'outlined' | 'elevated' | 'interactive' | 'highlight' | 'animated' | 'glass' | 'cyber';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  animated?: boolean;
  children: React.ReactNode;
}
```

### Variants

| Variant | Descripción |
|---------|-------------|
| `outlined` | Border + bg-background |
| `elevated` | shadow-md, sin border |
| `interactive` | Hover shadow + border transition |
| `highlight` | Border-left 4px secondary |
| `animated` | Hover lift + purple border |
| `glass` | Glassmorphism backdrop-blur |
| `cyber` | Cyberpunk style con gradients |

### Padding

| Size | Padding |
|------|---------|
| `none` | '' |
| `sm` | p-3 |
| `md` | p-4 |
| `lg` | p-6 |

### Sub-componentes

```tsx
<Card>
  <CardHeader>...</CardHeader>
  <CardTitle>Título</CardTitle>
  <CardDescription>Descripción</CardDescription>
  <CardContent>Contenido</CardContent>
  <CardFooter>Footer</CardFooter>
</Card>
```

---

## ALERT

**Ubicación:** `@/components/ui/alert.tsx`

### Props

```typescript
interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  description?: string;
}
```

### Variants

| Variant | Color | Icon |
|---------|-------|------|
| `info` | Blue | Info |
| `success` | Green | CheckCircle |
| `warning` | Orange | AlertTriangle |
| `error` | Red | XCircle |

### Ejemplo de Uso

```tsx
<Alert variant="info" title="Información">
  Este es un mensaje informativo.
</Alert>

<Alert variant="success" title="Éxito">
  Los cambios se guardaron correctamente.
</Alert>

<Alert variant="warning" title="Advertencia">
  Esta acción no se puede deshacer.
</Alert>

<Alert variant="error" title="Error">
  Ocurrió un problema al procesar tu solicitud.
</Alert>
```

---

## DIALOG

**Ubicación:** `@/components/ui/dialog.tsx`

### Sub-componentes

- `Dialog` - Contenedor principal
- `DialogTrigger` - Elemento que abre el dialog
- `DialogContent` - Contenido del dialog
- `DialogHeader` - Header del dialog
- `DialogFooter` - Footer del dialog
- `DialogTitle` - Título
- `DialogDescription` - Descripción
- `DialogClose` - Botón de cerrar

### Ejemplo de Uso

```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogTrigger asChild>
    <Button>Abrir Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Título</DialogTitle>
      <DialogDescription>Descripción</DialogDescription>
    </DialogHeader>
    <div>
      Contenido del dialog
    </div>
    <DialogFooter>
      <Button variant="ghost">Cancelar</Button>
      <Button variant="primary">Guardar</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

## TOAST

**Ubicación:** `@/components/ui/toast.tsx` y `@/components/ui/sonner.tsx`

### Uso con Sonner (Recomendado)

```tsx
import { toast } from "sonner";

// Variantes
toast.success("Operación exitosa");
toast.error("Ha ocurrido un error");
toast.warning("Advertencia");
toast.info("Información");
toast("Mensaje por defecto");
```

### Componentes

- `Toaster` - Componente para renderizar toasts
- `Toast` - Componente individual
- `ToastClose` - Botón de cerrar
- `ToastAction` - Acción en el toast

---

## TOOLTIP

**Ubicación:** `@/components/ui/tooltip.tsx`

### Props

```typescript
interface TooltipProps {
  content: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  children: React.ReactElement;
}
```

### Ejemplo de Uso

```tsx
<Tooltip content="Guardar cambios" side="top">
  <Button variant="primary">
    <Icon name="save" />
  </Button>
</Tooltip>
```

---

## DROPDOWNMENU

**Ubicación:** `@/components/ui/dropdown-menu.tsx`

### Sub-componentes

- `DropdownMenu` - Contenedor principal
- `DropdownMenuTrigger` - Elemento que activa el dropdown
- `DropdownMenuContent` - Contenido del dropdown
- `DropdownMenuItem` - Elemento individual
- `DropdownMenuSeparator` - Separador
- `DropdownMenuLabel` - Label de sección
- `DropdownMenuGroup` - Grupo de items
- `DropdownMenuCheckboxItem` - Item con checkbox
- `DropdownMenuRadioGroup` - Grupo de radio buttons
- `DropdownMenuRadioItem` - Radio button item

### Ejemplo de Uso

```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost">Menú</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem icon="user">Mi Perfil</DropdownMenuItem>
    <DropdownMenuItem icon="settings">Configuración</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem icon="log-out" destructive>
      Cerrar Sesión
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

---

## TABS

**Ubicación:** `@/components/ui/tabs.tsx`

### Sub-componentes

- `Tabs` - Contenedor principal
- `TabsList` - Lista de tabs
- `TabsTrigger` - Tab individual
- `TabsContent` - Contenido del tab

### Props Tabs

```typescript
interface TabsProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
}
```

### Ejemplo de Uso

```tsx
<Tabs defaultValue="account">
  <TabsList>
    <TabsTrigger value="account">Cuenta</TabsTrigger>
    <TabsTrigger value="password">Contraseña</TabsTrigger>
  </TabsList>
  <TabsContent value="account">
    Contenido de cuenta
  </TabsContent>
  <TabsContent value="password">
    Contenido de contraseña
  </TabsContent>
</Tabs>
```

---

## PAGINATION

**Ubicación:** `@/components/ui/pagination.tsx`

### Props

```typescript
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
  showFirstLast?: boolean;
}
```

---

## BREADCRUMBS

**Ubicación:** `@/components/ui/breadcrumb.tsx`

### Props

```typescript
interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

interface BreadcrumbItem {
  label: string;
  href?: string;
}
```

### Ejemplo de Uso

```tsx
<Breadcrumbs
  items={[
    { label: 'Inicio', href: '/' },
    { label: 'Contactos', href: '/contacts' },
    { label: 'Juan Pérez' },
  ]}
/>
```

---

## SKELETON

**Ubicación:** `@/components/ui/skeleton.tsx`

### Variants

```typescript
type SkeletonVariant = 'text' | 'circular' | 'rectangular';

interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
  className?: string;
}
```

### Sub-componentes

- `Skeleton` - Skeleton base
- `SkeletonGroup` - Grupo de skeletons
- `SkeletonCard` - Skeleton de tarjeta
- `SkeletonTable` - Skeleton de tabla
- `SkeletonText` - Skeleton de texto
- `SkeletonAvatar` - Skeleton circular
- `SkeletonGrid` - Grid de skeletons
- `SkeletonPageHeader` - Skeleton de header

---

## PROGRESS

**Ubicación:** `@/components/ui/progress.tsx`

### Props

```typescript
interface ProgressProps {
  value: number;
  max?: number;
  variant?: 'default' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

interface CircularProgressProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
}
```

---

## DRAWER

**Ubicación:** `@/components/ui/drawer.tsx`

### Props

```typescript
interface DrawerProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
  placement?: 'left' | 'right' | 'top' | 'bottom';
}
```

---

## TABLE

**Ubicación:** `@/components/ui/table.tsx`

### Sub-componentes

- `Table` - Contenedor principal
- `TableHeader` - Header de la tabla
- `TableBody` - Cuerpo de la tabla
- `TableFooter` - Footer de la tabla
- `TableRow` - Fila
- `TableHead` - Celda de header
- `TableCell` - Celda de datos
- `TableCaption` - Caption de la tabla

### Ejemplo de Uso

```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Nombre</TableHead>
      <TableHead>Email</TableHead>
      <TableHead>Estado</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {contacts.map((contact) => (
      <TableRow key={contact.id}>
        <TableCell>{contact.name}</TableCell>
        <TableCell>{contact.email}</TableCell>
        <TableCell>
          <Badge variant="success">Activo</Badge>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

---

## FORM

**Ubicación:** `@/components/ui/form.tsx`

### Uso con React Hook Form + Zod

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1, "Requerido"),
  email: z.string().email("Email inválido"),
});

const FormPage = () => {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "" },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => console.log(data))}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Enviar</Button>
      </form>
    </Form>
  );
};
```

### Sub-componentes

- `Form` - Contenedor del formulario
- `FormField` - Campo individual
- `FormItem` - Contenedor del campo
- `FormLabel` - Label del campo
- `FormControl` - Control de entrada
- `FormDescription` - Descripción
- `FormMessage` - Mensaje de error

---

## PROVIDERS

**Ubicación:** `@/components/providers.tsx`

Provider principal que envuelve la aplicación con configuración global.

```tsx
import { Providers } from "@/components/providers";

// En layout.tsx
export default function RootLayout({ children }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

Contiene:
- QueryClientProvider (TanStack Query)
- ThemeProvider (next-themes)
- TooltipProvider
- Sonner para toasts

---

## THEMETOGGLE

**Ubicación:** `@/components/theme-toggle.tsx`

Componente para alternar entre tema claro y oscuro.

```tsx
import { ThemeToggle } from "@/components/theme-toggle";

<ThemeToggle />
```

---

## NOTIFICATIONBELL

**Ubicación:** `@/components/notification-bell.tsx`

Campana de notificaciones con badge de contador.

```tsx
import { NotificationBell } from "@/components/notification-bell";

<NotificationBell
  unreadCount={5}
  onClick={() => router.push('/notifications')}
/>
```

---

## RESUMEN DE VARIABLES CSS UTILIZADAS

### Clases de Color (Tailwind)

```css
/* Backgrounds */
bg-primary, bg-primary-hover, bg-primary-light, bg-primary-subtle
bg-secondary, bg-secondary-hover, bg-secondary-light, bg-secondary-subtle
bg-accent, bg-accent-hover, bg-accent-light, bg-accent-subtle
bg-success, bg-success-hover, bg-success-subtle
bg-warning, bg-warning-hover, bg-warning-subtle
bg-error, bg-error-hover, bg-error-subtle
bg-info, bg-info-hover, bg-info-subtle
bg-surface, bg-surface-hover, bg-surface-light

/* Text */
text-primary, text-primary-hover, text-text-inverse
text-secondary, text-secondary-hover
text-accent, text-accent-hover
text-success, text-warning, text-error, text-info
text-text, text-text-secondary, text-text-muted

/* Borders */
border-primary, border-primary/10
border-secondary, border-secondary/10
border-accent, border-accent/10
border-border, border-border-hover
border-success, border-warning, border-error, border-info
```

### Clases de Sombra

```css
shadow-sm, shadow-md, shadow-lg, shadow-xl
shadow-primary, shadow-primary-lg
shadow-joy, shadow-accent
```

### Clases de Animación

```css
animate-pop, animate-shake, animate-fade-in-down
animate-spin, animate-bounce, animate-pulse
animate-float, animate-shimmer
```
