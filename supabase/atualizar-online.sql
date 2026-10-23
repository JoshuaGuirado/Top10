-- Tudo o que é novo no banco, num script só: online do Datazi e do Maiorzi, skin nas salas, e os jogos novos
-- Emojizi, Contazi e Memorizi (salas, desafio do dia e ranking). Para quem já rodou o schema.sql antes.
-- Faz o mesmo que online-novo.sql + jogos-novos.sql juntos. Pode rodar de novo sem problema.

do $do$
declare
  jogo text;
begin
  -- Salas online (código, anfitrião, estado), quem está em cada sala (com a skin) e o histórico das partidas.
  foreach jogo in array array['datazi', 'maisoumenozi', 'emojizi', 'contazi', 'memorizi'] loop
    execute format($f$
      create table if not exists public.%1$I (
        code text primary key check (code ~ '^[A-Z0-9]{5}$'),
        host_id uuid not null references auth.users (id) on delete cascade,
        status text not null default 'lobby' check (status in ('lobby', 'playing', 'finished')),
        settings jsonb not null default '{}'::jsonb,
        state jsonb,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      )$f$, jogo || '_salas');
    execute format($f$
      create table if not exists public.%1$I (
        sala_code text not null references public.%2$I (code) on delete cascade,
        user_id uuid not null references auth.users (id) on delete cascade,
        nick text not null check (char_length(nick) between 1 and 16),
        skin jsonb check (skin is null or (jsonb_typeof(skin) = 'object' and octet_length(skin::text) <= 1500)),
        joined_at timestamptz not null default now(),
        primary key (sala_code, user_id)
      )$f$, jogo || '_sala_jogadores', jogo || '_salas');
    execute format($f$
      create table if not exists public.%1$I (
        id bigint generated always as identity primary key,
        sala_code text not null,
        tipo text,
        rodadas integer,
        players jsonb not null,
        created_at timestamptz not null default now()
      )$f$, jogo || '_partidas');
    -- Quem criou as salas antes desta versão: a skin e o modo de jogo entraram depois.
    execute format('alter table public.%I add column if not exists skin jsonb check (skin is null or (jsonb_typeof(skin) = %L and octet_length(skin::text) <= 1500))', jogo || '_sala_jogadores', 'object');
    execute format('alter table public.%I add column if not exists tipo text', jogo || '_partidas');
    execute format('create index if not exists %I on public.%I using gin (players jsonb_path_ops)', jogo || '_partidas_players_idx', jogo || '_partidas');
    execute format('create index if not exists %I on public.%I (updated_at)', jogo || '_salas_updated_idx', jogo || '_salas');
    execute format('drop trigger if exists %I on public.%I', jogo || '_salas_updated', jogo || '_salas');
    execute format('create trigger %I before update on public.%I for each row execute function public.tocar_updated_at()', jogo || '_salas_updated', jogo || '_salas');

    -- No máximo 10 por sala.
    execute format($f$
      create or replace function public.%1$I() returns trigger language plpgsql as $b$
      begin
        if (select count(*) from public.%2$I where sala_code = new.sala_code) >= 10 then
          raise exception 'A sala está cheia';
        end if;
        return new;
      end $b$ $f$, jogo || '_limitar_jogadores', jogo || '_sala_jogadores');
    execute format('drop trigger if exists %I on public.%I', jogo || '_sala_jogadores_limite', jogo || '_sala_jogadores');
    execute format('create trigger %I before insert on public.%I for each row execute function public.%I()', jogo || '_sala_jogadores_limite', jogo || '_sala_jogadores', jogo || '_limitar_jogadores');
    execute format('drop trigger if exists %I on public.%I', jogo || '_sala_jogadores_nick_limpo', jogo || '_sala_jogadores');
    execute format('create trigger %I before insert or update of nick on public.%I for each row execute function public.gamezi_limpar_nick()', jogo || '_sala_jogadores_nick_limpo', jogo || '_sala_jogadores');

    -- Salas paradas há mais de um dia somem.
    execute format($f$
      create or replace function public.%1$I() returns void language sql security definer set search_path = public as $b$
        delete from public.%2$I where updated_at < now() - interval '1 day';
      $b$ $f$, jogo || '_limpar_salas', jogo || '_salas');
    execute format('grant execute on function public.%I() to authenticated', jogo || '_limpar_salas');

    -- Regras (RLS): quem tem o código vê a sala; só o anfitrião cria, muda e apaga; cada um entra e sai sozinho.
    execute format('alter table public.%I enable row level security', jogo || '_salas');
    execute format('alter table public.%I enable row level security', jogo || '_sala_jogadores');
    execute format('alter table public.%I enable row level security', jogo || '_partidas');
    execute format('drop policy if exists %I on public.%I', jogo || ' salas: ler', jogo || '_salas');
    execute format('create policy %I on public.%I for select to authenticated using (true)', jogo || ' salas: ler', jogo || '_salas');
    execute format('drop policy if exists %I on public.%I', jogo || ' salas: criar como anfitrião', jogo || '_salas');
    execute format('create policy %I on public.%I for insert to authenticated with check (host_id = auth.uid())', jogo || ' salas: criar como anfitrião', jogo || '_salas');
    execute format('drop policy if exists %I on public.%I', jogo || ' salas: anfitrião edita', jogo || '_salas');
    execute format('create policy %I on public.%I for update to authenticated using (host_id = auth.uid()) with check (host_id = auth.uid())', jogo || ' salas: anfitrião edita', jogo || '_salas');
    execute format('drop policy if exists %I on public.%I', jogo || ' salas: anfitrião apaga', jogo || '_salas');
    execute format('create policy %I on public.%I for delete to authenticated using (host_id = auth.uid())', jogo || ' salas: anfitrião apaga', jogo || '_salas');
    execute format('drop policy if exists %I on public.%I', jogo || ' jogadores: ler', jogo || '_sala_jogadores');
    execute format('create policy %I on public.%I for select to authenticated using (true)', jogo || ' jogadores: ler', jogo || '_sala_jogadores');
    execute format('drop policy if exists %I on public.%I', jogo || ' jogadores: entrar', jogo || '_sala_jogadores');
    execute format('create policy %I on public.%I for insert to authenticated with check (user_id = auth.uid() and exists (select 1 from public.%I s where s.code = sala_code and s.status <> %L))', jogo || ' jogadores: entrar', jogo || '_sala_jogadores', jogo || '_salas', 'playing');
    execute format('drop policy if exists %I on public.%I', jogo || ' jogadores: editar a própria linha', jogo || '_sala_jogadores');
    execute format('create policy %I on public.%I for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())', jogo || ' jogadores: editar a própria linha', jogo || '_sala_jogadores');
    execute format('drop policy if exists %I on public.%I', jogo || ' jogadores: sair ou ser removido', jogo || '_sala_jogadores');
    execute format('create policy %I on public.%I for delete to authenticated using (user_id = auth.uid() or exists (select 1 from public.%I s where s.code = sala_code and s.host_id = auth.uid()))', jogo || ' jogadores: sair ou ser removido', jogo || '_sala_jogadores', jogo || '_salas');
    execute format('drop policy if exists %I on public.%I', jogo || ' partidas: ver as minhas', jogo || '_partidas');
    execute format('create policy %I on public.%I for select to authenticated using (players @> jsonb_build_array(jsonb_build_object(%L, auth.uid()::text)))', jogo || ' partidas: ver as minhas', jogo || '_partidas', 'uid');
    execute format('drop policy if exists %I on public.%I', jogo || ' partidas: anfitrião registra', jogo || '_partidas');
    execute format('create policy %I on public.%I for insert to authenticated with check (exists (select 1 from public.%I s where s.code = sala_code and s.host_id = auth.uid()))', jogo || ' partidas: anfitrião registra', jogo || '_partidas', jogo || '_salas');

    -- Quem sai passa o comando para quem entrou primeiro; quem fica assume se o anfitrião sumiu.
    execute format($f$
      create or replace function public.%1$I(p_code text)
      returns uuid language plpgsql security definer set search_path = public as $b$
      declare
        s public.%2$I;
        novo uuid;
      begin
        if auth.uid() is null then raise exception 'Entre para jogar online.'; end if;
        select * into s from public.%2$I where code = p_code for update;
        if not found then return null; end if;
        delete from public.%3$I where sala_code = p_code and user_id = auth.uid();
        if s.host_id <> auth.uid() then return s.host_id; end if;
        select user_id into novo from public.%3$I where sala_code = p_code order by joined_at limit 1;
        if novo is null then
          delete from public.%2$I where code = p_code;
          return null;
        end if;
        update public.%2$I set host_id = novo where code = p_code;
        return novo;
      end $b$ $f$, jogo || '_sair_da_sala', jogo || '_salas', jogo || '_sala_jogadores');
    execute format($f$
      create or replace function public.%1$I(p_code text)
      returns boolean language plpgsql security definer set search_path = public as $b$
      declare
        s public.%2$I;
      begin
        if auth.uid() is null then return false; end if;
        select * into s from public.%2$I where code = p_code for update;
        if not found then return false; end if;
        if s.host_id = auth.uid() then return true; end if;
        if not exists (select 1 from public.%3$I where sala_code = p_code and user_id = auth.uid()) then return false; end if;
        if exists (select 1 from public.%3$I where sala_code = p_code and user_id = s.host_id)
           and s.updated_at > now() - interval '10 seconds' then
          return false;
        end if;
        update public.%2$I set host_id = auth.uid() where code = p_code;
        return true;
      end $b$ $f$, jogo || '_assumir_sala', jogo || '_salas', jogo || '_sala_jogadores');
    execute format('grant execute on function public.%I(text) to authenticated', jogo || '_sair_da_sala');
    execute format('grant execute on function public.%I(text) to authenticated', jogo || '_assumir_sala');
  end loop;

  -- Desafio do dia dos jogos novos (o dia 1 é 23/10/2026): 10 rodadas, de 0 a 1000 pontos.
  foreach jogo in array array['emojizi', 'contazi', 'memorizi'] loop
    execute format($f$
      create table if not exists public.%1$I (
        dia integer not null check (dia >= 1),
        user_id uuid not null references auth.users (id) on delete cascade,
        nick text not null default '' check (char_length(nick) <= 16),
        pontos smallint not null check (pontos between 0 and 1000),
        tempo_ms integer check (tempo_ms between 0 and 86400000),
        created_at timestamptz not null default now(),
        primary key (dia, user_id)
      )$f$, jogo || '_diario');
    execute format('create index if not exists %I on public.%I (dia, pontos desc, tempo_ms)', jogo || '_diario_tempo_idx', jogo || '_diario');
    execute format('drop trigger if exists %I on public.%I', jogo || '_diario_nick_limpo', jogo || '_diario');
    execute format('create trigger %I before insert or update of nick on public.%I for each row execute function public.gamezi_limpar_nick()', jogo || '_diario_nick_limpo', jogo || '_diario');
    execute format('alter table public.%I enable row level security', jogo || '_diario'); -- sem regras: só as funções leem e gravam
    execute format($f$
      create or replace function public.%1$I(p_dia integer, p_nick text, p_acertos integer, p_tempo integer default null)
      returns void language plpgsql security definer set search_path = public as $b$
      declare
        hoje integer := ((now() at time zone 'utc')::date - date '2026-10-23') + 1;
      begin
        if auth.uid() is null then raise exception 'Entre para registrar o resultado.'; end if;
        if p_dia is null or p_dia not between hoje - 1 and hoje + 1 then raise exception 'Esse dia já passou.'; end if;
        if p_acertos is null or p_acertos not between 0 and 1000 then raise exception 'Resultado inválido.'; end if;
        insert into public.%2$I (dia, user_id, nick, pontos, tempo_ms)
        values (p_dia, auth.uid(), left(coalesce(p_nick, ''), 16), p_acertos, case when p_tempo between 0 and 86400000 then p_tempo end)
        on conflict (dia, user_id) do nothing;
      end $b$ $f$, jogo || '_registrar_diario', jogo || '_diario');
    execute format('grant execute on function public.%I(integer, text, integer, integer) to authenticated', jogo || '_registrar_diario');
  end loop;
