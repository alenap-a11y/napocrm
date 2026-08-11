-- Le cron job rappel-rdv-veille existait déjà (0 19 * * *, appelle
-- send-rdv-reminder via pg_net) mais échouait tous les jours depuis au
-- moins le 2026-08-02 : current_setting('app.service_role_key') n'était
-- jamais défini au niveau base (ALTER DATABASE ... SET refusé, droits
-- insuffisants même en tant que postgres sur ce projet managé), et la
-- concaténation de chaînes pour construire le header Authorization en JSON
-- était de toute façon fragile. Aucun rappel n'a donc jamais été envoyé.
--
-- Remplacé par Supabase Vault (secret 'service_role_key', déjà créé hors
-- migration pour ne jamais committer la clé en clair) + jsonb_build_object
-- au lieu de concaténation de chaînes pour le corps de la requête HTTP.
--
-- Fréquence quotidienne conservée (pas horaire) : la fonction interroge
-- date_seance = demain (jour entier, pas une fenêtre précise de 24h) et n'a
-- aucune protection anti-doublon — un cron plus fréquent enverrait le même
-- rappel plusieurs fois par jour à chaque client concerné.

create extension if not exists pg_net;

select cron.unschedule('rappel-rdv-veille');

select cron.schedule(
  'rappel-rdv-veille',
  '0 19 * * *',
  $$
  select net.http_post(
    url := 'https://jzwwqngbgcdeyiqrvtle.supabase.co/functions/v1/send-rdv-reminder',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);
