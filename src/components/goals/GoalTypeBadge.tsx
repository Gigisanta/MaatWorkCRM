"use client";

import { Badge } from "@/components/ui/badge";

type GoalType = "revenue" | "new_aum" | "new_clients" | "meetings" | "custom";

interface GoalTypeBadgeProps {
  type: GoalType;
  size?: "sm" | "default" | "lg";
  className?: string;
}

const TYPE_CONFIG: Record<GoalType, { label: string; variant: "success" | "default" | "info" | "warning" | "muted" }> = {
  revenue: { label: "Revenue", variant: "success" },
  new_aum: { label: "New AUM", variant: "default" },
  new_clients: { label: "New Clients", variant: "info" },
  meetings: { label: "Meetings", variant: "warning" },
  custom: { label: "Custom", variant: "muted" },
};

export function GoalTypeBadge({ type, size = "default", className }: GoalTypeBadgeProps) {
  const config = TYPE_CONFIG[type] ?? TYPE_CONFIG.custom;

  return (
    <Badge variant={config.variant} size={size} className={className}>
      {config.label}
    </Badge>
  );
}
