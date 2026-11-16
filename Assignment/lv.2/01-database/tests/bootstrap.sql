-- Only for a fresh disposable PostgreSQL container. This models the DB-side
-- identity contract; it does not run Supabase Auth or PostgREST.
create role authenticated nologin;
create role anon nologin;
create schema auth;
create table auth.users(id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;
grant usage on schema auth, public to authenticated;
grant execute on function auth.uid() to authenticated;
insert into auth.users values
 ('00000000-0000-0000-0000-000000000001'),
 ('00000000-0000-0000-0000-000000000002');
