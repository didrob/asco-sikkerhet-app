

# Implementering Del 5 - Governance-struktur for Roller

## Oversikt
Oppretter en dedikert governance-struktur under admin-seksjonen hvor administrator har full kontroll over roller. Dette separerer brukeradministrasjon fra rolle/tilgangsstyring.

---

## Arkitektur

```text
Admin-seksjon (kun for admin)
├── Governance (ny seksjon)
│   ├── Roller (/admin/roles) - Administrer roller og tilganger
│   └── (Fremtidig: Audit Log, Policies, etc.)
├── Sites (/admin/sites)
├── Brukere (/admin/users) - Kun bruker- og site-tildeling
└── Innstillinger (/admin/settings)
```

---

## Del 1: Ny Side - AdminRoles.tsx

Dedikert side for rolleadministrasjon med følgende funksjoner:

| Funksjon | Beskrivelse |
|----------|-------------|
| Oversikt | Vis alle roller gruppert per site |
| Tildel rolle | Modal for å gi bruker en rolle på en site |
| Fjern rolle | Fjern eksisterende rolle |
| Rollebeskrivelser | Informasjon om hva hver rolle kan gjøre |
| Audit-info | Hvem tildelte rollen og når |

### UI-struktur

```text
AdminRoles
├── Header med tittel og info
├── Faner per site (eller velger)
├── Rolle-matrise
│   ├── Rad per bruker
│   └── Kolonne per rolle (admin, supervisor, operator, viewer)
├── Tildel rolle-dialog
│   ├── Velg bruker
│   ├── Velg site
│   └── Velg rolle
└── Rolleoversikt-panel
    └── Beskrivelse av hver rolle og dens tilganger
```

---

## Del 2: Oppdater AdminUsers.tsx

Forenkle brukeradministrasjonen til kun å håndtere:
- Brukerinformasjon
- Site-tildelinger (ikke roller)
- Lenke til Roller-siden for rolleadministrasjon

Fjern:
- Rolle-tildeling UI
- Rolle-visning (erstatt med lenke/badge)

---

## Del 3: Ny Hook - useAdminRoles.ts

Dedikert hook for roller med utvidet funksjonalitet:

```typescript
interface RoleWithDetails {
  id: string;
  user_id: string;
  site_id: string;
  role: AppRole;
  created_at: string;
  user: {
    full_name: string;
    job_title: string;
  };
  site: {
    name: string;
    location: string;
  };
}

// Hooks:
- useAllRoles() - Hent alle roller med bruker/site-detaljer
- useRolesBySite(siteId) - Roller filtrert per site
- useAssignRole() - Tildel rolle (eksisterende)
- useRemoveRole() - Fjern rolle (eksisterende)
- useBulkAssignRoles() - Tildel flere roller samtidig
```

---

## Del 4: Navigasjons-oppdatering

### Sidebar og MobileNav

```text
Administrasjon
├── Administrer prosedyrer (supervisor+)
├── Rapporter (supervisor+)
├── Governance (kun admin)
│   └── Roller
├── Sites (admin)
├── Brukere (admin)
└── Innstillinger (admin)
```

Alternativt kan "Governance" være en egen seksjon:

```text
Governance (kun admin)
├── Roller

Administrasjon
├── Sites
├── Brukere
└── Innstillinger
```

---

## Del 5: Rollebeskrivelser

Informasjonspanel som viser hva hver rolle kan gjøre:

| Rolle | Beskrivelse | Tilganger |
|-------|-------------|-----------|
| **Admin** | Global administrator | Full tilgang til alt i systemet |
| **Supervisor** | Site-leder | Administrere prosedyrer, se rapporter for sin site |
| **Operator** | Standard bruker | Utføre og fullføre prosedyrer |
| **Viewer** | Leser | Kun lesbar tilgang til prosedyrer |

---

## Filendringer

| Fil | Handling | Beskrivelse |
|-----|----------|-------------|
| `src/pages/admin/AdminRoles.tsx` | Ny | Rolleadministrasjon-side |
| `src/hooks/useAdminRoles.ts` | Ny | Hook for rolle-operasjoner |
| `src/pages/admin/AdminUsers.tsx` | Oppdater | Forenkle - fjern rolle-UI |
| `src/components/layout/Sidebar.tsx` | Oppdater | Legg til Roller-lenke |
| `src/components/layout/MobileNav.tsx` | Oppdater | Legg til Roller-lenke |
| `src/App.tsx` | Oppdater | Ny rute /admin/roles |

---

## Tekniske Detaljer

### AdminRoles Komponent

```typescript
// Rolle-matrise visning
interface RoleMatrixProps {
  siteId: string;
  users: UserWithDetails[];
  roles: RoleWithDetails[];
}

function RoleMatrix({ siteId, users, roles }: RoleMatrixProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Bruker</TableHead>
          <TableHead>Admin</TableHead>
          <TableHead>Supervisor</TableHead>
          <TableHead>Operator</TableHead>
          <TableHead>Viewer</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map(user => (
          <TableRow key={user.id}>
            <TableCell>{user.profile?.full_name}</TableCell>
            {['admin', 'supervisor', 'operator', 'viewer'].map(role => (
              <TableCell key={role}>
                <Checkbox 
                  checked={hasRole(user.id, siteId, role)} 
                  onCheckedChange={(checked) => toggleRole(user.id, siteId, role, checked)}
                />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

### useAdminRoles Hook

```typescript
export function useAllRoles() {
  return useQuery({
    queryKey: ['all_roles'],
    queryFn: async () => {
      const { data: roles, error } = await supabase
        .from('user_roles')
        .select(`
          *,
          profiles!user_roles_user_id_fkey (
            full_name,
            job_title
          ),
          sites!user_roles_site_id_fkey (
            name,
            location
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return roles;
    },
  });
}

export function useRolesBySite(siteId: string) {
  return useQuery({
    queryKey: ['roles_by_site', siteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select(`
          *,
          profiles!user_roles_user_id_fkey (
            full_name,
            job_title
          )
        `)
        .eq('site_id', siteId);

      if (error) throw error;
      return data;
    },
    enabled: !!siteId,
  });
}
```

---

## Implementeringsrekkefølge

1. **useAdminRoles hook** - Data-grunnlag for rolleadministrasjon
2. **AdminRoles side** - Ny side med rolle-matrise
3. **Oppdater AdminUsers** - Forenkle bruker-siden
4. **Navigasjons-oppdatering** - Legg til Roller i meny
5. **Registrer rute** - Legg til /admin/roles i App.tsx

---

## Sikkerhet

Alle roller ligger i `user_roles`-tabellen med RLS-policies:
- Kun admin kan se, opprette og slette roller
- Server-side validering via `is_admin()` funksjonen
- Ingen rolle-data lagres på klient-siden

---

## Resultat Etter Implementering

- Dedikert Governance-seksjon for rolleadministrasjon
- Admin har full oversikt over alle roller per site
- Enkel rolle-matrise for rask tildeling
- Brukeradministrasjon fokuserer kun på site-tildelinger
- Tydelig separasjon mellom bruker- og rolleadministrasjon
- Informasjonspanel som forklarer rollene

