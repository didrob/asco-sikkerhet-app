

# Forbedret Dashboard-layout og Diagrammer

## Oversikt

Basert på referansebildet skal vi redesigne dashboard-layouten til å være mer profesjonell med:

1. **Kombinert velkomstheader med periode-velger** - Inspirert av referansen
2. **Horisontale KPI-kort** i én rad med trend-indikatorer
3. **AreaChart** for tidslinjevisning (fylte områder som i referansen)
4. **PieChart** for statusfordeling
5. **BarChart** for kategorifordeling

---

## Del 1: Ny Dashboard-header

Erstatter den nåværende `WelcomeCard` med en kompakt header som inkluderer periode-velger:

```text
+--------------------------------------------------------------+
| Velkommen tilbake, [Fornavn]!              Siste 7 dager  ▼  |
| [Site] - Her er en oversikt over din aktivitet  📅 24-30 jan |
+--------------------------------------------------------------+
```

---

## Del 2: KPI-kort med trendindikator

Redesign av statistikk-kortene med:
- **Større tall** med fargekodet verdi
- **Trend-piler** (↗ +15% vs forrige periode)
- **Kompakt layout** - 5 kort i én rad

```text
+----------+----------+----------+----------+----------+
| Totalt   | Fullført | Påbegynt | Visninger| Gj.snitt |
| antall   |          |          |          | lesetid  |
|   16     |    9     |    4     |   156    |   4m 32s |
| ↗ +167%  | ↗ +80%   | — 0%     | ↗ +45%   | ↗ +22%   |
+----------+----------+----------+----------+----------+
```

---

## Del 3: Aktivitet over tid - AreaChart

Bytte fra LineChart til AreaChart med gradient-fyll (som i referansen):

```text
+--------------------------------------------------------------+
| Aktivitet over tid                                           |
| Visninger og fullføringer per dag                            |
|                                                              |
|     [AreaChart med gradient-fyll]                            |
|     ⬤ Nåværende periode    ○ Forrige periode                 |
+--------------------------------------------------------------+
```

---

## Del 4: To-kolonne layout med PieChart og BarChart

```text
+---------------------------+---------------------------+
| Status-fordeling          | Aktivitet per type        |
| Fordeling av prosedyrer   | Fordeling per kategori    |
|                           |                           |
|     [PieChart]            |     [BarChart]            |
|   ⬤ Fullført 56%          |   Prosedyrer |████| 65    |
|   ⬤ Påbegynt 24%          |   Kurs       |██████| 89  |
|   ⬤ Ikke startet 20%      |   Visninger  |████| 156   |
+---------------------------+---------------------------+
```

---

## Del 5: Fil-endringer

### Oppdaterte Filer

| Fil | Endring |
|-----|---------|
| `src/pages/Index.tsx` | Ny layout med periode-velger og kompakt header |
| `src/components/dashboard/WelcomeCard.tsx` | Redesign til kompakt header med periode |
| `src/components/dashboard/UserStats.tsx` | Trenddata og forbedrede kort |
| `src/components/dashboard/AdminDashboardCards.tsx` | Samme stil |
| `src/components/dashboard/SupervisorDashboardCards.tsx` | Samme stil |
| `src/pages/system/UserStats.tsx` | AreaChart, PieChart, forbedret layout |

### Nye Komponenter

| Fil | Beskrivelse |
|-----|-------------|
| `src/components/dashboard/DashboardHeader.tsx` | Kombinert header med periode-velger |
| `src/components/dashboard/StatCardWithTrend.tsx` | KPI-kort med trend-indikator |
| `src/components/dashboard/ActivityChart.tsx` | AreaChart med gradient |
| `src/components/dashboard/StatusPieChart.tsx` | PieChart for statusfordeling |

---

## Del 6: Tekniske Detaljer

### AreaChart med Gradient

```typescript
import { AreaChart, Area, defs, linearGradient } from 'recharts';

<AreaChart data={data}>
  <defs>
    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
    </linearGradient>
  </defs>
  <Area 
    type="monotone" 
    dataKey="views" 
    stroke="hsl(var(--primary))" 
    fill="url(#colorViews)" 
  />
</AreaChart>
```

### PieChart for Status

```typescript
import { PieChart, Pie, Cell } from 'recharts';

const COLORS = ['hsl(142, 76%, 36%)', 'hsl(217, 91%, 60%)', 'hsl(215, 16%, 47%)'];

<PieChart>
  <Pie
    data={statusData}
    innerRadius={60}
    outerRadius={80}
    dataKey="value"
    label
  >
    {statusData.map((_, index) => (
      <Cell key={index} fill={COLORS[index % COLORS.length]} />
    ))}
  </Pie>
</PieChart>
```

### StatCard med Trend

```typescript
interface StatCardWithTrendProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  trend?: number; // +15 = opp 15%, -10 = ned 10%
  trendLabel?: string;
  valueColor?: string;
}
```

---

## Del 7: Visuell Sammenligning

### Før (nåværende)

```text
+-------------------------------+
| God morgen, [Navn]!           |
| Velkommen til [Site]          |
| [Lang beskrivelse...]         |
+-------------------------------+

+-------+-------+-------+-------+
| Total | Fullf | Påbeg | Ikke  |
|  12   |   8   |   2   |   2   |
+-------+-------+-------+-------+

[Prosedyreliste nedenfor]
```

### Etter (ny design)

```text
+---------------------------------------------------+-------+
| Velkommen tilbake, [Fornavn]!      [7 dager ▼] 📅 |       |
| [Site] - Her er en oversikt       24-30 jan 2026  |       |
+---------------------------------------------------+-------+

+---------+---------+---------+---------+---------+
| Total   | Fullført| Påbegynt| Visning.| Lesetid |
|   16    |    9    |    4    |   156   |  4m 32s |
| ↗+167%  | ↗+80%   | — 0%    | ↗+45%   | ↗+22%   |
+---------+---------+---------+---------+---------+

+---------------------------------------------------+
| Aktivitet over tid                                |
| [AreaChart med gradient - nåværende vs forrige]   |
+---------------------------------------------------+

+------------------------+------------------------+
| Status-fordeling       | Aktivitet per type     |
| [Donut PieChart]       | [Horisontalt BarChart] |
+------------------------+------------------------+
```

---

## Del 8: Implementeringsrekkefølge

1. **StatCardWithTrend** - Ny komponent for KPI-kort med trend
2. **DashboardHeader** - Kompakt header med periode-velger
3. **ActivityChart** - AreaChart med gradient
4. **StatusPieChart** - Donut chart for statusfordeling
5. **Oppdater Index.tsx** - Ny layout med alle komponenter
6. **Oppdater UserStats.tsx** (dashboard) - Bruk nye komponenter
7. **Oppdater system/UserStats.tsx** - Samme stil for admin-dashboard

---

## Resultat

- **Profesjonell utseende** som matcher referansebildet
- **Trend-indikatorer** viser endring over tid
- **AreaChart** med gradient-fyll for tidslinjer
- **PieChart** for statusfordeling
- **Kompakt header** med integrert periode-velger
- **Konsistent stil** på tvers av alle dashboards

