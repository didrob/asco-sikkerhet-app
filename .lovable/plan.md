

# Implementering Del 3 - Klikkbare Prosedyrer + Mobil Navigasjon

## Oversikt
Gjør prosedyrekort klikkbare slik at brukere kan åpne og lese prosedyrer, og legger til mobil-navigasjon med hamburger-meny.

---

## Del 1: Klikkbare Prosedyrekort

**Problem**: Prosedyrekortene på `/procedures` er ikke klikkbare. Brukere kan ikke åpne prosedyrene for å lese dem.

**Løsning**: Wrappe `ProcedureCard` med `Link` fra react-router-dom.

### Endringer i `src/components/dashboard/ProcedureList.tsx`

```text
Før:
<ProcedureCard key={procedure.id} procedure={procedure} />

Etter:
<Link to={`/procedures/${procedure.id}`}>
  <ProcedureCard ... className="cursor-pointer hover:shadow-lg" />
</Link>
```

| Element | Endring |
|---------|---------|
| Import | Legg til `Link` fra react-router-dom |
| Wrapper | Pakk inn hver `ProcedureCard` i `Link` |
| Styling | Legg til `cursor-pointer` og forbedret hover-effekt |

---

## Del 2: Mobil Navigasjon

**Problem**: Sidebar er skjult på mobil (`hidden lg:block`), men det finnes ingen alternativ navigasjon.

**Løsning**: Legge til hamburger-meny i AppHeader som åpner et Sheet med navigasjonslenker.

### Ny Komponent: `src/components/layout/MobileNav.tsx`

Egen komponent som inneholder:
- Sheet-komponent som glir inn fra venstre
- Samme navigasjonslenker som Sidebar
- Automatisk lukking ved navigasjon
- Rollebasert visning (samme logikk som Sidebar)

### Endringer i `src/components/layout/AppHeader.tsx`

```text
Før header-innhold:
<div className="flex items-center gap-3">
  <ThemeLogo .../>
  ...
</div>

Etter:
<div className="flex items-center gap-3">
  <MobileNav />  <!-- Ny - vises kun på mobil -->
  <ThemeLogo .../>
  ...
</div>
```

### MobileNav Komponent Struktur

```text
MobileNav
├── Sheet
│   ├── SheetTrigger (hamburger-ikon, kun synlig på mobil)
│   └── SheetContent (side="left")
│       ├── SheetHeader med logo/tittel
│       └── nav med NavLink-er
│           ├── Dashboard
│           ├── Prosedyrer
│           ├── Min profil
│           └── (Admin-lenker hvis rolle tillater)
```

---

## Filendringer

| Fil | Handling | Beskrivelse |
|-----|----------|-------------|
| `src/components/dashboard/ProcedureList.tsx` | Oppdater | Klikkbare prosedyrekort med Link |
| `src/components/layout/MobileNav.tsx` | Ny | Mobil hamburger-meny komponent |
| `src/components/layout/AppHeader.tsx` | Oppdater | Importere og legge til MobileNav |

---

## Tekniske Detaljer

### ProcedureList med klikkbare kort

```typescript
import { Link } from 'react-router-dom';

// I ProcedureList return:
{procedures.map(procedure => (
  <Link 
    key={procedure.id} 
    to={`/procedures/${procedure.id}`}
    className="block"
  >
    <ProcedureCard procedure={procedure} />
  </Link>
))}

// I ProcedureCard - forbedret hover:
<Card className="transition-all hover:shadow-lg hover:border-primary/50 cursor-pointer">
```

### MobileNav Komponent

```typescript
import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useIsAdmin, useCanManageProcedures } from '@/hooks/useUserRoles';
import { useSiteContext } from '@/contexts/SiteContext';

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  
  // Automatisk lukking ved navigasjon
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72">
        {/* Navigasjonslenker */}
      </SheetContent>
    </Sheet>
  );
}
```

---

## Resultat Etter Implementering

**Desktop**:
- Prosedyrekort er klikkbare og navigerer til prosedyre-visning
- Hover-effekt viser at kortene er interaktive

**Mobil**:
- Hamburger-meny vises øverst til venstre
- Klikk åpner navigasjonsmeny fra venstre side
- Samme navigasjonsmuligheter som på desktop
- Menyen lukkes automatisk ved valg av side

**Alle brukere**:
- Kan klikke på prosedyrer for å lese dem
- "Start prosedyre" og "Neste steg" funksjonalitet er allerede på plass i ProcedureViewer

---

## Implementeringsrekkefølge

1. **Klikkbare prosedyrekort** - Oppdater ProcedureList.tsx
2. **MobileNav komponent** - Ny fil med Sheet-basert meny
3. **Integrer i AppHeader** - Legg til MobileNav

