import * as Dialog from "@radix-ui/react-dialog";
import * as Popover from "@radix-ui/react-popover";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  Bell,
  Bug,
  CheckSquare,
  ChevronLeft,
  Feather,
  FileText,
  GraduationCap,
  Kanban,
  LayoutDashboard,
  Lightbulb,
  LogOut,
  Menu,
  MessageSquare,
  Settings,
  Shield,
  Sparkles,
  User,
  Users,
  UsersRound,
  X,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { cn } from "~/lib/utils";
import { useNotifications } from "../../hooks/useNotifications";

// Mock user data (replace with actual auth data when available)
const mockUser = {
  name: "Admin User",
  email: "asesor@maatwork.com",
  initial: "A",
  role: "Administrador",
  careerLevel: "Senior Advisor",
  careerProgress: 72,
};

// Career Progress Bar Component
function CareerProgressBar() {
  return (
    <button
      onClick={() => (window.location.href = "/career-plan")}
      className="hidden lg:flex flex-col items-start gap-1.5 px-4 py-2 rounded-lg bg-surface-100/50 hover:bg-surface-100 border border-border/30 transition-all duration-150 group cursor-pointer min-w-[180px]"
    >
      <div className="flex items-center justify-between w-full">
        <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">{mockUser.careerLevel}</span>
        <Zap className="w-3 h-3 text-primary opacity-60 group-hover:opacity-100 transition-opacity" />
      </div>
      <div className="w-full flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-surface rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-150"
            style={{ width: `${mockUser.careerProgress}%` }}
          />
        </div>
        <span className="text-[10px] font-black text-primary">{mockUser.careerProgress}%</span>
      </div>
    </button>
  );
}

