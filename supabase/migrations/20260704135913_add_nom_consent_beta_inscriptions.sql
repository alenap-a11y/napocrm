alter table beta_inscriptions
  add column if not exists nom text,
  add column if not exists consent_rgpd boolean not null default false,
  add column if not exists consent_rgpd_date timestamptz;
