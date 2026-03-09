// ============================================================
// MaatWork CRM — Reports & Analytics Page
// UI/UX REFINED BY JULES v2
// ============================================================

import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, BarChart3, Download, PieChart, Sparkles, TrendingUp } from "lucide-react";
import { Button } from "~/components/ui/Button";
import { Card, CardContent, CardHeader } from "~/components/ui/Card";
import { Container, Grid, Stack } from "~/components/ui/Layout";
import { cn } from "~/lib/utils";

export const Route = createFileRoute("/_app/reports")({
  component: ReportsPage,
});

function ReportsPage() {
  const pipelineData = [
    { stage: "Prospect", count: 1, value: 50000, color: "#8B5CF6" }, // primary
    { stage: "Contacted", count: 0, value: 0, color: "#C026D3" }, // accent
    { stage: "Meeting", count: 1, value: 80000, color: "#F59E0B" }, // warning
    { stage: "Proposal", count: 1, value: 300000, color: "#3B82F6" }, // info
    { stage: "Active", count: 1, value: 150000, color: "#22C55E" }, // success
  ];

  const metrics = [
    { label: "Nuevos Contactos (Mar)", value: "3", change: "+50%", up: true },
    { label: "Deals Cerrados", value: "1", change: "+100%", up: true },
    { label: "Tasa de Conversión", value: "25%", change: "-5%", up: false },
    { label: "Tareas Completadas", value: "12", change: "+20%", up: true },
  ];

  const maxValue = Math.max(...pipelineData.map((d) => d.value));

  return (
    <Container className="py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2"
      >
        <div className="space-y-1.5">
          <h1 className="text-3xl font-bold text-text font-display tracking-tight">Reportes y Análisis</h1>
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">
            Métricas e información — Marzo 2026
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="h-10 px-4 border-border bg-surface text-text-secondary hover:text-primary hover:bg-surface-hover hover:border-border-hover transition-all"
          >
            <Download className="w-4 h-4 mr-2" /> CSV
          </Button>
          <Button
            variant="primary"
            className="rounded-lg h-10 px-5 font-semibold text-sm bg-primary hover:bg-primary-hover transition-all"
          >
            <Download className="w-4 h-4 mr-2" strokeWidth={2.5} /> Reporte PDF
          </Button>
        </div>
      </motion.div>

      {/* AI Insights Card */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card variant="elevated" className="bg-surface border-border relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/5 to-transparent opacity-50" />
          <CardContent className="p-6 relative z-10 flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-surface-hover border border-border flex items-center justify-center shrink-0 shadow-inner">
              <Sparkles className="w-6 h-6 text-accent" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-text flex items-center gap-2">
                Análisis IA
                <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] uppercase tracking-wider font-bold border border-primary/20">
                  Nuevo
                </span>
              </h3>
              <p className="text-sm text-text-secondary font-medium leading-relaxed">
                Tu equipo está <strong className="text-primary">23% por encima del objetivo</strong> este mes. La etapa "Propuesta"
                tiene el mayor cuello de botella. Considera dar seguimiento a los 3 deals estancados ahí por más de 7 días.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Metrics Grid */}
      <Grid cols={{ sm: 2, lg: 4 }} gap={6}>
        {metrics.map((m, idx) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 + idx * 0.1 }}
          >
            <Card className="p-5 border-border bg-surface hover:border-primary/30 transition-all duration-300 group">
              <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">{m.label}</p>
              <div className="flex items-end justify-between">
                <p className="text-3xl font-black text-text tracking-tighter group-hover:text-primary-light transition-colors">
                  {m.value}
                </p>
                <div
                  className={cn(
                    "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md",
                    m.up ? "text-success bg-success/10" : "text-error bg-error/10",
                  )}
                >
                  {m.up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {m.change}
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </Grid>

      <Grid cols={{ sm: 1, lg: 2 }} gap={6}>
        {/* Pipeline Chart - Bar */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
          <Card variant="outlined" className="p-6 border-border bg-surface h-full">
            <h2 className="text-sm font-bold text-text uppercase tracking-wider mb-6 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" /> Pipeline por Etapa (Valor)
            </h2>
            <div className="space-y-5">
              {pipelineData.map((d) => (
                <div key={d.stage} className="flex items-center gap-4 group">
                  <span className="w-24 text-xs font-semibold text-text-secondary text-right shrink-0 group-hover:text-text transition-colors">
                    {d.stage}
                  </span>
                  <div className="flex-1 h-6 rounded-md bg-surface-hover overflow-hidden relative border border-border/50">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: maxValue ? `${(d.value / maxValue) * 100}%` : "0%" }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full rounded-md flex items-center px-3"
                      style={{
                        backgroundColor: d.color,
                        minWidth: d.value > 0 ? "60px" : "0",
                      }}
                    >
                      {d.value > 0 && (
                        <span className="text-[10px] text-white font-bold whitespace-nowrap tracking-wider">
                          ${(d.value / 1000).toFixed(0)}k
                        </span>
                      )}
                    </motion.div>
                  </div>
                  <span className="w-8 text-xs font-bold text-text-muted text-center bg-surface-hover py-1 rounded-md border border-border/50">
                    {d.count}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Monthly Trends */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
          <Card variant="outlined" className="p-6 border-border bg-surface h-full">
            <h2 className="text-sm font-bold text-text uppercase tracking-wider mb-6 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-success" /> Tendencia Mensual
            </h2>
            <div className="grid grid-cols-3 gap-4 h-[calc(100%-3rem)]">
              {["Enero", "Febrero", "Marzo"].map((month, i) => (
                <div
                  key={month}
                  className="flex flex-col justify-end text-center p-4 rounded-xl bg-surface-hover border border-border/50 hover:border-primary/30 transition-all group"
                >
                  <div className="flex-1 flex items-end justify-center pb-4">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${[40, 60, 80][i]}%` }}
                      transition={{ duration: 1, delay: 0.2 + i * 0.1 }}
                      className="w-8 bg-gradient-to-t from-primary/20 to-primary rounded-t-md transition-all"
                    />
                  </div>
                  <p className="text-2xl font-black text-text tracking-tighter">{[3, 4, 5][i]}</p>
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mt-1">{month}</p>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </Grid>
    </Container>
  );
}
