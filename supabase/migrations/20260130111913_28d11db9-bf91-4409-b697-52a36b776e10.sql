-- Opplæringstyper
CREATE TYPE training_type AS ENUM (
  'theoretical',
  'practical',
  'video',
  'mixed'
);

-- Opplæringskurs (koblet til prosedyrer)
CREATE TABLE training_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE NOT NULL,
  procedure_ids UUID[] NOT NULL DEFAULT '{}',
  title TEXT NOT NULL,
  description TEXT,
  training_type training_type DEFAULT 'mixed',
  content_blocks JSONB DEFAULT '[]',
  pass_threshold INTEGER DEFAULT 80,
  required_for_roles TEXT[] DEFAULT '{}',
  status procedure_status DEFAULT 'draft',
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indeks for effektiv søking på prosedyre-ID
CREATE INDEX idx_training_courses_procedures ON training_courses USING GIN (procedure_ids);
CREATE INDEX idx_training_courses_site ON training_courses(site_id);
CREATE INDEX idx_training_courses_status ON training_courses(status);

-- Brukergrupper (for utsendelse)
CREATE TABLE training_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_training_groups_site ON training_groups(site_id);

-- Gruppemedlemskap
CREATE TABLE training_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES training_groups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  added_at TIMESTAMPTZ DEFAULT now(),
  added_by UUID,
  UNIQUE(group_id, user_id)
);

CREATE INDEX idx_training_group_members_group ON training_group_members(group_id);
CREATE INDEX idx_training_group_members_user ON training_group_members(user_id);

-- Kurstildelinger
CREATE TABLE training_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES training_courses(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  group_id UUID REFERENCES training_groups(id) ON DELETE SET NULL,
  assigned_by UUID,
  due_date DATE,
  sent_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  passed BOOLEAN,
  score INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(course_id, user_id)
);

CREATE INDEX idx_training_assignments_course ON training_assignments(course_id);
CREATE INDEX idx_training_assignments_user ON training_assignments(user_id);
CREATE INDEX idx_training_assignments_due_date ON training_assignments(due_date);

-- Fremgang under gjennomføring
CREATE TABLE training_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES training_assignments(id) ON DELETE CASCADE NOT NULL,
  current_block_index INTEGER DEFAULT 0,
  answers JSONB DEFAULT '{}',
  started_at TIMESTAMPTZ DEFAULT now(),
  last_activity_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_training_progress_assignment ON training_progress(assignment_id);

-- Trigger for updated_at
CREATE TRIGGER update_training_courses_updated_at
  BEFORE UPDATE ON training_courses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_training_groups_updated_at
  BEFORE UPDATE ON training_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies

-- training_courses
ALTER TABLE training_courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view published courses in their sites"
  ON training_courses FOR SELECT
  USING (status = 'published' AND has_site_access(auth.uid(), site_id));

CREATE POLICY "Managers can view all courses in their sites"
  ON training_courses FOR SELECT
  USING (can_manage_procedures(auth.uid(), site_id));

CREATE POLICY "Managers can insert courses"
  ON training_courses FOR INSERT
  WITH CHECK (can_manage_procedures(auth.uid(), site_id));

CREATE POLICY "Managers can update courses"
  ON training_courses FOR UPDATE
  USING (can_manage_procedures(auth.uid(), site_id))
  WITH CHECK (can_manage_procedures(auth.uid(), site_id));

CREATE POLICY "Managers can delete courses"
  ON training_courses FOR DELETE
  USING (can_manage_procedures(auth.uid(), site_id));

-- training_groups
ALTER TABLE training_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view groups in their sites"
  ON training_groups FOR SELECT
  USING (has_site_access(auth.uid(), site_id));

CREATE POLICY "Managers can manage groups"
  ON training_groups FOR ALL
  USING (can_manage_procedures(auth.uid(), site_id))
  WITH CHECK (can_manage_procedures(auth.uid(), site_id));

-- training_group_members
ALTER TABLE training_group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view group members"
  ON training_group_members FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM training_groups g
    WHERE g.id = group_id AND has_site_access(auth.uid(), g.site_id)
  ));

CREATE POLICY "Managers can manage group members"
  ON training_group_members FOR ALL
  USING (EXISTS (
    SELECT 1 FROM training_groups g
    WHERE g.id = group_id AND can_manage_procedures(auth.uid(), g.site_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM training_groups g
    WHERE g.id = group_id AND can_manage_procedures(auth.uid(), g.site_id)
  ));

-- training_assignments
ALTER TABLE training_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own assignments"
  ON training_assignments FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Managers can view assignments in their sites"
  ON training_assignments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM training_courses c
    WHERE c.id = course_id AND can_manage_procedures(auth.uid(), c.site_id)
  ));

CREATE POLICY "Managers can insert assignments"
  ON training_assignments FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM training_courses c
    WHERE c.id = course_id AND can_manage_procedures(auth.uid(), c.site_id)
  ));

CREATE POLICY "Managers can update assignments"
  ON training_assignments FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM training_courses c
    WHERE c.id = course_id AND can_manage_procedures(auth.uid(), c.site_id)
  ));

CREATE POLICY "Users can update own assignment progress"
  ON training_assignments FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Managers can delete assignments"
  ON training_assignments FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM training_courses c
    WHERE c.id = course_id AND can_manage_procedures(auth.uid(), c.site_id)
  ));

-- training_progress
ALTER TABLE training_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own progress"
  ON training_progress FOR ALL
  USING (EXISTS (
    SELECT 1 FROM training_assignments a
    WHERE a.id = assignment_id AND a.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM training_assignments a
    WHERE a.id = assignment_id AND a.user_id = auth.uid()
  ));