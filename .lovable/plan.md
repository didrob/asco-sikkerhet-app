

# Implementering Del 7 - Audit Log, Forbedret Dashboard og UX-forbedringer

## Oversikt
Denne fasen fokuserer på tre hovedområder:
1. Aktivitetslogg (Audit Log) for sporbarhet og compliance
2. Forbedret Dashboard med rollebasert innhold
3. UX-forbedringer og polering

---

## Del 1: Audit Log - Aktivitetslogging

Databasen har allerede en `audit_log`-tabell. Vi implementerer funksjonalitet for å:
- Automatisk logge viktige hendelser
- Vise audit log i admin-panelet

### Hendelser som logges

| Hendelse | Resource Type | Action |
|----------|--------------|--------|
| Prosedyre opprettet | procedure | create |
| Prosedyre publisert | procedure | publish |
| Prosedyre arkivert | procedure | archive |
| Prosedyre fullført | procedure | complete |
| Rolle tildelt | role | assign |
| Rolle fjernet | role | remove |
| Bruker tildelt site | site_assignment | create |
| Bruker fjernet fra site | site_assignment | delete |

### Ny Side: AdminAuditLog.tsx

Viser aktivitetslogg med:
- Filtrering på ressurstype og tidsrom
- Søk på bruker eller ressurs
- Paginering for store datasett
- Eksport til CSV

---

## Del 2: Rollebasert Dashboard

Tilpass dashboardet basert på brukerens rolle:

| Rolle | Dashboard-innhold |
|-------|-------------------|
| **Admin** | Systemstatistikk, alle sites, hurtiglenker til admin |
| **Supervisor** | Site-statistikk, teamoversikt, rapporter |
| **Operator** | Mine prosedyrer, fremgang, kommende frister |
| **Viewer** | Kun prosedyreliste i lesevisning |

### Nye Komponenter

- `AdminDashboardCards` - Hurtigstatistikk for admin
- `SupervisorDashboardCards` - Team-fremgang og site-stats
- `UpcomingDeadlines` - Viser prosedyrer med nærliggende frister

---

## Del 3: UX-Forbedringer

### 3.1 Skeleton Loading States
Erstatte generiske loading-indikatorer med skeleton-komponenter for bedre brukeropplevelse.

### 3.2 Empty States
Forbedrede tomme tilstander med illustrasjoner og handlingsknapper:
- Ingen prosedyrer tildelt
- Ingen brukere på site
- Ingen roller tildelt

### 3.3 Confirmation Dialogs
Bekreftelsesdialog før destruktive handlinger:
- Slette prosedyre
- Fjerne rolle
- Arkivere prosedyre

### 3.4 Toasts og Feedback
Konsistent bruk av toast-varsler for alle handlinger.

---

## Filendringer

| Fil | Handling | Beskrivelse |
|-----|----------|-------------|
| `src/pages/admin/AdminAuditLog.tsx` | Ny | Aktivitetslogg-side |
| `src/hooks/useAuditLog.ts` | Ny | Hook for audit log data |
| `src/lib/audit.ts` | Ny | Hjelpefunksjoner for logging |
| `src/components/dashboard/AdminDashboardCards.tsx` | Ny | Admin-spesifikke kort |
| `src/components/dashboard/SupervisorDashboardCards.tsx` | Ny | Supervisor-spesifikke kort |
| `src/components/dashboard/UpcomingDeadlines.tsx` | Ny | Fristvisning |
| `src/pages/Index.tsx` | Oppdater | Rollebasert innhold |
| `src/components/layout/Sidebar.tsx` | Oppdater | Legg til Audit Log lenke |
| `src/components/layout/MobileNav.tsx` | Oppdater | Legg til Audit Log lenke |
| `src/App.tsx` | Oppdater | Ny rute /admin/audit |

---

## Tekniske Detaljer

### Audit Logging Hjelpefunksjon

```typescript
// src/lib/audit.ts
export async function logAudit({
  action,
  resourceType,
  resourceId,
  metadata,
}: {
  action: string;
  resourceType: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  
  await supabase.from('audit_log').insert({
    user_id: user?.id,
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    metadata,
  });
}
```

### useAuditLog Hook

```typescript
export function useAuditLog(filters?: {
  resourceType?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  return useQuery({
    queryKey: ['audit_log', filters],
    queryFn: async () => {
      let query = supabase
        .from('audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (filters?.resourceType) {
        query = query.eq('resource_type', filters.resourceType);
      }
      // ... additional filters

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}
```

### Rollebasert Dashboard

```typescript
// I Index.tsx
const { isAdmin, isSupervisor, isOperator, isViewer } = useRoleAccess(currentSite?.id);

return (
  <AppLayout>
    {isAdmin && <AdminDashboardCards />}
    {isSupervisor && <SupervisorDashboardCards />}
    
    {!isViewer && <UpcomingDeadlines />}
    
    <ProcedureList />
  </AppLayout>
);
```

---

## Implementeringsrekkefølge

1. **Audit log infrastruktur** - Hjelpefunksjoner og hook
2. **AdminAuditLog side** - UI for å vise logg
3. **Integrere logging** - Legge til logging i eksisterende mutasjoner
4. **Dashboard-komponenter** - Rollebaserte kort
5. **Oppdater Index.tsx** - Rollebasert dashboard
6. **UX-forbedringer** - Empty states og skeleton loaders

---

## Navigasjonsstruktur etter implementering

```text
Governance (kun admin)
├── Roller
└── Aktivitetslogg (ny)

Administrasjon
├── Administrer prosedyrer (supervisor+)
├── Rapporter (supervisor+)
├── Sites (admin)
├── Brukere (admin)
└── Innstillinger (admin)
```

---

## Resultat Etter Implementering

- Full sporbarhet av alle viktige handlinger i systemet
- Rolletilpasset dashboard for bedre brukeropplevelse
- Forbedret UX med skeleton loading og empty states
- Bekreftelsesdialoger før destruktive handlinger
- Konsistent feedback via toast-varsler

