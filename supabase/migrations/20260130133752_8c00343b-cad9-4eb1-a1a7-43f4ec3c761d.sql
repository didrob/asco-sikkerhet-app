-- Add metadata columns to procedures table
ALTER TABLE public.procedures
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS version TEXT DEFAULT '1.0',
ADD COLUMN IF NOT EXISTS approved_by UUID,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS review_date DATE,
ADD COLUMN IF NOT EXISTS document_number TEXT,
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS author_id UUID;

-- Create procedure_attachments table
CREATE TABLE IF NOT EXISTS public.procedure_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  procedure_id UUID NOT NULL REFERENCES procedures(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  description TEXT,
  uploaded_by UUID,
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

-- Create procedure_comments table for collaboration
CREATE TABLE IF NOT EXISTS public.procedure_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  procedure_id UUID NOT NULL REFERENCES procedures(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  block_id TEXT,
  parent_id UUID REFERENCES procedure_comments(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create procedure_revisions table for version history
CREATE TABLE IF NOT EXISTS public.procedure_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  procedure_id UUID NOT NULL REFERENCES procedures(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  content_snapshot JSONB NOT NULL,
  changed_by UUID,
  change_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create storage bucket for procedure attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('procedure-attachments', 'procedure-attachments', true, 52428800)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on new tables
ALTER TABLE public.procedure_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procedure_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procedure_revisions ENABLE ROW LEVEL SECURITY;

-- RLS policies for procedure_attachments
CREATE POLICY "Managers can manage attachments"
ON public.procedure_attachments
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM procedures p 
    WHERE p.id = procedure_attachments.procedure_id 
    AND can_manage_procedures(auth.uid(), p.site_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM procedures p 
    WHERE p.id = procedure_attachments.procedure_id 
    AND can_manage_procedures(auth.uid(), p.site_id)
  )
);

CREATE POLICY "Users can view attachments for published procedures"
ON public.procedure_attachments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM procedures p 
    WHERE p.id = procedure_attachments.procedure_id 
    AND p.status = 'published'
    AND has_site_access(auth.uid(), p.site_id)
  )
);

-- RLS policies for procedure_comments
CREATE POLICY "Managers can manage all comments"
ON public.procedure_comments
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM procedures p 
    WHERE p.id = procedure_comments.procedure_id 
    AND can_manage_procedures(auth.uid(), p.site_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM procedures p 
    WHERE p.id = procedure_comments.procedure_id 
    AND can_manage_procedures(auth.uid(), p.site_id)
  )
);

CREATE POLICY "Users can view comments on procedures they can access"
ON public.procedure_comments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM procedures p 
    WHERE p.id = procedure_comments.procedure_id 
    AND has_site_access(auth.uid(), p.site_id)
  )
);

CREATE POLICY "Users can insert own comments"
ON public.procedure_comments
FOR INSERT
WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM procedures p 
    WHERE p.id = procedure_comments.procedure_id 
    AND has_site_access(auth.uid(), p.site_id)
  )
);

CREATE POLICY "Users can update own comments"
ON public.procedure_comments
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- RLS policies for procedure_revisions
CREATE POLICY "Managers can manage revisions"
ON public.procedure_revisions
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM procedures p 
    WHERE p.id = procedure_revisions.procedure_id 
    AND can_manage_procedures(auth.uid(), p.site_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM procedures p 
    WHERE p.id = procedure_revisions.procedure_id 
    AND can_manage_procedures(auth.uid(), p.site_id)
  )
);

CREATE POLICY "Users can view revisions for procedures they can access"
ON public.procedure_revisions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM procedures p 
    WHERE p.id = procedure_revisions.procedure_id 
    AND has_site_access(auth.uid(), p.site_id)
  )
);

-- Storage policies for procedure-attachments bucket
CREATE POLICY "Managers can upload attachments"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'procedure-attachments' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Anyone can view procedure attachments"
ON storage.objects
FOR SELECT
USING (bucket_id = 'procedure-attachments');

CREATE POLICY "Managers can delete attachments"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'procedure-attachments' AND
  auth.uid() IS NOT NULL
);