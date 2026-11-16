do $$
begin
  if test_meta.legacy_snapshot() is distinct from (select snapshot from test_meta.before_legacy) then
    raise exception 'existing profiles/todos data or schema changed';
  end if;
end $$;
select 'PASS: existing profiles/todos rows, columns, constraints, RLS policies and triggers unchanged' as result;
