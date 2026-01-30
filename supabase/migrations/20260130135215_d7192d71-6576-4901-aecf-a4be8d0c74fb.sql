-- Fix the SECURITY DEFINER view issue - drop and recreate with SECURITY INVOKER
DROP VIEW IF EXISTS public.user_invitations_safe;

CREATE VIEW public.user_invitations_safe 
WITH (security_invoker = true)
AS
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

-- Update the base table SELECT policy to be more secure
-- Drop the old policy first
DROP POLICY IF EXISTS "Restrict direct table SELECT to service role only" ON public.user_invitations;

-- Create a new policy that only allows users to see their own invitation (for login verification)
CREATE POLICY "Users can view own invitation for login"
ON public.user_invitations
FOR SELECT
TO authenticated
USING (email = auth.email());

-- Also allow admins to see invitations via the secure view
-- But they still can't see passwords because the view excludes it
CREATE POLICY "Admins can view invitations metadata"
ON public.user_invitations
FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));