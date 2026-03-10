

# Oppdatering av Auth.tsx: Venstre kolonne + Høyre kolonne redesign

## Endringer i `src/pages/Auth.tsx`

### Venstre kolonne (linje 127-143) — erstattes med:
- **ASCO-logo** øverst (teal sirkel + tekst, beholdes)
- **Stor overskrift** med lilla/blå gradient: `text-5xl lg:text-7xl font-bold tracking-tight mb-6` — "Sikkerhet og Kompetanse i Fokus" der gradientdelen bruker `bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent`
- **Undertittel**: `text-lg text-slate-300 mb-10 max-w-md` — "Din komplette enterprise-plattform for sikkerhetsprosedyrer, opplæring og compliance."
- **3 feature-kort** med glass-effekt (`bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 mb-4 max-w-md flex items-center gap-4`):
  1. `FileText` ikon + "Digitale Prosedyrer" + "Sporing og signering i sanntid"
  2. `GraduationCap` ikon + "Kurs og Sertifisering" + "Automatisert opplæringsløp"
  3. `ShieldCheck` ikon + "Revisjon og Kontroll" + "Fullt samsvar og historikk"

### Høyre kolonne (linje 145-195) — oppdateres:
- Wrapper: `flex items-center justify-center p-4 lg:p-8`
- Kort: `w-full max-w-md bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 shadow-[0_0_40px_-10px_rgba(0,0,0,0.5)]`

### Import
- Legge til `FileText, GraduationCap, ShieldCheck` fra lucide-react

### Fil
| Fil | Endring |
|-----|---------|
| `src/pages/Auth.tsx` | Oppdatere venstre og høyre kolonne JSX + import |

