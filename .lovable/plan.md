

# Oppdater Auth-siden til å matche referansebildet

## Endringer i `src/pages/Auth.tsx`

### 1. Fjern bakgrunnsbilde og overlay
Erstatt `bg-[url('/auth-bg.png')] bg-cover bg-center bg-no-repeat` med ren `bg-[#0B0F19]` (eller `bg-[#1a1f2e]` som matcher referansen). Fjern det mørke overlayet (`bg-black/40`).

### 2. Oppdater overskrift
Bytt fra:
```
Prosedyrer. Opplæring. Kontroll.
```
Til en to-linjers overskrift med cyan-farget andre linje:
```
Digital
sikkerhetsoperasjoner  (i cyan/grønn)
```

### 3. Oppdater undertekst
Bytt til: "Administrer prosedyrer, opplæring og sertifiseringer på én plattform. Sikker, effektiv og alltid tilgjengelig."

### 4. Fjern de tre feature-kortene
Fjern hele `<div className="space-y-4">...</div>` blokken med Digitale Prosedyrer, Kurs og Sertifisering, og Revisjon og Kontroll.

### 5. Fiks ASCO-logoen
Sjekk at `logo-light.png` faktisk rendres — sannsynligvis en import- eller lastingsfeil. Behold `h-16` størrelsen med "Prosedyrehub" under.

### 6. Juster login-kort styling
Referansen viser et litt mer solid kort (mindre glass-effekt, mer `bg-slate-800/90` enn `bg-white/5`). Oppdater avrunding fra `rounded-[2rem]` til standard `rounded-2xl`.

### Teknisk oversikt
- Kun én fil endres: `src/pages/Auth.tsx`
- Fjern ubrukte ikoner fra import: `FileText`, `GraduationCap`, `ShieldCheck`
- Bakgrunnsfargen i referansen er litt lysere enn `#0B0F19` — nærmere `#1e2235`

