alter table profiles
  add column if not exists consent_rgpd boolean not null default false,
  add column if not exists consent_rgpd_date timestamptz;
