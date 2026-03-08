// ============================================================
// MaatWork CRM — Resources Page
// UI/UX REFINED BY JULES v2
// ============================================================

import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Briefcase,
  Calculator,
  Download,
  FileSpreadsheet,
  FolderOpen,
  Globe,
  Scale,
  TrendingUp,
  Upload,
  Wallet,
} from "lucide-react";
import { Badge } from "~/components/ui/Badge";
import { Button } from "~/components/ui/Button";
import { Card, CardContent } from "~/components/ui/Card";
import { Container, Grid, Stack } from "~/components/ui/Layout";
import { cn } from "~/lib/utils";

export const Route = createFileRoute("/_app/resources")({
  component: ResourcesPage,
});

const categoryConfig: Record<string, { icon: any; color: string; label: string }> = {
  templates: { icon: FileSpreadsheet, color: "text-primary bg-primary/10 border-primary/20", label: "Templates" },
  calculators: { icon: Calculator, color: "text-success bg-success/10 border-success/20", label: "Calculators" },
  regulations: { icon: Scale, color: "text-warning bg-warning/10 border-warning/20", label: "Regulations" },
  market: { icon: TrendingUp, color: "text-accent bg-accent/10 border-accent/20", label: "Market Data" },
  tools: { icon: Briefcase, color: "text-info bg-info/10 border-info/20", label: "Tools" },
};

const RESOURCES = [
  {
    id: "1",
    title: "Investment Portfolio Template",
    description: "Excel template for tracking client investment portfolios with performance metrics.",
    category: "templates",
    format: "XLSX",
    size: "245 KB",
    url: "#",
  },
  {
    id: "2",
    title: "Financial Planning Calculator",
    description: "Interactive calculator for retirement planning, compound interest, and investment projections.",
    category: "calculators",
    format: "XLSX",
    size: "128 KB",
    url: "#",
  },
  {
    id: "3",
    title: "CNV Regulations Guide",
    description: "Complete guide to CNV regulations for financial advisors in Argentina.",
    category: "regulations",
    format: "PDF",
    size: "1.2 MB",
    url: "#",
  },
  {
    id: "4",
    title: "Market Analysis Report - Q1 2026",
    description: "Comprehensive market analysis report for Q1 2026 with emerging opportunities.",
    category: "market",
    format: "PDF",
    size: "3.4 MB",
    url: "#",
  },
  {
    id: "5",
    title: "Client Onboarding Checklist",
    description: "Step-by-step checklist for new client onboarding process.",
    category: "templates",
    format: "PDF",
    size: "89 KB",
    url: "#",
  },
  {
    id: "6",
    title: "Risk Assessment Tools",
    description: "Collection of risk assessment questionnaires and tools for client profiling.",
    category: "tools",
    format: "ZIP",
    size: "567 KB",
    url: "#",
  },
  {
    id: "7",
    title: "Tax Calculator 2026",
    description: "Updated tax calculator for 2026 with latest Argentine tax regulations.",
    category: "calculators",
    format: "XLSX",
    size: "156 KB",
    url: "#",
  },
  {
    id: "8",
    title: "ESG Investment Guidelines",
    description: "Guidelines for ESG-compliant investment strategies and products.",
    category: "regulations",
    format: "PDF",
    size: "890 KB",
    url: "#",
  },
];

