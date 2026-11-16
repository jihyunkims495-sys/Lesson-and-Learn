\if :collision_table
create table public.practice_todos(marker text primary key);
insert into public.practice_todos values('preserve existing object');
\else
\if :collision_trigger
create function public.legacy_signup_probe() returns trigger
  language plpgsql as $$begin return new; end;$$;
create trigger on_practice_signup after insert on auth.users
  for each row execute function public.legacy_signup_probe();
create table test_meta.before_trigger(snapshot text not null);
insert into test_meta.before_trigger
  select pg_get_triggerdef(oid) from pg_trigger
  where tgrelid='auth.users'::regclass and tgname='on_practice_signup';
\else
create function public.practice_create_profile() returns trigger
  language plpgsql as $$begin return new; end;$$;
create table test_meta.before_function(snapshot text not null);
insert into test_meta.before_function
  select pg_get_functiondef('public.practice_create_profile()'::regprocedure);
\endif
\endif
