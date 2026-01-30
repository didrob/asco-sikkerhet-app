
# Implementering Del 8 - Digital Signatur, Sertifikater og Governance Portal

## Oversikt

Denne utvidede fasen kombinerer:
1. **Integrert Audit Logging** - Automatisk logging i alle mutasjoner
2. **Forbedret Digital Signatur** - Bekreftelsesflyt med compliance-tekst
3. **Sertifikat-generering** - Nedlastbart diplom/sertifikat
4. **Governance Portal** - Eksternt innsyn for kunder og revisorer
5. **UX-forbedringer** - Bekreftelsesdialoger og empty states

---

## Del 1: Forbedret Digital Signatur-flyt

### Ny SigningFlow-komponent

Erstatter/forbedrer eksisterende SignatureDialog med compliance-fokusert flyt:

```text
+----------------------------------------+
|         BEKREFT OG SIGNER              |
|                                        |
| "Jeg bekrefter at jeg har lest og      |
|  forstått [Prosedyrenavn] og vil       |
|  følge denne i mitt arbeid."           |
|                                        |
|  [ ] Jeg forstår og godtar             |
|                                        |
|  +-----------------------------+       |
|  |   [Signatur-canvas]         |       |
|  +-----------------------------+       |
|                                        |
|  -- ELLER --                           |
|                                        |
|  [Signer med 2FA-simulering]           |
|                                        |
|         [Avbryt]  [Fullfør og signer]  |
+----------------------------------------+
```

### Endringer

| Komponent | Endring |
|-----------|---------|
| SignatureDialog.tsx | Legg til bekreftelsestekst og checkbox |
| useProcedureProgress.ts | Logg SIGNED-event til audit_log |

### Audit Entry ved Signering

```typescript
{
  action: 'sign',
  resource_type: 'procedure',
  resource_id: procedureId,
  metadata: {
    procedure_version: procedure.updated_at,
    signature_type: 'drawn' | 'typed' | '2fa_simulation',
    confirmation_text: "Jeg bekrefter at jeg har lest..."
  }
}
```

---

## Del 2: Sertifikat-generering

### Ny Side: CertificateViewer.tsx

Viser brukerens fullførte prosedyrer med nedlastbart sertifikat.

```text
+----------------------------------------+
|    ASCO                                |
|    SERTIFIKAT                          |
|                                        |
|    Dette bekrefter at                  |
|                                        |
|    [BRUKER NAVN]                       |
|                                        |
|    har fullført prosedyren             |
|                                        |
|    "HMS Introduksjon"                  |
|                                        |
|    Dato: 30. januar 2026               |
|                                        |
|    [QR-kode for verifisering]          |
|                                        |
|    Sertifikat-ID: abc123               |
+----------------------------------------+
```

### Funksjonalitet

| Funksjon | Beskrivelse |
|----------|-------------|
| Visning | Vis sertifikat i browser |
| Print/PDF | CSS print-styling for utskrift |
| QR-kode | Lenke til verifiseringsside |
| Verifisering | Offentlig side for å verifisere sertifikat |

### Nye Filer

- `src/pages/Certificates.tsx` - Liste over brukerens sertifikater
- `src/pages/CertificateViewer.tsx` - Enkelt sertifikat-visning
- `src/pages/VerifyCertificate.tsx` - Offentlig verifiseringsside
- `src/components/certificate/CertificateTemplate.tsx` - Sertifikat-mal

---

## Del 3: Nye Roller og Governance Layout

### Database-endringer

Utvide app_role enum med nye roller:

```sql
ALTER TYPE public.app_role ADD VALUE 'external_client';
ALTER TYPE public.app_role ADD VALUE 'auditor';
```

### Nye Roller

| Rolle | Beskrivelse | Tilgang |
|-------|-------------|---------|
| external_client | Ekstern kunde | Kun Governance Dashboard |
| auditor | Revisor | Governance + full audit log |

### GovernanceLayout

Separat layout for eksterne brukere uten operasjonelle funksjoner:

