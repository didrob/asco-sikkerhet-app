

# Fiks Dark Mode for Collapsible Navigation

## Problem

I dark mode vises CollapsibleContent (innholdet under seksjoner som "PROSEDYRER", "KURS", etc.) med hvit bakgrunn i stedet for mørk bakgrunn. Dette skaper dårlig kontrast og UX som vist i skjermbildet.

## Rotårsak

Radix Collapsible-komponenten bruker en intern `Presence`-wrapper som kan forstyrre CSS-arv. Selv om sidebaren har `bg-card`, arver ikke CollapsibleContent denne bakgrunnsfargen korrekt i alle tilfeller.

## Løsning

Oppdatere `CollapsibleContent`-komponenten i `src/components/ui/collapsible.tsx` til å eksplisitt sette bakgrunnsfargen til `transparent` eller `inherit` slik at den arver riktig fra forelderen.

## Fil-endringer

### 1. src/components/ui/collapsible.tsx

Endre fra enkel re-eksport til en tilpasset komponent med riktig styling:

```typescript
// FØR
const CollapsibleContent = CollapsiblePrimitive.CollapsibleContent;

// ETTER
import * as React from "react";
import { cn } from "@/lib/utils";

const CollapsibleContent = React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.CollapsibleContent>,
  React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.CollapsibleContent>
>(({ className, ...props }, ref) => (
  <CollapsiblePrimitive.CollapsibleContent
    ref={ref}
    className={cn("bg-transparent", className)}
    {...props}
  />
));
CollapsibleContent.displayName = CollapsiblePrimitive.CollapsibleContent.displayName;
```

### 2. Alternativ: Legg til global CSS-regel i index.css

Hvis løsning 1 ikke fungerer perfekt, kan vi legge til en CSS-regel som sikrer at Collapsible-innhold i sidebaren arver bakgrunnsfargen:

```css
/* Sikre at collapsible-innhold arver bakgrunnsfarge */
[data-radix-collapsible-content] {
  background-color: inherit;
}
```

## Teknisk detaljer

| Fil | Endring |
|-----|---------|
| `src/components/ui/collapsible.tsx` | Oppdatert til forwardRef-komponent med eksplisitt `bg-transparent` |

## Resultat

- Collapsible-navigasjon vil ha transparent bakgrunn
- Sidebaren vil vise korrekt mørk bakgrunn i dark mode
- Alle seksjoner (PROSEDYRER, KURS, RAPPORTER, SYSTEM) vil se riktig ut

