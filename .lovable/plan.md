
# Fjern all lilla — Ren blå fargepalett i Auth.tsx

Fant 5 steder med lilla farger som må byttes:

| Linje | Nå | Endres til |
|-------|----|------------|
| 111 | `focus:border-purple-500 focus:ring-purple-500` | `focus:border-blue-500 focus:ring-blue-500` |
| 137 | `from-purple-400 via-blue-400 to-cyan-400` | `from-blue-300 via-cyan-300 to-white` |
| 206 | `from-blue-600 to-purple-600` + lilla shadow | `from-blue-600 to-cyan-600` + `shadow-[0_0_20px_rgba(14,165,233,0.4)]` |
| 218 | `text-purple-400 hover:text-purple-300` | `text-sky-400 hover:text-sky-300` |

4 enkle find-and-replace endringer i `src/pages/Auth.tsx`. Ingen andre filer berørt. Ingen Supabase Auth-komponent brukes (dette er et custom login-skjema), så ingen `appearance`-config trengs.
