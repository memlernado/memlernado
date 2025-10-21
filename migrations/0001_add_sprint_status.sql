-- Add status column to sprints table
ALTER TABLE "sprints" ADD COLUMN "status" text DEFAULT 'draft' NOT NULL;

-- Migrate existing sprints: isActive=true -> 'active', else 'completed'
UPDATE "sprints" SET "status" = 'active' WHERE "is_active" = true;
UPDATE "sprints" SET "status" = 'completed' WHERE "is_active" = false;
