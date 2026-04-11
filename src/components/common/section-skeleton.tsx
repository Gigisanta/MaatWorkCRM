'use client';

import { cn } from '@/lib/utils/utils';

interface SectionSkeletonProps {
  className?: string;
  lines?: number;
}

export function SectionSkeleton({
  className = "",
  lines = 3
}: SectionSkeletonProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-12 bg-[#0E0F12] rounded-lg animate-pulse"
        />
      ))}
    </div>
  );
}
