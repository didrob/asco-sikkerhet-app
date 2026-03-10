

# Oppdatere Auth.tsx styling til lilla/blå gradient-tema

Brukerens spesifikasjon endrer fargetemaet fra teal/grønn til lilla/blå gradient. Tre endringer trengs:

## Endringer i `src/pages/Auth.tsx`

### 1. Input-felt (linje 111)
Endre `inputClasses` fra nåværende teal-fokus til:
```
bg-black/20 border border-white/10 rounded-xl text-white pl-10 px-4 py-3 placeholder:text-white/30 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all
```

### 2. Labels (linje 188, 197)
Endre fra `text-white/60 text-xs uppercase tracking-wider` til:
```
text-slate-300 text-sm font-medium
```

### 3. Submit-knapp (linje 205-212)
Erstatte teal-styling med lilla/blå gradient:
```
className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl py-3 mt-4 hover:opacity-90 hover:scale-[1.02] transition-all duration-200 shadow-[0_0_20px_rgba(139,92,246,0.3)]"
```
Fjerne inline `style`-propen.

### 4. "Be om tilgang"-lenke (linje 216)
Endre tekst-farge til `text-purple-400` og hover til `text-purple-300`.

| Fil | Endring |
|-----|---------|
| `src/pages/Auth.tsx` | Oppdatere inputClasses, labels, submit-knapp og lenke-farger |

