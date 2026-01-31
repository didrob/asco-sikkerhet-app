
# Oppdater ASCO-logo på innloggingssiden og i eksporter

## Nåværende situasjon

Basert på det opplastede bildet er den **riktige ASCO-logoen**:
- En solid **teal/grønn sirkel** (ASCO Teal `#00E09C`)
- Teksten "**ASCO**" ved siden av sirkelen

**Problemer i dag:**

| Sted | Problem |
|------|---------|
| Innloggingsside (`Auth.tsx`) | Bruker kun tekst "ASCO" uten sirkel-logo |
| PDF-eksport | Tegner to konsentriske sirkler (feil design) |
| Word-eksport | Kun tekst "ASCO Prosedyrehub" uten sirkel |

## Løsning

### 1. Innloggingsside (`src/pages/Auth.tsx`)

Oppdatere logo-seksjonen (linje 162-169) til å inkludere:
- En **teal sirkel** til venstre for "ASCO" teksten
- Bruke `logo-light.png` direkte, eller tegne sirkelen med CSS

**Endring:**
```tsx
{/* ASCO Logo - med sirkel */}
<div className="mb-8 flex items-center gap-3 justify-center lg:justify-start">
  {/* Teal Circle */}
  <div 
    className="w-12 h-12 rounded-full"
    style={{ backgroundColor: 'hsl(166, 100%, 44%)' }}
  />
  <div>
    <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-white">
      ASCO
    </h1>
    <p className="text-white/60 text-sm font-medium tracking-wider">
      Prosedyrehub
    </p>
  </div>
</div>
```

### 2. PDF-eksport (`src/lib/pdf-export.ts`)

Endre sirkel-tegningen (linje 71-77) til å vise kun én teal sirkel:

**Før (feil):**
```javascript
// Tegner hvit sirkel med mindre teal sirkel inni
doc.setFillColor(255, 255, 255);
doc.circle(margin + 8, 17.5, 8, 'F');
doc.setFillColor(ASCO_TEAL.r, ASCO_TEAL.g, ASCO_TEAL.b);
doc.circle(margin + 8, 17.5, 5, 'F');
```

**Etter (riktig):**
```javascript
// Tegn kun én solid teal sirkel
doc.setFillColor(255, 255, 255); // Hvit sirkel som bakgrunn (for kontrast på teal header)
doc.circle(margin + 8, 17.5, 7, 'F');
```

### 3. Word-eksport (`src/lib/word-export.ts`)

Legge til sirkel-indikasjon i header-teksten:

**Endring:**
```typescript
new TextRun({
  text: '●  ASCO Prosedyrehub',  // Unicode solid circle
  size: 28,
  bold: true,
  color: 'FFFFFF',
}),
```

## Tekniske endringer

| Fil | Endring |
|-----|---------|
| `src/pages/Auth.tsx` | Legg til teal sirkel ved siden av "ASCO" tekst |
| `src/lib/pdf-export.ts` | Endre til én hvit sirkel (for kontrast mot teal header) |
| `src/lib/word-export.ts` | Legg til ● symbol før "ASCO Prosedyrehub" |

## Visuelt resultat

**Innloggingsside:**
```
   ●  ASCO
      Prosedyrehub
```

**PDF/Word header:**
```
┌─────────────────────────────────────────────────────────────┐
│  ○  ASCO Prosedyrehub                           [KATEGORI]  │
│     (hvit sirkel + tekst på teal bakgrunn)                  │
└─────────────────────────────────────────────────────────────┘
```

Der `●` = teal sirkel på mørk bakgrunn (innlogging) og `○` = hvit sirkel på teal bakgrunn (eksporter)
