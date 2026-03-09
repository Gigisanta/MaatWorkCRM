// ============================================================
// MaatWork CRM — Settings Page
// UI/UX REFINED BY JULES v2
// ============================================================

import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Bell, Building2, Check, Palette, Save, Shield, User } from "lucide-react";
import { Badge } from "~/components/ui/Badge";
import { Button } from "~/components/ui/Button";
import { Card, CardContent, CardHeader } from "~/components/ui/Card";
import { Input } from "~/components/ui/Input";
import { Container, Grid, Stack } from "~/components/ui/Layout";
import { cn } from "~/lib/utils";

export const Route = createFileRoute("/_app/settings/")({
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <Container className="py-8 space-y-8 animate-fade-in max-w-4xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2"
      >
        <div className="space-y-1.5">
          <h1 className="text-3xl font-bold text-text font-display tracking-tight">Settings</h1>
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">
            Profile, organization, and preferences
          </p>
        </div>
        <Button
          variant="primary"
          className="shadow-md hover:shadow-lg rounded-lg h-10 px-6 font-semibold text-sm bg-primary hover:bg-primary-hover transition-all"
        >
          <Save className="w-4 h-4 mr-2" strokeWidth={2.5} /> Save Changes
        </Button>
      </motion.div>

      <Grid cols={{ sm: 1, lg: 2 }} gap={6}>
        <Stack direction="col" gap="lg">
          {/* Profile */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card variant="elevated" className="border-border bg-surface">
              <CardHeader className="border-b border-border/50 pb-4">
                <h2 className="text-lg font-bold text-text flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" /> Profile Information
                </h2>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                <Input
                  label="FULL NAME"
                  defaultValue="Admin User"
                  className="bg-surface-hover border-border focus:border-primary/50 transition-all rounded-xl h-12"
                />
                <Input
                  label="EMAIL ADDRESS"
                  type="email"
                  defaultValue="admin@maatwork.com"
                  className="bg-surface-hover border-border focus:border-primary/50 transition-all rounded-xl h-12"
                />
                <div className="flex items-center gap-6 pt-2">
                  <div className="flex-1 space-y-2">
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider ml-1">Role</label>
                    <div className="h-12 px-4 rounded-xl bg-surface-hover border border-border flex items-center">
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-bold">
                        Administrator
                      </Badge>
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider ml-1">Level</label>
                    <div className="h-12 px-4 rounded-xl bg-surface-hover border border-border flex items-center">
                      <Badge variant="outline" className="bg-success/10 text-success border-success/20 font-bold">
                        Senior
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Organization */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card variant="elevated" className="border-border bg-surface">
              <CardHeader className="border-b border-border/50 pb-4">
                <h2 className="text-lg font-bold text-text flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-accent" /> Organization
                </h2>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                <Input
                  label="ORGANIZATION NAME"
                  defaultValue="MaatWork Demo"
                  className="bg-surface-hover border-border focus:border-primary/50 transition-all rounded-xl h-12"
                />
                <Input
                  label="WORKSPACE SLUG"
                  defaultValue="maatwork-demo"
                  readOnly
                  className="bg-surface-hover/50 border-border/50 text-text-muted cursor-not-allowed rounded-xl h-12"
                />
              </CardContent>
            </Card>
          </motion.div>
        </Stack>

        <Stack direction="col" gap="lg">
          {/* Notifications */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card variant="elevated" className="border-border bg-surface">
              <CardHeader className="border-b border-border/50 pb-4">
                <h2 className="text-lg font-bold text-text flex items-center gap-2">
                  <Bell className="w-5 h-5 text-warning" /> Notifications
                </h2>
              </CardHeader>
              <CardContent className="p-6 space-y-1">
                {[
                  { label: "Overdue Tasks", active: true },
                  { label: "Team Goals Updates", active: true },
                  { label: "New Contacts Assigned", active: false },
                  { label: "Pipeline Activity", active: true },
                ].map((item, idx) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between py-3 border-b border-border/30 last:border-0"
                  >
                    <span className="text-sm font-medium text-text-secondary">{item.label}</span>
                    <button
                      className={cn(
                        "w-10 h-5 rounded-full relative transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-surface",
                        item.active ? "bg-primary" : "bg-surface-hover border border-border",
                      )}
                    >
                      <motion.div
                        layout
                        className={cn(
                          "w-4 h-4 rounded-full bg-white absolute top-0.5 shadow-sm",
                          item.active ? "right-0.5" : "left-0.5",
                        )}
                      />
                    </button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* Security */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card variant="elevated" className="border-border bg-surface">
              <div className="absolute inset-0 bg-gradient-to-br from-error/5 to-transparent opacity-50" />
              <CardHeader className="border-b border-border/50 pb-4 relative z-10">
                <h2 className="text-lg font-bold text-text flex items-center gap-2">
                  <Shield className="w-5 h-5 text-error" /> Security & Access
                </h2>
              </CardHeader>
              <CardContent className="p-6 space-y-4 relative z-10">
                <div className="flex items-center justify-between p-4 rounded-xl bg-surface-hover border border-border">
                  <div>
                    <p className="text-sm font-bold text-text">Two-Factor Authentication</p>
                    <p className="text-xs text-text-muted mt-0.5">Add an extra layer of security to your account.</p>
                  </div>
                  <Button variant="outline" size="sm" className="border-border hover:bg-surface text-text-secondary">
                    Enable
                  </Button>
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-surface-hover border border-border">
                  <div>
                    <p className="text-sm font-bold text-text">Active Sessions</p>
                    <p className="text-xs text-text-muted mt-0.5">Manage devices logged into your account.</p>
                  </div>
                  <Button variant="outline" size="sm" className="border-border hover:bg-surface text-text-secondary">
                    Manage
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </Stack>
      </Grid>
    </Container>
  );
}
