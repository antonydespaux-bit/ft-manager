-- Backfill des accès multi-etablissements depuis profils -> acces_clients
-- Objectif: migrer les profils historiques (profil.client_id) vers la table pivot acces_clients
-- sans créer de doublons.

begin;

-- 1) Fonction réutilisable de backfill
create or replace function public.backfill_acces_clients_from_profils()
returns table (inserted_count integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inserted integer := 0;
begin
  -- On insère uniquement:
  -- - les profils avec client_id non null
  -- - qui n'ont pas déjà la ligne dans acces_clients
  with inserted as (
    insert into public.acces_clients (user_id, client_id, role)
    select
      p.id as user_id,
      p.client_id,
      coalesce(nullif(trim(p.role), ''), 'cuisine') as role
    from public.profils p
    where p.id is not null
      and p.client_id is not null
      and not exists (
        select 1
        from public.acces_clients ac
        where ac.user_id = p.id
          and ac.client_id = p.client_id
      )
    returning 1
  )
  select count(*) into v_inserted from inserted;

  return query select v_inserted;
end;
$$;

-- 2) Exécution one-shot immédiate
select * from public.backfill_acces_clients_from_profils();

commit;

-- 3) Vérification rapide (optionnel)
-- select p.id, p.email, p.client_id as profil_client_id,
--        exists (
--          select 1 from public.acces_clients ac
--          where ac.user_id = p.id and ac.client_id = p.client_id
--        ) as migrated
-- from public.profils p
-- where p.client_id is not null
-- order by p.created_at desc nulls last;