// Notification Button with Popover
function NotificationButton() {
  const { notifications } = useNotifications();
  const unreadCount = notifications.filter((n) => !n.read).length;
  const [open, setOpen] = useState(false);
  const [detailNotification, setDetailNotification] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const openDetail = useCallback((n: any) => {
    setDetailNotification(n);
    setDetailOpen(true);
  }, []);

  // Simple notification list for popover
  const recentNotifications = notifications.slice(0, 5);

  return (
    <>
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <button className="relative p-2.5 rounded-lg text-text-muted hover:bg-surface-hover hover:text-primary transition-all group">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-error rounded-full border-2 border-white text-[10px] font-black text-white flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            className="w-80 bg-surface border border-border/50 rounded-lg shadow-lg p-4 z-50"
            sideOffset={8}
            align="end"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-text">Notificaciones</h3>
              <Popover.Close className="text-text-muted hover:text-text transition-colors">
                <X className="w-4 h-4" />
              </Popover.Close>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {recentNotifications.length === 0 ? (
                <p className="text-xs text-text-muted text-center py-4">No hay notificaciones</p>
              ) : (
                recentNotifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => openDetail(n)}
                    className={cn(
                      "p-3 rounded-lg cursor-pointer transition-all hover:bg-surface-hover",
                      n.read ? "opacity-60" : "bg-surface-100",
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <span
                        className={cn(
                          "w-2 h-2 mt-1.5 rounded-full shrink-0",
                          n.priority === "high" ? "bg-error" : n.priority === "medium" ? "bg-warning" : "bg-info",
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-text truncate">{n.message}</p>
                        <p className="text-[10px] text-text-muted mt-0.5">
                          {new Date(n.timestamp).toLocaleString("es-ES", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <Link
              to="/tasks"
              className="block mt-3 text-center text-xs font-bold text-primary hover:text-primary-light transition-colors"
            >
              Ver todas las notificaciones
            </Link>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>

      {/* Detail Dialog */}
      <Dialog.Root open={detailOpen} onOpenChange={setDetailOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-surface border border-border/50 rounded-lg shadow-xl p-6 z-50">
            <div className="flex items-start justify-between mb-4">
              <Dialog.Title className="text-lg font-bold text-text">Detalles</Dialog.Title>
              <Dialog.Close className="text-text-muted hover:text-text transition-colors">
                <X className="w-5 h-5" />
              </Dialog.Close>
            </div>
            {detailNotification && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                      detailNotification.priority === "high"
                        ? "bg-error/20 text-error"
                        : detailNotification.priority === "medium"
                          ? "bg-warning/20 text-warning"
                          : "bg-info/20 text-info",
                    )}
                  >
                    {detailNotification.priority}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-100 text-text-muted">
                    {detailNotification.type}
                  </span>
                </div>
                <p className="text-sm text-text">{detailNotification.message}</p>
                <p className="text-xs text-text-muted">
                  {new Date(detailNotification.timestamp).toLocaleString("es-ES")}
                </p>
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}

// Profile Dropdown
function ProfileDropdown() {
  const menuItems = [
    { icon: User, label: "Perfil", href: "/settings" },
    { icon: Settings, label: "Configuración", href: "/settings" },
  ];

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button className="flex items-center gap-3 pl-4 border-l border-border/50 ml-2 hover:bg-surface-hover rounded-lg pr-2 py-1.5 transition-all group">
          <div className="hidden sm:block text-right">
            <p className="text-xs font-bold text-text uppercase tracking-widest leading-tight">{mockUser.name}</p>
            <p className="text-[10px] text-text-muted font-medium">{mockUser.email}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-black border border-primary/20 group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all duration-150">
            {mockUser.initial}
          </div>
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="w-56 bg-surface border border-border/50 rounded-lg shadow-lg p-2 z-50"
          sideOffset={8}
          align="end"
        >
          <div className="px-3 py-2 mb-2 border-b border-border/30">
            <p className="text-sm font-bold text-text">{mockUser.name}</p>
            <p className="text-xs text-text-muted">{mockUser.email}</p>
            <p className="text-[10px] text-primary font-medium mt-1">{mockUser.role}</p>
          </div>
          <div className="space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-text-muted hover:text-text hover:bg-surface-hover transition-all group"
              >
                <item.icon className="w-4 h-4 group-hover:text-primary transition-colors" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            ))}
          </div>
          <div className="mt-2 pt-2 border-t border-border/30">
            <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-error hover:bg-error/10 transition-all group">
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Cerrar sesión</span>
            </button>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

// Feedback Modal
function FeedbackModal() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"bug" | "feature" | "improvement">("improvement");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    // Simulate submission
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setSubmitting(false);
    setSubmitted(true);

    // Reset after showing success
    setTimeout(() => {
      setOpen(false);
      setTitle("");
      setDescription("");
      setType("improvement");
      setSubmitted(false);
    }, 1500);
  }, []);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className="p-2.5 rounded-lg text-text-muted hover:bg-surface-hover hover:text-accent transition-all group">
          <MessageSquare className="w-5 h-5" />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-surface border border-border/50 rounded-lg shadow-xl p-6 z-50">
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-lg font-bold text-text flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-accent" />
              Enviar Feedback
            </Dialog.Title>
            <Dialog.Close className="text-text-muted hover:text-text transition-colors">
              <X className="w-5 h-5" />
            </Dialog.Close>
          </div>

          {submitted ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success/20 flex items-center justify-center">
                <Zap className="w-8 h-8 text-success" />
              </div>
              <p className="text-lg font-bold text-text">¡Gracias por tu feedback!</p>
              <p className="text-sm text-text-muted mt-1">Lo tendremos en cuenta para mejorar.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Tipo</label>
                <div className="flex gap-2">
                  {(["bug", "feature", "improvement"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={cn(
                        "flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all",
                        type === t
                          ? t === "bug"
                            ? "bg-error text-white"
                            : t === "feature"
                              ? "bg-primary text-white"
                              : "bg-accent text-white"
                          : "bg-surface-100 text-text-muted hover:bg-surface-hover",
                      )}
                    >
                      {t === "bug" ? (
                        <>
                          <Bug className="w-3 h-3 mr-1" />
                          Bug
                        </>
                      ) : t === "feature" ? (
                        <>
                          <Sparkles className="w-3 h-3 mr-1" />
                          Feature
                        </>
                      ) : (
                        <>
                          <Lightbulb className="w-3 h-3 mr-1" />
                          Mejora
                        </>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Título</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Breve descripción..."
                  className="w-full px-4 py-3 rounded-lg bg-surface-100 border border-border/30 text-text placeholder:text-text-muted focus:outline-none focus:border-primary transition-all"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Descripción</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Cuéntanos más detalles..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg bg-surface-100 border border-border/30 text-text placeholder:text-text-muted focus:outline-none focus:border-primary transition-all resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-4 rounded-lg bg-primary text-white font-bold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-4 h-4" />
                    Enviar Feedback
                  </>
                )}
              </button>
            </form>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// Define the sections matching the reference as much as possible
type NavItem = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  external?: boolean;
};

const sections: { title?: string; items: NavItem[] }[] = [
  {
    title: "Principal",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/contacts", label: "Contactos", icon: Users },
      { to: "/pipeline", label: "Pipeline", icon: Kanban },
      { to: "/tasks", label: "Tareas", icon: CheckSquare },
      { to: "/teams", label: "Equipos", icon: UsersRound },
      { to: "/career-plan", label: "Plan de Carrera", icon: Zap },
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
    items: [
      { to: "/settings", label: "Configuración Global", icon: Settings },
      { to: "/feedback", label: "Feedback", icon: MessageSquare },
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

  return (
    <>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-surface border-b border-border/50 safe-area-top transition-all duration-150 shadow-sm">
        <div className="flex h-16 items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-3 lg:gap-4 min-w-0 flex-1">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-text-muted hover:bg-surface-hover hover:text-primary transition-all active:scale-95"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center min-w-0 shrink-0">
              <Link to="/dashboard" className="flex items-center gap-2.5 group">
                <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-white group-hover:scale-[1.005] transition-all duration-150">
                  <Feather className="w-5 h-5" strokeWidth={2.5} />
                </div>
                <span className="text-lg font-black tracking-tight font-display hidden sm:inline-flex items-center gap-0.5">
                  <span className="text-primary">Maat</span>
                  <span className="text-text">Work</span>
                </span>
              </Link>
            </div>
            <CareerProgressBar />
          </div>

          <div className="flex items-center shrink-0 gap-2">
            <FeedbackModal />
            <NotificationButton />
            <ProfileDropdown />
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
              "w-full flex items-center h-12 rounded-lg transition-all duration-150 group active:scale-95",
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
          <div className="fixed inset-0 bg-secondary/60 transition-opacity" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative w-[320px] max-w-[85vw] bg-surface h-full flex flex-col shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-border/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-white">
                  <Feather className="w-5 h-5" strokeWidth={2.5} />
                </div>
                <span className="text-xl font-black font-display">
                  <span className="text-primary">Maat</span>
                  <span className="text-text">Work</span>
                </span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="w-10 h-10 flex items-center justify-center rounded-lg bg-surface-100 text-text-muted hover:bg-error/10 hover:text-error transition-all"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <NavContent collapsed={false} currentPath={currentPath} isMobile />

            <div className="mt-auto p-6 border-t border-border/50 bg-surface-50/50">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black">
                  {mockUser.initial}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-text truncate">{mockUser.name}</p>
                  <p className="text-xs text-text-muted truncate">{mockUser.email}</p>
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
                "relative flex items-center rounded-lg transition-all duration-150 min-w-0 font-body group active:scale-[0.98]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                collapsed ? "justify-center w-14 h-14 mx-auto" : "gap-3 px-4 py-3 w-full",
                isActive ? "bg-primary text-white" : "text-text-secondary hover:text-primary hover:bg-primary/5",
              );

              const content = (
                <>
                  <item.icon
                    className={cn(
                      "shrink-0 transition-transform group-hover:scale-[1.005]",
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