function ResourcesPage() {
  return (
    <Container className="py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2"
      >
        <div className="space-y-1.5">
          <h1 className="text-3xl font-bold text-text font-display tracking-tight">Resources</h1>
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">
            Essential tools and documents for financial advisors.
          </p>
        </div>
        <Button
          variant="primary"
          className="shadow-[0_0_15px_rgba(139,92,246,0.2)] hover:shadow-[0_0_20px_rgba(139,92,246,0.3)] rounded-xl h-10 px-5 font-semibold text-sm bg-primary hover:bg-primary-hover transition-all"
        >
          <Upload className="w-4 h-4 mr-2" strokeWidth={2.5} /> Upload Resource
        </Button>
      </motion.div>

      {/* Categories Filter */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide px-2"
      >
        {["All", "Templates", "Calculators", "Regulations", "Market Data", "Tools"].map((cat, i) => (
          <Button
            key={cat}
            variant={i === 0 ? "primary" : "ghost"}
            className={cn(
              "px-6 h-10 rounded-xl whitespace-nowrap transition-all duration-300 font-semibold text-sm",
              i === 0
                ? "bg-surface-hover text-primary border border-primary/30 shadow-[0_0_15px_rgba(139,92,246,0.15)]"
                : "bg-surface border border-border text-text-secondary hover:text-text hover:bg-surface-hover",
            )}
          >
            {cat}
          </Button>
        ))}
      </motion.div>

      {/* Resources Grid */}
      <Grid cols={{ sm: 1, md: 2, lg: 3 }} gap={6}>
        {RESOURCES.map((resource, idx) => {
          const config = categoryConfig[resource.category] ?? categoryConfig.templates;
          const CategoryIcon = config.icon;
          return (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + idx * 0.05 }}
              key={resource.id}
            >
              <Card
                variant="glass"
                className="group hover:shadow-[0_8px_25px_rgba(0,0,0,0.2)] overflow-hidden border-border bg-surface transition-all duration-300 hover:-translate-y-1"
              >
                <div className={cn("h-1.5 w-full opacity-80", config.color.split(" ")[1])} />
                <CardContent className="p-5">
                  <Stack direction="col" gap="md" align="start">
                    <Stack direction="row" gap="md" align="start" className="w-full">
                      <div
                        className={cn(
                          "p-3 rounded-xl shrink-0 shadow-inner border transition-transform duration-500 group-hover:scale-110",
                          config.color,
                        )}
                      >
                        <CategoryIcon size={22} strokeWidth={2} />
                      </div>
                      <div className="flex-1 space-y-2 min-w-0">
                        <Stack direction="row" align="center" justify="between">
                          <Badge
                            variant="outline"
                            className="text-[10px] uppercase font-bold tracking-wider bg-surface-hover border-border text-text-secondary"
                          >
                            {config.label}
                          </Badge>
                          <Stack direction="row" gap="xs" align="center" className="text-text-muted">
                            <span className="text-xs font-bold">{resource.format}</span>
                          </Stack>
                        </Stack>

                        <div>
                          <h3 className="text-base font-bold text-text group-hover:text-primary-light transition-colors tracking-tight truncate">
                            {resource.title}
                          </h3>
                          <p className="text-xs text-text-muted mt-1 leading-relaxed line-clamp-2 font-medium">
                            {resource.description}
                          </p>
                        </div>
                      </div>
                    </Stack>

                    <Stack
                      direction="row"
                      align="center"
                      justify="between"
                      className="w-full pt-3 mt-auto border-t border-border/50"
                    >
                      <Stack
                        direction="row"
                        gap="sm"
                        align="center"
                        className="text-text-muted text-[10px] font-bold uppercase tracking-wider"
                      >
                        <FolderOpen size={12} />
                        {resource.size}
                      </Stack>
                      <Stack direction="row" gap="sm">
                        <Button
                          variant="primary"
                          size="sm"
                          className="rounded-lg px-4 h-8 shadow-[0_0_10px_rgba(139,92,246,0.2)] bg-primary hover:bg-primary-hover font-semibold text-xs"
                        >
                          <Download size={12} className="mr-1.5" /> Download
                        </Button>
                      </Stack>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </Grid>

      {/* Quick Access Section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <Card variant="cyber" className="bg-surface border-border relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-transparent opacity-50" />
          <CardContent className="p-6 relative z-10">
            <Stack direction="col" gap="md">
              <div>
                <h2 className="text-xl font-bold text-text font-display tracking-tight">Quick Access</h2>
                <p className="text-text-secondary text-sm font-medium mt-1">
                  Frequently used tools and external resources.
                </p>
              </div>
              <Grid cols={{ sm: 2, md: 4 }} gap={4}>
                <Button
                  variant="ghost"
                  className="h-auto py-4 px-4 flex-col gap-2 bg-surface-hover/50 border border-border hover:bg-surface-hover rounded-xl transition-all"
                >
                  <Globe size={24} className="text-primary" />
                  <span className="text-xs font-bold text-text">BCRA Metrics</span>
                </Button>
                <Button
                  variant="ghost"
                  className="h-auto py-4 px-4 flex-col gap-2 bg-surface-hover/50 border border-border hover:bg-surface-hover rounded-xl transition-all"
                >
                  <TrendingUp size={24} className="text-success" />
                  <span className="text-xs font-bold text-text">Market Indices</span>
                </Button>
                <Button
                  variant="ghost"
                  className="h-auto py-4 px-4 flex-col gap-2 bg-surface-hover/50 border border-border hover:bg-surface-hover rounded-xl transition-all"
                >
                  <Wallet size={24} className="text-warning" />
                  <span className="text-xs font-bold text-text">Tax Portal</span>
                </Button>
                <Button
                  variant="ghost"
                  className="h-auto py-4 px-4 flex-col gap-2 bg-surface-hover/50 border border-border hover:bg-surface-hover rounded-xl transition-all"
                >
                  <Scale size={24} className="text-accent" />
                  <span className="text-xs font-bold text-text">Legal Forms</span>
                </Button>
              </Grid>
            </Stack>
          </CardContent>
        </Card>
      </motion.div>
    </Container>
  );
}
