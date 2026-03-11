

# Tilbakestill Auth-siden til forrige layout med rigg-bakgrunn

Gjenoppretter den opprinnelige layouten med:

1. **Bakgrunnsbilde**: `auth-bg.png` med `bg-cover bg-center` og mørkt overlay (`bg-black/40`)
2. **Overskrift**: "Prosedyrer. Opplæring. Kontroll." i stedet for "Digital sikkerhetsoperasjoner"
3. **Tre feature-kort** med glass-effekt:
   - Digitale Prosedyrer (FileText-ikon)
   - Kurs og Sertifisering (GraduationCap-ikon)
   - Revisjon og Kontroll (ShieldCheck-ikon)
4. **Login-kort**: Dyp glass-effekt (`bg-white/5 backdrop-blur-2xl`) med `rounded-[2rem]`

### Endringer
- **Fil**: `src/pages/Auth.tsx` — full tilbakestilling av layout til forrige versjon med rigg-bakgrunn og feature-kort
- Legger tilbake `FileText`, `GraduationCap`, `ShieldCheck` i imports

