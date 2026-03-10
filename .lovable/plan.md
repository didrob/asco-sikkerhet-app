

# Gjør "Kompetanse" og "Be om tilgang" tekst hvit

## Endringer

### 1. "Kompetanse"-teksten (linje 130)
Fjern gradient-effekten og bruk vanlig hvit tekst i stedet.

**Fra:** `className="bg-gradient-to-r from-blue-300 via-cyan-300 to-white bg-clip-text text-transparent"`
**Til:** `className="text-white"`

### 2. "Be om tilgang"-knappen (linje 211)
Endre tekstfargen fra `text-sky-400` til `text-white`.

**Fra:** `text-sky-400 hover:text-sky-300`
**Til:** `text-white hover:text-white/80`

| Fil | Linje | Endring |
|-----|-------|---------|
| `src/pages/Auth.tsx` | 130 | Fjern gradient, bruk `text-white` |
| `src/pages/Auth.tsx` | 211 | Endre `text-sky-400` til `text-white` |

