

# Oppdater AppLayout med marineblå bakgrunn og glass-effekter

## Endringer

### 1. `src/components/layout/AppLayout.tsx`
- Endre `bg-background` til `bg-[#0B0F19]` på ytre container for å matche auth-siden
- Gi `<main>` en gjennomsiktig bakgrunn så den dype bakgrunnen skinner gjennom

### 2. `src/components/layout/AppHeader.tsx` (linje 44)
- Endre `bg-card` til `glass-panel` for å gi headeren en gjennomsiktig glass-effekt i stedet for en solid farge
- Endre `border-border` til `border-white/10`

### 3. `src/components/layout/Sidebar.tsx` (linje 37)
- Endre `bg-card` til glass-panel styling
- Endre `border-border` til `border-white/10`
- Oppdater footer-border (linje 152) tilsvarende

Dette gir en konsistent visuell identitet der bakgrunnen er dyp marineblå og alle paneler har en subtil glass-effekt — akkurat som innloggingssiden.

