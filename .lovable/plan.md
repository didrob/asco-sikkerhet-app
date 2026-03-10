

# Redesign Auth.tsx: Modern Glassmorphism Login

## Endringer i `src/pages/Auth.tsx`

Erstatte hele return-blokken med et nytt premium glassmorphism-design:

### 1. Global bakgrunn & glødende sirkler
- Hovedcontainer: `min-h-screen w-full relative overflow-hidden bg-[#0B0F19]`
- Fjerne bakgrunnsbildet (`authBackground`) og navy overlay
- Legge til 3-4 absolutt posisjonerte uskarpe sirkler:
  - **Lilla** øverst til venstre: `w-[600px] h-[600px] bg-purple-600/30 blur-[120px] -top-40 -left-40`
  - **Dyp blå** nederst til høyre: `w-[500px] h-[500px] bg-blue-700/20 blur-[120px] -bottom-40 -right-40`
  - **Cyan** i midten: `w-[400px] h-[400px] bg-cyan-500/10 blur-[120px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2`
  - **Teal** (ASCO-farge) subtil glød bak login-kortet: `w-[300px] h-[300px] bg-[hsl(166,100%,44%)]/10 blur-[100px]`

### 2. Login-kort med glassmorphism
- `backdrop-blur-xl bg-white/[0.03] border border-white/[0.08] rounded-2xl shadow-2xl`
- Subtil indre glød via `shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]`

### 3. Input-felt med glass-stil
- `bg-white/[0.05] border-white/[0.08] backdrop-blur-sm`
- Focus-state med teal glow: `focus:border-[hsl(166,100%,44%)]/50 focus:shadow-[0_0_15px_rgba(0,224,156,0.1)]`

### 4. CTA-knapp med glow
- Beholde ASCO teal farge
- Legge til `shadow-[0_0_20px_rgba(0,224,156,0.3)]` og hover: `shadow-[0_0_30px_rgba(0,224,156,0.5)]`
- Smooth transition på hover

### 5. Layout og branding
- Beholde split-screen layout (venstre: branding, høyre: login)
- ASCO-logo med teal sirkel beholdes
- Oppdatere typografi til å matche glassmorphism-estetikken
- Fjerne `authBackground` import (ikke lenger brukt)

### 6. Subtile detaljer
- Dot-grid eller noise overlay med svært lav opacity for tekstur
- Animert gradient-border på login-kortet (valgfritt, kan gjøres med CSS)

### Filer som endres

| Fil | Endring |
|-----|---------|
| `src/pages/Auth.tsx` | Komplett redesign av JSX med glassmorphism |

All logikk (state, handlers, validation, dialog) beholdes uendret. Kun visuell endring.

