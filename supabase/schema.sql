-- Gamezi (Topzi e Patozi): banco do modo online, dos perfis e do Pato do dia.
-- Como usar: Supabase → SQL Editor → New query → cole tudo → Run. Pode rodar de novo sem problema.
--
-- Tabelas:
--   profiles      perfil de cada jogador (nick, skin, estatísticas, recordes, lista do dia, listas criadas)
--   rooms         salas online (código de 5 letras, anfitrião, configurações e estado da partida)
--   room_players  quem está em cada sala
--   matches       histórico das partidas online (cada um vê só as suas)
--
-- A partida em si roda no celular de quem criou a sala, e os lances passam pelo Realtime
-- (broadcast e presence), que não precisa de tabela.

-- ───────────── tabelas ─────────────

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nick text not null default '' check (char_length(nick) <= 16),
  avatar jsonb,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.rooms (
  code text primary key check (code ~ '^[A-Z0-9]{5}$'),
  host_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'lobby' check (status in ('lobby', 'playing', 'finished')),
  settings jsonb not null default '{}'::jsonb,
  state jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.room_players (
  room_code text not null references public.rooms (code) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  nick text not null check (char_length(nick) between 1 and 16),
  avatar jsonb,
  team smallint not null default 0 check (team in (0, 1)),
  joined_at timestamptz not null default now(),
  primary key (room_code, user_id)
);

create table if not exists public.matches (
  id bigint generated always as identity primary key,
  room_code text not null,
  list_id text,
  list_title text,
  mode text,
  players jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists matches_players_idx on public.matches using gin (players jsonb_path_ops);
create index if not exists rooms_updated_idx on public.rooms (updated_at);

-- ───────────── regras automáticas ─────────────

create or replace function public.tocar_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists rooms_updated on public.rooms;
create trigger rooms_updated before update on public.rooms
  for each row execute function public.tocar_updated_at();

drop trigger if exists profiles_updated on public.profiles;
create trigger profiles_updated before update on public.profiles
  for each row execute function public.tocar_updated_at();

-- No máximo 8 jogadores por sala.
create or replace function public.limitar_jogadores()
returns trigger language plpgsql as $$
begin
  if (select count(*) from public.room_players where room_code = new.room_code) >= 8 then
    raise exception 'A sala está cheia (máximo de 8 jogadores).';
  end if;
  return new;
end $$;

drop trigger if exists room_players_limite on public.room_players;
create trigger room_players_limite before insert on public.room_players
  for each row execute function public.limitar_jogadores();

-- Apaga salas paradas há mais de um dia (o site chama ao criar uma sala).
create or replace function public.limpar_salas_antigas()
returns void language sql security definer set search_path = public as $$
  delete from public.rooms where updated_at < now() - interval '1 day';
$$;

grant execute on function public.limpar_salas_antigas() to authenticated;

-- ───────────── segurança (RLS) ─────────────
-- Todo mundo entra logado: quem não conectou conta usa um login anônimo automático.

alter table public.profiles enable row level security;
alter table public.rooms enable row level security;
alter table public.room_players enable row level security;
alter table public.matches enable row level security;

drop policy if exists "perfil: ler o próprio" on public.profiles;
create policy "perfil: ler o próprio" on public.profiles
  for select to authenticated using (id = auth.uid());

drop policy if exists "perfil: criar o próprio" on public.profiles;
create policy "perfil: criar o próprio" on public.profiles
  for insert to authenticated with check (id = auth.uid());

drop policy if exists "perfil: editar o próprio" on public.profiles;
create policy "perfil: editar o próprio" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- Salas: quem tem o código consegue ver; só o anfitrião cria, muda e apaga.
drop policy if exists "salas: ler" on public.rooms;
create policy "salas: ler" on public.rooms
  for select to authenticated using (true);

drop policy if exists "salas: criar como anfitrião" on public.rooms;
create policy "salas: criar como anfitrião" on public.rooms
  for insert to authenticated with check (host_id = auth.uid());

drop policy if exists "salas: anfitrião edita" on public.rooms;
create policy "salas: anfitrião edita" on public.rooms
  for update to authenticated using (host_id = auth.uid()) with check (host_id = auth.uid());

drop policy if exists "salas: anfitrião apaga" on public.rooms;
create policy "salas: anfitrião apaga" on public.rooms
  for delete to authenticated using (host_id = auth.uid());

-- Jogadores: cada um entra e edita a própria linha; sai sozinho ou o anfitrião remove.
drop policy if exists "jogadores: ler" on public.room_players;
create policy "jogadores: ler" on public.room_players
  for select to authenticated using (true);

drop policy if exists "jogadores: entrar" on public.room_players;
create policy "jogadores: entrar" on public.room_players
  for insert to authenticated with check (
    user_id = auth.uid()
    and exists (select 1 from public.rooms r where r.code = room_code and r.status <> 'playing')
  );

drop policy if exists "jogadores: editar a própria linha" on public.room_players;
create policy "jogadores: editar a própria linha" on public.room_players
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "jogadores: sair ou ser removido" on public.room_players;
create policy "jogadores: sair ou ser removido" on public.room_players
  for delete to authenticated using (
    user_id = auth.uid()
    or exists (select 1 from public.rooms r where r.code = room_code and r.host_id = auth.uid())
  );

-- Histórico: o anfitrião registra; cada um vê as partidas em que jogou.
drop policy if exists "partidas: ver as minhas" on public.matches;
create policy "partidas: ver as minhas" on public.matches
  for select to authenticated using (
    players @> jsonb_build_array(jsonb_build_object('uid', auth.uid()::text))
  );

drop policy if exists "partidas: anfitrião registra" on public.matches;
create policy "partidas: anfitrião registra" on public.matches
  for insert to authenticated with check (
    exists (select 1 from public.rooms r where r.code = room_code and r.host_id = auth.uid())
  );

-- ═════════════════════════════ Patozi ═════════════════════════════
-- O segundo jogo do Gamezi usa o mesmo projeto e a mesma conta (auth.users). Tabelas próprias:
--   patozi_perfis          estatísticas do Patozi de quem tem conta (nick, cor, partidas, Pato do dia)
--   patozi_diario          resultado de cada um no Pato do dia (o ranking do dia sai daqui)
--   patozi_sugestoes       cartas que os jogadores mandam pelo perfil
--   patozi_salas           salas online (código de 5 letras, anfitrião, opções e estado da partida)
--   patozi_sala_jogadores  quem está em cada sala (até 10)
--   patozi_partidas        histórico das partidas online (cada um vê só as suas)

create table if not exists public.patozi_perfis (
  id uuid primary key references auth.users (id) on delete cascade,
  nick text not null default '' check (char_length(nick) <= 16),
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.patozi_diario (
  dia integer not null check (dia >= 1),
  user_id uuid not null references auth.users (id) on delete cascade,
  nick text not null default '' check (char_length(nick) <= 16),
  pontos smallint not null check (pontos between 0 and 500),
  chutes jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  primary key (dia, user_id)
);

create index if not exists patozi_diario_ranking_idx on public.patozi_diario (dia, pontos desc);

create table if not exists public.patozi_sugestoes (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users (id) on delete set null,
  nick text not null default '' check (char_length(nick) <= 16),
  pergunta text not null check (char_length(pergunta) between 8 and 200),
  resposta bigint not null check (resposta >= 0),
  fonte text not null default '' check (char_length(fonte) <= 200),
  idioma text not null default 'pt' check (idioma in ('pt', 'en', 'es')),
  created_at timestamptz not null default now()
);

create table if not exists public.patozi_salas (
  code text primary key check (code ~ '^[A-Z0-9]{5}$'),
  host_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'lobby' check (status in ('lobby', 'playing', 'finished')),
  settings jsonb not null default '{}'::jsonb,
  state jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.patozi_sala_jogadores (
  sala_code text not null references public.patozi_salas (code) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  nick text not null check (char_length(nick) between 1 and 16),
  cor smallint not null default 0 check (cor between 0 and 9),
  joined_at timestamptz not null default now(),
  primary key (sala_code, user_id)
);

create table if not exists public.patozi_partidas (
  id bigint generated always as identity primary key,
  sala_code text not null,
  rodadas integer,
  players jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists patozi_partidas_players_idx on public.patozi_partidas using gin (players jsonb_path_ops);
create index if not exists patozi_salas_updated_idx on public.patozi_salas (updated_at);

drop trigger if exists patozi_salas_updated on public.patozi_salas;
create trigger patozi_salas_updated before update on public.patozi_salas
  for each row execute function public.tocar_updated_at();

drop trigger if exists patozi_perfis_updated on public.patozi_perfis;
create trigger patozi_perfis_updated before update on public.patozi_perfis
  for each row execute function public.tocar_updated_at();

-- No máximo 10 jogadores por sala do Patozi.
create or replace function public.patozi_limitar_jogadores()
returns trigger language plpgsql as $$
begin
  if (select count(*) from public.patozi_sala_jogadores where sala_code = new.sala_code) >= 10 then
    raise exception 'A sala está cheia (máximo de 10 jogadores).';
  end if;
  return new;
end $$;

drop trigger if exists patozi_sala_jogadores_limite on public.patozi_sala_jogadores;
create trigger patozi_sala_jogadores_limite before insert on public.patozi_sala_jogadores
  for each row execute function public.patozi_limitar_jogadores();

-- Apaga salas do Patozi paradas há mais de um dia (o site chama ao criar uma sala).
create or replace function public.patozi_limpar_salas()
returns void language sql security definer set search_path = public as $$
  delete from public.patozi_salas where updated_at < now() - interval '1 day';
$$;

grant execute on function public.patozi_limpar_salas() to authenticated;

alter table public.patozi_perfis enable row level security;
alter table public.patozi_diario enable row level security;
alter table public.patozi_sugestoes enable row level security;
alter table public.patozi_salas enable row level security;
alter table public.patozi_sala_jogadores enable row level security;
alter table public.patozi_partidas enable row level security;

drop policy if exists "patozi perfil: ler o próprio" on public.patozi_perfis;
create policy "patozi perfil: ler o próprio" on public.patozi_perfis
  for select to authenticated using (id = auth.uid());

drop policy if exists "patozi perfil: criar o próprio" on public.patozi_perfis;
create policy "patozi perfil: criar o próprio" on public.patozi_perfis
  for insert to authenticated with check (id = auth.uid());

drop policy if exists "patozi perfil: editar o próprio" on public.patozi_perfis;
create policy "patozi perfil: editar o próprio" on public.patozi_perfis
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- Pato do dia: todo mundo vê o ranking; cada um registra o próprio resultado uma vez por dia (sem editar).
drop policy if exists "patozi diário: ler" on public.patozi_diario;
create policy "patozi diário: ler" on public.patozi_diario
  for select to authenticated using (true);

drop policy if exists "patozi diário: registrar o próprio" on public.patozi_diario;
create policy "patozi diário: registrar o próprio" on public.patozi_diario
  for insert to authenticated with check (user_id = auth.uid());

-- Cartas enviadas: cada um manda e vê as próprias (o dono do site lê todas pelo painel do Supabase).
drop policy if exists "patozi sugestões: enviar" on public.patozi_sugestoes;
create policy "patozi sugestões: enviar" on public.patozi_sugestoes
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "patozi sugestões: ver as minhas" on public.patozi_sugestoes;
create policy "patozi sugestões: ver as minhas" on public.patozi_sugestoes
  for select to authenticated using (user_id = auth.uid());

-- Salas: quem tem o código consegue ver; só o anfitrião cria, muda e apaga.
drop policy if exists "patozi salas: ler" on public.patozi_salas;
create policy "patozi salas: ler" on public.patozi_salas
  for select to authenticated using (true);

drop policy if exists "patozi salas: criar como anfitrião" on public.patozi_salas;
create policy "patozi salas: criar como anfitrião" on public.patozi_salas
  for insert to authenticated with check (host_id = auth.uid());

drop policy if exists "patozi salas: anfitrião edita" on public.patozi_salas;
create policy "patozi salas: anfitrião edita" on public.patozi_salas
  for update to authenticated using (host_id = auth.uid()) with check (host_id = auth.uid());

drop policy if exists "patozi salas: anfitrião apaga" on public.patozi_salas;
create policy "patozi salas: anfitrião apaga" on public.patozi_salas
  for delete to authenticated using (host_id = auth.uid());

-- Jogadores: cada um entra e edita a própria linha; sai sozinho ou o anfitrião remove.
drop policy if exists "patozi jogadores: ler" on public.patozi_sala_jogadores;
create policy "patozi jogadores: ler" on public.patozi_sala_jogadores
  for select to authenticated using (true);

drop policy if exists "patozi jogadores: entrar" on public.patozi_sala_jogadores;
create policy "patozi jogadores: entrar" on public.patozi_sala_jogadores
  for insert to authenticated with check (
    user_id = auth.uid()
    and exists (select 1 from public.patozi_salas s where s.code = sala_code and s.status <> 'playing')
  );

drop policy if exists "patozi jogadores: editar a própria linha" on public.patozi_sala_jogadores;
create policy "patozi jogadores: editar a própria linha" on public.patozi_sala_jogadores
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "patozi jogadores: sair ou ser removido" on public.patozi_sala_jogadores;
create policy "patozi jogadores: sair ou ser removido" on public.patozi_sala_jogadores
  for delete to authenticated using (
    user_id = auth.uid()
    or exists (select 1 from public.patozi_salas s where s.code = sala_code and s.host_id = auth.uid())
  );

-- Histórico: o anfitrião registra; cada um vê as partidas em que jogou.
drop policy if exists "patozi partidas: ver as minhas" on public.patozi_partidas;
create policy "patozi partidas: ver as minhas" on public.patozi_partidas
  for select to authenticated using (
    players @> jsonb_build_array(jsonb_build_object('uid', auth.uid()::text))
  );

drop policy if exists "patozi partidas: anfitrião registra" on public.patozi_partidas;
create policy "patozi partidas: anfitrião registra" on public.patozi_partidas
  for insert to authenticated with check (
    exists (select 1 from public.patozi_salas s where s.code = sala_code and s.host_id = auth.uid())
  );
