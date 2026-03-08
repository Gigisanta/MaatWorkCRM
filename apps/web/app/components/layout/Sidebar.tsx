// ============================================================
// MaatWork CRM — Sidebar Component
// UI/UX REFINED BY JULES v2
// ============================================================

import { Link, useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3,
  Bell,
  Calendar,
  CheckSquare,
  ChevronLeft,
  Feather,
  FileText,
  GraduationCap,
  HardDrive,
  Kanban,
  LayoutDashboard,
  Menu,
  Search,
  Settings,
  Shield,
  Sparkles,
  Users,
  UsersRound,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "~/lib/utils";

// Framer Motion variants for smoother transitions
const drawerVariants = {
  closed: { x: "-100%" },
  open: { x: 0 },
};

// Simple spacer for safe-area in mobile (inline style approach)
import type { CSSProperties } from "react";
const safeAreaTop: CSSProperties = { paddingTop: "env(safe-area-inset-top)" };
const safeAreaBottom: CSSProperties = { paddingBottom: "env(safe-area-inset-bottom)" };

// ============================================================
// MaatWork CRM — Sidebar Component
// UI/UX REFINED BY JULES v2
// ============================================================

// Define the sections matching the reference as much as possible
const sections = [
  {
    title: "Principal",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, external: false },
      { to: "/contacts", label: "Contactos", icon: Users, external: false },
      { to: "/pipeline", label: "Pipeline", icon: Kanban, external: false },
      { to: "/tasks", label: "Tareas", icon: CheckSquare, external: false },
      { to: "/teams", label: "Equipos", icon: UsersRound, external: false },
    ],
  },
  {
    title: "Plataformas",
    items: [
      { to: "https://finviz.com", label: "Finviz", icon: BarChart3, external: true },
      {
        to: "https://productores.balanz.com?forward=/home",
        label: "Productores Balanz",
        icon: LayoutDashboard,
        external: true,
      },
      { to: "https://agentes.zurich.com.ar/AgentLoginOkta", label: "Zurich Point", icon: Shield, external: true },
    ],
  },
  {
    title: "Recursos",
    items: [
      { to: "/training", label: "Capacitaciones", icon: GraduationCap, external: false },
      { to: "/resources", label: "Recursos", icon: FileText, external: false },
    ],
  },
  {
    title: "Gestión",
    items: [{ to: "/settings", label: "Configuración Global", icon: Settings, external: false }],
  },
  {
    title: "Google",
    items: [
      { to: "/calendar", label: "Calendario", icon: Calendar, external: false },
      { to: "/drive", label: "Drive", icon: HardDrive, external: false },
    ],
  },
];

