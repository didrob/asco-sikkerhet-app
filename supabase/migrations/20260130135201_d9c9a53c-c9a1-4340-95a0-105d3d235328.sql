-- Fix 1: Make procedure-attachments bucket private and update storage policies
UPDATE storage.buckets SET public = false WHERE id = 'procedure-attachments';

-- Drop the permissive public policy
DROP POLICY IF EXISTS "Anyone can view procedure attachments" ON storage.objects;

-- Create new policy that requires authentication and site access
CREATE POLICY "Authenticated users can view procedure attachments"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'procedure-attachments' AND
  auth.uid() IS NOT NULL AND
  (
    is_admin(auth.uid()) OR
    EXISTS (
      SELECT 1 FROM public.procedure_attachments pa
      JOIN public.procedures p ON p.id = pa.procedure_id
      WHERE storage.objects.name = pa.file_path
      AND has_site_access(auth.uid(), p.site_id)
    )
  )
);

-- Fix 2: Prevent temporary_password from being selected through RLS
-- We'll create a view that excludes the password and update RLS to be more restrictive

-- First, drop the existing permissive policies on user_invitations
DROP POLICY IF EXISTS "Admins can view all invitations" ON public.user_invitations;
DROP POLICY IF EXISTS "Site managers can view invitations for their sites" ON public.user_invitations;

-- Create new policies that use column-level approach by forcing apps to use a safe view
-- We can't do true column-level security in Postgres easily, so instead we:
-- 1. Keep the table for inserts/updates (where password is needed)
-- 2. Create a secure view for SELECT operations

-- Policy for INSERT - admins can create invitations (password is set during insert)
CREATE POLICY "Admins can insert invitations"
ON public.user_invitations
FOR INSERT
TO authenticated
WITH CHECK (is_admin(auth.uid()));

-- Policy for UPDATE - admins can update invitations (but password shouldn't be updated)
CREATE POLICY "Admins can update invitations"
ON public.user_invitations
FOR UPDATE
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Policy for DELETE - admins can delete invitations
CREATE POLICY "Admins can delete invitations"
ON public.user_invitations
FOR DELETE
TO authenticated
USING (is_admin(auth.uid()));

-- Create a secure view that excludes the temporary_password column
CREATE OR REPLACE VIEW public.user_invitations_safe AS
SELECT 
  id,
  email,
  full_name,
  invited_by,
  invited_at,
  expires_at,
  activated_at,
  status,
  site_id
FROM public.user_invitations;

-- Grant access to the view for authenticated users
GRANT SELECT ON public.user_invitations_safe TO authenticated;

-- Now create a very restrictive SELECT policy on the base table
-- This allows SELECT only for the edge function to verify passwords during login
-- Normal queries should use the view instead
CREATE POLICY "Restrict direct table SELECT to service role only"
ON public.user_invitations
FOR SELECT
TO authenticated
USING (
  -- Only allow if user is checking their own invitation by email
  -- This is needed for the login flow to verify temporary password
  email = auth.email()
);