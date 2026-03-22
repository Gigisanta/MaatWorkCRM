"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProductSubCard } from "./product-sub-card";
import type { ContactWithProducts, Product } from "@/hooks/use-pipeline";

interface ContactCardProps {
  contact: ContactWithProducts;
  isDragging?: boolean;
  isHighlighted?: boolean;
  onEdit: (contact: ContactWithProducts) => void;
}

export function ContactCard({
  contact,
  isDragging,
  isHighlighted,
  onEdit,
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
  const totalValue = products.reduce((sum, p) => sum + (p.value || 0), 0);

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{
        opacity: isDragging ? 0.5 : 1,
        scale: isDragging ? 1.02 : isHighlighted ? 1.02 : 1,
        borderColor: isHighlighted ? "rgba(99, 102, 241, 0.8)" : undefined,
      }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: "spring", duration: 0.5 }}
      className={cn(
        "p-3 rounded-lg glass border cursor-grab active:cursor-grabbing group relative",
        "hover:border-white/20 transition-all duration-200",
        isDragging && "shadow-xl shadow-black/20",
        isHighlighted
          ? "border-indigo-500 shadow-lg shadow-indigo-500/20 animate-pulse"
          : hasProducts
          ? "border-white/10"
          : "border-amber-500/30"
      )}
      {...attributes}
      {...listeners}
    >
      {/* Header: emoji + name */}
      <div className="flex items-start gap-2">
        <span className="text-2xl flex-shrink-0">{contact.emoji || "👤"}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">
            {contact.name}
          </p>
          {/* Total value if products exist */}
          {hasProducts && totalValue > 0 && (
            <p className="text-lg font-bold text-white">
              ${totalValue.toLocaleString()}
            </p>
          )}
        </div>
        <GripVertical className="h-4 w-4 text-slate-600 flex-shrink-0" />
      </div>

      {/* Products list */}
      {hasProducts ? (
        <div className="mt-2 space-y-1">
          {products.map((product) => (
            <ProductSubCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        /* Warning state: no products */
        <div className="mt-3 flex items-center gap-2 py-2 px-2 rounded bg-amber-500/10 border border-amber-500/20">
          <AlertTriangle className="h-3 w-3 text-amber-500 flex-shrink-0" />
          <span className="text-xs text-amber-400">Sin productos</span>
        </div>
      )}

      {/* Footer: assigned user */}
      {contact.assignedUser && (
        <div className="mt-3 flex items-center gap-1.5">
          <div className="h-5 w-5 rounded-full bg-indigo-500/20 flex items-center justify-center">
            <span className="text-[10px] text-indigo-400 font-medium">
              {contact.assignedUser.name
                ?.split(" ")
                .map((n) => n[0])
                .join("") || contact.assignedUser.email?.[0]?.toUpperCase() || "?"}
            </span>
          </div>
          <span className="text-xs text-slate-400 truncate">
            {contact.assignedUser.name || contact.assignedUser.email}
          </span>
        </div>
      )}

      {/* Edit button - shows on hover */}
      <button
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded bg-white/10 hover:bg-white/20"
        onClick={(e) => {
          e.stopPropagation();
          onEdit(contact);
        }}
      >
        <Pencil className="h-3 w-3 text-slate-400" />
      </button>
    </motion.div>
  );
}
