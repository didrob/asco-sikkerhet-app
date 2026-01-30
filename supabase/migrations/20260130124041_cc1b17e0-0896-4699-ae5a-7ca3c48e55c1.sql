-- Create table for logging sent training reminders
CREATE TABLE public.training_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES public.training_assignments(id) ON DELETE CASCADE,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_by UUID REFERENCES auth.users(id),
  reminder_type TEXT NOT NULL DEFAULT 'overdue'
);

-- Add indexes for common queries
CREATE INDEX idx_training_reminders_assignment ON public.training_reminders(assignment_id);
CREATE INDEX idx_training_reminders_sent_at ON public.training_reminders(sent_at DESC);

-- Enable RLS
ALTER TABLE public.training_reminders ENABLE ROW LEVEL SECURITY;

-- Managers can view and create reminders for their courses
CREATE POLICY "Managers can manage reminders"
ON public.training_reminders FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.training_assignments a
    JOIN public.training_courses c ON c.id = a.course_id
    WHERE a.id = training_reminders.assignment_id
    AND public.can_manage_procedures(c.site_id, auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.training_assignments a
    JOIN public.training_courses c ON c.id = a.course_id
    WHERE a.id = training_reminders.assignment_id
    AND public.can_manage_procedures(c.site_id, auth.uid())
  )
);