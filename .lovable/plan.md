

# Forbedret Opplæringsoversikt med Drill-down og Purring

## Problemanalyse

Nåværende oversikt gir god statistikk på høyt nivå, men mangler:

| Mangler | Problem |
|---------|---------|
| **Kurs-spesifikk visning** | Kan ikke se detaljer for hvert enkelt kurs |
| **Purring-funksjon** | Ingen mulighet til å sende påminnelse til forsinket |
| **Utsendelsesstatistikk** | Vet ikke hvor mange som har mottatt invitasjon |
| **Trend-data** | Ingen sammenligning med forrige uke/måned |
| **Handlingsknapper** | Må navigere bort for å gjøre noe |
| **Detaljert brukervisning** | Kan ikke klikke for å se én brukers status |

---

## Ny Struktur

```text
OPPLÆRINGSOVERSIKT
+-----------------------------------------------------------+
| Header: "Opplæringsoversikt" | Periode: [7 dager ▼] | Lokasjon: [Alle ▼] |
+-----------------------------------------------------------+

KPI-KORT (med trend)
+----------+----------+----------+----------+----------+----------+
| Kurs     | Sendt ut | Fullført | Påbegynt | Forfalt  | Purring  |
| aktive   | til      |          |          |          | sendt    |
|   8      |   156    |   89     |   34     |   12     |   5      |
| ↗ +2     | ↗ +23    | ↗ +15    | — 0      | ↓ -3     | ↗ +5     |
+----------+----------+----------+----------+----------+----------+

TABS
+-----------------------------------------------------------+
| [Kursoversikt] | [Forfalte] | [Pågående] | [Compliance]    |
+-----------------------------------------------------------+
```

---

## Del 1: Kursoversikt-fane (Ny)

En tabell med alle kurs og deres status:

```text
KURSOVERSIKT
+---------------------------------------------------------------+
| Kurs            | Sendt | Fullført | Pågående | Forfalt | ... |
|-----------------|-------|----------|----------|---------|-----|
| HMS Grunnkurs   | 45    | 38 (84%) | 4        | 3       | [→] |
| Førstehjelp     | 32    | 12 (38%) | 8        | 12 ⚠️   | [→] |
| Kranfører       | 24    | 22 (92%) | 2        | 0       | [→] |
+---------------------------------------------------------------+
              Klikk for å se detaljer per kurs
```

### Drill-down til kurs-detaljer

Ved klikk på et kurs åpnes en Dialog/Sheet med:

```text
+---------------------------------------------------------------+
| HMS Grunnkurs                                     [X]         |
|---------------------------------------------------------------|
| Sendt: 45 | Fullført: 38 (84%) | Pågående: 4 | Forfalt: 3     |
|---------------------------------------------------------------|
| FULLFØRT (38)                                                 |
| ✓ Ola Nordmann    | 95% | 28. jan 2026                        |
| ✓ Kari Hansen     | 88% | 27. jan 2026                        |
| ...                                                           |
|---------------------------------------------------------------|
| FORFALT (3)                                   [Send purring]  |
| ⚠ Per Olsen       | 5 dager over | □                         |
| ⚠ Anne Berg       | 3 dager over | □                         |
|                                    [Send til valgte]          |
+---------------------------------------------------------------+
```

---

## Del 2: Forfalte-fane (Forbedret)

Eksisterende forfalt-liste, men med handlingsknapper:

```text
FORFALTE TILDELINGER
+---------------------------------------------------------------+
| [ ] | Bruker       | Kurs           | Dager over | Handling   |
|-----|--------------|----------------|------------|------------|
| [✓] | Per Olsen    | HMS Grunnkurs  | 5 dager    | [Purring]  |
| [✓] | Anne Berg    | HMS Grunnkurs  | 3 dager    | [Purring]  |
| [ ] | Ole Hansen   | Førstehjelp    | 12 dager   | [Purring]  |
+---------------------------------------------------------------+
| [Send purring til 2 valgte]                                   |
+---------------------------------------------------------------+
```

### Purring-dialog

```text
+-----------------------------------------------+
| Send påminnelse                               |
|-----------------------------------------------|
| Mottakere: 2 brukere                          |
|                                               |
| [ ] Per Olsen - per@example.com               |
| [ ] Anne Berg - anne@example.com              |
|                                               |
| Kurs: HMS Grunnkurs                           |
| Forfalt: 3-5 dager                            |
|                                               |
| Meldingsmal:                                  |
| [Påminnelse: Du har forfalt opplæring...]     |
|                                               |
| [Avbryt]              [Åpne e-postklient]     |
+-----------------------------------------------+
```

