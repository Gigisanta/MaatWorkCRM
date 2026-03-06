// ============================================================
// MaatWork CRM — Dashboard Page
// UI/UX REFINED BY JULES v2
// ============================================================

import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Activity as ActivityIcon,
  ArrowDownRight,
  ArrowUpRight,
  CheckSquare,
  ChevronRight,
  Clock,
  DollarSign,
  LayoutDashboard,
  Plus,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { Badge } from "~/components/ui/Badge";
import { Button } from "~/components/ui/Button";
import { Card } from "~/components/ui/Card";
import { Container, Grid, Stack } from "~/components/ui/Layout";
import { SectionHeader, StatCard } from "~/components/ui/LayoutCards";
import { useDashboardMetrics, usePipelineSummary, useRecentActivity } from "~/lib/hooks/use-crm";
import { cn, formatCurrency } from "~/lib/utils";

export const Route = createFileRoute("/_app/dashboard")({
  component: DashboardPage,
});

// ── Quick Action Component ───────────────────────────────────
function QuickAction({
  label,
  icon: Icon,
  to,
  color = "primary",
}: { label: string; icon: React.ElementType; to: string; color?: string }) {
  return (
    <motion.a
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      href={to}
      className="flex items-center justify-between p-4 rounded-2xl bg-surface border border-border transition-all hover:shadow-[0_0_20px_rgba(139,92,246,0.15)] hover:border-primary/30 group backdrop-blur-3xl"
    >
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "p-2.5 rounded-xl transition-all duration-500 group-hover:rotate-6",
            color === "primary"
              ? "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white group-hover:shadow-[0_0_15px_rgba(139,92,246,0.4)]"
              : "bg-surface-hover text-text-secondary group-hover:bg-primary/20 group-hover:text-primary",
          )}
        >
          <Icon className="w-5 h-5" />
        </div>
        <span className="font-semibold text-text group-hover:text-primary transition-colors tracking-tight text-sm">
          {label}
        </span>
      </div>
      <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-primary group-hover:translate-x-1 transition-all" />
    </motion.a>
  );
}

// ── Activity Item Component ──────────────────────────────────
function ActivityItem({
  action,
  entity,
  user,
  time,
  idx,
}: { action: string; entity: string; user: string; time: string; idx: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.1 }}
      className="flex items-start gap-4 py-4 border-b border-border/50 last:border-0 hover:bg-surface-hover/50 transition-all px-4 -mx-4 rounded-2xl group"
    >
      <div className="w-10 h-10 rounded-xl bg-surface-hover flex items-center justify-center text-primary text-sm font-bold mt-0.5 border border-border/50 group-hover:bg-primary group-hover:text-white group-hover:border-primary group-hover:rotate-3 transition-all duration-500 shadow-sm">
        {user.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-text group-hover:text-primary-light transition-colors truncate leading-tight">
            <span className="font-bold">{user}</span> {action}{" "}
            <span className="font-bold text-primary/90">{entity}</span>
          </p>
          <span className="flex items-center gap-1.5 shrink-0 text-[10px] font-bold text-text-muted uppercase tracking-wider">
            <Clock className="w-3 h-3" />
            {time}
          </span>
        </div>
        <p className="text-[10px] text-text-secondary mt-1.5 font-semibold uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-accent" />
          Analyzed by MaatWork AI
        </p>
      </div>
    </motion.div>
  );
}

