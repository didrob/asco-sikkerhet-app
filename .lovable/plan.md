

# Oppdater Auth.tsx — bakgrunn og logo-layout

## Endringer

### 1. Nytt bakgrunnsbilde
Generer nytt `public/auth-bg.png` med mer avstand/perspektiv — som om man ser et mørkt teknologisk kontrollrom/arbeidsrom på avstand. Dypere, mer atmosfærisk, med cyan/teal ambient lys i bakgrunnen. Prompt:
> "A wide, distant view of a dark industrial technology control room seen from far away. Deep black and navy atmosphere with subtle cyan and teal ambient lighting in the distance. Metallic surfaces, faint glowing screens and structured panels visible far away. Very atmospheric, moody depth-of-field effect. No people. No purple or pink. Ultra clean cinematic corporate aesthetic. Wide angle, pulled back perspective."

### 2. Endre logo-seksjonen (linje 123-129)
Fjern den dupliserte "ASCO"-teksten. Erstatt med:
- Større logo (`h-16` i stedet for `h-12`)
- Kun "Prosedyrehub" tekst under logoen
- Sentrert vertikalt layout i stedet for horisontal

```tsx
<div className="mb-8 flex flex-col items-start gap-2">
  <img src={logoLight} alt="ASCO" className="h-16 w-auto" />
  <p className="text-white/50 text-sm font-medium tracking-wider">Prosedyrehub</p>
</div>
```

| Fil | Endring |
|-----|---------|
| `public/auth-bg.png` | Nytt bilde med mer avstand/perspektiv |
| `src/pages/Auth.tsx` | Forenkle logo-seksjon, fjern duplikat "ASCO" |

