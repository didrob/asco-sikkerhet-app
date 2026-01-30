

# Implementering Del 6 - RBAC UI, Media-opplasting og Varsler

## Oversikt
Denne fasen fokuserer på tre hovedområder:
1. Forbedret rollebasert tilgangskontroll i brukergrensesnittet
2. Bildeopplasting direkte i prosedyre-editoren
3. E-postvarsler for prosedyre-frister via Edge Function

---

## Del 1: Forbedret RBAC Hook

### Ny Hook: `src/hooks/useRoleAccess.ts`

En samlet hook som forenkler tilgangssjekker i hele applikasjonen:

| Tilgang | admin | supervisor | operator | viewer |
|---------|-------|------------|----------|--------|
| Se prosedyrer | Ja | Ja | Ja | Ja |
| Starte/fullføre prosedyrer | Ja | Ja | Ja | Nei |
| Administrere prosedyrer | Ja | Ja (egen site) | Nei | Nei |
| Se rapporter | Ja | Ja (egen site) | Nei | Nei |
| Administrere brukere | Ja | Nei | Nei | Nei |
| Administrere sites | Ja | Nei | Nei | Nei |
| Innstillinger | Ja | Nei | Nei | Nei |
| Roller (Governance) | Ja | Nei | Nei | Nei |

### Hook API

```typescript
interface RoleAccess {
  isLoading: boolean;
  isAdmin: boolean;
  isSupervisor: boolean;
  isOperator: boolean;
  isViewer: boolean;
  canExecuteProcedures: boolean;  // admin, supervisor, operator
  canManageProcedures: boolean;   // admin, supervisor
  canViewReports: boolean;        // admin, supervisor
  canManageUsers: boolean;        // admin
  canManageSites: boolean;        // admin
  canAccessSettings: boolean;     // admin
  canManageRoles: boolean;        // admin
}
```

---

## Del 2: Viewer-begrensninger i ProcedureViewer

### Endringer

Brukere med `viewer`-rolle skal:
- Kunne se prosedyre-innhold i lesemodus
- Ikke kunne klikke "Start prosedyre"
- Se en informasjonsmelding om at de kun har lesetilgang

### UI-endringer

```text
ProcedureViewer
├── [Eksisterende innhold]
├── Action buttons
│   ├── Hvis canExecuteProcedures: Vis "Start prosedyre"
│   └── Hvis viewer: Vis "Du har kun lesetilgang"
```

---

## Del 3: Media-opplasting i ProcedureEditor

### Funksjonalitet

| Funksjon | Beskrivelse |
|----------|-------------|
| Opplasting | Drag-and-drop eller filvelger |
| Bucket | `procedure-media` (allerede opprettet) |
| Filtyper | Bilder (jpg, png, gif, webp) |
| Maks størrelse | 5MB |

### Endringer i Image-blokk Editor

Erstatte URL-input med:
1. Opplastingsknapp/drag-area
2. Forhåndsvisning av opplastet bilde
3. Alternativ tekst-input

### Hjelpefunksjon

```typescript
async function uploadProcedureMedia(
  file: File, 
  procedureId: string
): Promise<string> {
  const fileName = `${procedureId}/${Date.now()}-${file.name}`;
  const { error } = await supabase.storage
    .from('procedure-media')
    .upload(fileName, file);
  
  if (error) throw error;
  
  const { data } = supabase.storage
    .from('procedure-media')
    .getPublicUrl(fileName);
  
  return data.publicUrl;
}
```

---

## Del 4: E-postvarsler via Edge Function

### Ny Edge Function: `supabase/functions/send-reminder/index.ts`

Sender daglige påminnelser til brukere med ufullførte prosedyrer som nærmer seg frist.

### Trigger-metoder

1. **Manuelt kall** fra admin-panel
2. **Cron-jobb** (fremtidig - krever ekstern scheduler)

### Logikk

```text
1. Hent prosedyrer med due_date innen 7 dager
2. For hver prosedyre:
   a. Finn brukere som ikke har fullført
   b. Grupper prosedyrer per bruker
3. Send e-post til hver bruker med liste over prosedyrer
```

