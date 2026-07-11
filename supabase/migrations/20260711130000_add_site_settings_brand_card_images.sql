-- Add home brand card images to site_settings
alter table public.site_settings
add column if not exists home_brand_desembre_image_url text,
add column if not exists home_brand_dermagarden_image_url text;

-- Seed initial demo images from product_overrides
update public.site_settings
set
  home_brand_desembre_image_url = coalesce(
    nullif(home_brand_desembre_image_url, ''),
    (
      select image_url
      from public.product_overrides
      where brand = 'desembre'
        and deleted is not true
        and image_url is not null
        and image_url <> ''
      order by updated_at desc nulls last
      limit 1
    )
  ),
  home_brand_dermagarden_image_url = coalesce(
    nullif(home_brand_dermagarden_image_url, ''),
    (
      select image_url
      from public.product_overrides
      where brand = 'dermagarden'
        and deleted is not true
        and image_url is not null
        and image_url <> ''
      order by updated_at desc nulls last
      limit 1
    )
  ),
  updated_at = now();
