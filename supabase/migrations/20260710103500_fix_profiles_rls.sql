alter table public.profiles enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;

create policy "Users can read own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = user_id);

grant usage on schema public to anon, authenticated;
grant select on public.profiles to authenticated;
