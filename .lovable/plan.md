

# Refaktorering av Prosedyremodul med Metadata, Eksport og Vedlegg

## Problemanalyse

Nåværende prosedyreeditor blander sammen prosedyreinnhold og opplæringsinnhold. Ifølge memory-notatet skal prosedyrer være **referansedokumenter** som krever "lest og forstått"-signatur, mens **opplæringsmoduler** skal tilby aktiv læring med quiz og praktiske oppgaver.

### Hva som må endres

| Problem | Løsning |
|---------|---------|
| Quiz/checkpoint ligger i prosedyrer | Flytte til kurseditor, beholde kun tekst/bilde/video i prosedyrer |
| Mangler metadata | Legge til kategori, versjon, godkjent av, revisjonshistorikk |
| Ingen eksport | PDF og Word-eksport med profesjonell formatering |
| Ingen vedlegg | Støtte for å laste opp og koble filer til prosedyrer |
| Ingen samarbeid | Kommentarer, endringsforslag, versjonshistorikk (Google Docs-inspirert) |

---

## Del 1: Rydde opp i Prosedyreeditor

### Fjerne interaktive blokktyper fra prosedyrer

**Før** (ProcedureEditor.tsx linje 42-48):
```
BLOCK_TYPES = [
  { type: 'text', label: 'Tekst' },
  { type: 'checkpoint', label: 'Bekreftelse' },   ← FJERNES
  { type: 'quiz', label: 'Quiz' },                ← FJERNES
  { type: 'image', label: 'Bilde' },
  { type: 'video', label: 'Video' },
]
```

**Etter**:
```
BLOCK_TYPES = [
  { type: 'text', label: 'Tekst' },
  { type: 'heading', label: 'Overskrift' },       ← NY
  { type: 'image', label: 'Bilde' },
  { type: 'video', label: 'Video' },
  { type: 'warning', label: 'Advarsel/viktig' },  ← NY
  { type: 'list', label: 'Punktliste' },          ← NY
]
```

Prosedyrer blir rene referansedokumenter - quiz og checkpoint flyttes til kurseditor.

---

## Del 2: Utvidet Metadata

### Nye felt i prosedyrer-tabellen

| Felt | Type | Beskrivelse |
|------|------|-------------|
| `category` | TEXT | Kategori (f.eks. "HMS", "Brann", "Drift") |
| `version` | TEXT | Versjonsnummer (f.eks. "1.0", "2.1") |
| `approved_by` | UUID | Hvem som godkjente prosedyren |
| `approved_at` | TIMESTAMPTZ | Når den ble godkjent |
| `review_date` | DATE | Dato for neste revisjon |
| `document_number` | TEXT | Internt dokumentnummer |
| `tags` | TEXT[] | Søkbare tagger |
| `author_id` | UUID | Forfatter (kan være annen enn created_by) |

### UI i Prosedyreeditor

```text
GRUNNLEGGENDE INFORMASJON
+-----------------------------------------------------------+
| Tittel *            [HMS Introduksjon_____________]       |
| Beskrivelse         [Kort beskrivelse___________]         |
+-----------------------------------------------------------+

METADATA
+-----------------------------------------------------------+
| Kategori       [HMS ▼]           Versjon    [1.0]         |
| Dok.nummer     [HMS-001]         Revisjonsdato [📅]       |
| Godkjent av    [Velg bruker ▼]   Tagger     [+Legg til]   |
+-----------------------------------------------------------+

INNHOLD
[Tekst] [Overskrift] [Bilde] [Video] [Advarsel] [Liste]
...
```

---

## Del 3: Vedlegg

### Ny database-tabell

```sql
CREATE TABLE public.procedure_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  procedure_id UUID REFERENCES procedures(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,           -- Storage path
  file_size INTEGER,
  file_type TEXT,                    -- MIME type
  description TEXT,
  uploaded_by UUID,
  uploaded_at TIMESTAMPTZ DEFAULT now()
);
```

### UI: Vedlegg-seksjon i editor

```text
VEDLEGG
+-----------------------------------------------------------+
| [📎 Last opp vedlegg]  [📂 Koble fra eksisterende]        |
+-----------------------------------------------------------+
| 📄 Brannøvelse-skjema.pdf     (245 KB)    [👁] [🗑]       |
| 📄 HMS-sjekkliste.xlsx        (128 KB)    [👁] [🗑]       |
| 📄 Instruksjonsvideo.mp4      (15 MB)     [👁] [🗑]       |
+-----------------------------------------------------------+
```

