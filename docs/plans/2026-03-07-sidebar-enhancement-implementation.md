# Sidebar Enhancement Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enhance the MaatWork CRM sidebar with mobile-first gestures, smooth desktop transitions, and safe area support.

**Architecture:** Use Framer Motion for gestures and layout animations. Synchronize sidebar width with main content using CSS variables for a cohesive transition.

**Tech Stack:** React, TanStack Router, Framer Motion, Tailwind CSS v4.

---

### Task 1: Implement CSS Variable for Sidebar Width

**Files:**
- Modify: `apps/web/app/components/layout/Sidebar.tsx`
- Modify: `apps/web/app/routes/_app.tsx`

**Step 1: Define CSS variable in Sidebar.tsx**
Update the `Sidebar` component to set a CSS variable `--sidebar-width` on the root element or a shared parent.

```tsx
// apps/web/app/components/layout/Sidebar.tsx
export function Sidebar({ collapsed, setCollapsed }: { collapsed: boolean; setCollapsed: (val: boolean) => void }) {
  // ...
  const sidebarWidth = collapsed ? "80px" : "256px";
  
  useEffect(() => {
    document.documentElement.style.setProperty('--sidebar-width', sidebarWidth);
  }, [sidebarWidth]);
  // ...
}
```

**Step 2: Use CSS variable in _app.tsx**
Update the `main` element in `_app.tsx` to use the `--sidebar-width` variable for its margin.

```tsx
// apps/web/app/routes/_app.tsx
<main
  className={cn(
    "app-main flex-1 min-w-0 min-h-screen transition-all duration-500 ease-in-out",
    "lg:ml-[var(--sidebar-width,256px)]", // Use the variable
    "px-4 sm:px-6 lg:px-8",
    // ...
  )}
>
```

**Step 3: Verify transition**
Run the app and toggle the sidebar. The main content should slide smoothly in sync with the sidebar.

**Step 4: Commit**
```bash
git add apps/web/app/components/layout/Sidebar.tsx apps/web/app/routes/_app.tsx
git commit -m "feat: sync sidebar width with main content using CSS variables"
```

---

### Task 2: Enhance Mobile Drawer with Drag Gestures

**Files:**
- Modify: `apps/web/app/components/layout/Sidebar.tsx`

**Step 1: Add drag handle and Framer Motion drag props**
Update the mobile drawer `motion.div` to include `drag="x"` and a drag handle.

```tsx
// apps/web/app/components/layout/Sidebar.tsx
<motion.div
  drag="x"
  dragConstraints={{ left: 0, right: 0 }} // We'll handle the close logic in onDragEnd
  dragElastic={0.1}
  onDragEnd={(e, info) => {
    if (info.offset.x < -100) {
      setMobileMenuOpen(false);
    }
  }}
  className="relative w-[320px] max-w-[85vw] bg-surface h-full flex flex-col shadow-2xl border-r border-border/50"
>
  {/* Drag Handle */}
  <div className="absolute right-2 top-1/2 -translate-y-1/2 w-1.5 h-12 bg-border/50 rounded-full lg:hidden" />
  {/* ... */}
</motion.div>
```

**Step 2: Refine backdrop blur**
Update the backdrop overlay to use `backdrop-blur-2xl`.

```tsx
// apps/web/app/components/layout/Sidebar.tsx
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  className="fixed inset-0 bg-background/60 backdrop-blur-2xl z-[-1]" // Increased blur
  onClick={() => setMobileMenuOpen(false)}
/>
```

**Step 3: Verify gestures**
Test the mobile drawer by dragging it to the left. It should close when dragged past the threshold.

**Step 4: Commit**
```bash
git add apps/web/app/components/layout/Sidebar.tsx
git commit -m "feat: add swipe-to-close gesture to mobile drawer"
```

---

### Task 3: Safe Areas and Touch Targets

**Files:**
- Modify: `apps/web/app/components/layout/Sidebar.tsx`

**Step 1: Add safe area padding to NavContent**
Ensure the navigation content respects the bottom safe area on mobile.

```tsx
// apps/web/app/components/layout/Sidebar.tsx
function NavContent({ ... }) {
  return (
    <nav
      className={cn(
        "flex-1 overflow-y-auto overscroll-contain scroll-smooth space-y-8",
        isMobile ? "p-6 pb-[env(safe-area-inset-bottom,24px)]" : collapsed ? "py-6 px-2" : "p-6",
      )}
    >
      {/* ... */}
    </nav>
  );
}
```

**Step 2: Improve touch targets**
Increase the vertical padding of navigation items on mobile.

```tsx
// apps/web/app/components/layout/Sidebar.tsx
const linkClasses = cn(
  // ...
  collapsed ? "justify-center w-12 h-12 mx-auto" : "gap-3.5 px-3.5 py-3 w-full",
  isMobile && "py-4", // Larger touch target for mobile
  // ...
);
```

**Step 3: Verify safe areas**
Check the layout on a mobile emulator with a notch.

**Step 4: Commit**
```bash
git add apps/web/app/components/layout/Sidebar.tsx
git commit -m "style: improve safe area support and touch targets for mobile"
```

---

### Task 4: Final Polish and Diagnostics

**Files:**
- Modify: `apps/web/app/components/layout/Sidebar.tsx`

**Step 1: Run Biome lint/format**
Run: `pnpm --filter web lint:fix`

**Step 2: Check LSP diagnostics**
Run: `lsp_diagnostics apps/web/app/components/layout/Sidebar.tsx`

**Step 3: Final Commit**
```bash
git commit -m "chore: final polish and linting for sidebar enhancement"
```
