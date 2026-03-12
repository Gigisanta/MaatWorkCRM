// ============================================================
// UI/UX REFINED BY JULES v2
// MaatWork CRM — KanbanBoard Component
// Reusable Trello-like board for contacts organized by pipeline stages
// UI/UX: Pastel Aesthetic + High Density
// ============================================================

import { AnimatePresence, motion } from "framer-motion";
import { GripVertical, Mail, Phone, Plus, User } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { cn, formatCurrency } from "~/lib/utils";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { Card, CardContent } from "./Card";

// ── Types ──────────────────────────────────────────────────────

export interface PipelineStage {
  id: string;
  name: string;
  color: string;
  order: number;
  wipLimit?: number | null;
  slaHours?: number | null;
}

export interface Contact {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  pipelineStageId?: string | null;
  tags?: string[] | null | undefined;
  segment?: string | null;
  source?: string | null;
  assignedTo?: string | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface KanbanBoardProps {
  /** Pipeline stages sorted by order */
  stages: PipelineStage[];
  /** Contacts to display, will be grouped by pipelineStageId */
  contacts: Contact[];
  /** Callback when a contact is dropped onto a new stage */
  onContactMove?: (contactId: string, newStageId: string) => void;
  /** Callback when a contact card is clicked */
  onContactClick?: (contact: Contact) => void;
  /** Callback to add new contact in a stage */
  onAddContact?: (stageId: string) => void;
  /** Loading state */
  isLoading?: boolean;
  /** Optional custom render for contact card */
  renderContactCard?: (contact: Contact, stage: PipelineStage) => React.ReactNode;
}

// ── Components ─────────────────────────────────────────────────

function ContactCard({
  contact,
  stage,
  onDragStart,
  onDragEnd,
  isDragging,
  onClick,
}: {
  contact: Contact;
  stage: PipelineStage;
  onDragStart: (e: React.DragEvent, contactId: string) => void;
  onDragEnd: () => void;
  isDragging: boolean;
  onClick?: () => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      draggable
      onDragStart={(e: any) => onDragStart(e, contact.id)}
      onDragEnd={onDragEnd}
    >
      <Card
        variant="elevated"
        className={cn(
          "cursor-grab active:cursor-grabbing border-white/5 hover:border-[#8B5CF6]/30 group/card transition-all duration-150",
          isDragging
            ? "opacity-50 scale-95 shadow-none"
            : "hover:shadow-[0_8px_25px_rgba(139,92,246,0.15)] hover:-translate-y-1",
        )}
        onClick={onClick}
      >
        {/* Stage color accent bar */}
        <div
          className="absolute top-0 left-0 w-full h-[3px] opacity-50 transition-opacity group-hover/card:opacity-100 rounded-t-lg"
          style={{ backgroundColor: stage.color }}
        />

        <CardContent className="p-4 space-y-3">
          {/* Contact name */}
          <div className="flex items-start justify-between gap-2">
            <p className="font-black text-sm text-[#F5F5F5] line-clamp-2 leading-tight group-hover/card:text-[#8B5CF6] transition-colors duration-300 tracking-tight">
              {contact.name}
            </p>
            <Button
              variant="ghost"
              className="p-1 h-6 w-6 rounded-lg hover:bg-white/10 text-[#737373] hover:text-[#F5F5F5] transition-colors duration-300 cursor-grab active:cursor-grabbing -mt-1 -mr-1"
              aria-label="Drag to reorder"
              title="Drag to reorder"
            >
              <GripVertical className="w-3 h-3" />
            </Button>
          </div>

          {/* Contact info */}
          <div className="space-y-2">
            {contact.email && (
              <div className="flex items-center gap-2 min-w-0">
                <Mail className="w-3 h-3 text-[#8B5CF6] shrink-0" />
                <span className="text-[11px] text-[#A3A3A3] font-medium truncate">{contact.email}</span>
              </div>
            )}
            {contact.phone && (
              <div className="flex items-center gap-2 min-w-0">
                <Phone className="w-3 h-3 text-[#8B5CF6] shrink-0" />
                <span className="text-[11px] text-[#A3A3A3] font-medium truncate">{contact.phone}</span>
              </div>
            )}
          </div>

          {/* Tags */}
          {contact.tags && contact.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {contact.tags.slice(0, 3).map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="px-2 py-0.5 text-[9px] font-bold rounded-md bg-[#8B5CF6]/10 text-[#8B5CF6] border border-[#8B5CF6]/20"
                >
                  {tag}
                </Badge>
              ))}
              {contact.tags.length > 3 && (
                <Badge
                  variant="secondary"
                  className="px-2 py-0.5 text-[9px] font-bold rounded-md bg-[#18181B] text-[#737373] border border-white/5"
                >
                  +{contact.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Segment badge */}
          {contact.segment && (
            <div className="pt-2 border-t border-white/5">
              <Badge
                variant="outline"
                className="px-2 py-0.5 text-[9px] font-bold rounded-md bg-surface border-border/30 text-[#A3A3A3]"
              >
                {contact.segment}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function StageColumn({
  stage,
  contacts,
  onDragOver,
  onDragLeave,
  onDrop,
  onContactMove,
  onContactClick,
  onAddContact,
  renderContactCard,
  isDragOver,
  draggingContactId,
}: {
  stage: PipelineStage;
  contacts: Contact[];
  onDragOver: (e: React.DragEvent, stageId: string) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, stageId: string) => void;
  onContactMove?: (contactId: string, newStageId: string) => void;
  onContactClick?: (contact: Contact) => void;
  onAddContact?: (stageId: string) => void;
  renderContactCard?: (contact: Contact, stage: PipelineStage) => React.ReactNode;
  isDragOver: boolean;
  draggingContactId: string | null;
}) {
  const handleDragStart = (e: React.DragEvent, contactId: string) => {
    e.dataTransfer.setData("text/plain", contactId);
  };

  const handleDragEnd = () => {
    // Reset any dragging state if needed
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        "flex-shrink-0 w-72 flex flex-col gap-3 rounded-lg bg-surface-100 border border-border/30 p-3 snap-center transition-all duration-150",
        isDragOver && "bg-surface-100 ring-2 ring-primary/50",
      )}
      onDragOver={(e) => onDragOver(e, stage.id)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, stage.id)}
    >
      {/* Stage header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
          <h3 className="font-black text-xs text-text uppercase tracking-wider">{stage.name}</h3>
          <span
            className={cn(
              "text-[10px] font-bold px-1.5 py-0.5 rounded-md border",
              stage.wipLimit && contacts.length > stage.wipLimit
                ? "bg-error/10 text-error border-error/20"
                : "text-text-muted bg-surface-100 border-border/30",
            )}
          >
            {contacts.length}
            {stage.wipLimit && `/${stage.wipLimit}`}
          </span>
        </div>
        {stage.wipLimit && contacts.length > stage.wipLimit && (
          <span className="text-[10px] font-bold text-[#EF4444]">WIP</span>
        )}
      </div>

      {/* SLA indicator */}
      {stage.slaHours && (
        <div className="text-[9px] font-bold text-[#F59E0B] flex items-center gap-1 mb-1">
          <span className="uppercase tracking-wider">SLA:</span> {stage.slaHours}h
        </div>
      )}

      {/* Contacts list */}
      <div className="flex-1 overflow-y-auto space-y-2 min-h-[100px] pr-1 pb-2">
        <AnimatePresence>
          {contacts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-20 rounded-xl border-2 border-dashed border-white/5 flex items-center justify-center text-[#737373] text-[10px] font-bold uppercase tracking-wider"
            >
              Arrastra un contacto
            </motion.div>
          ) : (
            contacts.map((contact) =>
              renderContactCard ? (
                <div key={contact.id}>{renderContactCard(contact, stage)}</div>
              ) : (
                <ContactCard
                  key={contact.id}
                  contact={contact}
                  stage={stage}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  isDragging={draggingContactId === contact.id}
                  onClick={() => onContactClick?.(contact)}
                />
              ),
            )
          )}
        </AnimatePresence>
      </div>

      {/* Add contact button */}
      {onAddContact && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onAddContact(stage.id)}
          className="w-full h-8 text-[10px] font-bold uppercase tracking-wider text-[#737373] hover:text-[#8B5CF6] hover:bg-[#8B5CF6]/5 border border-dashed border-white/10 rounded-lg"
        >
          <Plus className="w-3 h-3 mr-1" />
          Añadir
        </Button>
      )}
    </motion.div>
  );
}

