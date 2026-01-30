

# Separasjon av Administrasjon og System + Dashboards + Prosedyrevisninger

## Oversikt

Denne planen implementerer tre hoveddeler:

1. **Administrasjon** (HMS-ansvarlige, basesjefer, supervisors) - Operasjonelle KPI-dashboards
2. **System** (Kun admin) - Brukerstatistikk og systemkonfigurasjon  
3. **Prosedyrevisninger** - Sporing av hvor mange ganger hver prosedyre har blitt vist/lest

---

## Del 1: Prosedyre-visningssporing

### Hvorfor dette er viktig

| Formål | Verdi |
|--------|-------|
| **Audit-bevis** | Dokumenterer at prosedyrer faktisk blir lest |
| **Bruksstatistikk** | Viser hvilke prosedyrer som er mest relevante |
| **Opplæringsbehov** | Identifiserer prosedyrer som ignoreres |
| **Digitaliseringsbevis** | Konkrete tall på systembruk |

### Ny Database-tabell

```sql
CREATE TABLE procedure_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  procedure_id UUID REFERENCES procedures(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  viewed_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  duration_seconds INTEGER,  -- Hvor lenge brukeren hadde prosedyren åpen
  completed_read BOOLEAN DEFAULT false  -- Om brukeren scrollet til bunnen/leste alt
);

-- Indeks for rask aggregering
CREATE INDEX idx_procedure_views_procedure_id ON procedure_views(procedure_id);
CREATE INDEX idx_procedure_views_user_id ON procedure_views(user_id);
CREATE INDEX idx_procedure_views_viewed_at ON procedure_views(viewed_at);
```

### Sporing ved åpning av prosedyre

Når en bruker åpner `ProcedureViewer`, logges en visning:

```typescript
// I ProcedureViewer.tsx - useEffect ved lasting
useEffect(() => {
  if (procedure?.id && user?.id) {
    // Logg visning
    supabase.from('procedure_views').insert({
      procedure_id: procedure.id,
      user_id: user.id,
    });
    
    // Spor varighet ved unmount
    const startTime = Date.now();
    return () => {
      const duration = Math.round((Date.now() - startTime) / 1000);
      supabase.from('procedure_views')
        .update({ duration_seconds: duration })
        .eq('procedure_id', procedure.id)
        .eq('user_id', user.id)
        .order('viewed_at', { ascending: false })
        .limit(1);
    };
  }
}, [procedure?.id, user?.id]);
```

### Visningsstatistikk i UI

```text
PROSEDYRE-ADMINISTRASJON (Rapporter)
+-----------------------------------------------------------+
| Prosedyre              | Visninger | Unike brukere | Fullf.|
|------------------------|-----------|---------------|-------|
| HMS Grunnkurs          | 156       | 42            | 38    |
| Kranfører-prosedyre    | 89        | 28            | 25    |
| Førstehjelp            | 45        | 45            | 12    |
+-----------------------------------------------------------+

Merk: "Førstehjelp" har mange visninger men få fullføringer
      → Kan indikere problem med prosedyren
```

---

## Del 2: Dashboard-struktur

### For HMS/Basesjefer (Opplæringsoversikt)

Allerede delvis implementert, men legger til visningsdata:

```text
NØKKELTALL
+-----------+-----------+-----------+-----------+-----------+
| Aktive    | Prosedyrer| Prosedyre | Kurs      | Forfalt   |
| brukere   | fullført  | visninger | bestått   | frister   |
| 42        | 128       | 456       | 67        | 3 ⚠️       |
+-----------+-----------+-----------+-----------+-----------+
                         ↑ NYTT
```

### For System-admin (Brukerstatistikk)

Ny side som inkluderer visningsdata:

```text
AKTIVITETSOVERSIKT
+-----------+-----------+-----------+-----------+
| Unike     | Totale    | Prosedyre | Gj.snitt  |
| brukere   | sesjoner  | visninger | lesetid   |
| 25        | 89        | 456       | 4m 32s    |
+-----------+-----------+-----------+-----------+
```

---

## Del 3: Ny Navigasjonsstruktur

```text
NAVIGASJON (alle brukere)
├── Dashboard
├── Prosedyrer
├── Opplæring
│   ├── Aktive kurs
│   └── Min opplæringshistorikk
└── Min profil

ADMINISTRASJON (supervisor/HMS-ansvarlig)
├── Prosedyrer (administrer)
├── Kurs
├── Grupper
├── Opplæringsoversikt  ← KPI inkl. visninger
└── Rapporter           ← Detaljert visningsdata

SYSTEM (kun admin) ⚙️
├── Brukere
├── Lokasjoner
├── Roller
├── Endringslogg
├── Brukerstatistikk    ← NY (inkl. aggregert visningsdata)
├── AI-tilgang          ← NY (for fremtiden)
└── Innstillinger
```

