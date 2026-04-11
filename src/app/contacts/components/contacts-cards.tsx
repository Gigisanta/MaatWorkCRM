"use client";

import * as React from "react";
import { format, parseISO, isPast } from "date-fns";
import { es } from "date-fns/locale";
import { Building2, Mail, Phone, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/utils";
import { getInteractionGradient } from "@/lib/interaction-gradient";
import type { ContactListItem } from "@/types/contact";

interface ContactsCardsProps {
  contacts: ContactListItem[];
  isLoading: boolean;
  search: string;
  onContactClick?: (contact: ContactListItem) => void;
  onCreateClick?: () => void;
}

export function ContactsCards({ contacts, isLoading, search, onContactClick, onCreateClick }: ContactsCardsProps) {
  if (isLoading) {
    return <ContactsCardsSkeleton />;
  }

  if (contacts.length === 0) {
    return (
      <Card className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl">
        <CardContent className="p-12 text-center">
          <Users className="h-12 w-12 text-slate-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">
            {search ? "Sin resultados" : "No hay contactos"}
          </h3>
          <p className="text-slate-400 mb-4">
            {search ? `No se encontraron contactos para "${search}"` : "Comienza agregando tu primer contacto"}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {contacts.map((contact) => (
        <ContactCard
          key={contact.id}
          contact={contact}
          onContactClick={onContactClick}
        />
      ))}
    </div>
  );
}

interface ContactCardProps {
  contact: ContactListItem;
  onContactClick?: (contact: ContactListItem) => void;
}

function ContactCard({ contact, onContactClick }: ContactCardProps) {
  const lastInteractionDate = contact.lastInteractionDate
    ? new Date(contact.lastInteractionDate)
    : null;

  const gradient = getInteractionGradient(lastInteractionDate);

  const initials = contact.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const formattedCreated = contact.createdAt
    ? format(parseISO(String(contact.createdAt)), "dd MMM yyyy", { locale: es })
    : "Sin fecha";

  return (
    <Card
      className="bg-[#0E0F12]/80 backdrop-blur-sm border border-white/8 rounded-xl hover:border-white/20 transition-all cursor-pointer"
      onClick={() => onContactClick?.(contact)}
    >
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <Avatar className="h-10 w-10 flex-shrink-0">
              <AvatarFallback className="bg-violet-500/20 text-violet-400 text-sm">
                {initials || contact.emoji || "NA"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-white truncate flex items-center gap-2">
                {contact.name}
              </h3>
              {contact.company && (
                <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {contact.company}
                </p>
              )}
            </div>
          </div>
          {contact.pipelineStage && (
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] px-1.5 py-0.5",
                contact.pipelineStage.color
                  ? `bg-${contact.pipelineStage.color}/10 border-${contact.pipelineStage.color}/20`
                  : "bg-slate-500/10 border-slate-500/20",
                "text-slate-300"
              )}
              style={{
                backgroundColor: contact.pipelineStage.color ? `${contact.pipelineStage.color}15` : undefined,
                borderColor: contact.pipelineStage.color ? `${contact.pipelineStage.color}30` : undefined,
              }}
            >
              {contact.pipelineStage.name}
            </Badge>
          )}
        </div>

        <div className="space-y-1.5">
          {contact.email && (
            <p className="text-xs text-slate-400 flex items-center gap-2">
              <Mail className="h-3 w-3 text-slate-500" />
              {contact.email}
            </p>
          )}
          {contact.phone && (
            <p className="text-xs text-slate-400 flex items-center gap-2">
              <Phone className="h-3 w-3 text-slate-500" />
              {contact.phone}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/8">
          {contact.segment && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0.5 border-white/10 text-slate-400"
            >
              {contact.segment}
            </Badge>
          )}
          {contact.source && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0.5 border-white/10 text-slate-400"
            >
              {contact.source}
            </Badge>
          )}
          {contact.assignedUser && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0.5 border-violet-500/20 text-violet-400"
            >
              {contact.assignedUser.name}
            </Badge>
          )}
        </div>

        <div className="flex flex-wrap gap-1">
          {contact.tags.slice(0, 3).map((tag) => (
            <Badge
              key={tag.id}
              variant="outline"
              className="text-[10px] px-1.5 py-0.5"
              style={{
                borderColor: tag.color ? `${tag.color}40` : undefined,
                color: tag.color || undefined,
              }}
            >
              {tag.name}
            </Badge>
          ))}
          {contact.tags.length > 3 && (
            <span className="text-[10px] text-slate-500">+{contact.tags.length - 3}</span>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-white/8">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">
            Creado
          </span>
          <span className="text-xs text-slate-400">
            {formattedCreated}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function ContactsCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="rounded-xl border border-white/8 bg-[#0E0F12]/80 p-5 space-y-4"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-white/5" />
              <div className="space-y-2">
                <div className="h-5 w-32 bg-white/5 rounded" />
                <div className="h-3 w-24 bg-white/5 rounded" />
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="h-3 w-full bg-white/5 rounded" />
            <div className="h-3 w-3/4 bg-white/5 rounded" />
          </div>
          <div className="flex gap-2">
            <div className="h-5 w-16 bg-white/5 rounded" />
            <div className="h-5 w-16 bg-white/5 rounded" />
          </div>
          <div className="flex justify-between pt-2 border-t border-white/8">
            <div className="h-3 w-20 bg-white/5 rounded" />
            <div className="h-3 w-24 bg-white/5 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
