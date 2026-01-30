# ASCO Sikkerhet App - Systemoversikt

## 📋 Innholdsfortegnelse

1. [Systemformål](#systemformål)
2. [Teknologistakk](#teknologistakk)
3. [Moduler og Funksjoner](#moduler-og-funksjoner)
4. [Ruter og Sider](#ruter-og-sider)
5. [Databaseskjema](#databaseskjema)
6. [Komponenter](#komponenter)
7. [Hooks og Datahåndtering](#hooks-og-datahåndtering)
8. [Sikkerhet og Tilgangskontroll](#sikkerhet-og-tilgangskontroll)
9. [Integrasjoner](#integrasjoner)
10. [Utviklingsguide](#utviklingsguide)

---

## Systemformål

**ASCO Sikkerhet** er en enterprise-basert **sikkerhets- og compliance-håndteringsplattform** designet for å administrere sikkerhetsprosedyrer, opplæring og sertifiseringer på tvers av flere anlegg i en organisasjon.

### Hovedfunksjoner
- ✅ **Rollebasert tilgangskontroll** - Ulike brukerroller (admin, supervisor, viewer, eksterne klienter, revisorer)
- 📋 **Prosedyrehåndtering** - Opprett, rediger, spor og fullfør sikkerhetsprosedyrer
- 🎓 **Opplæringshåndtering** - Tildel kurs, spor gjennomføring, administrer opplæringsgrupper
- 📜 **Compliance-sporing** - Administrer sertifikater og revisjonsprosedyrer
- 🔍 **Governance og revisjon** - Oppretthold compliance-poster og revisjonsspor
- 🏢 **Multi-anleggsstøtte** - Fungerer på tvers av flere organisasjonslokasjoner

---

## Teknologistakk

### Frontend
| Teknologi | Versjon | Formål |
|-----------|---------|--------|
| React | 18.3.1 | UI-rammeverk |
| TypeScript | 5.8.3 | Type-sikkerhet |
| Vite | 5.4.19 | Build-verktøy og dev-server |
| React Router | 6.30.1 | Ruting |
| Tailwind CSS | 3.4.17 | Styling |
| shadcn-ui | - | UI-komponentbibliotek |
| React Hook Form | 7.61.1 | Formhåndtering |
| Zod | 3.25.76 | Skjemavalidering |
| TanStack React Query | 5.83.0 | Data-fetching og caching |

### Backend og Database
- **Supabase** (PostgreSQL + Autentisering)
- **Row-Level Security (RLS)** policies
- Custom SQL-migrasjoner

### Tilleggsbiblioteker
- **jsPDF** - PDF-generering
- **docx** - Word-dokumentgenerering  
- **xlsx** - Excel import/eksport
- **Recharts** - Datavisualisering
- **qrcode.react** - QR-kodegenerering
- **sonner** - Toast-notifikasjoner
- **next-themes** - Temahåndtering

---

## Moduler og Funksjoner

### 1. Autentisering og Autorisering

**Fil**: `src/contexts/AuthContext.tsx`, `src/contexts/SiteContext.tsx`

**Funksjoner**:
- Brukerautentisering via Supabase (e-post/passord)
- Sesjonshåndtering med automatisk token-oppdatering
- Rollebasert tilgangskontroll
- Multi-anleggstilgang per bruker
- Beskyttede ruter basert på brukerroller

**Roller**:
- `admin` - Full systemtilgang
- `supervisor` - Kan administrere prosedyrer og opplæring
- `viewer` - Kun lesetilgang
- `external_client` - Governance-visning
- `auditor` - Governance og revisjon

---

### 2. Prosedyremodul

**Filer**: `src/pages/Procedures.tsx`, `src/pages/ProcedureViewer.tsx`, `src/pages/ProcedureEditor.tsx`, `src/pages/ManageProcedures.tsx`, `src/hooks/useProcedure*.ts`

**Funksjoner**:
- ✏️ **CRUD-operasjoner** - Opprett, les, oppdater og slett prosedyrer
- 📊 **Versjonshistorikk** - Spor alle endringer med revisjonssystem
- 📎 **Vedlegg** - Last opp og håndter filer knyttet til prosedyrer
- 💬 **Kommentarer** - Diskusjoner og notater på prosedyrer
- ✅ **Fullføring** - Spor hvem som har fullført prosedyren
- 👁️ **Visningssporing** - Logg hvem som har sett prosedyren
- 📈 **Fremdriftssporing** - Følg med på brukerfremdrift
- 📄 **Eksport** - PDF og Word-eksport av prosedyrer
- 🔍 **Søk og filter** - Avanserte søkefunksjoner

**Databasetabeller**:
- `procedures` - Hovedtabell for prosedyrer
- `procedure_completions` - Fullføringsposter
- `procedure_views` - Visningssporing
- `procedure_progress` - Fremdriftssporing
- `procedure_revisions` - Versjonshistorikk
- `procedure_attachments` - Vedlegg
- `procedure_comments` - Kommentarer

---

### 3. Opplæringsmodul

**Filer**: `src/pages/training/Training.tsx`, `src/pages/training/ManageTraining.tsx`, `src/pages/training/TrainingGroups.tsx`, `src/pages/training/TrainingOverview.tsx`, `src/hooks/useTraining*.ts`

**Funksjoner**:
- 📚 **Kurshåndtering** - Opprett og administrer opplæringskurs
- 👥 **Gruppehåndtering** - Organiser brukere i opplæringsgrupper
- 📋 **Tilordning** - Tildel kurs til brukere eller grupper
- 📊 **Fremdriftssporing** - Følg med på kursfremdrift
- ✅ **Quiz/Vurdering** - Quiz-forsøk og resultater
- 🔔 **Påminnelser** - E-postpåminnelser for opplæring
- 🎓 **Sertifikater** - Generer fullføringssertifikater
- 📧 **E-postvarslinger** - Automatiske e-postvarsler
- 📈 **Statistikk** - Oversikt over opplæringsstatus

**Databasetabeller**:
- `training_courses` - Kursdefinisjoner
- `training_assignments` - Bruker-kurstilordninger
- `training_groups` - Opplæringsgrupper
- `training_group_members` - Gruppemedlemskap
- `training_progress` - Kursfremdrift
- `training_reminders` - Påminnelsessporing
- `quiz_attempts` - Quiz-resultater

---

### 4. Sertifikater og Verifisering

**Filer**: `src/pages/Certificates.tsx`, `src/pages/CertificateViewer.tsx`, `src/pages/VerifyCertificate.tsx`

**Funksjoner**:
- 🎓 **Sertifikatgenerering** - Automatisk generering ved fullføring
- ✅ **Offentlig verifisering** - Verifiser ekthet via `/verify/:id`
- 📅 **Gyldighetssporing** - Overvåk utløpsdatoer
- 📜 **Revisjonsspor** - Full historikk for hvert sertifikat

**Databasetabeller**:
- Benytter `training_progress` og `procedure_completions`
- Revisjonsspor i `audit_log`

---

### 5. Multi-anleggshåndtering

**Filer**: `src/contexts/SiteContext.tsx`, `src/pages/admin/Sites.tsx`

**Funksjoner**:
- 🏢 **Anleggsadministrasjon** - Opprett og administrer anlegg
- 👤 **Bruker-anleggstilordning** - Tildel brukere til anlegg
- 🔒 **Anleggsisolasjon** - Brukere ser kun data fra sine anlegg
- 🔄 **Anleggsvelger** - Bytt mellom anlegg i brukergrensesnittet

**Databasetabeller**:
- `sites` - Anleggsdefinisjoner
- `user_site_assignments` - Bruker-anleggstilknytninger

---

### 6. Admin og Governance

**Filer**: `src/pages/admin/*.tsx`, `src/pages/Governance*.tsx`

**Funksjoner**:
- 👥 **Brukerhåndtering** - Opprett, rediger, tildel roller og anlegg
- 📥 **Bulkimport** - Excel-basert import av brukere
- 🔑 **Rollehåndtering** - Administrer brukerroller
- ⚙️ **Innstillinger** - Systemkonfigurasjon
- 📊 **Rapporter** - Generer compliance-rapporter
- 🔍 **Revisjonslogging** - Alle handlinger logges
- 📋 **Tilgangsforespørsler** - Godkjenn/avvis tilgangsforespørsler
- 🌐 **Governance-visning** - Spesialvisning for revisorer og eksterne klienter

**Databasetabeller**:
- `profiles` - Brukerprofildata
- `user_roles` - Rolletilordninger
- `audit_log` - Revisjonslogg
- `access_requests` - Tilgangsforespørsler
- `user_invitations` - Brukerinvitasjoner
- `ai_access` - AI-funksjonstilganger

---

### 7. Revisjon og Compliance

**Filer**: `src/pages/governance/GovernanceDashboard.tsx`, `src/pages/governance/AuditDeepDive.tsx`, `src/pages/governance/GovernanceCertificates.tsx`, `src/pages/admin/AdminAuditLog.tsx`

**Funksjoner**:
- 📋 **Revisjonslogg** - Omfattende logg av alle handlinger
- 📊 **Brukerstatistikk** - Aktivitet og fullføringsrater
- 🔍 **Governance-dashbord** - Oversikt for revisorer
- 📈 **Dyp revisjon** - Detaljert revisjonsanalyse
- 📤 **Eksport** - Eksporter revisjonsdata

**Databasetabeller**:
- `audit_log` - Hovedtabell for revisjonsspor
- Statistikk genereres fra alle tabeller

---

## Ruter og Sider

### Offentlige Ruter
| Rute | Komponent | Beskrivelse |
|------|-----------|-------------|
| `/auth` | `Auth.tsx` | Innlogging og registrering |
| `/verify/:id` | `VerifyCertificate.tsx` | Verifiser sertifikat (offentlig) |

### Beskyttede Ruter

#### Dashboard
| Rute | Komponent | Tilgang |
|------|-----------|---------|
| `/` | `Index.tsx` | Alle innloggede brukere |
| `/profile` | `Profile.tsx` | Alle innloggede brukere |

#### Prosedyrer
| Rute | Komponent | Tilgang |
|------|-----------|---------|
| `/procedures` | `Procedures.tsx` | Alle |
| `/procedures/new` | `ProcedureEditor.tsx` | Supervisor+ |
| `/procedures/manage` | `ManageProcedures.tsx` | Supervisor+ |
| `/procedures/:id` | `ProcedureViewer.tsx` | Alle |
| `/procedures/:id/edit` | `ProcedureEditor.tsx` | Supervisor+ |

#### Opplæring
| Rute | Komponent | Tilgang |
|------|-----------|---------|
| `/training` | `Training.tsx` | Alle |
| `/training/history` | `TrainingHistory.tsx` | Alle |
| `/training/manage` | `ManageTraining.tsx` | Supervisor+ |
| `/training/groups` | `TrainingGroups.tsx` | Supervisor+ |
| `/training/overview` | `TrainingOverview.tsx` | Supervisor+ |

#### Sertifikater
| Rute | Komponent | Tilgang |
|------|-----------|---------|
| `/certificates` | `Certificates.tsx` | Alle |
| `/certificates/:id` | `CertificateViewer.tsx` | Alle |

#### Admin
| Rute | Komponent | Tilgang |
|------|-----------|---------|
| `/admin/sites` | `AdminSites.tsx` | Admin |
| `/admin/users` | `AdminUsers.tsx` | Admin |
| `/admin/roles` | `AdminRoles.tsx` | Admin |
| `/admin/settings` | `AdminSettings.tsx` | Admin |
| `/admin/reports` | `AdminReports.tsx` | Admin |
| `/admin/audit` | `AdminAuditLog.tsx` | Admin |

#### System
| Rute | Komponent | Tilgang |
|------|-----------|---------|
| `/system/stats` | `UserStats.tsx` | Admin |
| `/system/ai` | `AIAccess.tsx` | Admin |

#### Governance
| Rute | Komponent | Tilgang |
|------|-----------|---------|
| `/governance` | `GovernanceDashboard.tsx` | Governance-roller |
| `/governance/audit` | `AuditDeepDive.tsx` | Governance-roller |
| `/governance/certificates` | `GovernanceCertificates.tsx` | Governance-roller |

---

## Databaseskjema

### Totalt: 25 Tabeller + Visninger + Funksjoner

#### Kjernetabeller
```sql
-- Brukere og autentisering
profiles                    -- Brukerprofildata
user_roles                  -- Rolletilordninger
user_site_assignments       -- Anleggstilknytninger
sites                       -- Organisasjonsanlegg

-- Prosedyrer
procedures                  -- Sikkerhetsprosedyrer
procedure_completions       -- Fullføringsposter
procedure_views             -- Visningssporing
procedure_progress          -- Fremdriftssporing
procedure_revisions         -- Versjonshistorikk
procedure_attachments       -- Vedlegg
procedure_comments          -- Kommentarer

-- Opplæring
training_courses            -- Kursdefinisjoner
training_assignments        -- Kurstilordninger
training_groups             -- Opplæringsgrupper
training_group_members      -- Gruppemedlemskap
training_progress           -- Kursfremdrift
training_reminders          -- Påminnelser
quiz_attempts               -- Quiz-forsøk

-- Governance og Admin
audit_log                   -- Revisjonslogg
access_requests             -- Tilgangsforespørsler
user_invitations            -- Invitasjoner
ai_access                   -- AI-tilganger
```

#### Database-visninger
```sql
user_invitations_safe       -- Sikker visning av invitasjoner
```

#### Database-funksjoner
```sql
can_manage_procedures()     -- Sjekk om bruker kan administrere prosedyrer
has_role(role_name)         -- Sjekk om bruker har spesifikk rolle
has_site_access(site_id)    -- Sjekk om bruker har tilgang til anlegg
```

---

## Komponenter

### Layout-komponenter
- **AppLayout** - Hovedlayout med navigasjon og header

### Dashboard-komponenter
- **DashboardHeader** - Overskrift med statistikk
- **StatCardWithTrend** - Statistikkort med trendindikator
- **ActivityChart** - Aktivitetsdiagram
- **StatusPieChart** - Statusfordeling (sektordiagram)
- **TopProceduresChart** - Mest brukte prosedyrer
- **ProcedureList** - Liste over prosedyrer
- **AdminDashboardCards** - Admin-dashbordkort
- **SupervisorDashboardCards** - Supervisor-dashbordkort
- **UpcomingDeadlines** - Kommende frister
- **SiteSelector** - Anleggsvelger

### Prosedyre-komponenter
- **ProcedureList** - Prosedyreliste med søk og filter
- **ProcedureStatsCards** - Statistikkort for prosedyrer
- **AttachmentsSection** - Vedleggshåndtering
- **CommentsPanel** - Kommentarseksjon
- **RevisionHistory** - Versjonshistorikk
- **MetadataSection** - Metadata-visning
- **SignatureDialog** - Signeringsdialog
- **ExportMenu** - Eksportmeny (PDF/Word)

### Opplærings-komponenter
- **CourseDetailSheet** - Kursdetaljvisning
- **CourseStatsTable** - Statistikktabell
- **InProgressTable** - Pågående kurs
- **OverdueTable** - Forfalte kurs
- **EmailComposer** - E-postkomponering
- **ReminderDialog** - Påminnelsesdialog

### Admin-komponenter
- **CreateUserDialog** - Opprett bruker-dialog
- **ExcelImportDialog** - Excel-importdialog
- **AccessRequestsTable** - Tilgangsforespørsler-tabell
- **InvitationsTable** - Invitasjonstabell

### UI-komponenter (shadcn-ui)
Over 40+ gjenbrukbare UI-komponenter i `/src/components/ui/`:
- Button, Input, Select, Dialog, Table, Card, Badge
- Accordion, Alert, Avatar, Checkbox, Dropdown
- Og mange flere...

---

## Hooks og Datahåndtering

### 30+ Custom Hooks for datahåndtering

#### Bruker og Autentisering
```typescript
useProfile()                // Hent brukerprofil
useUpdateProfile()          // Oppdater profil
useUserRoles()              // Hent brukerroller
useRoleAccess()             // Sjekk rolletilgang
useAuth()                   // Autentiseringskontekst
useUserInvitations()        // Håndter invitasjoner
```

#### Prosedyrer
```typescript
useProcedures()             // Hent alle prosedyrer
useProcedure(id)            // Hent en prosedyre
useProcedureViews()         // Håndter visninger
useProcedureProgress()      // Fremdriftshåndtering
useProcedureRevisions()     // Versjonshistorikk
useProcedureAttachments()   // Vedleggshåndtering
useProcedureComments()      // Kommentarhåndtering
useProcedureMutations()     // CRUD-operasjoner
useProcedureOverview()      // Oversiktsdata
```

#### Opplæring
```typescript
useTraining()               // Hent kurs
useMyTrainingCourses()      // Mine kurs
useTrainingGroups()         // Opplæringsgrupper
useTrainingAssignments()    // Tilordninger
useTrainingReminders()      // Påminnelser
useTrainingOverview()       // Oversikt
useCompletions()            // Fullføringer
useCourseStats()            // Kursstatistikk
```

#### Admin
```typescript
useAdminUsers()             // Brukerhåndtering
useAdminSites()             // Anleggshåndtering
useAdminRoles()             // Rollehåndtering
useAccessRequests()         // Tilgangsforespørsler
```

#### System
```typescript
useAuditLog()               // Revisjonslogg
useUserStats()              // Brukerstatistikk
useGovernanceStats()        // Governance-statistikk
useAIAccess()               // AI-tilgangshåndtering
```

#### Andre
```typescript
useSites()                  // Hent anlegg
useSiteContext()            // Anleggskontekst
useReportData()             // Rapportdata
```

---

## Sikkerhet og Tilgangskontroll

### Sikkerhetslag

#### 1. Frontend-beskyttelse
- **Beskyttede ruter** - Krever autentisering
- **Rollebasert visning** - Komponenter vises basert på rolle
- **Kontekstbasert tilgang** - AuthContext og SiteContext

#### 2. Backend-beskyttelse (Supabase RLS)
- **Row-Level Security (RLS)** - Alle tabeller har RLS-policies
- **Rollebaserte policies** - Tilgang basert på brukerrolle
- **Anleggsisolasjon** - Data isoleres per anlegg

#### 3. Revisjonslogging
- **Alle handlinger logges** - Komplett revisjonsspor
- **Metadata** - Bruker, IP, timestamp, handling
- **Uforanderlig** - Kan ikke slettes eller endres

### Roller og Tilganger

| Rolle | Tilgang |
|-------|---------|
| **admin** | Full systemtilgang, alle funksjoner |
| **supervisor** | Administrer prosedyrer og opplæring |
| **viewer** | Kun lesetilgang til prosedyrer og opplæring |
| **external_client** | Governance-visning, begrenset tilgang |
| **auditor** | Governance og revisjon, lesetilgang |

---

## Integrasjoner

### Supabase-integrasjon
**Plassering**: `/src/integrations/supabase/`

- **Database-klient** - PostgreSQL-tilkobling
- **Autentisering** - E-post/passord-autentisering
- **RLS-policies** - Row-level security
- **Auto-genererte typer** - TypeScript-typer fra database
- **Real-time subscriptions** - Live dataopdateringer (valgfritt)

### Eksportfunksjoner
**Plassering**: `/src/lib/`

- **pdf-export.ts** - PDF-generering med jsPDF
- **word-export.ts** - Word-dokumentgenerering med docx
- **excel-utils.ts** - Excel import/eksport med xlsx
- **email.ts** - E-postfunksjonalitet
- **audit.ts** - Revisjonssporlogging

---

## Utviklingsguide

### Oppsett av utviklingsmiljø

```bash
# Klon repository
git clone <repository-url>
cd asco-sikkerhet-app

# Installer avhengigheter
npm install

# Konfigurer miljøvariabler
# Opprett .env-fil med Supabase-legitimasjon
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Start utviklingsserver
npm run dev

# Tilgjengelig på http://localhost:5173
```

### Tilgjengelige kommandoer

```bash
npm run dev          # Start utviklingsserver
npm run build        # Produksjonsbygg
npm run build:dev    # Utviklingsbygg
npm run preview      # Forhåndsvis produksjonsbygg
npm run lint         # Kjør ESLint
npm run test         # Kjør tester (Vitest)
npm run test:watch   # Kjør tester i watch-modus
```

### Mappestruktur

```
/src
├── /components          # Gjenbrukbare komponenter
│   ├── /ui             # shadcn-ui komponenter
│   ├── /dashboard      # Dashboard-komponenter
│   ├── /procedures     # Prosedyre-komponenter
│   ├── /training       # Opplærings-komponenter
│   └── /admin          # Admin-komponenter
├── /contexts           # React contexts (Auth, Site)
├── /hooks              # Custom hooks for datahåndtering
├── /integrations       # Eksterne integrasjoner (Supabase)
│   └── /supabase       # Supabase-klient og typer
├── /lib                # Hjelpefunksjoner og utilities
├── /pages              # Sider/ruter
│   ├── /admin          # Admin-sider
│   └── /governance     # Governance-sider
├── /assets             # Statiske ressurser
└── /test               # Testfiler
```

### Legge til ny funksjonalitet

#### 1. Ny modul/funksjon
1. Opprett database-tabeller og RLS-policies i Supabase
2. Generer TypeScript-typer (`npm run build` kjører type-generering)
3. Opprett custom hooks i `/src/hooks/`
4. Opprett komponenter i `/src/components/`
5. Opprett sider i `/src/pages/`
6. Legg til ruter i `/src/App.tsx`
7. Test funksjonaliteten

#### 2. Ny API-integrasjon
1. Opprett integrasjonsfil i `/src/integrations/`
2. Legg til nødvendige dependencies
3. Opprett hooks for datahåndtering
4. Integrer med eksisterende komponenter

#### 3. Ny UI-komponent
1. Bruk shadcn-ui CLI: `npx shadcn@latest add [component]`
2. Eller opprett egen komponent i `/src/components/`
3. Importer og bruk i sider

### Best Practices

- ✅ Bruk TypeScript strengt (alle typer må defineres)
- ✅ Bruk React Query for datahåndtering (caching, automatisk refetch)
- ✅ Følg eksisterende komponentstruktur
- ✅ Implementer RLS-policies for alle nye tabeller
- ✅ Logg alle viktige handlinger til `audit_log`
- ✅ Test grundig med ulike brukerroller
- ✅ Valider input med Zod-schemas
- ✅ Bruk Tailwind CSS for styling (unngå inline styles)
- ✅ Kommenter kompleks logikk
- ✅ Følg eksisterende navnekonvensjoner

### Feilsøking

**Problem**: "Supabase client not initialized"
- **Løsning**: Sjekk at `.env`-filen har korrekte Supabase-legitimasjoner

**Problem**: "RLS policy violation"
- **Løsning**: Sjekk at brukeren har riktig rolle og anleggstilgang

**Problem**: "Type errors"
- **Løsning**: Kjør `npm run build` for å regenerere Supabase-typer

**Problem**: "Hook dependency warnings"
- **Løsning**: Sjekk at alle dependencies er inkludert i `useEffect`/`useCallback` arrays

---

## Vedlegg

### Nyttige lenker
- [React-dokumentasjon](https://react.dev)
- [TypeScript-dokumentasjon](https://www.typescriptlang.org/docs)
- [Supabase-dokumentasjon](https://supabase.com/docs)
- [shadcn-ui-dokumentasjon](https://ui.shadcn.com)
- [TanStack Query-dokumentasjon](https://tanstack.com/query)

### Kontakt
For spørsmål eller problemer, se README.md eller kontakt utviklingsteamet.

---

**Sist oppdatert**: Januar 2026  
**Versjon**: 1.0.0