end $do$;

-- Skin nas salas do Tamanhozi (as dos outros já nascem com ela).
alter table public.tamanhozi_sala_jogadores add column if not exists skin jsonb check (skin is null or (jsonb_typeof(skin) = 'object' and octet_length(skin::text) <= 1500));

-- Ranking do dia: agora com os jogos novos.
create or replace function public.gamezi_ranking_dia(p_jogo text, p_dia integer, p_limite integer default 10)
returns table (posicao bigint, nick text, pontos integer, tempo_ms integer, eu boolean, total bigint)
language plpgsql stable security definer set search_path = public as $$
begin
  if p_jogo is null or p_jogo not in ('topzi', 'patozi', 'datazi', 'maisoumenozi', 'cravazi', 'tamanhozi', 'emojizi', 'contazi', 'memorizi') then raise exception 'Jogo desconhecido.'; end if;
  return query execute format($q$
    with r as (
      select d.nick, d.pontos::integer as pontos, d.tempo_ms, d.user_id,
             rank() over (order by d.pontos desc, d.tempo_ms asc nulls last) as posicao,
             row_number() over (order by d.pontos desc, d.tempo_ms asc nulls last, d.created_at) as ordem,
             count(*) over () as total
        from public.%I d
       where d.dia = $1
    )
    select r.posicao, r.nick, r.pontos, r.tempo_ms, coalesce(r.user_id = auth.uid(), false), r.total
      from r
     where r.ordem <= $2 or r.user_id = auth.uid()
     order by r.ordem
  $q$, p_jogo || '_diario') using p_dia, least(greatest(coalesce(p_limite, 10), 1), 50);
