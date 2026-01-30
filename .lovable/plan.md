
# Implementering av ASCO Logo med Tema-støtte

## Oversikt
Integrerer ASCO-logoene i applikasjonen med automatisk bytte mellom mørk og lys variant basert på brukerens systeminnstillinger eller valgt tema.

---

## Logoene

| Logo | Fil | Bruksområde |
|------|-----|-------------|
| Mørk logo | `logo-dark.png` | Vises på lyse bakgrunner (light mode) |
| Lys logo | `logo-light.png` | Vises på mørke bakgrunner (dark mode) |

---

## Hva som gjøres

### 1. Kopiere logoer til prosjektet
Logoene kopieres til `src/assets/` for optimal bundling og type-sikkerhet.

### 2. Opprette ThemeLogo-komponent
En gjenbrukbar komponent som automatisk viser riktig logo basert på aktivt tema.

### 3. Sette opp ThemeProvider
Legger til `next-themes` ThemeProvider i App.tsx for å støtte lys/mørk modus og systeminnstillinger.

### 4. Oppdatere Auth-siden
Erstatter Shield-ikonet med ASCO-logoen på innloggingssiden.

### 5. Oppdatere AppHeader
Erstatter Shield-ikonet med ASCO-logoen i toppmenyen.

### 6. Oppdatere metadata
Oppdaterer index.html med ASCO-navn og beskrivelse.

---

## Tekniske detaljer

### ThemeLogo-komponent
```typescript
// src/components/ThemeLogo.tsx
import { useTheme } from 'next-themes';
import logoDark from '@/assets/logo-dark.png';
import logoLight from '@/assets/logo-light.png';

interface ThemeLogoProps {
  className?: string;
  alt?: string;
}

export function ThemeLogo({ className, alt = "ASCO logo" }: ThemeLogoProps) {
  const { resolvedTheme } = useTheme();
  
  // resolvedTheme håndterer 'system' og returnerer 'light' eller 'dark'
  const logoSrc = resolvedTheme === 'dark' ? logoLight : logoDark;
  
  return <img src={logoSrc} alt={alt} className={className} />;
}
```

### ThemeProvider-oppsett
```typescript
// I App.tsx
import { ThemeProvider } from 'next-themes';

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    {/* ... resten av appen */}
  </ThemeProvider>
);
```

---

## Filendringer

| Fil | Endring |
|-----|---------|
| `src/assets/logo-dark.png` | Ny fil (kopi av opplastet logo) |
| `src/assets/logo-light.png` | Ny fil (kopi av opplastet logo) |
| `src/components/ThemeLogo.tsx` | Ny komponent for tema-aware logo |
| `src/App.tsx` | Legger til ThemeProvider wrapper |
| `src/pages/Auth.tsx` | Erstatter Shield med ThemeLogo |
| `src/components/layout/AppHeader.tsx` | Erstatter Shield med ThemeLogo |
| `index.html` | Oppdaterer tittel og meta-tags til ASCO |

---

## Visuelt resultat

Etter implementering:
- Auth-siden viser ASCO-logoen sentrert over innloggingsskjemaet
- Header viser ASCO-logoen i stedet for Shield-ikonet
- Logo bytter automatisk ved endring av systemtema
- Brukere med mørk modus ser den lyse logoen, og omvendt
