-- Flag : ce lieu compte-t-il dans le suivi des couverts (section « Couverts
-- jour par jour » du rapport hebdo) ? Défaut true = comportement historique.
-- Mis à false pour les salles annexes dont les couverts ne doivent pas gonfler
-- le total (ex : Marsan « Table de partage » / « La cave »).
--
-- Distinct de couverts_indicatifs : ce dernier déclenche EN PLUS le lissage
-- privatisation côté CA mensuel — ce qu'on ne veut pas ici, d'où un flag dédié.
alter table public.lieux_service
  add column if not exists couverts_comptes boolean not null default true;
