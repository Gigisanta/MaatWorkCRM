-- Migration: Add pipeline_stage_id to contacts table
-- This column is required for the Pipeline Kanban feature
-- The contacts table was created in 0000 without this column

ALTER TABLE "contacts" ADD COLUMN "pipeline_stage_id" text REFERENCES "public"."pipeline_stages"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- Also add missing columns from schema that might not exist
ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true NOT NULL;
