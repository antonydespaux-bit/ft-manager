-- ─── achats_factures ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS achats_factures (
  id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id       uuid        NOT NULL,
  fournisseur     text        NOT NULL,
  fournisseur_id  uuid,
  numero_facture  text,
  date_facture    date        NOT NULL,
  total_ht        numeric     NOT NULL DEFAULT 0,
  taux_tva        numeric,
  created_at      timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS achats_factures_client_id_idx ON achats_factures (client_id);

-- ─── achats_lignes ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS achats_lignes (
  id                uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  facture_id        uuid    NOT NULL REFERENCES achats_factures(id) ON DELETE CASCADE,
  client_id         uuid    NOT NULL,
  designation       text,
  ingredient_id     uuid,
  quantite          numeric NOT NULL DEFAULT 0,
  unite             text,
  prix_unitaire_ht  numeric NOT NULL DEFAULT 0,
  remise            numeric NOT NULL DEFAULT 0,
  montant_ht        numeric NOT NULL DEFAULT 0,
  created_at        timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS achats_lignes_facture_id_idx ON achats_lignes (facture_id);
CREATE INDEX IF NOT EXISTS achats_lignes_client_id_idx  ON achats_lignes (client_id);

-- ─── fournisseur_mapping ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fournisseur_mapping (
  id                      uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id               uuid NOT NULL,
  designation_fournisseur text,
  designation_norm        text NOT NULL,
  ingredient_id           uuid,
  fournisseur             text,
  created_at              timestamptz DEFAULT now(),
  UNIQUE (client_id, designation_norm)
);
CREATE INDEX IF NOT EXISTS fournisseur_mapping_client_id_idx ON fournisseur_mapping (client_id);

-- ─── Colonne remise (si tables existaient déjà sans elle) ─────────────────────
ALTER TABLE achats_lignes ADD COLUMN IF NOT EXISTS remise numeric NOT NULL DEFAULT 0;
