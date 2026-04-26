-- ============================================================================
-- Fix RLS — purge des policies legacy `isolation_client_*` restantes
--
-- Suite à la migration 20260408_rls_hardening_drop_user_metadata.sql qui a
-- migré la majorité des tables vers `user_has_client_access()`, il restait
-- 6 tables avec une vieille policy `client_id = get_client_id()` (basée sur
-- `auth.jwt().user_metadata.client_id`).
--
-- Cas constaté le 2026-04-26 : un user créé sans `user_metadata.client_id`
-- (ex: Raphael Malossi) ne voit aucune ligne de ces tables. Les anciens
-- users continuaient de fonctionner uniquement parce que leur user_metadata
-- legacy n'avait jamais été nettoyé — comportement fragile.
--
-- Tables fixées :
--   • avis           — vide aujourd'hui mais bug latent
--   • logs           — Raphael ne voyait aucun log
--   • menu_fiches    — Raphael ne voyait aucun menu (3 lignes en base)
--   • menus_bar      — vide aujourd'hui mais bug latent
--   • profils        — Raphael ne voyait pas son propre profil
--   • clients        — uniquement DROP de la legacy (les policies "Enable …"
--                      existantes couvrent déjà SELECT/INSERT/UPDATE — pas
--                      idéal côté sécurité, à revoir séparément)
--
-- Pour `profils`, on conserve la policy `Admins can view all profiles` qui
-- couvre les SELECT cross-client par les admins/superadmin.
-- ============================================================================

-- ─── avis ───
DROP POLICY IF EXISTS isolation_client_avis ON public.avis;

CREATE POLICY avis_select ON public.avis FOR SELECT TO authenticated
  USING (public.user_has_client_access(client_id));
CREATE POLICY avis_insert ON public.avis FOR INSERT TO authenticated
  WITH CHECK (public.user_has_client_access(client_id));
CREATE POLICY avis_update ON public.avis FOR UPDATE TO authenticated
  USING (public.user_has_client_access(client_id))
  WITH CHECK (public.user_has_client_access(client_id));
CREATE POLICY avis_delete ON public.avis FOR DELETE TO authenticated
  USING (public.user_has_client_access(client_id));

-- ─── logs ───
DROP POLICY IF EXISTS isolation_client_logs ON public.logs;

CREATE POLICY logs_select ON public.logs FOR SELECT TO authenticated
  USING (public.user_has_client_access(client_id));
CREATE POLICY logs_insert ON public.logs FOR INSERT TO authenticated
  WITH CHECK (public.user_has_client_access(client_id));
CREATE POLICY logs_update ON public.logs FOR UPDATE TO authenticated
  USING (public.user_has_client_access(client_id))
  WITH CHECK (public.user_has_client_access(client_id));
CREATE POLICY logs_delete ON public.logs FOR DELETE TO authenticated
  USING (public.user_has_client_access(client_id));

-- ─── menu_fiches ───
DROP POLICY IF EXISTS isolation_client_menu_fiches ON public.menu_fiches;

CREATE POLICY menu_fiches_select ON public.menu_fiches FOR SELECT TO authenticated
  USING (public.user_has_client_access(client_id));
CREATE POLICY menu_fiches_insert ON public.menu_fiches FOR INSERT TO authenticated
  WITH CHECK (public.user_has_client_access(client_id));
CREATE POLICY menu_fiches_update ON public.menu_fiches FOR UPDATE TO authenticated
  USING (public.user_has_client_access(client_id))
  WITH CHECK (public.user_has_client_access(client_id));
CREATE POLICY menu_fiches_delete ON public.menu_fiches FOR DELETE TO authenticated
  USING (public.user_has_client_access(client_id));

-- ─── menus_bar ───
DROP POLICY IF EXISTS isolation_client_menus_bar ON public.menus_bar;

CREATE POLICY menus_bar_select ON public.menus_bar FOR SELECT TO authenticated
  USING (public.user_has_client_access(client_id));
CREATE POLICY menus_bar_insert ON public.menus_bar FOR INSERT TO authenticated
  WITH CHECK (public.user_has_client_access(client_id));
CREATE POLICY menus_bar_update ON public.menus_bar FOR UPDATE TO authenticated
  USING (public.user_has_client_access(client_id))
  WITH CHECK (public.user_has_client_access(client_id));
CREATE POLICY menus_bar_delete ON public.menus_bar FOR DELETE TO authenticated
  USING (public.user_has_client_access(client_id));

-- ─── profils ───
-- Conserve `Admins can view all profiles` (cross-client pour admins).
-- Recrée les 4 policies CRUD via helper pour permettre à tout user de gérer
-- les profils de son client.
DROP POLICY IF EXISTS isolation_client_profils ON public.profils;

CREATE POLICY profils_select ON public.profils FOR SELECT TO authenticated
  USING (public.user_has_client_access(client_id));
CREATE POLICY profils_insert ON public.profils FOR INSERT TO authenticated
  WITH CHECK (public.user_has_client_access(client_id));
CREATE POLICY profils_update ON public.profils FOR UPDATE TO authenticated
  USING (public.user_has_client_access(client_id))
  WITH CHECK (public.user_has_client_access(client_id));
CREATE POLICY profils_delete ON public.profils FOR DELETE TO authenticated
  USING (public.user_has_client_access(client_id));

-- ─── clients ───
-- Drop de la legacy uniquement. Les policies existantes (Enable select/insert,
-- SuperAdmin can update) couvrent déjà l'usage actuel. Note: l'ouverture
-- "Enable select for authenticated users only" (USING true) est trop large
-- — à revoir dans une PR sécurité dédiée.
DROP POLICY IF EXISTS isolation_client_clients ON public.clients;
