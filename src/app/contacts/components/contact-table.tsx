'use client';

import * as React from "react";
import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { User, ChevronRight, Edit, XCircle, Plus, FileText } from "lucide-react";
import { type Tag } from "./tag-manager-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatDistanceToNow } from "date-fns";
import { EmptyState } from "@/components/ui/empty-state";

export interface Contact {
  id: string;
  name: string;
  email: string | null;
  company: string | null;
  emoji: string;
  source: string | null;
  pipelineStageId: string | null;
  pipelineStage: {
    id: string;
    name: string;
    color: string;
    order: number;
  } | null;
  assignedTo: string | null;
  assignedUser: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  } | null;
  tags: Tag[];
  createdAt: string;
  updatedAt: string;
  hasFinancialPlan?: boolean;
}

export interface PipelineStage {
  id: string;
  name: string;
  color: string;
  order: number;
  isActive?: boolean;
}

interface ContactTableProps {
  contacts: Contact[];
  selectedContacts: string[];
  isAdvisor: boolean;
  stages: PipelineStage[];
  isLoading: boolean;
  search?: string;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onContactClick: (contact: Contact) => void;
  onUpdateStage: (contactId: string, stageId: string) => void;
  onRemoveTag: (contactId: string, tagId: string) => void;
  onAddTag: (contactId: string, tagId: string | null, tagName?: string) => void;
  allTags: Tag[];
  editingContactTagsId: string | null;
  onEditingContactTagsIdChange: (id: string | null) => void;
  onCreateClick?: () => void;
}

function ContactsTableSkeleton() {
  return (
    <div className="divide-y divide-white/5">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3.5" style={{ animationDelay: `${i * 80}ms` }}>
          <div className="h-4 w-4 bg-white/6 rounded animate-pulse" />
          <div className="h-9 w-9 rounded-full bg-white/6 animate-pulse" />
          <div className="flex-1 space-y-1.5">
            <div className="h-4 w-36 bg-white/6 rounded-md animate-pulse" />
            <div className="h-3 w-24 bg-white/4 rounded-md animate-pulse" />
          </div>
          <div className="h-3.5 w-32 bg-white/6 rounded-md animate-pulse hidden lg:block" />
          <div className="h-5 w-20 bg-white/6 rounded-full animate-pulse hidden lg:block" />
          <div className="h-3 w-16 bg-white/4 rounded-md animate-pulse hidden sm:block" />
        </div>
      ))}
    </div>
  );
}

