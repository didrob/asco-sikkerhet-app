-- Create RLS policies for governance users

-- Policy for governance users to view all completions
CREATE POLICY "Governance users can view all completions"
ON public.procedure_completions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('auditor'::public.app_role, 'external_client'::public.app_role)
  )
);

-- Policy for governance users to view published procedures
CREATE POLICY "Governance users can view published procedures"
ON public.procedures
FOR SELECT
TO authenticated
USING (
  status = 'published'::procedure_status AND
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('auditor'::public.app_role, 'external_client'::public.app_role)
  )
);

-- Policy for auditors to view all audit logs
CREATE POLICY "Auditors can view audit log"
ON public.audit_log
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'auditor'::public.app_role
  )
);

-- Policy for governance users to view profiles (for certificate verification)
CREATE POLICY "Governance users can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('auditor'::public.app_role, 'external_client'::public.app_role)
  )
);