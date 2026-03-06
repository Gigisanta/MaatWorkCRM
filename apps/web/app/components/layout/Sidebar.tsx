import { Link, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  Bell,
  CheckSquare,
  ChevronLeft,
  Feather,
  FileText,
  GraduationCap,
  Kanban,
  LayoutDashboard,
  Menu,
  Settings,
  Shield,
  Users,
  UsersRound,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "~/lib/utils";

// Define the sections matching the reference as much as possible
const sections = [
  {
    title: "Principal",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/contacts", label: "Contactos", icon: Users },
      { to: "/pipeline", label: "Pipeline", icon: Kanban },
      { to: "/tasks", label: "Tareas", icon: CheckSquare },
      { to: "/teams", label: "Equipos", icon: UsersRound },
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
      { to: "/training", label: "Capacitaciones", icon: GraduationCap },
      { to: "/resources", label: "Recursos", icon: FileText },
    ],
  },
  {
    title: "Gestión",
    items: [{ to: "/settings", label: "Configuración Global", icon: Settings }],
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

  return (
    <>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-surface/90 backdrop-blur-xl border-b border-border/50 safe-area-top transition-all duration-300 shadow-sm">
        <div className="flex h-16 items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-text-muted hover:bg-surface-hover hover:text-primary transition-all active:scale-95"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center min-w-0 shrink-0">
              <Link to="/dashboard" className="flex items-center gap-2 group">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-primary group-hover:scale-105 transition-transform duration-300">
                  <Feather className="w-6 h-6" strokeWidth={2.5} />
                </div>
                <span className="text-xl font-black tracking-tight font-display hidden xs:inline-flex">
                  <span className="text-text">Maat</span>
                  <span className="text-primary">Work</span>
                </span>
              </Link>
            </div>
          </div>

          <div className="flex items-center shrink-0 gap-4">
            <button className="relative p-2.5 rounded-xl text-text-muted hover:bg-surface-hover hover:text-primary transition-all">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-error rounded-full border-2 border-white" />
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-border/50 ml-2">
              <div className="hidden sm:block text-right">
                <p className="text-xs font-bold text-text uppercase tracking-widest leading-tight">Admin</p>
                <p className="text-[10px] text-text-muted font-medium">asesor@maatwork.com</p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-surface-100 flex items-center justify-center text-primary font-black border border-border shadow-sm group cursor-pointer hover:bg-primary hover:text-white transition-all duration-300">
                A
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex fixed left-0 top-16 h-[calc(100vh-4rem)] z-30 flex-col",
          "bg-surface border-r border-border/40 transition-all duration-300 ease-in-out overflow-x-hidden",
          collapsed ? "w-20" : "w-64",
        )}
      >
        <NavContent collapsed={collapsed} currentPath={currentPath} />

        {/* Toggle Collapse */}
        <div className="border-t border-border/40 p-4 shrink-0 bg-surface">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "w-full flex items-center h-12 rounded-2xl transition-all duration-300 group active:scale-95",
              collapsed ? "justify-center px-0 bg-surface-100" : "px-4 bg-surface-50 hover:bg-surface-100",
              "text-text-muted hover:text-primary",
            )}
          >
            <ChevronLeft className={cn("w-5 h-5 transition-transform duration-500", collapsed && "rotate-180")} />
            {!collapsed && (
              <span className="ml-3 text-sm font-bold font-display uppercase tracking-widest">Colapsar</span>
            )}
          </button>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-secondary/60 backdrop-blur-md transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-[320px] max-w-[85vw] bg-surface h-full flex flex-col shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between p-6 border-b border-border/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-primary">
                  <Feather className="w-6 h-6" strokeWidth={2.5} />
                </div>
                <span className="text-xl font-black font-display font-display">
                  <span className="text-text">Maat</span>
                  <span className="text-primary">Work</span>
                </span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-100 text-text-muted hover:bg-error/10 hover:text-error transition-all"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <NavContent collapsed={false} currentPath={currentPath} isMobile />

            <div className="mt-auto p-6 border-t border-border/50 bg-surface-50/50">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center font-bold">
                  A
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-text truncate">Admin User</p>
                  <p className="text-xs text-text-muted truncate">asesor@maatwork.com</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function NavContent({
  collapsed,
  currentPath,
  isMobile = false,
}: { collapsed: boolean; currentPath: string; isMobile?: boolean }) {
  return (
    <nav
      className={cn(
        "flex-1 overflow-y-auto overscroll-contain scroll-smooth space-y-8",
        isMobile ? "p-6" : collapsed ? "py-6 px-2" : "p-6",
      )}
    >
      {sections.map((section, idx) => (
        <div key={idx} className="space-y-3">
          {section.title && !collapsed && (
            <div
              className={cn(
                "text-text-muted uppercase tracking-[0.2em] text-[10px] font-black pl-3 mb-2",
                isMobile ? "opacity-60" : "",
              )}
            >
              {section.title}
            </div>
          )}
          <div className="space-y-1.5 font-display">
            {section.items.map((item) => {
              const isActive = !item.external && currentPath.startsWith(item.to);

              const linkClasses = cn(
                "relative flex items-center rounded-2xl transition-all duration-300 min-w-0 font-body group active:scale-[0.98]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                collapsed ? "justify-center w-14 h-14 mx-auto" : "gap-4 px-4 py-3.5 w-full",
                isActive
                  ? "bg-primary text-white shadow-primary"
<<<<<<< HEAD
                  : "text-text-secondary hover:text-primary hover:bg-primary/5",
=======
                  : "text-text-secondary hover:text-primary hover:bg-primary/5"
>>>>>>> origin/feat/maatwork-redesign-jules-v2-6433543738996844966
              );

              const content = (
                <>
                  <item.icon
                    className={cn(
                      "shrink-0 transition-transform group-hover:scale-110",
                      collapsed ? "w-6 h-6" : "w-5 h-5",
                    )}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  {!collapsed && (
                    <span className={cn("truncate font-bold tracking-tight", isMobile ? "text-base" : "text-sm")}>
                      {item.label}
                    </span>
                  )}
                  {isActive && !collapsed && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
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
        </div>
      ))}
    </nav>
  );
}
