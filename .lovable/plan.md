# Implementering Del 9 - Separasjon av Prosedyrer og Opplæring

## ✅ Fullført (30. januar 2026)

### Database (Migrert)
- [x] `training_type` enum (theoretical, practical, video, mixed)
- [x] `training_courses` tabell med prosedyre-kobling og role-krav
- [x] `training_groups` tabell for brukergrupper
- [x] `training_group_members` tabell
- [x] `training_assignments` tabell med frist og status
- [x] `training_progress` tabell
- [x] RLS-policies for alle tabeller
- [x] Triggers for updated_at

### Hooks (Implementert)
- [x] `useTraining.ts` - Kurs CRUD, mine kurs
- [x] `useTrainingGroups.ts` - Grupper og medlemmer
- [x] `useTrainingAssignments.ts` - Tildelinger
- [x] `useTrainingOverview.ts` - HSQ statistikk per site, forfalte, rolle-compliance

### Sider (Implementert)
- [x] `/training` - Mine aktive kurs
- [x] `/training/history` - Min opplæringshistorikk
- [x] `/training/manage` - Administrer kurs (CRUD)
- [x] `/training/groups` - Gruppehåndtering
- [x] `/training/overview` - HSQ dashboard med site-sammenligning

### Komponenter (Implementert)
- [x] `EmailComposer.tsx` - E-post utsendelse med BCC-støtte
- [x] `GroupSelector.tsx` - Velg grupper for tildeling

### E-post (Implementert)
- [x] `src/lib/email.ts` - mailto med BCC-støtte

### Navigasjon (Oppdatert)
- [x] `Sidebar.tsx` - Ny Opplæring-seksjon med alle undermenyer
- [x] `MobileNav.tsx` - Oppdatert navigasjon
- [x] `App.tsx` - Nye ruter

---

## 🔲 Gjenstår

### Sider
- [ ] `TrainingEditor.tsx` - Opprett/rediger kurs med prosedyre-velger
- [ ] `TrainingViewer.tsx` - Gjennomføring av kurs for brukere
- [ ] `TrainingAssignments.tsx` - Dedikert utsendelse-side
- [ ] `TrainingGroupMembers.tsx` - Administrer gruppemedlemmer detaljert

### Komponenter
- [ ] `ProcedureSelector.tsx` - Velg prosedyrer for kurs
- [ ] `UserSelector.tsx` - Søk og velg enkeltbrukere
- [ ] `RoleComplianceTable.tsx` - Detaljert compliance-visning (utvidelse)

### Terminologi-oppdateringer
- [ ] Erstatte "sertifikater" med "gjennomført opplæring" i eksisterende sider

---

## Neste steg

1. **TrainingEditor** - Kursopprettelse med:
   - Prosedyre-velger (kobling til underliggende dokumenter)
   - Innholdsblokker (tekst, video, quiz, praktisk øvelse)
   - Rolle-krav (påkrevd for spesifikke roller)
   - Bestått-terskel (f.eks. 80%)

2. **TrainingViewer** - Kursgjennomføring:
   - Steg-for-steg navigering
   - Quiz med scoring
   - Praktiske sjekklister
   - Signatur ved fullføring

3. **TrainingAssignments** - E-post utsendelse:
   - Velg kurs
   - Velg grupper/brukere
   - Sett frist
   - Send via lokal e-postklient

4. **Terminologi** - Oppdater eksisterende sider:
   - Fjern "sertifikat" terminologi
   - Bruk "bestått/gjennomført"

---

## Arkitektur

```
Prosedyrer (Referanse)           Opplæring (Aktiv læring)
├── Les og bekreft               ├── Kurs med quiz/øvelser
├── Enkel signatur               ├── Score og bestått/ikke bestått
└── Ingen progression            ├── Grupper og utsendelse
                                 └── HSQ-oversikt per site
```
