create table public.profiles(id uuid primary key references auth.users(id) on delete cascade, display_name text not null default '회원');
create table public.todos(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,title text not null check(length(trim(title)) between 1 and 120),done boolean not null default false,created_at timestamptz not null default now());
create index todos_user_created_idx on public.todos(user_id,created_at desc);
alter table public.profiles enable row level security;
alter table public.todos enable row level security;
create policy profiles_own on public.profiles for all to authenticated using(id=auth.uid()) with check(id=auth.uid());
create policy todos_own on public.todos for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
grant select,insert,update,delete on public.profiles,public.todos to authenticated;
-- 가입 이벤트에서 프로필 생성. 고정 search_path와 최소 입력으로 definer 함수 범위를 제한.
create function public.create_profile() returns trigger language plpgsql security definer set search_path='' as $$begin insert into public.profiles(id) values(new.id);return new;end;$$;
revoke all on function public.create_profile() from public;
create trigger on_signup after insert on auth.users for each row execute function public.create_profile();
