CREATE TABLE "daily_metrics_user" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"team_id" text,
	"date" timestamp NOT NULL,
	"num_new_prospects" integer DEFAULT 0,
	"num_contacts_touched" integer DEFAULT 0,
	"num_notes" integer DEFAULT 0,
	"num_tasks_completed" integer DEFAULT 0,
	"aum_total" real DEFAULT 0,
	"liquid_balance_total" real DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "daily_metrics_user" ADD CONSTRAINT "daily_metrics_user_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_metrics_user" ADD CONSTRAINT "daily_metrics_user_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_metrics_user" ADD CONSTRAINT "daily_metrics_user_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;