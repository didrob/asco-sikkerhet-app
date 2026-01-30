

# Komplett Brukeradministrasjon og Header-oppdatering

## Oversikt

Denne planen dekker to hovedområder:
1. **Flytte "Min profil" til header** med bruker-dropdown
2. **Avansert brukeradministrasjon** med manuell oppretting, Excel-import og tilgangsforespørsler

---

## Del A: Profil i Header med Dropdown

### Nåværende struktur

```text
HEADER: [Logo] ... [Brukernavn] [👤-ikon] [🌙] [🚪]

SIDEBAR: Dashboard
         Min profil  ← Fjernes herfra
         ...
```

### Ny struktur

```text
HEADER: [Logo] ... [Brukernavn] [ON ▼] [🌙]
                                  │
                                  ▼
                           +---------------+
                           | 👤 Min profil |
                           |---------------|
                           | 🚪 Logg ut    |
                           +---------------+

SIDEBAR: Dashboard  ← "Min profil" fjernet
         ...
```

### Endringer

| Fil | Endring |
|-----|---------|
| `AppHeader.tsx` | DropdownMenu med initialer, profil-lenke og logg ut |
| `Sidebar.tsx` | Fjern "Min profil" lenke |
| `MobileNav.tsx` | Fjern "Min profil" lenke |

---

## Del B: Avansert Brukeradministrasjon

### B1. Ny Database-struktur

```sql
-- Tilgangsforespørsler (når brukere ber om tilgang)
CREATE TABLE public.access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  full_name TEXT,
  company TEXT,
  request_type TEXT DEFAULT 'new_user',  -- 'new_user' | 'password_reset'
  status TEXT DEFAULT 'pending',          -- 'pending' | 'approved' | 'rejected'
  requested_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ,
  processed_by UUID,
  notes TEXT
);

-- Brukerinvitasjoner (med midlertidig passord)
CREATE TABLE public.user_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  temporary_password TEXT NOT NULL,
  invited_by UUID,
  invited_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,  -- Default 7 dager
  activated_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending',    -- 'pending' | 'activated' | 'expired'
  site_id UUID REFERENCES sites(id)
);
```

### B2. Edge Function for Brukeroppretting

```typescript
// supabase/functions/create-user/index.ts
// Bruker SUPABASE_SERVICE_ROLE_KEY for å opprette auth-brukere
// Validerer at kaller er admin via JWT
```

### B3. Ny AdminUsers-side med Tabs

```text
+-----------------------------------------------------------+
| Brukere                                                   |
| Administrer brukere og tilgangsforespørsler               |
+-----------------------------------------------------------+
| [+ Opprett bruker]  [📥 Importer Excel]  [📤 Last ned mal] |
+-----------------------------------------------------------+

[Alle brukere (45)] [Tilgangsforespørsler (3)] [Ventende (2)]

TAB: TILGANGSFORESPØRSLER
+----------------------------------------------------------------+
| [Alle] [Nye brukere] [Passord-reset]                           |
+----------------------------------------------------------------+
| 🔑 Navn         | E-post           | Type       | Handlinger   |
| ola.nordmann    | ola@firma.no     | Ny bruker  | [✓] [✗]      |
+----------------------------------------------------------------+
```

### B4. Auth-side Endringer

Erstatter "Registrer"-tab med "Be om tilgang":

```text
+-----------------------------------+
| Logg inn                          |
+-----------------------------------+
| E-post: [____________]            |
| Passord: [____________]           |
| [Logg inn]                        |
+-----------------------------------+
| Har du ikke tilgang?              |
| [Be om tilgang]  ← Ny knapp       |
+-----------------------------------+
```

---

## Del C: E-post via Outlook (mailto)

Alle e-poster åpnes i brukerens e-postklient - ingen automatisk utsending:

```typescript
// Nye e-postmaler i email.ts:
generateNewUserEmail(name, email, tempPassword, expiresAt, loginUrl)
generatePasswordResetEmail(name, email, newPassword, expiresAt, loginUrl)
generateBulkImportEmail(users[], loginUrl)
```

---

## Nye Filer

| Fil | Beskrivelse |
|-----|-------------|
| **Database** | |
| `supabase/migrations/xxx_access_requests.sql` | Nye tabeller med RLS |
| **Edge Function** | |
| `supabase/functions/create-user/index.ts` | Brukeroppretting med service role |
| **Hooks** | |
| `src/hooks/useAccessRequests.ts` | CRUD for tilgangsforespørsler |
| `src/hooks/useUserInvitations.ts` | CRUD for invitasjoner |
| **Komponenter** | |
| `src/components/admin/CreateUserDialog.tsx` | Manuell brukeroppretting |
| `src/components/admin/ExcelImportDialog.tsx` | Excel-import med forhåndsvisning |
| `src/components/admin/AccessRequestsTable.tsx` | Tabell for forespørsler |
| `src/components/admin/ApproveRequestDialog.tsx` | Godkjenningsdialog med passord |
| `src/components/admin/InvitationsTable.tsx` | Ventende invitasjoner |
| **Hjelpefunksjoner** | |
| `src/lib/password-generator.ts` | Sikker passordgenerering |
| `src/lib/excel-utils.ts` | Excel parsing og mal-generering |

