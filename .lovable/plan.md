

# Steg 3: Glassmorphism på Sidebar, Header og MobileNav

## Status
Header og Sidebar har allerede `dark:glass-panel` og `dark:border-white/10` fra forrige steg. Det som gjenstår er:

## Endringer

### 1. Aktive nav-lenker — cyan i dark mode
**Sidebar.tsx** (linje 28-34) og **MobileNav.tsx** (linje 46-52): Oppdater `navLinkClasses` slik at aktive lenker får cyan-farge i dark mode.

- Aktiv: legg til `dark:bg-cyan-500/20 dark:text-cyan-400` 
- Hover: legg til `dark:hover:bg-white/10 dark:hover:text-cyan-300`

### 2. MobileNav glass-panel
**MobileNav.tsx** (linje 62): Legg til `dark:glass-panel dark:border-white/10` på `SheetContent`.

**MobileNav.tsx** (linje 63): Oppdater header border til `dark:border-white/10`.

**MobileNav.tsx** (linje 184): Oppdater footer border til `dark:border-white/10`.

### 3. Header tekst-kontrast
**AppHeader.tsx** (linje 51): Legg til `dark:text-white` på "ASCO Prosedyrehub" tittelen for å sikre høy kontrast.

| Fil | Endring |
|-----|---------|
| `Sidebar.tsx` | Cyan aktiv-stil på nav-lenker |
| `MobileNav.tsx` | Glass-panel + cyan aktiv-stil |
| `AppHeader.tsx` | Hvit tittel-tekst i dark mode |

