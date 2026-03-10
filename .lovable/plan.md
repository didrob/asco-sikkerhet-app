

# Ny enterprise-bakgrunn for Auth.tsx

## Steg 1: Generer bakgrunnsbilde
Bruk AI-bildegenerator til å lage et premium abstract technology-bilde i deep navy/cyan. Lagre som `public/auth-bg.png`.

## Steg 2: Oppdater Auth.tsx (linje 115-122)

**Fjern:** De tre glowing orb-divene (linje 117-119) og dot grid overlay (linje 121-122).

**Endre hovedcontainer (linje 115)** fra:
```tsx
<div className="min-h-screen w-full relative overflow-hidden flex items-center justify-center bg-slate-950">
```
til:
```tsx
<div className="min-h-screen w-full relative overflow-hidden flex items-center justify-center bg-[#0B0F19] bg-[url('/auth-bg.png')] bg-cover bg-center bg-no-repeat">
```

Legg til et subtilt mørkt overlay for lesbarhet:
```tsx
<div className="absolute inset-0 bg-black/40 pointer-events-none" />
```

## Steg 3: Bevar alt annet
- Glass-morfisme kortet (`bg-white/5 backdrop-blur-2xl border border-white/10`)
- Blå/cyan tekst og knapper
- Logo, layout, og feature-kort — alt uendret

