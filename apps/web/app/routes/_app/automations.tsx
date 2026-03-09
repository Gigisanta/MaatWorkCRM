import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Plus, Settings, ToggleLeft, Zap } from "lucide-react";
import { Badge } from "~/components/ui/Badge";
import { Button } from "~/components/ui/Button";
import { Card } from "~/components/ui/Card";
import { Container, Stack } from "~/components/ui/Layout";
import { SectionHeader } from "~/components/ui/LayoutCards";

export const Route = createFileRoute("/_app/automations")({
  component: AutomationsPage,
});

const triggerIcons: Record<string, React.ElementType> = {
  pipeline_stage_change: Zap,
  contact_created: AlertCircle,
  task_overdue: AlertCircle,
  meeting_scheduled: Settings,
};

const automations = [
  {
    id: "1",
    name: "notify_stage_change",
    displayName: "Notificar cambio de etapa",
    triggerType: "pipeline_stage_change",
    enabled: true,
    description: "Envía una notificación cuando un contacto cambia de etapa en el pipeline",
  },
  {
    id: "2",
    name: "welcome_new_contact",
    displayName: "Bienvenida nuevo contacto",
    triggerType: "contact_created",
    enabled: true,
    description: "Envía email de bienvenida cuando se crea un nuevo contacto",
  },
  {
    id: "3",
    name: "alert_overdue_task",
    displayName: "Alerta tarea vencida",
    triggerType: "task_overdue",
    enabled: false,
    description: "Notifica cuando una tarea está vencida",
  },
];

function AutomationsPage() {
  return (
    <Container className="space-y-8" padding="lg">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <SectionHeader
          title="Automatizaciones"
          description="Configura triggers y acciones automáticas basadas en eventos del CRM."
          icon={Zap}
          actions={
            <Button variant="primary" size="md">
              <Plus className="w-4 h-4 mr-2" />
              Nueva Automatización
            </Button>
          }
        />
      </motion.div>

      <Stack gap={4}>
        {automations.map((automation, idx) => {
          const Icon = triggerIcons[automation.triggerType] || Zap;

          return (
            <motion.div
              key={automation.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="p-6 bg-[#0F0F0F] border-white/5 hover:border-[#8B5CF6]/30 transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-3 rounded-xl ${automation.enabled ? "bg-[#8B5CF6]/10 text-[#8B5CF6]" : "bg-[#18181B] text-[#737373]"}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-bold text-[#F5F5F5]">{automation.displayName}</h3>
                        <Badge
                          className={
                            automation.enabled
                              ? "bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20"
                              : "bg-[#737373]/10 text-[#737373] border-[#737373]/20"
                          }
                        >
                          {automation.enabled ? "Activa" : "Inactiva"}
                        </Badge>
                      </div>
                      <p className="text-sm text-[#737373]">{automation.description}</p>
                      <p className="text-xs text-[#525252] mt-2 font-mono">Trigger: {automation.triggerType}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 rounded-lg hover:bg-white/5 text-[#737373] hover:text-[#8B5CF6] transition-colors">
                      <Settings className="w-5 h-5" />
                    </button>
                    <button
                      className={`p-2 rounded-lg transition-colors ${automation.enabled ? "text-[#10B981]" : "text-[#737373] hover:text-[#10B981]"}`}
                    >
                      <ToggleLeft className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </Stack>

      <Card className="p-8 bg-gradient-to-br from-[#8B5CF6]/10 to-[#18181B] border-[#8B5CF6]/20">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-[#8B5CF6]/20 rounded-xl">
            <Zap className="w-6 h-6 text-[#8B5CF6]" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-[#F5F5F5]">¿Necesitas más automatizaciones?</h3>
            <p className="text-sm text-[#737373] mt-1">Integra con Inngest para crear flujos de trabajo complejos</p>
          </div>
          <Button variant="outline">Ver Documentación</Button>
        </div>
      </Card>
    </Container>
  );
}
