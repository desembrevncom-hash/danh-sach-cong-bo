-- Add header logo columns to site_settings
alter table public.site_settings
add column if not exists header_logo_desembre_url text,
add column if not exists header_logo_hyunjin_url text,
add column if not exists header_logo_dermagarden_url text;
