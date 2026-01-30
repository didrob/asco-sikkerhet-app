-- Tilgangsforespørsler (når brukere ber om tilgang)
CREATE TABLE public.access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  full_name TEXT,
  company TEXT,
  request_type TEXT NOT NULL DEFAULT 'new_user',
  status TEXT NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  processed_by UUID,
  notes TEXT
);

-- Brukerinvitasjoner (med midlertidig passord)
CREATE TABLE public.user_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  full_name TEXT,
  temporary_password TEXT NOT NULL,
  invited_by UUID,
  invited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  activated_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending',
  site_id UUID REFERENCES public.sites(id) ON DELETE SET NULL,
  CONSTRAINT user_invitations_email_key UNIQUE (email)
);

-- Enable RLS
ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_invitations ENABLE ROW LEVEL SECURITY;

-- RLS policies for access_requests
-- Admins can manage all access requests
CREATE POLICY "Admins can manage access requests"
ON public.access_requests
FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Anyone can insert access requests (unauthenticated)
CREATE POLICY "Anyone can request access"
ON public.access_requests
FOR INSERT
WITH CHECK (true);

-- RLS policies for user_invitations
-- Admins can manage all invitations
CREATE POLICY "Admins can manage invitations"
ON public.user_invitations
FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Site managers can view invitations for their site
CREATE POLICY "Managers can view site invitations"
ON public.user_invitations
FOR SELECT
USING (
  site_id IS NOT NULL AND can_manage_procedures(auth.uid(), site_id)
);

-- Create indexes for common queries
CREATE INDEX idx_access_requests_status ON public.access_requests(status);
CREATE INDEX idx_access_requests_email ON public.access_requests(email);
CREATE INDEX idx_user_invitations_status ON public.user_invitations(status);
CREATE INDEX idx_user_invitations_email ON public.user_invitations(email);
CREATE INDEX idx_user_invitations_expires_at ON public.user_invitations(expires_at);