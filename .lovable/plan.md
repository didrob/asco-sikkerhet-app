

# Audit: Dark Mode lesbarhet — Glass-effekt vs. solid bakgrunn

## Nåværende tilstand

### Allerede riktig (glass-effekt)
- **AppHeader**: `dark:glass-panel dark:border-white/10` — OK
- **Sidebar**: `dark:glass-panel dark:border-white/10` — OK
- **MobileNav**: `dark:glass-panel dark:border-white/10` — OK
- **AppLayout**: `dark:bg-[#0B0F19]` bakgrunn — OK

### Mangler: Ingen dark mode-spesifikke bakgrunner på innhold
- **Card-komponenten** (`src/components/ui/card.tsx`): Bruker bare `bg-card` uten noen dark mode-override. Dette betyr at tabeller og skjemaer i cards arver den generiske card-fargen, som kan være for transparent i dark mode.
- **Table-komponenten** (`src/components/ui/table.tsx`): Ingen dark mode-styling overhodet.
- **ProcedureViewer**: Prosedyre-innholdet bruker standard `<Card>` uten noen solid dark mode-bakgrunn. Ingen spesiell dokument-container-styling.
- **ProcedureList / Admin-tabeller**: Bruker standard Card og Table uten dark mode-overrides.

## Plan

### 1. Card-komponenten — solid dark mode bakgrunn
**Fil**: `src/components/ui/card.tsx`

Legg til `dark:bg-slate-900/95 dark:border-white/10` på Card-basen. Dette gir alle datatabeller og skjemaer i appen en solid, lesbar bakgrunn uten å endre light mode.

```
// Fra:
"rounded-lg border bg-card text-card-foreground shadow-sm"
// Til:
"rounded-lg border bg-card text-card-foreground shadow-sm dark:bg-slate-900/95 dark:border-white/10"
```

### 2. Table-komponenten — bedre dark mode kontrast
**Fil**: `src/components/ui/table.tsx`

Legg til subtile dark mode-farger på hover-states og header:
- TableHead: `dark:text-slate-400`
- TableRow hover: `dark:hover:bg-white/5`

### 3. ProcedureViewer — solid dokument-container
**Fil**: `src/pages/ProcedureViewer.tsx`

Wrap prosedyre-innholdet (linje 353-357) med en spesifikk dark mode-klasse for det "arket" brukeren leser:

```
// Fra:
<Card>
  <CardContent className="p-6">
// Til:
<Card className="dark:bg-[#0B0F19] dark:border-white/10">
  <CardContent className="p-6">
```

Dette overskriver Card-defaulten med en helt solid bakgrunn kun for prosedyre-dokumentet, for optimal lesbarhet utendørs/mobil.

### Oppsummering av endringer
| Komponent | Nåværende | Endring |
|-----------|-----------|---------|
| Header/Sidebar/MobileNav | glass-panel | Ingen endring (behold) |
| Card (global) | bg-card | + `dark:bg-slate-900/95 dark:border-white/10` |
| Table header/rows | Ingen dark styling | + subtile dark mode farger |
| ProcedureViewer dokument | Standard Card | + `dark:bg-[#0B0F19] dark:border-white/10` |

