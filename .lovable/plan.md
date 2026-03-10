

# Ren Blå Fargepalett — Bakgrunn og Effekter

## Endringer i `src/pages/Auth.tsx`

### Linje 114 — Bakgrunnsfarge
Endre `style={{ backgroundColor: '#0B0F19' }}` til Tailwind-klasse `bg-slate-950` (fjern inline style).

### Linje 116-119 — Blobs (kun blåtoner, ingen lilla/rosa/teal)
Erstatt de 4 blobene med 3 rene blå blobs:
1. `bg-blue-600/20 blur-[120px]` — øverst venstre
2. `bg-cyan-500/20 blur-[120px]` — nederst høyre  
3. `bg-sky-600/20 blur-[120px]` — senter

| Fil | Endring |
|-----|---------|
| `src/pages/Auth.tsx` | Bakgrunn → `bg-slate-950`, blobs → kun blåtoner |