export function Sidebar({ collapsed, setCollapsed }: { collapsed: boolean; setCollapsed: (val: boolean) => void }) {
  const router = useRouterState();
  const currentPath = router.location.pathname;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [currentPath]);

  // Close mobile drawer with Escape key
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileMenuOpen]);

  return (
    <>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-surface/80 backdrop-blur-2xl border-b border-border/50 safe-area-top transition-all duration-300 shadow-sm">
        <div className="flex h-16 items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-text-muted hover:bg-surface-hover hover:text-primary transition-all active:scale-95"
              aria-controls="mobile-drawer"
              aria-expanded={mobileMenuOpen}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center min-w-0 shrink-0">
              <Link to="/dashboard" className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white shadow-[0_0_20px_rgba(139,92,246,0.3)] group-hover:shadow-[0_0_25px_rgba(139,92,246,0.5)] group-hover:scale-105 transition-all duration-300 border border-white/10">
                  <Feather className="w-5 h-5" strokeWidth={2.5} />
                </div>
                <span className="text-xl font-bold tracking-tight font-display hidden sm:inline-flex">
                  <span className="text-text">Maat</span>
                  <span className="text-primary">Work</span>
                </span>
              </Link>
            </div>
          </div>

          <div className="flex items-center shrink-0 gap-3">
            {/* Global Search Trigger (Cmd+K) */}
            <button
              onClick={() => window.dispatchEvent(new CustomEvent("toggle-command-palette"))}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-hover border border-border/50 text-text-muted hover:text-text hover:border-border transition-all group active:scale-95"
            >
              <Search className="w-4 h-4 group-hover:text-primary transition-colors" />
              <span className="text-sm font-medium">Search...</span>
              <kbd className="hidden lg:inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface text-[10px] font-mono font-medium text-text-muted border border-border/50">
                <span className="text-xs">⌘</span>K
              </kbd>
            </button>

            {/* AI Copilot Trigger */}
            <button
              onClick={() => window.dispatchEvent(new CustomEvent("open-ai-copilot"))}
              className="relative p-2 rounded-xl text-text-muted hover:bg-primary/10 hover:text-primary transition-all group"
            >
              <Sparkles className="w-5 h-5 group-hover:animate-pulse" />
            </button>

            <button className="relative p-2 rounded-xl text-text-muted hover:bg-surface-hover hover:text-primary transition-all">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-accent rounded-full shadow-[0_0_8px_rgba(192,38,211,0.8)]" />
            </button>

            <div className="flex items-center gap-3 pl-4 border-l border-border/50 ml-1">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-semibold text-text leading-tight">Admin</p>
                <p className="text-xs text-success flex items-center justify-end gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                  Online
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-surface-hover flex items-center justify-center text-primary font-bold border border-border/50 shadow-sm cursor-pointer hover:bg-primary hover:text-white hover:shadow-[0_0_15px_rgba(139,92,246,0.3)] transition-all duration-300">
                A
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <motion.aside
        // Desktop sidebar expands/contracts with a smooth animation
        initial={{ width: collapsed ? 80 : 256 }}
        animate={{ width: collapsed ? 80 : 256 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={cn(
          "hidden lg:flex fixed left-0 top-16 h-[calc(100vh-4rem)] z-30 flex-col",
          "bg-surface/50 backdrop-blur-xl border-r border-border/40 overflow-x-hidden",
        )}
        style={{ width: collapsed ? 80 : 256 }}
      >
        <NavContent collapsed={collapsed} currentPath={currentPath} />

        {/* Toggle Collapse */}
        <div className="border-t border-border/40 p-4 shrink-0 bg-surface/50 backdrop-blur-md">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "w-full flex items-center h-12 rounded-xl transition-all duration-300 group active:scale-95",
              collapsed ? "justify-center px-0 bg-surface-hover" : "px-4 bg-surface-hover/50 hover:bg-surface-hover",
              "text-text-muted hover:text-primary border border-transparent hover:border-border/50",
            )}
          >
            <ChevronLeft className={cn("w-5 h-5 transition-transform duration-500", collapsed && "rotate-180")} />
            {!collapsed && <span className="ml-3 text-sm font-semibold tracking-wide">Collapse</span>}
          </button>
        </div>
      </motion.aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex" aria-label="Mobile menu open">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            {/* Drawer with touch drag support */}
            <motion.aside
              id="mobile-drawer"
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              drag="x"
              dragConstraints={{ left: -320, right: 0 }}
              dragElastic={0.2}
              onDragEnd={(e, info) => {
                if (info.offset.x > 120 || info.velocity.x > 800) {
                  setMobileMenuOpen(false);
                }
              }}
              className="relative w-[320px] max-w-[85vw] bg-surface h-full flex flex-col shadow-2xl border-r border-border/50"
              style={safeAreaTop}
              aria-label="Mobile Menu"
              role="dialog"
              aria-modal="true"
            >
              <div className="flex items-center justify-between p-6 border-b border-border/50 shrink-0" style={safeAreaTop}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white shadow-[0_0_20px_rgba(139,92,246,0.3)] border border-white/10">
                    <Feather className="w-5 h-5" strokeWidth={2.5} />
                  </div>
                  <span className="text-xl font-bold font-display">
                    <span className="text-text">Maat</span>
                    <span className="text-primary">Work</span>
                  </span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-hover text-text-muted hover:bg-error/10 hover:text-error transition-all"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <NavContent collapsed={false} currentPath={currentPath} isMobile />

              <div className="mt-auto p-6 border-t border-border/50 bg-surface-hover/30" style={safeAreaBottom}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-bold shadow-[0_0_15px_rgba(139,92,246,0.3)]">
                    A
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-text truncate">Admin User</p>
                    <p className="text-xs text-success flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                      Online
                    </p>
                  </div>
                </div>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

function NavContent({
  collapsed,
  currentPath,
  isMobile = false,
}: { collapsed: boolean; currentPath: string; isMobile?: boolean }) {
  const [openSections, setOpenSections] = useState<number[]>(() => sections.map((_, i) => i));
  const toggleSection = (idx: number) => {
    setOpenSections((prev) => (prev.includes(idx) ? prev.filter((n) => n !== idx) : [...prev, idx]));
  };

  return (
    <nav
      className={cn(
        "flex-1 overflow-y-auto overscroll-contain scroll-smooth space-y-8",
        isMobile ? "p-6" : collapsed ? "py-6 px-2" : "p-6",
      )}
    >
      {sections.map((section, idx) => {
        const isOpen = openSections.includes(idx);
        return (
          <div key={idx} className="space-y-2">
            <div
              className={cn(
                "flex items-center justify-between cursor-pointer",
                "text-text-muted uppercase tracking-wider text-xs font-semibold pl-3 mb-3",
                isMobile ? (isOpen ? "opacity-100" : "opacity-60") : "",
              )}
              onClick={() => toggleSection(idx)}
            >
              {section.title && !collapsed && (
                <span className="flex items-center gap-2">{section.title}</span>
              )}
              <motion.span animate={{ rotate: isOpen ? 180 : 0 }}>
                <ChevronLeft className={cn("w-4 h-4 transform transition-transform", isOpen ? "-rotate-90" : "")} />
              </motion.span>
            </div>
            {isOpen && (
              <motion.div layout initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} transition={{ duration: 0.2 }}>
                <div className="space-y-1 font-display">
                  {section.items.map((item) => {
                    const isActive = !item.external && currentPath.startsWith(item.to);

                    const linkClasses = cn(
                      "relative flex items-center rounded-xl transition-all duration-300 min-w-0 font-body group active:scale-[0.98]",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
                      collapsed ? "justify-center w-12 h-12 mx-auto" : "gap-3.5 px-3.5 py-3 w-full",
                      isActive
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-text-secondary hover:text-text hover:bg-surface-hover",
                    );

                    const content = (
                      <>
                        {isActive && (
                          <motion.div
                            layoutId="activeNavIndicator"
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full shadow-[0_0_10px_rgba(139,92,246,0.5)]"
                            initial={false}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                          />
                        )}
                        <item.icon
                          className={cn(
                            "shrink-0 transition-all duration-300",
                            collapsed ? "w-5 h-5" : "w-5 h-5",
                            isActive
                              ? "text-primary drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]"
                              : "group-hover:scale-110 group-hover:text-primary",
                          )}
                          strokeWidth={isActive ? 2.5 : 2}
                        />
                        {!collapsed && (
                          <span
                            className={cn(
                              "truncate tracking-tight",
                              isMobile ? "text-base" : "text-sm",
                              isActive ? "font-semibold" : "font-medium",
                            )}
                          >
                            {item.label}
                          </span>
                        )}
                      </>
                    );

                    if (item.external) {
                      return (
                        <a
                          key={item.to}
                          href={item.to}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={linkClasses}
                          title={collapsed ? item.label : undefined}
                        >
                          {content}
                        </a>
                      );
                    }

                    return (
                      <Link key={item.to} to={item.to} className={linkClasses} title={collapsed ? item.label : undefined}>
                        {content}
                      </Link>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
