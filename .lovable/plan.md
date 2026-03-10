

# Bruk riktig ASCO-logo på innloggingssiden

## Problem
Linje 128 i `Auth.tsx` bruker en enkel `<div>` med teal bakgrunnsfarge som "logo" i stedet for det faktiske ASCO-logobildet. Den opplastede filen er den oppdaterte `logo-light.png`.

## Plan

### 1. Kopier opplastet logo til prosjektet
Erstatt `src/assets/logo-light.png` med den opplastede filen `user-uploads://logo-light.png-2.png`.

### 2. Oppdater `Auth.tsx` (linje 127-132)
Erstatt den hardkodede teal-sirkelen med et `<img>`-element som importerer `logo-light.png`:

```tsx
import logoLight from '@/assets/logo-light.png';
```

Bytt ut `<div className="w-12 h-12 rounded-full ..."/>` med:
```tsx
<img src={logoLight} alt="ASCO logo" className="h-12 w-auto" />
```

Behold "ASCO" teksten og "Prosedyrehub" underteksten ved siden av logoen.

| Fil | Endring |
|-----|---------|
| `src/assets/logo-light.png` | Erstattes med opplastet logo |
| `src/pages/Auth.tsx` | Import logo, erstatt div-sirkel med img |

