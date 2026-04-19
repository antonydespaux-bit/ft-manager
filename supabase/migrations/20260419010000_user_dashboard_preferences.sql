-- ============================================================================
-- user_dashboard_preferences : layout personnalisé du dashboard par user et
-- par tenant.
--
-- layout = jsonb array dans l'ordre d'affichage voulu :
--   [{ "id": "kpi-food-cost-moyen", "visible": true }, ...]
--
-- Si pas de ligne pour un (user_id, client_id) : le dashboard utilise le
-- defaultLayout côté client (ordre actuel, tout visible).
--
-- Un user qui a accès à plusieurs établissements a un layout distinct
-- par tenant (d'où la clé unique composée).
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_dashboard_preferences (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id  uuid        NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  layout     jsonb       NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, client_id)
);

CREATE INDEX IF NOT EXISTS user_dashboard_preferences_user_client_idx
  ON public.user_dashboard_preferences (user_id, client_id);

-- ─── Trigger updated_at ─────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS user_dashboard_preferences_set_updated_at ON public.user_dashboard_preferences;
CREATE TRIGGER user_dashboard_preferences_set_updated_at
  BEFORE UPDATE ON public.user_dashboard_preferences
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();

-- ─── RLS ────────────────────────────────────────────────────────────────────
ALTER TABLE public.user_dashboard_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_dashboard_preferences_select ON public.user_dashboard_preferences
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    AND public.user_has_client_access(client_id)
  );

CREATE POLICY user_dashboard_preferences_insert ON public.user_dashboard_preferences
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND public.user_has_client_access(client_id)
  );

CREATE POLICY user_dashboard_preferences_update ON public.user_dashboard_preferences
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = user_id
    AND public.user_has_client_access(client_id)
  )
  WITH CHECK (
    auth.uid() = user_id
    AND public.user_has_client_access(client_id)
  );

CREATE POLICY user_dashboard_preferences_delete ON public.user_dashboard_preferences
  FOR DELETE TO authenticated
  USING (
    auth.uid() = user_id
    AND public.user_has_client_access(client_id)
  );
