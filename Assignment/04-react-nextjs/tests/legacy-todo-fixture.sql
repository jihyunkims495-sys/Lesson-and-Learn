-- Representative existing application objects and fictional rows. No remote data.
create table public.profiles (
  id uuid primary key references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  name text,
  email text
);
create table public.todos (
  id uuid primary key,
  status text not null,
  user_id uuid not null references auth.users(id),
  user_name text,
  title text,
  content text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
alter table public.todos enable row level security;
create policy legacy_todos_own on public.todos for all to authenticated
  using (user_id=auth.uid()) with check(user_id=auth.uid());
create index todos_user_created_idx on public.todos(user_id,created_at desc);
insert into auth.users values('90000000-0000-0000-0000-000000000001');
insert into public.profiles(id,name,email)
  values('90000000-0000-0000-0000-000000000001','Legacy sample','legacy@example.com');
insert into public.todos(id,status,user_id,user_name,title,content)
  values('90000000-0000-0000-0000-000000000002','OPEN',
    '90000000-0000-0000-0000-000000000001','Legacy sample','Keep this todo','Unchanged sample content');

create schema test_meta;
create function test_meta.legacy_snapshot() returns jsonb language sql stable as $$
  select jsonb_build_object(
    'profiles_data',(select jsonb_agg(to_jsonb(p) order by p.id) from public.profiles p),
    'todos_data',(select jsonb_agg(to_jsonb(t) order by t.id) from public.todos t),
    'relations',(select jsonb_agg(jsonb_build_array(c.oid,c.relname,c.relrowsecurity,c.relforcerowsecurity,c.relacl)
      order by c.relname) from pg_class c join pg_namespace n on n.oid=c.relnamespace
      where n.nspname='public' and c.relname in ('profiles','todos')),
    'columns',(select jsonb_agg(jsonb_build_array(a.attrelid,a.attnum,a.attname,a.atttypid,
      a.atttypmod,a.attnotnull,pg_get_expr(d.adbin,d.adrelid)) order by a.attrelid,a.attnum)
      from pg_attribute a left join pg_attrdef d on d.adrelid=a.attrelid and d.adnum=a.attnum
      where a.attrelid in ('public.profiles'::regclass,'public.todos'::regclass)
      and a.attnum>0 and not a.attisdropped),
    'constraints',(select jsonb_agg(jsonb_build_array(c.oid,c.conname,pg_get_constraintdef(c.oid))
      order by c.oid) from pg_constraint c
      where c.conrelid in ('public.profiles'::regclass,'public.todos'::regclass)),
    'policies',(select jsonb_agg(to_jsonb(p) order by p.tablename,p.policyname) from pg_policies p
      where p.schemaname='public' and p.tablename in ('profiles','todos')),
    'indexes',(select jsonb_agg(to_jsonb(i) order by i.tablename,i.indexname) from pg_indexes i
      where i.schemaname='public' and i.tablename in ('profiles','todos')),
    'triggers',(select jsonb_agg(jsonb_build_array(t.oid,pg_get_triggerdef(t.oid)) order by t.oid)
      from pg_trigger t where t.tgrelid in ('public.profiles'::regclass,'public.todos'::regclass))
  );
$$;
create table test_meta.before_legacy(snapshot jsonb not null);
insert into test_meta.before_legacy select test_meta.legacy_snapshot();
