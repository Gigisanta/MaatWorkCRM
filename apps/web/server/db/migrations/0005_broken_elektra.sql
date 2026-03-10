CREATE TABLE "automation_configs" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"display_name" text NOT NULL,
	"trigger_type" text NOT NULL,
	"trigger_config" jsonb,
	"enabled" boolean DEFAULT true NOT NULL,
	"config" jsonb,
	"webhook_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "automation_configs" ADD CONSTRAINT "automation_configs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;