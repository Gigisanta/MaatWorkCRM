import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Award, CheckCircle, DollarSign, Lock, Target, TrendingUp } from "lucide-react";
import { Card } from "~/components/ui/Card";
import { Container, Grid, Stack } from "~/components/ui/Layout";
import { SectionHeader } from "~/components/ui/LayoutCards";

export const Route = createFileRoute("/_app/career-plan")({
  component: CareerPlanPage,
});

const mockUserProgress = {
  currentLevel: "Senior Advisor",
  nextLevel: "Lead Advisor",
  progressPercentage: 72,
  annualProduction: 85000,
  annualGoal: 120000,
  commissionPercentage: 15,
};

const mockLevels = [
  { level: "Junior Advisor", min: 0, max: 30000, commission: 8 },
  { level: "Semi-Senior Advisor", min: 30000, max: 60000, commission: 10 },
  { level: "Senior Advisor", min: 60000, max: 100000, commission: 12 },
  { level: "Lead Advisor", min: 100000, max: 150000, commission: 15 },
  { level: "Manager", min: 150000, max: 250000, commission: 18 },
  { level: "Director", min: 250000, max: Number.POSITIVE_INFINITY, commission: 20 },
];

function CareerPlanPage() {
  return (
    <Container className="space-y-12" padding="lg">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <SectionHeader
          title="Plan de Carrera"
          description="Tu progression en MaatWork. Alcanza tus metas y aumenta tus comisiones."
          icon={TrendingUp}
        />
      </motion.div>

      <Grid cols={{ sm: 1, md: 2, lg: 4 }} gap={6}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card variant="elevated" className="p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Award className="w-6 h-6 text-primary" />
            </div>
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Nivel Actual</p>
            <p className="text-2xl font-black text-text">{mockUserProgress.currentLevel}</p>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card variant="elevated" className="p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-emerald-500" />
            </div>
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Progreso</p>
            <p className="text-2xl font-black text-emerald-500">{mockUserProgress.progressPercentage}%</p>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card variant="elevated" className="p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-amber-500/10 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-amber-500" />
            </div>
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Producción Anual</p>
            <p className="text-2xl font-black text-text">${mockUserProgress.annualProduction.toLocaleString()}</p>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Card variant="elevated" className="p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-violet-500/10 flex items-center justify-center">
              <Target className="w-6 h-6 text-violet-500" />
            </div>
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Meta Anual</p>
            <p className="text-2xl font-black text-text">${mockUserProgress.annualGoal.toLocaleString()}</p>
          </Card>
        </motion.div>
      </Grid>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <Card variant="outlined" className="p-8">
          <h2 className="text-xl font-black text-text mb-6 flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Tu Progreso hacia el Siguiente Nivel
          </h2>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-text">Siguiente: {mockUserProgress.nextLevel}</p>
                <p className="text-xs text-text-muted">
                  Necesitas ${(mockUserProgress.annualGoal - mockUserProgress.annualProduction).toLocaleString()} más
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-black text-primary">{mockUserProgress.commissionPercentage + 3}% comisión</p>
                <p className="text-xs text-text-muted">+3% al ascender</p>
              </div>
            </div>
            <div className="h-4 bg-surface-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${mockUserProgress.progressPercentage}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-primary to-violet-500 rounded-full"
              />
            </div>
          </div>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
        <Card variant="outlined" className="p-8">
          <h2 className="text-xl font-black text-text mb-6 flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            Esquema de Comisiones
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-3 px-4 text-xs font-bold text-text-muted uppercase tracking-wider">
                    Nivel
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-text-muted uppercase tracking-wider">
                    Rango USD
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-bold text-text-muted uppercase tracking-wider">
                    Comisión
                  </th>
                  <th className="text-center py-3 px-4 text-xs font-bold text-text-muted uppercase tracking-wider">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody>
                {mockLevels.map((lvl, idx) => (
                  <tr
                    key={lvl.level}
                    className={`border-b border-border/20 hover:bg-surface-hover transition-colors ${
                      lvl.level === mockUserProgress.currentLevel ? "bg-primary/5" : ""
                    }`}
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        {idx + 1 <= 3 && <Award className="w-4 h-4 text-amber-500" />}
                        <span
                          className={`font-bold ${lvl.level === mockUserProgress.currentLevel ? "text-primary" : "text-text"}`}
                        >
                          {lvl.level}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-text-muted">
                      ${lvl.min.toLocaleString()} -{" "}
                      {lvl.max === Number.POSITIVE_INFINITY ? "∞" : `$${lvl.max.toLocaleString()}`}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="text-lg font-black text-emerald-500">{lvl.commission}%</span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      {lvl.level === mockUserProgress.currentLevel ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold">
                          <CheckCircle className="w-3 h-3" /> Actual
                        </span>
                      ) : lvl.level === mockUserProgress.nextLevel ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/20 text-amber-500 text-xs font-bold">
                          <TrendingUp className="w-3 h-3" /> Siguiente
                        </span>
                      ) : (
                        <Lock className="w-4 h-4 text-text-muted mx-auto" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </motion.div>
    </Container>
  );
}
