\ir assert-legacy-preserved.sql
do $$
begin
  if exists(select 1 from public.practice_profiles) then
    raise exception 'existing Auth user was unexpectedly backfilled';
  end if;
  if (select count(*) from pg_trigger
      where tgrelid='auth.users'::regclass and tgname='on_practice_signup'
        and tgfoid='public.practice_create_profile()'::regprocedure and tgenabled='O')<>1 then
    raise exception 'dedicated signup trigger not connected';
  end if;
  if has_function_privilege('anon','public.practice_create_profile()','EXECUTE')
     or has_function_privilege('authenticated','public.practice_create_profile()','EXECUTE') then
    raise exception 'trigger helper unexpectedly callable by API roles';
  end if;
end $$;
select 'PASS: dedicated signup trigger connected, helper EXECUTE revoked, existing Auth user not backfilled' as result;
\set ON_ERROR_STOP on
-- Auth normally creates these rows; verify the dedicated signup trigger as admin.
insert into auth.users values
 ('00000000-0000-0000-0000-000000000001'),
 ('00000000-0000-0000-0000-000000000002');
do $$
begin
  if (select count(*) from public.practice_profiles)<>2
     or exists(select 1 from public.practice_profiles where display_name<>'회원') then
    raise exception 'signup profile trigger failed';
  end if;
end $$;
select 'PASS: auth.users insertion creates default profiles' as result;

set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-000000000001';
update public.practice_profiles set display_name='Local A' where id=auth.uid();
insert into public.practice_todos(id,user_id,title)
 values('10000000-0000-0000-0000-000000000001',auth.uid(),'A todo');
update public.practice_todos set title='Updated A',done=true where user_id=auth.uid();
do $$
begin
  if (select count(*) from public.practice_profiles)<>1
     or (select display_name from public.practice_profiles)<>'Local A' then
    raise exception 'own profile read/update failed';
  end if;
  if (select count(*) from public.practice_todos)<>1
     or not (select done from public.practice_todos)
     or (select title from public.practice_todos)<>'Updated A' then
    raise exception 'own todo CRUD failed';
  end if;
  begin
    insert into public.practice_todos(id,user_id,title)
      values('10000000-0000-0000-0000-000000000001',auth.uid(),'duplicate');
    raise exception 'duplicate PK accepted';
  exception when unique_violation then null;
  end;
  begin
    insert into public.practice_todos(user_id,title) values(auth.uid(),'   ');
    raise exception 'blank title accepted';
  exception when check_violation then null;
  end;
  begin
    insert into public.practice_todos(user_id,title) values(auth.uid(),repeat('x',121));
    raise exception 'oversized title accepted';
  exception when check_violation then null;
  end;
  begin
    update public.practice_todos set user_id='00000000-0000-0000-0000-000000000002';
    raise exception 'todo ownership transfer accepted';
  exception when insufficient_privilege then null;
  end;
end $$;
select 'PASS: owner profile/todo create-read-update, PK/CHECK, ownership check' as result;

-- A made-up unprovisioned identity passes its own RLS predicate but must fail FK.
set request.jwt.claim.sub = '00000000-0000-0000-0000-000000000003';
do $$
begin
  begin
    insert into public.practice_todos(user_id,title) values(auth.uid(),'No auth user');
    raise exception 'missing user FK accepted';
  exception when foreign_key_violation then null;
  end;
end $$;
select 'PASS: missing auth.users FK rejected' as result;

set request.jwt.claim.sub = '00000000-0000-0000-0000-000000000002';
insert into public.practice_todos(id,user_id,title)
 values('10000000-0000-0000-0000-000000000002',auth.uid(),'B todo');
do $$
declare affected bigint;
begin
  if (select count(*) from public.practice_profiles)<>1
     or exists(select 1 from public.practice_profiles where id<>auth.uid()) then
    raise exception 'B sees A profile';
  end if;
  if (select count(*) from public.practice_todos)<>1
     or exists(select 1 from public.practice_todos where user_id<>auth.uid()) then
    raise exception 'B sees A todo';
  end if;
  update public.practice_todos set title='attacker' where id='10000000-0000-0000-0000-000000000001';
  get diagnostics affected = row_count;
  if affected<>0 then raise exception 'B updated A todo'; end if;
  delete from public.practice_todos where id='10000000-0000-0000-0000-000000000001';
  get diagnostics affected = row_count;
  if affected<>0 then raise exception 'B deleted A todo'; end if;
  update public.practice_profiles set display_name='attacker' where id='00000000-0000-0000-0000-000000000001';
  get diagnostics affected = row_count;
  if affected<>0 then raise exception 'B updated A profile'; end if;
  begin
    insert into public.practice_todos(user_id,title)
      values('00000000-0000-0000-0000-000000000001','forged');
    raise exception 'B forged A todo';
  exception when insufficient_privilege then null;
  end;
end $$;
select 'PASS: second identity isolation, update/delete zero rows, forged insert denied' as result;

set request.jwt.claim.sub = '00000000-0000-0000-0000-000000000001';
do $$
begin
  if (select title from public.practice_todos)<>'Updated A'
     or not (select done from public.practice_todos)
     or (select display_name from public.practice_profiles)<>'Local A' then
    raise exception 'owner state changed by other identity';
  end if;
end $$;
select 'PASS: owner re-read confirms protected data' as result;

-- A role with no authenticated identity must not see or insert application rows.
set request.jwt.claim.sub = '';
do $$
begin
  if exists(select 1 from public.practice_todos) or exists(select 1 from public.practice_profiles) then
    raise exception 'missing identity can read rows';
  end if;
  begin
    insert into public.practice_todos(user_id,title)
      values('00000000-0000-0000-0000-000000000001','unsigned');
    raise exception 'missing identity insert accepted';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;
set role anon;
do $$
begin
  begin
    perform count(*) from public.practice_todos;
    raise exception 'anon reads todos';
  exception when insufficient_privilege then null;
  end;
  begin
    perform count(*) from public.practice_profiles;
    raise exception 'anon reads profiles';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.practice_todos(user_id,title)
      values('00000000-0000-0000-0000-000000000001','anon');
    raise exception 'anon insert accepted';
  exception when insufficient_privilege then null;
  end;
end $$;
select 'PASS: absent identity and anon read/write denied' as result;
reset role;

set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-000000000002';
delete from public.practice_todos where user_id=auth.uid();
do $$
begin
  if exists(select 1 from public.practice_todos) then raise exception 'owner delete failed'; end if;
end $$;
reset role;
-- Auth user deletion cascades into the triggered profile and remaining A todo.
delete from auth.users where id='00000000-0000-0000-0000-000000000001';
do $$
begin
  if exists(select 1 from public.practice_profiles where id='00000000-0000-0000-0000-000000000001')
     or exists(select 1 from public.practice_todos where user_id='00000000-0000-0000-0000-000000000001') then
    raise exception 'auth user cascade failed';
  end if;
  if (select count(*) from public.practice_profiles)<>1 then raise exception 'cascade affected other profile'; end if;
end $$;
delete from auth.users where id in ('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002');
do $$
begin
  if exists(select 1 from public.practice_profiles) or exists(select 1 from public.practice_todos) then
    raise exception 'cleanup failed';
  end if;
end $$;
select 'PASS: owner delete, Auth deletion cascade, unrelated profile preserved, cleanup' as result;

\ir assert-legacy-preserved.sql
