-- Ligas entre amigos: criar, entrar pelo código, ranking da semana (0 a 100 por desafio, só esta semana), quem
-- está fora não vê, ninguém lê as tabelas direto e a liga vazia some.
\set ON_ERROR_STOP 1
insert into auth.users values ('44444444-4444-4444-4444-444444444444','a@x'), ('55555555-5555-5555-5555-555555555555','b@x'), ('66666666-6666-6666-6666-666666666666','c@x');
-- resultados desta semana: Ana fez Topzi 55/55 (100) e Corzi 500/1000 (50); Beto fez Datazi 4/8 (50); Caio está fora da liga.
do $$
declare seg date := date_trunc('week', (now() at time zone 'America/Sao_Paulo')::date)::date;
begin
  insert into public.topzi_diario (dia, lista, user_id, nick, pontos, acertos) values ((seg - date '2026-10-01') + 1, 'x', '44444444-4444-4444-4444-444444444444', 'Ana', 55, 10);
  insert into public.corzi_diario (dia, user_id, nick, pontos) values (greatest(1, (seg - date '2026-10-26') + 1), '44444444-4444-4444-4444-444444444444', 'Ana', 500);
  insert into public.datazi_diario (dia, user_id, nick, pontos) values ((seg - date '2026-10-08') + 1, '55555555-5555-5555-5555-555555555555', 'Beto', 4);
  -- semana passada não conta
  insert into public.datazi_diario (dia, user_id, nick, pontos) values ((seg - date '2026-10-08') - 2, '55555555-5555-5555-5555-555555555555', 'Beto', 8);
end $$;
set role authenticated;
select set_config('request.jwt.claim.sub', '44444444-4444-4444-4444-444444444444', false) \gset
select public.gamezi_liga_criar('Los Halcones', 'Ana') as cod \gset
\echo liga criada :cod
select set_config('request.jwt.claim.sub', '55555555-5555-5555-5555-555555555555', false) \gset
select public.gamezi_liga_entrar(lower(:'cod'), 'Beto') as nome \gset
\echo Beto entrou em :nome
select * from public.gamezi_liga_ranking(:'cod');
select * from public.gamezi_minhas_ligas();
select set_config('request.jwt.claim.sub', '66666666-6666-6666-6666-666666666666', false) \gset
\set ON_ERROR_STOP 0
select * from public.gamezi_liga_ranking(:'cod');
select count(*) from public.gamezi_liga_membros;
\set ON_ERROR_STOP 1
select set_config('request.jwt.claim.sub', '44444444-4444-4444-4444-444444444444', false) \gset
select public.gamezi_liga_sair(:'cod');
select set_config('request.jwt.claim.sub', '55555555-5555-5555-5555-555555555555', false) \gset
select public.gamezi_liga_sair(:'cod');
reset role;
select count(*) as ligas_restantes from public.gamezi_ligas;
