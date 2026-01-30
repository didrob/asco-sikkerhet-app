

# Reorganisert Navigasjon - Alt kurs under Kurs

## Problem

Kurs-relaterte elementer er spredt over flere seksjoner:

| Nåværende seksjon | Innhold |
|-------------------|---------|
| **OPPLÆRING** | Aktive kurs, Min opplæringshistorikk |
| **ADMINISTRASJON** | Kurs, Grupper, Opplæringsoversikt |

Dette er forvirrende - brukeren må lete to steder for å finne kurs-relatert funksjonalitet.

---

## Løsningsforslag: Tema-basert gruppering

Reorganiserer navigasjonen slik at **alt som handler om kurs ligger under KURS**, og **alt som handler om prosedyrer ligger under PROSEDYRER**.

### Ny Struktur

```text
+----------------------------------+
| PROSEDYRER                       |
|   📄 Bla i prosedyrer            |  ← Alle brukere
|   ⚙️ Administrer prosedyrer      |  ← Kun HMS/admin
+----------------------------------+
| KURS                             |
|   📚 Mine kurs                   |  ← Alle brukere
|   📜 Min kurshistorikk           |  ← Alle brukere
|   ⚙️ Administrer kurs            |  ← Kun HMS/admin
|   👥 Grupper                     |  ← Kun HMS/admin
|   📊 Opplæringsoversikt          |  ← Kun HMS/admin
+----------------------------------+
| RAPPORTER                        |
|   📊 Rapporter                   |  ← Kun HMS/admin
+----------------------------------+
| SYSTEM                           |
|   👤 Brukere                     |  ← Kun global admin
|   🏢 Lokasjoner                  |  ...
|   ...                            |
+----------------------------------+
```

---

## Detaljer

### Fordeler

| Før | Etter |
|-----|-------|
| Kurs spredt over 2 seksjoner | Alt kurs på ett sted |
| "Administrasjon" blander prosedyrer og kurs | Klart skille per tema |
| Forvirrende for nye brukere | Intuitiv navigasjon |

### Navigasjonslogikk

- **Vanlige brukere** ser: "Bla i prosedyrer" + "Mine kurs" + "Min kurshistorikk" + "Min profil"
- **HMS/Supervisors** ser også: "Administrer prosedyrer" + "Administrer kurs" + "Grupper" + "Opplæringsoversikt" + "Rapporter"
- **Global admin** ser også: "System"-seksjonen

### Collapsible seksjoner

Hver seksjon (PROSEDYRER, KURS, RAPPORTER, SYSTEM) blir collapsible med chevron-pil:

```text
▼ KURS                        ← Klikk for å kollapse
    Mine kurs
    Min kurshistorikk
    Administrer kurs          ← Kun synlig for HMS
    Grupper                   ← Kun synlig for HMS
    Opplæringsoversikt        ← Kun synlig for HMS
```

---

## Fil-endringer

| Fil | Endring |
|-----|---------|
| `src/components/layout/Sidebar.tsx` | Ny tema-basert struktur med collapsible seksjoner |
| `src/components/layout/MobileNav.tsx` | Samme struktur for mobil |

---

## Teknisk Implementering

### NavSection-komponent (gjenbrukbar)

```typescript
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';

function NavSection({ title, icon: Icon, defaultOpen = true, children }) {
  return (
    <Collapsible defaultOpen={defaultOpen} className="space-y-1">
      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:bg-accent group">
        <span className="flex items-center gap-1.5">
          {Icon && <Icon className="h-3.5 w-3.5" />}
          {title}
        </span>
        <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-1">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}
```

### Oppdatert Sidebar-struktur

```typescript
{/* Dashboard - alltid synlig */}
<NavLink to="/">Dashboard</NavLink>
<NavLink to="/profile">Min profil</NavLink>

{/* PROSEDYRER */}
<NavSection title="Prosedyrer" icon={FileText}>
  <NavLink to="/procedures">Bla i prosedyrer</NavLink>
  {canManage && (
    <NavLink to="/procedures/manage">Administrer prosedyrer</NavLink>
  )}
</NavSection>

{/* KURS */}
<NavSection title="Kurs" icon={BookOpen}>
  <NavLink to="/training">Mine kurs</NavLink>
  <NavLink to="/training/history">Min kurshistorikk</NavLink>
  {canManage && (
    <>
      <NavLink to="/training/manage">Administrer kurs</NavLink>
      <NavLink to="/training/groups">Grupper</NavLink>
      <NavLink to="/training/overview">Opplæringsoversikt</NavLink>
    </>
  )}
</NavSection>

{/* RAPPORTER - kun HMS */}
{canManage && (
  <NavSection title="Rapporter" icon={BarChart3}>
    <NavLink to="/admin/reports">Rapporter</NavLink>
  </NavSection>
)}

{/* SYSTEM - kun admin */}
{isAdmin && (
  <NavSection title="System" icon={Cog}>
    {/* ... admin-lenker */}
  </NavSection>
)}
```

---

## Visuell Sammenligning

### Før (forvirrende)
```text
NAVIGASJON
  Dashboard
  Prosedyrer

OPPLÆRING              ← Kurs-ting her
  Aktive kurs
  Min opplæringshistorikk

Min profil

ADMINISTRASJON         ← Og mer kurs-ting her!
  Prosedyrer
  Kurs                 ← Forvirrende duplikat
  Grupper
  Opplæringsoversikt
  Rapporter
```

### Etter (ryddig)
```text
Dashboard
Min profil

▼ PROSEDYRER           ← Alt prosedyre-relatert
    Bla i prosedyrer
    Administrer prosedyrer (HMS)

▼ KURS                 ← Alt kurs-relatert på ett sted!
    Mine kurs
    Min kurshistorikk
    Administrer kurs (HMS)
    Grupper (HMS)
    Opplæringsoversikt (HMS)

▼ RAPPORTER (HMS)
    Rapporter

▼ SYSTEM (Admin)
    Brukere
    ...
```

---

## Resultat

- **Tema-basert gruppering**: Alt kurs under KURS, alt prosedyre under PROSEDYRER
- **Collapsible seksjoner**: Brukere kan skjule det de ikke trenger
- **Ingen duplikater**: Tydelig navngiving
- **Rollebasert synlighet**: Admin-lenker vises kun for de med tilgang
- **Konsistent mobil/desktop**: Samme struktur i MobileNav

