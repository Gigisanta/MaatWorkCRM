// ============================================================
// MaatWork CRM — Training Page
// UI/UX REFINED BY JULES v2
// ============================================================

import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  BookOpen,
  Clock,
  Compass,
  Download,
  ExternalLink,
  FileText,
  Play,
  Plus,
  Star,
  Trophy,
  Video,
} from "lucide-react";
import { Badge } from "~/components/ui/Badge";
import { Button } from "~/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import { Icon } from "~/components/ui/Icon";
import { Container, Grid, Stack } from "~/components/ui/Layout";
import { cn } from "~/lib/utils";

export const Route = createFileRoute("/_app/training")({
  component: TrainingPage,
});

const categoryConfig: Record<string, { icon: any; color: string; label: string }> = {
  guide: { icon: Compass, color: "text-warning bg-warning/10 border-warning/20", label: "Technical Guide" },
  video: { icon: Video, color: "text-primary bg-primary/10 border-primary/20", label: "Video Tutorial" },
  document: { icon: FileText, color: "text-info bg-info/10 border-info/20", label: "Documentation" },
  course: { icon: BookOpen, color: "text-success bg-success/10 border-success/20", label: "Full Course" },
};

const MATERIALS = [
  {
    id: "1",
    title: "Advisor Onboarding Guide",
    description: "Fundamental starting material for new advisors joining the MaatWork team.",
    category: "guide",
    duration: "45 min",
    rating: 4.8,
    url: "#",
  },
  {
    id: "2",
    title: "High Ticket Closing Techniques",
    description: "Advanced video course on negotiation and closing premium contracts.",
    category: "video",
    duration: "1h 20m",
    rating: 5.0,
    url: "#",
  },
  {
    id: "3",
    title: "CRM Pipeline & Automation Manual",
    description: "Absolute mastery of sales stages and automatic triggers.",
    category: "document",
    duration: "30 min",
    rating: 4.7,
    url: "#",
  },
  {
    id: "4",
    title: "Diploma: Strategic Financial Advisory",
    description: "Comprehensive training for the development of complex investment portfolios.",
    category: "course",
    duration: "12 hours",
    rating: 4.9,
    url: "#",
  },
];

