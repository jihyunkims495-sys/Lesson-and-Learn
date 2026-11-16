begin;

-- Dedicated practice objects. Existing objects with these names cause the
-- transaction to fail; no existing table, function or trigger is replaced.
create table public.practice_profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    display_name text not null default '회원'
);

create table public.practice_todos (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    title text not null check (length(trim(title)) between 1 and 120),
    done boolean not null default false,
    created_at timestamptz not null default now()
);

create index practice_todos_user_created_idx
    on public.practice_todos(user_id, created_at desc);

alter table public.practice_profiles enable row level security;
alter table public.practice_todos enable row level security;

create policy practice_profiles_own on public.practice_profiles
    for all to authenticated
    using (id = auth.uid()) with check (id = auth.uid());
create policy practice_todos_own on public.practice_todos
    for all to authenticated
    using (user_id = auth.uid()) with check (user_id = auth.uid());

revoke all on public.practice_profiles, public.practice_todos from public, anon;
grant select, insert, update, delete
    on public.practice_profiles, public.practice_todos to authenticated;

create function public.practice_create_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    insert into public.practice_profiles(id) values (new.id);
    return new;
end;
$$;
revoke all on function public.practice_create_profile() from public, anon, authenticated;

create trigger on_practice_signup
    after insert on auth.users
    for each row execute function public.practice_create_profile();

commit;
