"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { Product } from "@/hooks/use-pipeline";

interface ProductSubCardProps {
  product: Product;
}

export function ProductSubCard({ product }: ProductSubCardProps) {
  return (
    <div className="flex items-center gap-2 py-1 px-2 rounded bg-white/5 text-xs">
      {/* Colored dot */}
      <div
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: product.color }}
      />

      {/* Name */}
      <span className="text-slate-200 truncate flex-1 min-w-0">
        {product.name}
      </span>

      {/* Value */}
      {product.value > 0 && (
        <span className="text-slate-300 font-medium flex-shrink-0">
          ${product.value.toLocaleString()}
        </span>
      )}

      {/* Expected close date */}
      {product.expectedCloseDate && (
        <span className="text-slate-500 text-[10px] flex-shrink-0">
          {new Date(product.expectedCloseDate).toLocaleDateString("es-ES", {
            month: "short",
            day: "numeric",
          })}
        </span>
      )}
    </div>
  );
}
