

# Implementering Del 4 - Profilfix, Rapporter og Admin-verktøy

## Oversikt
Denne delen fokuserer på å fikse profil-siden, legge til rapportering for admins/supervisors, og implementere funksjonelle innstillinger.

---

## Del 1: Profilside-fix (Kritisk bug)

**Problem**: Profil-skjemaet laster ikke eksisterende data fordi `useState()` brukes feil som en effekt på linje 26.

**Nåværende kode (feil)**:
```typescript
useState(() => {
  if (profile) {
    setFormData({...});
  }
});
```

**Korrekt kode**:
```typescript
useEffect(() => {
  if (profile) {
    setFormData({
      full_name: profile.full_name || '',
      job_title: profile.job_title || '',
      department: profile.department || '',
    });
  }
}, [profile]);
```

---

## Del 2: Admin Rapporter

### Ny Side: `src/pages/admin/AdminReports.tsx`

Rapporterings-dashboard for admins og supervisors med:

| Seksjon | Innhold |
|---------|---------|
| Fullføringsrate | Prosent fullførte prosedyrer per site |
| Brukerstatistikk | Hvem har fullført/ikke fullført |
| Tidslinje | Fullføringer over tid |
| Eksport | Last ned data som CSV |

### Ny Hook: `src/hooks/useReportData.ts`

Henter aggregert data fra:
- `procedures` - liste over prosedyrer
- `procedure_completions` - fullføringsinformasjon
- `profiles` - brukerinformasjon

### Komponenter

| Fil | Beskrivelse |
|-----|-------------|
| `CompletionRateChart.tsx` | Søylediagram med fullføringsrate |
| `UserCompletionTable.tsx` | Tabell med brukere og status |
| `ReportExportButton.tsx` | Eksporter til CSV |

---

## Del 3: Innstillinger-funksjonalitet

### Oppdater `AdminSettings.tsx`

| Seksjon | Funksjonalitet |
|---------|----------------|
| **Utseende** | Tema-valg (bygger på ThemeToggle) |
| **Data** | CSV-eksport av prosedyrer og fullføringer |
| **Varsler** | Placeholder med info om fremtidig funksjon |
| **Sikkerhet** | Link til Supabase Auth for passordbytting |

### CSV-eksport

```typescript
function exportToCSV(data: any[], filename: string) {
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(row => Object.values(row).join(','));
  const csv = [headers, ...rows].join('\n');
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
}
```

---

## Del 4: Navigasjon-oppdatering

### Legg til Rapporter i Sidebar og MobileNav

```text
Administrasjon
├── Administrer prosedyrer (supervisor+)
├── Rapporter ← NY (supervisor+)
├── Sites (admin)
├── Brukere (admin)
└── Innstillinger (admin)
```

---

## Filendringer

| Fil | Handling | Beskrivelse |
|-----|----------|-------------|
| `src/pages/Profile.tsx` | Oppdater | Fix useEffect for å laste profildata |
| `src/pages/admin/AdminReports.tsx` | Ny | Rapporterings-side |
| `src/hooks/useReportData.ts` | Ny | Hook for å hente rapportdata |
| `src/pages/admin/AdminSettings.tsx` | Oppdater | Funksjonelle innstillinger |
| `src/components/layout/Sidebar.tsx` | Oppdater | Legg til Rapporter-lenke |
| `src/components/layout/MobileNav.tsx` | Oppdater | Legg til Rapporter-lenke |
| `src/App.tsx` | Oppdater | Ny rute for /admin/reports |

---

## Tekniske Detaljer

### useReportData Hook

```typescript
interface CompletionStats {
  procedureId: string;
  procedureTitle: string;
  totalUsers: number;
  completedCount: number;
  completionRate: number;
}

interface UserCompletion {
  userId: string;
  userName: string;
  proceduresCompleted: number;
  proceduresTotal: number;
  lastCompletion: string | null;
}

export function useCompletionStats(siteId: string) {
  return useQuery({
    queryKey: ['completion-stats', siteId],
    queryFn: async () => {
      // Hent prosedyrer, brukere og fullføringer
      // Kalkuler statistikk
    },
  });
}

export function useUserCompletions(siteId: string) {
  return useQuery({
    queryKey: ['user-completions', siteId],
    queryFn: async () => {
      // Hent bruker-spesifikk fullføringsdata
    },
  });
}
```

### AdminReports Komponent

```text
AdminReports
├── Header med tittel og site-velger
├── Stats-kort (totale tall)
│   ├── Totalt fullført
│   ├── Gjennomsnittlig fullføringsrate
│   └── Brukere med 100% fullført
├── Fullføringsrate-diagram (Recharts)
├── Brukertabell med status
└── Eksport-knapper
```

---

## Implementeringsrekkefølge

1. **Profilfix** - Kritisk bug, rask fix
2. **useReportData hook** - Data-grunnlag for rapporter
3. **AdminReports side** - Rapporterings-UI
4. **Navigasjon-oppdatering** - Legg til Rapporter-lenke
5. **Innstillinger** - Funksjonelle innstillinger med eksport

---

## Tilgangskontroll

| Side | admin | supervisor | operator | viewer |
|------|-------|------------|----------|--------|
| Rapporter | Full tilgang (alle sites) | Kun egen site | Ingen | Ingen |
| Innstillinger | Ja | Nei | Nei | Nei |

Rapporter-siden bruker eksisterende `useCanManageProcedures` hook for å sjekke tilgang til site-data.

---

## Resultat Etter Implementering

- Profilsiden laster eksisterende data korrekt
- Admins og supervisors har tilgang til rapportering
- Fullføringsstatistikk per prosedyre og bruker
- CSV-eksport av data
- Funksjonelle innstillinger for tema og eksport
- Rapporter-lenke i sidebar og mobil-meny

