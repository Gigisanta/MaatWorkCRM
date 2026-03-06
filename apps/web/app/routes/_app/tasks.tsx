// ============================================================
// MaatWork CRM — Tasks Page
// UI/UX REFINED BY JULES v2
// ============================================================

import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Calendar, Check, ChevronDown, Clock, Plus, Sparkles, User } from "lucide-react";
import React, { useState } from "react";
import { Badge } from "~/components/ui/Badge";
import { Button } from "~/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import { ConfirmDialog } from "~/components/ui/ConfirmDialog";
import { EmptyState } from "~/components/ui/EmptyState";
import { Icon } from "~/components/ui/Icon";
import { Input } from "~/components/ui/Input";
import { Container, Grid, Stack } from "~/components/ui/Layout";
import { Modal, ModalContent, ModalFooter, ModalHeader, ModalTitle } from "~/components/ui/Modal";
import {
  useContacts,
  useCreateTaskMutation,
  useDeleteTaskMutation,
  useTasks,
  useUpdateTaskMutation,
} from "~/lib/hooks/use-crm";
import { cn } from "~/lib/utils";

export const Route = createFileRoute("/_app/tasks")({
  component: TasksPage,
});

const priorityConfig: Record<string, { label: string; color: string; icon: any }> = {
  urgent: { label: "Urgent", color: "text-error bg-error/10 border-error/20", icon: AlertTriangle },
  high: { label: "High", color: "text-warning bg-warning/10 border-warning/20", icon: AlertTriangle },
  medium: { label: "Medium", color: "text-info bg-info/10 border-info/20", icon: Clock },
  low: { label: "Low", color: "text-text-muted bg-surface-hover border-border", icon: Clock },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-warning" },
  in_progress: { label: "In Progress", color: "bg-info" },
  completed: { label: "Completed", color: "bg-success" },
  cancelled: { label: "Cancelled", color: "bg-text-muted" },
};

