-- Alimente les 4 KPIs du header : total, ce mois, revenus, durée moy.
CREATE OR REPLACE VIEW public.seances_stats AS
SELECT
  user_id,
  COUNT(*)                                    AS total_seances,
  COUNT(*) FILTER (
    WHERE date_trunc('month', date_seance) =
          date_trunc('month', CURRENT_DATE))   AS seances_ce_mois,
  COALESCE(SUM(prix_euros) FILTER (
    WHERE date_trunc('month', date_seance) =
          date_trunc('month', CURRENT_DATE)), 0) AS revenus_ce_mois,
  ROUND(AVG(duree_minutes))                   AS duree_moyenne_min
FROM public.seances
GROUP BY user_id;

-- RLS sur la vue
ALTER VIEW public.seances_stats SET (security_invoker = true);
