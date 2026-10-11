-- Kolom tanda tangan yang bisa diatur per template rapor (RaporTtd[]).
alter table public.rapor_templates add column if not exists ttd jsonb;

notify pgrst, 'reload schema';
