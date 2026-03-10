

# Fix: Ikonene i login-feltene overlapper med tekst

## Problem
I `inputClasses` (linje 112) er `pl-10 px-4` definert — men `px-4` kommer etter `pl-10` og overstyrer venstre-padding tilbake til `1rem`, slik at teksten starter oppå ikonet.

## Løsning
Fjern `px-4` og bruk `pr-4` i stedet, slik at `pl-10` beholdes for å gi plass til ikonet.

| Fil | Endring |
|-----|---------|
| `src/pages/Auth.tsx` linje 112 | Endre `pl-10 px-4` til `pl-10 pr-4` |