function TasksPage() {
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const { data: tasks, isLoading, error } = useTasks(statusFilter ? { status: statusFilter } : {});
  const { data: contacts } = useContacts();

  const createTaskMutation = useCreateTaskMutation();
  const updateTaskMutation = useUpdateTaskMutation();
  const deleteTaskMutation = useDeleteTaskMutation();

  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [newTaskForm, setNewTaskForm] = useState({
    title: "",
    priority: "medium",
    dueDate: "",
    contactId: "",
  });

  const handleCreateTask = async () => {
    if (!newTaskForm.title) return;
    try {
      await createTaskMutation.mutateAsync({
        ...newTaskForm,
        dueDate: newTaskForm.dueDate ? new Date(newTaskForm.dueDate) : undefined,
        status: "pending",
      });
      setShowNewTaskModal(false);
      setNewTaskForm({ title: "", priority: "medium", dueDate: "", contactId: "" });
    } catch (err) {
      console.error("Failed to create task:", err);
    }
  };

  const handleToggleTaskStatus = async (task: any) => {
    const newStatus = task.status === "completed" ? "pending" : "completed";
    try {
      await updateTaskMutation.mutateAsync({
        id: task.id,
        data: { status: newStatus },
      });
    } catch (err) {
      console.error("Failed to update task status:", err);
    }
  };

  if (isLoading) {
    return (
      <Container className="py-12 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-12">
        <EmptyState
          title="Error loading tasks"
          description={(error as Error).message}
          icon={<AlertTriangle className="text-error w-12 h-12" />}
        />
      </Container>
    );
  }

  return (
    <Container className="py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2"
      >
        <div className="space-y-1.5">
          <h1 className="text-3xl font-bold text-text tracking-tight font-display">Task Management</h1>
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(139,92,246,0.6)] animate-pulse" />
            {tasks?.length || 0} total tasks <span className="opacity-30">•</span>{" "}
            {tasks?.filter((t: any) => t.status === "pending").length || 0} pending
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="h-10 px-4 border-border bg-surface text-text-secondary hover:text-primary hover:bg-surface-hover hover:border-border-hover transition-all"
          >
            <Sparkles className="w-4 h-4 mr-2 text-accent" />
            AI Breakdown
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => setShowNewTaskModal(true)}
            className="shadow-[0_0_15px_rgba(139,92,246,0.2)] hover:shadow-[0_0_20px_rgba(139,92,246,0.3)] rounded-xl h-10 px-5 font-semibold text-sm group bg-primary hover:bg-primary-hover transition-all"
          >
            <Plus className="mr-2 w-4 h-4 group-hover:rotate-90 transition-transform duration-300" strokeWidth={2.5} />
            New Task
          </Button>
        </div>
      </motion.div>

      {/* Filters & Actions bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-wrap items-center justify-between gap-4 bg-surface p-2.5 rounded-2xl border border-border shadow-sm"
      >
        <div className="flex items-center gap-1">
          {[
            { id: undefined, label: "All" },
            { id: "pending", label: "Pending" },
            { id: "in_progress", label: "In Progress" },
            { id: "completed", label: "Completed" },
          ].map((f) => (
            <Button
              key={f.id || "all"}
              variant="ghost"
              size="sm"
              onClick={() => setStatusFilter(f.id)}
              className={cn(
                "rounded-lg px-4 h-8 font-semibold text-xs transition-all duration-200",
                statusFilter === f.id
                  ? "bg-surface-hover text-text shadow-sm border border-border/50"
                  : "text-text-secondary hover:text-text hover:bg-surface-hover/50",
              )}
            >
              {f.label}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-2 px-2">
          <div className="h-4 w-[1px] bg-border mx-2 hidden sm:block" />
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider hidden sm:block">
            Active Filters
          </p>
        </div>
      </motion.div>

      {/* Task List */}
      <div className="grid gap-3">
        <AnimatePresence>
          {tasks?.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <EmptyState
                title="No pending tasks"
                description="Relax, it looks like you're all caught up."
                icon={<Calendar className="text-primary/30 w-12 h-12" />}
              />
            </motion.div>
          ) : (
            tasks?.map((task: any, index: number) => {
              const priority = priorityConfig[task.priority] || priorityConfig.medium;
              const isOverdue = task.status !== "completed" && task.dueDate && new Date(task.dueDate) < new Date();
              const PriorityIcon = priority.icon;

              return (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card
                    className={cn(
                      "hover:shadow-[0_8px_20px_rgba(0,0,0,0.1)] transition-all duration-300 group overflow-hidden border-border bg-surface backdrop-blur-3xl rounded-2xl relative",
                      task.status === "completed" ? "opacity-60 saturate-[0.8]" : "hover:border-primary/30",
                    )}
                  >
                    <div
                      className={cn(
                        "absolute left-0 top-0 bottom-0 w-1 transition-all duration-300",
                        priority.color.split(" ")[0].replace("text-", "bg-"),
                      )}
                    />

                    <CardContent className="p-4 flex items-center gap-4">
                      <button
                        onClick={() => handleToggleTaskStatus(task)}
                        className={cn(
                          "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300 shadow-inner shrink-0",
                          task.status === "completed"
                            ? "bg-primary border-primary text-white scale-110"
                            : "border-border hover:border-primary/50 bg-surface-hover",
                        )}
                      >
                        {task.status === "completed" && <Check size={14} strokeWidth={3} />}
                      </button>

                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            "text-sm font-bold transition-all truncate tracking-tight",
                            task.status === "completed"
                              ? "text-text-muted line-through"
                              : "text-text group-hover:text-primary-light",
                          )}
                        >
                          {task.title}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-1.5">
                          {task.contactId && (
                            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-text-secondary uppercase tracking-wider bg-surface-hover px-2 py-0.5 rounded-md border border-border/50">
                              <User size={10} className="text-primary" />
                              {contacts?.find((c: any) => c.id === task.contactId)?.name || "Contact"}
                            </div>
                          )}
                          {task.dueDate && (
                            <div
                              className={cn(
                                "flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider",
                                isOverdue ? "text-error" : "text-text-muted",
                              )}
                            >
                              <Calendar size={10} />
                              {new Date(task.dueDate).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                              {isOverdue && (
                                <span className="flex items-center gap-1 ml-1 text-[9px] bg-error/10 px-1.5 rounded-md border border-error/20">
                                  <span className="w-1 h-1 rounded-full bg-error animate-pulse" />
                                  Overdue
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <Badge
                          variant="outline"
                          className={cn(
                            "h-7 px-2.5 flex items-center gap-1.5 border font-bold text-[10px] uppercase tracking-wider rounded-lg transition-all",
                            priority.color,
                          )}
                        >
                          <PriorityIcon size={10} strokeWidth={2.5} />
                          {priority.label}
                        </Badge>

                        <div
                          className={cn(
                            "w-2.5 h-2.5 rounded-full border-2 border-background shadow-sm",
                            statusConfig[task.status]?.color || "bg-border",
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* New Task Modal */}
      <Modal open={showNewTaskModal} onOpenChange={setShowNewTaskModal}>
        <ModalHeader className="px-6 pt-6 pb-4 border-b border-border bg-surface">
          <ModalTitle className="text-xl font-bold tracking-tight text-text">Create New Task</ModalTitle>
          <p className="text-xs font-medium text-text-muted mt-1">What needs to be done?</p>
        </ModalHeader>
        <ModalContent className="p-6 space-y-6 bg-background">
          <Input
            label="TASK DESCRIPTION"
            placeholder="e.g. Call client for follow-up..."
            value={newTaskForm.title}
            onChange={(e) => setNewTaskForm((prev) => ({ ...prev, title: e.target.value }))}
            className="bg-surface-hover border-border focus:border-primary/50 transition-all rounded-xl h-12 text-sm font-medium"
          />
          <Grid cols={2} gap={4}>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider ml-1">Priority</label>
              <div className="relative group">
                <select
                  className="w-full h-12 px-4 rounded-xl border border-border bg-surface-hover focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 text-sm font-medium transition-all appearance-none cursor-pointer hover:border-border-hover text-text"
                  value={newTaskForm.priority}
                  onChange={(e) => setNewTaskForm((prev) => ({ ...prev, priority: e.target.value }))}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted group-hover:text-primary transition-colors">
                  <ChevronDown size={16} />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider ml-1">Due Date</label>
              <Input
                type="date"
                value={newTaskForm.dueDate}
                onChange={(e) => setNewTaskForm((prev) => ({ ...prev, dueDate: e.target.value }))}
                className="bg-surface-hover border-border focus:border-primary/50 transition-all rounded-xl h-12 text-sm font-medium text-text"
              />
            </div>
          </Grid>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider ml-1">
              Associated Contact
            </label>
            <div className="relative group">
              <select
                className="w-full h-12 px-4 rounded-xl border border-border bg-surface-hover focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 text-sm font-medium transition-all appearance-none cursor-pointer hover:border-border-hover text-text"
                value={newTaskForm.contactId}
                onChange={(e) => setNewTaskForm((prev) => ({ ...prev, contactId: e.target.value }))}
              >
                <option value="">No contact</option>
                {contacts?.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted group-hover:text-primary transition-colors">
                <ChevronDown size={16} />
              </div>
            </div>
          </div>
        </ModalContent>
        <ModalFooter className="p-6 border-t border-border bg-surface gap-4">
          <Button
            variant="ghost"
            onClick={() => setShowNewTaskModal(false)}
            className="rounded-xl px-6 h-10 text-text-secondary hover:text-text hover:bg-surface-hover transition-all duration-200 font-semibold text-sm"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleCreateTask}
            disabled={createTaskMutation.isPending || !newTaskForm.title}
            className="px-8 h-10 font-semibold text-sm shadow-[0_0_15px_rgba(139,92,246,0.2)] bg-primary hover:bg-primary-hover rounded-xl transition-all duration-300"
          >
            {createTaskMutation.isPending ? "Processing..." : "Confirm Task"}
          </Button>
        </ModalFooter>
      </Modal>
    </Container>
  );
}
