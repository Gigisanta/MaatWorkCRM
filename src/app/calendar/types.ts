// Shared types for Calendar components
// Note: Props interfaces are defined in each component file

export type EventTypeLiteral = "meeting" | "call" | "event" | "reminder";

export interface CalendarEventUser {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
}

export interface CalendarEventTeam {
  id: string;
  name: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string;
  type: string; // "meeting" | "call" | "event" | "reminder"
  location: string | null;
  teamId: string | null;
  team: CalendarEventTeam | null;
  createdBy: string | null;
  creator: CalendarEventUser | null;
  createdAt: string;
  colorId?: string | null;
  status?: string | null;
  attendees?: string | null;
}

export type ViewMode = "month" | "week" | "agenda";
