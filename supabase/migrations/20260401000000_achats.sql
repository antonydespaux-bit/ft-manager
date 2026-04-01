-- ═══════════════════════════════════════════════════════════════════════════
-- Migration : Module Achats — Factures fournisseurs
-- Tables : achats_factures, achats_lignes, fournisseur_mapping, transactions_api
-- RLS : acces_clients-based (même pattern que mapping_ventes)
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── achats_factures ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.achats_factures (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id        uuid        NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  fournisseur      text        NOT NULL DEFAULT '',
  numero_facture   text,
  date_facture     date        NOT NULL,
  total_ht         numeric(12, 4),
  fichier_url      text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.achats_factures IS
  'En-têtes des factures fournisseurs importées (une ligne par facture).';

CREATE INDEX IF NOT EXISTS achats_factures_client_id_idx
  ON public.achats_factures (client_id);

CREATE INDEX IF NOT EXISTS achats_factures_date_idx
  ON public.achats_factures (date_facture);

-- ─── achats_lignes ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.achats_lignes (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  facture_id         uuid        NOT NULL REFERENCES public.achats_factures(id) ON DELETE CASCADE,
  client_id          uuid        NOT NULL,
  designation        text        NOT NULL,
  ingredient_id      uuid        REFERENCES public.ingredients(id) ON DELETE SET NULL,
  quantite           numeric(12, 4) NOT NULL DEFAULT 0,
  unite              text,
  prix_unitaire_ht   numeric(12, 4) NOT NULL DEFAULT 0,
  montant_ht         numeric(12, 4),
  created_at         timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.achats_lignes IS
  'Lignes détaillées d''une facture fournisseur (un ingrédient par ligne).';

CREATE INDEX IF NOT EXISTS achats_lignes_facture_id_idx
  ON public.achats_lignes (facture_id);

CREATE INDEX IF NOT EXISTS achats_lignes_client_id_idx
  ON public.achats_lignes (client_id);

CREATE INDEX IF NOT EXISTS achats_lignes_ingredient_id_idx
  ON public.achats_lignes (ingredient_id);

-- ─── fournisseur_mapping ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.fournisseur_mapping (
  id                        uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id                 uuid        NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  designation_fournisseur   text        NOT NULL,
  designation_norm          text        NOT NULL DEFAULT '',
  ingredient_id             uuid        REFERENCES public.ingredients(id) ON DELETE SET NULL,
  fournisseur               text,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fournisseur_mapping_unique_client_desig
    UNIQUE (client_id, designation_norm)
);

COMMENT ON TABLE public.fournisseur_mapping IS
  'Association apprise entre une désignation fournisseur et un ingrédient.';

CREATE INDEX IF NOT EXISTS fournisseur_mapping_client_id_idx
  ON public.fournisseur_mapping (client_id);

-- Trigger : normalisation automatique de designation_norm
CREATE OR REPLACE FUNCTION public.trg_fournisseur_mapping_fill_norm()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.designation_norm :=
    regexp_replace(
      lower(trim(NEW.designation_fournisseur)),
      '[^a-z0-9]+', ' ', 'g'
    );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_fournisseur_mapping_fill_norm ON public.fournisseur_mapping;
CREATE TRIGGER trg_fournisseur_mapping_fill_norm
  BEFORE INSERT OR UPDATE ON public.fournisseur_mapping
  FOR EACH ROW EXECUTE FUNCTION public.trg_fournisseur_mapping_fill_norm();

-- Trigger : updated_at
CREATE OR REPLACE FUNCTION public.trg_fournisseur_mapping_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_fournisseur_mapping_updated_at ON public.fournisseur_mapping;
CREATE TRIGGER trg_fournisseur_mapping_updated_at
  BEFORE UPDATE ON public.fournisseur_mapping
  FOR EACH ROW EXECUTE FUNCTION public.trg_fournisseur_mapping_updated_at();

-- ─── transactions_api ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.transactions_api (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id    uuid        NOT NULL,
  type         text        NOT NULL,
  source       text,
  payload_json jsonb,
  user_id      uuid,
  created_at   timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.transactions_api IS
  'Journal d''audit des opérations d''import et de mise à jour via l''API.';

CREATE INDEX IF NOT EXISTS transactions_api_client_id_idx
  ON public.transactions_api (client_id);

CREATE INDEX IF NOT EXISTS transactions_api_type_idx
  ON public.transactions_api (type);

-- ─── RLS ────────────────────────────────────────────────────────────────────

ALTER TABLE public.achats_factures     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achats_lignes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fournisseur_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions_api    ENABLE ROW LEVEL SECURITY;

-- Helper macro pour la condition d'accès
-- (même pattern que dans mapping_ventes)

-- ── achats_factures ──

CREATE POLICY achats_factures_select
  ON public.achats_factures FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.acces_clients ac
    WHERE ac.user_id = auth.uid() AND ac.client_id = achats_factures.client_id
  ));

CREATE POLICY achats_factures_insert
  ON public.achats_factures FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.acces_clients ac
    WHERE ac.user_id = auth.uid() AND ac.client_id = achats_factures.client_id
  ));

