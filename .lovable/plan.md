
# Implementeringsplan: PWA, Globalt Søk, PDF/Word-import og Engasjerende Quiz

## Oversikt

Denne planen dekker fire hovedområder:
1. **PWA (Progressive Web App)** - Installerbar app med offline-støtte
2. **Globalt Søk** - Hurtigsøk på tvers av prosedyrer og kurs
3. **PDF/Word-import** - Last opp eksisterende dokumenter
4. **Engasjerende Quiz-system** - Praktisk læring for felt-operatører

---

## Del 1: Progressive Web App (PWA)

### Hva dette gir brukerne
- Appen kan installeres på hjemskjermen som en vanlig app
- Fungerer offline (leser prosedyrer uten nett)
- Rask oppstart og app-følelse på mobil/nettbrett
- Push-varsler (forberedt for fremtiden)

### Teknisk implementering

| Fil | Beskrivelse |
|-----|-------------|
| `vite.config.ts` | Installer og konfigurer `vite-plugin-pwa` |
| `public/manifest.json` | App-manifest med navn, ikoner og farger |
| `public/icons/` | Lag PWA-ikoner i ulike størrelser (192x192, 512x512) |
| `index.html` | Legg til meta-tags for mobil og iOS |
| `src/pages/Install.tsx` | Installasjonsveiledning for brukere |

**Konfigurasjon i vite-plugin-pwa:**
- Caching av prosedyrer for offline-lesing
- Automatisk service worker-generering
- App-shortcut til viktige funksjoner

---

## Del 2: Globalt Søk

### Hva dette gir brukerne
- Trykk `Cmd/Ctrl + K` eller søk-ikon for hurtigsøk
- Søk på tvers av prosedyrer og kurs
- Direkte navigering til resultater
- Nylige søk og populære prosedyrer

### Teknisk implementering

| Fil | Beskrivelse |
|-----|-------------|
| `src/components/layout/GlobalSearch.tsx` | Ny søke-komponent med cmdk |
| `src/hooks/useGlobalSearch.ts` | Hook for søk i prosedyrer og kurs |
| `src/components/layout/AppHeader.tsx` | Integrer søkeknapp i header |

**UI-flyt:**
1. Bruker trykker søkeknapp eller hurtigtast
2. Modal åpnes med søkefelt
3. Resultater grupperes: Prosedyrer | Kurs | Sider
4. Klikk på resultat navigerer direkte

---

## Del 3: PDF/Word-import

### Hva dette gir brukerne
- Last opp eksisterende prosedyrer fra filsystem
- Automatisk utfylling av metadata fra filnavn
- Lagres som vedlegg med metadata-kobling
- Hurtig migrering fra gamle systemer

### Teknisk implementering

| Fil | Beskrivelse |
|-----|-------------|
| `src/components/procedure/DocumentImportDialog.tsx` | Import-dialog med drag-and-drop |
| `src/pages/ManageProcedures.tsx` | Legg til "Importer"-knapp |
| `src/lib/document-parser.ts` | Parsing av filnavn og metadata-ekstraksjon |

**Import-flyt:**
1. Bruker drar PDF/Word inn i dialogen
2. System foreslår tittel fra filnavn
3. Bruker fyller inn kategori, tags
4. Dokument lastes opp som vedlegg
5. Opprett prosedyre med metadata og lenke til vedlegget

---

## Del 4: Engasjerende Quiz for Praktikere

Dette er den mest omfattende delen. ASCO-operatører er **praktikere** som lærer best gjennom:
- Visuelle oppgaver
- Interaktive elementer
- Korte, fokuserte moduler
- Umiddelbar feedback

### Pedagogiske prinsipper

1. **Mikrolæring**: Korte blokker (2-5 min) med én læringsmål per blokk
2. **Visuell læring**: Bilder og videoer med interaktive elementer
3. **Aktiv læring**: Ikke bare les, men gjør noe
4. **Gamification**: Poeng, streaks, mestringsnivåer
5. **Praktisk kobling**: Relater til faktiske arbeidsoppgaver

### Oppgavetyper (prioritert for praktikere)

| Type | Beskrivelse | Pedagogisk verdi |
|------|-------------|------------------|
| **Hotspot på bilde** | Klikk på riktig del av utstyr/maskin | Svært høy for visuell gjenkjenning |
| **Rekkefølge (Drag & Drop)** | Sorter steg i riktig rekkefølge | Prosedyre-forståelse |
| **Scenario-valg** | "Hva gjør du hvis...?" med situasjonsbilde | Praktisk beslutningstaking |
| **Flervalg med bilde** | Velg riktig utstyr/handling | Identifikasjon |
| **Video-sjekkpunkt** | Stopp video, svar på spørsmål | Oppmerksomhet under video |
| **Koble sammen** | Match utstyr til funksjon | Terminologi og sammenhenger |

### Engasjerende UI-design

**Kahoot-inspirert uten å kopiere:**

