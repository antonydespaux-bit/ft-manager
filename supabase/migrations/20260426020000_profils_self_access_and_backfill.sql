-- ============================================================================
-- profils — accès self + backfill client_id
--
-- Problème : un user dont `profils.client_id` est NULL ne pouvait pas voir
-- son propre profil après le passage aux policies basées sur
-- `user_has_client_access(client_id)` (qui retourne false pour client_id NULL).
--
-- Fix double :
--   1. Policy `profils_select_own` : un user peut toujours voir/modifier sa
--      propre row, indépendamment de client_id. Robuste pour tout futur cas.
--   2. Backfill `profils.client_id` depuis `acces_clients` pour les users
--      qui n'ont qu'un seul accès (cas Raphael Malossi).
-- ============================================================================

-- 1. Policy "voir/modifier son propre profil"
CREATE POLICY profils_select_own ON public.profils FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY profils_update_own ON public.profils FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- 2. Backfill : profils.client_id ← unique acces_clients.client_id
UPDATE public.profils p
SET client_id = ac.client_id
FROM public.acces_clients ac
WHERE p.id = ac.user_id
  AND p.client_id IS NULL
  AND (SELECT COUNT(*) FROM public.acces_clients ac2 WHERE ac2.user_id = p.id) = 1;
