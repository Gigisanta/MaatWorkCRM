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
  value: number;
  expectedCloseDate: string | null;
}

interface TagManagerDialogProps {
  open: boolean;
  onClose: () => void;
  tags: Tag[];
  onCreateTag: (name: string, color?: string, value?: number, expectedCloseDate?: string | null) => void;
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
  const [selectedColor, setSelectedColor] = React.useState('#6366f1');
  const [newTagValue, setNewTagValue] = React.useState(0);
  const [newTagExpectedCloseDate, setNewTagExpectedCloseDate] = React.useState<string | null>(null);

  const colors = [
    '#6366f1', // indigo
    '#8b5cf6', // violet
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
      onCreateTag(newTagName.trim(), selectedColor, newTagValue || undefined, newTagExpectedCloseDate || undefined);
      setNewTagName('');
      setSelectedColor('#6366f1');
      setNewTagValue(0);
      setNewTagExpectedCloseDate(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass border-white/10 bg-slate-900/95 backdrop-blur-xl max-w-md">
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
                className="bg-indigo-500 hover:bg-indigo-600"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                <Input
                  type="number"
                  placeholder="Valor"
                  value={newTagValue || ''}
                  onChange={(e) => setNewTagValue(e.target.value ? Number(e.target.value) : 0)}
                  className="pl-7 glass border-white/10 bg-white/5 text-white placeholder:text-slate-500"
                  min="0"
                  step="0.01"
                />
              </div>
              <Input
                type="date"
                placeholder="Fecha cierre esperada"
                value={newTagExpectedCloseDate || ''}
                onChange={(e) => setNewTagExpectedCloseDate(e.target.value || null)}
                className="flex-1 glass border-white/10 bg-white/5 text-white placeholder:text-slate-500"
              />
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
                    {tag.value > 0 && (
                      <span className="text-emerald-400 text-xs font-medium">${tag.value.toLocaleString()}</span>
                    )}
                    {tag.expectedCloseDate && (
                      <span className="text-slate-400 text-xs">
                        {new Date(tag.expectedCloseDate).toLocaleDateString()}
                      </span>
                    )}
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