---

## Del 4: Database-endringer

### Nye Tabeller

```sql
-- 1. Prosedyre-visninger
CREATE TABLE procedure_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  procedure_id UUID REFERENCES procedures(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  viewed_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  duration_seconds INTEGER,
  completed_read BOOLEAN DEFAULT false
);

-- RLS
ALTER TABLE procedure_views ENABLE ROW LEVEL SECURITY;

-- Brukere kan legge til egne visninger
CREATE POLICY "Users can insert own views"
ON procedure_views FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- Brukere kan se egne visninger
CREATE POLICY "Users can view own views"
ON procedure_views FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Admin/Supervisors kan se alle visninger i sine sites
CREATE POLICY "Managers can view procedure views"
ON procedure_views FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM procedures p
    WHERE p.id = procedure_views.procedure_id
    AND can_manage_procedures(auth.uid(), p.site_id)
  )
);

-- 2. AI-tilgang (for fremtidig bruk)
CREATE TABLE ai_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  enabled BOOLEAN DEFAULT false,
  features TEXT[] DEFAULT '{}',
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE ai_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage AI access"
ON ai_access FOR ALL TO authenticated
USING (public.is_admin(auth.uid()));
```

---

## Del 5: Nye og Oppdaterte Filer

### Nye Filer

| Fil | Beskrivelse |
|-----|-------------|
| `supabase/migrations/xxx_procedure_views_and_system.sql` | Database-tabeller |
| `src/hooks/useProcedureViews.ts` | Hente og logge visninger |
| `src/hooks/useUserStats.ts` | Brukerstatistikk for admin |
| `src/hooks/useAIAccess.ts` | AI-tilgang CRUD |
| `src/pages/system/UserStats.tsx` | Brukerstatistikk dashboard |
| `src/pages/system/AIAccess.tsx` | AI-tilgangskontroll |

### Oppdaterte Filer