### E-postmal

```text
Hei [Navn],

Du har prosedyrer som snart utløper:

• HMS Introduksjon - Frist: 15. februar 2026
• Brannøvelse - Frist: 20. februar 2026

Logg inn for å fullføre: [LENKE]

Med vennlig hilsen,
Prosedyrehub
```

### Forutsetninger

For å sende e-post trengs `RESEND_API_KEY` secret i Supabase.

---

## Filendringer

| Fil | Handling | Beskrivelse |
|-----|----------|-------------|
| `src/hooks/useRoleAccess.ts` | Ny | Samlet RBAC-hook |
| `src/pages/ProcedureViewer.tsx` | Oppdater | Viewer-begrensninger |
| `src/pages/ProcedureEditor.tsx` | Oppdater | Bildeopplasting |
| `src/lib/storage.ts` | Ny | Hjelpefunksjoner for storage |
| `supabase/functions/send-reminder/index.ts` | Ny | E-postvarsling |

---

## Tekniske Detaljer

### useRoleAccess Hook

```typescript
export function useRoleAccess(siteId?: string | null): RoleAccess {
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: canManage, isLoading: manageLoading } = useCanManageProcedures(siteId);
  const { data: userRoles, isLoading: rolesLoading } = useUserRoles();

  const hasRoleForSite = (role: AppRole) => {
    if (!siteId || !userRoles) return false;
    return userRoles.some(r => r.site_id === siteId && r.role === role);
  };

  const isSupervisor = !!canManage && !isAdmin;
  const isOperator = hasRoleForSite('operator');
  const isViewer = hasRoleForSite('viewer') && !isOperator && !isSupervisor && !isAdmin;

  return {
    isLoading: adminLoading || manageLoading || rolesLoading,
    isAdmin: !!isAdmin,
    isSupervisor,
    isOperator,
    isViewer,
    canExecuteProcedures: !!isAdmin || !!canManage || isOperator,
    canManageProcedures: !!isAdmin || !!canManage,
    canViewReports: !!isAdmin || !!canManage,
    canManageUsers: !!isAdmin,
    canManageSites: !!isAdmin,
    canAccessSettings: !!isAdmin,
    canManageRoles: !!isAdmin,
  };
}
```

### ProcedureViewer med Viewer-sjekk

```typescript
const { canExecuteProcedures, isViewer } = useRoleAccess(currentSite?.id);

// I action buttons-seksjonen:
{!hasStarted && contentBlocks.length > 0 && (
  canExecuteProcedures ? (
    <Button onClick={handleStart}>
      <Play className="mr-2 h-5 w-5" />
      Start prosedyre
    </Button>
  ) : (
    <div className="flex items-center gap-2 text-muted-foreground">
      <Eye className="h-5 w-5" />
      Du har kun lesetilgang til denne prosedyren
    </div>
  )
)}
```

### Edge Function Struktur

```typescript
// supabase/functions/send-reminder/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // 1. Hent prosedyrer med frist innen 7 dager
  // 2. Finn brukere som ikke har fullført
  // 3. Send e-post via Resend

  return new Response(
    JSON.stringify({ success: true, sent: emailCount }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})
```

---

## Implementeringsrekkefølge

1. **useRoleAccess hook** - Samlet tilgangs-API
2. **ProcedureViewer oppdatering** - Viewer-begrensninger
3. **Storage hjelpefunksjoner** - For bildeopplasting
4. **ProcedureEditor oppdatering** - Bildeopplasting UI
5. **Edge Function** - E-postvarsling

---

## Resultat Etter Implementering

- Viewers kan kun lese prosedyrer, ikke starte dem
- Enkel tilgangssjekk med `useRoleAccess` hook
- Bilder kan lastes opp direkte i prosedyre-editoren
- Forhåndsvisning av opplastede bilder
- E-postvarsler for prosedyrer som nærmer seg frist
- Admin kan trigge påminnelser manuelt

