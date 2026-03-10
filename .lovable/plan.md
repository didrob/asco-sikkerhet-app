

# Oppdater Dark Mode fargepalett til marineblå/cyan

## Endringer i `src/index.css`

### 1. `.dark` CSS-variabler (linje 58-94)

| Variabel | Nåværende | Ny verdi | Kommentar |
|----------|-----------|----------|-----------|
| `--background` | `222.2 84% 4.9%` | `225 53% 7%` | #0B0F19 konvertert til HSL |
| `--card` | `222.2 84% 4.9%` | `225 53% 8%` | Litt lysere enn bg, semi-transparent simulert |
| `--card-foreground` | uendret | uendret | |
| `--popover` | `222.2 84% 4.9%` | `225 53% 8%` | Matcher card |
| `--primary` | `210 40% 98%` | `199 89% 48%` | #0ea5e9 (sky-500) |
| `--primary-foreground` | `222.2 47.4% 11.2%` | `0 0% 100%` | Hvit tekst på cyan |
| `--border` | `217.2 32.6% 17.5%` | `0 0% 100% / 0.1` | rgba(255,255,255,0.1) — men CSS vars bruker HSL, så vi setter `220 13% 15%` |
| `--input` | `217.2 32.6% 17.5%` | `220 13% 15%` | Matcher border |
| `--secondary` | `217.2 32.6% 17.5%` | `225 40% 13%` | Dyp marineblå sekundær |
| `--accent` | `217.2 32.6% 17.5%` | `225 40% 13%` | Matcher secondary |
| `--muted` | `217.2 32.6% 17.5%` | `225 40% 13%` | Matcher secondary |
| `--sidebar-background` | `240 5.9% 10%` | `225 53% 6%` | Mørkere sidebar |
| `--sidebar-accent` | `240 3.7% 15.9%` | `225 40% 13%` | |
| `--sidebar-border` | `240 3.7% 15.9%` | `220 13% 15%` | |
| `--sidebar-primary` | `224.3 76.3% 48%` | `199 89% 48%` | Matcher ny primary cyan |

> Merk: Tailwind CSS-variabler bruker HSL uten `hsl()` wrapper, så `rgba()` kan ikke brukes direkte. Vi bruker tilsvarende HSL-verdier.

### 2. Glass-panel utility (etter linje 105)

Legg til:
```css
@layer utilities {
  .glass-panel {
    @apply bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl;
  }
}
```