end $$;
grant execute on function public.gamezi_ranking_dia(text, integer, integer) to anon, authenticated;

-- Visões do painel (Table Editor) com as salas de todos os jogos juntas; fechadas para o site.
drop view if exists public.gamezi_salas;
create view public.gamezi_salas with (security_invoker = true) as
  select 'topzi'::text as jogo, r.code as codigo, r.status, r.host_id as anfitriao,
         (select count(*) from public.topzi_sala_jogadores p where p.room_code = r.code) as jogadores,
         r.created_at as criada_em, r.updated_at as atualizada_em
    from public.topzi_salas r
  union all select 'patozi', s.code, s.status, s.host_id, (select count(*) from public.patozi_sala_jogadores j where j.sala_code = s.code), s.created_at, s.updated_at from public.patozi_salas s
  union all select 'cravazi', s.code, s.status, s.host_id, (select count(*) from public.cravazi_sala_jogadores j where j.sala_code = s.code), s.created_at, s.updated_at from public.cravazi_salas s
  union all select 'tamanhozi', s.code, s.status, s.host_id, (select count(*) from public.tamanhozi_sala_jogadores j where j.sala_code = s.code), s.created_at, s.updated_at from public.tamanhozi_salas s
  union all select 'datazi', s.code, s.status, s.host_id, (select count(*) from public.datazi_sala_jogadores j where j.sala_code = s.code), s.created_at, s.updated_at from public.datazi_salas s
  union all select 'maisoumenozi', s.code, s.status, s.host_id, (select count(*) from public.maisoumenozi_sala_jogadores j where j.sala_code = s.code), s.created_at, s.updated_at from public.maisoumenozi_salas s
  union all select 'emojizi', s.code, s.status, s.host_id, (select count(*) from public.emojizi_sala_jogadores j where j.sala_code = s.code), s.created_at, s.updated_at from public.emojizi_salas s
  union all select 'contazi', s.code, s.status, s.host_id, (select count(*) from public.contazi_sala_jogadores j where j.sala_code = s.code), s.created_at, s.updated_at from public.contazi_salas s
  union all select 'memorizi', s.code, s.status, s.host_id, (select count(*) from public.memorizi_sala_jogadores j where j.sala_code = s.code), s.created_at, s.updated_at from public.memorizi_salas s;