### Oppdaterte Filer

| Fil | Endring |
|-----|---------|
| `AppHeader.tsx` | Dropdown med profil og logg ut |
| `Sidebar.tsx` | Fjern "Min profil" |
| `MobileNav.tsx` | Fjern "Min profil" |
| `AdminUsers.tsx` | Tabs, KPI-kort, handlingsknapper |
| `Auth.tsx` | "Be om tilgang" i stedet for registrering |
| `email.ts` | Nye e-postmaler for brukere |

---

## Teknisk Implementering

### Passordgenerator

```typescript
// src/lib/password-generator.ts
const LOWERCASE = 'abcdefghijkmnopqrstuvwxyz';  // Uten l
const UPPERCASE = 'ABCDEFGHJKLMNPQRSTUVWXYZ';   // Uten I, O
const NUMBERS = '23456789';                      // Uten 0, 1
const SPECIAL = '!@#$%&*';

export function generateSecurePassword(length = 12): string {
  // Sørger for minst én av hver type
  // Shuffler resultatet
}
```

### Excel-utils

```typescript
// src/lib/excel-utils.ts
export function parseExcelFile(file: File): Promise<ImportUser[]>
export function generateExcelTemplate(): Blob
export function downloadExcelTemplate(): void
```

### CreateUserDialog

```typescript
function CreateUserDialog() {
  // 1. Fylle inn e-post, navn
  // 2. Velge site
  // 3. Generere midlertidig passord
  // 4. Sette utløpsdato (default 7 dager)
  // 5. Klikk "Opprett og send e-post"
  // 6. Edge function oppretter bruker
  // 7. mailto: åpner Outlook med ferdig e-post
}
```

### Header Dropdown

```typescript
function AppHeader() {
  const initials = getInitials(displayName);
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
          {initials}
        </div>
        <ChevronDown />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem asChild>
          <Link to="/profile">Min profil</Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={signOut}>
          Logg ut
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

---

## Arbeidsflyt: Ny Bruker

```text
1. Admin klikker "Opprett bruker"
2. Fyller inn e-post, navn, velger site
3. Midlertidig passord genereres automatisk
4. Utløpsdato settes (default 7 dager)
5. Admin klikker "Opprett og send e-post"
6. Edge function oppretter bruker i Supabase Auth
7. Invitation lagres i user_invitations
8. Outlook åpnes med ferdig utfylt e-post
9. Admin sender e-posten manuelt
10. Bruker mottar e-post, logger inn, bytter passord
```

## Arbeidsflyt: Be om Tilgang

```text
1. Ny person går til innloggingssiden
2. Klikker "Be om tilgang"
3. Fyller inn e-post, navn, firma
4. Forespørsel lagres i access_requests
5. Admin ser forespørselen i listen
6. Admin klikker "Godkjenn"
7. Dialog åpnes med generert passord og site-valg
8. Admin bekrefter - bruker opprettes
9. Outlook åpnes med velkomst-e-post
```

## Arbeidsflyt: Excel-import

```text
1. Admin laster ned Excel-mal
2. Fyller inn brukere (e-post, navn, avdeling, stilling)
3. Laster opp filen
4. Forhåndsvisning vises med validering
5. Admin velger site og utløpsdato
6. Admin bekrefter import
7. Alle brukere opprettes sekvensielt
8. Samlet e-post genereres med alle brukere
9. Outlook åpnes - admin sender e-posten
```

---

## Implementeringsrekkefølge

1. **Header-oppdatering** - Dropdown med profil, fjern fra sidebar
2. **Database-migrering** - access_requests og user_invitations
3. **Edge Function** - create-user for admin-oppretting
4. **Hjelpefunksjoner** - password-generator, excel-utils, email-maler
5. **Hooks** - useAccessRequests, useUserInvitations
6. **Komponenter** - CreateUserDialog, AccessRequestsTable, ExcelImportDialog
7. **AdminUsers.tsx** - Ny tabs-struktur med alle funksjoner
8. **Auth.tsx** - "Be om tilgang" erstatter registrering

---

## Sikkerhet

- Edge function validerer at kaller er admin via JWT
- Midlertidige passord hastes aldri - kun vist én gang
- Invitasjoner utløper automatisk
- RLS policies beskytter alle tabeller
- Ingen automatisk e-postutsending - unngår spam-filter

---

## Resultat

- **Profil i header** med dropdown-meny og initialer
- **Manuell brukeroppretting** med midlertidig passord
- **Excel-import** for bulk-oppretting
- **Tilgangsforespørsler** fra nye brukere
- **E-post via Outlook** - ingen spam-problemer
- **Passord-utløp** for sikkerhet
- **Ingen selvregistrering** - kun admin kan gi tilgang