```text
+----------------------------------------+
| ASCO Governance Center                 |
+----------------------------------------+
| [Compliance] [Revisjon*] [Sertifikater]|
+----------------------------------------+
|                                        |
|  [Innhold basert på valgt fane]        |
|                                        |
+----------------------------------------+
* Kun synlig for AUDITOR
```

---

## Del 4: Governance Dashboard

### Compliance-fane (alle governance-brukere)

```text
+-------------------+-------------------+
|  COMPLIANCE RATE  |   RISK COVERAGE   |
|      [87%]        |      [94%]        |
|   Gauge Chart     |   Gauge Chart     |
+-------------------+-------------------+

NYLIG SERTIFISERTE OPERATORER
+----------------------------------------+
| Kranfører - Sertifisert 10:42 i dag    |
| HMS Basis - Sertifisert 09:15 i dag    |
| Brannøvelse - Sertifisert i går        |
+----------------------------------------+
```

### Revisjon-fane (kun AUDITOR)

```text
PROSEDYRE-HISTORIKK
+----------------------------------------+
| [Søk...]  [Velg prosedyre v]           |
+----------------------------------------+
| Versjon | Handling | Dato    | Brukere |
|---------|----------|---------|---------|
| v1.2    | Publisert| 15. jan | 42      |
| v1.1    | Oppdatert| 10. jan | 38      |
| v1.0    | Opprettet| 01. jan | -       |
+----------------------------------------+

SIGNERINGS-LOGG FOR VALGT VERSJON
+----------------------------------------+
| Bruker      | Signert     | Status    |
|-------------|-------------|-----------|
| Ola N.      | 16. jan     | Gyldig    |
| Kari S.     | 17. jan     | Gyldig    |
+----------------------------------------+
```

---

## Del 5: Integrert Audit Logging

### Mutasjoner som oppdateres

| Fil | Mutasjon | Audit Action |
|-----|----------|--------------|
| useProcedureMutations.ts | useCreateProcedure | create |
| useProcedureMutations.ts | useUpdateProcedure | update |
| useProcedureMutations.ts | usePublishProcedure | publish |
| useProcedureMutations.ts | useDeleteProcedure | delete |
| useAdminRoles.ts | useAssignRole | assign |
| useAdminRoles.ts | useRemoveRole | remove |
| useProcedureProgress.ts | useCompleteProcedure | sign |

---

## Del 6: UX-forbedringer

### ConfirmDialog Komponent

Gjenbrukbar bekreftelsesdialog for destruktive handlinger.

### Forbedrede Empty States

Informative tomme tilstander med handlingsknapper i:
- ProcedureList
- AdminUsers
- AdminSites

---

## Filendringer

### Nye Filer

| Fil | Beskrivelse |
|-----|-------------|
| `src/components/ui/confirm-dialog.tsx` | Bekreftelsesdialog |
| `src/components/layout/GovernanceLayout.tsx` | Layout for eksterne |
| `src/pages/governance/GovernanceDashboard.tsx` | Compliance-oversikt |
| `src/pages/governance/AuditDeepDive.tsx` | Revisor-verktøy |
| `src/pages/Certificates.tsx` | Mine sertifikater |
| `src/pages/CertificateViewer.tsx` | Enkelt sertifikat |
| `src/pages/VerifyCertificate.tsx` | Offentlig verifisering |
| `src/components/certificate/CertificateTemplate.tsx` | Sertifikat-mal |
| `src/hooks/useCompletions.ts` | Hent fullføringer |
| `src/hooks/useGovernanceStats.ts` | Statistikk for governance |
| `supabase/migrations/xxx_add_governance_roles.sql` | Nye roller |

### Oppdaterte Filer

| Fil | Endring |
|-----|---------|
| `src/components/procedure/SignatureDialog.tsx` | Bekreftelsestekst |
| `src/hooks/useProcedureMutations.ts` | Audit logging |
| `src/hooks/useAdminRoles.ts` | Audit logging |
| `src/hooks/useProcedureProgress.ts` | Sign-event logging |
| `src/hooks/useRoleAccess.ts` | Nye rollesjekker |
| `src/App.tsx` | Nye ruter |
| `src/components/layout/Sidebar.tsx` | Sertifikater-lenke |

