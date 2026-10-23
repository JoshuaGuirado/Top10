-- Jogos novos: Emojizi, Contazi e Memorizi (salas online com skin, Desafio do dia e ranking).
-- Só o que é novo (o resto do schema.sql já rodou antes; rode antes o online-novo.sql, se ainda não rodou).
-- Pode rodar de novo sem problema; o schema.sql inteiro também tem tudo isto.

-- ═════════════════════════════ Emojizi (jogo do kit: gamezi-kit.js) ═════════════════════════════
-- Mesmo projeto e mesma conta (auth.users). Tabelas próprias:
--   emojizi_salas          salas online (código de 5 letras, anfitrião e estado da partida)
--   emojizi_sala_jogadores quem está em cada sala (até 10), com a skin (as do Topzi)
--   emojizi_partidas       histórico das partidas online (cada um vê só as suas)
--   (o Emojizi do dia fica em emojizi_diario, lá embaixo, com os outros rankings)

create table if not exists public.emojizi_salas (
  code text primary key check (code ~ '^[A-Z0-9]{5}$'),
  host_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'lobby' check (status in ('lobby', 'playing', 'finished')),
  settings jsonb not null default '{}'::jsonb,
  state jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.emojizi_sala_jogadores (
  sala_code text not null references public.emojizi_salas (code) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  nick text not null check (char_length(nick) between 1 and 16),
  skin jsonb check (skin is null or (jsonb_typeof(skin) = 'object' and octet_length(skin::text) <= 1500)),
  joined_at timestamptz not null default now(),
  primary key (sala_code, user_id)
);

create table if not exists public.emojizi_partidas (
  id bigint generated always as identity primary key,
  sala_code text not null,
  tipo text,
  rodadas integer,
  players jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists emojizi_partidas_players_idx on public.emojizi_partidas using gin (players jsonb_path_ops);
create index if not exists emojizi_salas_updated_idx on public.emojizi_salas (updated_at);

drop trigger if exists emojizi_salas_updated on public.emojizi_salas;
create trigger emojizi_salas_updated before update on public.emojizi_salas
  for each row execute function public.tocar_updated_at();

-- No máximo 10 jogadores por sala do Emojizi.
create or replace function public.emojizi_limitar_jogadores()
returns trigger language plpgsql as $$
begin
  if (select count(*) from public.emojizi_sala_jogadores where sala_code = new.sala_code) >= 10 then
    raise exception 'A sala está cheia';
  end if;
  return new;
end $$;

drop trigger if exists emojizi_sala_jogadores_limite on public.emojizi_sala_jogadores;
create trigger emojizi_sala_jogadores_limite before insert on public.emojizi_sala_jogadores
  for each row execute function public.emojizi_limitar_jogadores();

-- Salas paradas há mais de um dia somem (chamada por quem cria uma sala).
create or replace function public.emojizi_limpar_salas()
returns void language sql security definer set search_path = public as $$
  delete from public.emojizi_salas where updated_at < now() - interval '1 day';
$$;
grant execute on function public.emojizi_limpar_salas() to authenticated;

alter table public.emojizi_salas enable row level security;
alter table public.emojizi_sala_jogadores enable row level security;
alter table public.emojizi_partidas enable row level security;

-- Salas: quem tem o código consegue ver; só o anfitrião cria, muda e apaga.
drop policy if exists "emojizi salas: ler" on public.emojizi_salas;
create policy "emojizi salas: ler" on public.emojizi_salas
  for select to authenticated using (true);

drop policy if exists "emojizi salas: criar como anfitrião" on public.emojizi_salas;
create policy "emojizi salas: criar como anfitrião" on public.emojizi_salas
  for insert to authenticated with check (host_id = auth.uid());

drop policy if exists "emojizi salas: anfitrião edita" on public.emojizi_salas;
create policy "emojizi salas: anfitrião edita" on public.emojizi_salas
  for update to authenticated using (host_id = auth.uid()) with check (host_id = auth.uid());

drop policy if exists "emojizi salas: anfitrião apaga" on public.emojizi_salas;
create policy "emojizi salas: anfitrião apaga" on public.emojizi_salas
  for delete to authenticated using (host_id = auth.uid());

-- Jogadores: cada um entra e edita a própria linha; sai sozinho ou o anfitrião remove.
drop policy if exists "emojizi jogadores: ler" on public.emojizi_sala_jogadores;
create policy "emojizi jogadores: ler" on public.emojizi_sala_jogadores
  for select to authenticated using (true);

drop policy if exists "emojizi jogadores: entrar" on public.emojizi_sala_jogadores;
create policy "emojizi jogadores: entrar" on public.emojizi_sala_jogadores
  for insert to authenticated with check (
    user_id = auth.uid()
    and exists (select 1 from public.emojizi_salas s where s.code = sala_code and s.status <> 'playing')
  );

drop policy if exists "emojizi jogadores: editar a própria linha" on public.emojizi_sala_jogadores;
create policy "emojizi jogadores: editar a própria linha" on public.emojizi_sala_jogadores
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "emojizi jogadores: sair ou ser removido" on public.emojizi_sala_jogadores;
create policy "emojizi jogadores: sair ou ser removido" on public.emojizi_sala_jogadores
  for delete to authenticated using (
    user_id = auth.uid()
    or exists (select 1 from public.emojizi_salas s where s.code = sala_code and s.host_id = auth.uid())
  );

-- Histórico: o anfitrião registra; cada um vê as partidas em que jogou.
drop policy if exists "emojizi partidas: ver as minhas" on public.emojizi_partidas;
create policy "emojizi partidas: ver as minhas" on public.emojizi_partidas
  for select to authenticated using (
    players @> jsonb_build_array(jsonb_build_object('uid', auth.uid()::text))
  );

drop policy if exists "emojizi partidas: anfitrião registra" on public.emojizi_partidas;
create policy "emojizi partidas: anfitrião registra" on public.emojizi_partidas
  for insert to authenticated with check (
    exists (select 1 from public.emojizi_salas s where s.code = sala_code and s.host_id = auth.uid())
  );

-- ═════════════════════════════ Contazi (jogo do kit: gamezi-kit.js) ═════════════════════════════
-- Mesmo projeto e mesma conta (auth.users). Tabelas próprias:
--   contazi_salas          salas online (código de 5 letras, anfitrião e estado da partida)
--   contazi_sala_jogadores quem está em cada sala (até 10), com a skin (as do Topzi)
--   contazi_partidas       histórico das partidas online (cada um vê só as suas)
--   (o Contazi do dia fica em contazi_diario, lá embaixo, com os outros rankings)

create table if not exists public.contazi_salas (
  code text primary key check (code ~ '^[A-Z0-9]{5}$'),
  host_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'lobby' check (status in ('lobby', 'playing', 'finished')),
  settings jsonb not null default '{}'::jsonb,
  state jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contazi_sala_jogadores (
  sala_code text not null references public.contazi_salas (code) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  nick text not null check (char_length(nick) between 1 and 16),
  skin jsonb check (skin is null or (jsonb_typeof(skin) = 'object' and octet_length(skin::text) <= 1500)),
  joined_at timestamptz not null default now(),
  primary key (sala_code, user_id)
);

create table if not exists public.contazi_partidas (
  id bigint generated always as identity primary key,
  sala_code text not null,
  tipo text,
  rodadas integer,
  players jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists contazi_partidas_players_idx on public.contazi_partidas using gin (players jsonb_path_ops);
create index if not exists contazi_salas_updated_idx on public.contazi_salas (updated_at);

drop trigger if exists contazi_salas_updated on public.contazi_salas;
create trigger contazi_salas_updated before update on public.contazi_salas
  for each row execute function public.tocar_updated_at();

-- No máximo 10 jogadores por sala do Contazi.
create or replace function public.contazi_limitar_jogadores()
returns trigger language plpgsql as $$
begin
  if (select count(*) from public.contazi_sala_jogadores where sala_code = new.sala_code) >= 10 then
    raise exception 'A sala está cheia';
  end if;
  return new;
end $$;

drop trigger if exists contazi_sala_jogadores_limite on public.contazi_sala_jogadores;
create trigger contazi_sala_jogadores_limite before insert on public.contazi_sala_jogadores
  for each row execute function public.contazi_limitar_jogadores();

-- Salas paradas há mais de um dia somem (chamada por quem cria uma sala).
create or replace function public.contazi_limpar_salas()
returns void language sql security definer set search_path = public as $$
  delete from public.contazi_salas where updated_at < now() - interval '1 day';
$$;
grant execute on function public.contazi_limpar_salas() to authenticated;

alter table public.contazi_salas enable row level security;
alter table public.contazi_sala_jogadores enable row level security;
alter table public.contazi_partidas enable row level security;

-- Salas: quem tem o código consegue ver; só o anfitrião cria, muda e apaga.
drop policy if exists "contazi salas: ler" on public.contazi_salas;
create policy "contazi salas: ler" on public.contazi_salas
  for select to authenticated using (true);

drop policy if exists "contazi salas: criar como anfitrião" on public.contazi_salas;
create policy "contazi salas: criar como anfitrião" on public.contazi_salas
  for insert to authenticated with check (host_id = auth.uid());

drop policy if exists "contazi salas: anfitrião edita" on public.contazi_salas;
create policy "contazi salas: anfitrião edita" on public.contazi_salas
  for update to authenticated using (host_id = auth.uid()) with check (host_id = auth.uid());

drop policy if exists "contazi salas: anfitrião apaga" on public.contazi_salas;
create policy "contazi salas: anfitrião apaga" on public.contazi_salas
  for delete to authenticated using (host_id = auth.uid());

-- Jogadores: cada um entra e edita a própria linha; sai sozinho ou o anfitrião remove.
drop policy if exists "contazi jogadores: ler" on public.contazi_sala_jogadores;
create policy "contazi jogadores: ler" on public.contazi_sala_jogadores
  for select to authenticated using (true);

drop policy if exists "contazi jogadores: entrar" on public.contazi_sala_jogadores;
create policy "contazi jogadores: entrar" on public.contazi_sala_jogadores
  for insert to authenticated with check (
    user_id = auth.uid()
    and exists (select 1 from public.contazi_salas s where s.code = sala_code and s.status <> 'playing')
  );

drop policy if exists "contazi jogadores: editar a própria linha" on public.contazi_sala_jogadores;
create policy "contazi jogadores: editar a própria linha" on public.contazi_sala_jogadores
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "contazi jogadores: sair ou ser removido" on public.contazi_sala_jogadores;
create policy "contazi jogadores: sair ou ser removido" on public.contazi_sala_jogadores
  for delete to authenticated using (
    user_id = auth.uid()
    or exists (select 1 from public.contazi_salas s where s.code = sala_code and s.host_id = auth.uid())
  );

-- Histórico: o anfitrião registra; cada um vê as partidas em que jogou.
drop policy if exists "contazi partidas: ver as minhas" on public.contazi_partidas;
create policy "contazi partidas: ver as minhas" on public.contazi_partidas
  for select to authenticated using (
    players @> jsonb_build_array(jsonb_build_object('uid', auth.uid()::text))
  );

drop policy if exists "contazi partidas: anfitrião registra" on public.contazi_partidas;
create policy "contazi partidas: anfitrião registra" on public.contazi_partidas
  for insert to authenticated with check (
    exists (select 1 from public.contazi_salas s where s.code = sala_code and s.host_id = auth.uid())
  );

-- ═════════════════════════════ Memorizi (jogo do kit: gamezi-kit.js) ═════════════════════════════
-- Mesmo projeto e mesma conta (auth.users). Tabelas próprias:
--   memorizi_salas          salas online (código de 5 letras, anfitrião e estado da partida)
--   memorizi_sala_jogadores quem está em cada sala (até 10), com a skin (as do Topzi)
--   memorizi_partidas       histórico das partidas online (cada um vê só as suas)
--   (o Memorizi do dia fica em memorizi_diario, lá embaixo, com os outros rankings)

create table if not exists public.memorizi_salas (
  code text primary key check (code ~ '^[A-Z0-9]{5}$'),
  host_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'lobby' check (status in ('lobby', 'playing', 'finished')),
  settings jsonb not null default '{}'::jsonb,
  state jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.memorizi_sala_jogadores (
  sala_code text not null references public.memorizi_salas (code) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  nick text not null check (char_length(nick) between 1 and 16),
  skin jsonb check (skin is null or (jsonb_typeof(skin) = 'object' and octet_length(skin::text) <= 1500)),
  joined_at timestamptz not null default now(),
  primary key (sala_code, user_id)
);

create table if not exists public.memorizi_partidas (
  id bigint generated always as identity primary key,
  sala_code text not null,
  tipo text,
  rodadas integer,
  players jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists memorizi_partidas_players_idx on public.memorizi_partidas using gin (players jsonb_path_ops);
create index if not exists memorizi_salas_updated_idx on public.memorizi_salas (updated_at);

drop trigger if exists memorizi_salas_updated on public.memorizi_salas;
create trigger memorizi_salas_updated before update on public.memorizi_salas
  for each row execute function public.tocar_updated_at();

-- No máximo 10 jogadores por sala do Memorizi.
create or replace function public.memorizi_limitar_jogadores()
returns trigger language plpgsql as $$
begin
  if (select count(*) from public.memorizi_sala_jogadores where sala_code = new.sala_code) >= 10 then
    raise exception 'A sala está cheia';
  end if;
  return new;
end $$;

drop trigger if exists memorizi_sala_jogadores_limite on public.memorizi_sala_jogadores;
create trigger memorizi_sala_jogadores_limite before insert on public.memorizi_sala_jogadores
  for each row execute function public.memorizi_limitar_jogadores();

-- Salas paradas há mais de um dia somem (chamada por quem cria uma sala).
create or replace function public.memorizi_limpar_salas()
returns void language sql security definer set search_path = public as $$
  delete from public.memorizi_salas where updated_at < now() - interval '1 day';
$$;
grant execute on function public.memorizi_limpar_salas() to authenticated;

alter table public.memorizi_salas enable row level security;
alter table public.memorizi_sala_jogadores enable row level security;
alter table public.memorizi_partidas enable row level security;

-- Salas: quem tem o código consegue ver; só o anfitrião cria, muda e apaga.
drop policy if exists "memorizi salas: ler" on public.memorizi_salas;
create policy "memorizi salas: ler" on public.memorizi_salas
  for select to authenticated using (true);

drop policy if exists "memorizi salas: criar como anfitrião" on public.memorizi_salas;
create policy "memorizi salas: criar como anfitrião" on public.memorizi_salas
  for insert to authenticated with check (host_id = auth.uid());

drop policy if exists "memorizi salas: anfitrião edita" on public.memorizi_salas;
create policy "memorizi salas: anfitrião edita" on public.memorizi_salas
  for update to authenticated using (host_id = auth.uid()) with check (host_id = auth.uid());

drop policy if exists "memorizi salas: anfitrião apaga" on public.memorizi_salas;
create policy "memorizi salas: anfitrião apaga" on public.memorizi_salas
  for delete to authenticated using (host_id = auth.uid());

-- Jogadores: cada um entra e edita a própria linha; sai sozinho ou o anfitrião remove.
drop policy if exists "memorizi jogadores: ler" on public.memorizi_sala_jogadores;
create policy "memorizi jogadores: ler" on public.memorizi_sala_jogadores
  for select to authenticated using (true);

drop policy if exists "memorizi jogadores: entrar" on public.memorizi_sala_jogadores;
create policy "memorizi jogadores: entrar" on public.memorizi_sala_jogadores
  for insert to authenticated with check (
    user_id = auth.uid()
    and exists (select 1 from public.memorizi_salas s where s.code = sala_code and s.status <> 'playing')
  );

drop policy if exists "memorizi jogadores: editar a própria linha" on public.memorizi_sala_jogadores;
create policy "memorizi jogadores: editar a própria linha" on public.memorizi_sala_jogadores
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "memorizi jogadores: sair ou ser removido" on public.memorizi_sala_jogadores;
create policy "memorizi jogadores: sair ou ser removido" on public.memorizi_sala_jogadores
  for delete to authenticated using (
    user_id = auth.uid()
    or exists (select 1 from public.memorizi_salas s where s.code = sala_code and s.host_id = auth.uid())
  );

-- Histórico: o anfitrião registra; cada um vê as partidas em que jogou.
drop policy if exists "memorizi partidas: ver as minhas" on public.memorizi_partidas;
create policy "memorizi partidas: ver as minhas" on public.memorizi_partidas
  for select to authenticated using (
    players @> jsonb_build_array(jsonb_build_object('uid', auth.uid()::text))
  );

drop policy if exists "memorizi partidas: anfitrião registra" on public.memorizi_partidas;
create policy "memorizi partidas: anfitrião registra" on public.memorizi_partidas
  for insert to authenticated with check (
    exists (select 1 from public.memorizi_salas s where s.code = sala_code and s.host_id = auth.uid())
  );

-- Emojizi do dia (o dia 1 é 23/10/2026): 10 rodadas, de 0 a 100 pontos cada.
create table if not exists public.emojizi_diario (
  dia integer not null check (dia >= 1),
  user_id uuid not null references auth.users (id) on delete cascade,
  nick text not null default '' check (char_length(nick) <= 16),
  pontos smallint not null check (pontos between 0 and 1000),
  tempo_ms integer check (tempo_ms between 0 and 86400000),
  created_at timestamptz not null default now(),
  primary key (dia, user_id)
);
comment on table public.emojizi_diario is 'Emojizi: resultado de cada um no Emojizi do dia (ranking)';

-- Contazi do dia (o dia 1 é 23/10/2026): 10 rodadas, de 0 a 100 pontos cada.
create table if not exists public.contazi_diario (
  dia integer not null check (dia >= 1),
  user_id uuid not null references auth.users (id) on delete cascade,
  nick text not null default '' check (char_length(nick) <= 16),
  pontos smallint not null check (pontos between 0 and 1000),
  tempo_ms integer check (tempo_ms between 0 and 86400000),
  created_at timestamptz not null default now(),
  primary key (dia, user_id)
);
comment on table public.contazi_diario is 'Contazi: resultado de cada um no Contazi do dia (ranking)';

-- Memorizi do dia (o dia 1 é 23/10/2026): 10 rodadas, de 0 a 100 pontos cada.
create table if not exists public.memorizi_diario (
  dia integer not null check (dia >= 1),
  user_id uuid not null references auth.users (id) on delete cascade,
  nick text not null default '' check (char_length(nick) <= 16),
  pontos smallint not null check (pontos between 0 and 1000),
  tempo_ms integer check (tempo_ms between 0 and 86400000),
  created_at timestamptz not null default now(),
  primary key (dia, user_id)
);
comment on table public.memorizi_diario is 'Memorizi: resultado de cada um no Memorizi do dia (ranking)';

do $$
declare
  tabela text;
begin
  foreach tabela in array array['emojizi_diario', 'contazi_diario', 'memorizi_diario'] loop
    execute format('create index if not exists %I on public.%I (dia, pontos desc, tempo_ms)', tabela || '_tempo_idx', tabela);
    execute format('drop trigger if exists %I on public.%I', tabela || '_nick_limpo', tabela);
    execute format('create trigger %I before insert or update of nick on public.%I for each row execute function public.gamezi_limpar_nick()', tabela || '_nick_limpo', tabela);
    execute format('alter table public.%I enable row level security', tabela); -- sem regras: só as funções leem e gravam
  end loop;
  foreach tabela in array array['emojizi_sala_jogadores', 'contazi_sala_jogadores', 'memorizi_sala_jogadores'] loop
    execute format('drop trigger if exists %I on public.%I', tabela || '_nick_limpo', tabela);
    execute format('create trigger %I before insert or update of nick on public.%I for each row execute function public.gamezi_limpar_nick()', tabela || '_nick_limpo', tabela);
  end loop;
end $$;

-- Emojizi do dia (o dia 1 é 23/10/2026): p_acertos são os pontos (de 0 a 1000).
create or replace function public.emojizi_registrar_diario(p_dia integer, p_nick text, p_acertos integer, p_tempo integer default null)
returns void language plpgsql security definer set search_path = public as $$
declare
  hoje integer := ((now() at time zone 'utc')::date - date '2026-10-23') + 1;
begin
  if auth.uid() is null then raise exception 'Entre para registrar o resultado.'; end if;
  if p_dia is null or p_dia not between hoje - 1 and hoje + 1 then raise exception 'Esse dia já passou.'; end if;
  if p_acertos is null or p_acertos not between 0 and 1000 then raise exception 'Resultado inválido.'; end if;
  insert into public.emojizi_diario (dia, user_id, nick, pontos, tempo_ms)
  values (p_dia, auth.uid(), left(coalesce(p_nick, ''), 16), p_acertos, case when p_tempo between 0 and 86400000 then p_tempo end)
  on conflict (dia, user_id) do nothing;
end $$;

grant execute on function public.emojizi_registrar_diario(integer, text, integer, integer) to authenticated;

-- Contazi do dia (o dia 1 é 23/10/2026): p_acertos são os pontos (de 0 a 1000).
create or replace function public.contazi_registrar_diario(p_dia integer, p_nick text, p_acertos integer, p_tempo integer default null)
returns void language plpgsql security definer set search_path = public as $$
declare
  hoje integer := ((now() at time zone 'utc')::date - date '2026-10-23') + 1;
begin
  if auth.uid() is null then raise exception 'Entre para registrar o resultado.'; end if;
  if p_dia is null or p_dia not between hoje - 1 and hoje + 1 then raise exception 'Esse dia já passou.'; end if;
  if p_acertos is null or p_acertos not between 0 and 1000 then raise exception 'Resultado inválido.'; end if;
  insert into public.contazi_diario (dia, user_id, nick, pontos, tempo_ms)
  values (p_dia, auth.uid(), left(coalesce(p_nick, ''), 16), p_acertos, case when p_tempo between 0 and 86400000 then p_tempo end)
  on conflict (dia, user_id) do nothing;
end $$;

grant execute on function public.contazi_registrar_diario(integer, text, integer, integer) to authenticated;

-- Memorizi do dia (o dia 1 é 23/10/2026): p_acertos são os pontos (de 0 a 1000).
create or replace function public.memorizi_registrar_diario(p_dia integer, p_nick text, p_acertos integer, p_tempo integer default null)
returns void language plpgsql security definer set search_path = public as $$
declare
  hoje integer := ((now() at time zone 'utc')::date - date '2026-10-23') + 1;
begin
  if auth.uid() is null then raise exception 'Entre para registrar o resultado.'; end if;
  if p_dia is null or p_dia not between hoje - 1 and hoje + 1 then raise exception 'Esse dia já passou.'; end if;
  if p_acertos is null or p_acertos not between 0 and 1000 then raise exception 'Resultado inválido.'; end if;
  insert into public.memorizi_diario (dia, user_id, nick, pontos, tempo_ms)
  values (p_dia, auth.uid(), left(coalesce(p_nick, ''), 16), p_acertos, case when p_tempo between 0 and 86400000 then p_tempo end)
  on conflict (dia, user_id) do nothing;
end $$;

grant execute on function public.memorizi_registrar_diario(integer, text, integer, integer) to authenticated;

-- Ranking do dia de um jogo: os primeiros (p_limite) e, se a pessoa conectada ficou fora deles, a linha dela no fim.
-- posicao: empate em pontos e tempo divide o lugar. total: quantos jogaram no dia. eu: é a pessoa conectada.
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

-- Visões para o dono do site olhar os dois jogos juntos no painel (Table Editor), com a coluna "jogo".
-- Ficam fechadas para o site (sem acesso pela API); security_invoker faz valer as regras (RLS) de quem consulta.
drop view if exists public.gamezi_salas;
create view public.gamezi_salas with (security_invoker = true) as
  select 'topzi'::text as jogo, r.code as codigo, r.status, r.host_id as anfitriao,
         (select count(*) from public.topzi_sala_jogadores p where p.room_code = r.code) as jogadores,
         r.created_at as criada_em, r.updated_at as atualizada_em
    from public.topzi_salas r
  union all
  select 'patozi'::text, s.code, s.status, s.host_id,
         (select count(*) from public.patozi_sala_jogadores j where j.sala_code = s.code),
         s.created_at, s.updated_at
    from public.patozi_salas s
  union all
  select 'cravazi'::text, c.code, c.status, c.host_id,
         (select count(*) from public.cravazi_sala_jogadores j where j.sala_code = c.code),
         c.created_at, c.updated_at
    from public.cravazi_salas c
  union all
  select 'tamanhozi'::text, z.code, z.status, z.host_id,
         (select count(*) from public.tamanhozi_sala_jogadores j where j.sala_code = z.code),
         z.created_at, z.updated_at
    from public.tamanhozi_salas z
  union all
  select 'datazi'::text, d.code, d.status, d.host_id,
         (select count(*) from public.datazi_sala_jogadores j where j.sala_code = d.code),
         d.created_at, d.updated_at
    from public.datazi_salas d
  union all
  select 'maisoumenozi'::text, m.code, m.status, m.host_id,
         (select count(*) from public.maisoumenozi_sala_jogadores j where j.sala_code = m.code),
         m.created_at, m.updated_at
    from public.maisoumenozi_salas m
  union all
  select 'emojizi'::text, x.code, x.status, x.host_id,
         (select count(*) from public.emojizi_sala_jogadores j where j.sala_code = x.code),
         x.created_at, x.updated_at
    from public.emojizi_salas x
  union all
  select 'contazi'::text, x.code, x.status, x.host_id,
         (select count(*) from public.contazi_sala_jogadores j where j.sala_code = x.code),
         x.created_at, x.updated_at
    from public.contazi_salas x
  union all
  select 'memorizi'::text, x.code, x.status, x.host_id,
         (select count(*) from public.memorizi_sala_jogadores j where j.sala_code = x.code),
         x.created_at, x.updated_at
    from public.memorizi_salas x;

drop view if exists public.gamezi_jogadores_nas_salas;
create view public.gamezi_jogadores_nas_salas with (security_invoker = true) as
  select 'topzi'::text as jogo, p.room_code as sala, p.nick, p.user_id, p.joined_at as entrou_em
    from public.topzi_sala_jogadores p
  union all
  select 'patozi'::text, j.sala_code, j.nick, j.user_id, j.joined_at
    from public.patozi_sala_jogadores j
  union all
  select 'cravazi'::text, c.sala_code, c.nick, c.user_id, c.joined_at
    from public.cravazi_sala_jogadores c
  union all
  select 'tamanhozi'::text, z.sala_code, z.nick, z.user_id, z.joined_at
    from public.tamanhozi_sala_jogadores z
  union all
  select 'datazi'::text, d.sala_code, d.nick, d.user_id, d.joined_at
    from public.datazi_sala_jogadores d
  union all
  select 'maisoumenozi'::text, m.sala_code, m.nick, m.user_id, m.joined_at
    from public.maisoumenozi_sala_jogadores m
  union all
  select 'emojizi'::text, x.sala_code, x.nick, x.user_id, x.joined_at
    from public.emojizi_sala_jogadores x
  union all
  select 'contazi'::text, x.sala_code, x.nick, x.user_id, x.joined_at
    from public.contazi_sala_jogadores x
  union all
  select 'memorizi'::text, x.sala_code, x.nick, x.user_id, x.joined_at
    from public.memorizi_sala_jogadores x;

comment on view public.gamezi_salas is 'Gamezi: salas online dos jogos (coluna jogo = o id do jogo: topzi, patozi, cravazi, tamanhozi, datazi, maisoumenozi, emojizi, contazi ou memorizi)';
comment on view public.gamezi_jogadores_nas_salas is 'Gamezi: quem está em cada sala, de todos os jogos (coluna jogo)';

revoke all on public.gamezi_salas, public.gamezi_jogadores_nas_salas from anon, authenticated;

-- Quem sai da sala passa o comando para quem entrou primeiro; quem fica assume se o anfitrião sumiu.
do $$
declare
  jogo text;
  col text;
begin
  foreach jogo in array array['emojizi', 'contazi', 'memorizi'] loop
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
