begin;

-- Ensure id is NOT NULL (should already be from 6.2, but adding for safety)
alter table public.product_overrides
alter column id set not null;

-- Ensure there's a unique index on id
create unique index if not exists product_overrides_id_key
on public.product_overrides(id);

-- Drop old primary key. Note: In Postgres, when you create a table like `no INTEGER PRIMARY KEY`, 
-- the constraint is typically named `<table_name>_pkey`. If preflight shows a different name,
-- the user might need to adjust this name before running.
alter table public.product_overrides
drop constraint if exists product_overrides_pkey;

-- Add new primary key on UUID `id`
alter table public.product_overrides
add constraint product_overrides_pkey primary key (id);

-- Keep legacy no unique during transition, to ensure it can be safely used for rollbacks 
-- and guarantees no two overrides map to the same base product.
create unique index if not exists product_overrides_legacy_no_key
on public.product_overrides(no);

commit;
