-- Tamanhozi: só o que é novo (o resto do schema.sql já rodou antes). Pode rodar de novo sem problema.

-- ═════════════════════════════ Tamanhozi ═════════════════════════════
-- Mesmo projeto e mesma conta (auth.users). Tabelas próprias:
--   tamanhozi_salas          salas online (código de 5 letras, anfitrião, tema e estado da partida)
--   tamanhozi_sala_jogadores quem está em cada sala (até 10)
--   tamanhozi_partidas       histórico das partidas online (cada um vê só as suas)
--   tamanhozi_diario         resultado de cada um no Tamanhozi do dia (lá embaixo, com os outros rankings)

create table if not exists public.tamanhozi_salas (
  code text primary key check (code ~ '^[A-Z0-9]{5}$'),
  host_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'lobby' check (status in ('lobby', 'playing', 'finished')),
  settings jsonb not null default '{}'::jsonb,
  state jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tamanhozi_sala_jogadores (
  sala_code text not null references public.tamanhozi_salas (code) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  nick text not null check (char_length(nick) between 1 and 16),
  joined_at timestamptz not null default now(),
  primary key (sala_code, user_id)
);

create table if not exists public.tamanhozi_partidas (
  id bigint generated always as identity primary key,
  sala_code text not null,
  rodadas integer,
  players jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists tamanhozi_partidas_players_idx on public.tamanhozi_partidas using gin (players jsonb_path_ops);
create index if not exists tamanhozi_salas_updated_idx on public.tamanhozi_salas (updated_at);

drop trigger if exists tamanhozi_salas_updated on public.tamanhozi_salas;
create trigger tamanhozi_salas_updated before update on public.tamanhozi_salas
  for each row execute function public.tocar_updated_at();

-- No máximo 10 jogadores por sala do Tamanhozi.
create or replace function public.tamanhozi_limitar_jogadores()
returns trigger language plpgsql as $$
begin
  if (select count(*) from public.tamanhozi_sala_jogadores where sala_code = new.sala_code) >= 10 then
    raise exception 'A sala está cheia';
  end if;
  return new;
end $$;

drop trigger if exists tamanhozi_sala_jogadores_limite on public.tamanhozi_sala_jogadores;
create trigger tamanhozi_sala_jogadores_limite before insert on public.tamanhozi_sala_jogadores
  for each row execute function public.tamanhozi_limitar_jogadores();

-- Salas paradas há mais de um dia somem (chamada por quem cria uma sala).
create or replace function public.tamanhozi_limpar_salas()
returns void language sql security definer set search_path = public as $$
  delete from public.tamanhozi_salas where updated_at < now() - interval '1 day';
$$;
grant execute on function public.tamanhozi_limpar_salas() to authenticated;

alter table public.tamanhozi_salas enable row level security;
alter table public.tamanhozi_sala_jogadores enable row level security;
alter table public.tamanhozi_partidas enable row level security;

-- Salas: quem tem o código consegue ver; só o anfitrião cria, muda e apaga.
drop policy if exists "tamanhozi salas: ler" on public.tamanhozi_salas;
create policy "tamanhozi salas: ler" on public.tamanhozi_salas
  for select to authenticated using (true);

drop policy if exists "tamanhozi salas: criar como anfitrião" on public.tamanhozi_salas;
create policy "tamanhozi salas: criar como anfitrião" on public.tamanhozi_salas
  for insert to authenticated with check (host_id = auth.uid());

drop policy if exists "tamanhozi salas: anfitrião edita" on public.tamanhozi_salas;
create policy "tamanhozi salas: anfitrião edita" on public.tamanhozi_salas
  for update to authenticated using (host_id = auth.uid()) with check (host_id = auth.uid());

drop policy if exists "tamanhozi salas: anfitrião apaga" on public.tamanhozi_salas;
create policy "tamanhozi salas: anfitrião apaga" on public.tamanhozi_salas
  for delete to authenticated using (host_id = auth.uid());

-- Jogadores: cada um entra e edita a própria linha; sai sozinho ou o anfitrião remove.
drop policy if exists "tamanhozi jogadores: ler" on public.tamanhozi_sala_jogadores;
create policy "tamanhozi jogadores: ler" on public.tamanhozi_sala_jogadores
  for select to authenticated using (true);

drop policy if exists "tamanhozi jogadores: entrar" on public.tamanhozi_sala_jogadores;
create policy "tamanhozi jogadores: entrar" on public.tamanhozi_sala_jogadores
  for insert to authenticated with check (
    user_id = auth.uid()
    and exists (select 1 from public.tamanhozi_salas s where s.code = sala_code and s.status <> 'playing')
  );

drop policy if exists "tamanhozi jogadores: editar a própria linha" on public.tamanhozi_sala_jogadores;
create policy "tamanhozi jogadores: editar a própria linha" on public.tamanhozi_sala_jogadores
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "tamanhozi jogadores: sair ou ser removido" on public.tamanhozi_sala_jogadores;
create policy "tamanhozi jogadores: sair ou ser removido" on public.tamanhozi_sala_jogadores
  for delete to authenticated using (
    user_id = auth.uid()
    or exists (select 1 from public.tamanhozi_salas s where s.code = sala_code and s.host_id = auth.uid())
  );

-- Histórico: o anfitrião registra; cada um vê as partidas em que jogou.
drop policy if exists "tamanhozi partidas: ver as minhas" on public.tamanhozi_partidas;
create policy "tamanhozi partidas: ver as minhas" on public.tamanhozi_partidas
  for select to authenticated using (
    players @> jsonb_build_array(jsonb_build_object('uid', auth.uid()::text))
  );

drop policy if exists "tamanhozi partidas: anfitrião registra" on public.tamanhozi_partidas;
create policy "tamanhozi partidas: anfitrião registra" on public.tamanhozi_partidas
  for insert to authenticated with check (
    exists (select 1 from public.tamanhozi_salas s where s.code = sala_code and s.host_id = auth.uid())
  );

-- O Mapazi (só países) virou Tamanhozi no mesmo dia em que saiu: as peças antigas dele saem.
drop function if exists public.mapazi_registrar_diario(integer, text, integer, integer);
drop table if exists public.mapazi_diario;

-- Tamanhozi do dia (o dia 1 é 13/10/2026): 10 rodadas, de 0 a 100 pontos cada.
create table if not exists public.tamanhozi_diario (
  dia integer not null check (dia >= 1),
  user_id uuid not null references auth.users (id) on delete cascade,
  nick text not null default '' check (char_length(nick) <= 16),
  pontos smallint not null check (pontos between 0 and 1000),
  tempo_ms integer check (tempo_ms between 0 and 86400000),
  created_at timestamptz not null default now(),
  primary key (dia, user_id)
);

comment on table public.tamanhozi_diario is 'Tamanhozi: resultado de cada um no Tamanhozi do dia (ranking)';
do $$
begin
  create index if not exists tamanhozi_diario_tempo_idx on public.tamanhozi_diario (dia, pontos desc, tempo_ms);
  drop trigger if exists tamanhozi_diario_nick_limpo on public.tamanhozi_diario;
  create trigger tamanhozi_diario_nick_limpo before insert or update of nick on public.tamanhozi_diario for each row execute function public.gamezi_limpar_nick();
  alter table public.tamanhozi_diario enable row level security;
  drop trigger if exists tamanhozi_sala_jogadores_nick_limpo on public.tamanhozi_sala_jogadores;
  create trigger tamanhozi_sala_jogadores_nick_limpo before insert or update of nick on public.tamanhozi_sala_jogadores for each row execute function public.gamezi_limpar_nick();
end $$;

-- Tamanhozi do dia (o dia 1 é 13/10/2026): p_acertos são os pontos (de 0 a 1000).
create or replace function public.tamanhozi_registrar_diario(p_dia integer, p_nick text, p_acertos integer, p_tempo integer default null)
returns void language plpgsql security definer set search_path = public as $$
declare
  hoje integer := ((now() at time zone 'utc')::date - date '2026-10-13') + 1;
begin
  if auth.uid() is null then raise exception 'Entre para registrar o resultado.'; end if;
  if p_dia is null or p_dia not between hoje - 1 and hoje + 1 then raise exception 'Esse dia já passou.'; end if;
  if p_acertos is null or p_acertos not between 0 and 1000 then raise exception 'Resultado inválido.'; end if;
  insert into public.tamanhozi_diario (dia, user_id, nick, pontos, tempo_ms)
  values (p_dia, auth.uid(), left(coalesce(p_nick, ''), 16), p_acertos, case when p_tempo between 0 and 86400000 then p_tempo end)
  on conflict (dia, user_id) do nothing;
end $$;

grant execute on function public.tamanhozi_registrar_diario(integer, text, integer, integer) to authenticated;

-- Ranking do dia de um jogo: os primeiros (p_limite) e, se a pessoa conectada ficou fora deles, a linha dela no fim.
-- posicao: empate em pontos e tempo divide o lugar. total: quantos jogaram no dia. eu: é a pessoa conectada.
create or replace function public.gamezi_ranking_dia(p_jogo text, p_dia integer, p_limite integer default 10)
returns table (posicao bigint, nick text, pontos integer, tempo_ms integer, eu boolean, total bigint)
language plpgsql stable security definer set search_path = public as $$
begin
  if p_jogo is null or p_jogo not in ('topzi', 'patozi', 'datazi', 'maisoumenozi', 'cravazi', 'tamanhozi') then raise exception 'Jogo desconhecido.'; end if;
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

do $$
declare
  jogo text;
  col text;
begin
  foreach jogo in array array['tamanhozi'] loop
    col := case jogo when 'topzi' then 'room_code' else 'sala_code' end;

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
        delete from public.%3$I where %4$I = p_code and user_id = auth.uid();
        if s.host_id <> auth.uid() then return s.host_id; end if;
        select user_id into novo from public.%3$I where %4$I = p_code order by joined_at limit 1;
        if novo is null then
          delete from public.%2$I where code = p_code;
          return null;
        end if;
        update public.%2$I set host_id = novo where code = p_code;
        return novo;
      end $b$;
    $f$, jogo || '_sair_da_sala', jogo || '_salas', jogo || '_sala_jogadores', col);

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
        if not exists (select 1 from public.%3$I where %4$I = p_code and user_id = auth.uid()) then return false; end if;
        if exists (select 1 from public.%3$I where %4$I = p_code and user_id = s.host_id)
           and s.updated_at > now() - interval '10 seconds' then
          return false;
        end if;
        update public.%2$I set host_id = auth.uid() where code = p_code;
        return true;
      end $b$;
    $f$, jogo || '_assumir_sala', jogo || '_salas', jogo || '_sala_jogadores', col);

    execute format('grant execute on function public.%I(text) to authenticated', jogo || '_sair_da_sala');
    execute format('grant execute on function public.%I(text) to authenticated', jogo || '_assumir_sala');
  end loop;
end $$;
