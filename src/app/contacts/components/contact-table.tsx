'use client';

import { useRouter } from "next/navigation";
import { User, ChevronRight, Edit, XCircle, Plus } from "lucide-react";
import { type Tag } from "./tag-manager-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { es } from "date-fns/locale";

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
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onContactClick: (contact: Contact) => void;
  onUpdateStage: (contactId: string, stageId: string) => void;
  onRemoveTag: (contactId: string, tagId: string) => void;
  onAddTag: (contactId: string, tagId: string | null, tagName?: string) => void;
  allTags: Tag[];
  editingContactTagsId: string | null;
  onEditingContactTagsIdChange: (id: string | null) => void;
}

function ContactsTableSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4">
          <div className="h-4 w-4 bg-slate-700/50 rounded animate-pulse" />
          <div className="h-10 w-10 rounded-full bg-slate-700/50 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-40 bg-slate-700/50 rounded animate-pulse" />
            <div className="h-3 w-24 bg-slate-700/50 rounded animate-pulse" />
          </div>
          <div className="h-4 w-32 bg-slate-700/50 rounded animate-pulse" />
          <div className="h-6 w-20 bg-slate-700/50 rounded animate-pulse" />
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
  onToggleSelect,
  onToggleSelectAll,
  onContactClick,
  onUpdateStage,
  onRemoveTag,
  onAddTag,
  allTags,
  editingContactTagsId,
  onEditingContactTagsIdChange,
}: ContactTableProps) {
  const router = useRouter();

  if (isLoading) {
    return (
      <Card className="glass border-white/10">
        <CardContent className="p-0">
          <ContactsTableSkeleton />
        </CardContent>
      </Card>
    );
  }

  if (contacts.length === 0) {
    return (
      <Card className="glass border-white/10">
        <CardContent className="p-0">
          <div className="flex flex-col items-center justify-center py-12">
            <User className="h-12 w-12 text-slate-500 mb-4" />
            <p className="text-slate-400 text-lg">No hay contactos</p>
            <p className="text-slate-500 text-sm">
              Crea tu primer contacto para comenzar
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass border-white/10">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-white/5">
              <TableHead className="w-12">
                <Checkbox
                  checked={
                    selectedContacts.length === contacts.length && contacts.length > 0
                  }
                  onCheckedChange={onToggleSelectAll}
                />
              </TableHead>
              <TableHead className="text-slate-400">Contacto</TableHead>
              <TableHead className="text-slate-400">Email</TableHead>
              <TableHead className="text-slate-400 hidden lg:table-cell">Etapa</TableHead>
              <TableHead className="text-slate-400 hidden lg:table-cell">Tags</TableHead>
              {!isAdvisor && (
                <TableHead className="text-slate-400 hidden xl:table-cell">
                  Asignado
                </TableHead>
              )}
              <TableHead className="text-slate-400 hidden sm:table-cell">
                Creado
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts.map((contact) => (
              <TableRow
                key={contact.id}
                className="border-white/10 hover:bg-white/5 cursor-pointer"
                onClick={() => onContactClick(contact)}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedContacts.includes(contact.id)}
                    onCheckedChange={() => onToggleSelect(contact.id)}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{contact.emoji}</span>
                    <div>
                      <p className="font-medium text-white">{contact.name}</p>
                      {contact.company && (
                        <p className="text-xs text-slate-500">{contact.company}</p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-slate-300">{contact.email || "-"}</TableCell>
                <TableCell className="hidden lg:table-cell" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-2">
                    <Badge
                      style={{
                        backgroundColor:
                          (contact.pipelineStage?.color || "#6366f1") + "20",
                        color: contact.pipelineStage?.color || "#6366f1",
                      }}
                      className="text-xs cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => router.push(`/pipeline?contact=${contact.id}`)}
                    >
                      {contact.pipelineStage?.name || "Sin etapa"}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-slate-400 hover:text-white"
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
                </TableCell>
                <TableCell className="hidden lg:table-cell" onClick={(e) => e.stopPropagation()}>
                  <div className="flex flex-wrap gap-1 items-center">
                    {contact.tags && contact.tags.length > 0 ? (
                      <>
                        {contact.tags.map((tag) => (
                          <Badge
                            key={tag.id}
                            variant="secondary"
                            className="text-xs cursor-pointer group hover:opacity-80"
                            style={{
                              backgroundColor: tag.color + "20",
                              color: tag.color,
                            }}
                            onClick={() => onEditingContactTagsIdChange(contact.id)}
                          >
                            {tag.name}
                            <XCircle className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100" />
                          </Badge>
                        ))}
                      </>
                    ) : (
                      <span className="text-slate-500 text-sm">Sin tags</span>
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
                      <DialogContent className="glass border-white/10 bg-slate-900/95 backdrop-blur-xl max-w-md w-full">
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
                                className="glass border-white/10 bg-white/5 text-white placeholder:text-slate-500 h-9 text-sm"
                              />
                              <Button type="submit" size="sm" className="h-9 bg-indigo-500 hover:bg-indigo-600">
                                <Plus className="h-4 w-4" />
                              </Button>
                            </form>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </TableCell>
                {!isAdvisor && (
                  <TableCell className="hidden xl:table-cell">
                    {contact.assignedUser ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="bg-indigo-500/20 text-indigo-400 text-xs">
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
                  </TableCell>
                )}
                <TableCell className="text-slate-400 text-sm hidden sm:table-cell">
                  {formatDistanceToNow(new Date(contact.createdAt), {
                    addSuffix: true,
                    locale: es,
                  })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