---

## Del 3: Pågående-fane (Ny)

Viser brukere som har startet men ikke fullført:

```text
PÅGÅENDE OPPLÆRING
+---------------------------------------------------------------+
| Bruker          | Kurs           | Startet    | Frist         |
|-----------------|----------------|------------|---------------|
| Lisa Andersen   | HMS Grunnkurs  | 3 dager    | 4 dager igjen |
| Tom Eriksen     | Førstehjelp    | 1 dag      | 7 dager igjen |
+---------------------------------------------------------------+
```

---

## Del 4: Database-endringer

Legger til sporing av purringer:

```sql
-- Ny tabell for å loggføre sendte påminnelser
CREATE TABLE training_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES training_assignments(id) ON DELETE CASCADE NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  sent_by UUID REFERENCES auth.users(id),
  reminder_type TEXT DEFAULT 'overdue'  -- 'overdue', 'upcoming', 'manual'
);

-- Indeks
CREATE INDEX idx_training_reminders_assignment ON training_reminders(assignment_id);
CREATE INDEX idx_training_reminders_sent_at ON training_reminders(sent_at);

-- RLS
ALTER TABLE training_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers can manage reminders"
ON training_reminders FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM training_assignments a
    JOIN training_courses c ON c.id = a.course_id
    WHERE a.id = training_reminders.assignment_id
    AND can_manage_procedures(auth.uid(), c.site_id)
  )
);
```

---

## Del 5: Nye og Oppdaterte Filer

### Nye Filer

| Fil | Beskrivelse |
|-----|-------------|
| `supabase/migrations/xxx_training_reminders.sql` | Reminder-tabell |
| `src/hooks/useTrainingReminders.ts` | CRUD for påminnelser |
| `src/components/training/CourseDetailSheet.tsx` | Drill-down for kurs |
| `src/components/training/ReminderDialog.tsx` | Dialog for å sende purring |
| `src/components/training/OverdueTable.tsx` | Tabell med handlinger |

### Oppdaterte Filer

| Fil | Endring |
|-----|---------|
| `src/pages/training/TrainingOverview.tsx` | Ny tabs-struktur, KPI med trend |
| `src/hooks/useTrainingOverview.ts` | Legge til kurs-statistikk og utsendelsesdata |
| `src/lib/email.ts` | Ny `generateReminderEmail()` funksjon |

---

## Del 6: Nye Hooks

### useTrainingReminders

```typescript
// Hent påminnelser for et kurs
export function useCourseReminders(courseId: string) {
  return useQuery({...});
}

// Send påminnelse
export function useSendReminder() {
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ assignmentIds }: { assignmentIds: string[] }) => {
      // 1. Logg påminnelse i database
      await supabase.from('training_reminders').insert(
        assignmentIds.map(id => ({
          assignment_id: id,
          sent_by: user!.id,
          reminder_type: 'overdue',
        }))
      );
      
      // 2. Returnér data for å åpne e-postklient
      return { assignmentIds };
    },
  });
}
```

### useCourseStats (ny)

```typescript
export interface CourseStats {
  courseId: string;
  courseTitle: string;
  totalSent: number;      // Antall tildelinger
  completed: number;      // Fullført
  inProgress: number;     // Påbegynt men ikke fullført
  overdue: number;        // Forfalt
  notStarted: number;     // Ikke startet
  remindersSent: number;  // Antall purringer
  completionRate: number;
}

export function useCourseStats(siteId?: string) {
  return useQuery({...});
}
```

---

## Del 7: UI-komponenter

### TrainingOverview med Tabs

```typescript
<Tabs defaultValue="courses">
  <TabsList>
    <TabsTrigger value="courses">Kursoversikt</TabsTrigger>
    <TabsTrigger value="overdue">
      Forfalte 
      {overdueCount > 0 && <Badge variant="destructive">{overdueCount}</Badge>}
    </TabsTrigger>
    <TabsTrigger value="inprogress">Pågående</TabsTrigger>
    <TabsTrigger value="compliance">Compliance</TabsTrigger>
  </TabsList>
  
  <TabsContent value="courses">
    <CourseStatsTable onSelectCourse={setSelectedCourse} />
  </TabsContent>
  
  <TabsContent value="overdue">
    <OverdueTable 
      assignments={overdueAssignments} 
      onSendReminder={handleSendReminder}
    />
  </TabsContent>
  
  {/* ... */}
</Tabs>
```

### CourseDetailSheet