function TrainingPage() {
  return (
    <Container className="py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2"
      >
        <div className="space-y-1.5">
          <h1 className="text-3xl font-bold text-text font-display tracking-tight">Training & Resources</h1>
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">
            Boost your skills with our exclusive knowledge library.
          </p>
        </div>
        <Button
          variant="primary"
          className="shadow-[0_0_15px_rgba(139,92,246,0.2)] hover:shadow-[0_0_20px_rgba(139,92,246,0.3)] rounded-xl h-10 px-5 font-semibold text-sm bg-primary hover:bg-primary-hover transition-all"
        >
          <Plus className="w-4 h-4 mr-2" strokeWidth={2.5} /> Upload Resource
        </Button>
      </motion.div>

      {/* Categories Filter (Visual) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide px-2"
      >
        {["All", "Videos", "Guides", "Courses", "Documents"].map((cat, i) => (
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

      <Grid cols={{ sm: 1, md: 2 }} gap={6}>
        {MATERIALS.map((mat, idx) => {
          const config = categoryConfig[mat.category] ?? categoryConfig.document;
          const CategoryIcon = config.icon;
          return (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + idx * 0.1 }}
              key={mat.id}
            >
              <Card
                variant="glass"
                className="group hover:shadow-[0_8px_25px_rgba(0,0,0,0.2)] overflow-hidden border-border bg-surface transition-all duration-300 hover:-translate-y-1"
              >
                <div className={cn("h-1.5 w-full opacity-80", config.color.split(" ")[1])} />
                <CardContent className="p-6">
                  <Stack direction="row" gap="md" align="start">
                    <div
                      className={cn(
                        "p-3.5 rounded-2xl shrink-0 shadow-inner border transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3",
                        config.color,
                      )}
                    >
                      <CategoryIcon size={24} strokeWidth={2} />
                    </div>
                    <div className="flex-1 space-y-3 min-w-0">
                      <Stack direction="row" align="center" justify="between">
                        <Badge
                          variant="outline"
                          className="text-[10px] uppercase font-bold tracking-wider bg-surface-hover border-border text-text-secondary"
                        >
                          {config.label}
                        </Badge>
                        <Stack direction="row" gap="xs" align="center" className="text-warning">
                          <Star size={12} fill="currentColor" />
                          <span className="text-xs font-bold">{mat.rating}</span>
                        </Stack>
                      </Stack>

                      <div>
                        <h3 className="text-lg font-bold text-text group-hover:text-primary-light transition-colors tracking-tight truncate">
                          {mat.title}
                        </h3>
                        <p className="text-xs text-text-muted mt-1.5 leading-relaxed line-clamp-2 font-medium">
                          {mat.description}
                        </p>
                      </div>

                      <Stack
                        direction="row"
                        align="center"
                        justify="between"
                        className="pt-4 mt-auto border-t border-border/50"
                      >
                        <Stack
                          direction="row"
                          gap="sm"
                          align="center"
                          className="text-text-muted text-[10px] font-bold uppercase tracking-wider"
                        >
                          <Stack direction="row" gap="xs" align="center">
                            <Clock size={12} />
                            {mat.duration}
                          </Stack>
                        </Stack>
                        <Stack direction="row" gap="sm">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 rounded-lg hover:bg-surface-hover text-text-muted hover:text-text p-0 flex items-center justify-center"
                          >
                            <Download size={14} />
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            className="rounded-lg px-4 h-8 shadow-[0_0_10px_rgba(139,92,246,0.2)] bg-primary hover:bg-primary-hover font-semibold text-xs"
                          >
                            <Play size={12} className="mr-1.5 fill-current" /> Start
                          </Button>
                        </Stack>
                      </Stack>
                    </div>
                  </Stack>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </Grid>

      {/* Professional Achievement Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
        <Card variant="cyber" className="bg-surface border-border relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-transparent opacity-50" />
          <CardContent className="p-8 relative z-10">
            <Grid cols={{ sm: 1, lg: 2 }} gap={6}>
              <Stack direction="col" gap="md">
                <Badge
                  variant="outline"
                  className="w-fit bg-primary/10 text-primary border-primary/20 font-bold uppercase tracking-wider text-[10px]"
                >
                  Learning Status
                </Badge>
                <h2 className="text-3xl font-bold text-text font-display tracking-tight">Keep it up, Admin!</h2>
                <p className="text-text-secondary text-sm max-w-md font-medium leading-relaxed">
                  You have completed <span className="text-primary font-bold">64% of your learning path</span> required
                  for this quarter. You are only 2 modules away from reaching the Senior level.
                </p>
                <div className="w-full h-2.5 bg-background rounded-full overflow-hidden border border-border/50 shadow-inner mt-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "64%" }}
                    transition={{ duration: 1.5, ease: "easeOut", delay: 0.8 }}
                    className="h-full bg-gradient-to-r from-primary to-accent rounded-full shadow-[0_0_15px_rgba(139,92,246,0.5)]"
                  />
                </div>
              </Stack>
              <div className="relative flex justify-center lg:justify-end">
                <div className="w-40 h-40 rounded-full bg-primary/20 blur-3xl absolute animate-pulse" />
                <motion.div
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  className="relative z-10 w-28 h-28 rounded-3xl bg-surface-hover border border-border flex items-center justify-center shadow-[0_0_30px_rgba(139,92,246,0.15)] rotate-3"
                >
                  <Trophy size={48} className="text-primary drop-shadow-[0_0_10px_rgba(139,92,246,0.5)]" />
                </motion.div>
              </div>
            </Grid>
          </CardContent>
        </Card>
      </motion.div>
    </Container>
  );
}