function DashboardPage() {
  const { data: metrics, isLoading: loadingMetrics } = useDashboardMetrics();
  const { data: activities, isLoading: loadingActivity } = useRecentActivity(6);
  const { data: pipeline, isLoading: loadingPipeline } = usePipelineSummary();

  if (loadingMetrics || loadingActivity || loadingPipeline) {
    return (
      <Container className="py-24 text-center">
        <div className="animate-pulse space-y-8 max-w-md mx-auto">
          <div className="h-12 w-56 bg-surface-hover rounded-2xl mx-auto" />
          <div className="h-4 w-full bg-surface rounded-xl border border-border" />
          <div className="grid grid-cols-2 gap-6 mt-12">
            <div className="h-40 bg-surface-hover rounded-[2rem] border border-border" />
            <div className="h-40 bg-surface-hover rounded-[2rem] border border-border" />
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container className="space-y-8" padding="lg">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <SectionHeader
          title="Dashboard"
          description={`Welcome back. Here's your activity summary for ${new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}.`}
          icon={LayoutDashboard}
          actions={
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="md"
                className="border-border text-text font-semibold text-sm h-10 hover:bg-surface-hover"
              >
                History
              </Button>
              <Button
                variant="primary"
                size="md"
                className="shadow-[0_0_20px_rgba(139,92,246,0.3)] h-10 px-5 bg-primary hover:bg-primary-hover font-semibold"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Deal
              </Button>
            </div>
          }
        />
      </motion.div>

      {/* KPI Cards */}
      <Grid cols={{ sm: 1, md: 2, lg: 4 }} gap={6}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <StatCard
            label="Total Contacts"
            value={metrics?.totalContacts ?? 0}
            change="12% this month"
            changeType="up"
            icon={Users}
            variant="brand"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <StatCard
            label="Pipeline Value"
            value={formatCurrency(metrics?.pipelineValue ?? 0)}
            change="5.2% vs Jan"
            changeType="up"
            icon={DollarSign}
            variant="emerald"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <StatCard
            label="Pending Tasks"
            value={metrics?.pendingTasks ?? 0}
            change={metrics?.pendingTasks === 0 ? "All caught up!" : "Attention needed"}
            changeType={metrics?.pendingTasks === 0 ? "up" : "down"}
            icon={CheckSquare}
            variant="amber"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <StatCard
            label="Total Deals"
            value={metrics?.totalDeals ?? 0}
            change="Synced"
            changeType="up"
            icon={Target}
            variant="violet"
          />
        </motion.div>
      </Grid>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Quick Actions & Goal */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-4 space-y-6"
        >
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-5 bg-primary rounded-full shadow-[0_0_10px_rgba(139,92,246,0.8)]" />
              <h2 className="text-xl font-bold text-text font-display tracking-tight">Quick Actions</h2>
            </div>
            <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10 px-2 h-7 rounded-lg">
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">AI Copilot</span>
            </Button>
          </div>
          <Stack gap={3}>
            <QuickAction label="New Contact" icon={Users} to="/contacts" />
            <QuickAction label="Create Task" icon={CheckSquare} to="/tasks" color="secondary" />
            <QuickAction label="View Pipeline" icon={TrendingUp} to="/pipeline" />
            <QuickAction label="Calendar" icon={Clock} to="/calendar" color="secondary" />
          </Stack>

          <Card
            variant="cyber"
            className="p-6 bg-surface text-white border-border shadow-[0_0_30px_rgba(192,38,211,0.1)] overflow-hidden relative active:scale-[0.99] transition-all mt-6"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 opacity-50" />
            <div className="relative z-10">
              <h3 className="text-lg font-bold mb-1.5 font-display flex items-center gap-2">
                Monthly Goal
                <Sparkles className="w-4 h-4 text-warning" />
              </h3>
              <p className="text-text-secondary text-xs mb-5 font-medium">
                You are at 75% of your sales target this month. Keep it up!
              </p>
              <div className="h-2.5 w-full bg-background rounded-full overflow-hidden shadow-inner border border-border/50">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "75%" }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-primary to-accent rounded-full shadow-[0_0_15px_rgba(192,38,211,0.5)]"
                />
              </div>
            </div>
            <ActivityIcon className="absolute -right-8 -bottom-8 w-32 h-32 text-white/5 group-hover:scale-110 group-hover:rotate-12 transition-all duration-700 blur-[1px]" />
          </Card>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="lg:col-span-8"
        >
          <Card variant="glass" className="p-8 border-border backdrop-blur-3xl h-full">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-surface-hover border border-border text-primary rounded-xl shadow-sm">
                  <Clock className="w-5 h-5" strokeWidth={2.5} />
                </div>
                <h2 className="text-xl font-bold text-text font-display tracking-tight">Recent Activity</h2>
              </div>
              <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10 font-bold text-xs">
                View All
              </Button>
            </div>
            <Stack gap={0}>
              {Array.isArray(activities) && activities.length > 0 ? (
                activities.map((act: any, idx: number) => (
                  <ActivityItem
                    key={act.id}
                    idx={idx}
                    user={act.userId || "System"}
                    action={act.action}
                    entity={act.entityType}
                    time={new Date(act.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                  />
                ))
              ) : (
                <div className="py-20 text-center">
                  <div className="w-16 h-16 bg-surface-hover rounded-2xl flex items-center justify-center mx-auto mb-5 text-text-muted border border-border">
                    <Clock className="w-8 h-8" />
                  </div>
                  <p className="text-text-secondary font-semibold text-base tracking-tight">
                    Waiting for new interactions...
                  </p>
                  <p className="text-text-muted text-xs mt-1">Your real-time activity will appear here.</p>
                </div>
              )}
            </Stack>
          </Card>
        </motion.div>
      </div>

      {/* Pipeline Summary View */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="space-y-6 pt-4"
      >
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-success/10 rounded-xl text-success border border-success/20 flex items-center justify-center shadow-[0_0_15px_rgba(34,197,94,0.2)]">
              <DollarSign className="w-4 h-4" strokeWidth={2.5} />
            </div>
            <h2 className="text-xl font-bold text-text font-display tracking-tight">Pipeline Health</h2>
          </div>
          <Button variant="ghost" size="sm" className="text-text-muted hover:text-primary font-semibold text-xs">
            Customize Pipeline
          </Button>
        </div>
        <Grid cols={{ sm: 2, md: 3, lg: 3, xl: 6 }} gap={4}>
          {pipeline?.map((s, i) => (
            <motion.div
              key={s.stageName}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 + i * 0.1 }}
            >
              <Card
                variant="cyber"
                className="p-6 text-center transition-all group overflow-hidden relative border-border hover:border-primary/30 bg-surface"
              >
                <div
                  className="absolute top-0 left-0 w-full h-[3px] opacity-80 shadow-[0_0_10px_currentColor]"
                  style={{ backgroundColor: s.stageColor, color: s.stageColor }}
                />
                <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-4 group-hover:text-text transition-colors truncate">
                  {s.stageName}
                </p>
                <div className="space-y-0.5">
                  <p className="text-3xl font-bold text-text group-hover:scale-110 transition-all duration-500 tracking-tight">
                    {s.dealCount}
                  </p>
                  <div className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                    Opportunities
                  </div>
                </div>
                <div className="mt-6 flex justify-center">
                  <Badge
                    variant="success"
                    className="font-bold text-[10px] rounded-lg tracking-tight h-7 px-3 shadow-sm bg-success/10 text-success border-success/20"
                  >
                    {formatCurrency(s.totalValue)}
                  </Badge>
                </div>
              </Card>
            </motion.div>
          ))}
        </Grid>
      </motion.div>
    </Container>
  );
}