```typescript
<Sheet open={!!selectedCourse} onOpenChange={() => setSelectedCourse(null)}>
  <SheetContent className="w-[600px]">
    <SheetHeader>
      <SheetTitle>{selectedCourse?.title}</SheetTitle>
    </SheetHeader>
    
    {/* KPI for dette kurset */}
    <div className="grid grid-cols-4 gap-2">
      <StatCard title="Sendt" value={stats.totalSent} />
      <StatCard title="Fullført" value={stats.completed} color="green" />
      <StatCard title="Pågående" value={stats.inProgress} color="blue" />
      <StatCard title="Forfalt" value={stats.overdue} color="red" />
    </div>
    
    {/* Accordion med brukerlister */}
    <Accordion>
      <AccordionItem value="completed">
        <AccordionTrigger>Fullført ({stats.completed})</AccordionTrigger>
        <AccordionContent>
          {/* Liste over fullførte brukere */}
        </AccordionContent>
      </AccordionItem>
      
      <AccordionItem value="overdue">
        <AccordionTrigger>
          Forfalt ({stats.overdue})
          <Button size="sm">Send purring</Button>
        </AccordionTrigger>
        <AccordionContent>
          {/* Liste med checkbox + purring-knapp */}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  </SheetContent>
</Sheet>
```

---

## Del 8: E-post for Purring

Utvider `src/lib/email.ts`:

```typescript
export function generateReminderEmail(
  courseTitle: string,
  daysOverdue: number,
  dueDate: Date,
  baseUrl?: string
): { subject: string; body: string } {
  const subject = `Påminnelse: Forfalt opplæring - ${courseTitle}`;
  
  let body = `Hei,\n\n`;
  body += `Dette er en påminnelse om at opplæringen "${courseTitle}" hadde frist `;
  body += `${dueDate.toLocaleDateString('nb-NO')} (${daysOverdue} dager siden).\n\n`;
  body += `Vennligst fullfør opplæringen så snart som mulig.\n\n`;
  body += `Logg inn her: ${baseUrl || window.location.origin}/training\n\n`;
  body += `Med vennlig hilsen,\nHMS-avdelingen`;
  
  return { subject, body };
}
```

---

## Del 9: Visuell Sammenligning

### Før (nåværende)

```text
+----------+----------+----------+----------+
| Tildelt  | Rate     | Bestått  | Forfalt  |
|   156    |   57%    |   89     |   12     |
+----------+----------+----------+----------+

[Lokasjonssammenligning]

+------------------+------------------+
| Forfalt frist    | Manglende opp.   |
| - Per (5 dager)  | - Ole (HMS-kurs) |
| - Anne (3 dager) | - Liv (Første.)  |
| (ingen handling) | (ingen handling) |
+------------------+------------------+
```

### Etter (ny)

```text
+--------+--------+--------+--------+--------+--------+
| Kurs   | Sendt  | Fullf. | Pågå.  | Forfalt| Purring|
|  8     |  156   |   89   |   34   |   12   |   5    |
| ↗ +2   | ↗ +23  | ↗ +15  |  — 0   |  ↓ -3  | ↗ +5   |
+--------+--------+--------+--------+--------+--------+

[Kursoversikt] [Forfalte (12)] [Pågående] [Compliance]

KURSOVERSIKT (klikkbar)
+--------------------------------------------------------+
| Kurs           | Sendt | Fullført | Forfalt | Handling |
| HMS Grunnkurs  |  45   |  38 (84%)|    3    |  [→]     |
| Førstehjelp ⚠️  |  32   |  12 (38%)|   12    |  [→]     |
+--------------------------------------------------------+
              Klikk for å drille ned + sende purring
```

---

## Del 10: Implementeringsrekkefølge

1. **Database-migrering** - training_reminders tabell
2. **useCourseStats hook** - Statistikk per kurs
3. **useTrainingReminders hook** - CRUD for påminnelser
4. **OverdueTable komponent** - Tabell med handlingsknapper
5. **CourseDetailSheet** - Drill-down for hvert kurs
6. **ReminderDialog** - Dialog for å sende purring
7. **TrainingOverview refaktorering** - Tabs-struktur
8. **E-post templates** - Purring-maler
9. **KPI-kort med trend** - Sammenligning med forrige periode

---

## Resultat

- **Kursoversikt** med drill-down til hvert kurs
- **Purring-funksjon** for å sende påminnelse til forfalte
- **Utsendelsesstatistikk** - Se hvor mange som har fått invitasjon
- **Trend-indikatorer** på alle KPI-er
- **Handlingsknapper** direkte fra oversikten
- **Loggføring** av alle sendte påminnelser
- **Tabs-navigasjon** for bedre oversikt

