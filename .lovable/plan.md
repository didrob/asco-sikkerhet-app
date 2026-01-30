

# Implementering Del 9 - Separasjon av Prosedyrer og Opplæring (Revidert)

## Oversikt

Denne fasen separerer systemet i to distinkte moduler med fokus på:
1. **Prosedyrer** - Referansedokumenter (les og bekreft)
2. **Opplæring** - Aktiv læring med kurs og sporing
3. **Kursinvitasjoner** - Utsendelse via lokal e-post med gruppevalg og BCC
4. **HSQ/Admin Oversikt** - Sporing per lokasjon og rolle-compliance

---

## Del 1: Terminologi og Strukturendringer

### Erstatter "Sertifikater" med "Gjennomført opplæring"

| Nåværende | Nytt |
|-----------|------|
| Mine sertifikater | Min opplæringshistorikk |
| Sertifikat | Bestått / Gjennomført |
| Sertifisert | Har bestått |
| Kursbevis (utsettes) | Vises senere når godkjent |

### Kurs kobles til Prosedyrer

Hvert opplæringskurs må være koblet til underliggende prosedyrer for å sikre samsvar:

```text
training_courses.procedure_ids[] → procedures[]
```

---

## Del 2: Nye Database-tabeller

### Opplæringsmodul

```sql
-- Opplæringstyper
CREATE TYPE training_type AS ENUM (
  'theoretical',  -- Quiz/test
  'practical',    -- Praktisk øvelse
  'video',        -- Video-basert
  'mixed'         -- Kombinasjon
);

-- Opplæringskurs (koblet til prosedyrer)
CREATE TABLE training_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES sites(id) NOT NULL,
  procedure_ids UUID[] NOT NULL DEFAULT '{}',  -- Kobling til prosedyrer
  title TEXT NOT NULL,
  description TEXT,
  training_type training_type DEFAULT 'mixed',
  content_blocks JSONB DEFAULT '[]',
  pass_threshold INTEGER DEFAULT 80,
  required_for_roles TEXT[] DEFAULT '{}',  -- Påkrevd for roller
  status procedure_status DEFAULT 'draft',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Brukergrupper (for utsendelse)
CREATE TABLE training_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES sites(id) NOT NULL,
  name TEXT NOT NULL,  -- F.eks. "Kranførere", "HMS-ansvarlige"
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Gruppemedlemskap
CREATE TABLE training_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES training_groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Kurstildelinger
CREATE TABLE training_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES training_courses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id UUID REFERENCES training_groups(id),  -- Hvilken gruppe de ble tildelt via
  assigned_by UUID REFERENCES auth.users(id),
  due_date DATE,
  sent_at TIMESTAMPTZ,  -- Når invitasjon ble sendt
  completed_at TIMESTAMPTZ,
  passed BOOLEAN,
  score INTEGER,
  UNIQUE(course_id, user_id)
);

-- Fremgang under gjennomføring
CREATE TABLE training_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES training_assignments(id) ON DELETE CASCADE,
  current_block_index INTEGER DEFAULT 0,
  answers JSONB DEFAULT '{}',
  started_at TIMESTAMPTZ DEFAULT now(),
  last_activity_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Del 3: Kursinvitasjon via E-post

### Utsendelsesflyt

```text
+----------------------------------------+
|  SEND KURSINVITASJON                   |
+----------------------------------------+
| Kurs: HMS Grunnkurs                    |
+----------------------------------------+
| VELG MOTTAKERE                         |
|                                        |
| Grupper:                               |
| [x] Kranførere (12 brukere)            |
| [x] HMS-ansvarlige (4 brukere)         |
| [ ] Nyansatte 2026 (8 brukere)         |
|                                        |
| Eller velg enkeltbrukere:              |
| [Søk bruker...]                        |
+----------------------------------------+
| Frist: [15. februar 2026]              |
+----------------------------------------+
| [ ] Bruk BCC (skjul mottakere for      |
|     hverandre)                         |
+----------------------------------------+
| Valgt: 16 mottakere                    |
|                                        |
| [Forhåndsvis e-post]  [Åpne e-post]    |
+----------------------------------------+
```

### E-post Integrasjon (mailto)

```typescript
// src/lib/email.ts
interface EmailOptions {
  recipients: string[];
  subject: string;
  body: string;
  useBcc?: boolean;
}

