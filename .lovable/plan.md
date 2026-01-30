
# ASCO Brand i PDF/Word-eksport

## Nåværende situasjon

PDF og Word eksport bruker:
- **Feil farge**: Blå (`#3B82F6`) istedenfor ASCO Teal (`hsl(166, 100%, 44%)`)
- **Kun tekst**: Skriver "ASCO" som tekst uten logo
- **Ingen visuell identitet**: Mangler ASCO sin visuelle profil

ASCO brand-farger:
- **ASCO Teal**: `hsl(166, 100%, 44%)` = `#00E09C` (turkis/grønn)
- **Deep Navy**: `#1a1b26` (mørk bakgrunn)

## Løsning

### 1. PDF-eksport (`src/lib/pdf-export.ts`)

**Oppdater header-farge til ASCO Teal:**
```
// Før: doc.setFillColor(59, 130, 246); // Blå
// Etter: doc.setFillColor(0, 224, 156);  // ASCO Teal #00E09C
```

**Legg til ASCO-logo i header:**
- Konverter `logo-light.png` til base64 for embedding i PDF
- Plasser logo øverst til venstre i header (hvit logo på teal bakgrunn)
- Flytt kategori-tekst til høyre for logo

**Oppdater footer:**
- Legg til "ASCO Prosedyrehub" tekst i footer

### 2. Word-eksport (`src/lib/word-export.ts`)

**Oppdater brand-farger:**
```
// Før: color: '3B82F6' (blå)
// Etter: color: '00E09C' (ASCO Teal)
```

**Legg til logo-referanse i header:**
- Bruk ASCO-logo i dokumenthodet
- Word-pakken (`docx`) støtter bildeinnsetting via `ImageRun`

### 3. Logo-håndtering

Opprette `src/lib/logo-base64.ts`:
- Eksporter base64-versjon av ASCO-logoen for bruk i PDF
- jsPDF kan embedde bilder via `addImage()` med base64-data

## Tekniske endringer

| Fil | Endring |
|-----|---------|
| `src/lib/pdf-export.ts` | Endre header-farge til ASCO Teal, legge til logo |
| `src/lib/word-export.ts` | Endre farger til ASCO Teal, legge til logo i header |
| `src/lib/logo-base64.ts` | Ny fil med base64-kodet ASCO-logo for embedding |

## Resultat

Eksporterte prosedyrer vil ha:
- ASCO Teal header (`#00E09C`)
- ASCO-logo øverst til venstre
- Konsistent visuell identitet med resten av appen
- Profesjonelt utseende som matcher ASCO-profilen
