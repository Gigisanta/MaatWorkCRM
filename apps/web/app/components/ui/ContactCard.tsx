import { Mail, Phone } from "lucide-react";
import type React from "react";
import { cn } from "~/lib/utils";

export interface Contact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  pipelineStageId: string | null;
  tags: string[];
  segment: string | null;
  source: string | null;
  assignedTo: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PipelineStage {
  id: string;
  name: string;
  color: string;
}

interface ContactCardProps {
  contact: Contact;
  stage?: PipelineStage;
  onDragStart?: (e: React.DragEvent, contact: Contact) => void;
  className?: string;
}

const pastelColors = [
  "#fce7f3",
  "#fce7f3",
  "#fdf4ff",
  "#faf5ff",
  "#ede9fe",
  "#e0e7ff",
  "#dbeafe",
  "#dcfce7",
  "#fef9c3",
  "#ffedd5",
  "#fee2e2",
  "#f1f5f9",
];

const pastelTextColors = [
  "#be185d",
  "#be185d",
  "#a21caf",
  "#7c3aed",
  "#6d28d9",
  "#4338ca",
  "#1d4ed8",
  "#15803d",
  "#a16207",
  "#c2410c",
  "#b91c1c",
  "#475569",
];

function getTagStyle(index: number): { bg: string; text: string } {
  const colorIndex = index % pastelColors.length;
  return {
    bg: pastelColors[colorIndex],
    text: pastelTextColors[colorIndex],
  };
}

export function ContactCard({ contact, stage, onDragStart, className }: ContactCardProps) {
  const handleDragStart = (e: React.DragEvent) => {
    if (onDragStart) {
      onDragStart(e, contact);
    } else {
      e.dataTransfer.setData("contactId", contact.id);
      e.dataTransfer.effectAllowed = "move";
    }
  };

  const stageColor = stage?.color || "#a5b4fc";

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className={cn(
        "group relative rounded-lg border border-border bg-surface p-3",
        "cursor-grab active:cursor-grabbing",
        "transition-all duration-150",
        "hover:border-border-hover hover:shadow-md hover:scale-[1.005]",
        "hover:ring-1 hover:ring-primary/20",
        className,
      )}
    >
      <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full" style={{ backgroundColor: stageColor }} />

      <div className="pl-3">
        <h4 className="font-display text-sm font-semibold text-text truncate">{contact.name}</h4>

        <div className="mt-2 space-y-1">
          {contact.email && (
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <Mail className="h-3 w-3 shrink-0" />
              <span className="truncate">{contact.email}</span>
            </div>
          )}
          {contact.phone && (
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <Phone className="h-3 w-3 shrink-0" />
              <span className="truncate">{contact.phone}</span>
            </div>
          )}
        </div>

        {contact.tags && contact.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {contact.tags.slice(0, 3).map((tag, index) => {
              const { bg, text } = getTagStyle(index);
              return (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium"
                  style={{ backgroundColor: bg, color: text }}
                >
                  {tag}
                </span>
              );
            })}
            {contact.tags.length > 3 && (
              <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                +{contact.tags.length - 3}
              </span>
            )}
          </div>
        )}

        <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          {contact.email && (
            <button
              type="button"
              className="rounded p-1 text-text-muted hover:bg-slate-100 hover:text-text"
              onClick={(e) => {
                e.stopPropagation();
                window.location.href = `mailto:${contact.email}`;
              }}
              title="Send email"
            >
              <Mail className="h-3.5 w-3.5" />
            </button>
          )}
          {contact.phone && (
            <button
              type="button"
              className="rounded p-1 text-text-muted hover:bg-slate-100 hover:text-text"
              onClick={(e) => {
                e.stopPropagation();
                window.location.href = `tel:${contact.phone}`;
              }}
              title="Call"
            >
              <Phone className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
