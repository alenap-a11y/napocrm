-- Suppression d'un doublon vide "Sante et Bien-etre" cree par erreur en testant
-- le catalogue questions, puis creation de la categorie Napo-Oracle regroupant
-- les 9 tuiles catalogue cartes/questions, separees de Napo-Outils/Seance
-- (qui garde uniquement Symbole Reiki et Cartes addon).

DELETE FROM public.marketplace_modules WHERE id = '4496b313-6924-4276-bddb-3fcb76d248cc';

UPDATE public.marketplace_modules SET category = 'Napo-Oracle' 
WHERE id IN (
  '671c90b8-225b-48a7-8dad-9863d901040d',
  'dbb7c2dd-804f-4c5d-bfd3-01980b276fde',
  'bcf888b7-fc45-47f1-a092-d981972714d5',
  '76cd0f4a-e564-429c-9fb6-6213e18bc342',
  '28aad78a-5e0b-45ff-8c03-2ea2f084ec29',
  'bd43559f-25bb-4460-8439-fd87f2bec977',
  'f7f546e0-b74b-48a8-a312-a8b7496c3ad6',
  'a6905a86-50b0-47f9-93dd-a36939af442b',
  '8930d361-834c-4691-8ba2-d64b65c6c37a'
);