// ── Main Component ─────────────────────────────────────────────

export function KanbanBoard({
  stages,
  contacts,
  onContactMove,
  onContactClick,
  onAddContact,
  isLoading,
  renderContactCard,
}: KanbanBoardProps) {
  const [dragOverStageId, setDragOverStageId] = useState<string | null>(null);
  const [draggingContactId, setDraggingContactId] = useState<string | null>(null);

  // Group contacts by stage
  const contactsByStage = stages.reduce(
    (acc, stage) => {
      acc[stage.id] = contacts.filter((c) => c.pipelineStageId === stage.id);
      return acc;
    },
    {} as Record<string, Contact[]>,
  );

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    setDragOverStageId(stageId);
  };

  const handleDragLeave = () => {
    setDragOverStageId(null);
  };

  const handleDrop = async (e: React.DragEvent, targetStageId: string) => {
    e.preventDefault();
    const contactId = e.dataTransfer.getData("text/plain");
    setDragOverStageId(null);
    setDraggingContactId(null);

    if (!contactId || !targetStageId) return;

    // Find current stage for the contact to prevent redundant moves
    const currentStage = stages.find((s) => contacts.some((c) => c.id === contactId && c.pipelineStageId === s.id));
    if (currentStage?.id === targetStageId) return;

    // Trigger the move callback
    onContactMove?.(contactId, targetStageId);
  };

  const handleContactDragStart = (e: React.DragEvent, contactId: string) => {
    e.dataTransfer.setData("text/plain", contactId);
    setDraggingContactId(contactId);
  };

  const handleContactDragEnd = () => {
    setDraggingContactId(null);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4 pt-2 px-1">
        {stages.map((stage) => (
          <div key={stage.id} className="flex-shrink-0 w-72 rounded-lg bg-surface-100 border border-border/30 p-3">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: stage.color }} />
              <div className="h-3 w-20 bg-[#18181B] rounded animate-pulse" />
              <div className="h-4 w-6 bg-[#18181B] rounded animate-pulse" />
            </div>
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-[#18181B] rounded-lg animate-pulse" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (!stages || stages.length === 0) {
    return (
      <div className="flex items-center justify-center py-20 text-[#737373]">
        <div className="text-center space-y-2">
          <User className="w-12 h-12 mx-auto opacity-30" />
          <p className="text-sm font-bold uppercase tracking-wider">No hay etapas configuradas</p>
          <p className="text-xs text-[#525252]">Crea etapas en el pipeline para organizar contactos</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 pt-2 px-1 snap-x snap-mandatory">
      {stages.map((stage, idx) => (
        <motion.div
          key={stage.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.05 }}
        >
          {renderContactCard ? (
            <div
              className={cn(
                "flex-shrink-0 w-72 flex flex-col gap-3 rounded-lg bg-surface-100 border border-border/30 p-3 snap-center transition-all duration-150",
                dragOverStageId === stage.id && "bg-surface-100 ring-2 ring-primary/50",
              )}
              onDragOver={(e) => handleDragOver(e, stage.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage.id)}
            >
              {/* Stage header */}
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
                  <h3 className="font-black text-xs text-text uppercase tracking-wider">{stage.name}</h3>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md border text-text-muted bg-surface-100 border-border/30">
                    {contactsByStage[stage.id]?.length || 0}
                  </span>
                </div>
              </div>

              {/* Custom render area */}
              <div className="flex-1 overflow-y-auto space-y-2 min-h-[100px] pr-1 pb-2">
                <AnimatePresence>
                  {(contactsByStage[stage.id] || []).map((contact) => (
                    <motion.div
                      key={contact.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                    >
                      {renderContactCard(contact, stage)}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ) : (
            <StageColumn
              stage={stage}
              contacts={contactsByStage[stage.id] || []}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onContactMove={onContactMove}
              onContactClick={onContactClick}
              onAddContact={onAddContact}
              renderContactCard={renderContactCard}
              isDragOver={dragOverStageId === stage.id}
              draggingContactId={draggingContactId}
            />
          )}
        </motion.div>
      ))}
    </div>
  );
}

export default KanbanBoard;
