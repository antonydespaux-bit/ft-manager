-- ============================================================================
-- Fix RLS sur fiche_ingredients et fiche_bar_ingredients
--
-- La migration 20260408_rls_hardening_drop_user_metadata.sql a remplacé toutes
-- les vieilles policies `isolation_client_*` (basées sur `user_metadata.client_id`,
-- contournables) par des policies utilisant le helper `user_has_client_access()`
-- (basé sur `acces_clients`). MAIS elle a oublié les deux tables de jointure
-- `fiche_ingredients` et `fiche_bar_ingredients`.
--
-- Conséquence visible : un user authentifié dont `auth.jwt().user_metadata.client_id`
-- est NULL (cas normal après le hardening) voit la fiche elle-même mais aucun
-- ingrédient associé — la fiche s'affiche avec un tableau vide et coût/portion = '—'.
-- Reproduit avec Raphael Malossi (admin La Fantaisie) le 2026-04-26.
--
-- Fix : DROP les vieilles policies et recréer les 4 policies CRUD via le helper,
-- comme pour les autres tables tenant-scoped.
-- ============================================================================

-- fiche_ingredients
DROP POLICY IF EXISTS isolation_client_fiche_ingredients ON public.fiche_ingredients;

CREATE POLICY fiche_ingredients_select ON public.fiche_ingredients FOR SELECT TO authenticated
  USING (public.user_has_client_access(client_id));
CREATE POLICY fiche_ingredients_insert ON public.fiche_ingredients FOR INSERT TO authenticated
  WITH CHECK (public.user_has_client_access(client_id));
CREATE POLICY fiche_ingredients_update ON public.fiche_ingredients FOR UPDATE TO authenticated
  USING (public.user_has_client_access(client_id))
  WITH CHECK (public.user_has_client_access(client_id));
CREATE POLICY fiche_ingredients_delete ON public.fiche_ingredients FOR DELETE TO authenticated
  USING (public.user_has_client_access(client_id));

-- fiche_bar_ingredients
DROP POLICY IF EXISTS isolation_client_fiche_bar_ingredients ON public.fiche_bar_ingredients;

CREATE POLICY fiche_bar_ingredients_select ON public.fiche_bar_ingredients FOR SELECT TO authenticated
  USING (public.user_has_client_access(client_id));
CREATE POLICY fiche_bar_ingredients_insert ON public.fiche_bar_ingredients FOR INSERT TO authenticated
  WITH CHECK (public.user_has_client_access(client_id));
CREATE POLICY fiche_bar_ingredients_update ON public.fiche_bar_ingredients FOR UPDATE TO authenticated
  USING (public.user_has_client_access(client_id))
  WITH CHECK (public.user_has_client_access(client_id));
CREATE POLICY fiche_bar_ingredients_delete ON public.fiche_bar_ingredients FOR DELETE TO authenticated
  USING (public.user_has_client_access(client_id));
