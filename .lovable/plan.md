

# Generere AI-bilde for Innloggingsside

## Bildetema

Basert på appens formål (ASCO Prosedyrehub - digital sikkerhetsoperasjoner), vil jeg generere et profesjonelt bilde som kombinerer:

- **Industriell sikkerhet** - HMS, verneutstyr, prosedyrer
- **Digital teknologi** - moderne, profesjonelt utseende
- **Samarbeid** - team som jobber sammen med dokumenter/prosedyrer

## Prompt for bildegenerering

```
Professional corporate photography of a modern industrial control room, 
engineers in safety vests reviewing digital procedures on tablet devices, 
clean and bright environment, blue and teal color scheme matching ASCO brand, 
safety equipment visible in background, high-tech monitoring screens, 
professional corporate atmosphere, soft natural lighting, 
high quality 4K realistic photography
```

## Implementering

### 1. Generere bilde
Bruke Nano banana (google/gemini-2.5-flash-image) via Lovable AI Gateway

### 2. Lagre bilde
Lagre som `public/auth-background.jpg`

### 3. Oppdatere Auth.tsx
Endre layouten til split-screen design:

```
+---------------------------+---------------------------+
|                           |                           |
|     [AI-generert bilde]   |      ASCO Prosedyrehub    |
|                           |      ────────────────     |
|     Industriell sikkerhet |                           |
|     Digital prosedyrer    |      E-post: [________]   |
|     Profesjonelt team     |      Passord: [________]  |
|                           |                           |
|                           |      [Logg inn]           |
|                           |                           |
|                           |      Har du ikke tilgang? |
|                           |      [Be om tilgang]      |
|                           |                           |
+---------------------------+---------------------------+
```

### 4. Fil-endringer

| Fil | Endring |
|-----|---------|
| `public/auth-background.jpg` | NY - AI-generert bilde |
| `src/pages/Auth.tsx` | Oppdatert layout med bildepanel |

## Resultat

- Profesjonell innloggingsside med relevant bilde
- Split-screen design som matcher enterprise-apper
- Bilde som kommuniserer appens formål (sikkerhet, prosedyrer, industri)
- Responsivt design (bilde skjules på mobil)