export function ContactTable({
  contacts,
  selectedContacts,
  isAdvisor,
  stages,
  isLoading,
  search,
  onToggleSelect,
  onToggleSelectAll,
  onContactClick,
  onUpdateStage,
  onRemoveTag,
  onAddTag,
  allTags,
  editingContactTagsId,
  onEditingContactTagsIdChange,
  onCreateClick,
}: ContactTableProps) {
  const router = useRouter();

  if (isLoading) {
    return (
      <Card className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl overflow-hidden">
        <CardContent className="p-0">
          <ContactsTableSkeleton />
        </CardContent>
      </Card>
    );
  }

  if (contacts.length === 0) {
    return (
      <EmptyState
        icon={User}
        title={search ? "Sin resultados" : "No hay contactos aún"}
        description={
          search
            ? `No se encontraron contactos para "${search}"`
            : "Crea tu primer contacto para empezar a gestionar tus relaciones"
        }
        action={!search && onCreateClick ? { label: "Crear contacto", onClick: onCreateClick } : undefined}
        className="my-4"
      />
    );
  }

  return (
    <Card className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl overflow-hidden">
      <CardContent className="p-0 overflow-auto">
        <table className="w-full border-collapse min-w-[800px]">
          <thead className="sticky top-0 z-10 bg-[#0E0F12]">
            <tr className="border-b border-white/6">
              <th className="w-12 shrink-0 px-4 py-3 text-left">
                <Checkbox
                  checked={
                    selectedContacts.length === contacts.length && contacts.length > 0
                  }
                  onCheckedChange={onToggleSelectAll}
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-0">Contacto</th>
              <th className="hidden lg:table-cell w-40 shrink-0 px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Etapa</th>
              <th className="hidden lg:table-cell w-56 shrink-0 px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Etiquetas</th>
              {!isAdvisor && (
                <th className="hidden xl:table-cell w-40 shrink-0 px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Asignado
                </th>
              )}
              <th className="hidden sm:table-cell w-32 shrink-0 px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Última edición
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {contacts.map((contact) => (
              <tr
                key={contact.id}
                className="hover:bg-white/3 cursor-pointer transition-colors duration-150 group"
                onClick={() => onContactClick(contact)}
              >
                    <td className="w-12 shrink-0 px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedContacts.includes(contact.id)}
                        onCheckedChange={() => onToggleSelect(contact.id)}
                      />
                    </td>
                    <td className="min-w-0 px-4 py-3">
                      <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-white text-sm">{contact.name}</p>
                            {contact.hasFinancialPlan && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/12 border border-emerald-500/25 text-[10px] text-emerald-400 font-medium">
                                <FileText className="h-2.5 w-2.5" />
                                Plan
                              </span>
                            )}
                          </div>
                          {contact.company && (
                            <p className="text-[11px] text-slate-500 truncate">{contact.company}</p>
                          )}
                        </div>
                    </td>
                    <td className="hidden lg:table-cell w-40 shrink-0 px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        <Badge
                          style={{
                            backgroundColor:
                              (contact.pipelineStage?.color || "#6366f1") + "20",
                            color: contact.pipelineStage?.color || "#6366f1",
                          }}
                          className="text-xs cursor-pointer hover:opacity-80 transition-opacity max-w-[100px] truncate"
                          onClick={() => router.push(`/pipeline?contact=${contact.id}`)}
                        >
                          {contact.pipelineStage?.name || "Sin etapa"}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-slate-400 hover:text-white shrink-0"
                          disabled={!contact.pipelineStage || (stages.find(s => s.id === contact.pipelineStageId)?.order || 0) >= stages.filter(s => s.isActive).length}
                          onClick={() => {
                            const currentOrder = stages.find(s => s.id === contact.pipelineStageId)?.order || 0;
                            const nextStage = stages.find(s => s.order === currentOrder + 1);
                            if (nextStage) {
                              onUpdateStage(contact.id, nextStage.id);
                            }
                          }}
                        >
                          <ChevronRight className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                    <td className="hidden lg:table-cell w-56 shrink-0 px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-wrap gap-1.5 items-center">
                        {contact.tags && contact.tags.length > 0 ? (
                          <>
                            {contact.tags.map((tag) => (
                              <Badge
                                key={tag.id}
                                variant="secondary"
                                className="text-xs cursor-pointer group-hover:opacity-80 max-w-[90px] truncate"
                                style={{
                                  backgroundColor: tag.color + "20",
                                  color: tag.color,
                                }}
                                onClick={() => onEditingContactTagsIdChange(contact.id)}
                              >
                                {tag.name}
                                <XCircle className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 shrink-0" />
                              </Badge>
                            ))}
                          </>
                        ) : (
                          <span className="text-slate-500 text-xs">Sin tags</span>
                        )}
                        <Dialog open={editingContactTagsId === contact.id} onOpenChange={(open) => {
                          if (!open) onEditingContactTagsIdChange(null);
                        }}>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 text-slate-400 hover:text-white"
                              onClick={() => onEditingContactTagsIdChange(contact.id)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-[#0E0F12] border border-white/10 backdrop-blur-xl max-w-md w-full rounded-xl">
                            <DialogHeader>
                              <DialogTitle className="text-white">Gestionar etiquetas</DialogTitle>
                              <DialogDescription className="text-slate-400">
                                Etiquetas de {contact.name}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <p className="text-xs text-slate-400">Etiquetas actuales</p>
                                {contact.tags && contact.tags.length > 0 ? (
                                  <div className="flex flex-wrap gap-2">
                                    {contact.tags.map((tag) => (
                                      <Badge
                                        key={tag.id}
                                        variant="secondary"
                                        className="text-xs cursor-pointer hover:opacity-80 pl-2"
                                        style={{
                                          backgroundColor: tag.color + "20",
                                          color: tag.color,
                                        }}
                                        onClick={() => onRemoveTag(contact.id, tag.id)}
                                      >
                                        {tag.name}
                                        <XCircle className="h-3 w-3 ml-1" />
                                      </Badge>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm text-slate-500">Sin etiquetas</p>
                                )}
                              </div>
                              {allTags.length > 0 && (
                                <div className="space-y-2">
                                  <p className="text-xs text-slate-400">Agregar etiqueta</p>
                                  <div className="flex flex-wrap gap-2">
                                    {allTags
                                      .filter(t => !contact.tags?.some(ct => ct.id === t.id))
                                      .map((tag) => (
                                        <Badge
                                          key={tag.id}
                                          variant="secondary"
                                          className="text-xs cursor-pointer hover:opacity-80"
                                          style={{
                                            backgroundColor: tag.color + "20",
                                            color: tag.color,
                                          }}
                                          onClick={() => onAddTag(contact.id, tag.id, tag.name)}
                                        >
                                          <Plus className="h-3 w-3 mr-1" />
                                          {tag.name}
                                        </Badge>
                                      ))}
                                  </div>
                                </div>
                              )}
                              <div className="space-y-2">
                                <p className="text-xs text-slate-400">Crear nueva etiqueta</p>
                                <form
                                  onSubmit={(e) => {
                                    e.preventDefault();
                                    const form = e.target as HTMLFormElement;
                                    const input = form.elements.namedItem("newTagName") as HTMLInputElement;
                                    if (input.value.trim()) {
                                      onAddTag(contact.id, null, input.value.trim());
                                      input.value = "";
                                    }
                                  }}
                                  className="flex gap-2"
                                >
                                  <Input
                                    name="newTagName"
                                    placeholder="Nombre de la etiqueta..."
                                    className="bg-white/5 border border-white/10 text-white placeholder:text-slate-500 h-9 text-sm"
                                  />
                                  <Button type="submit" size="sm" className="h-9 bg-violet-500 hover:bg-violet-600">
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </form>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </td>
                    {!isAdvisor && (
                      <td className="hidden xl:table-cell px-4 py-3">
                        {contact.assignedUser ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="bg-violet-500/20 text-violet-400 text-xs">
                                {contact.assignedUser.name
                                  ?.split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-slate-300">
                              {contact.assignedUser.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-sm">Sin asignar</span>
                        )}
                      </td>
                    )}
                    <td className="hidden sm:table-cell px-4 py-3 text-xs text-slate-500">
                      {formatDistanceToNow(new Date(contact.updatedAt), { addSuffix: true })}
                    </td>
                  </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
