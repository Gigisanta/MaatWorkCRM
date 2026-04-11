'use client';

import * as React from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Lightbulb, Bug, Zap, MessageSquare } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/auth-context";

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const feedbackTypes = [
  { value: "general", label: "General", icon: MessageSquare },
  { value: "bug", label: "Reportar bug", icon: Bug },
  { value: "feature", label: "Nueva funcionalidad", icon: Zap },
  { value: "improvement", label: "Mejora", icon: Lightbulb },
];

export function FeedbackDialog({ open, onOpenChange }: FeedbackDialogProps) {
  const { user } = useAuth();
  const [type, setType] = React.useState("general");
  const [subject, setSubject] = React.useState("");
  const [content, setContent] = React.useState("");

  const mutation = useMutation({
    mutationFn: async (data: { type: string; subject: string; content: string }) => {
      if (!user?.organizationId) throw new Error("No organization");
      const res = await fetch("/api/feedback", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, organizationId: user.organizationId }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Error al enviar feedback");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("¡Gracias por tu feedback!");
      onOpenChange(false);
      setSubject("");
      setContent("");
      setType("general");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !content.trim()) {
      toast.error("Completa el asunto y la descripción");
      return;
    }
    mutation.mutate({ type, subject, content });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-violet-400" />
            Enviar Feedback
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Ayúdanos a mejorar MaatWork CRM con tus ideas y sugerencias
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {/* Type selector */}
          <div className="space-y-2">
            <Label className="text-slate-300">Tipo de feedback</Label>
            <div className="grid grid-cols-2 gap-2">
              {feedbackTypes.map((ft) => (
                <button
                  key={ft.value}
                  type="button"
                  onClick={() => setType(ft.value)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm transition-all ${
                    type === ft.value
                      ? "bg-violet-500/10 border-violet-500/30 text-violet-300"
                      : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/8 hover:border-white/15"
                  }`}
                >
                  <ft.icon className="h-4 w-4" />
                  {ft.label}
                </button>
              ))}
            </div>
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject" className="text-slate-300">
              Asunto *
            </Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Resumen breve del feedback"
              className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl bg-white/5 text-white"
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content" className="text-slate-300">
              Descripción *
            </Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Cuéntanos más detalles sobre tu feedback..."
              className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl bg-white/5 text-white resize-none"
              rows={4}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="bg-violet-500 hover:bg-violet-600"
            >
              {mutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Enviar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
