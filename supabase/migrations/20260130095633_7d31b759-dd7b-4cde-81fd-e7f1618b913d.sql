-- Opprett en site for testing og legg til admin-rolle for brukeren

-- 1. Opprett en standard site
INSERT INTO public.sites (id, name, location)
VALUES ('00000000-0000-0000-0000-000000000001', 'ASCO Hovedkontor', 'Oslo')
ON CONFLICT (id) DO NOTHING;

-- 2. Tildel brukeren til denne siten
INSERT INTO public.user_site_assignments (user_id, site_id)
VALUES ('6e8ad682-d293-4d04-8370-4f6c6594a2b0', '00000000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;

-- 3. Gi brukeren admin-rolle på denne siten
INSERT INTO public.user_roles (user_id, site_id, role)
VALUES ('6e8ad682-d293-4d04-8370-4f6c6594a2b0', '00000000-0000-0000-0000-000000000001', 'admin')
ON CONFLICT DO NOTHING;