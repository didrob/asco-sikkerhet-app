-- =============================================
-- KOMPLETT MIGRASJON: Alt i riktig rekkefølge
-- =============================================

-- Først sjekk om sites-tabellen allerede eksisterer (fra delvis kjøring)
DROP TABLE IF EXISTS public.user_site_assignments CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.sites CASCADE;

-- Dropp enums hvis de eksisterer
DROP TYPE IF EXISTS public.app_role CASCADE;
DROP TYPE IF EXISTS public.procedure_status CASCADE;
DROP TYPE IF EXISTS public.completion_status CASCADE;

-- =============================================
-- 1. ENUMS
-- =============================================
CREATE TYPE public.app_role AS ENUM ('admin', 'operator', 'supervisor', 'viewer');
CREATE TYPE public.procedure_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE public.completion_status AS ENUM ('not_started', 'in_progress', 'completed', 'expired');

-- =============================================
-- 2. TABELLER
-- =============================================

-- Sites tabell
CREATE TABLE public.sites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location text,
  settings jsonb DEFAULT '{}'::jsonb,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Profiles tabell
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  job_title text,
  department text,
  current_site_id uuid REFERENCES public.sites(id),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- User roles tabell
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  site_id uuid REFERENCES public.sites(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (user_id, site_id, role)
);

-- User site assignments tabell
CREATE TABLE public.user_site_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  site_id uuid REFERENCES public.sites(id) ON DELETE CASCADE NOT NULL,
  assigned_at timestamptz DEFAULT now() NOT NULL,
  assigned_by uuid REFERENCES auth.users(id),
  UNIQUE (user_id, site_id)
);

-- =============================================
-- 3. SECURITY DEFINER FUNCTIONS
-- =============================================

-- Sjekk om bruker har rolle
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role, _site_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND (_site_id IS NULL OR site_id = _site_id)
  )
$$;

-- Sjekk site-tilgang
CREATE OR REPLACE FUNCTION public.has_site_access(_user_id uuid, _site_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_site_assignments
    WHERE user_id = _user_id
      AND site_id = _site_id
  )
$$;

-- Hent brukerens sites
CREATE OR REPLACE FUNCTION public.get_user_sites(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT site_id
  FROM public.user_site_assignments
  WHERE user_id = _user_id
$$;

-- Sjekk om bruker er admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'admin'::public.app_role
  )
$$;

-- Sjekk om bruker kan administrere prosedyrer
CREATE OR REPLACE FUNCTION public.can_manage_procedures(_user_id uuid, _site_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND site_id = _site_id
      AND role IN ('admin'::public.app_role, 'supervisor'::public.app_role)
  )
$$;

-- =============================================
-- 4. RLS POLICIES
-- =============================================

-- Sites RLS
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view assigned sites"
  ON public.sites FOR SELECT
  TO authenticated
  USING (public.has_site_access(auth.uid(), id) OR public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert sites"
  ON public.sites FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update sites"
  ON public.sites FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete sites"
  ON public.sites FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Profiles RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can view colleagues"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_site_assignments usa1
      JOIN public.user_site_assignments usa2 ON usa1.site_id = usa2.site_id
      WHERE usa1.user_id = auth.uid() AND usa2.user_id = profiles.id
    )
  );

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- User Roles RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- User Site Assignments RLS
ALTER TABLE public.user_site_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own assignments"
  ON public.user_site_assignments FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all assignments"
  ON public.user_site_assignments FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage assignments"
  ON public.user_site_assignments FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- =============================================
-- 5. INDEKSER
-- =============================================
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_site_id ON public.user_roles(site_id);
CREATE INDEX idx_user_site_assignments_user_id ON public.user_site_assignments(user_id);
CREATE INDEX idx_user_site_assignments_site_id ON public.user_site_assignments(site_id);
CREATE INDEX idx_profiles_current_site_id ON public.profiles(current_site_id);