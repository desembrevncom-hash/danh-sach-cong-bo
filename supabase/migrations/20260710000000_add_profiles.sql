create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'viewer')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Policy: User can read their own profile
create policy "User can view own profile"
  on public.profiles
  for select
  using (auth.uid() = user_id);

-- Policy: Admin can read all profiles (if needed for admin dashboard)
create policy "Admins can view all profiles"
  on public.profiles
  for select
  using (
    exists (
      select 1 from public.profiles where user_id = auth.uid() and role = 'admin'
    )
  );

-- Function to check if current user is admin
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where user_id = auth.uid()
      and role = 'admin'
  );
$$;

-- Add changed_by column to history if it doesn't exist
alter table public.product_overrides_history
add column if not exists changed_by uuid references auth.users(id);