CREATE POLICY achats_factures_update
  ON public.achats_factures FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.acces_clients ac
    WHERE ac.user_id = auth.uid() AND ac.client_id = achats_factures.client_id
  ));

CREATE POLICY achats_factures_delete
  ON public.achats_factures FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.acces_clients ac
    WHERE ac.user_id = auth.uid() AND ac.client_id = achats_factures.client_id
  ));

-- ── achats_lignes ──

CREATE POLICY achats_lignes_select
  ON public.achats_lignes FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.acces_clients ac
    WHERE ac.user_id = auth.uid() AND ac.client_id = achats_lignes.client_id
  ));

CREATE POLICY achats_lignes_insert
  ON public.achats_lignes FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.acces_clients ac
    WHERE ac.user_id = auth.uid() AND ac.client_id = achats_lignes.client_id
  ));

CREATE POLICY achats_lignes_update
  ON public.achats_lignes FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.acces_clients ac
    WHERE ac.user_id = auth.uid() AND ac.client_id = achats_lignes.client_id
  ));

CREATE POLICY achats_lignes_delete
  ON public.achats_lignes FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.acces_clients ac
    WHERE ac.user_id = auth.uid() AND ac.client_id = achats_lignes.client_id
  ));

-- ── fournisseur_mapping ──

CREATE POLICY fournisseur_mapping_select
  ON public.fournisseur_mapping FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.acces_clients ac
    WHERE ac.user_id = auth.uid() AND ac.client_id = fournisseur_mapping.client_id
  ));

CREATE POLICY fournisseur_mapping_insert
  ON public.fournisseur_mapping FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.acces_clients ac
    WHERE ac.user_id = auth.uid() AND ac.client_id = fournisseur_mapping.client_id
  ));

CREATE POLICY fournisseur_mapping_update
  ON public.fournisseur_mapping FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.acces_clients ac
    WHERE ac.user_id = auth.uid() AND ac.client_id = fournisseur_mapping.client_id
  ));

CREATE POLICY fournisseur_mapping_delete
  ON public.fournisseur_mapping FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.acces_clients ac
    WHERE ac.user_id = auth.uid() AND ac.client_id = fournisseur_mapping.client_id
  ));

-- ── transactions_api ──

CREATE POLICY transactions_api_select
  ON public.transactions_api FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.acces_clients ac
    WHERE ac.user_id = auth.uid() AND ac.client_id = transactions_api.client_id
  ));

CREATE POLICY transactions_api_insert
  ON public.transactions_api FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.acces_clients ac
    WHERE ac.user_id = auth.uid() AND ac.client_id = transactions_api.client_id
  ));
