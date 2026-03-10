

# Komplett kursflyt: Fra opprettelse til utsendelse

## Hva som allerede finnes

Dere har allerede et solid fundament:
- **Kursadministrasjon** (`ManageTraining.tsx`): Opprett, rediger, publiser og arkiver kurs
- **Kursgrupper** (`TrainingGroups.tsx`): Opprett grupper og legg til medlemmer
- **Kurstildeling** (`useTrainingAssignments.ts`): Tildel kurs til brukere/grupper med frist
- **E-postutsendelse** (`EmailComposer.tsx`): Send invitasjoner via lokal e-postklient med BCC
- **Kursavspiller** (`CoursePlayer.tsx`): Kahoot-inspirert quiz med flere oppgavetyper
- **Kurstyper** i databasen: `theoretical`, `practical`, `video`, `mixed`
- **Min opplaring** (`Training.tsx`): Brukerens tildelte kurs

## Hva som mangler for en komplett flyt

### 1. Kursredigering (Course Editor)

**Ny side: `/training/manage/new` og `/training/manage/:id/edit`**

Det finnes ingen kursredigerer i dag. HMS-representanten trenger et skjema for a:
- Fylle inn tittel, beskrivelse, kurstype
- Velge bestattprosent (pass_threshold)
- Koble til prosedyrer (velg fra eksisterende)
- Legge til innholdsblokker (quiz-oppgaver) med en visuell editor
- Velge hvilke roller kurset er obligatorisk for

**Forslag til implementering:**
- Steg-basert skjema (wizard) med tabs: "Grunninfo" -> "Innhold" -> "Innstillinger"
- Innholdsblokk-editor for a legge til flervalg, hotspot, rekkefølge, scenario osv.
- Forhåndsvisning av kurset for det publiseres

### 2. Kursutsendelsesside (Course Assignment Page)

**Ny side: `/training/manage/:id/assign`**

Lenken finnes allerede i ManageTraining, men siden mangler. Denne skal:
- Vise kursinformasjon
- La HMS-rep velge grupper og/eller enkeltbrukere
- Sette frist (due_date)
- Generere en delbar kurslenke (`/training/:courseId/play`)
- Sende invitasjon via e-postklient (gjenbruke `EmailComposer`)
- Vise hvem som allerede er tildelt

### 3. Gruppemedlemshåndtering

**Ny side: `/training/groups/:id`**

Lenken finnes i TrainingGroups, men siden mangler. Denne skal:
- Vise alle medlemmer i gruppen
- Legge til nye medlemmer (søk blant brukere på site)
- Fjerne medlemmer
- Vise medlemsdetaljer (navn, stilling, avdeling)

## Foreslatt komplett flyt

```text
HMS-representant logger inn
        |
        v
[Administrer kurs] --> [+ Nytt kurs]
        |                     |
        |                     v
        |            Steg 1: Grunninfo
        |            - Tittel, beskrivelse
        |            - Kurstype (teoretisk/praktisk/video/kombinert)
        |            - Koble til prosedyrer
        |                     |
        |                     v
        |            Steg 2: Innhold
        |            - Legg til quiz-blokker
        |            - Flervalg, hotspot, rekkefølge, scenario
        |            - Forhåndsvisning
        |                     |
        |                     v
        |            Steg 3: Innstillinger
        |            - Bestattprosent
        |            - Obligatorisk for roller
        |            - Lagre som utkast eller publiser
        |                     |
        v                     v
[Kursoversikt] <--- Kurs opprettet!
        |
        v
[Tildel brukere] (per kurs)
        |
        +---> Velg grupper (Kranforere, Mek. verksted, etc.)
        |
        +---> Velg enkeltbrukere
        |
        +---> Sett frist
        |
        +---> Kopier kurslenke (for deling i Teams/Slack)
        |
        v
[Send invitasjon via e-post]
        |
        +---> Forhåndsvisning av e-post
        +---> BCC-valg for personvern
        +---> Apne e-postklient
        |
        v
Brukere mottar e-post med lenke
        |
        v
[Mine kurs] --> [Start kurs] --> [Quiz/oppgaver] --> [Resultat]
```

## Teknisk implementeringsplan

### Steg 1: Gruppemedlemsside (`/training/groups/:id`)

**Ny fil:** `src/pages/training/TrainingGroupMembers.tsx`
- Hente gruppedetaljer med `useTrainingGroup(groupId)`
- Vise medlemsliste med profiler
- Legge til brukere via sok (hente fra `profiles`-tabellen filtrert på site)
- Fjerne medlemmer
- Bruke eksisterende hooks: `useAddGroupMember`, `useRemoveGroupMember`, `useAddGroupMembers`

**Rute:** Legge til `/training/groups/:groupId` i `App.tsx`

### Steg 2: Kursredigerer (`/training/manage/new` og `/training/manage/:id/edit`)

**Ny fil:** `src/pages/training/CourseEditor.tsx`
- Tab-basert layout: Grunninfo | Innhold | Innstillinger
- **Grunninfo-tab:** Tittel, beskrivelse, kurstype (select), prosedyre-kobling (multi-select)
- **Innhold-tab:** Visuell blokk-editor for quiz-oppgaver
  - Knapp for a legge til ny blokk (flervalg, hotspot, rekkefølge, scenario)
  - Redigering av hver blokk inline
  - Drag-and-drop rekkefølge (valgfritt, kan starte uten)
- **Innstillinger-tab:** Bestattprosent (slider), obligatoriske roller (checkboxes)
- Bruke `useCreateTrainingCourse` og `useUpdateTrainingCourse`

**Ny komponent:** `src/components/training/ContentBlockEditor.tsx`
- Skjema for a redigere en enkelt quiz-blokk
- Stootte for alle typer i `QuizBlockType`

### Steg 3: Kursutsendelsesside (`/training/manage/:id/assign`)

**Ny fil:** `src/pages/training/CourseAssign.tsx`
- Vise kursinfo (tittel, type, status)
- Gruppevelger (checkbox-liste over grupper med medlemstall)
- Enkeltbruker-søk og -valg
- Datepicker for frist
- "Kopier kurslenke"-knapp som kopierer `{origin}/training/{courseId}/play`
- Integrere `EmailComposer` for utsendelse
- Vise tabell over eksisterende tildelinger med status
- Bruke `useCreateAssignments`, `useCourseAssignments`, `useMarkAssignmentsSent`

### Steg 4: Oppdatere ruting og navigasjon

**`App.tsx`:** Legge til nye ruter:
- `/training/manage/new` -> `CourseEditor`
- `/training/manage/:id/edit` -> `CourseEditor`
- `/training/manage/:id/assign` -> `CourseAssign`
- `/training/groups/:groupId` -> `TrainingGroupMembers`

## Anbefalt rekkefølge

1. **Gruppemedlemsside** - enklest, bruker eksisterende hooks
2. **Kursredigerer** - kjernefunksjonalitet for a lage kurs
3. **Kursutsendelsesside** - kobler alt sammen med e-post og lenkedeling

Hver del kan implementeres og testes separat.
