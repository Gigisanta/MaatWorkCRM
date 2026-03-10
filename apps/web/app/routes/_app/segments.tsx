import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Filter, Plus, Users } from "lucide-react";
import { Badge } from "~/components/ui/Badge";
import { Button } from "~/components/ui/Button";
import { Card } from "~/components/ui/Card";
import { Container, Stack } from "~/components/ui/Layout";
import { SectionHeader } from "~/components/ui/LayoutCards";
import { useContacts, useTasks } from "~/lib/hooks/use-crm";

export const Route = createFileRoute("/_app/segments")({
  component: SegmentsPage,
});

function SegmentsPage() {
  const { data: contacts } = useContacts();
  const { data: tasks } = useTasks();

  const investmentsContacts = contacts?.filter((c: any) => c.businessLine === "inversiones") || [];
  const zurichContacts = contacts?.filter((c: any) => c.businessLine === "zurich") || [];
  const patrimonialContacts = contacts?.filter((c: any) => c.businessLine === "patrimonial") || [];

  const segments = [
    { name: "Inversiones", count: investmentsContacts.length, color: "#8B5CF6", description: "Clientes de inversión" },
    { name: "Zurich", count: zurichContacts.length, color: "#F59E0B", description: "Seguros Zurich" },
    { name: "Patrimonial", count: patrimonialContacts.length, color: "#10B981", description: "Gestión patrimonial" },
  ];

  return (
    <Container className="space-y-8" padding="lg">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <SectionHeader
          title="Segmentos"
          description="Agrupa tus contactos por línea de negocio para comunicaciones específicas."
          icon={Filter}
          actions={
            <Button variant="primary" size="md">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Segmento
            </Button>
          }
        />
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {segments.map((segment, idx) => (
          <motion.div
            key={segment.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card className="p-6 bg-[#0F0F0F] border-white/5 hover:border-[#8B5CF6]/30 transition-all cursor-pointer group">
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: `${segment.color}20` }}
                >
                  <Users className="w-6 h-6" style={{ color: segment.color }} />
                </div>
                <Badge className="bg-white/5 text-[#737373] border-0">{segment.count} contactos</Badge>
              </div>
              <h3 className="text-lg font-bold text-[#F5F5F5] mb-1 group-hover:text-[#8B5CF6] transition-colors">
                {segment.name}
              </h3>
              <p className="text-sm text-[#737373]">{segment.description}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card className="p-8 bg-[#0F0F0F] border-white/5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-[#F5F5F5]">Segmentos Dinámicos</h3>
            <p className="text-sm text-[#737373] mt-1">Crea reglas automáticas paraSegmentar contactos</p>
          </div>
          <Button variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Crear Regla
          </Button>
        </div>
      </Card>
    </Container>
  );
}
