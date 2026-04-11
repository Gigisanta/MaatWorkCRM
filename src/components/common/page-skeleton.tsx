'use client';

import { Loader2 } from 'lucide-react';

interface PageSkeletonProps {
  label?: string;
  className?: string;
}

export function PageSkeleton({
  label = "Cargando...",
  className = ""
}: PageSkeletonProps) {
  return (
    <div className={`min-h-screen bg-[#08090B] flex items-center justify-center ${className}`}>
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
        <p className="text-slate-500 text-sm">{label}</p>
      </div>
    </div>
  );
}
