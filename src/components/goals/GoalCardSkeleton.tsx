"use client";

import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { cn } from "@/lib/utils/utils";

interface GoalCardSkeletonProps {
  className?: string;
}

export function GoalCardSkeleton({ className }: GoalCardSkeletonProps) {
  return (
    <Card className={cn("bg-[#0E0F12]/80 backdrop-blur-xl border border-[#1C1D21]", className)}>
      <CardHeader className="px-5 pt-5 pb-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            <div className="h-5 w-3/4 bg-white/6 rounded-md animate-pulse" />
            <div className="h-4 w-1/4 bg-white/4 rounded-md animate-pulse" />
          </div>
          <div className="h-6 w-6 bg-white/6 rounded-md animate-pulse shrink-0" />
        </div>
      </CardHeader>
      <CardContent className="px-5 py-4">
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 bg-white/6 rounded-full animate-pulse shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-full bg-white/6 rounded-md animate-pulse" />
            <div className="h-4 w-2/3 bg-white/4 rounded-md animate-pulse" />
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <div className="h-2 w-full bg-white/6 rounded-full animate-pulse" />
          <div className="h-2 w-5/6 bg-white/4 rounded-full animate-pulse" />
        </div>
      </CardContent>
      <CardFooter className="px-5 py-4 border-t border-[#1C1D21]">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-4">
            <div className="h-3 w-16 bg-white/6 rounded-md animate-pulse" />
            <div className="h-3 w-16 bg-white/6 rounded-md animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 bg-white/6 rounded-md animate-pulse" />
            <div className="h-5 w-5 bg-white/6 rounded-md animate-pulse" />
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
