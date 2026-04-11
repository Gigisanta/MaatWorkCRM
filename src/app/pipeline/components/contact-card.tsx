"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, AlertTriangle, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils/utils";
import { ProductSubCard } from "./product-sub-card";
import type { ContactWithProducts, Product, StageWithContacts } from "@/hooks/use-pipeline";

interface ContactCardProps {
  contact: ContactWithProducts;
  isDragging?: boolean;
  isHighlighted?: boolean;
  onEdit: (contact: ContactWithProducts) => void;
  stages?: StageWithContacts[];
  onUpdateStage?: (contactId: string, stageId: string) => void;
}

export function ContactCard({
  contact,
  isDragging,
  isHighlighted,
  onEdit,
  stages,
  onUpdateStage,
}: ContactCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: contact.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Tags are the products
  const products: Product[] = contact.tags || [];
  const hasProducts = products.length > 0;
  const totalValue = products.reduce((sum, p) => sum + (p.value ?? 0), 0);

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{
        opacity: isDragging ? 0.4 : 1,
        scale: isDragging ? 1.03 : 1,
      }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={cn(
        "p-3 rounded-xl border cursor-grab active:cursor-grabbing group relative overflow-hidden",
        "bg-[#0E0F12]/90 backdrop-blur-sm",
        "transition-all duration-200",
        isDragging && "shadow-2xl shadow-black/40",
        isHighlighted
          ? "border-violet-500/60 shadow-md shadow-violet-500/15"
          : hasProducts
          ? "border-white/8 hover:border-white/15 hover:shadow-md hover:shadow-black/20"
          : "border-amber-500/25 hover:border-amber-500/40"
      )}
      {...attributes}
      {...listeners}
    >
      {/* Subtle top gradient for visual depth */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />

      {/* Header: emoji + name */}
      <div className="flex items-start gap-2.5">
        <span className="text-xl flex-shrink-0 leading-none mt-0.5">{contact.emoji || "👤"}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate leading-snug">
            {contact.name}
          </p>
          {contact.company && (
            <p className="text-xs text-slate-500 truncate -mt-0.5">{contact.company}</p>
          )}
        </div>
        <GripVertical className="h-3.5 w-3.5 text-slate-700 flex-shrink-0 mt-0.5 group-hover:text-slate-500 transition-colors" />
      </div>

      {/* Products list */}
      {hasProducts ? (
        <div className="mt-2.5 space-y-1">
          {products.map((product) => (
            <ProductSubCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="mt-2.5 flex items-center gap-1.5 py-1.5 px-2 rounded-lg bg-amber-500/8 border border-amber-500/15">
          <AlertTriangle className="h-3 w-3 text-amber-500/80 flex-shrink-0" />
          <span className="text-[10px] text-amber-400/80 font-medium">Sin productos asignados</span>
        </div>
      )}

      {/* Footer: assigned user + last updated */}
      <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-white/5">
        {contact.assignedUser ? (
          <div className="flex items-center gap-1.5">
            <div className="h-4 w-4 rounded-full bg-violet-500/15 flex items-center justify-center flex-shrink-0">
              <span className="text-[9px] text-violet-300 font-semibold leading-none">
                {contact.assignedUser.name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("") || contact.assignedUser.email?.[0]?.toUpperCase() || "?"}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 truncate">
              {contact.assignedUser.name || contact.assignedUser.email}
            </span>
          </div>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-2 flex-shrink-0">
          {totalValue > 0 && (
            <span className="text-xs font-semibold text-emerald-400 tabular-nums">
              ${totalValue.toLocaleString("es-MX")}
            </span>
          )}
          {contact.updatedAt && (
            <span className="text-[10px] text-slate-600 tabular-nums">
              {formatDistanceToNow(new Date(contact.updatedAt), { addSuffix: true, locale: es })}
            </span>
          )}
        </div>
      </div>

      {/* Edit button */}
      <button
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-150 p-1 rounded-md bg-white/8 hover:bg-white/15 border border-white/8 cursor-pointer"
        aria-label="Editar contacto"
        onClick={(e) => {
          e.stopPropagation();
          onEdit(contact);
        }}
      >
        <Pencil className="h-3 w-3 text-slate-300" />
      </button>

      {/* Stage advance button */}
      {stages && onUpdateStage && (() => {
        const currentStage = stages.find(s => s.id === contact.pipelineStageId);
        const currentOrder = currentStage?.order ?? 0;
        const nextStage = stages.find(s => s.order === currentOrder + 1 && s.isActive !== false);
        if (!nextStage) return null;
        return (
          <button
            className="absolute top-2 right-10 opacity-0 group-hover:opacity-100 transition-all duration-150 p-1 rounded-md bg-violet-500/20 hover:bg-violet-500/30 border border-violet-500/30 cursor-pointer"
            aria-label={`Avanzar a ${nextStage.name}`}
            onClick={(e) => {
              e.stopPropagation();
              onUpdateStage(contact.id, nextStage.id);
            }}
          >
            <ChevronRight className="h-3 w-3 text-violet-400" />
          </button>
        );
      })()}
    </motion.div>
  );
}
