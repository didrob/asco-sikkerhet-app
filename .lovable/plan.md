

# Ny bakgrunnsgrafikk for Auth.tsx — inspirert av referansebilde

## Konsept

Referansebildet viser en mørk, premium tech-estetikk med:
- Dyp, nesten svart bakgrunn med subtile blå/cyan lyseffekter
- Metallic/industrielle teksturer (gittermønster på bordet)
- Subtil ambient belysning i teal/cyan som lyser opp fra bunnen
- Veldig minimalistisk og "moody"

Forslag for ASCO: Generer et bilde med en **mørk industriell scene** — tenk et kontrollrom eller en digital arbeidsstasjon med subtile cyan/teal lysstriper, strukturerte metalliske overflater, og kanskje antydninger til digitale skjermer/dashboards som representerer prosedyre- og opplæringshub-temaet. Fargene holdes til deep navy (#0B0F19), mørk grå, og ASCO teal/cyan som aksentbelysning — akkurat som i referansebildet.

## Plan

### 1. Generer nytt bakgrunnsbilde
Bruk AI-bildegenerator med prompt:
> "A dark, moody, premium technology workspace scene viewed from above at an angle. Deep black and dark navy background with subtle cyan and teal ambient lighting glowing from edges and surfaces. Features structured metallic grid textures, faint digital dashboard screens, and industrial control panel elements suggesting safety procedures and training systems. The lighting style matches a high-end SaaS landing page — minimal, elegant, with soft cyan/teal light reflections on dark surfaces. No people, no purple or pink colors. Ultra clean, cinematic, corporate dark mode aesthetic."

Lagre som `public/auth-bg.png` (erstatter eksisterende).

### 2. Ingen kodeendringer nødvendig
`Auth.tsx` bruker allerede `bg-[url('/auth-bg.png')]` med overlay — kun bildefilen byttes ut.

| Fil | Endring |
|-----|---------|
| `public/auth-bg.png` | Erstattes med nytt AI-generert bilde |