export function openEmailClient({ recipients, subject, body, useBcc = false }: EmailOptions) {
  const to = useBcc ? '' : recipients.join(',');
  const bcc = useBcc ? recipients.join(',') : '';
  
  const params = new URLSearchParams();
  params.set('subject', subject);
  params.set('body', body);
  if (useBcc && bcc) params.set('bcc', bcc);
  
  const mailtoUrl = `mailto:${to}?${params.toString()}`;
  window.location.href = mailtoUrl;
}
```

### UI-komponenter

| Komponent | Beskrivelse |
|-----------|-------------|
| `GroupSelector` | Multi-select av grupper med brukerantall |
| `UserSelector` | Søk og velg enkeltbrukere |
| `EmailPreview` | Forhåndsvisning av e-posttekst |
| `SendInvitation` | Hovedkomponent med BCC-valg |

---

## Del 4: HSQ/Admin Oversikt - Sporing per Lokasjon

### Ny Side: Training Overview (HSQ Dashboard)

```text
+----------------------------------------+
|  OPPLÆRINGSOVERSIKT                    |
+----------------------------------------+
| Site-filter: [Alle ▼] [SSJ ▼] [OSL ▼]  |
+----------------------------------------+

LOKASJONSSAMMENLIGNING
+------------+----------+----------+-------+
| Lokasjon   | Brukere  | Bestått  | Rate  |
+------------+----------+----------+-------+
| Hovedkontor| 45       | 42       | 93%   |
| SSJ        | 28       | 18       | 64% ⚠️|
| OSL        | 32       | 30       | 94%   |
+------------+----------+----------+-------+

IKKE FULLFØRT INNEN FRIST
+----------------------------------------+
| Bruker     | Kurs          | Frist    |
+----------------------------------------+
| Ola N.     | HMS Grunnkurs | 3 dager  |
| Kari S.    | Kranfører     | Utløpt!  |
+----------------------------------------+

MANGLER OBLIGATORISK OPPLÆRING (per rolle)
+----------------------------------------+
| Bruker     | Rolle      | Mangler       |
+----------------------------------------+
| Per H.     | Kranfører  | Kranførerbevis|
| Lise A.    | Operator   | HMS Basis     |
+----------------------------------------+
```

### Sporing av Rolle-compliance

```typescript
// Sjekk om bruker har riktige kurs for sin rolle
interface RoleComplianceCheck {
  userId: string;
  userName: string;
  role: string;
  siteName: string;
  requiredCourses: string[];
  completedCourses: string[];
  missingCourses: string[];
  isCompliant: boolean;
}
```

---

## Del 5: Navigasjonsstruktur

### For Brukere

```text
Dashboard
Prosedyrer (referansedokumenter)
Opplæring
├── Aktive kurs (mine tildelinger)
└── Min opplæringshistorikk (bestått)
Min profil
```

### For Supervisors/HSQ

```text
Administrasjon
├── Prosedyrer
├── Opplæring
│   ├── Kurs (opprett/rediger)
│   ├── Grupper (brukergruppeadmin)
│   ├── Utsendelser (send invitasjoner)
│   └── Oversikt (HSQ dashboard)
├── Rapporter
└── ...
```

---

## Del 6: Filendringer

### Nye Filer

| Fil | Beskrivelse |
|-----|-------------|
| `supabase/migrations/xxx_training_module.sql` | Database-tabeller |
| `src/lib/email.ts` | mailto-hjelpefunksjoner |
| **Sider** | |
| `src/pages/training/Training.tsx` | Mine aktive kurs |
| `src/pages/training/TrainingViewer.tsx` | Gjennomføring av kurs |
| `src/pages/training/TrainingHistory.tsx` | Min opplæringshistorikk |
| `src/pages/training/ManageTraining.tsx` | Administrer kurs |
| `src/pages/training/TrainingEditor.tsx` | Opprett/rediger kurs |
| `src/pages/training/TrainingGroups.tsx` | Gruppehåndtering |
| `src/pages/training/TrainingAssignments.tsx` | Utsendelse |
| `src/pages/training/TrainingOverview.tsx` | HSQ dashboard per site |
| **Komponenter** | |
| `src/components/training/GroupSelector.tsx` | Velg grupper |
| `src/components/training/UserSelector.tsx` | Velg brukere |
| `src/components/training/EmailComposer.tsx` | E-post utsendelse med BCC |
| `src/components/training/ProcedureSelector.tsx` | Koble kurs til prosedyrer |
| `src/components/training/RoleComplianceTable.tsx` | Manglende kurs per rolle |
| `src/components/training/SiteComparisonChart.tsx` | Sammenlign lokasjoner |
| **Hooks** | |
| `src/hooks/useTraining.ts` | Kurs-operasjoner |
| `src/hooks/useTrainingGroups.ts` | Gruppehåndtering |
| `src/hooks/useTrainingAssignments.ts` | Tildelinger |
| `src/hooks/useTrainingOverview.ts` | HSQ-statistikk per site |
| `src/hooks/useRoleCompliance.ts` | Rolle-compliance sjekk |

### Oppdaterte Filer

| Fil | Endring |
|-----|---------|
| `src/pages/Certificates.tsx` | Rename + terminologi → TrainingHistory |
| `src/components/layout/Sidebar.tsx` | Ny Opplæring-seksjon |
| `src/components/layout/MobileNav.tsx` | Oppdater navigasjon |
| `src/App.tsx` | Nye ruter |
| `src/hooks/useGovernanceStats.ts` | Utvid med opplæringsdata |

---

## Del 7: Tekniske Detaljer

### EmailComposer med BCC

```typescript
// src/components/training/EmailComposer.tsx
interface EmailComposerProps {
  course: TrainingCourse;
  selectedGroups: TrainingGroup[];
  selectedUsers: User[];
  dueDate?: Date;
}

