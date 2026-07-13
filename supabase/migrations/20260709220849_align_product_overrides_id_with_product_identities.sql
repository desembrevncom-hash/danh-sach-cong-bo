-- Ensure every product override uses the stable product identity UUID.
-- product_overrides.id must equal product_identities.id.

update public.product_overrides po
set id = pi.id
from public.product_identities pi
where pi.brand = po.brand
  and pi.legacy_no = po.no::bigint
  and po.id is distinct from pi.id;

alter table public.product_overrides
alter column id set not null;

create unique index if not exists product_overrides_id_key
on public.product_overrides(id);

-- Drop default uuid generation since the Edge Functions will always supply it
alter table public.product_overrides
alter column id drop default;