---

## Tekniske Detaljer

### SignatureDialog med Bekreftelse

```typescript
// Ny bekreftelsestekst
const confirmationText = `Jeg bekrefter at jeg har lest og forstått "${procedureTitle}" og vil følge denne i mitt arbeid.`;

// Checkbox for bekreftelse
<div className="flex items-start gap-3 p-4 border rounded-lg bg-primary/5">
  <Checkbox
    checked={confirmed}
    onCheckedChange={setConfirmed}
  />
  <label className="text-sm leading-relaxed">
    {confirmationText}
  </label>
</div>
```

### Sertifikat-template med Print-styling

```typescript
// CertificateTemplate.tsx
export function CertificateTemplate({ completion, procedure, user }) {
  return (
    <div className="certificate print:w-full print:h-full">
      <div className="certificate-header">
        <img src={logo} alt="ASCO" />
        <h1>SERTIFIKAT</h1>
      </div>
      <div className="certificate-body">
        <p>Dette bekrefter at</p>
        <h2>{user.full_name}</h2>
        <p>har fullført prosedyren</p>
        <h3>"{procedure.title}"</h3>
        <p>Dato: {format(completion.completed_at, 'PPP')}</p>
      </div>
      <div className="certificate-footer">
        <QRCode value={verificationUrl} />
        <p>ID: {completion.id.slice(0, 8)}</p>
      </div>
    </div>
  );
}
```

### Governance Stats Hook

```typescript
export function useGovernanceStats() {
  return useQuery({
    queryKey: ['governance_stats'],
    queryFn: async () => {
      // Hent alle brukere med site-tilknytning
      // Hent alle fullføringer
      // Beregn compliance rate
      // Beregn risk coverage
      return {
        complianceRate: 87,
        riskCoverage: 94,
        recentCertifications: [...],
        totalUsers: 150,
        certifiedUsers: 130,
      };
    },
  });
}
```

### Database Migration

```sql
-- Legg til nye roller
ALTER TYPE public.app_role ADD VALUE 'external_client';
ALTER TYPE public.app_role ADD VALUE 'auditor';

-- RLS for governance-brukere
CREATE POLICY "Governance users can view completions"
ON public.procedure_completions
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'auditor', null) OR
  has_role(auth.uid(), 'external_client', null)
);
```

---

## Implementeringsrekkefølge

1. **Database-migrering** - Nye roller
2. **ConfirmDialog** - Gjenbrukbar komponent
3. **Forbedret SignatureDialog** - Bekreftelsestekst
4. **Audit logging integrasjon** - I alle mutasjoner
5. **Sertifikat-komponenter** - Template og visning
6. **useRoleAccess oppdatering** - Nye rollesjekker
7. **GovernanceLayout** - Ny layout
8. **Governance Dashboard** - Statistikk og live feed
9. **Audit Deep-Dive** - Revisor-verktøy
10. **Routing** - Nye ruter i App.tsx

---

## Navigasjonsstruktur etter implementering

### For Interne Brukere

```text
Prosedyrer
├── Alle prosedyrer
└── Mine sertifikater (ny)

Governance (admin)
├── Roller
└── Aktivitetslogg

Administrasjon
├── Administrer prosedyrer
├── Rapporter
├── Sites
├── Brukere
└── Innstillinger
```

### For Governance-brukere (external_client, auditor)

```text
ASCO Governance Center
├── Compliance (alle)
├── Revisjon (kun auditor)
└── Sertifikater (alle)
```

---

## Resultat Etter Implementering

- Compliance-fokusert signaturflyt med bekreftelsestekst
- Nedlastbare sertifikater med QR-verifisering
- Ekstern tilgang for kunder og revisorer
- Full sporbarhet med automatisk audit logging
- Data-tung governance-visning for revisorer
- Bekreftelsesdialoger før destruktive handlinger
