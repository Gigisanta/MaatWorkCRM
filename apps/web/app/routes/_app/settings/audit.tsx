// ============================================================
// MaatWork CRM — Audit Logs Page (Admin only)
// UI/UX REFINED BY JULES v2
// ============================================================

import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Download, Filter, Search, Shield } from "lucide-react";
import { Badge } from "~/components/ui/Badge";
import { Button } from "~/components/ui/Button";
import { Card } from "~/components/ui/Card";
import { Container, Stack } from "~/components/ui/Layout";
import { cn } from "~/lib/utils";

export const Route = createFileRoute("/_app/settings/audit")({
  component: AuditLogsPage,
});

const DEMO_LOGS = [
  {
    id: "1",
    user: "Admin User",
    action: "create",
    entity: "organization",
    description: "Organization created: MaatWork Demo",
    time: "2026-03-01 09:00",
  },
  {
    id: "2",
    user: "Jane Doe",
    action: "create",
    entity: "contact",
    description: "Contact created: Maria Lopez",
    time: "2026-03-01 10:30",
  },
  {
    id: "3",
    user: "John Smith",
    action: "create",
    entity: "contact",
    description: "Contact created: Lucia Fernandez",
    time: "2026-03-02 11:15",
  },
  {
    id: "4",
    user: "Jane Doe",
    action: "update",
    entity: "deal",
    description: "Deal moved to stage: Meeting",
    time: "2026-03-03 14:00",
  },
  {
    id: "5",
    user: "Admin User",
    action: "update",
    entity: "team_goal",
    description: "Goal updated: $50k new clients (60%)",
    time: "2026-03-03 16:30",
  },
  {
    id: "6",
    user: "John Smith",
    action: "create",
    entity: "task",
    description: "Task created: Send material to Lucia",
    time: "2026-03-04 09:00",
  },
  {
    id: "7",
    user: "Jane Doe",
    action: "update",
    entity: "contact",
    description: "Contact updated: Maria Lopez (status → active)",
    time: "2026-03-04 10:45",
  },
  {
    id: "8",
    user: "Admin User",
    action: "export",
    entity: "report",
    description: "Report exported: Pipeline March 2026",
    time: "2026-03-04 15:00",
  },
];

const actionColors: Record<string, string> = {
  create: "bg-success/10 text-success border-success/20",
  update: "bg-info/10 text-info border-info/20",
  delete: "bg-error/10 text-error border-error/20",
  export: "bg-warning/10 text-warning border-warning/20",
  login: "bg-primary/10 text-primary border-primary/20",
};

function AuditLogsPage() {
  return (
    <Container className="py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2"
      >
        <div className="space-y-1.5">
          <h1 className="text-3xl font-bold text-text font-display tracking-tight flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" /> Audit Logs
          </h1>
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">
            Complete record of system actions (Admin only)
          </p>
        </div>
        <Button
          variant="outline"
          className="h-10 px-4 border-border bg-surface text-text-secondary hover:text-primary hover:bg-surface-hover hover:border-border-hover transition-all"
        >
          <Download className="w-4 h-4 mr-2" /> Export Logs
        </Button>
      </motion.div>

      {/* Filters & Actions bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-wrap items-center justify-between gap-4 bg-surface p-2.5 rounded-2xl border border-border shadow-sm"
      >
        <div className="flex-1 min-w-[300px] relative group h-10">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors duration-300"
            size={18}
            strokeWidth={2}
          />
          <input
            type="text"
            placeholder="Search logs by user, action, or entity..."
            className="w-full pl-12 pr-4 h-full bg-surface-hover border border-transparent rounded-xl focus:border-primary/30 focus:bg-surface focus:outline-none text-sm font-medium placeholder:text-text-muted transition-all shadow-inner text-text"
          />
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="text-text-secondary hover:text-text hover:bg-surface-hover h-10 px-4 rounded-xl font-semibold text-sm"
        >
          <Filter className="w-4 h-4 mr-2" /> Filter
        </Button>
      </motion.div>

      {/* Logs Table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <Card variant="glass" className="overflow-hidden border-border bg-surface">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/50 bg-surface-hover/50">
                  <th className="p-4 text-xs font-bold text-text-muted uppercase tracking-wider whitespace-nowrap">
                    Date & Time
                  </th>
                  <th className="p-4 text-xs font-bold text-text-muted uppercase tracking-wider">User</th>
                  <th className="p-4 text-xs font-bold text-text-muted uppercase tracking-wider">Action</th>
                  <th className="p-4 text-xs font-bold text-text-muted uppercase tracking-wider">Entity</th>
                  <th className="p-4 text-xs font-bold text-text-muted uppercase tracking-wider">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {DEMO_LOGS.map((log, idx) => (
                  <motion.tr
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + idx * 0.05 }}
                    key={log.id}
                    className="hover:bg-surface-hover/30 transition-colors group"
                  >
                    <td className="p-4 text-xs font-medium text-text-secondary whitespace-nowrap group-hover:text-text transition-colors">
                      {log.time}
                    </td>
                    <td className="p-4">
                      <span className="text-sm font-bold text-text group-hover:text-primary-light transition-colors">
                        {log.user}
                      </span>
                    </td>
                    <td className="p-4">
                      <Badge
                        variant="outline"
                        className={cn(
                          "px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md",
                          actionColors[log.action],
                        )}
                      >
                        {log.action}
                      </Badge>
                    </td>
                    <td className="p-4 text-sm font-semibold text-text-secondary capitalize">
                      {log.entity.replace("_", " ")}
                    </td>
                    <td className="p-4 text-sm font-medium text-text-muted group-hover:text-text-secondary transition-colors">
                      {log.description}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </motion.div>
    </Container>
  );
}
