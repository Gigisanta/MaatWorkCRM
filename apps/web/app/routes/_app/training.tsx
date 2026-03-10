import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, Clock, Compass, Download, ExternalLink, FileText, Play, Plus, Star, Video } from "lucide-react";
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
  guide: { icon: "Compass", color: "amber", label: "Guía Técnica" },
  video: { icon: "Video", color: "primary", label: "Video Tutorial" },
  document: { icon: "FileText", color: "blue", label: "Documentación" },
  course: { icon: "BookOpen", color: "emerald", label: "Curso Completo" },
};

const MATERIALS = [
  {
    id: "1",
    title: "Guía de Onboarding para Asesores",
    description: "Material inicial fundamental para nuevos asesores del equipo MaatWork.",
    category: "guide",
    duration: "45 min",
    rating: 4.8,
    url: "#",
  },
  {
    id: "2",
    title: "Técnicas de Cierre de Venta (High Ticket)",
    description: "Video curso avanzado sobre negociación y cierre de contratos premium.",
    category: "video",
    duration: "1h 20m",
    rating: 5.0,
    url: "#",
  },
  {
    id: "3",
    title: "Manual del Pipeline CRM y Automatización",
    description: "Dominio absoluto de las etapas de venta y disparadores automáticos.",
    category: "document",
    duration: "30 min",
    rating: 4.7,
    url: "#",
  },
  {
    id: "4",
    title: "Diplomado: Asesoría Financiera Estratégica",
    description: "Formación integral para el desarrollo de portafolios de inversión complejos.",
    category: "course",
    duration: "12 horas",
    rating: 4.9,
    url: "#",
  },
];

function TrainingPage() {
  return (
    <Container className="py-6 space-y-8 animate-enter">
      {/* Header */}
      <Stack direction="row" align="center" justify="between">
        <Stack direction="col" gap="xs">
          <h1 className="text-4xl font-black text-text font-display tracking-tight">Capacitación y Recursos</h1>
          <p className="text-text-secondary">
            Potencia tus habilidades con nuestra librería de conocimiento exclusivo.
          </p>
        </Stack>
        <Button variant="primary">
          <Plus className="w-4 h-4 mr-2" /> Subir Recurso
        </Button>
      </Stack>

      {/* Categories Filter (Visual) */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {["Todos", "Videos", "Guías", "Cursos", "Documentos"].map((cat, i) => (
          <Button
            key={cat}
            variant={i === 0 ? "secondary" : "ghost"}
            className={cn("rounded-full px-6", i === 0 && "bg-primary text-white")}
          >
            {cat}
          </Button>
        ))}
      </div>

      <Grid cols={{ md: 2 }} gap="lg">
        {MATERIALS.map((mat) => {
          const config = categoryConfig[mat.category] ?? categoryConfig.document;
          return (
            <Card key={mat.id} variant="elevated" className="group overflow-hidden border-secondary/10">
              <div className={cn("h-2 w-full", `bg-${config.color}-500/40`)} />
              <CardContent className="p-6">
                <Stack direction="row" gap="md" align="start">
                  <div
                    className={cn(
                      "p-4 rounded-lg shrink-0 border border-secondary/10 transition-transform group-hover:scale-105",
                      `bg-${config.color}-500/10 text-${config.color}-500`,
                    )}
                  >
                    <Icon name={config.icon} size={28} />
                  </div>
                  <div className="flex-1 space-y-3">
                    <Stack direction="row" align="center" justify="between">
                      <Badge variant="secondary" className="text-[10px] uppercase font-black tracking-tighter">
                        {config.label}
                      </Badge>
                      <Stack direction="row" gap="xs" align="center" className="text-amber-400">
                        <Star size={12} fill="currentColor" />
                        <span className="text-xs font-bold">{mat.rating}</span>
                      </Stack>
                    </Stack>

                    <div>
                      <h3 className="text-xl font-bold text-text group-hover:text-primary transition-colors">
                        {mat.title}
                      </h3>
                      <p className="text-sm text-text-secondary mt-1 leading-relaxed line-clamp-2">{mat.description}</p>
                    </div>

                    <Stack
                      direction="row"
                      align="center"
                      justify="between"
                      className="pt-4 mt-auto border-t border-secondary/5"
                    >
                      <Stack
                        direction="row"
                        gap="sm"
                        align="center"
                        className="text-text-muted text-[11px] font-bold uppercase tracking-wider"
                      >
                        <Stack direction="row" gap="xs" align="center">
                          <Clock size={12} />
                          {mat.duration}
                        </Stack>
                      </Stack>
                      <Stack direction="row" gap="xs">
                        <Button variant="ghost" size="md" className="h-9 w-9 rounded-xl hover:bg-secondary/10">
                          <Download size={16} />
                        </Button>
                        <Button variant="primary" size="sm" className="rounded-lg px-4">
                          <Play size={14} className="mr-2 fill-current" /> Comenzar
                        </Button>
                      </Stack>
                    </Stack>
                  </div>
                </Stack>
              </CardContent>
            </Card>
          );
        })}
      </Grid>

      {/* Professional Achievement Card */}
      <Card
        variant="elevated"
        className="bg-gradient-to-br from-primary/10 via-violet-500/5 to-transparent border-primary/20"
      >
        <CardContent className="p-8">
          <Grid cols={{ lg: 2 }} gap="lg">
            <Stack direction="col" gap="md">
              <Badge variant="primary" className="w-fit">
                Estatus de Aprendizaje
              </Badge>
              <h2 className="text-3xl font-black text-text font-display">¡Sigue así, Pedro!</h2>
              <p className="text-text-secondary max-w-md">
                Has completado el <span className="text-primary font-bold">64% de tu ruta de aprendizaje</span>{" "}
                obligatoria para este trimestre. Te faltan solo 2 módulos para alcanzar el nivel Senior.
              </p>
              <div className="w-full h-3 bg-secondary/10 rounded-full overflow-hidden border border-secondary/5 shadow-inner">
                <div className="h-full bg-gradient-to-r from-primary to-violet-500 rounded-full w-[64%]" />
              </div>
            </Stack>
            <div className="relative flex justify-center lg:justify-end">
              <div className="relative z-10 w-32 h-32 rounded-lg bg-background border-2 border-primary/20 flex items-center justify-center shadow-lg rotate-3">
                <Icon name="Award" size={64} className="text-primary" />
              </div>
            </div>
          </Grid>
        </CardContent>
      </Card>
    </Container>
  );
}
