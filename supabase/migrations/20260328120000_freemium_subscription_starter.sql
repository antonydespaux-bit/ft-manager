-- Freemium : plan d'abonnement sur le profil utilisateur
alter table public.profils
  add column if not exists subscription_plan text not null default 'free';

comment on column public.profils.subscription_plan is 'free (5 fiches) | chef (illimité), etc.';

-- Starter kit : une fois par établissement (évite re-seed à chaque visite)
alter table public.clients
  add column if not exists starter_kit_seeded_at timestamptz;

comment on column public.clients.starter_kit_seeded_at is 'Horodatage du kit ingrédients + fiche démo (premier accès dashboard).';
