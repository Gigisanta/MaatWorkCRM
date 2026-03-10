ALTER TABLE "team_goals" ADD COLUMN "type" text DEFAULT 'custom' NOT NULL;--> statement-breakpoint
ALTER TABLE "team_goals" ADD COLUMN "month" integer;--> statement-breakpoint
ALTER TABLE "team_goals" ADD COLUMN "year" integer;--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "calendar_id" text;--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "meeting_room_calendar_id" text;