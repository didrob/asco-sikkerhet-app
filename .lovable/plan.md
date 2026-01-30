
# Omstrukturering av Prosedyre-modulen - Fra Opplæring til Dokumenthåndtering

## Problemanalyse

Etter gjennomgang av kodebasen ser jeg at "Prosedyrer"-siden (`/procedures`) og `ProcedureViewer` er designet som et **opplæringsverktøy** med:
- Steg-for-steg gjennomgang (1-5 steg)
- Progress-sporing per bruker (startet/fullført)
- Quiz og checkpoint-elementer (nylig fjernet fra editor, men viewer støtter fortsatt)
- Signering ved fullføring

Dette matcher ikke med ønsket funksjonalitet som er **profesjonell dokumenthåndtering**:
- Oversiktlig liste over prosedyrer med metadata (kategori, tags, versjon)
- Les, print til PDF, eksporter
- Last opp og koble vedlegg
- Samarbeide med kommentarer og revisjonshistorikk
- Audit trail på alle endringer

### Hva som allerede finnes (men er gjemt/feilplassert)

Systemet har allerede mange av de ønskede funksjonene, men de ligger kun i **editor-modus** (`ProcedureEditor.tsx`):
- Metadata-seksjon med kategori, versjon, dokumentnummer, tags
- Vedlegg-seksjon med opplasting
- Kommentarer med svar og løst-status
- Revisjonshistorikk med gjenoppretting
- Eksport til PDF/Word

### Arkitektur-valg

Siden kurs-modulen (`/training`) allerede håndterer opplæring med quiz/steg-gjennomgang, bør prosedyre-modulen rendyrkes som **referansedokumenter**.

## Foreslått løsning

### Del 1: Ny Prosedyre-oversiktsside (`/procedures`)

Erstatte nåværende "fullførings-fokusert" liste med en profesjonell dokumentoversikt:

```text
+-----------------------------------------------------------------------+
|  📄 Prosedyrer                          [+ Ny prosedyre] [Importer]   |
|  Se og administrer prosedyredokumenter                                |
+-----------------------------------------------------------------------+
|  🔍 Søk prosedyrer...        [Kategori ▼] [Status ▼] [Tags ▼]         |
+-----------------------------------------------------------------------+
|                                                                        |
|  ┌─────────────────────────────────────────────────────────────────┐  |
|  │ HMS-001   HMS Introduksjon                              v1.0    │  |
|  │ HMS       Grunnleggende HMS for nye ansatte             ● Pub   │  |
|  │ Tags: sikkerhet, nyansatt                                       │  |
|  │ Revisjon: 30. jan 2026   │   2 vedlegg   │   3 kommentarer     │  |
|  │                                      [Åpne] [Rediger] [Eksport] │  |
|  └─────────────────────────────────────────────────────────────────┘  |
|                                                                        |
|  ┌─────────────────────────────────────────────────────────────────┐  |
|  │ HMS-002   Brannrutiner                                  v2.1    │  |
|  │ BRANN     Rutiner ved brannalarm                        ● Pub   │  |
|  │ Tags: brann, evakuering                                         │  |
|  │ Revisjon: 15. feb 2026   │   5 vedlegg   │   0 kommentarer     │  |
|  │                                      [Åpne] [Rediger] [Eksport] │  |
|  └─────────────────────────────────────────────────────────────────┘  |
+-----------------------------------------------------------------------+
```

Funksjoner:
- Søk og filtrering etter kategori, status, tags
- Viser dokumentnummer, versjon, revisjonsdato
- Antall vedlegg og kommentarer
- Hurtighandlinger: Åpne, Rediger, Eksporter

### Del 2: Ny Prosedyre-visning (`ProcedureViewer`)

Erstatte steg-gjennomgang med en **dokumentleser**:

