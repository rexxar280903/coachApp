-- For projects that already applied the security schema with mandatory staff MFA.
-- Otherwise use the latest complete schema.sql. Run together with the updated frontend.
-- Existing Auth accounts, authenticator factors, data policies and storage settings are preserved.
begin;

create or replace function public.current_staff_role()
returns text language sql stable security definer set search_path = '' as $$
  select role from public.profiles where id = auth.uid()
$$;

revoke all on function public.current_staff_role() from public, anon, authenticated;
grant execute on function public.current_staff_role() to anon, authenticated;

commit;
