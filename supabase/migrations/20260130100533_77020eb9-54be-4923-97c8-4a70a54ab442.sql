-- Insert test procedure for HMS Introduction
INSERT INTO procedures (site_id, title, description, status, content_blocks)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'HMS Introduksjon',
  'Grunnleggende HMS-opplæring for nye ansatte ved ASCO',
  'published',
  '[
    {"id": "block-1", "type": "text", "content": {"text": "Velkommen til ASCO HMS-opplæring. Denne prosedyren dekker grunnleggende sikkerhetsprosedyrer som alle ansatte må kjenne til. Les nøye gjennom hvert steg og bekreft at du har forstått innholdet."}},
    {"id": "block-2", "type": "checkpoint", "content": {"label": "Jeg har lest og forstått innledningen til HMS-opplæringen"}},
    {"id": "block-3", "type": "text", "content": {"text": "Ved brannalarm skal du umiddelbart forlate bygningen via nærmeste nødutgang. Ikke bruk heis. Møt opp på oppmøteplassen utenfor hovedinngangen."}},
    {"id": "block-4", "type": "quiz", "content": {"question": "Hva gjør du ved brannalarm?", "options": ["Fortsetter å jobbe til alarmen stopper", "Evakuerer umiddelbart via nærmeste nødutgang", "Venter på beskjed fra leder"], "correct": 1}},
    {"id": "block-5", "type": "text", "content": {"text": "Gratulerer! Du har fullført HMS-introduksjonen. Husk å alltid prioritere sikkerhet og rapportere eventuelle farlige forhold til din leder."}}
  ]'::jsonb
)
ON CONFLICT DO NOTHING;