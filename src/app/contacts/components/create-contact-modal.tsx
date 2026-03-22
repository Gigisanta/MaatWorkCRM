'use client';

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const contactFormSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  company: z.string().optional().or(z.literal("")),
  emoji: z.string().default("👤"),
  source: z.string().optional().or(z.literal("")),
  pipelineStageId: z.string().optional().or(z.literal("")),
  assignedTo: z.string().optional().or(z.literal("")),
});

type ContactFormData = z.infer<typeof contactFormSchema>;

interface PipelineStage {
  id: string;
  name: string;
  color: string;
  order: number;
}

interface CreateContactModalProps {
  open: boolean;
  onClose: () => void;
  stages: PipelineStage[];
  organizationId: string | null;
}

export function CreateContactModal({
  open,
  onClose,
  stages,
  organizationId,
}: CreateContactModalProps) {
  const queryClient = useQueryClient();

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      company: "",
      emoji: "👤",
      source: "",
      pipelineStageId: "",
      assignedTo: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ContactFormData) => {
      if (!organizationId) throw new Error("No hay organización seleccionada");
      const response = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          organizationId,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al crear contacto");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast.success("Contacto creado exitosamente");
      form.reset();
      onClose();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const onSubmit = (data: ContactFormData) => {
    createMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass border-white/10 bg-slate-900 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Nuevo Contacto</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              name="name"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-400">Nombre *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="glass border-white/10 bg-white/5 text-white"
                      placeholder="Nombre completo"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                name="email"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-400">Email</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        className="glass border-white/10 bg-white/5 text-white"
                        placeholder="email@ejemplo.com"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="phone"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-400">Teléfono</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="glass border-white/10 bg-white/5 text-white"
                        placeholder="+52 55 1234 5678"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              name="company"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-400">Empresa</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="glass border-white/10 bg-white/5 text-white"
                      placeholder="Nombre de la empresa"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                name="pipelineStageId"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-400">Etapa inicial</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="glass border-white/10 bg-white/5 text-white">
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {stages.map((stage) => (
                          <SelectItem key={stage.id} value={stage.id}>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: stage.color }}
                              />
                              {stage.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="glass border-white/10"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="bg-indigo-500 hover:bg-indigo-600"
              >
                {createMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Crear Contacto
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
