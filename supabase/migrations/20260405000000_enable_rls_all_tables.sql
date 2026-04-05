-- ============================================================================
-- V2 Security: Enable RLS on ALL tenant-scoped tables.
--
-- Pattern: Every table with client_id gets RLS policies that check
-- the user has an entry in acces_clients for that client_id.
--
-- The service_role key bypasses RLS, so server-side API routes
-- using getServiceClient() continue to work for superadmins.
--
-- Anon/authenticated users can ONLY access data for their assigned clients.
-- ============================================================================

-- ─── Helper: reusable function to check client access ──────────────────────
CREATE OR REPLACE FUNCTION public.user_has_client_access(p_client_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.acces_clients
    WHERE user_id = auth.uid()
      AND client_id = p_client_id
  );
$$;

COMMENT ON FUNCTION public.user_has_client_access IS
  'Returns true if the current authenticated user has access to the given client_id via acces_clients.';

-- ─── Macro: enable RLS + create standard CRUD policies ─────────────────────
-- We apply the same pattern to every tenant-scoped table.

-- ──────────────────────────────────────────────────────────────────────────────
-- 1. fiches
-- ──────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.fiches ENABLE ROW LEVEL SECURITY;

CREATE POLICY fiches_select ON public.fiches FOR SELECT TO authenticated
  USING (public.user_has_client_access(client_id));
CREATE POLICY fiches_insert ON public.fiches FOR INSERT TO authenticated
  WITH CHECK (public.user_has_client_access(client_id));
CREATE POLICY fiches_update ON public.fiches FOR UPDATE TO authenticated
  USING (public.user_has_client_access(client_id))
  WITH CHECK (public.user_has_client_access(client_id));
CREATE POLICY fiches_delete ON public.fiches FOR DELETE TO authenticated
  USING (public.user_has_client_access(client_id));

-- ──────────────────────────────────────────────────────────────────────────────
-- 2. fiches_bar
-- ──────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.fiches_bar ENABLE ROW LEVEL SECURITY;

CREATE POLICY fiches_bar_select ON public.fiches_bar FOR SELECT TO authenticated
  USING (public.user_has_client_access(client_id));
CREATE POLICY fiches_bar_insert ON public.fiches_bar FOR INSERT TO authenticated
  WITH CHECK (public.user_has_client_access(client_id));
CREATE POLICY fiches_bar_update ON public.fiches_bar FOR UPDATE TO authenticated
  USING (public.user_has_client_access(client_id))
  WITH CHECK (public.user_has_client_access(client_id));
CREATE POLICY fiches_bar_delete ON public.fiches_bar FOR DELETE TO authenticated
  USING (public.user_has_client_access(client_id));

-- ──────────────────────────────────────────────────────────────────────────────
-- 3. ingredients
-- ──────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;

CREATE POLICY ingredients_select ON public.ingredients FOR SELECT TO authenticated
  USING (public.user_has_client_access(client_id));
CREATE POLICY ingredients_insert ON public.ingredients FOR INSERT TO authenticated
  WITH CHECK (public.user_has_client_access(client_id));
CREATE POLICY ingredients_update ON public.ingredients FOR UPDATE TO authenticated
  USING (public.user_has_client_access(client_id))
  WITH CHECK (public.user_has_client_access(client_id));
CREATE POLICY ingredients_delete ON public.ingredients FOR DELETE TO authenticated
  USING (public.user_has_client_access(client_id));

-- ──────────────────────────────────────────────────────────────────────────────
-- 4. ingredients_bar
-- ──────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.ingredients_bar ENABLE ROW LEVEL SECURITY;

CREATE POLICY ingredients_bar_select ON public.ingredients_bar FOR SELECT TO authenticated
  USING (public.user_has_client_access(client_id));
CREATE POLICY ingredients_bar_insert ON public.ingredients_bar FOR INSERT TO authenticated
  WITH CHECK (public.user_has_client_access(client_id));
CREATE POLICY ingredients_bar_update ON public.ingredients_bar FOR UPDATE TO authenticated
  USING (public.user_has_client_access(client_id))
  WITH CHECK (public.user_has_client_access(client_id));
