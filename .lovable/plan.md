# Refaktorering av Prosedyremodul med Metadata, Eksport og Vedlegg

## ✅ Status: Implementert

Denne planen er implementert. Her er en oversikt over hva som ble gjort:

---

## ✅ Del 1: Rydde opp i Prosedyreeditor

**Gjennomført:** Quiz og checkpoint blokktyper er fjernet fra prosedyreeditor. Nye blokktyper lagt til:
- Tekst
- Overskrift
- Bilde
- Video
- Advarsel/viktig
- Punktliste

---

## ✅ Del 2: Utvidet Metadata

**Database-kolonner lagt til i `procedures`-tabellen:**
- `category` (TEXT)
- `version` (TEXT, default '1.0')
- `approved_by` (UUID)
- `approved_at` (TIMESTAMPTZ)
- `review_date` (DATE)
- `document_number` (TEXT)
- `tags` (TEXT[])
- `author_id` (UUID)

**UI-komponent:** `MetadataSection.tsx` med alle felt inkludert kategori-velger, versjon, dokumentnummer, revisjonsdato og tagger.

---

## ✅ Del 3: Vedlegg

**Ny tabell:** `procedure_attachments` med RLS-policies

**Storage bucket:** `procedure-attachments` (50MB maks)

**Hooks:** `useProcedureAttachments.ts` med upload/delete/list

**UI-komponent:** `AttachmentsSection.tsx` med filopplasting og tabell

---

## ✅ Del 4: PDF/Word Eksport

**Biblioteker installert:**
- `jspdf` for PDF-generering
- `docx` for Word-generering
- `file-saver` for nedlasting

**Lib-filer:**
- `src/lib/pdf-export.ts` - Profesjonell PDF med header, metadata, innhold
- `src/lib/word-export.ts` - Word-dokument med samme struktur

**UI-komponent:** `ExportMenu.tsx` med dropdown for PDF/Word valg

---

## ✅ Del 5: Samarbeid

**Nye tabeller:**
- `procedure_comments` - Kommentarer med tråder og status
- `procedure_revisions` - Versjonshistorikk med snapshots

**Hooks:**
- `useProcedureComments.ts` - CRUD for kommentarer med svar
- `useProcedureRevisions.ts` - Historikk og gjenoppretting

**UI-komponenter:**
- `CommentsPanel.tsx` - Kommentarfelt, tråder, løst/gjenåpne
- `RevisionHistory.tsx` - Historikktabell med gjenopprett-funksjon

---

## ✅ Del 6: Oppdatert ProcedureEditor

**Ny tabs-struktur:**
1. **Innhold** - Tittel, beskrivelse, innholdsblokker
2. **Metadata** - Kategori, versjon, dokumentnummer, tagger
3. **Vedlegg** - Filopplasting og liste
4. **Kommentarer** - Samarbeid og diskusjon
5. **Historikk** - Revisjonshistorikk

---

## Filstruktur

### Nye filer
| Fil | Beskrivelse |
|-----|-------------|
| `src/hooks/useProcedureAttachments.ts` | CRUD for vedlegg |
| `src/hooks/useProcedureComments.ts` | CRUD for kommentarer |
| `src/hooks/useProcedureRevisions.ts` | Versjonshistorikk |
| `src/components/procedure/MetadataSection.tsx` | Metadata-skjema |
| `src/components/procedure/AttachmentsSection.tsx` | Vedlegg-seksjon |
| `src/components/procedure/CommentsPanel.tsx` | Kommentar-panel |
| `src/components/procedure/RevisionHistory.tsx` | Historikk-tabell |
| `src/components/procedure/ExportMenu.tsx` | Eksport-dropdown |
| `src/lib/pdf-export.ts` | PDF-generering |
| `src/lib/word-export.ts` | Word-generering |

### Oppdaterte filer
| Fil | Endring |
|-----|---------|
| `ProcedureEditor.tsx` | Ny tabs-struktur, nye blokktyper, eksport |
| `useProcedureMutations.ts` | Støtte for metadata-felt |

---

## Neste steg (valgfritt)

1. **ProcedureViewer.tsx** - Oppdatere for å vise vedlegg og nye blokktyper
2. **Kurseditor** - Flytte quiz/checkpoint hit
3. **Godkjenning** - Implementere godkjenningsflyt med approved_by/approved_at
