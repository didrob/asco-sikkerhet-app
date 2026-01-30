-- =============================================
-- MIGRASJON 3: Procedures tabell
-- =============================================

CREATE TABLE public.procedures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid REFERENCES public.sites(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  status public.procedure_status DEFAULT 'draft'::public.procedure_status NOT NULL,
  content_blocks jsonb DEFAULT '[]'::jsonb NOT NULL,
  required_for_roles text[] DEFAULT '{}',
  due_date timestamptz,
  recurrence_interval interval,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- RLS for procedures
ALTER TABLE public.procedures ENABLE ROW LEVEL SECURITY;

-- Alle autentiserte brukere med site-tilgang kan se publiserte prosedyrer
CREATE POLICY "Users can view published procedures in their sites"
  ON public.procedures FOR SELECT
  TO authenticated
  USING (
    status = 'published'::public.procedure_status
    AND public.has_site_access(auth.uid(), site_id)
  );

-- Admins og supervisors kan se alle prosedyrer i sine sites
CREATE POLICY "Managers can view all procedures in their sites"
  ON public.procedures FOR SELECT
  TO authenticated
  USING (public.can_manage_procedures(auth.uid(), site_id));

-- Admins og supervisors kan opprette prosedyrer
CREATE POLICY "Managers can insert procedures"
  ON public.procedures FOR INSERT
  TO authenticated
  WITH CHECK (public.can_manage_procedures(auth.uid(), site_id));

-- Admins og supervisors kan oppdatere prosedyrer
CREATE POLICY "Managers can update procedures"
  ON public.procedures FOR UPDATE
  TO authenticated
  USING (public.can_manage_procedures(auth.uid(), site_id))
  WITH CHECK (public.can_manage_procedures(auth.uid(), site_id));

-- Admins og supervisors kan slette prosedyrer
CREATE POLICY "Managers can delete procedures"
  ON public.procedures FOR DELETE
  TO authenticated
  USING (public.can_manage_procedures(auth.uid(), site_id));

-- Indekser
CREATE INDEX idx_procedures_site_id ON public.procedures(site_id);
CREATE INDEX idx_procedures_status ON public.procedures(status);
CREATE INDEX idx_procedures_created_by ON public.procedures(created_by);

-- =============================================
-- MIGRASJON 4: Progress, Completions, Audit
-- =============================================

-- Procedure Progress
CREATE TABLE public.procedure_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  procedure_id uuid REFERENCES public.procedures(id) ON DELETE CASCADE NOT NULL,
  current_block_index integer DEFAULT 0 NOT NULL,
  checkpoint_answers jsonb DEFAULT '{}'::jsonb,
  started_at timestamptz DEFAULT now() NOT NULL,
  last_activity_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (user_id, procedure_id)
);

ALTER TABLE public.procedure_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own progress"
  ON public.procedure_progress FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Quiz Attempts
CREATE TABLE public.quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  procedure_id uuid REFERENCES public.procedures(id) ON DELETE CASCADE NOT NULL,
  question_id text NOT NULL,
  selected_answer text NOT NULL,
  is_correct boolean NOT NULL,
  attempted_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own attempts"
  ON public.quiz_attempts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own attempts"
  ON public.quiz_attempts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Procedure Completions
CREATE TABLE public.procedure_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  procedure_id uuid REFERENCES public.procedures(id) ON DELETE CASCADE NOT NULL,
  signature_text text,
  signature_storage_path text,
  completed_at timestamptz DEFAULT now() NOT NULL,
  expires_at timestamptz
);

ALTER TABLE public.procedure_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own completions"
  ON public.procedure_completions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all completions in their sites"
  ON public.procedure_completions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.procedures p
      WHERE p.id = procedure_completions.procedure_id
      AND public.can_manage_procedures(auth.uid(), p.site_id)
    )
  );

CREATE POLICY "Users can insert own completions"
  ON public.procedure_completions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Audit Log (immutable)
CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  ip_address inet,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit log"
  ON public.audit_log FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Authenticated users can insert audit entries"
  ON public.audit_log FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Indekser
CREATE INDEX idx_procedure_progress_user_id ON public.procedure_progress(user_id);
CREATE INDEX idx_procedure_progress_procedure_id ON public.procedure_progress(procedure_id);
CREATE INDEX idx_quiz_attempts_user_id ON public.quiz_attempts(user_id);
CREATE INDEX idx_quiz_attempts_procedure_id ON public.quiz_attempts(procedure_id);
CREATE INDEX idx_procedure_completions_user_id ON public.procedure_completions(user_id);
CREATE INDEX idx_procedure_completions_procedure_id ON public.procedure_completions(procedure_id);
CREATE INDEX idx_audit_log_user_id ON public.audit_log(user_id);
CREATE INDEX idx_audit_log_resource_type ON public.audit_log(resource_type);
CREATE INDEX idx_audit_log_created_at ON public.audit_log(created_at DESC);