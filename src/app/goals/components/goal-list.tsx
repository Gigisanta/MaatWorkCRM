'use client';

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target } from "lucide-react";
import { GoalCard, GoalCardSkeleton, type Goal } from "./goal-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

interface GoalListProps {
  goals: Goal[];
  isLoading: boolean;
  onEdit: (goal: Goal) => void;
  onDelete: (goal: Goal) => void;
  onArchive: (goal: Goal) => void;
  onUpdateProgress: (goal: Goal) => void;
  onCreateClick: () => void;
  emptyMessage?: string;
}

export function GoalList({
  goals,
  isLoading,
  onEdit,
  onDelete,
  onArchive,
  onUpdateProgress,
  onCreateClick,
  emptyMessage = "No hay objetivos que mostrar",
}: GoalListProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <GoalCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (goals.length === 0) {
    return (
      <EmptyState
        icon={Target}
        title="No hay objetivos"
        description={emptyMessage}
        action={{ label: "Crear Objetivo", onClick: onCreateClick }}
        className="py-16"
      />
    );
  }

  return (
    <motion.div
      layout
      className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
    >
      <AnimatePresence mode="popLayout">
        {goals.map((goal) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            onEdit={onEdit}
            onDelete={onDelete}
            onArchive={onArchive}
            onUpdateProgress={onUpdateProgress}
          />
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
