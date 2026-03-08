import React, { useMemo, useState, useCallback, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Notification, NotifType, Priority, useNotifications } from "../../hooks/useNotifications";

// Lightweight Bell icon (SVG) for the header button
const BellIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className ?? "h-5 w-5"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

type GroupTabs = "All" | NotifType;

type Toast = { id: string; message: string; duration?: number };

export const NotificationCenter: React.FC = () => {
  const { notifications, visibleNotifications, addNotification, updateNotification, removeNotification, dispatchAction } = useNotifications();
  const [open, setOpen] = useState(false);
  const [detailNotification, setDetailNotification] = useState<Notification | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [group, setGroup] = useState<GroupTabs>("All");

  // Simple toast helper
  const showToast = useCallback((msg: string) => {
    const t = { id: Math.random().toString(36).slice(2), message: msg };
    setToast(t);
    window.setTimeout(() => setToast(null), 1800);
  }, []);

  // When actions happen, show toasts
  const onAction = useCallback(
  (payload: string) => {
    showToast(payload);
  }, [showToast]);

  // Derived grouping with counts
  const byType = useMemo(() => {
    const alerts: Notification[] = [];
    const system: Notification[] = [];
    const actions: Notification[] = [];
    notifications.forEach((n) => {
      if (n.type === "alerts") alerts.push(n);
      else if (n.type === "system") system.push(n);
      else if (n.type === "actions") actions.push(n);
    });
    return {
      all: notifications,
      alerts,
      system,
      actions
    } as const;
  }, [notifications]);

  const filtered = useMemo(() => {
    const list = group === "All" ? byType.all : byType[group as NotifType] ?? [];
    return list;
  }, [group, byType]);

  // Open detail when a notification is clicked
  const openDetail = useCallback((n: Notification) => {
    setDetailNotification(n);
    setDetailOpen(true);
  }, []);

  // Queue seed notification occasionally to demonstrate toast
  useEffect(() => {
    if (notifications.length === 0) {
      // seed a demo notification after mount
      addNotification({ type: "alerts", message: "Welcome to Notifications Center. Stay informed.", priority: "high" });
      onAction("New notification seeded");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Actions handlers
  const handleRead = (id: string) => {
    updateNotification(id, { read: true });
  };
  const handleDismiss = (id: string) => {
    removeNotification(id);
    onAction("Notification dismissed");
  };
  const handleSnooze = (id: string, minutes?: number) => {
    const mins = minutes ?? 10;
    updateNotification(id, { snoozeUntil: Date.now() + mins * 60 * 1000 });
    onAction(`Snoozed for ${mins}m`);
  };

  // Grouped render helpers
  const renderGroup = (type: NotifType, items: Notification[]) => {
    if (!items.length) return null;
    const color = typeColor(type);
    return (
      <div key={type} className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-semibold" style={{ color }}>{typeHeader(type)}</span>
          <span className="text-xs rounded px-2 py-0.5" style={{ background: color, color: "white" }}> {items.length} </span>
        </div>
        <div className="flex flex-col space-y-1">
          {items.map((n: Notification) => (
            <div key={n.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/8 cursor-pointer" onClick={() => openDetail(n)}>
              <div className="flex items-center gap-3 min-w-0">
                <span className="h-2 w-2 rounded-full" style={{ background: priorityColor(n.priority) }} />
                <div className="flex-1 min-w-0">
                  <div className={"text-sm font-medium truncate" + (n.read ? " text-slate-400" : " text-white")}>{n.message}</div>
                  <div className="text-xs text-slate-400 truncate">{new Date(n.timestamp).toLocaleString()}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!n.read && <span className="text-xs font-semibold" style={{ color: priorityColor(n.priority) }}>•</span>}
                <span className="text-xs px-2 py-1 rounded" style={{ background: "rgba(255,255,255,0.08)", color: "white" }}>{n.type}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Inner detail dialog component
  const DetailDialog = (
    <Dialog.Root open={detailOpen} onOpenChange={setDetailOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60" />
        <Dialog.Content className="fixed right-0 top-0 h-full w-96 bg-neutral-900/70 backdrop-blur-md shadow-2xl glass-card p-4 m-4 rounded-lg overflow-auto">
          <div className="flex items-start justify-between mb-3">
            <div className="text-lg font-semibold">Notification Details</div>
            <Dialog.Close asChild>
              <button className="text-lg font-bold leading-none">×</button>
            </Dialog.Close>
          </div>
          {detailNotification ? (
            <div className="flex flex-col space-y-2">
              <div className="text-sm text-slate-100">Type: <span className="font-semibold">{detailNotification.type}</span></div>
              <div className="text-sm text-slate-100">Priority: <span className="font-semibold" style={{ color: priorityColor(detailNotification.priority) }}>{detailNotification.priority}</span></div>
              <div className="text-sm text-slate-100">Time: {new Date(detailNotification.timestamp).toLocaleString()}</div>
              <div className="text-sm text-slate-100">Message:</div>
              <div className="text-sm text-slate-100 bg-white/5 rounded p-2">{detailNotification.message}</div>
              <div className="flex gap-2 pt-2 mt-2 border-t border-white/10">
                {!detailNotification.read && (
                  <button className="px-3 py-1 rounded bg-green-600/80 hover:bg-green-600 text-white" onClick={() => { updateNotification(detailNotification.id, { read: true }); setDetailNotification((d) => (d ? { ...d, read: true } : d)); }}>
                    Mark Read
                  </button>
                )}
                <button className="px-3 py-1 rounded bg-yellow-600 hover:bg-yellow-700 text-white" onClick={() => { handleSnooze(detailNotification.id, 5); }}>Snooze 5m</button>
                <button className="px-3 py-1 rounded bg-red-600 hover:bg-red-700 text-white" onClick={() => { handleDismiss(detailNotification.id); }}>Dismiss</button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-100">No notification selected.</div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );

  // Outer content rendering
  return (
    <div className="inline-block">
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Trigger asChild>
          <button aria-label="Notifications" className="flex items-center gap-2 px-3 py-2 rounded-full bg-black/40 hover:bg-black/60 glass-card shadow-md">
            <span className="text-neutral-200"><BellIcon /></span>
            <span className="hidden sm:inline text-sm font-semibold text-white">Notifications</span>
            {notifications.filter(n => !n.read).length > 0 && (
              <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-red-500 text-white text-xs font-semibold">{notifications.filter(n => !n.read).length}</span>
            )}
          </button>
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60" />
          <Dialog.Content className="fixed right-0 top-0 h-full w-96 bg-neutral-900/70 backdrop-blur-md shadow-2xl glass-card p-4 m-4 rounded-lg overflow-auto">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xl font-bold">Notifications</div>
              <Dialog.Close asChild>
                <button className="p-1 rounded bg-white/10 hover:bg-white/20">Close</button>
              </Dialog.Close>
            </div>
            <div className="mb-2 border-b border-white/10 pb-2 flex justify-between items-center">
              <div className="flex items-center gap-2">
                {/** Group tabs */}
                {(["All", "alerts", "system", "actions"] as const).map((t) => (
                  <button key={t} onClick={() => setGroup(t as GroupTabs)} className={`text-sm px-2 py-1 rounded ${group === t ? "bg-white/10" : "bg-transparent"}`}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3 pr-2" style={{ maxHeight: "70vh" }}>
              {group === "All"
                ? renderGroupList(["alerts", "system", "actions"], notifications, openDetail, priorityColor)
                : renderGroupList([group as NotifType], byGroup(notifications, group as NotifType), openDetail, priorityColor)}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      {DetailDialog}
      {toast && (
        <div className="fixed bottom-4 right-4 bg-neutral-800/90 text-white text-sm px-4 py-2 rounded-lg shadow-lg" role="status" aria-live="polite">
          {toast.message}
        </div>
      )}
    </div>
  );
};

// Helpers (internal)
function typeHeader(t: NotifType) {
  switch (t) {
    case "alerts": return "Alerts";
    case "system": return "System";
    case "actions": return "Actions";
  }
}

function typeColor(t: NotifType) {
  switch (t) {
    case "alerts": return "#F87171"; // red-400-ish
    case "system": return "#F59E0B";
    case "actions": return "#8B5CF6";
  }
}

function priorityColor(p: Priority) {
  if (p === "high") return "#EF4444";
  if (p === "medium") return "#F59E0B";
  return "#3B82F6";
}

function byGroup(list: Notification[], type: NotifType): Notification[] {
  return list.filter((n) => n.type === type);
}

function renderGroupList(types: (NotifType | string)[], items: Notification[], openDetail: (n: Notification) => void, colorFn: (p: Priority) => string) {
  const content: React.ReactNode = (
    <>
      {items.map((n) => (
        <div key={n.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/8 cursor-pointer" onClick={() => openDetail(n)}>
          <div className="flex items-center gap-3 min-w-0">
            <span className="h-2 w-2 rounded-full" style={{ background: priorityColor(n.priority) }} />
            <div className="flex-1 min-w-0">
              <div className={"text-sm font-medium truncate" + (n.read ? " text-slate-400" : " text-white")}>{n.message}</div>
              <div className="text-xs text-slate-400 truncate">{new Date(n.timestamp).toLocaleString()}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!n.read && <span className="text-xs font-semibold" style={{ color: priorityColor(n.priority) }}>•</span>}
            <span className="text-xs px-2 py-1 rounded" style={{ background: "rgba(255,255,255,0.08)", color: "white" }}>{n.type}</span>
          </div>
        </div>
      ))}
    </>
  );
  return <>{content}</>;
}

export default NotificationCenter;