export function EmailComposer({ 
  course, 
  selectedGroups, 
  selectedUsers, 
  dueDate 
}: EmailComposerProps) {
  const [useBcc, setUseBcc] = useState(false);
  
  // Samle alle e-poster fra grupper og enkeltbrukere
  const allRecipients = useMemo(() => {
    const fromGroups = selectedGroups.flatMap(g => g.members.map(m => m.email));
    const fromUsers = selectedUsers.map(u => u.email);
    return [...new Set([...fromGroups, ...fromUsers])];
  }, [selectedGroups, selectedUsers]);

  const subject = `Opplæring: ${course.title}`;
  const body = `Hei,\n\n` +
    `Du er tildelt opplæringen "${course.title}".\n\n` +
    (dueDate ? `Frist: ${format(dueDate, 'PPP', { locale: nb })}\n\n` : '') +
    `Logg inn for å starte: ${window.location.origin}/training\n\n` +
    `Med vennlig hilsen,\nASCO`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Send invitasjon</CardTitle>
        <CardDescription>
          {allRecipients.length} mottakere valgt
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mottakerliste */}
        <div className="rounded-lg border p-3 max-h-32 overflow-y-auto">
          <p className="text-sm text-muted-foreground">
            {allRecipients.slice(0, 5).join(', ')}
            {allRecipients.length > 5 && ` +${allRecipients.length - 5} flere`}
          </p>
        </div>

        {/* BCC-valg */}
        <div className="flex items-center gap-3 p-3 border rounded-lg">
          <Checkbox
            checked={useBcc}
            onCheckedChange={setUseBcc}
            id="use-bcc"
          />
          <div>
            <label htmlFor="use-bcc" className="font-medium cursor-pointer">
              Bruk BCC
            </label>
            <p className="text-sm text-muted-foreground">
              Mottakere ser ikke hverandres e-postadresser
            </p>
          </div>
        </div>

        {/* Forhåndsvisning */}
        <div className="rounded-lg border p-4 bg-muted/50">
          <p className="text-sm font-medium mb-2">Emne: {subject}</p>
          <pre className="text-sm whitespace-pre-wrap">{body}</pre>
        </div>

        <Button 
          className="w-full" 
          onClick={() => openEmailClient({
            recipients: allRecipients,
            subject,
            body,
            useBcc,
          })}
        >
          <Mail className="mr-2 h-4 w-4" />
          Åpne e-postklient
        </Button>
      </CardContent>
    </Card>
  );
}
```

### HSQ Oversikt Hook (per lokasjon)

```typescript
// src/hooks/useTrainingOverview.ts
export function useTrainingOverview() {
  return useQuery({
    queryKey: ['training_overview'],
    queryFn: async () => {
      // Hent alle sites
      const { data: sites } = await supabase.from('sites').select('*');
      
      // For hver site: beregn statistikk
      const siteStats = await Promise.all(sites.map(async (site) => {
        // Brukere på siten
        const { data: users } = await supabase
          .from('user_site_assignments')
          .select('user_id, profiles(full_name)')
          .eq('site_id', site.id);
        
        // Tildelinger og fullføringer
        const { data: assignments } = await supabase
          .from('training_assignments')
          .select('*, course:training_courses(site_id)')
          .eq('course.site_id', site.id);
        
        const totalUsers = users?.length || 0;
        const passed = assignments?.filter(a => a.passed).length || 0;
        
        return {
          siteId: site.id,
          siteName: site.name,
          totalUsers,
          passedCount: passed,
          completionRate: totalUsers > 0 ? Math.round((passed / totalUsers) * 100) : 0,
        };
      }));

      return { siteStats };
    },
  });
}
```

### Rolle-compliance Hook

```typescript
// src/hooks/useRoleCompliance.ts
export function useRoleCompliance(siteId?: string) {
  return useQuery({
    queryKey: ['role_compliance', siteId],
    queryFn: async () => {
      // Hent brukere med roller
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('user_id, role, site_id, profiles(full_name)')
        .eq(siteId ? 'site_id' : 'id', siteId || 'id');
      
      // Hent kurs med required_for_roles
      const { data: courses } = await supabase
        .from('training_courses')
        .select('id, title, required_for_roles')
        .eq('status', 'published');
      
      // Hent fullføringer
      const { data: completions } = await supabase
        .from('training_assignments')
        .select('user_id, course_id')
        .eq('passed', true);
      
      // Beregn manglende kurs per bruker
      const compliance = userRoles?.map(ur => {
        const requiredCourses = courses?.filter(c => 
          c.required_for_roles?.includes(ur.role)
        ) || [];
        
        const completedCourseIds = completions
          ?.filter(c => c.user_id === ur.user_id)
          .map(c => c.course_id) || [];
        
        const missingCourses = requiredCourses.filter(c => 
          !completedCourseIds.includes(c.id)
        );
        
        return {
          userId: ur.user_id,
          userName: ur.profiles?.full_name,
          role: ur.role,
          requiredCourses: requiredCourses.map(c => c.title),
          completedCourses: requiredCourses
            .filter(c => completedCourseIds.includes(c.id))
            .map(c => c.title),
          missingCourses: missingCourses.map(c => c.title),
          isCompliant: missingCourses.length === 0,
        };
      });
      
      return compliance?.filter(c => !c.isCompliant) || [];
    },
    enabled: true,
  });
}
```

---

## Del 8: Implementeringsrekkefølge

1. **Database-migrering** - Opplæringstabeller
2. **E-post hjelpefunksjoner** - mailto med BCC-støtte
3. **Gruppehåndtering** - UI for grupper
4. **Kurseditor** - Med prosedyre-kobling og rolle-krav
5. **Utsendelse** - Gruppevalg og e-post
6. **Bruker-side** - Aktive kurs og historikk
7. **HSQ Oversikt** - Site-sammenligning og compliance
8. **Terminologi** - Oppdater eksisterende sider
9. **Navigasjon** - Sidebar og ruter

---

## Resultat Etter Implementering

- Tydelig skille mellom prosedyrer (referanse) og opplæring (aktiv læring)
- Kurs alltid koblet til underliggende prosedyrer
- Enkel kursinvitasjon via lokal e-post med gruppevalg
- BCC-støtte for sensitiv utsendelse
- HSQ-oversikt for sammenligning av lokasjoner
- Sporing av hvem som mangler obligatorisk opplæring per rolle
- Varsling om utløpte frister
- Terminologi: "Bestått" i stedet for "Sertifikat" (kursbevis utsettes)

