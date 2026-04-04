-- Migration : champs Mon Compte (contact, CGU, résiliation)
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS email_contact      text,
  ADD COLUMN IF NOT EXISTS telephone_contact  text,
  ADD COLUMN IF NOT EXISTS date_cgu           timestamptz,
  ADD COLUMN IF NOT EXISTS version_cgu        text DEFAULT '1.0',
  ADD COLUMN IF NOT EXISTS demande_resiliation boolean DEFAULT false;
