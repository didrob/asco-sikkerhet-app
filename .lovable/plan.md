

# White-labeling: Fjerne Lovable-branding og Oppdatere Favicon

## Oversikt

Erstatter alle Lovable-referanser med ASCO-branding, inkludert:
1. Favicon i browser-fane
2. Open Graph og Twitter meta-bilder
3. Twitter-konto referanse

---

## Endringer

### 1. Favicon

**Handling**: Kopiere brukerens opplastede ASCO-ikon til `public/`

```bash
# Kopiere liten logo til public mappe
lov-copy user-uploads://image-11.png public/favicon.png
```

**Oppdatere index.html**:

```html
<!-- FØR -->
<!-- (ingen eksplisitt favicon-link, bruker default favicon.ico) -->

<!-- ETTER -->
<link rel="icon" href="/favicon.png" type="image/png">
```

---

### 2. Open Graph Bilder

**Handling**: Kopiere større logo til public for OG-bilder

```bash
lov-copy user-uploads://image-12.png public/og-image.png
```

**Oppdatere index.html**:

```html
<!-- FØR -->
<meta property="og:image" content="https://lovable.dev/opengraph-image-p98pqg.png" />
<meta name="twitter:image" content="https://lovable.dev/opengraph-image-p98pqg.png" />
<meta name="twitter:site" content="@Lovable" />

<!-- ETTER -->
<meta property="og:image" content="/og-image.png" />
<meta name="twitter:image" content="/og-image.png" />
<meta name="twitter:site" content="@ASCO" />
```

---

### 3. Slette gammel favicon

**Handling**: Fjerne den gamle Lovable `favicon.ico`:

```
public/favicon.ico  → SLETT
```

---

## Fil-endringer

| Fil | Endring |
|-----|---------|
| `public/favicon.png` | NY - ASCO-ikon for browser-fane |
| `public/og-image.png` | NY - ASCO-logo for deling på sosiale medier |
| `public/favicon.ico` | SLETT - Gammel Lovable favicon |
| `index.html` | Oppdater favicon-link, OG-bilder og Twitter-konto |

---

## Resultat

Etter implementering:

- **Browser-fane**: Viser ASCO-ikonet (turkis sirkel med A)
- **Deling på sosiale medier**: Viser ASCO-logo i stedet for Lovable
- **Twitter**: Refererer til @ASCO i stedet for @Lovable
- **Ingen Lovable-referanser** synlig for sluttbrukere

