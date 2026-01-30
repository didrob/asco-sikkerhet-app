-- Add new roles to app_role enum for governance portal
-- Each ALTER TYPE must be in its own transaction/migration
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'external_client';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'auditor';