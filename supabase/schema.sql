-- Top Ten: banco do modo online e dos perfis.
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
