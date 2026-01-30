-- 1. Prosedyre-visninger tabell
CREATE TABLE public.procedure_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  procedure_id UUID REFERENCES public.procedures(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  viewed_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  duration_seconds INTEGER,
  completed_read BOOLEAN DEFAULT false
);

-- Indekser for rask aggregering
CREATE INDEX idx_procedure_views_procedure_id ON public.procedure_views(procedure_id);
CREATE INDEX idx_procedure_views_user_id ON public.procedure_views(user_id);
CREATE INDEX idx_procedure_views_viewed_at ON public.procedure_views(viewed_at);

-- RLS
ALTER TABLE public.procedure_views ENABLE ROW LEVEL SECURITY;

-- Brukere kan legge til egne visninger
CREATE POLICY "Users can insert own views"
ON public.procedure_views FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- Brukere kan oppdatere egne visninger (for duration)
CREATE POLICY "Users can update own views"
ON public.procedure_views FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Brukere kan se egne visninger
CREATE POLICY "Users can view own views"
ON public.procedure_views FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Admin/Supervisors kan se alle visninger i sine sites
CREATE POLICY "Managers can view procedure views"
ON public.procedure_views FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.procedures p
    WHERE p.id = procedure_views.procedure_id
    AND public.can_manage_procedures(auth.uid(), p.site_id)
  )
);

-- Admins kan se alle visninger
CREATE POLICY "Admins can view all procedure views"
ON public.procedure_views FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()));

-- 2. AI-tilgang tabell (for fremtidig bruk)
CREATE TABLE public.ai_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  enabled BOOLEAN DEFAULT false,
  features TEXT[] DEFAULT '{}',
  granted_by UUID,
  granted_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.ai_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage AI access"
ON public.ai_access FOR ALL TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));