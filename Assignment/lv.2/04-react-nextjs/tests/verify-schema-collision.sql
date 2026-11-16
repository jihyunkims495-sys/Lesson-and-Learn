\ir assert-legacy-preserved.sql
\if :collision_table
do $$
begin
  if to_regclass('public.practice_profiles') is not null
     or to_regprocedure('public.practice_create_profile()') is not null then
    raise exception 'partial schema leaked after existing table conflict';
  end if;
  if (select count(*) from public.practice_todos)<>1
     or (select marker from public.practice_todos)<>'preserve existing object' then
    raise exception 'existing practice_todos changed';
  end if;
end $$;
select 'PASS: table-name conflict rejects schema atomically and preserves existing object' as result;
\else
\if :collision_trigger
do $$
begin
  if to_regclass('public.practice_profiles') is not null
     or to_regclass('public.practice_todos') is not null
     or to_regprocedure('public.practice_create_profile()') is not null then
    raise exception 'partial schema leaked after existing trigger conflict';
  end if;
  if (select pg_get_triggerdef(oid) from pg_trigger
      where tgrelid='auth.users'::regclass and tgname='on_practice_signup')
     is distinct from (select snapshot from test_meta.before_trigger) then
    raise exception 'existing signup trigger changed';
  end if;
end $$;
select 'PASS: final trigger-name conflict rolls back new tables/function and preserves existing trigger' as result;
\else
do $$
begin
  if to_regclass('public.practice_profiles') is not null
     or to_regclass('public.practice_todos') is not null then
    raise exception 'partial tables leaked after existing function conflict';
  end if;
  if pg_get_functiondef('public.practice_create_profile()'::regprocedure)
     is distinct from (select snapshot from test_meta.before_function) then
    raise exception 'existing function replaced';
  end if;
end $$;
select 'PASS: late function-name conflict rolls back all new tables and preserves existing function' as result;
\endif
\endif
\if :collision_trigger
\else
do $$
begin
  if exists(select 1 from pg_trigger where tgname='on_practice_signup' and not tgisinternal) then
    raise exception 'trigger leaked after schema conflict';
  end if;
end $$;
\endif
