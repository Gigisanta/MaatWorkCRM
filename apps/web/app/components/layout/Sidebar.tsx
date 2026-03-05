import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  Kanban,
  CheckSquare,
  UsersRound,
  BarChart3,
  GraduationCap,
  Settings,
  Shield,
  Bell,
  ChevronLeft,
  Menu,
  X,
  FileText,
  Feather
} from "lucide-react";
import { useState, useEffect } from "react";
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
    ]
  },
  {
    title: "Plataformas",
    items: [
      { to: "https://finviz.com", label: "Finviz", icon: BarChart3, external: true },
      { to: "https://productores.balanz.com?forward=/home", label: "Productores Balanz", icon: LayoutDashboard, external: true },
      { to: "https://agentes.zurich.com.ar/AgentLoginOkta", label: "Zurich Point", icon: Shield, external: true },
    ]
  },
  {
    title: "Recursos",
    items: [
      { to: "/training", label: "Capacitaciones", icon: GraduationCap },
      { to: "/resources", label: "Recursos", icon: FileText },
    ]
  },
  {
    title: "Gestión",
    items: [
      { to: "/settings", label: "Configuración Global", icon: Settings },
    ]
  }
];

export function Sidebar({ collapsed, setCollapsed }: { collapsed: boolean, setCollapsed: (val: boolean) => void }) {
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
      <header className="fixed top-0 left-0 right-0 z-40 bg-surface/80 backdrop-blur-md border-b border-border/50 safe-area-top transition-colors duration-300">
        <div className="flex h-12 sm:h-14 items-center justify-between px-2 xs:px-3 sm:px-4 lg:px-6">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-text-muted hover:bg-surface-hover hover:text-text transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center min-w-0 shrink-0">
              <Link to="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <span className="text-primary shrink-0">
                  <Feather className="w-7 h-7 sm:w-8 sm:h-8" strokeWidth={1.5} />
                </span>
                <span className="text-base sm:text-lg font-bold whitespace-nowrap shrink-0 hidden xs:inline">
                  <span className="text-primary">Maat</span>
                  <span className="text-secondary">Work</span>
                </span>
              </Link>
            </div>
          </div>

          <div className="flex items-center shrink-0 gap-2 sm:gap-3">
             <button className="p-2 rounded-full text-text-muted hover:bg-surface-hover transition-colors">
                <Bell className="w-5 h-5" />
             </button>
             <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-primary text-text-inverse flex items-center justify-center text-sm font-medium ring-2 ring-transparent hover:ring-primary/30 transition-all duration-200">
               A
             </div>
          </div>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex fixed left-0 top-[3rem] sm:top-[3.5rem] h-[calc(100vh-3rem)] sm:h-[calc(100vh-3.5rem)] z-30 flex-col",
          "bg-transparent border-r border-border transition-all duration-300 ease-in-out overflow-x-hidden",
          collapsed ? "w-16" : "w-52"
        )}
      >
        <NavContent collapsed={collapsed} currentPath={currentPath} />
        
        {/* Toggle Collapse */}
        <div className="border-t border-border pt-2 pb-2 px-2 shrink-0 bg-surface sm:bg-transparent">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "w-full flex items-center justify-center h-10 rounded-lg",
              "text-text-muted hover:text-text hover:bg-surface-hover transition-all duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              collapsed ? "px-0" : "px-3"
            )}
          >
            {collapsed ? <ChevronLeft className="w-4 h-4 rotate-180" /> : <ChevronLeft className="w-4 h-4" />}
            {!collapsed && <span className="ml-2 text-sm font-medium font-body">Colapsar</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative w-[280px] max-w-[80vw] bg-surface h-full flex flex-col shadow-xl animate-slide-in-left">
            <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-primary">
                  <Feather className="w-6 h-6" strokeWidth={1.5} />
                </span>
                <span className="text-lg font-bold">
                  <span className="text-primary">Maat</span>
                  <span className="text-secondary">Work</span>
                </span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-text-muted hover:bg-error-subtle hover:text-error transition-colors"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <NavContent collapsed={false} currentPath={currentPath} isMobile />
          </div>
        </div>
      )}
    </>
  );
}

function NavContent({ collapsed, currentPath, isMobile = false }: { collapsed: boolean, currentPath: string, isMobile?: boolean }) {
  return (
    <nav className={cn(
      "flex-1 overflow-y-auto overscroll-contain scroll-smooth space-y-3",
      isMobile ? "py-4 px-3" : "py-3 px-2"
    )}>
      {sections.map((section, idx) => (
        <div key={idx} className="space-y-1">
          {section.title && !collapsed && (
            <div className={cn(
              "text-text-muted uppercase tracking-wider text-xs font-semibold",
              isMobile ? "px-3 mb-2" : "px-2 mb-1"
            )}>
              {section.title}
            </div>
          )}
          <div className="space-y-1">
            {section.items.map((item) => {
              const isActive = !item.external && currentPath.startsWith(item.to);
              
              const linkClasses = cn(
                "relative flex items-center rounded-xl transition-all duration-200 min-w-0 max-w-full font-body",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
                collapsed ? "justify-center w-12 h-11" : isMobile ? "gap-3 px-4 py-3.5 w-full min-h-[52px]" : "gap-2 px-3 py-2 w-full",
                isActive 
                  ? "bg-primary text-text-inverse shadow-md" 
                  : "text-text-secondary hover:text-text hover:bg-surface-hover active:scale-[0.98]"
              );

              const content = (
                <>
                  <item.icon className={cn("shrink-0", collapsed || isMobile ? "w-[22px] h-[22px]" : "w-[18px] h-[18px]")} />
                  {!collapsed && (
                    <span className={cn("truncate flex-1 font-body", isMobile ? "text-base" : "text-sm")}>
                      {item.label}
                    </span>
                  )}
                </>
              );

              if (item.external) {
                return (
                  <a key={item.to} href={item.to} target="_blank" rel="noopener noreferrer" className={linkClasses} title={collapsed ? item.label : undefined}>
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
