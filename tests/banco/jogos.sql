-- Os 12 jogos (e o Top 30 e o Top 50 do dia do Topzi) no banco: ranking do dia de todos e, nos jogos do kit, o resultado do dia e a sala online inteira
-- (criar, entrar, começar, histórico, passar o anfitrião e sair).
\set ON_ERROR_STOP 1
insert into auth.users values ('11111111-1111-1111-1111-111111111111','a@x'), ('22222222-2222-2222-2222-222222222222','b@x') on conflict do nothing;
set role authenticated;
do $$
declare j text; dia int; n int; r record; novo uuid;
begin
  foreach j in array array['topzi','patozi','datazi','maisoumenozi','cravazi','tamanhozi','emojizi','contazi','memorizi','fotozi','censurazi','corzi'] loop
    perform set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
    -- ranking existe para o jogo (vazio no dia 1 é ok)
    select count(*) into n from public.gamezi_ranking_dia(j, 1, 10);
    if j in ('emojizi','contazi','memorizi','fotozi','censurazi','corzi') then
      dia := ((now() at time zone 'utc')::date - (case when j in ('fotozi','censurazi','corzi') then date '2026-10-26' else date '2026-10-23' end)) + 1;
      execute format('select public.%I($1, $2, $3, $4)', j || '_registrar_diario') using dia, 'Ana', 870, 41000;
      perform set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);
      execute format('select public.%I($1, $2, $3, $4)', j || '_registrar_diario') using dia, 'Beto', 920, 50000;
      select count(*) into n from public.gamezi_ranking_dia(j, dia, 10);
      select * into r from public.gamezi_ranking_dia(j, dia, 10) limit 1;
      if n <> 2 or r.nick <> 'Beto' or not r.eu then raise exception '% ranking errado: % %', j, n, r; end if;
      -- online: Beto cria a sala, Ana entra, Beto sai e Ana vira anfitriã
      execute format('insert into public.%I (code, host_id, settings) values (%L, auth.uid(), %L)', j || '_salas', 'ABCDE', '{"tema":"misto"}');
      execute format('insert into public.%I (sala_code, user_id, nick, skin) values (%L, auth.uid(), %L, %L)', j || '_sala_jogadores', 'ABCDE', 'Beto', '{"cor":1}');
      perform set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
      execute format('insert into public.%I (sala_code, user_id, nick) values (%L, auth.uid(), %L)', j || '_sala_jogadores', 'ABCDE', 'Ana');
      perform set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);
      execute format('update public.%I set status = %L, state = %L where code = %L', j || '_salas', 'playing', '{"r":1}', 'ABCDE');
      execute format('insert into public.%I (sala_code, rodadas, players) values (%L, 10, %L)', j || '_partidas', 'ABCDE', '[{"uid":"22222222-2222-2222-2222-222222222222"}]');
      execute format('select public.%I(%L)', j || '_sair_da_sala', 'ABCDE') into novo;
      if novo <> '11111111-1111-1111-1111-111111111111' then raise exception '% sair_da_sala: %', j, novo; end if;
      perform set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
      execute format('select public.%I(%L)', j || '_sair_da_sala', 'ABCDE') into novo;
      execute format('select public.%I()', j || '_limpar_salas');
      raise notice '% ok (ranking + online)', j;
    else
      raise notice '% ok (ranking)', j;
    end if;
  end loop;
end $$;

-- Topzi: Top 30 e Top 50 do dia (dia 1 = 14/11/2026). Resultado possível entra, impossível é recusado, ranking aparece.
do $$
declare tam int; dia int; n int; r record; recusou boolean;
begin
  dia := ((now() at time zone 'utc')::date - date '2026-11-14') + 1;
  foreach tam in array array[30, 50] loop
    perform set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
    -- 3 acertos: no mínimo 1+2+3 = 6 e no máximo (tam-2)+(tam-1)+tam
    perform public.topzi_registrar_diario_grande(tam, dia, 'lista', 'Ana', 3 * tam - 3, 3, 90000);
    perform set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);
    recusou := false;
    begin
      perform public.topzi_registrar_diario_grande(tam, dia, 'lista', 'Beto', 3 * tam, 3, 80000); -- impossível com 3 acertos
    exception when others then recusou := true;
    end;
    if not recusou then raise exception 'topzi% aceitou pontos impossíveis', tam; end if;
    perform public.topzi_registrar_diario_grande(tam, dia, 'lista', 'Beto', 6, 3, 80000);
    select count(*) into n from public.gamezi_ranking_dia('topzi' || tam, dia, 10);
    select * into r from public.gamezi_ranking_dia('topzi' || tam, dia, 10) limit 1;
    if n <> 2 or r.nick <> 'Ana' or r.pontos <> 3 * tam - 3 then raise exception 'topzi% ranking errado: % %', tam, n, r; end if;
    raise notice 'topzi% ok (ranking)', tam;
  end loop;
end $$;
