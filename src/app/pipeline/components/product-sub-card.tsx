"use client";

import * as React from "react";
import { cn } from "@/lib/utils/utils";
import type { Product } from "@/hooks/use-pipeline";

interface ProductSubCardProps {
  product: Product;
}

export function ProductSubCard({ product }: ProductSubCardProps) {
  return (
    <div className="flex items-center gap-2 py-1.5 px-2 rounded-lg bg-white/4 border border-white/6 text-xs group/product hover:border-white/10 transition-colors">
      {/* Color dot with glow */}
      <div
        className="w-2 h-2 rounded-full flex-shrink-0 shadow-sm"
        style={{
          backgroundColor: product.color,
          boxShadow: `0 0 4px ${product.color}60`
        }}
      />

      {/* Name */}
      <span className="text-slate-300 truncate flex-1 min-w-0 font-medium">
        {product.name}
      </span>

      {/* Expected close date */}
      {product.expectedCloseDate && (
        <span className="text-slate-500 text-[10px] flex-shrink-0 hidden group-hover/product:block">
          {new Date(product.expectedCloseDate).toLocaleDateString("es-ES", {
            month: "short",
            day: "numeric",
          })}
        </span>
      )}
    </div>
  );
}
