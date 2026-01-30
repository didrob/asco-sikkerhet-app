

# Supabase Database Setup for ASCO Digital Safety Operations

## Overview
Complete database schema setup for manual Supabase connection, including all tables, Row Level Security policies, helper functions, and storage buckets needed for the multi-tenant safety operations platform.

---

## Step 1: Connect Your Supabase Project

Before we begin, you'll need to:
1. Create a Supabase project at supabase.com (if you haven't already)
2. Connect it to Lovable via the Supabase integration button
3. Once connected, I'll create all the database migrations

---

## Step 2: Core Types & Enums

### App Roles Enum
```sql
create type public.app_role as enum ('admin', 'operator', 'supervisor', 'viewer');
```

### Procedure Status Enum
```sql
create type public.procedure_status as enum ('draft', 'published', 'archived');
```

### Completion Status Enum
```sql
create type public.completion_status as enum ('not_started', 'in_progress', 'completed', 'expired');
```

---

## Step 3: Multi-Tenant Sites Table

### Sites Table
- `id`, `name`, `location`, `settings` (JSONB for flexibility)
- RLS: Users can only read sites they're assigned to

---

## Step 4: User Management Tables

### Profiles Table
- Links to `auth.users`
- Fields: `full_name`, `avatar_url`, `job_title`, `department`
- `current_site_id` - active site context
- Trigger to auto-create profile on signup

### User Roles Table (Security Critical)
- Separate table to prevent privilege escalation
- Links user to role with `site_id` context
- Security definer function `has_role()` for safe RLS checks

### User Site Assignments
- Junction table linking users to their allowed sites
- Enables multi-site access for supervisors/admins

---

## Step 5: Procedures & Content Tables

### Procedures Table
- `site_id` for multi-tenancy
- `title`, `description`, `status`
- `content_blocks` (JSONB) - flexible content structure
- `required_for_roles` - which roles must complete this
- `due_date`, `recurrence_interval`

### Content Block Structure (JSONB)
```json
[
  { "type": "heading", "level": 1, "text": "Sikkerhetsprosedyre" },
  { "type": "paragraph", "text": "..." },
  { "type": "image", "url": "...", "alt": "..." },
  { "type": "video", "url": "...", "poster": "..." },
  { "type": "checkpoint", "question": "...", "options": [...], "correct": 0 }
]
```

---

## Step 6: Quiz & Progress Tables

### Procedure Progress
- Tracks user's position in a procedure
- `current_block_index`, `checkpoint_answers` (JSONB)
- `started_at`, `last_activity_at`

### Quiz Attempts
- Records each checkpoint question attempt
- `question_id`, `selected_answer`, `is_correct`
- For analytics and retry logic

---

## Step 7: Signatures & Compliance

### Procedure Completions
- Records when a user signs off a procedure
- `signature_text` - "Jeg bekrefter at innholdet er forstått"
- `signature_data` - optional drawn signature (base64 reference)
- `completed_at` - timestamp for audit
- `expires_at` - for recurring certifications

### Audit Log
- Immutable record of all significant actions
- `user_id`, `action`, `resource_type`, `resource_id`
- `metadata` (JSONB), `ip_address`, `created_at`
- Insert-only policy (no updates/deletes)

---

## Step 8: Security Functions

### has_role() Function
```sql
-- Security definer to prevent RLS recursion
create function public.has_role(_user_id uuid, _role app_role)
returns boolean
security definer
```

### has_site_access() Function
```sql
-- Check if user can access a specific site
create function public.has_site_access(_user_id uuid, _site_id uuid)
returns boolean
security definer
```

### get_user_sites() Function
```sql
-- Get all sites a user has access to
create function public.get_user_sites(_user_id uuid)
returns setof uuid
security definer
```

---

## Step 9: Row Level Security Policies

### Sites
- SELECT: Users can view sites they're assigned to
- INSERT/UPDATE/DELETE: Admins only

### Profiles
- SELECT: Own profile + same-site colleagues for admins
- UPDATE: Own profile only

### User Roles
- SELECT: Via security definer function
- INSERT/UPDATE/DELETE: Admins only

### Procedures
- SELECT: Based on site assignment and role
- INSERT/UPDATE/DELETE: Admins and supervisors

### Completions
- SELECT: Own completions + site completions for admins
- INSERT: Own completions only
- UPDATE/DELETE: None (immutable for audit)

### Audit Log
- SELECT: Admins only
- INSERT: Authenticated users (via functions)
- UPDATE/DELETE: None (immutable)

---

## Step 10: Storage Buckets

### Avatars Bucket
- Public bucket for user profile pictures
- RLS: Users can upload/update own avatar

### Procedure Media Bucket
- Public bucket for procedure images/videos
- RLS: Admins can upload, all authenticated can read

### Signatures Bucket
- Private bucket for drawn signatures
- RLS: Users can upload own, admins can read all

---

## Step 11: Database Triggers

### Auto-create Profile
- On `auth.users` insert, create matching profile

### Update Timestamps
- Auto-update `updated_at` on all tables

### Audit Logging
- Log significant changes to audit_log table

---

## Implementation Order

1. **Connect Supabase** - Link your project to Lovable
2. **Migration 1**: Create enums and helper functions
3. **Migration 2**: Create sites and user tables with RLS
4. **Migration 3**: Create procedures and content tables with RLS
5. **Migration 4**: Create progress, completions, and audit tables
6. **Migration 5**: Create storage buckets with policies
7. **Migration 6**: Create triggers and seed initial data

---

## What You'll Have

After setup, your Supabase project will have:
- ✅ Complete multi-tenant database schema
- ✅ Secure role-based access control
- ✅ Flexible JSONB content structure for procedures
- ✅ Audit trail for compliance
- ✅ Storage for media and signatures
- ✅ All RLS policies configured

**Next Step**: Click the Supabase button in Lovable to connect your project, then I'll create all the migrations.

