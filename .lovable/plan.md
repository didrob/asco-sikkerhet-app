

# Prosedyreoversikt med Statistikk og Drill-down

## Problemanalyse

Nåværende prosedyreside viser kun en enkel liste. Det mangler:

| Mangler | Behov |
|---------|-------|
| **Antall prosedyrer** | Hvor mange prosedyrer finnes? |
| **Publiseringsstatus** | Hvor mange er publisert vs utkast? |
| **Fullføringsgrad** | Hvor mange brukere har fullført? |
| **Sist oppdatert** | Hvilke prosedyrer er nylig oppdatert? |
| **Min progresjon** | Personlig oversikt over fullførte/pågående |

---

## Foreslått Løsning

### For vanlige brukere (`/procedures`)

Legg til KPI-kort øverst som viser personlig status:

```text
PROSEDYRER
+-----------------------------------------------------------+
|  Mine prosedyrer  |  Fullført  |  Pågående  |  Ikke startet |
|       8           |     5      |     2      |       1       |
|                   |   62.5%    |            |               |
+-----------------------------------------------------------+

[Liste over prosedyrer som i dag]
```

### For HMS/admin (`/procedures/manage`)

Legg til en admin-oversikt med tabs og drill-down (inspirert av opplæringsoversikten):

```text
ADMINISTRER PROSEDYRER
+-----------------------------------------------------------+
| Totalt | Publisert | Utkast | Fullføringer | Pågående |
|   12   |     8     |   4    |     156      |    23    |
+-----------------------------------------------------------+

[Prosedyreoversikt] [Fullføringsgrad] [Sist oppdatert]

PROSEDYREOVERSIKT (klikkbar for detaljer)
+---------------------------------------------------------------+
| Prosedyre         | Status     | Fullført | Rate   | Oppdatert |
|-------------------|------------|----------|--------|-----------|
| HMS Introduksjon  | Publisert  | 45/52    | 87%    | I dag     |
| Brannøvelse       | Publisert  | 38/52    | 73%    | 3 dager   |
| Førstehjelpskurs  | Utkast     | —        | —      | 1 uke     |
+---------------------------------------------------------------+
```

---

## Del 1: KPI-kort for vanlige brukere

Legger til statistikk-kort på `/procedures`-siden:

```text
+----------------+----------------+----------------+----------------+
| Prosedyrer     | Fullført       | Pågående       | Ikke startet   |
| tilgjengelig   |                |                |                |
|      8         |     5 (62%)    |      2         |      1         |
+----------------+----------------+----------------+----------------+
```

- Bruker eksisterende `useProcedureStats` hook
- Viser personlig progresjon (din status)
- Fullføringsrate i prosent

---

## Del 2: Utvidet Admin-oversikt

For HMS-ansvarlige legges til:

### KPI-kort (systemomfattende)
- **Totalt prosedyrer** i systemet
- **Publiserte** vs **Utkast**
- **Totale fullføringer** (alle brukere)
- **Gjennomsnittlig fullføringsrate**

### Tabs
1. **Prosedyrer** - Liste med handlingsknapper (eksisterende)
2. **Fullføringsgrad** - Per prosedyre med drill-down
3. **Sist oppdatert** - Sortert etter oppdateringsdato

### Drill-down Sheet
Ved klikk på en prosedyre vises:
- Hvem har fullført
- Hvem er pågående
- Hvem har ikke startet
- Siste aktivitet

---

## Del 3: Nye Filer

| Fil | Beskrivelse |
|-----|-------------|
| `src/hooks/useProcedureOverview.ts` | Hook for admin-statistikk per prosedyre |
| `src/components/procedure/ProcedureStatsCards.tsx` | KPI-kort for bruker |
| `src/components/procedure/AdminProcedureStats.tsx` | KPI-kort for admin |
| `src/components/procedure/ProcedureCompletionTable.tsx` | Tabell med fullføringsgrad |
| `src/components/procedure/ProcedureDetailSheet.tsx` | Drill-down for en prosedyre |

### Oppdaterte Filer

| Fil | Endring |
|-----|---------|
| `src/pages/Procedures.tsx` | Legge til KPI-kort øverst |
| `src/pages/ManageProcedures.tsx` | Legge til admin-statistikk og tabs |

---

## Del 4: Teknisk Implementering

### useProcedureOverview Hook

```typescript
export interface ProcedureOverviewStats {
  procedureId: string;
  title: string;
  status: 'published' | 'draft' | 'archived';
  updatedAt: string;
  totalUsers: number;       // Brukere på siten
  completedCount: number;   // Antall fullføringer
  inProgressCount: number;  // Antall pågående
  completionRate: number;   // Prosent
}

export function useProcedureOverview(siteId?: string) {
  return useQuery({
    queryKey: ['procedure-overview', siteId],
    queryFn: async () => {
      // Hent prosedyrer med fullførings- og progress-tall
      // Beregn rates per prosedyre
    }
  });
}
```

### ProcedureStatsCards (for vanlige brukere)

```typescript
function ProcedureStatsCards({ stats }: { stats: ProcedureStats }) {
  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      <StatCard title="Tilgjengelig" value={stats.total} icon={FileText} />
      <StatCard title="Fullført" value={stats.completed} icon={CheckCircle2} />
      <StatCard title="Pågående" value={stats.inProgress} icon={Clock} />
      <StatCard title="Ikke startet" value={stats.notStarted} icon={AlertCircle} />
    </div>
  );
}
```

---

## Del 5: Visuell Design

### Bruker-siden (`/procedures`)

```text
+-----------------------------------------------------------+
| Prosedyrer                                                |
| Se og fullfør sikkerhetsprosedyrer tildelt din rolle      |
+-----------------------------------------------------------+

+----------+----------+----------+----------+
| Tilgj.   | Fullført | Pågående | Ikke     |
|   8      |  5 (62%) |    2     | startet 1|
+----------+----------+----------+----------+

[Prosedyrekort 1]
[Prosedyrekort 2]
...
```

### Admin-siden (`/procedures/manage`)

```text
+-----------------------------------------------------------+
| Administrer prosedyrer              [+ Ny prosedyre]      |
| Opprett, rediger og publiser sikkerhetsprosedyrer         |
+-----------------------------------------------------------+

+----------+----------+----------+----------+----------+
| Totalt   | Publisert| Utkast   | Fullf.   | Snittrate|
|   12     |    8     |    4     |   156    |   78%    |
+----------+----------+----------+----------+----------+

[Prosedyrer] [Fullføringsgrad] [Sist oppdatert]

(Tab-innhold med tabell + handlinger)
```

---

## Del 6: Implementeringsrekkefølge

1. **useProcedureOverview hook** - Admin-statistikk
2. **ProcedureStatsCards** - KPI-kort for brukere
3. **Procedures.tsx oppdatering** - Legge til kort øverst
4. **AdminProcedureStats** - KPI-kort for admin
5. **ProcedureCompletionTable** - Fullføringsgrad per prosedyre
6. **ProcedureDetailSheet** - Drill-down
7. **ManageProcedures.tsx oppdatering** - Tabs og statistikk

---

## Resultat

- **Vanlige brukere**: Ser sin egen progresjon med 4 KPI-kort
- **HMS/admin**: Får full oversikt over alle prosedyrer med:
  - Systemstatistikk (totalt, publisert, utkast)
  - Fullføringsgrad per prosedyre
  - Drill-down til hvem som har fullført
  - Sist oppdatert-visning
- **Konsistent design**: Samme stil som opplæringsoversikten