### Tillatte filtyper
- PDF, Word, Excel, PowerPoint
- Bilder (jpg, png, gif)
- Video (mp4, webm)
- Maks 50MB per fil

---

## Del 4: PDF/Word Eksport

### Eksport-knapper i editor og viewer

```text
[Forhåndsvis] [Lagre] [⬇️ Eksporter ▼]
                            └─ PDF
                            └─ Word (.docx)
```

### Profesjonell PDF-layout

```text
+-------------------------------------------------------+
|  ASCO                                         [LOGO]  |
|                                                       |
|  HMS-PROSEDYRE                                        |
|  ═══════════════════════════════════════════════      |
|                                                       |
|  HMS Introduksjon                                     |
|  Versjon 1.0 | Dok.nr: HMS-001                       |
|                                                       |
|  Godkjent av: Ola Nordmann                           |
|  Godkjent dato: 28. januar 2026                      |
|  Neste revisjon: 28. januar 2027                     |
|                                                       |
|  ─────────────────────────────────────────────────   |
|                                                       |
|  INNHOLD                                              |
|                                                       |
|  1. Formål                                           |
|  2. Ansvar                                           |
|  3. Fremgangsmåte                                    |
|  ...                                                  |
|                                                       |
|  [Bilder integrert i dokumentet]                     |
|                                                       |
|  VEDLEGG                                             |
|  - Brannøvelse-skjema.pdf                           |
|  - HMS-sjekkliste.xlsx                              |
|                                                       |
|  ─────────────────────────────────────────────────   |
|  Side 1 av 3                                          |
+-------------------------------------------------------+
```

### Teknisk implementering

Bruker biblioteker som:
- **jsPDF** + **html2canvas** for PDF
- **docx** (npm) for Word-generering

Eksport skjer client-side - ingen server nødvendig.

---

## Del 5: Samarbeid (Google Docs-inspirert)

### Fase 1: Kommentarer og endringsforslag

```sql
CREATE TABLE public.procedure_comments (
  id UUID PRIMARY KEY,
  procedure_id UUID REFERENCES procedures(id),
  user_id UUID,
  content TEXT NOT NULL,
  block_id TEXT,                    -- Hvilken blokk kommentaren gjelder
  parent_id UUID,                   -- For svar på kommentarer
  status TEXT DEFAULT 'open',       -- 'open', 'resolved'
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.procedure_revisions (
  id UUID PRIMARY KEY,
  procedure_id UUID REFERENCES procedures(id),
  version TEXT NOT NULL,
  content_snapshot JSONB,           -- Hele prosedyren som snapshot
  changed_by UUID,
  change_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### UI: Kommentar-panel

```text
+-----------------------------------------------------------+
| [Redigering]  [Kommentarer (3)]  [Historikk]              |
+-----------------------------------------------------------+

