# Design Doc: Sidebar Enhancement (Mobile Responsiveness & Desktop Transitions)

**Date:** 2026-03-07
**Status:** Approved
**Topic:** Enhance the MaatWork CRM sidebar with mobile-first gestures, smooth desktop transitions, and safe area support.

## 1. Overview
The current sidebar provides basic functionality but lacks the "premium" feel expected in a modern CRM. This enhancement focuses on touch-friendly interactions for mobile and seamless layout transitions for desktop.

## 2. Architecture & Components
- **Sidebar.tsx**: Main component handling both desktop and mobile views.
- **_app.tsx**: Layout component that synchronizes its margin with the sidebar's width.

## 3. Design Details

### 3.1 Mobile Drawer & Touch Gestures
- **Gestures**: Implement `drag="x"` using Framer Motion on the mobile drawer.
  - `dragConstraints={{ left: -320, right: 0 }}`.
  - `onDragEnd` logic: Close the drawer if the drag distance exceeds a threshold (e.g., 100px).
- **Visuals**: 
  - Add a vertical "drag handle" on the right edge of the drawer.
  - Use `backdrop-blur-2xl` for the drawer background.
- **Safe Areas**: Apply `pb-[env(safe-area-inset-bottom)]` to the navigation content.

### 3.2 Desktop Transitions
- **Synchronization**: Use a CSS variable `--sidebar-width` to control the sidebar's width and the main content's margin.
- **Animation**: Apply `transition-all duration-500 ease-in-out` to both the sidebar and the main content container in `_app.tsx`.
- **Breakpoints**: 
  - Mobile: `< 1024px` (lg).
  - Desktop: `>= 1024px`.

### 3.3 Accessibility
- **Touch Targets**: Ensure all navigation items have a minimum height of 48px on mobile.
- **Focus States**: Maintain high-contrast focus rings for keyboard users.

## 4. Data Flow
- **State**: `collapsed` (boolean) and `mobileMenuOpen` (boolean) managed in `_app.tsx` and `Sidebar.tsx` respectively.
- **Events**: Continue using the `open-ai-copilot` and `toggle-command-palette` custom events.

## 5. Testing Plan
- **Manual**: Verify swipe-to-close on mobile devices/emulators.
- **Visual**: Ensure no layout "jank" when toggling the sidebar on desktop.
- **Safe Areas**: Test on devices with notches (e.g., iPhone) to ensure no content overlap.
