'use client';

import * as React from "react";
import { useRouter } from "next/navigation";
import { useVirtualizer } from "@tanstack/react-virtual";
import { User, ChevronRight, Edit, XCircle, Plus, FileText } from "lucide-react";
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

interface ContactRowProps {
  contact: Contact;
  stages: PipelineStage[];
  isAdvisor: boolean;
  selectedContacts: string[];
  editingContactTagsId: string | null;
  onContactClick: (contact: Contact) => void;
  onToggleSelect: (id: string) => void;
  onUpdateStage: (contactId: string, stageId: string) => void;
  onRemoveTag: (contactId: string, tagId: string) => void;
  onAddTag: (contactId: string, tagId: string | null, tagName?: string) => void;
  onEditingContactTagsIdChange: (id: string | null) => void;
  allTags: Tag[];
}

const ContactRow = React.memo(function ContactRow({
  contact,
  stages,
  isAdvisor,
  selectedContacts,
  editingContactTagsId,
  onContactClick,
  onToggleSelect,
  onUpdateStage,
  onRemoveTag,
  onAddTag,
  onEditingContactTagsIdChange,
  allTags,
}: ContactRowProps) {
  const router = useRouter();

  const handleNextStage = React.useCallback(() => {
    const currentOrder = stages.find(s => s.id === contact.pipelineStageId)?.order || 0;
    const nextStage = stages.find(s => s.order === currentOrder + 1);
    if (nextStage) {
      onUpdateStage(contact.id, nextStage.id);
    }
  }, [stages, contact.pipelineStageId, contact.id, onUpdateStage]);

  const handleTagDialogOpenChange = React.useCallback((open: boolean) => {
    if (!open) onEditingContactTagsIdChange(null);
  }, [onEditingContactTagsIdChange]);

  return (
    <TableRow
      className="border-white/5 hover:bg-white/3 cursor-pointer transition-colors duration-150 group"
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
          <div className="relative">
            <span className="text-xl leading-none">{contact.emoji}</span>
          </div>
          <div className="flex-1 min-w-0">
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
        </div>
      </TableCell>
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
            onClick={handleNextStage}
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
          <Dialog open={editingContactTagsId === contact.id} onOpenChange={handleTagDialogOpenChange}>
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
      </TableCell>
      {!isAdvisor && (
        <TableCell className="hidden xl:table-cell">
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
        </TableCell>
      )}
      <TableCell className="text-xs text-slate-500 hidden sm:table-cell">
        {formatDistanceToNow(new Date(contact.updatedAt), { addSuffix: true })}
      </TableCell>
    </TableRow>
  );
});

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
  const parentRef = React.useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: contacts.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72,
    overscan: 10,
  });

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
      <Card className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl overflow-hidden">
        <CardContent className="p-0">
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-violet-500/10 flex items-center justify-center mb-4">
              <User className="h-8 w-8 text-violet-400/60" strokeWidth={1.5} />
            </div>
            <p className="text-white font-semibold text-lg">Sin contactos</p>
            <p className="text-slate-500 text-sm mt-1 text-center max-w-sm">
              Crea tu primer contacto para comenzar a gestionar tu pipeline
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl overflow-hidden">
      <CardContent className="p-0">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-[#0E0F12]">
            <TableRow className="border-white/6 hover:bg-transparent">
              <TableHead className="w-12">
                <Checkbox
                  checked={
                    selectedContacts.length === contacts.length && contacts.length > 0
                  }
                  onCheckedChange={onToggleSelectAll}
                />
              </TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Contacto</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Etapa</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Productos</TableHead>
              {!isAdvisor && (
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider hidden xl:table-cell">
                  Asignado
                </TableHead>
              )}
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">
                Última edición
              </TableHead>
            </TableRow>
          </TableHeader>
        </Table>
        <div
          ref={parentRef}
          className="overflow-auto"
          style={{ maxHeight: "calc(100vh - 320px)" }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                position: "relative",
                display: "block",
              }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const contact = contacts[virtualRow.index];
                return (
                  <tr
                    key={contact.id}
                    data-index={virtualRow.index}
                    ref={rowVirtualizer.measureElement}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      transform: `translateY(${virtualRow.start}px)`,
                      display: "table-row",
                    }}
                    className="border-white/5 hover:bg-white/3 cursor-pointer transition-colors duration-150 group"
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
                        <div className="relative">
                          <span className="text-xl leading-none">{contact.emoji}</span>
                        </div>
                        <div className="flex-1 min-w-0">
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
                      </div>
                    </TableCell>
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
                                className="text-xs cursor-pointer group-hover:opacity-80"
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
                    </TableCell>
                    {!isAdvisor && (
                      <TableCell className="hidden xl:table-cell">
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
                      </TableCell>
                    )}
                    <TableCell className="text-xs text-slate-500 hidden sm:table-cell">
                      {formatDistanceToNow(new Date(contact.updatedAt), { addSuffix: true })}
                    </TableCell>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
