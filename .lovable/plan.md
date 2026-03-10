

# Oppdater overskrift på innloggingssiden

## Endring i `src/pages/Auth.tsx`

Erstatt den nåværende overskriften:
```
text-5xl lg:text-7xl → text-3xl lg:text-5xl
"Sikkerhet og Kompetanse i Fokus" → "Prosedyrer. Opplæring. Kontroll."
```

Fjern `<span>`-wrapperen siden teksten nå er kort nok til å stå uten styling-splitting.

