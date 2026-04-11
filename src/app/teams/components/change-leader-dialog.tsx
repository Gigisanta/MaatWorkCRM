"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { User } from "../types";

interface ChangeLeaderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  users: User[];
  currentLeaderId: string | null;
  onSubmit: (leaderId: string) => void;
}

export function ChangeLeaderDialog({
  open,
  onOpenChange,
  users,
  currentLeaderId,
  onSubmit,
}: ChangeLeaderDialogProps) {
  const [selectedLeaderId, setSelectedLeaderId] = React.useState(currentLeaderId || "");

  React.useEffect(() => {
    setSelectedLeaderId(currentLeaderId || "");
  }, [currentLeaderId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl bg-slate-900">
        <DialogHeader>
          <DialogTitle className="text-white">Cambiar Líder del Equipo</DialogTitle>
          <DialogDescription className="text-slate-400">
            Selecciona un nuevo líder para este equipo
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-300 mb-2 block">Nuevo Líder</label>
            <Select value={selectedLeaderId} onValueChange={setSelectedLeaderId}>
              <SelectTrigger className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl bg-white/5 text-white">
                <SelectValue placeholder="Selecciona un líder" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name || user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              className="bg-violet-500 hover:bg-violet-600"
              onClick={() => {
                if (selectedLeaderId && selectedLeaderId !== currentLeaderId) {
                  onSubmit(selectedLeaderId);
                }
                onOpenChange(false);
              }}
            >
              Guardar
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