drop view if exists public.gamezi_jogadores_nas_salas;
create view public.gamezi_jogadores_nas_salas with (security_invoker = true) as
  select 'topzi'::text as jogo, p.room_code as sala, p.nick, p.user_id, p.joined_at as entrou_em from public.topzi_sala_jogadores p
  union all select 'patozi', j.sala_code, j.nick, j.user_id, j.joined_at from public.patozi_sala_jogadores j
  union all select 'cravazi', j.sala_code, j.nick, j.user_id, j.joined_at from public.cravazi_sala_jogadores j
  union all select 'tamanhozi', j.sala_code, j.nick, j.user_id, j.joined_at from public.tamanhozi_sala_jogadores j
  union all select 'datazi', j.sala_code, j.nick, j.user_id, j.joined_at from public.datazi_sala_jogadores j
  union all select 'maisoumenozi', j.sala_code, j.nick, j.user_id, j.joined_at from public.maisoumenozi_sala_jogadores j
  union all select 'emojizi', j.sala_code, j.nick, j.user_id, j.joined_at from public.emojizi_sala_jogadores j
  union all select 'contazi', j.sala_code, j.nick, j.user_id, j.joined_at from public.contazi_sala_jogadores j
  union all select 'memorizi', j.sala_code, j.nick, j.user_id, j.joined_at from public.memorizi_sala_jogadores j;

revoke all on public.gamezi_salas, public.gamezi_jogadores_nas_salas from anon, authenticated;
