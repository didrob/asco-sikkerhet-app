

# Utvidet Implementering - Tema-velger + Prosedyrehub Del 2

## Oversikt
Legger til en tema-velger i headeren slik at brukere kan bytte mellom lys, mørk og systeminnstilt modus. Deretter fortsetter vi med prosedyre-editor og gjennomføringsfunksjonalitet.

---

## Del 1: Tema-velger i Headeren

### Ny Komponent

**`src/components/ThemeToggle.tsx`**

En dropdown-knapp som lar brukeren velge mellom tre modi:
- Sol-ikon (Sun) for lys modus
- Måne-ikon (Moon) for mørk modus  
- Laptop-ikon (Laptop) for systeminnstillinger

Bruker `useTheme()` fra next-themes for å lese og sette tema.

### Oppdatering av AppHeader

Legger til ThemeToggle-komponenten i høyre del av headeren, mellom brukerinfo og logout-knappen.

### Visuelt Design

| Modus | Ikon | Tekst i dropdown |
|-------|------|------------------|
| Light | Sun | Lys |
| Dark | Moon | Mørk |
| System | Laptop | System |

Knappen viser dynamisk ikon basert på aktivt tema.

---

## Del 2: Prosedyre-funksjonalitet

### Testprosedyre i Database

Oppretter en "HMS Introduksjon" prosedyre med flere innholdsblokker for testing.

### Progress-hooks

**`src/hooks/useProcedureProgress.ts`**
- `useStartProcedure()` - Starter prosedyre og oppretter progress-rad
- `useAdvanceBlock()` - Går til neste blokk
- `useCompleteProcedure()` - Fullfører med signatur

### Oppdatert ProcedureViewer

Legger til funksjonelle knapper:
- "Start prosedyre" 
- "Neste steg"
- "Fullfør prosedyre"

### Signatur-dialog

**`src/components/procedure/SignatureDialog.tsx`**

Modal med canvas for håndskrevet signatur ved fullføring.

---

## Del 3: Prosedyre-editor

### Nye Komponenter

| Fil | Beskrivelse |
|-----|-------------|
| `ProcedureEditor.tsx` | Hoved-editor for å opprette/redigere prosedyrer |
| `ContentBlockEditor.tsx` | Redigerbar innholdsblokk |
| `BlockToolbar.tsx` | Verktøylinje for å legge til blokker |
| `TextBlockEditor.tsx` | Rich text editor |
| `QuizBlockEditor.tsx` | Quiz-spørsmål med alternativer |
| `CheckpointBlockEditor.tsx` | Bekreftelsespunkt |

### Nye Ruter

| Rute | Komponent |
|------|-----------|
| `/procedures/new` | Opprett ny prosedyre |
| `/procedures/:id/edit` | Rediger eksisterende |

---

## Implementeringsrekkefølge

1. **ThemeToggle** - Tema-velger komponent
2. **Oppdater AppHeader** - Legg til tema-velgeren
3. **Testprosedyre** - SQL-migrasjon med testdata
4. **Progress Hooks** - Start/neste/fullfør mutations
5. **Oppdater ProcedureViewer** - Koble knapper til hooks
6. **Signatur-dialog** - Canvas for signering
7. **Prosedyre-editor** - Full editor med blokker
8. **Oppdater ManageProcedures** - Koble til editor

---

## Tekniske Detaljer

### ThemeToggle Komponent

```typescript
import { Moon, Sun, Laptop } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const icon = resolvedTheme === 'dark' ? Moon : Sun;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <icon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme('light')}>
          <Sun className="mr-2 h-4 w-4" /> Lys
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>
          <Moon className="mr-2 h-4 w-4" /> Mørk
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>
          <Laptop className="mr-2 h-4 w-4" /> System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### Prosedyre Testdata

```sql
INSERT INTO procedures (site_id, title, description, status, content_blocks)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'HMS Introduksjon',
  'Grunnleggende HMS-opplæring for nye ansatte',
  'published',
  '[
    {"id": "1", "type": "text", "content": {"text": "Velkommen til ASCO HMS-opplæring..."}},
    {"id": "2", "type": "checkpoint", "content": {"label": "Jeg har lest sikkerhetsinstruksene"}},
    {"id": "3", "type": "quiz", "content": {"question": "Hva gjør du ved brannalarm?", ...}},
    {"id": "4", "type": "text", "content": {"text": "Gratulerer! Du har fullført."}}
  ]'
);
```

---

## Filendringer Oversikt

| Fil | Handling |
|-----|----------|
| `src/components/ThemeToggle.tsx` | Ny |
| `src/components/layout/AppHeader.tsx` | Oppdatert |
| `src/hooks/useProcedureProgress.ts` | Ny |
| `src/hooks/useProcedureMutations.ts` | Ny |
| `src/components/procedure/SignatureDialog.tsx` | Ny |
| `src/pages/ProcedureEditor.tsx` | Ny |
| `src/pages/ProcedureViewer.tsx` | Oppdatert |
| `src/pages/ManageProcedures.tsx` | Oppdatert |
| `src/App.tsx` | Oppdatert (nye ruter) |
| SQL-migrasjon | Testprosedyre |

---

## Resultat Etter Implementering

- Tema-velger ikon i headeren (mellom brukerinfo og logout)
- Brukere kan bytte mellom lys, mørk og system-modus
- Logo bytter automatisk basert på valgt tema
- Dashboard viser testprosedyren "HMS Introduksjon"
- Prosedyrer kan startes, gjennomføres steg-for-steg, og fullføres med signatur
- Admin kan opprette og redigere prosedyrer

