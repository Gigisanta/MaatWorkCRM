# MaatWork CRM - Sistema de Layout y Navegación

## Arquitectura de Layout

### Jerarquía de Layouts

```
Root Layout (src/app/layout.tsx)
├── ThemeProvider (next-themes)
├── Providers
│   ├── QueryClientProvider (TanStack Query)
│   └── AuthProvider
├── {children}
└── Toaster (sonner)
```

---

## Root Layout

**Archivo:** `src/app/layout.tsx`

### Estructura

```tsx
export default function RootLayout({ children }) {
  return (
    <html lang="es" className="dark">
      <body className={`${dmSans.variable} ${outfit.variable} ${geistMono.variable}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          forcedTheme="dark"
        >
          <Providers>
            {children}
            <Toaster position="bottom-right" richColors closeButton />
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### Fonts

```tsx
// DM Sans - Primary font
const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  weight: ["300", "400", "500", "600", "700"],
});

// Outfit - Secondary font
const outfit = Outfit({
  variable: "--font-outfit",
  weight: ["400", "500"],
});

// Geist Mono - Monospace
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
});
```

---

## Providers

**Archivo:** `src/components/providers.tsx`

```tsx
export function Providers({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </QueryClientProvider>
  );
}
```

### TanStack Query Config

```tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,      // 1 minuto
      refetchOnWindowFocus: false,
    },
  },
});
```

---

## Sidebar

**Archivo:** `src/components/layout/app-sidebar.tsx`

### Navegación

```typescript
const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Contactos", href: "/contacts", icon: Users },
  { name: "Pipeline", href: "/pipeline", icon: Target },
  { name: "Tareas", href: "/tasks", icon: CheckSquare },
  { name: "Calendario", href: "/calendar", icon: Calendar },
  { name: "Equipos", href: "/teams", icon: Users },
  { name: "Reportes", href: "/reports", icon: BarChart3 },
  { name: "Capacitación", href: "/training", icon: GraduationCap },
  { name: "Configuración", href: "/settings", icon: Settings },
];
```

### Estados

| Estado | Ancho | Descripción |
|--------|-------|-------------|
| Expanded | 280px | Normal, muestra labels |
| Collapsed | 80px | Solo iconos, tooltips |
| Mobile Open | 100% | Full-width overlay |
| Mobile Closed | - | Hidden (translate-x-full) |

### Clases CSS Principales

```css
/* Sidebar container */
fixed left-0 top-0 z-40 h-screen
bg-[#08090B]/95 backdrop-blur-xl
border-r border-white/5

/* Nav items */
bg-[#8B5CF6]/15 text-[#A78BFA] border border-[#8B5CF6]/25  /* Active */
text-slate-400 hover:text-white hover:bg-white/5              /* Hover */

/* User section */
border-t border-white/5
```

### Responsividad

| Dispositivo | Navegación |
|-------------|------------|
| Desktop (>1024px) | Sidebar colapsable |
| Mobile (<1024px) | Sidebar como overlay + botón hamburger |

---

## Command Palette

**Archivo:** `src/components/layout/command-palette.tsx`

### Atajos de Teclado

| Atajo | Acción |
|-------|--------|
| `Cmd+K` / `Ctrl+K` | Abrir command palette |
| `Escape` | Cerrar |
| `↑` / `↓` | Navegar opciones |
| `Enter` | Seleccionar |

### Features

- Búsqueda de páginas
- Quick actions
- Navegación rápida

---

## Theme System

### Configuración

```tsx
<ThemeProvider
  attribute="class"
  defaultTheme="dark"
  enableSystem={false}
  forcedTheme="dark"
/>
```

### Toggle de Tema

**Archivo:** `src/components/theme-toggle.tsx`

Permite cambiar entre tema claro y oscuro. Persiste en localStorage.

---

## Auth Provider

**Archivo:** `src/lib/auth-context.tsx`

### API

```typescript
interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  session: SessionData | null;
  login: (email, password, rememberMe?) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  mutateUser: (user) => void;
}
```

### Auto-refresh

El session se auto-refresca cada 5 minutos y sincroniza entre tabs via localStorage.

---

## Responsive Breakpoints

| Breakpoint | px | Dispositivo |
|------------|-----|-------------|
| sm | 640px | Tablets portrait |
| md | 768px | Tablets landscape |
| lg | 1024px | Laptops |
| xl | 1280px | Desktops |
| 2xl | 1536px | Large desktops |

---

## Estructura de Archivos

| Archivo | Propósito |
|---------|-----------|
| `src/app/layout.tsx` | Root layout |
| `src/components/providers.tsx` | Providers (QueryClient + Auth) |
| `src/components/layout/app-sidebar.tsx` | Sidebar con navegación |
| `src/components/layout/app-header.tsx` | Header (si existe) |
| `src/components/layout/command-palette.tsx` | Command palette |
| `src/components/theme-toggle.tsx` | Toggle de tema |
| `src/components/notification-bell.tsx` | Campana de notificaciones |
| `src/components/brand/maatwork-logo.tsx` | Logo |
| `src/lib/auth-context.tsx` | Contexto de autenticación |
| `src/lib/auth-helpers.ts` | Helpers de autorización |

---

## Componentes UI

El proyecto usa **shadcn/ui** ubicado en `src/components/ui/`:

```
src/components/ui/
├── button.tsx
├── input.tsx
├── card.tsx
├── badge.tsx
├── dialog.tsx
├── dropdown-menu.tsx
├── tabs.tsx
├── select.tsx
├── textarea.tsx
├── form.tsx
├── sonner.tsx      # Toaster
├── sidebar.tsx     # Sidebar de shadcn
├── sheet.tsx       # Drawer
└── ... (40+ componentes más)
```