CREATE POLICY ingredients_bar_delete ON public.ingredients_bar FOR DELETE TO authenticated
  USING (public.user_has_client_access(client_id));

-- ──────────────────────────────────────────────────────────────────────────────
-- 5. fiche_ingredients
-- ──────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.fiche_ingredients ENABLE ROW LEVEL SECURITY;

CREATE POLICY fiche_ingredients_select ON public.fiche_ingredients FOR SELECT TO authenticated
  USING (public.user_has_client_access(client_id));
CREATE POLICY fiche_ingredients_insert ON public.fiche_ingredients FOR INSERT TO authenticated
  WITH CHECK (public.user_has_client_access(client_id));
CREATE POLICY fiche_ingredients_update ON public.fiche_ingredients FOR UPDATE TO authenticated
  USING (public.user_has_client_access(client_id))
  WITH CHECK (public.user_has_client_access(client_id));
CREATE POLICY fiche_ingredients_delete ON public.fiche_ingredients FOR DELETE TO authenticated
  USING (public.user_has_client_access(client_id));

-- ──────────────────────────────────────────────────────────────────────────────
-- 6. fiche_bar_ingredients
-- ──────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.fiche_bar_ingredients ENABLE ROW LEVEL SECURITY;

CREATE POLICY fiche_bar_ingredients_select ON public.fiche_bar_ingredients FOR SELECT TO authenticated
  USING (public.user_has_client_access(client_id));
CREATE POLICY fiche_bar_ingredients_insert ON public.fiche_bar_ingredients FOR INSERT TO authenticated
  WITH CHECK (public.user_has_client_access(client_id));
CREATE POLICY fiche_bar_ingredients_update ON public.fiche_bar_ingredients FOR UPDATE TO authenticated
  USING (public.user_has_client_access(client_id))
  WITH CHECK (public.user_has_client_access(client_id));
CREATE POLICY fiche_bar_ingredients_delete ON public.fiche_bar_ingredients FOR DELETE TO authenticated
  USING (public.user_has_client_access(client_id));

-- ──────────────────────────────────────────────────────────────────────────────
-- 7. ventes_journalieres
-- ──────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.ventes_journalieres ENABLE ROW LEVEL SECURITY;

CREATE POLICY ventes_journalieres_select ON public.ventes_journalieres FOR SELECT TO authenticated
  USING (public.user_has_client_access(client_id));
CREATE POLICY ventes_journalieres_insert ON public.ventes_journalieres FOR INSERT TO authenticated
  WITH CHECK (public.user_has_client_access(client_id));
CREATE POLICY ventes_journalieres_update ON public.ventes_journalieres FOR UPDATE TO authenticated
  USING (public.user_has_client_access(client_id))
  WITH CHECK (public.user_has_client_access(client_id));
CREATE POLICY ventes_journalieres_delete ON public.ventes_journalieres FOR DELETE TO authenticated
  USING (public.user_has_client_access(client_id));

-- ──────────────────────────────────────────────────────────────────────────────
-- 8. achats_factures
-- ──────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.achats_factures ENABLE ROW LEVEL SECURITY;

CREATE POLICY achats_factures_select ON public.achats_factures FOR SELECT TO authenticated
  USING (public.user_has_client_access(client_id));
CREATE POLICY achats_factures_insert ON public.achats_factures FOR INSERT TO authenticated
  WITH CHECK (public.user_has_client_access(client_id));
CREATE POLICY achats_factures_update ON public.achats_factures FOR UPDATE TO authenticated
  USING (public.user_has_client_access(client_id))
  WITH CHECK (public.user_has_client_access(client_id));
CREATE POLICY achats_factures_delete ON public.achats_factures FOR DELETE TO authenticated
  USING (public.user_has_client_access(client_id));

-- ──────────────────────────────────────────────────────────────────────────────
-- 9. achats_lignes
-- ──────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.achats_lignes ENABLE ROW LEVEL SECURITY;

CREATE POLICY achats_lignes_select ON public.achats_lignes FOR SELECT TO authenticated
  USING (public.user_has_client_access(client_id));
