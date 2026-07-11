-- Add home hero banner image URLs to site_settings table
alter table public.site_settings
add column if not exists home_hero_banner_image_url text,
add column if not exists home_hero_banner_mobile_image_url text;