1. **Fargekodet svar-valg**: Hver svarmulighet har unik farge
2. **Tidtaker med visuell puls**: Skaper engasjement uten stress
3. **Umiddelbar feedback**: 
   - Riktig: Grønn animasjon + lyd-effekt (konfetti!)
   - Feil: Rød + vis riktig svar med forklaring
4. **Fremgang synlig**: Progress-bar som fyller seg
5. **Streak-visning**: "3 riktige på rad!"
6. **Mestringsnivåer**: Bronse/Sølv/Gull basert på score

### Database-endringer

Legge til nye felt i `training_courses.content_blocks`:

```typescript
// Nye blokktyper for content_blocks
type QuizBlockType = 
  | 'multiple_choice'      // Flervalg
  | 'hotspot'              // Klikk på bilde
  | 'sequence'             // Rekkefølge
  | 'scenario'             // Situasjonsbasert
  | 'video_checkpoint'     // Video med stopp
  | 'match'                // Koble sammen

interface QuizBlock {
  id: string;
  type: QuizBlockType;
  question: string;
  image_url?: string;      // For hotspot og scenario
  video_url?: string;      // For video_checkpoint
  options: QuizOption[];
  correct_answer: string | string[];  // Avhenger av type
  explanation?: string;    // Vises ved feil svar
  points: number;          // Poengverdi
  time_limit?: number;     // Sekunder (valgfritt)
}
```

### Teknisk implementering

| Fil | Beskrivelse |
|-----|-------------|
| `src/components/quiz/QuizPlayer.tsx` | Hovedspiller for quiz |
| `src/components/quiz/QuizProgress.tsx` | Fremgangsvisning |
| `src/components/quiz/QuizResults.tsx` | Resultatskjerm |
| `src/components/quiz/blocks/MultipleChoiceBlock.tsx` | Flervalg-komponent |
| `src/components/quiz/blocks/HotspotBlock.tsx` | Bilde-klikk komponent |
| `src/components/quiz/blocks/SequenceBlock.tsx` | Drag & drop rekkefølge |
| `src/components/quiz/blocks/ScenarioBlock.tsx` | Situasjonsvalg |
| `src/components/quiz/blocks/VideoCheckpointBlock.tsx` | Video med sjekkpunkt |
| `src/components/quiz/blocks/MatchBlock.tsx` | Koble-sammen |
| `src/pages/training/CoursePlayer.tsx` | Kurs-gjennomføring side |
| `src/pages/training/CourseEditor.tsx` | Editor for kurs med quiz-blokker |
| `src/hooks/useQuizProgress.ts` | Sporing av quiz-fremgang |

### App-ruter

| Rute | Komponent | Beskrivelse |
|------|-----------|-------------|
| `/training/:courseId/play` | `CoursePlayer.tsx` | Gjennomfør kurs |
| `/training/manage/:id/edit` | `CourseEditor.tsx` | Rediger kurs |

---

## Implementeringsrekkefølge

### Fase 1: PWA-fundament
1. Installer vite-plugin-pwa
2. Opprett manifest.json og ikoner
3. Konfigurer service worker for offline

### Fase 2: Globalt søk
1. Lag GlobalSearch-komponent
2. Implementer søke-hook
3. Integrer i AppHeader

### Fase 3: Dokumentimport
1. Lag DocumentImportDialog
2. Implementer fil-opplasting
3. Koble til prosedyre-opprettelse

### Fase 4: Quiz-system (trinnvis)
1. Grunnleggende QuizPlayer med flervalg
2. Hotspot-blokk (svært verdifull for praktikere)
3. Rekkefølge-blokk
4. Scenario-blokk
5. Video-sjekkpunkt
6. Koble-sammen
7. Gamification-elementer (streaks, poeng)

---

## Visuelt konsept for Quiz

```text
┌─────────────────────────────────────────────────────────────────┐
│  ● ● ● ● ○ ○ ○ ○ ○ ○                    Spørsmål 4/10          │
│  ████████░░░░░░░░░░░░░                                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│     ┌─────────────────────────────────────────────┐             │
│     │                                              │             │
│     │     [Bilde av utstyr/situasjon]             │             │
│     │                                              │             │
│     │     🔴 ← Klikk på sikkerhetsventilen        │             │
│     │                                              │             │
│     └─────────────────────────────────────────────┘             │
│                                                                  │
│     ❓ Hvor finner du nødstoppen på dette utstyret?            │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  ⏱ 0:23                          🔥 3 riktige på rad!       ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

---

## Resultat

Ved fullføring vil ASCO Prosedyrehub ha:

- **Installerbar app** som fungerer offline
- **Rask tilgang** til prosedyrer via globalt søk
- **Enkel import** av eksisterende dokumenter
- **Engasjerende opplæring** tilpasset praktikere med:
  - Visuelle, interaktive oppgaver
  - Umiddelbar feedback og gamification
  - Mikrolæring-struktur
  - Praktiske scenarioer knyttet til faktisk arbeid