CREATE POLICY achats_lignes_insert ON public.achats_lignes FOR INSERT TO authenticated
  WITH CHECK (public.user_has_client_access(client_id));
CREATE POLICY achats_lignes_update ON public.achats_lignes FOR UPDATE TO authenticated
  USING (public.user_has_client_access(client_id))
  WITH CHECK (public.user_has_client_access(client_id));
CREATE POLICY achats_lignes_delete ON public.achats_lignes FOR DELETE TO authenticated
  USING (public.user_has_client_access(client_id));

-- ──────────────────────────────────────────────────────────────────────────────
-- 10. fournisseurs
-- ──────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.fournisseurs ENABLE ROW LEVEL SECURITY;

CREATE POLICY fournisseurs_select ON public.fournisseurs FOR SELECT TO authenticated
  USING (public.user_has_client_access(client_id));
CREATE POLICY fournisseurs_insert ON public.fournisseurs FOR INSERT TO authenticated
  WITH CHECK (public.user_has_client_access(client_id));
CREATE POLICY fournisseurs_update ON public.fournisseurs FOR UPDATE TO authenticated
  USING (public.user_has_client_access(client_id))
  WITH CHECK (public.user_has_client_access(client_id));
CREATE POLICY fournisseurs_delete ON public.fournisseurs FOR DELETE TO authenticated
  USING (public.user_has_client_access(client_id));

-- ──────────────────────────────────────────────────────────────────────────────
-- 11. fournisseur_mapping
-- ──────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.fournisseur_mapping ENABLE ROW LEVEL SECURITY;

CREATE POLICY fournisseur_mapping_select ON public.fournisseur_mapping FOR SELECT TO authenticated
  USING (public.user_has_client_access(client_id));
CREATE POLICY fournisseur_mapping_insert ON public.fournisseur_mapping FOR INSERT TO authenticated
  WITH CHECK (public.user_has_client_access(client_id));
CREATE POLICY fournisseur_mapping_update ON public.fournisseur_mapping FOR UPDATE TO authenticated
  USING (public.user_has_client_access(client_id))
  WITH CHECK (public.user_has_client_access(client_id));
CREATE POLICY fournisseur_mapping_delete ON public.fournisseur_mapping FOR DELETE TO authenticated
  USING (public.user_has_client_access(client_id));

-- ──────────────────────────────────────────────────────────────────────────────
-- 12. inventaires (re-enable — was disabled in previous migration)
-- ──────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.inventaires ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist (from the initial migration)
DROP POLICY IF EXISTS inventaires_select_autorise ON public.inventaires;
DROP POLICY IF EXISTS inventaires_insert_autorise ON public.inventaires;
DROP POLICY IF EXISTS inventaires_update_autorise ON public.inventaires;
DROP POLICY IF EXISTS inventaires_delete_autorise ON public.inventaires;

CREATE POLICY inventaires_select ON public.inventaires FOR SELECT TO authenticated
  USING (public.user_has_client_access(client_id));
CREATE POLICY inventaires_insert ON public.inventaires FOR INSERT TO authenticated
  WITH CHECK (public.user_has_client_access(client_id));
CREATE POLICY inventaires_update ON public.inventaires FOR UPDATE TO authenticated
  USING (public.user_has_client_access(client_id))
  WITH CHECK (public.user_has_client_access(client_id));
CREATE POLICY inventaires_delete ON public.inventaires FOR DELETE TO authenticated
  USING (public.user_has_client_access(client_id));

-- ──────────────────────────────────────────────────────────────────────────────
-- 13. inventaire_lignes (re-enable)
-- ──────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.inventaire_lignes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS inventaire_lignes_select_autorise ON public.inventaire_lignes;
DROP POLICY IF EXISTS inventaire_lignes_insert_autorise ON public.inventaire_lignes;
DROP POLICY IF EXISTS inventaire_lignes_update_autorise ON public.inventaire_lignes;
DROP POLICY IF EXISTS inventaire_lignes_delete_autorise ON public.inventaire_lignes;