```text
+-----------------------------------------------------------------------+
|  ← Tilbake   HMS Introduksjon                    [Eksport ▼] [Rediger]|
|              v1.0 | HMS-001 | Publisert                               |
+-----------------------------------------------------------------------+
|                                                                        |
|  [Innhold] [Vedlegg (2)] [Kommentarer (3)] [Historikk]                |
|                                                                        |
|  ┌─────────────────────────────────────────────────────────────────┐  |
|  │                                                                  │  |
|  │  ## 1. Formål                                                   │  |
|  │  Denne prosedyren beskriver grunnleggende HMS-rutiner for...    │  |
|  │                                                                  │  |
|  │  ⚠️ VIKTIG: Alle nyansatte må lese denne prosedyren før...      │  |
|  │                                                                  │  |
|  │  ## 2. Ansvarsfordeling                                         │  |
|  │  • Arbeidsgiver har ansvar for...                               │  |
|  │  • Arbeidstaker har ansvar for...                               │  |
|  │                                                                  │  |
|  │  [Bilde: Sikkerhetsutstyr]                                      │  |
|  │                                                                  │  |
|  └─────────────────────────────────────────────────────────────────┘  |
|                                                                        |
|  ┌─ Dokumentinfo ──────────────────────────────────────────────────┐  |
|  │ Kategori: HMS          Dokumentnr: HMS-001                      │  |
|  │ Versjon: 1.0           Revisjonsdato: 30. jan 2026              │  |
|  │ Tags: sikkerhet, nyansatt                                       │  |
|  │ Sist oppdatert: 30. jan 2026 av Kari Nordmann                  │  |
|  └─────────────────────────────────────────────────────────────────┘  |
+-----------------------------------------------------------------------+
```

Funksjoner:
- Render innhold som et dokument (ikke steg-for-steg)
- Tabs for Innhold, Vedlegg, Kommentarer, Historikk
- Eksport til PDF/Word direkte fra visningen
- Dokumentinfo-kort med all metadata

### Del 3: Oppdatert navigasjon

Sidebaren oppdateres:
- "Bla i prosedyrer" → Ny dokumentoversikt
- "Administrer prosedyrer" → Fortsatt for de med rettigheter

### Del 4: Audit Trail-forbedringer

- Vis siste endring i dokumentoversikten
- Tydelig revisjonshistorikk i visningen
- Hvem som endret hva og når

## Tekniske endringer

| Fil | Endring |
|-----|---------|
| `src/pages/Procedures.tsx` | **Stor omskriving** - Fra opplæringsliste til dokumentoversikt med søk/filter |
| `src/components/dashboard/ProcedureList.tsx` | **Ny komponent** `ProcedureDocumentCard.tsx` med metadata-visning |
| `src/pages/ProcedureViewer.tsx` | **Stor omskriving** - Fra steg-gjennomgang til dokumentleser med tabs |
| `src/hooks/useProcedures.ts` | **Utvid** - Inkluder metadata (kategori, tags, vedlegg-antall, kommentar-antall) |
| `src/components/procedure/ProcedureStatsCards.tsx` | **Oppdater** - Vis dokumentstatistikk istedenfor fullføringsgrad |

## Migreringsplan

1. **Fase 1**: Ny oversiktsside med dokumentkort og filtrering
2. **Fase 2**: Ny dokumentleser med tabs (innhold, vedlegg, kommentarer, historikk)
3. **Fase 3**: Fjern opplæringselementer (progress, checkpoint, quiz-støtte i viewer)
4. **Fase 4**: Oppdater navigasjon og tekster

## Hva som bevares

- `ProcedureEditor.tsx` - Allerede riktig oppsett med metadata, vedlegg, kommentarer
- Eksisterende hooks for vedlegg, kommentarer, revisjoner
- Eksport-funksjonalitet (PDF/Word)
- Audit-logging

## Resultat

- Prosedyrer blir rene referansedokumenter
- Opplæring med steg/quiz forblir i Kurs-modulen (`/training`)
- Profesjonell dokumenthåndtering med metadata, versjonering, samarbeid
- Tydelig audit trail på alle endringer