KOMMENTARER
+-----------------------------------------------------------+
| 💬 Kari Hansen - 27. jan                                  |
| "Kan vi legge til mer info om brannslukker?"             |
| [Svar] [Løst ✓]                                          |
|                                                           |
|   └─ Ola Nordmann - 28. jan                              |
|      "Lagt til i avsnitt 3"                              |
+-----------------------------------------------------------+
```

### UI: Versjonshistorikk

```text
REVISJONSHISTORIKK
+-----------------------------------------------------------+
| v1.2  | 28. jan 2026 | Ola N.   | Oppdatert sikkerhet    |
| v1.1  | 15. jan 2026 | Kari H.  | Lagt til brannøvelse   |
| v1.0  | 01. jan 2026 | Per S.   | Første versjon         |
+-----------------------------------------------------------+
| [Sammenlign versjoner] [Gjenopprett v1.1]                 |
+-----------------------------------------------------------+
```

---

## Del 6: Teknisk Implementering

### Nye filer

| Fil | Beskrivelse |
|-----|-------------|
| **Database** | |
| `supabase/migrations/xxx_procedure_enhancements.sql` | Metadata, vedlegg, kommentarer |
| **Hooks** | |
| `src/hooks/useProcedureAttachments.ts` | CRUD for vedlegg |
| `src/hooks/useProcedureComments.ts` | CRUD for kommentarer |
| `src/hooks/useProcedureRevisions.ts` | Versjonshistorikk |
| **Komponenter** | |
| `src/components/procedure/MetadataSection.tsx` | Metadata-skjema |
| `src/components/procedure/AttachmentsSection.tsx` | Vedlegg-opplasting |
| `src/components/procedure/CommentsPanel.tsx` | Kommentar-panel |
| `src/components/procedure/RevisionHistory.tsx` | Historikk-visning |
| `src/components/procedure/ExportMenu.tsx` | Eksport-dropdown |
| **Lib** | |
| `src/lib/pdf-export.ts` | PDF-generering |
| `src/lib/word-export.ts` | Word-generering |

### Oppdaterte filer

| Fil | Endring |
|-----|---------|
| `ProcedureEditor.tsx` | Nye blokktyper, metadata, vedlegg, eksport |
| `ProcedureViewer.tsx` | Fjerne quiz/checkpoint-håndtering, legge til vedlegg |
| `useProcedureMutations.ts` | Støtte for nye felt |
| `storage.ts` | Vedlegg-opplasting |

---

## Del 7: Oppdatert Prosedyreeditor-layout

```text
+-----------------------------------------------------------+
| ← Tilbake                                                  |
| Rediger prosedyre                     [Eksporter ▼] [Lagre]|
| Site: Hovedkontoret                                        |
+-----------------------------------------------------------+

TABS: [Innhold] [Metadata] [Vedlegg] [Kommentarer] [Historikk]

=== INNHOLD-TAB ===

Tittel *  [HMS Introduksjon_____________________]
Beskrivelse [Kort beskrivelse av prosedyren____]

INNHOLDSBLOKKER
+-----------------------------------------------------------+
| [+ Tekst] [+ Overskrift] [+ Bilde] [+ Video] [+ Advarsel] |
+-----------------------------------------------------------+

[Blokk 1: Tekst] ↕️ 🗑
| Formålet med denne prosedyren er å...                     |

[Blokk 2: Advarsel] ↕️ 🗑
| ⚠️ VIKTIG: Bruk alltid verneutstyr...                     |

[Blokk 3: Bilde] ↕️ 🗑
| [Sikkerhetsutstyr.jpg]                                    |

=== METADATA-TAB ===

+-----------------------------------------------------------+
| Kategori       [HMS ▼]           Versjon      [1.0]       |
| Dok.nummer     [HMS-001]         Status       [Utkast ▼]  |
| Revisjonsdato  [28.01.2027]      Godkjent av  [Velg...]   |
| Tagger         [sikkerhet] [brann] [+ Ny]                 |
+-----------------------------------------------------------+

=== VEDLEGG-TAB ===

[📎 Last opp vedlegg]

+-----------------------------------------------------------+
| Fil                    | Størrelse | Lastet opp | Handling |
|------------------------|-----------|------------|----------|
| Brannøvelse.pdf        | 245 KB    | 28. jan    | [👁] [🗑]|
| HMS-sjekkliste.xlsx    | 128 KB    | 27. jan    | [👁] [🗑]|
+-----------------------------------------------------------+
```

---

## Del 8: Implementeringsrekkefølge

1. **Database-migrering** - Nye kolonner og tabeller
2. **Rydde blokktyper** - Fjerne quiz/checkpoint fra prosedyrer
3. **Metadata-seksjon** - Nye felt i editor
4. **Vedlegg-funksjonalitet** - Opplasting og visning
5. **Eksport** - PDF og Word
6. **Kommentarer** - Samarbeidsfunksjoner
7. **Versjonshistorikk** - Revisjonssporing

---

## Resultat

- **Rene prosedyrer** - Referansedokumenter uten quiz (quiz flyttes til kurs)
- **Rik metadata** - Kategori, versjon, godkjenning, revisjonsplan
- **Vedlegg-støtte** - Last opp og koble filer
- **Profesjonell eksport** - PDF/Word med firmalogo og formatering
- **Samarbeid** - Kommentarer og versjonshistorikk som Google Docs
- **Sporbarhet** - Full revisjonshistorikk for compliance