CREATE POLICY inventaire_lignes_select ON public.inventaire_lignes FOR SELECT TO authenticated
  USING (public.user_has_client_access(client_id));
CREATE POLICY inventaire_lignes_insert ON public.inventaire_lignes FOR INSERT TO authenticated
  WITH CHECK (public.user_has_client_access(client_id));
CREATE POLICY inventaire_lignes_update ON public.inventaire_lignes FOR UPDATE TO authenticated
  USING (public.user_has_client_access(client_id))
  WITH CHECK (public.user_has_client_access(client_id));
CREATE POLICY inventaire_lignes_delete ON public.inventaire_lignes FOR DELETE TO authenticated
  USING (public.user_has_client_access(client_id));

-- ──────────────────────────────────────────────────────────────────────────────
-- 14. categories_plats
-- ──────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.categories_plats ENABLE ROW LEVEL SECURITY;

CREATE POLICY categories_plats_select ON public.categories_plats FOR SELECT TO authenticated
  USING (public.user_has_client_access(client_id));
CREATE POLICY categories_plats_insert ON public.categories_plats FOR INSERT TO authenticated
  WITH CHECK (public.user_has_client_access(client_id));
CREATE POLICY categories_plats_update ON public.categories_plats FOR UPDATE TO authenticated
  USING (public.user_has_client_access(client_id))
  WITH CHECK (public.user_has_client_access(client_id));
CREATE POLICY categories_plats_delete ON public.categories_plats FOR DELETE TO authenticated
  USING (public.user_has_client_access(client_id));

-- ──────────────────────────────────────────────────────────────────────────────
-- 15. lieux
-- ──────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.lieux ENABLE ROW LEVEL SECURITY;

CREATE POLICY lieux_select ON public.lieux FOR SELECT TO authenticated
  USING (public.user_has_client_access(client_id));
CREATE POLICY lieux_insert ON public.lieux FOR INSERT TO authenticated
  WITH CHECK (public.user_has_client_access(client_id));
CREATE POLICY lieux_update ON public.lieux FOR UPDATE TO authenticated
  USING (public.user_has_client_access(client_id))
  WITH CHECK (public.user_has_client_access(client_id));
CREATE POLICY lieux_delete ON public.lieux FOR DELETE TO authenticated
  USING (public.user_has_client_access(client_id));

-- ──────────────────────────────────────────────────────────────────────────────
-- 16. transactions_api (audit log)
-- ──────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.transactions_api ENABLE ROW LEVEL SECURITY;

CREATE POLICY transactions_api_select ON public.transactions_api FOR SELECT TO authenticated
  USING (public.user_has_client_access(client_id));
CREATE POLICY transactions_api_insert ON public.transactions_api FOR INSERT TO authenticated
  WITH CHECK (public.user_has_client_access(client_id));

-- ──────────────────────────────────────────────────────────────────────────────
-- 17. profils — users can only read/update their OWN profile
-- ──────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.profils ENABLE ROW LEVEL SECURITY;

CREATE POLICY profils_select_own ON public.profils FOR SELECT TO authenticated
  USING (id = auth.uid());
CREATE POLICY profils_update_own ON public.profils FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ──────────────────────────────────────────────────────────────────────────────
-- 18. acces_clients — users can only read their OWN access entries
-- ──────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.acces_clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY acces_clients_select_own ON public.acces_clients FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- ──────────────────────────────────────────────────────────────────────────────
-- 19. clients — read-only for users who have access
-- ──────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY clients_select ON public.clients FOR SELECT TO authenticated
  USING (public.user_has_client_access(id));

-- ──────────────────────────────────────────────────────────────────────────────
-- NOTE: Tables managed ONLY by service_role (no client-side access needed):
-- - prospects (superadmin only)
-- - documents_legaux (superadmin only)
-- These don't need RLS policies for authenticated users because they are
-- only accessed via API routes using the service_role key.
-- But we still enable RLS to prevent direct client-side access.
-- ──────────────────────────────────────────────────────────────────────────────

-- prospects: deny all client access (service_role only)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'prospects') THEN
    ALTER TABLE public.prospects ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;
