

# Database Migrasjoner for ASCO Digital Safety Operations

## Oversikt
Jeg vil nå opprette alle database-migrasjonene for å sette opp det komplette multi-tenant skjemaet for sikkerhetsoperasjonsplattformen. Migrasjonene vil bli kjørt i riktig rekkefølge for å sikre at avhengigheter håndteres korrekt.

---

## Migrasjonsplan

### Migrasjon 1: Enums og Security Functions
Oppretter grunnleggende typer og sikkerhetsfunksjoner som brukes av alle andre tabeller.

**Innhold:**
- `app_role` enum (admin, operator, supervisor, viewer)
- `procedure_status` enum (draft, published, archived)
- `completion_status` enum (not_started, in_progress, completed, expired)
- `has_role()` security definer funksjon
- `has_site_access()` security definer funksjon
- `get_user_sites()` security definer funksjon

---

### Migrasjon 2: Sites og User Tables
Oppretter multi-tenant grunnlag og brukerhåndtering.

**Tabeller:**
- `sites` - Multi-tenant site-struktur
  - id, name, location, settings (JSONB), active, created_at, updated_at
  
- `profiles` - Brukerprofiler
  - id (refererer til auth.users), full_name, avatar_url, job_title, department, current_site_id, created_at, updated_at
  
- `user_roles` - Rolletildelinger (sikkerhetskritisk)
  - id, user_id, site_id, role (app_role enum)
  - Unique constraint på (user_id, site_id, role)
  
- `user_site_assignments` - Hvilke sites brukeren har tilgang til
  - id, user_id, site_id, assigned_at, assigned_by

**RLS Policies:**
- Sites: SELECT for tilordnede brukere, CRUD for admins
- Profiles: SELECT egen + kolleger, UPDATE egen
- User Roles: Kun via security definer funksjon
- Site Assignments: SELECT egen, CRUD for admins

---

### Migrasjon 3: Procedures
Oppretter prosedyre-tabellen med JSONB innholdsstruktur.

**Tabell:**
- `procedures`
  - id, site_id, title, description, status (procedure_status)
  - content_blocks (JSONB) - fleksibel innholdsstruktur
  - required_for_roles (text[]) - hvilke roller må fullføre
  - due_date, recurrence_interval (interval)
  - created_by, created_at, updated_at

**RLS Policies:**
- SELECT: Basert på site-tilordning og rolle
- INSERT/UPDATE/DELETE: Admins og supervisors

---

### Migrasjon 4: Progress, Completions og Audit
Oppretter tabeller for fremgang, fullføringer og revisjonsspor.

**Tabeller:**
- `procedure_progress` - Brukerens posisjon i en prosedyre
  - id, user_id, procedure_id, current_block_index
  - checkpoint_answers (JSONB), started_at, last_activity_at
  
- `quiz_attempts` - Registrerer hvert spørsmålsforsøk
  - id, user_id, procedure_id, question_id
  - selected_answer, is_correct, attempted_at
  
- `procedure_completions` - Signaturer og fullføringer
  - id, user_id, procedure_id
  - signature_text, signature_storage_path
  - completed_at, expires_at
  
- `audit_log` - Uforanderlig revisjonslogg
  - id, user_id, action, resource_type, resource_id
  - metadata (JSONB), ip_address, created_at

**RLS Policies:**
- Progress: CRUD for egen bruker
- Completions: SELECT egen + site for admins, INSERT egen, ingen UPDATE/DELETE
- Audit: SELECT for admins, INSERT for autentiserte, ingen UPDATE/DELETE

---

### Migrasjon 5: Storage Buckets
Oppretter lagringsbøtter for media og signaturer.

**Buckets:**
- `avatars` - Offentlig, for profilbilder
- `procedure-media` - Offentlig, for prosedyre-bilder og videoer
- `signatures` - Privat, for tegnede signaturer

**RLS Policies:**
- Avatars: Upload/update egen, alle kan lese
- Procedure Media: Admins kan laste opp, alle autentiserte kan lese
- Signatures: Upload egen, admins kan lese alle

---

### Migrasjon 6: Triggers
Oppretter automatiske triggere for profilering og tidsstempling.

**Triggers:**
- `handle_new_user` - Auto-oppretter profil ved brukerregistrering
- `update_updated_at` - Auto-oppdaterer `updated_at` på alle tabeller

---

## Teknisk Implementering

Migrasjonene vil bli opprettet som separate SQL-filer i riktig rekkefølge:

1. `001_enums_and_functions.sql` - Enums og security definer funksjoner
2. `002_sites_and_users.sql` - Sites, profiles, roles, assignments med RLS
3. `003_procedures.sql` - Prosedyrer med JSONB innhold
4. `004_progress_and_completions.sql` - Progress, completions, audit log
5. `005_storage_buckets.sql` - Lagringsbøtter med policies
6. `006_triggers.sql` - Auto-profilering og timestamp-triggere

---

## Etter Migrasjonene

Når alle migrasjonene er kjørt, vil Supabase-prosjektet ha:
- Komplett multi-tenant databaseskjema
- Sikker rollebasert tilgangskontroll
- Fleksibel JSONB-struktur for prosedyreinnhold
- Revisjonsspor for compliance
- Lagring for media og signaturer
- Alle RLS-policyer konfigurert

**Viktig:** Etter at tabellene er opprettet, må autentisering implementeres i frontend for at RLS-policyene skal fungere.

