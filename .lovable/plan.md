

# Ny industriell bakgrunn for Auth.tsx

## 1. Generer nytt bakgrunnsbilde
Bruk AI-bildegenerator til å lage `public/auth-bg.png` (erstatter eksisterende) med prompt:

> "A wide cinematic scene of an offshore heavy-lift crane vessel lifting large steel pipes, rendered in a stylized dark enterprise tech aesthetic. Deep marine navy blue and glowing cyan color palette only — no purple, pink, or warm colors. The entire scene has a subtle overlay of glowing network nodes and thin data connection lines symbolizing training procedures and safety compliance. The crane and pipes are visible as dark silhouettes with cyan edge lighting and holographic grid effects. Premium, high-tech SaaS dashboard background style. Very atmospheric, moody, wide-angle perspective. Clean corporate glassmorphism aesthetic."

## 2. Oppdater Auth.tsx
Koden bruker allerede `bg-[url('/auth-bg.png')]` — kun bildefilen byttes ut. Ingen kodeendringer nødvendig.

| Fil | Endring |
|-----|---------|
| `public/auth-bg.png` | Nytt AI-generert bilde med offshore/kran-tema i cyan/navy stil |

