'use client';

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface Tag {
  id: string;
  name: string;
  color: string;
  icon?: string | null;
  description?: string;
}

interface TagManagerDialogProps {
  open: boolean;
  onClose: () => void;
  tags: Tag[];
  onCreateTag: (name: string, color?: string) => void;
  onDeleteTag: (tagId: string) => void;
  isCreating: boolean;
  isDeleting: boolean;
}

export function TagManagerDialog({
  open,
  onClose,
  tags,
  onCreateTag,
  onDeleteTag,
  isCreating,
  isDeleting,
}: TagManagerDialogProps) {
  const [newTagName, setNewTagName] = React.useState('');
  const [selectedColor, setSelectedColor] = React.useState('#8B5CF6');

  const colors = [
    '#8B5CF6', // violet
    '#f59e0b', // amber
    '#10b981', // emerald
    '#ef4444', // red
    '#3b82f6', // blue
    '#ec4899', // pink
    '#14b8a6', // teal
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTagName.trim()) {
      onCreateTag(newTagName.trim(), selectedColor);
      setNewTagName('');
      setSelectedColor('#8B5CF6');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass border-white/8 backdrop-blur-xl max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Gestionar Etiquetas</DialogTitle>
          <DialogDescription className="text-slate-400">
            Crea y elimina etiquetas para organizar tus contactos
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Create new tag form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex gap-1 flex-wrap">
              {colors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`w-6 h-6 rounded-full transition-transform ${
                    selectedColor === color ? 'scale-110 ring-2 ring-white' : ''
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Nombre de etiqueta..."
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                className="flex-1 glass border-white/10 bg-white/5 text-white placeholder:text-slate-500"
              />
              <Button
                type="submit"
                disabled={!newTagName.trim() || isCreating}
                className="bg-violet-500 hover:bg-violet-600"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            </form>

          {/* Tags list */}
          <div className="max-h-64 overflow-y-auto space-y-2">
            {tags.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-4">No hay etiquetas creadas</p>
            ) : (
              tags.map((tag) => (
                <div
                  key={tag.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    />
                    <span className="text-white text-sm">{tag.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-slate-400 hover:text-red-400"
                    onClick={() => onDeleteTag(tag.id)}
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="glass border-white/10 text-white">
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
