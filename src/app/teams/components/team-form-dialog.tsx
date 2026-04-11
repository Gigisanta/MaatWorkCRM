"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils/utils";
import {
  createTeamSchema,
  CreateTeamForm,
  CreateTeamFormInput,
  User,
} from "../types";

interface TeamFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  users: User[];
  onSubmit: (data: CreateTeamForm) => void;
}

export function TeamFormDialog({
  open,
  onOpenChange,
  users,
  onSubmit,
}: TeamFormDialogProps) {
  const form = useForm<CreateTeamFormInput, unknown, CreateTeamForm>({
    resolver: zodResolver(createTeamSchema) as never,
    defaultValues: {
      name: "",
      description: "",
      leaderId: "",
      memberIds: [],
    },
  });

  const [selectedMembers, setSelectedMembers] = React.useState<string[]>([]);

  const toggleMember = (userId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  React.useEffect(() => {
    form.setValue("memberIds", selectedMembers);
  }, [selectedMembers, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl bg-slate-900 max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-white">Crear Nuevo Equipo</DialogTitle>
          <DialogDescription className="text-slate-400">
            Configura tu nuevo equipo y asigna miembros
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300">Nombre del Equipo *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl bg-white/5 text-white"
                      placeholder="Ej: Equipo Alfa"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300">Descripción</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl bg-white/5 text-white resize-none"
                      placeholder="Descripción del equipo..."
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="leaderId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300">Líder del Equipo</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl bg-white/5 text-white">
                        <SelectValue placeholder="Selecciona un líder" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name || user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div>
              <FormLabel className="text-slate-300">Miembros Iniciales</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl bg-white/5 text-white mt-2"
                  >
                    {selectedMembers.length > 0
                      ? `${selectedMembers.length} seleccionados`
                      : "Seleccionar miembros..."}
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0 bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl bg-slate-900">
                  <Command>
                    <CommandInput placeholder="Buscar usuarios..." />
                    <CommandList>
                      <CommandEmpty>No se encontraron usuarios.</CommandEmpty>
                      <CommandGroup>
                        {users.map((user) => (
                          <CommandItem key={user.id} onSelect={() => toggleMember(user.id)}>
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedMembers.includes(user.id) ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {user.name || user.email}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-violet-500 hover:bg-violet-600">
                Crear Equipo
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
