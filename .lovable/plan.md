

# Fiks Layout og Avstand på Auth-siden

## Endring i `src/pages/Auth.tsx`

**Linje 125** — Oppdater grid-containeren fra:
```
relative z-10 w-full grid lg:grid-cols-2 min-h-screen
```
til:
```
relative z-10 max-w-5xl mx-auto w-full px-6 gap-12 lg:gap-20 items-center grid lg:grid-cols-2 min-h-screen
```

Dette sentrerer innholdet som en fast boks, reduserer gapet mellom kolonnene, og vertikalt sentrerer begge kolonnene med `items-center`.

**Linje 127** — Fjern `px-8 lg:px-16` padding fra venstre kolonne (erstattet av `px-6` på parent) og fjern `py-12` som ikke trengs med `items-center`.

| Fil | Endring |
|-----|---------|
| `src/pages/Auth.tsx` | Oppdatere grid-container classes + justere kolonne-padding |

