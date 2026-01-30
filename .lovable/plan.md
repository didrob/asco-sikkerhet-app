

# Dashboard med Brukerdata og Rollebasert Navigasjon

## Oversikt
Bygger ut dashboardet til å vise dynamisk data fra Supabase - brukerens profil, tildelte sites, roller og tilgjengelige prosedyrer. Inkluderer også en site-velger for multi-tenant kontekst.

---

## Nye Komponenter

### 1. Custom Hooks for Datahenting

**`src/hooks/useProfile.ts`**
- Henter brukerens profil fra `profiles`-tabellen
- Oppdaterer profil ved behov
- Caching med React Query

**`src/hooks/useUserRoles.ts`**
- Henter brukerens roller fra `user_roles`
- Sjekker admin-status via `is_admin()` funksjonen
- Returnerer roller per site

**`src/hooks/useSites.ts`**
- Henter brukerens tildelte sites fra `sites` via `user_site_assignments`
- Støtter site-bytte

**`src/hooks/useProcedures.ts`**
- Henter prosedyrer for valgt site
- Filtrerer på `status = 'published'`
- Inkluderer fremgangsstatus fra `procedure_progress`

---

### 2. Site Context Provider

**`src/contexts/SiteContext.tsx`**
- Holder styr på valgt site (`currentSite`)
- Synkroniserer med `profiles.current_site_id`
- Brukes av alle komponenter som trenger site-kontekst

---

### 3. Layout-komponenter

**`src/components/layout/AppHeader.tsx`**
- Logo og app-navn
- Site-velger dropdown
- Brukerinfo og logg ut-knapp

**`src/components/layout/AppLayout.tsx`**
- Wrapper for hele appen
- Header + sidebar + main content area
- Responsiv design

**`src/components/layout/Sidebar.tsx`**
- Navigasjonsmeny basert på brukerens rolle
- Admin-lenker vises kun for admins/supervisors
- Prosedyrer, Profil, Sites-lenker

---

### 4. Dashboard-komponenter

**`src/components/dashboard/SiteSelector.tsx`**
- Dropdown for å velge aktiv site
- Viser alle sites brukeren har tilgang til
- Lagrer valg i profil

**`src/components/dashboard/ProcedureList.tsx`**
- Liste over prosedyrer for valgt site
- Viser fremgangsstatus (ikke startet, påbegynt, fullført)
- Link til prosedyre-viewer

**`src/components/dashboard/UserStats.tsx`**
- Statistikk-kort
- Antall fullførte prosedyrer
- Antall påbegynte
- Neste forfallsdato

**`src/components/dashboard/WelcomeCard.tsx`**
- Velkomstmelding med brukernavn
- Oversikt over dagens oppgaver

---

### 5. Oppdatert Index-side

**`src/pages/Index.tsx`** (refaktorert)
- Bruker nye hooks for datahenting
- Viser SiteSelector hvis flere sites
- Dynamisk ProcedureList
- Statistikk-kort med ekte data

---

## Nye Ruter

| Rute | Komponent | Beskrivelse |
|------|-----------|-------------|
| `/` | Dashboard | Hovedside med prosedyrer og stats |
| `/profile` | ProfilePage | Rediger profil |
| `/procedures/:id` | ProcedureViewer | Se/fullfør prosedyre |

---

## Tekniske Detaljer

### React Query Oppsett
```typescript
// Eksempel på useProfile hook
export function useProfile() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });
}
```

### Site Context
```typescript
interface SiteContextType {
  currentSite: Site | null;
  sites: Site[];
  setCurrentSite: (site: Site) => void;
  isLoading: boolean;
}
```

### Rollebasert UI
```typescript
// I Sidebar - vis admin-lenker kun for admins
{isAdmin && (
  <NavLink to="/admin">
    <Settings className="h-4 w-4" />
    Administrasjon
  </NavLink>
)}
```

---

## Filstruktur Etter Implementering

```text
src/
├── components/
│   ├── dashboard/
│   │   ├── ProcedureList.tsx
│   │   ├── SiteSelector.tsx
│   │   ├── UserStats.tsx
│   │   └── WelcomeCard.tsx
│   ├── layout/
│   │   ├── AppHeader.tsx
│   │   ├── AppLayout.tsx
│   │   └── Sidebar.tsx
│   └── ui/
├── contexts/
│   ├── AuthContext.tsx
│   └── SiteContext.tsx
├── hooks/
│   ├── useProfile.ts
│   ├── useUserRoles.ts
│   ├── useSites.ts
│   └── useProcedures.ts
└── pages/
    ├── Index.tsx (refaktorert)
    └── Profile.tsx (ny)
```

---

## Implementeringsrekkefølge

1. **Hooks** - useProfile, useUserRoles, useSites, useProcedures
2. **SiteContext** - Global site-kontekst
3. **Layout** - AppLayout, AppHeader, Sidebar
4. **Dashboard-komponenter** - SiteSelector, ProcedureList, UserStats
5. **Oppdater Index.tsx** - Integrer alle nye komponenter
6. **Profilside** - Ny side for å redigere profil

---

## Hva Du Vil Se

Etter implementering vil dashboardet:
- Vise brukerens navn (fra profil) i stedet for bare e-post
- Ha en site-velger hvis brukeren har flere sites
- Liste prosedyrer med fremgangsstatus
- Vise statistikk over fullførte prosedyrer
- Ha rollebasert navigasjon (admin-lenker for admins)