| Fil | Endring |
|-----|---------|
| `src/pages/ProcedureViewer.tsx` | Legg til visningssporing |
| `src/pages/admin/AdminReports.tsx` | Legg til visningsstatistikk-kolonne |
| `src/hooks/useReportData.ts` | Inkluder visningsdata |
| `src/pages/training/TrainingOverview.tsx` | Legg til visningsmetrikk |
| `src/components/layout/Sidebar.tsx` | Separér Administrasjon/System |
| `src/components/layout/MobileNav.tsx` | Samme oppdeling |
| `src/hooks/useRoleAccess.ts` | Legg til `canAccessSystem` |
| `src/App.tsx` | Nye /system/* ruter |

---

## Del 6: Tekniske Detaljer

### useProcedureViews Hook

```typescript
// Logg en visning
export function useLogProcedureView() {
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (procedureId: string) => {
      const { error } = await supabase.from('procedure_views').insert({
        procedure_id: procedureId,
        user_id: user!.id,
      });
      if (error) throw error;
    },
  });
}

// Hent visningsstatistikk per prosedyre (for rapporter)
export function useProcedureViewStats(siteId: string | null) {
  return useQuery({
    queryKey: ['procedure_view_stats', siteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('procedure_views')
        .select(`
          procedure_id,
          procedures!inner(id, title, site_id)
        `)
        .eq('procedures.site_id', siteId!);
      
      if (error) throw error;
      
      // Aggreger per prosedyre
      const stats = data.reduce((acc, view) => {
        const id = view.procedure_id;
        if (!acc[id]) {
          acc[id] = {
            procedureId: id,
            procedureTitle: view.procedures.title,
            totalViews: 0,
            uniqueUsers: new Set(),
          };
        }
        acc[id].totalViews++;
        acc[id].uniqueUsers.add(view.user_id);
        return acc;
      }, {});
      
      return Object.values(stats).map(s => ({
        ...s,
        uniqueUsers: s.uniqueUsers.size,
      }));
    },
    enabled: !!siteId,
  });
}
```

### useUserStats Hook

```typescript
export interface UserStats {
  uniqueUsers: number;
  totalSessions: number;
  totalProcedureViews: number;
  avgReadDuration: number;
  proceduresCompleted: number;
  coursesCompleted: number;
  dailyActivity: { date: string; users: number; views: number; completions: number }[];
  siteAdoption: { siteId: string; siteName: string; totalUsers: number; activeUsers: number; rate: number }[];
  topUsers: { userId: string; userName: string; views: number; completions: number; courses: number }[];
}

export function useUserStats(days = 7) {
  return useQuery({
    queryKey: ['user_stats', days],
    queryFn: async () => {
      const startDate = subDays(new Date(), days);
      
      // Prosedyre-visninger
      const { data: views } = await supabase
        .from('procedure_views')
        .select('user_id, viewed_at, duration_seconds')
        .gte('viewed_at', startDate.toISOString());
      
      // Prosedyre-fullføringer
      const { data: procCompletions } = await supabase
        .from('procedure_completions')
        .select('user_id, completed_at')
        .gte('completed_at', startDate.toISOString());
      
      // Kurs-fullføringer
      const { data: courseCompletions } = await supabase
        .from('training_assignments')
        .select('user_id, completed_at')
        .eq('passed', true)
        .gte('completed_at', startDate.toISOString());
      
      // Beregn statistikk...
      const uniqueUsers = new Set([
        ...(views?.map(v => v.user_id) || []),
        ...(procCompletions?.map(c => c.user_id) || []),
      ]).size;
      
      const totalProcedureViews = views?.length || 0;
      const avgDuration = views?.reduce((sum, v) => sum + (v.duration_seconds || 0), 0) / totalProcedureViews || 0;
      
      return {
        uniqueUsers,
        totalProcedureViews,
        avgReadDuration: Math.round(avgDuration),
        proceduresCompleted: procCompletions?.length || 0,
        coursesCompleted: courseCompletions?.length || 0,
        // ... mer statistikk
      };
    },
  });
}
```

---

## Del 7: Visning i UI

### I AdminReports (for HMS/Basesjefer)

Ny kolonne i prosedyre-tabellen:

```text
| Prosedyre         | Visninger | Unike | Fullført | Rate |
|-------------------|-----------|-------|----------|------|
| HMS Grunnkurs     | 156       | 42    | 38       | 90%  |
| Kranfører         | 89        | 28    | 25       | 89%  |
| Førstehjelp ⚠️    | 45        | 45    | 12       | 27%  |
                                         ↑ Lav fullføringsrate
```

### I UserStats (for System-admin)

```text
PROSEDYRE-ENGASJEMENT
+---------------------------+---------------------------+
| Visninger per dag         | Gjennomsnittlig lesetid   |
| [Linjegraf 30 dager]      | 4m 32s                    |
+---------------------------+---------------------------+

MEST LESTE PROSEDYRER
1. HMS Grunnkurs - 156 visninger
2. Kranfører-prosedyre - 89 visninger
3. Førstehjelp - 45 visninger
```

---

## Del 8: Implementeringsrekkefølge

1. **Database-migrering** - procedure_views og ai_access tabeller
2. **useProcedureViews hook** - Logging og statistikk
3. **ProcedureViewer-oppdatering** - Spor visninger ved åpning
4. **AdminReports-oppdatering** - Legg til visningskolonner
5. **useUserStats hook** - Aggregert statistikk
6. **UserStats-side** - System-admin dashboard
7. **Sidebar-oppdatering** - Separér Administrasjon/System
8. **TrainingOverview-forbedring** - Inkluder visningsmetrikk
9. **App.tsx ruting** - Nye /system/* paths

---

## Del 9: Verdi for Organisasjonen

### For HMS-ansvarlige og Basesjefer

| Metrikk | Formål |
|---------|--------|
| Prosedyre-visninger | Se at prosedyrer faktisk blir lest |
| Unike lesere | Sjekk at alle har lest viktige prosedyrer |
| Visning vs fullføring | Identifisere problemprosedyrer |
| Trender over tid | Følge opp etter oppdateringer |

### For Ledelse/Digitaliseringsavdeling

| Metrikk | Formål |
|---------|--------|
| Totale visninger | Bevise at systemet brukes aktivt |
| Gjennomsnittlig lesetid | Vise at folk faktisk leser |
| Daglig aktivitet | Demonstrere kontinuerlig bruk |
| Mest leste prosedyrer | Identifisere viktigst innhold |

### For Revisjon/Audit

| Metrikk | Formål |
|---------|--------|
| Hvem har lest hva | Sporbar dokumentasjon |
| Tidspunkt for visninger | Komplett revisjonsspor |
| Lesetid | Bevis på faktisk gjennomlesing |

---

## Resultat Etter Implementering

- **Prosedyre-visningssporing** med tidsstempel og varighet
- **Tydelig separasjon** mellom Administrasjon (operasjonelt) og System (admin)
- **HMS-dashboards** med KPI-er inkludert visningsdata
- **Brukerstatistikk** for å bevise digitaliseringsverdi
- **Rapporter** med visninger vs fullføringer for å identifisere problemer
- **AI-tilgang** klar for fremtidige funksjoner
- **Komplett audit-trail** for alle prosedyre-interaksjoner

