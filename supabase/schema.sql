-- Gamezi (Topzi, Patozi, Datazi, Maisoumenozi e Cravazi): banco do modo online, dos perfis e dos rankings do dia.
-- Como usar: Supabase → SQL Editor → New query → cole tudo → Run. Pode rodar de novo sem problema.
--
-- A conta é do Gamezi: uma só (auth.users) para a plataforma e todos os jogos, com login em conta.html.
-- Cada jogo tem as próprias tabelas, sempre com o nome do jogo na frente (topzi_…, patozi_…, cravazi_…).
--
-- Tabelas do Topzi:
--   topzi_perfis          perfil de cada jogador (nick, skin, estatísticas, recordes, lista do dia, listas criadas)
--   topzi_salas           salas online (código de 5 letras, anfitrião, configurações e estado da partida)
--   topzi_sala_jogadores  quem está em cada sala
--   topzi_partidas        histórico das partidas online (cada um vê só as suas)
--
-- A partida em si roda no celular de quem criou a sala, e os lances passam pelo Realtime
-- (broadcast e presence), que não precisa de tabela.

-- ───────────── nomes novos do Topzi ─────────────
-- Até outubro de 2026 as tabelas do Topzi não tinham prefixo (profiles, rooms, room_players, matches).
-- Se o banco ainda está com os nomes antigos, aqui eles são trocados sem perder nenhum dado.

do $$
declare
  par text[];
begin
  foreach par slice 1 in array array[
    ['profiles', 'topzi_perfis'], ['rooms', 'topzi_salas'], ['room_players', 'topzi_sala_jogadores'], ['matches', 'topzi_partidas']
  ] loop
    if exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
               where n.nspname = 'public' and c.relname = par[1] and c.relkind = 'r')
       and to_regclass('public.' || par[2]) is null then
      execute format('alter table public.%I rename to %I', par[1], par[2]);
    end if;
  end loop;
end $$;

alter index if exists public.rooms_updated_idx rename to topzi_salas_updated_idx;
alter index if exists public.matches_players_idx rename to topzi_partidas_players_idx;

-- ───────────── tabelas do Topzi ─────────────

create table if not exists public.topzi_perfis (
  id uuid primary key references auth.users (id) on delete cascade,
  nick text not null default '' check (char_length(nick) <= 16),
  avatar jsonb,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.topzi_salas (
  code text primary key check (code ~ '^[A-Z0-9]{5}$'),
  host_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'lobby' check (status in ('lobby', 'playing', 'finished')),
  settings jsonb not null default '{}'::jsonb,
  state jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.topzi_sala_jogadores (
  room_code text not null references public.topzi_salas (code) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  nick text not null check (char_length(nick) between 1 and 16),
  avatar jsonb,
  team smallint not null default 0 check (team in (0, 1)),
  joined_at timestamptz not null default now(),
  primary key (room_code, user_id)
);

create table if not exists public.topzi_partidas (
  id bigint generated always as identity primary key,
  room_code text not null,
  list_id text,
  list_title text,
  mode text,
  players jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists topzi_partidas_players_idx on public.topzi_partidas using gin (players jsonb_path_ops);
create index if not exists topzi_salas_updated_idx on public.topzi_salas (updated_at);

-- ───────────── regras automáticas ─────────────

create or replace function public.tocar_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists rooms_updated on public.topzi_salas;
drop trigger if exists topzi_salas_updated on public.topzi_salas;
create trigger topzi_salas_updated before update on public.topzi_salas
  for each row execute function public.tocar_updated_at();

drop trigger if exists profiles_updated on public.topzi_perfis;
drop trigger if exists topzi_perfis_updated on public.topzi_perfis;
create trigger topzi_perfis_updated before update on public.topzi_perfis
  for each row execute function public.tocar_updated_at();

-- No máximo 8 jogadores por sala.
create or replace function public.topzi_limitar_jogadores()
returns trigger language plpgsql as $$
begin
  if (select count(*) from public.topzi_sala_jogadores where room_code = new.room_code) >= 8 then
    raise exception 'A sala está cheia (máximo de 8 jogadores).';
  end if;
  return new;
end $$;

drop trigger if exists room_players_limite on public.topzi_sala_jogadores;
drop trigger if exists topzi_sala_jogadores_limite on public.topzi_sala_jogadores;
create trigger topzi_sala_jogadores_limite before insert on public.topzi_sala_jogadores
  for each row execute function public.topzi_limitar_jogadores();
drop function if exists public.limitar_jogadores();

-- Apaga salas paradas há mais de um dia (o site chama ao criar uma sala).
create or replace function public.topzi_limpar_salas()
returns void language sql security definer set search_path = public as $$
  delete from public.topzi_salas where updated_at < now() - interval '1 day';
$$;

grant execute on function public.topzi_limpar_salas() to authenticated;

-- ───────────── segurança (RLS) ─────────────
-- Todo mundo entra logado: quem não conectou conta usa um login anônimo automático.

alter table public.topzi_perfis enable row level security;
alter table public.topzi_salas enable row level security;
alter table public.topzi_sala_jogadores enable row level security;
alter table public.topzi_partidas enable row level security;

-- Regras com os nomes antigos (de antes do prefixo topzi): saem para dar lugar às de baixo.
drop policy if exists "perfil: ler o próprio" on public.topzi_perfis;
drop policy if exists "perfil: criar o próprio" on public.topzi_perfis;
drop policy if exists "perfil: editar o próprio" on public.topzi_perfis;
drop policy if exists "salas: ler" on public.topzi_salas;
drop policy if exists "salas: criar como anfitrião" on public.topzi_salas;
drop policy if exists "salas: anfitrião edita" on public.topzi_salas;
drop policy if exists "salas: anfitrião apaga" on public.topzi_salas;
drop policy if exists "jogadores: ler" on public.topzi_sala_jogadores;
drop policy if exists "jogadores: entrar" on public.topzi_sala_jogadores;
drop policy if exists "jogadores: editar a própria linha" on public.topzi_sala_jogadores;
drop policy if exists "jogadores: sair ou ser removido" on public.topzi_sala_jogadores;
drop policy if exists "partidas: ver as minhas" on public.topzi_partidas;
drop policy if exists "partidas: anfitrião registra" on public.topzi_partidas;

drop policy if exists "topzi perfil: ler o próprio" on public.topzi_perfis;
create policy "topzi perfil: ler o próprio" on public.topzi_perfis
  for select to authenticated using (id = auth.uid());

drop policy if exists "topzi perfil: criar o próprio" on public.topzi_perfis;
create policy "topzi perfil: criar o próprio" on public.topzi_perfis
  for insert to authenticated with check (id = auth.uid());

drop policy if exists "topzi perfil: editar o próprio" on public.topzi_perfis;
create policy "topzi perfil: editar o próprio" on public.topzi_perfis
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- Salas: quem tem o código consegue ver; só o anfitrião cria, muda e apaga.
drop policy if exists "topzi salas: ler" on public.topzi_salas;
create policy "topzi salas: ler" on public.topzi_salas
  for select to authenticated using (true);

drop policy if exists "topzi salas: criar como anfitrião" on public.topzi_salas;
create policy "topzi salas: criar como anfitrião" on public.topzi_salas
  for insert to authenticated with check (host_id = auth.uid());

drop policy if exists "topzi salas: anfitrião edita" on public.topzi_salas;
create policy "topzi salas: anfitrião edita" on public.topzi_salas
  for update to authenticated using (host_id = auth.uid()) with check (host_id = auth.uid());

drop policy if exists "topzi salas: anfitrião apaga" on public.topzi_salas;
create policy "topzi salas: anfitrião apaga" on public.topzi_salas
  for delete to authenticated using (host_id = auth.uid());

-- Jogadores: cada um entra e edita a própria linha; sai sozinho ou o anfitrião remove.
drop policy if exists "topzi jogadores: ler" on public.topzi_sala_jogadores;
create policy "topzi jogadores: ler" on public.topzi_sala_jogadores
  for select to authenticated using (true);

drop policy if exists "topzi jogadores: entrar" on public.topzi_sala_jogadores;
create policy "topzi jogadores: entrar" on public.topzi_sala_jogadores
  for insert to authenticated with check (
    user_id = auth.uid()
    and exists (select 1 from public.topzi_salas r where r.code = room_code and r.status <> 'playing')
  );

drop policy if exists "topzi jogadores: editar a própria linha" on public.topzi_sala_jogadores;
create policy "topzi jogadores: editar a própria linha" on public.topzi_sala_jogadores
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "topzi jogadores: sair ou ser removido" on public.topzi_sala_jogadores;
create policy "topzi jogadores: sair ou ser removido" on public.topzi_sala_jogadores
  for delete to authenticated using (
    user_id = auth.uid()
    or exists (select 1 from public.topzi_salas r where r.code = room_code and r.host_id = auth.uid())
  );

-- Histórico: o anfitrião registra; cada um vê as partidas em que jogou.
drop policy if exists "topzi partidas: ver as minhas" on public.topzi_partidas;
create policy "topzi partidas: ver as minhas" on public.topzi_partidas
  for select to authenticated using (
    players @> jsonb_build_array(jsonb_build_object('uid', auth.uid()::text))
  );

drop policy if exists "topzi partidas: anfitrião registra" on public.topzi_partidas;
create policy "topzi partidas: anfitrião registra" on public.topzi_partidas
  for insert to authenticated with check (
    exists (select 1 from public.topzi_salas r where r.code = room_code and r.host_id = auth.uid())
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

-- Tema da carta enviada (um dos temas do jogo, "outro" ou vazio). Entrou depois: add column if not exists.
alter table public.patozi_sugestoes add column if not exists tema text not null default '' check (char_length(tema) <= 20);

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

-- Visual do pato (chapéu, rosto, roupa, item na asa) de quem está na sala. Entrou depois: add column if not exists.
alter table public.patozi_sala_jogadores add column if not exists pato jsonb
  check (pato is null or (jsonb_typeof(pato) = 'object' and octet_length(pato::text) <= 300));

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

-- ═════════════════════════════ Cravazi ═════════════════════════════
-- Mesmo projeto e mesma conta (auth.users). Tabelas próprias:
--   cravazi_salas          salas online (código de 5 letras, anfitrião, rodadas e estado da partida)
--   cravazi_sala_jogadores quem está em cada sala (até 8), com a skin (as mesmas do Topzi)
--   cravazi_partidas       histórico das partidas online (cada um vê só as suas)
--   cravazi_diario         resultado de cada um no Cravazi do dia (lá embaixo, com os outros rankings)

create table if not exists public.cravazi_salas (
  code text primary key check (code ~ '^[A-Z0-9]{5}$'),
  host_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'lobby' check (status in ('lobby', 'playing', 'finished')),
  settings jsonb not null default '{}'::jsonb,
  state jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cravazi_sala_jogadores (
  sala_code text not null references public.cravazi_salas (code) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  nick text not null check (char_length(nick) between 1 and 16),
  skin jsonb check (skin is null or (jsonb_typeof(skin) = 'object' and octet_length(skin::text) <= 1500)),
  joined_at timestamptz not null default now(),
  primary key (sala_code, user_id)
);

create table if not exists public.cravazi_partidas (
  id bigint generated always as identity primary key,
  sala_code text not null,
  rodadas integer,
  players jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists cravazi_partidas_players_idx on public.cravazi_partidas using gin (players jsonb_path_ops);
create index if not exists cravazi_salas_updated_idx on public.cravazi_salas (updated_at);

drop trigger if exists cravazi_salas_updated on public.cravazi_salas;
create trigger cravazi_salas_updated before update on public.cravazi_salas
  for each row execute function public.tocar_updated_at();

-- No máximo 8 jogadores por sala do Cravazi.
create or replace function public.cravazi_limitar_jogadores()
returns trigger language plpgsql as $$
begin
  if (select count(*) from public.cravazi_sala_jogadores where sala_code = new.sala_code) >= 8 then
    raise exception 'A sala está cheia';
  end if;
  return new;
end $$;

drop trigger if exists cravazi_sala_jogadores_limite on public.cravazi_sala_jogadores;
create trigger cravazi_sala_jogadores_limite before insert on public.cravazi_sala_jogadores
  for each row execute function public.cravazi_limitar_jogadores();

-- Salas paradas há mais de um dia somem (chamada por quem cria uma sala).
create or replace function public.cravazi_limpar_salas()
returns void language sql security definer set search_path = public as $$
  delete from public.cravazi_salas where updated_at < now() - interval '1 day';
$$;
grant execute on function public.cravazi_limpar_salas() to authenticated;

alter table public.cravazi_salas enable row level security;
alter table public.cravazi_sala_jogadores enable row level security;
alter table public.cravazi_partidas enable row level security;

-- Salas: quem tem o código consegue ver; só o anfitrião cria, muda e apaga.
drop policy if exists "cravazi salas: ler" on public.cravazi_salas;
create policy "cravazi salas: ler" on public.cravazi_salas
  for select to authenticated using (true);

drop policy if exists "cravazi salas: criar como anfitrião" on public.cravazi_salas;
create policy "cravazi salas: criar como anfitrião" on public.cravazi_salas
  for insert to authenticated with check (host_id = auth.uid());

drop policy if exists "cravazi salas: anfitrião edita" on public.cravazi_salas;
create policy "cravazi salas: anfitrião edita" on public.cravazi_salas
  for update to authenticated using (host_id = auth.uid()) with check (host_id = auth.uid());

drop policy if exists "cravazi salas: anfitrião apaga" on public.cravazi_salas;
create policy "cravazi salas: anfitrião apaga" on public.cravazi_salas
  for delete to authenticated using (host_id = auth.uid());

-- Jogadores: cada um entra e edita a própria linha; sai sozinho ou o anfitrião remove.
drop policy if exists "cravazi jogadores: ler" on public.cravazi_sala_jogadores;
create policy "cravazi jogadores: ler" on public.cravazi_sala_jogadores
  for select to authenticated using (true);

drop policy if exists "cravazi jogadores: entrar" on public.cravazi_sala_jogadores;
create policy "cravazi jogadores: entrar" on public.cravazi_sala_jogadores
  for insert to authenticated with check (
    user_id = auth.uid()
    and exists (select 1 from public.cravazi_salas s where s.code = sala_code and s.status <> 'playing')
  );

drop policy if exists "cravazi jogadores: editar a própria linha" on public.cravazi_sala_jogadores;
create policy "cravazi jogadores: editar a própria linha" on public.cravazi_sala_jogadores
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "cravazi jogadores: sair ou ser removido" on public.cravazi_sala_jogadores;
create policy "cravazi jogadores: sair ou ser removido" on public.cravazi_sala_jogadores
  for delete to authenticated using (
    user_id = auth.uid()
    or exists (select 1 from public.cravazi_salas s where s.code = sala_code and s.host_id = auth.uid())
  );

-- Histórico: o anfitrião registra; cada um vê as partidas em que jogou.
drop policy if exists "cravazi partidas: ver as minhas" on public.cravazi_partidas;
create policy "cravazi partidas: ver as minhas" on public.cravazi_partidas
  for select to authenticated using (
    players @> jsonb_build_array(jsonb_build_object('uid', auth.uid()::text))
  );

drop policy if exists "cravazi partidas: anfitrião registra" on public.cravazi_partidas;
create policy "cravazi partidas: anfitrião registra" on public.cravazi_partidas
  for insert to authenticated with check (
    exists (select 1 from public.cravazi_salas s where s.code = sala_code and s.host_id = auth.uid())
  );

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
  skin jsonb check (skin is null or (jsonb_typeof(skin) = 'object' and octet_length(skin::text) <= 1500)),
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

-- ═════════════════════════════ Datazi online ═════════════════════════════
-- Mesmo projeto e mesma conta (auth.users). Tabelas próprias:
--   datazi_salas          salas online (código de 5 letras, anfitrião, modo de jogo e estado da partida)
--   datazi_sala_jogadores quem está em cada sala (até 10)
--   datazi_partidas       histórico das partidas online, com o modo (cada um vê só as suas)
--   datazi_diario         resultado de cada um no Datazi do dia (lá embaixo, com os outros rankings)

create table if not exists public.datazi_salas (
  code text primary key check (code ~ '^[A-Z0-9]{5}$'),
  host_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'lobby' check (status in ('lobby', 'playing', 'finished')),
  settings jsonb not null default '{}'::jsonb,
  state jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.datazi_sala_jogadores (
  sala_code text not null references public.datazi_salas (code) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  nick text not null check (char_length(nick) between 1 and 16),
  skin jsonb check (skin is null or (jsonb_typeof(skin) = 'object' and octet_length(skin::text) <= 1500)),
  joined_at timestamptz not null default now(),
  primary key (sala_code, user_id)
);

create table if not exists public.datazi_partidas (
  id bigint generated always as identity primary key,
  sala_code text not null,
  tipo text,
  rodadas integer,
  players jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists datazi_partidas_players_idx on public.datazi_partidas using gin (players jsonb_path_ops);
create index if not exists datazi_salas_updated_idx on public.datazi_salas (updated_at);

drop trigger if exists datazi_salas_updated on public.datazi_salas;
create trigger datazi_salas_updated before update on public.datazi_salas
  for each row execute function public.tocar_updated_at();

-- No máximo 10 jogadores por sala do Datazi.
create or replace function public.datazi_limitar_jogadores()
returns trigger language plpgsql as $$
begin
  if (select count(*) from public.datazi_sala_jogadores where sala_code = new.sala_code) >= 10 then
    raise exception 'A sala está cheia';
  end if;
  return new;
end $$;

drop trigger if exists datazi_sala_jogadores_limite on public.datazi_sala_jogadores;
create trigger datazi_sala_jogadores_limite before insert on public.datazi_sala_jogadores
  for each row execute function public.datazi_limitar_jogadores();

-- Salas paradas há mais de um dia somem (chamada por quem cria uma sala).
create or replace function public.datazi_limpar_salas()
returns void language sql security definer set search_path = public as $$
  delete from public.datazi_salas where updated_at < now() - interval '1 day';
$$;
grant execute on function public.datazi_limpar_salas() to authenticated;

alter table public.datazi_salas enable row level security;
alter table public.datazi_sala_jogadores enable row level security;
alter table public.datazi_partidas enable row level security;

-- Salas: quem tem o código consegue ver; só o anfitrião cria, muda e apaga.
drop policy if exists "datazi salas: ler" on public.datazi_salas;
create policy "datazi salas: ler" on public.datazi_salas
  for select to authenticated using (true);

drop policy if exists "datazi salas: criar como anfitrião" on public.datazi_salas;
create policy "datazi salas: criar como anfitrião" on public.datazi_salas
  for insert to authenticated with check (host_id = auth.uid());

drop policy if exists "datazi salas: anfitrião edita" on public.datazi_salas;
create policy "datazi salas: anfitrião edita" on public.datazi_salas
  for update to authenticated using (host_id = auth.uid()) with check (host_id = auth.uid());

drop policy if exists "datazi salas: anfitrião apaga" on public.datazi_salas;
create policy "datazi salas: anfitrião apaga" on public.datazi_salas
  for delete to authenticated using (host_id = auth.uid());

-- Jogadores: cada um entra e edita a própria linha; sai sozinho ou o anfitrião remove.
drop policy if exists "datazi jogadores: ler" on public.datazi_sala_jogadores;
create policy "datazi jogadores: ler" on public.datazi_sala_jogadores
  for select to authenticated using (true);

drop policy if exists "datazi jogadores: entrar" on public.datazi_sala_jogadores;
create policy "datazi jogadores: entrar" on public.datazi_sala_jogadores
  for insert to authenticated with check (
    user_id = auth.uid()
    and exists (select 1 from public.datazi_salas s where s.code = sala_code and s.status <> 'playing')
  );

drop policy if exists "datazi jogadores: editar a própria linha" on public.datazi_sala_jogadores;
create policy "datazi jogadores: editar a própria linha" on public.datazi_sala_jogadores
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "datazi jogadores: sair ou ser removido" on public.datazi_sala_jogadores;
create policy "datazi jogadores: sair ou ser removido" on public.datazi_sala_jogadores
  for delete to authenticated using (
    user_id = auth.uid()
    or exists (select 1 from public.datazi_salas s where s.code = sala_code and s.host_id = auth.uid())
  );

-- Histórico: o anfitrião registra; cada um vê as partidas em que jogou.
drop policy if exists "datazi partidas: ver as minhas" on public.datazi_partidas;
create policy "datazi partidas: ver as minhas" on public.datazi_partidas
  for select to authenticated using (
    players @> jsonb_build_array(jsonb_build_object('uid', auth.uid()::text))
  );

drop policy if exists "datazi partidas: anfitrião registra" on public.datazi_partidas;
create policy "datazi partidas: anfitrião registra" on public.datazi_partidas
  for insert to authenticated with check (
    exists (select 1 from public.datazi_salas s where s.code = sala_code and s.host_id = auth.uid())
  );

-- ═════════════════════════════ Maiorzi online ═════════════════════════════
-- Mesmo projeto e mesma conta (auth.users). Tabelas próprias:
--   maisoumenozi_salas          salas online (código de 5 letras, anfitrião e estado da partida)
--   maisoumenozi_sala_jogadores quem está em cada sala (até 10), com a skin (as do Topzi)
--   maisoumenozi_partidas       histórico das partidas online (cada um vê só as suas)
--   (o Maiorzi do dia fica em maisoumenozi_diario, lá embaixo, com os outros rankings)

create table if not exists public.maisoumenozi_salas (
  code text primary key check (code ~ '^[A-Z0-9]{5}$'),
  host_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'lobby' check (status in ('lobby', 'playing', 'finished')),
  settings jsonb not null default '{}'::jsonb,
  state jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.maisoumenozi_sala_jogadores (
  sala_code text not null references public.maisoumenozi_salas (code) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  nick text not null check (char_length(nick) between 1 and 16),
  skin jsonb check (skin is null or (jsonb_typeof(skin) = 'object' and octet_length(skin::text) <= 1500)),
  joined_at timestamptz not null default now(),
  primary key (sala_code, user_id)
);

create table if not exists public.maisoumenozi_partidas (
  id bigint generated always as identity primary key,
  sala_code text not null,
  tipo text,
  rodadas integer,
  players jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists maisoumenozi_partidas_players_idx on public.maisoumenozi_partidas using gin (players jsonb_path_ops);
create index if not exists maisoumenozi_salas_updated_idx on public.maisoumenozi_salas (updated_at);

drop trigger if exists maisoumenozi_salas_updated on public.maisoumenozi_salas;
create trigger maisoumenozi_salas_updated before update on public.maisoumenozi_salas
  for each row execute function public.tocar_updated_at();

-- No máximo 10 jogadores por sala do Maiorzi.
create or replace function public.maisoumenozi_limitar_jogadores()
returns trigger language plpgsql as $$
begin
  if (select count(*) from public.maisoumenozi_sala_jogadores where sala_code = new.sala_code) >= 10 then
    raise exception 'A sala está cheia';
  end if;
  return new;
end $$;

drop trigger if exists maisoumenozi_sala_jogadores_limite on public.maisoumenozi_sala_jogadores;
create trigger maisoumenozi_sala_jogadores_limite before insert on public.maisoumenozi_sala_jogadores
  for each row execute function public.maisoumenozi_limitar_jogadores();

-- Salas paradas há mais de um dia somem (chamada por quem cria uma sala).
create or replace function public.maisoumenozi_limpar_salas()
returns void language sql security definer set search_path = public as $$
  delete from public.maisoumenozi_salas where updated_at < now() - interval '1 day';
$$;
grant execute on function public.maisoumenozi_limpar_salas() to authenticated;

alter table public.maisoumenozi_salas enable row level security;
alter table public.maisoumenozi_sala_jogadores enable row level security;
alter table public.maisoumenozi_partidas enable row level security;

-- Salas: quem tem o código consegue ver; só o anfitrião cria, muda e apaga.
drop policy if exists "maisoumenozi salas: ler" on public.maisoumenozi_salas;
create policy "maisoumenozi salas: ler" on public.maisoumenozi_salas
  for select to authenticated using (true);

drop policy if exists "maisoumenozi salas: criar como anfitrião" on public.maisoumenozi_salas;
create policy "maisoumenozi salas: criar como anfitrião" on public.maisoumenozi_salas
  for insert to authenticated with check (host_id = auth.uid());

drop policy if exists "maisoumenozi salas: anfitrião edita" on public.maisoumenozi_salas;
create policy "maisoumenozi salas: anfitrião edita" on public.maisoumenozi_salas
  for update to authenticated using (host_id = auth.uid()) with check (host_id = auth.uid());

drop policy if exists "maisoumenozi salas: anfitrião apaga" on public.maisoumenozi_salas;
create policy "maisoumenozi salas: anfitrião apaga" on public.maisoumenozi_salas
  for delete to authenticated using (host_id = auth.uid());

-- Jogadores: cada um entra e edita a própria linha; sai sozinho ou o anfitrião remove.
drop policy if exists "maisoumenozi jogadores: ler" on public.maisoumenozi_sala_jogadores;
create policy "maisoumenozi jogadores: ler" on public.maisoumenozi_sala_jogadores
  for select to authenticated using (true);

drop policy if exists "maisoumenozi jogadores: entrar" on public.maisoumenozi_sala_jogadores;
create policy "maisoumenozi jogadores: entrar" on public.maisoumenozi_sala_jogadores
  for insert to authenticated with check (
    user_id = auth.uid()
    and exists (select 1 from public.maisoumenozi_salas s where s.code = sala_code and s.status <> 'playing')
  );

drop policy if exists "maisoumenozi jogadores: editar a própria linha" on public.maisoumenozi_sala_jogadores;
create policy "maisoumenozi jogadores: editar a própria linha" on public.maisoumenozi_sala_jogadores
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "maisoumenozi jogadores: sair ou ser removido" on public.maisoumenozi_sala_jogadores;
create policy "maisoumenozi jogadores: sair ou ser removido" on public.maisoumenozi_sala_jogadores
  for delete to authenticated using (
    user_id = auth.uid()
    or exists (select 1 from public.maisoumenozi_salas s where s.code = sala_code and s.host_id = auth.uid())
  );

-- Histórico: o anfitrião registra; cada um vê as partidas em que jogou.
drop policy if exists "maisoumenozi partidas: ver as minhas" on public.maisoumenozi_partidas;
create policy "maisoumenozi partidas: ver as minhas" on public.maisoumenozi_partidas
  for select to authenticated using (
    players @> jsonb_build_array(jsonb_build_object('uid', auth.uid()::text))
  );

drop policy if exists "maisoumenozi partidas: anfitrião registra" on public.maisoumenozi_partidas;
create policy "maisoumenozi partidas: anfitrião registra" on public.maisoumenozi_partidas
  for insert to authenticated with check (
    exists (select 1 from public.maisoumenozi_salas s where s.code = sala_code and s.host_id = auth.uid())
  );

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

-- ═════════════════════════════ Fotozi (jogo do kit: gamezi-kit.js) ═════════════════════════════
-- Mesmo projeto e mesma conta (auth.users). Tabelas próprias:
--   fotozi_salas          salas online (código de 5 letras, anfitrião e estado da partida)
--   fotozi_sala_jogadores quem está em cada sala (até 10), com a skin (as do Topzi)
--   fotozi_partidas       histórico das partidas online (cada um vê só as suas)
--   (o Fotozi do dia fica em fotozi_diario, lá embaixo, com os outros rankings)

create table if not exists public.fotozi_salas (
  code text primary key check (code ~ '^[A-Z0-9]{5}$'),
  host_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'lobby' check (status in ('lobby', 'playing', 'finished')),
  settings jsonb not null default '{}'::jsonb,
  state jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.fotozi_sala_jogadores (
  sala_code text not null references public.fotozi_salas (code) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  nick text not null check (char_length(nick) between 1 and 16),
  skin jsonb check (skin is null or (jsonb_typeof(skin) = 'object' and octet_length(skin::text) <= 1500)),
  joined_at timestamptz not null default now(),
  primary key (sala_code, user_id)
);

create table if not exists public.fotozi_partidas (
  id bigint generated always as identity primary key,
  sala_code text not null,
  tipo text,
  rodadas integer,
  players jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists fotozi_partidas_players_idx on public.fotozi_partidas using gin (players jsonb_path_ops);
create index if not exists fotozi_salas_updated_idx on public.fotozi_salas (updated_at);

drop trigger if exists fotozi_salas_updated on public.fotozi_salas;
create trigger fotozi_salas_updated before update on public.fotozi_salas
  for each row execute function public.tocar_updated_at();

-- No máximo 10 jogadores por sala do Fotozi.
create or replace function public.fotozi_limitar_jogadores()
returns trigger language plpgsql as $$
begin
  if (select count(*) from public.fotozi_sala_jogadores where sala_code = new.sala_code) >= 10 then
    raise exception 'A sala está cheia';
  end if;
  return new;
end $$;

drop trigger if exists fotozi_sala_jogadores_limite on public.fotozi_sala_jogadores;
create trigger fotozi_sala_jogadores_limite before insert on public.fotozi_sala_jogadores
  for each row execute function public.fotozi_limitar_jogadores();

-- Salas paradas há mais de um dia somem (chamada por quem cria uma sala).
create or replace function public.fotozi_limpar_salas()
returns void language sql security definer set search_path = public as $$
  delete from public.fotozi_salas where updated_at < now() - interval '1 day';
$$;
grant execute on function public.fotozi_limpar_salas() to authenticated;

alter table public.fotozi_salas enable row level security;
alter table public.fotozi_sala_jogadores enable row level security;
alter table public.fotozi_partidas enable row level security;

-- Salas: quem tem o código consegue ver; só o anfitrião cria, muda e apaga.
drop policy if exists "fotozi salas: ler" on public.fotozi_salas;
create policy "fotozi salas: ler" on public.fotozi_salas
  for select to authenticated using (true);

drop policy if exists "fotozi salas: criar como anfitrião" on public.fotozi_salas;
create policy "fotozi salas: criar como anfitrião" on public.fotozi_salas
  for insert to authenticated with check (host_id = auth.uid());

drop policy if exists "fotozi salas: anfitrião edita" on public.fotozi_salas;
create policy "fotozi salas: anfitrião edita" on public.fotozi_salas
  for update to authenticated using (host_id = auth.uid()) with check (host_id = auth.uid());

drop policy if exists "fotozi salas: anfitrião apaga" on public.fotozi_salas;
create policy "fotozi salas: anfitrião apaga" on public.fotozi_salas
  for delete to authenticated using (host_id = auth.uid());

-- Jogadores: cada um entra e edita a própria linha; sai sozinho ou o anfitrião remove.
drop policy if exists "fotozi jogadores: ler" on public.fotozi_sala_jogadores;
create policy "fotozi jogadores: ler" on public.fotozi_sala_jogadores
  for select to authenticated using (true);

drop policy if exists "fotozi jogadores: entrar" on public.fotozi_sala_jogadores;
create policy "fotozi jogadores: entrar" on public.fotozi_sala_jogadores
  for insert to authenticated with check (
    user_id = auth.uid()
    and exists (select 1 from public.fotozi_salas s where s.code = sala_code and s.status <> 'playing')
  );

drop policy if exists "fotozi jogadores: editar a própria linha" on public.fotozi_sala_jogadores;
create policy "fotozi jogadores: editar a própria linha" on public.fotozi_sala_jogadores
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "fotozi jogadores: sair ou ser removido" on public.fotozi_sala_jogadores;
create policy "fotozi jogadores: sair ou ser removido" on public.fotozi_sala_jogadores
  for delete to authenticated using (
    user_id = auth.uid()
    or exists (select 1 from public.fotozi_salas s where s.code = sala_code and s.host_id = auth.uid())
  );

-- Histórico: o anfitrião registra; cada um vê as partidas em que jogou.
drop policy if exists "fotozi partidas: ver as minhas" on public.fotozi_partidas;
create policy "fotozi partidas: ver as minhas" on public.fotozi_partidas
  for select to authenticated using (
    players @> jsonb_build_array(jsonb_build_object('uid', auth.uid()::text))
  );

drop policy if exists "fotozi partidas: anfitrião registra" on public.fotozi_partidas;
create policy "fotozi partidas: anfitrião registra" on public.fotozi_partidas
  for insert to authenticated with check (
    exists (select 1 from public.fotozi_salas s where s.code = sala_code and s.host_id = auth.uid())
  );

-- ═════════════════════════════ Censurazi (jogo do kit: gamezi-kit.js) ═════════════════════════════
-- Mesmo projeto e mesma conta (auth.users). Tabelas próprias:
--   censurazi_salas          salas online (código de 5 letras, anfitrião e estado da partida)
--   censurazi_sala_jogadores quem está em cada sala (até 10), com a skin (as do Topzi)
--   censurazi_partidas       histórico das partidas online (cada um vê só as suas)
--   (o Censurazi do dia fica em censurazi_diario, lá embaixo, com os outros rankings)

create table if not exists public.censurazi_salas (
  code text primary key check (code ~ '^[A-Z0-9]{5}$'),
  host_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'lobby' check (status in ('lobby', 'playing', 'finished')),
  settings jsonb not null default '{}'::jsonb,
  state jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.censurazi_sala_jogadores (
  sala_code text not null references public.censurazi_salas (code) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  nick text not null check (char_length(nick) between 1 and 16),
  skin jsonb check (skin is null or (jsonb_typeof(skin) = 'object' and octet_length(skin::text) <= 1500)),
  joined_at timestamptz not null default now(),
  primary key (sala_code, user_id)
);

create table if not exists public.censurazi_partidas (
  id bigint generated always as identity primary key,
  sala_code text not null,
  tipo text,
  rodadas integer,
  players jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists censurazi_partidas_players_idx on public.censurazi_partidas using gin (players jsonb_path_ops);
create index if not exists censurazi_salas_updated_idx on public.censurazi_salas (updated_at);

drop trigger if exists censurazi_salas_updated on public.censurazi_salas;
create trigger censurazi_salas_updated before update on public.censurazi_salas
  for each row execute function public.tocar_updated_at();

-- No máximo 10 jogadores por sala do Censurazi.
create or replace function public.censurazi_limitar_jogadores()
returns trigger language plpgsql as $$
begin
  if (select count(*) from public.censurazi_sala_jogadores where sala_code = new.sala_code) >= 10 then
    raise exception 'A sala está cheia';
  end if;
  return new;
end $$;

drop trigger if exists censurazi_sala_jogadores_limite on public.censurazi_sala_jogadores;
create trigger censurazi_sala_jogadores_limite before insert on public.censurazi_sala_jogadores
  for each row execute function public.censurazi_limitar_jogadores();

-- Salas paradas há mais de um dia somem (chamada por quem cria uma sala).
create or replace function public.censurazi_limpar_salas()
returns void language sql security definer set search_path = public as $$
  delete from public.censurazi_salas where updated_at < now() - interval '1 day';
$$;
grant execute on function public.censurazi_limpar_salas() to authenticated;

alter table public.censurazi_salas enable row level security;
alter table public.censurazi_sala_jogadores enable row level security;
alter table public.censurazi_partidas enable row level security;

-- Salas: quem tem o código consegue ver; só o anfitrião cria, muda e apaga.
drop policy if exists "censurazi salas: ler" on public.censurazi_salas;
create policy "censurazi salas: ler" on public.censurazi_salas
  for select to authenticated using (true);

drop policy if exists "censurazi salas: criar como anfitrião" on public.censurazi_salas;
create policy "censurazi salas: criar como anfitrião" on public.censurazi_salas
  for insert to authenticated with check (host_id = auth.uid());

drop policy if exists "censurazi salas: anfitrião edita" on public.censurazi_salas;
create policy "censurazi salas: anfitrião edita" on public.censurazi_salas
  for update to authenticated using (host_id = auth.uid()) with check (host_id = auth.uid());

drop policy if exists "censurazi salas: anfitrião apaga" on public.censurazi_salas;
create policy "censurazi salas: anfitrião apaga" on public.censurazi_salas
  for delete to authenticated using (host_id = auth.uid());

-- Jogadores: cada um entra e edita a própria linha; sai sozinho ou o anfitrião remove.
drop policy if exists "censurazi jogadores: ler" on public.censurazi_sala_jogadores;
create policy "censurazi jogadores: ler" on public.censurazi_sala_jogadores
  for select to authenticated using (true);

drop policy if exists "censurazi jogadores: entrar" on public.censurazi_sala_jogadores;
create policy "censurazi jogadores: entrar" on public.censurazi_sala_jogadores
  for insert to authenticated with check (
    user_id = auth.uid()
    and exists (select 1 from public.censurazi_salas s where s.code = sala_code and s.status <> 'playing')
  );

drop policy if exists "censurazi jogadores: editar a própria linha" on public.censurazi_sala_jogadores;
create policy "censurazi jogadores: editar a própria linha" on public.censurazi_sala_jogadores
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "censurazi jogadores: sair ou ser removido" on public.censurazi_sala_jogadores;
create policy "censurazi jogadores: sair ou ser removido" on public.censurazi_sala_jogadores
  for delete to authenticated using (
    user_id = auth.uid()
    or exists (select 1 from public.censurazi_salas s where s.code = sala_code and s.host_id = auth.uid())
  );

-- Histórico: o anfitrião registra; cada um vê as partidas em que jogou.
drop policy if exists "censurazi partidas: ver as minhas" on public.censurazi_partidas;
create policy "censurazi partidas: ver as minhas" on public.censurazi_partidas
  for select to authenticated using (
    players @> jsonb_build_array(jsonb_build_object('uid', auth.uid()::text))
  );

drop policy if exists "censurazi partidas: anfitrião registra" on public.censurazi_partidas;
create policy "censurazi partidas: anfitrião registra" on public.censurazi_partidas
  for insert to authenticated with check (
    exists (select 1 from public.censurazi_salas s where s.code = sala_code and s.host_id = auth.uid())
  );

-- ═════════════════════════════ Corzi (jogo do kit: gamezi-kit.js) ═════════════════════════════
-- Mesmo projeto e mesma conta (auth.users). Tabelas próprias:
--   corzi_salas          salas online (código de 5 letras, anfitrião e estado da partida)
--   corzi_sala_jogadores quem está em cada sala (até 10), com a skin (as do Topzi)
--   corzi_partidas       histórico das partidas online (cada um vê só as suas)
--   (o Corzi do dia fica em corzi_diario, lá embaixo, com os outros rankings)

create table if not exists public.corzi_salas (
  code text primary key check (code ~ '^[A-Z0-9]{5}$'),
  host_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'lobby' check (status in ('lobby', 'playing', 'finished')),
  settings jsonb not null default '{}'::jsonb,
  state jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.corzi_sala_jogadores (
  sala_code text not null references public.corzi_salas (code) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  nick text not null check (char_length(nick) between 1 and 16),
  skin jsonb check (skin is null or (jsonb_typeof(skin) = 'object' and octet_length(skin::text) <= 1500)),
  joined_at timestamptz not null default now(),
  primary key (sala_code, user_id)
);

create table if not exists public.corzi_partidas (
  id bigint generated always as identity primary key,
  sala_code text not null,
  tipo text,
  rodadas integer,
  players jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists corzi_partidas_players_idx on public.corzi_partidas using gin (players jsonb_path_ops);
create index if not exists corzi_salas_updated_idx on public.corzi_salas (updated_at);

drop trigger if exists corzi_salas_updated on public.corzi_salas;
create trigger corzi_salas_updated before update on public.corzi_salas
  for each row execute function public.tocar_updated_at();

-- No máximo 10 jogadores por sala do Corzi.
create or replace function public.corzi_limitar_jogadores()
returns trigger language plpgsql as $$
begin
  if (select count(*) from public.corzi_sala_jogadores where sala_code = new.sala_code) >= 10 then
    raise exception 'A sala está cheia';
  end if;
  return new;
end $$;

drop trigger if exists corzi_sala_jogadores_limite on public.corzi_sala_jogadores;
create trigger corzi_sala_jogadores_limite before insert on public.corzi_sala_jogadores
  for each row execute function public.corzi_limitar_jogadores();

-- Salas paradas há mais de um dia somem (chamada por quem cria uma sala).
create or replace function public.corzi_limpar_salas()
returns void language sql security definer set search_path = public as $$
  delete from public.corzi_salas where updated_at < now() - interval '1 day';
$$;
grant execute on function public.corzi_limpar_salas() to authenticated;

alter table public.corzi_salas enable row level security;
alter table public.corzi_sala_jogadores enable row level security;
alter table public.corzi_partidas enable row level security;

-- Salas: quem tem o código consegue ver; só o anfitrião cria, muda e apaga.
drop policy if exists "corzi salas: ler" on public.corzi_salas;
create policy "corzi salas: ler" on public.corzi_salas
  for select to authenticated using (true);

drop policy if exists "corzi salas: criar como anfitrião" on public.corzi_salas;
create policy "corzi salas: criar como anfitrião" on public.corzi_salas
  for insert to authenticated with check (host_id = auth.uid());

drop policy if exists "corzi salas: anfitrião edita" on public.corzi_salas;
create policy "corzi salas: anfitrião edita" on public.corzi_salas
  for update to authenticated using (host_id = auth.uid()) with check (host_id = auth.uid());

drop policy if exists "corzi salas: anfitrião apaga" on public.corzi_salas;
create policy "corzi salas: anfitrião apaga" on public.corzi_salas
  for delete to authenticated using (host_id = auth.uid());

-- Jogadores: cada um entra e edita a própria linha; sai sozinho ou o anfitrião remove.
drop policy if exists "corzi jogadores: ler" on public.corzi_sala_jogadores;
create policy "corzi jogadores: ler" on public.corzi_sala_jogadores
  for select to authenticated using (true);

drop policy if exists "corzi jogadores: entrar" on public.corzi_sala_jogadores;
create policy "corzi jogadores: entrar" on public.corzi_sala_jogadores
  for insert to authenticated with check (
    user_id = auth.uid()
    and exists (select 1 from public.corzi_salas s where s.code = sala_code and s.status <> 'playing')
  );

drop policy if exists "corzi jogadores: editar a própria linha" on public.corzi_sala_jogadores;
create policy "corzi jogadores: editar a própria linha" on public.corzi_sala_jogadores
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "corzi jogadores: sair ou ser removido" on public.corzi_sala_jogadores;
create policy "corzi jogadores: sair ou ser removido" on public.corzi_sala_jogadores
  for delete to authenticated using (
    user_id = auth.uid()
    or exists (select 1 from public.corzi_salas s where s.code = sala_code and s.host_id = auth.uid())
  );

-- Histórico: o anfitrião registra; cada um vê as partidas em que jogou.
drop policy if exists "corzi partidas: ver as minhas" on public.corzi_partidas;
create policy "corzi partidas: ver as minhas" on public.corzi_partidas
  for select to authenticated using (
    players @> jsonb_build_array(jsonb_build_object('uid', auth.uid()::text))
  );

drop policy if exists "corzi partidas: anfitrião registra" on public.corzi_partidas;
create policy "corzi partidas: anfitrião registra" on public.corzi_partidas
  for insert to authenticated with check (
    exists (select 1 from public.corzi_salas s where s.code = sala_code and s.host_id = auth.uid())
  );

-- Skin de quem está na sala (Datazi, Tamanhozi e Maiorzi). Entrou depois: add column if not exists.
alter table public.datazi_sala_jogadores add column if not exists skin jsonb check (skin is null or (jsonb_typeof(skin) = 'object' and octet_length(skin::text) <= 1500));
alter table public.tamanhozi_sala_jogadores add column if not exists skin jsonb check (skin is null or (jsonb_typeof(skin) = 'object' and octet_length(skin::text) <= 1500));

-- ═════════════════════════════ Gamezi: descrições e visões ═════════════════════════════
-- Cada tabela tem uma descrição dizendo de qual jogo é; ela aparece no painel do Supabase (Description).

comment on table public.topzi_perfis is 'Topzi: perfil de cada conta (nick, skin, estatísticas, recordes, listas criadas)';
comment on table public.topzi_salas is 'Topzi: salas online';
comment on table public.topzi_sala_jogadores is 'Topzi: jogadores de cada sala online';
comment on table public.topzi_partidas is 'Topzi: histórico das partidas online';
comment on table public.patozi_perfis is 'Patozi: perfil de cada conta (nick, cor e visual do pato, estatísticas)';
comment on table public.patozi_diario is 'Patozi: resultado de cada um no Pato do dia (ranking)';
comment on table public.patozi_sugestoes is 'Patozi: cartas enviadas pelos jogadores';
comment on table public.patozi_salas is 'Patozi: salas online';
comment on table public.patozi_sala_jogadores is 'Patozi: jogadores de cada sala online';
comment on table public.patozi_partidas is 'Patozi: histórico das partidas online';
comment on table public.cravazi_salas is 'Cravazi: salas online';
comment on table public.cravazi_sala_jogadores is 'Cravazi: jogadores de cada sala online (com a skin)';
comment on table public.cravazi_partidas is 'Cravazi: histórico das partidas online';
comment on table public.tamanhozi_salas is 'Tamanhozi: salas online';
comment on table public.tamanhozi_sala_jogadores is 'Tamanhozi: jogadores de cada sala online';
comment on table public.tamanhozi_partidas is 'Tamanhozi: histórico das partidas online';
comment on table public.datazi_salas is 'Datazi: salas online';
comment on table public.datazi_sala_jogadores is 'Datazi: jogadores de cada sala online';
comment on table public.datazi_partidas is 'Datazi: histórico das partidas online (com o modo de jogo)';
comment on table public.maisoumenozi_salas is 'Maiorzi: salas online';
comment on table public.maisoumenozi_sala_jogadores is 'Maiorzi: jogadores de cada sala online (com a skin)';
comment on table public.maisoumenozi_partidas is 'Maiorzi: histórico das partidas online';
comment on table public.emojizi_salas is 'Emojizi: salas online';
comment on table public.emojizi_sala_jogadores is 'Emojizi: jogadores de cada sala online (com a skin)';
comment on table public.emojizi_partidas is 'Emojizi: histórico das partidas online';
comment on table public.contazi_salas is 'Contazi: salas online';
comment on table public.contazi_sala_jogadores is 'Contazi: jogadores de cada sala online (com a skin)';
comment on table public.contazi_partidas is 'Contazi: histórico das partidas online';
comment on table public.memorizi_salas is 'Memorizi: salas online';
comment on table public.memorizi_sala_jogadores is 'Memorizi: jogadores de cada sala online (com a skin)';
comment on table public.memorizi_partidas is 'Memorizi: histórico das partidas online';
comment on table public.fotozi_salas is 'Fotozi: salas online';
comment on table public.fotozi_sala_jogadores is 'Fotozi: jogadores de cada sala online (com a skin)';
comment on table public.fotozi_partidas is 'Fotozi: histórico das partidas online';
comment on table public.censurazi_salas is 'Censurazi: salas online';
comment on table public.censurazi_sala_jogadores is 'Censurazi: jogadores de cada sala online (com a skin)';
comment on table public.censurazi_partidas is 'Censurazi: histórico das partidas online';
comment on table public.corzi_salas is 'Corzi: salas online';
comment on table public.corzi_sala_jogadores is 'Corzi: jogadores de cada sala online (com a skin)';
comment on table public.corzi_partidas is 'Corzi: histórico das partidas online';

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
    from public.memorizi_salas x
  union all
  select 'fotozi'::text, x.code, x.status, x.host_id,
         (select count(*) from public.fotozi_sala_jogadores j where j.sala_code = x.code),
         x.created_at, x.updated_at
    from public.fotozi_salas x
  union all
  select 'censurazi'::text, x.code, x.status, x.host_id,
         (select count(*) from public.censurazi_sala_jogadores j where j.sala_code = x.code),
         x.created_at, x.updated_at
    from public.censurazi_salas x
  union all
  select 'corzi'::text, x.code, x.status, x.host_id,
         (select count(*) from public.corzi_sala_jogadores j where j.sala_code = x.code),
         x.created_at, x.updated_at
    from public.corzi_salas x;

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
    from public.memorizi_sala_jogadores x
  union all
  select 'fotozi'::text, x.sala_code, x.nick, x.user_id, x.joined_at
    from public.fotozi_sala_jogadores x
  union all
  select 'censurazi'::text, x.sala_code, x.nick, x.user_id, x.joined_at
    from public.censurazi_sala_jogadores x
  union all
  select 'corzi'::text, x.sala_code, x.nick, x.user_id, x.joined_at
    from public.corzi_sala_jogadores x;

comment on view public.gamezi_salas is 'Gamezi: salas online dos jogos (coluna jogo = o id do jogo: topzi, patozi, cravazi, tamanhozi, datazi, maisoumenozi, emojizi, contazi, memorizi, fotozi, censurazi ou corzi)';
comment on view public.gamezi_jogadores_nas_salas is 'Gamezi: quem está em cada sala, de todos os jogos (coluna jogo)';

revoke all on public.gamezi_salas, public.gamezi_jogadores_nas_salas from anon, authenticated;

-- Atalhos com os nomes antigos do Topzi (profiles, rooms, room_players, matches): já não são usados.
do $$
declare
  nome text;
begin
  foreach nome in array array['profiles', 'rooms', 'room_players', 'matches'] loop
    if exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
               where n.nspname = 'public' and c.relname = nome and c.relkind = 'v') then
      execute format('drop view public.%I', nome);
    end if;
  end loop;
end $$;
drop function if exists public.limpar_salas_antigas();

-- ═════════════════════════════ Gamezi: filtro de palavrões ═════════════════════════════
-- Nick com palavrão vira "Jogador" (no ranking, nas salas e nos perfis); carta enviada com palavrão fica
-- marcada como bloqueada. Compara palavra por palavra, sem acento e com 0→o, 1→i, 3→e, 4→a, 5→s, 7→t, @→a, $→s,
-- para não pegar palavras inocentes (computador, cupom…).
create or replace function public.gamezi_tem_palavrao(texto text)
returns boolean language plpgsql immutable as $$
declare
  limpo text;
  palavra text;
  ruins text[] := array[
    'puta', 'putas', 'puto', 'putos', 'porra', 'merda', 'merdas', 'caralho', 'cu', 'cuzao', 'buceta', 'xoxota', 'piroca',
    'foda', 'fodase', 'foder', 'fuder', 'viado', 'viadao', 'arrombado', 'arrombada', 'corno', 'vagabunda', 'vadia',
    'babaca', 'retardado', 'retardada', 'fdp', 'pqp', 'vsf', 'tnc', 'krl', 'crl', 'hitler', 'nazi', 'nazista',
    'fuck', 'fucker', 'shit', 'bitch', 'cunt', 'dick', 'pussy', 'asshole', 'nigger', 'nigga', 'faggot', 'whore', 'slut',
    'retard', 'mierda', 'pendejo', 'cabron', 'verga', 'chinga', 'culero', 'maricon', 'joder', 'gilipollas', 'hijueputa'];
  raizes text[] := array[
    'caralh', 'arromb', 'fodid', 'fudid', 'fodas', 'putinh', 'putari', 'viadinh', 'bucet', 'fuck', 'shit', 'bitch',
    'nigg', 'fagg', 'pendej', 'cabron', 'chingad', 'gilipoll', 'maricon', 'hijueput', 'filhodaput', 'filhadaput',
    'vagabund', 'retardad', 'merdinh'];
begin
  if texto is null or texto = '' then return false; end if;
  limpo := translate(lower(texto), 'áàâãäéèêëíìîïóòôõöúùûüçñ013457@$', 'aaaaaeeeeiiiiooooouuuucnoieastas');
  if regexp_replace(limpo, '[^a-z]', '', 'g') = any(ruins) then return true; end if;
  foreach palavra in array regexp_split_to_array(limpo, '[^a-z]+') loop
    if palavra = '' then continue; end if;
    if palavra = any(ruins) then return true; end if;
    if exists (select 1 from unnest(raizes) r where palavra like r || '%') then return true; end if;
  end loop;
  return false;
end $$;

create or replace function public.gamezi_limpar_nick()
returns trigger language plpgsql as $$
begin
  if public.gamezi_tem_palavrao(new.nick) then new.nick := 'Jogador'; end if;
  return new;
end $$;

do $$
declare
  tabela text;
begin
  foreach tabela in array array['topzi_perfis', 'topzi_sala_jogadores', 'patozi_perfis', 'patozi_sala_jogadores', 'patozi_diario', 'cravazi_sala_jogadores', 'tamanhozi_sala_jogadores', 'datazi_sala_jogadores', 'maisoumenozi_sala_jogadores', 'emojizi_sala_jogadores', 'contazi_sala_jogadores', 'memorizi_sala_jogadores', 'fotozi_sala_jogadores', 'censurazi_sala_jogadores', 'corzi_sala_jogadores'] loop
    execute format('drop trigger if exists %I on public.%I', tabela || '_nick_limpo', tabela);
    execute format('create trigger %I before insert or update of nick on public.%I for each row execute function public.gamezi_limpar_nick()', tabela || '_nick_limpo', tabela);
  end loop;
end $$;

alter table public.patozi_sugestoes add column if not exists bloqueada boolean not null default false;

create or replace function public.patozi_conferir_sugestao()
returns trigger language plpgsql as $$
begin
  new.bloqueada := public.gamezi_tem_palavrao(new.pergunta) or public.gamezi_tem_palavrao(new.fonte);
  if public.gamezi_tem_palavrao(new.nick) then new.nick := 'Jogador'; end if;
  return new;
end $$;

drop trigger if exists patozi_sugestoes_conferir on public.patozi_sugestoes;
create trigger patozi_sugestoes_conferir before insert on public.patozi_sugestoes
  for each row execute function public.patozi_conferir_sugestao();

-- ═════════════════════════════ Rankings do dia (à prova de trapaça simples) ═════════════════════════════
-- O resultado do dia só entra pelo banco (funções abaixo), nunca direto na tabela: o banco confere o dia
-- (hoje, com 1 dia de folga por causa do fuso) e, no Patozi, calcula os pontos a partir dos chutes e das
-- respostas guardadas em patozi_respostas. Quem ler as respostas no código do jogo ainda consegue
-- trapacear; isto barra o forjado simples (mandar "500 pontos" direto).

-- Topzi: lista do dia (sempre 10 itens). Pontos possíveis com N acertos: de 1+…+N até (11-N)+…+10.
create table if not exists public.topzi_diario (
  dia integer not null check (dia >= 1),
  user_id uuid not null references auth.users (id) on delete cascade,
  nick text not null default '' check (char_length(nick) <= 16),
  lista text not null default '' check (char_length(lista) <= 80),
  pontos smallint not null check (pontos between 0 and 55),
  acertos smallint not null check (acertos between 0 and 10),
  created_at timestamptz not null default now(),
  primary key (dia, user_id)
);

create index if not exists topzi_diario_ranking_idx on public.topzi_diario (dia, pontos desc);
comment on table public.topzi_diario is 'Topzi: resultado de cada um na lista do dia (ranking)';

drop trigger if exists topzi_diario_nick_limpo on public.topzi_diario;
create trigger topzi_diario_nick_limpo before insert or update of nick on public.topzi_diario
  for each row execute function public.gamezi_limpar_nick();

alter table public.topzi_diario enable row level security;

drop policy if exists "topzi diário: ler" on public.topzi_diario;
create policy "topzi diário: ler" on public.topzi_diario
  for select to authenticated using (true);

-- Patozi: respostas das cartas (dados em supabase/patozi-respostas.sql, gerado a partir do jogo).
create table if not exists public.patozi_respostas (
  carta text primary key,
  resposta bigint not null check (resposta >= 1)
);
alter table public.patozi_respostas enable row level security; -- sem regras: só as funções leem

drop policy if exists "patozi diário: registrar o próprio" on public.patozi_diario;

-- ═════════════════════════════ Ranking do dia de todos os jogos (desempate pelo tempo) ═════════════════════════════
-- Cada jogo tem a tabela <jogo>_diario com o resultado de cada um no desafio do dia. Quem faz mais pontos fica
-- na frente; no empate, quem levou menos tempo (tempo_ms, medido pelo jogo). Sem tempo (resultado antigo) fica
-- atrás no empate. O ranking é lido pela função gamezi_ranking_dia (também no portal, sem login).

alter table public.topzi_diario add column if not exists tempo_ms integer check (tempo_ms between 0 and 86400000);
alter table public.patozi_diario add column if not exists tempo_ms integer check (tempo_ms between 0 and 86400000);

-- Datazi: acontecimentos no lugar certo (de 0 a 8). Maisoumenozi: acertos nas 10 rodadas.
create table if not exists public.datazi_diario (
  dia integer not null check (dia >= 1),
  user_id uuid not null references auth.users (id) on delete cascade,
  nick text not null default '' check (char_length(nick) <= 16),
  pontos smallint not null check (pontos between 0 and 8),
  tempo_ms integer check (tempo_ms between 0 and 86400000),
  created_at timestamptz not null default now(),
  primary key (dia, user_id)
);

create table if not exists public.maisoumenozi_diario (
  dia integer not null check (dia >= 1),
  user_id uuid not null references auth.users (id) on delete cascade,
  nick text not null default '' check (char_length(nick) <= 16),
  pontos smallint not null check (pontos between 0 and 10),
  tempo_ms integer check (tempo_ms between 0 and 86400000),
  created_at timestamptz not null default now(),
  primary key (dia, user_id)
);

-- Cravazi do dia: 5 perguntas, de 10 (cravou no 1º chute) a 0 pontos cada.
create table if not exists public.cravazi_diario (
  dia integer not null check (dia >= 1),
  user_id uuid not null references auth.users (id) on delete cascade,
  nick text not null default '' check (char_length(nick) <= 16),
  pontos smallint not null check (pontos between 0 and 50),
  tempo_ms integer check (tempo_ms between 0 and 86400000),
  created_at timestamptz not null default now(),
  primary key (dia, user_id)
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

-- Fotozi do dia (o dia 1 é 26/10/2026): 10 rodadas, de 0 a 100 pontos cada.
create table if not exists public.fotozi_diario (
  dia integer not null check (dia >= 1),
  user_id uuid not null references auth.users (id) on delete cascade,
  nick text not null default '' check (char_length(nick) <= 16),
  pontos smallint not null check (pontos between 0 and 1000),
  tempo_ms integer check (tempo_ms between 0 and 86400000),
  created_at timestamptz not null default now(),
  primary key (dia, user_id)
);
comment on table public.fotozi_diario is 'Fotozi: resultado de cada um no Fotozi do dia (ranking)';

-- Censurazi do dia (o dia 1 é 26/10/2026): 10 rodadas, de 0 a 100 pontos cada.
create table if not exists public.censurazi_diario (
  dia integer not null check (dia >= 1),
  user_id uuid not null references auth.users (id) on delete cascade,
  nick text not null default '' check (char_length(nick) <= 16),
  pontos smallint not null check (pontos between 0 and 1000),
  tempo_ms integer check (tempo_ms between 0 and 86400000),
  created_at timestamptz not null default now(),
  primary key (dia, user_id)
);
comment on table public.censurazi_diario is 'Censurazi: resultado de cada um no Censurazi do dia (ranking)';

-- Corzi do dia (o dia 1 é 26/10/2026): 10 rodadas, de 0 a 100 pontos cada.
create table if not exists public.corzi_diario (
  dia integer not null check (dia >= 1),
  user_id uuid not null references auth.users (id) on delete cascade,
  nick text not null default '' check (char_length(nick) <= 16),
  pontos smallint not null check (pontos between 0 and 1000),
  tempo_ms integer check (tempo_ms between 0 and 86400000),
  created_at timestamptz not null default now(),
  primary key (dia, user_id)
);
comment on table public.corzi_diario is 'Corzi: resultado de cada um no Corzi do dia (ranking)';

comment on table public.tamanhozi_diario is 'Tamanhozi: resultado de cada um no Tamanhozi do dia (ranking)';
comment on table public.datazi_diario is 'Datazi: resultado de cada um no Datazi do dia (ranking)';
comment on table public.cravazi_diario is 'Cravazi: resultado de cada um no Cravazi do dia (ranking)';
comment on table public.maisoumenozi_diario is 'Maisoumenozi: resultado de cada um no desafio do dia (ranking)';

do $$
declare
  tabela text;
begin
  foreach tabela in array array['topzi_diario', 'patozi_diario', 'datazi_diario', 'maisoumenozi_diario', 'cravazi_diario', 'tamanhozi_diario', 'emojizi_diario', 'contazi_diario', 'memorizi_diario', 'fotozi_diario', 'censurazi_diario', 'corzi_diario'] loop
    execute format('create index if not exists %I on public.%I (dia, pontos desc, tempo_ms)', tabela || '_tempo_idx', tabela);
  end loop;
  foreach tabela in array array['datazi_diario', 'maisoumenozi_diario', 'cravazi_diario', 'tamanhozi_diario', 'emojizi_diario', 'contazi_diario', 'memorizi_diario', 'fotozi_diario', 'censurazi_diario', 'corzi_diario'] loop
    execute format('drop trigger if exists %I on public.%I', tabela || '_nick_limpo', tabela);
    execute format('create trigger %I before insert or update of nick on public.%I for each row execute function public.gamezi_limpar_nick()', tabela || '_nick_limpo', tabela);
    execute format('alter table public.%I enable row level security', tabela); -- sem regras: só as funções leem e gravam
  end loop;
end $$;

-- Topzi e Patozi: as funções de registrar ganham o tempo (opcional, para o jogo antigo em cache continuar entrando).
drop function if exists public.topzi_registrar_diario(integer, text, text, integer, integer);
create or replace function public.topzi_registrar_diario(p_dia integer, p_lista text, p_nick text, p_pontos integer, p_acertos integer, p_tempo integer default null)
returns void language plpgsql security definer set search_path = public as $$
declare
  hoje integer := ((now() at time zone 'utc')::date - date '2026-10-01') + 1;
begin
  if auth.uid() is null then raise exception 'Entre para registrar o resultado.'; end if;
  if p_dia is null or p_dia not between hoje - 1 and hoje + 1 then raise exception 'Esse dia já passou.'; end if;
  if p_acertos is null or p_acertos not between 0 and 10 then raise exception 'Resultado inválido.'; end if;
  if p_pontos is null or p_pontos < p_acertos * (p_acertos + 1) / 2 or p_pontos > p_acertos * (21 - p_acertos) / 2 then
    raise exception 'Resultado inválido.';
  end if;
  insert into public.topzi_diario (dia, user_id, nick, lista, pontos, acertos, tempo_ms)
  values (p_dia, auth.uid(), left(coalesce(p_nick, ''), 16), left(coalesce(p_lista, ''), 80), p_pontos, p_acertos,
          case when p_tempo between 0 and 86400000 then p_tempo end)
  on conflict (dia, user_id) do nothing;
end $$;

grant execute on function public.topzi_registrar_diario(integer, text, text, integer, integer, integer) to authenticated;

drop function if exists public.patozi_registrar_diario(integer, text, jsonb);
create or replace function public.patozi_registrar_diario(p_dia integer, p_nick text, p_chutes jsonb, p_tempo integer default null)
returns integer language plpgsql security definer set search_path = public as $$
declare
  hoje integer := ((now() at time zone 'utc')::date - date '2026-10-08') + 1;
  total integer := 0;
  item jsonb;
  resp bigint;
  chute numeric;
begin
  if auth.uid() is null then raise exception 'Entre para registrar o resultado.'; end if;
  if p_dia is null or p_dia not between hoje - 1 and hoje + 1 then raise exception 'Esse dia já passou.'; end if;
  if jsonb_typeof(p_chutes) <> 'array' or jsonb_array_length(p_chutes) <> 5
     or (select count(distinct x ->> 'carta') from jsonb_array_elements(p_chutes) x) <> 5 then
    raise exception 'Resultado inválido.';
  end if;
  for item in select * from jsonb_array_elements(p_chutes) loop
    select r.resposta into resp from public.patozi_respostas r where r.carta = item ->> 'carta';
    if resp is null then raise exception 'Carta desconhecida.'; end if;
    chute := nullif(item ->> 'chute', '')::numeric;
    if chute is not null and chute >= 0 and chute <= resp then total := total + floor(100 * chute / resp); end if;
  end loop;
  insert into public.patozi_diario (dia, user_id, nick, pontos, chutes, tempo_ms)
  values (p_dia, auth.uid(), left(coalesce(p_nick, ''), 16), total, p_chutes, case when p_tempo between 0 and 86400000 then p_tempo end)
  on conflict (dia, user_id) do nothing;
  return total;
end $$;

grant execute on function public.patozi_registrar_diario(integer, text, jsonb, integer) to authenticated;

-- Datazi do dia (o dia 1 é 8/10/2026) e desafio do dia do Maisoumenozi (o dia 1 é 9/10/2026).
create or replace function public.datazi_registrar_diario(p_dia integer, p_nick text, p_acertos integer, p_tempo integer default null)
returns void language plpgsql security definer set search_path = public as $$
declare
  hoje integer := ((now() at time zone 'utc')::date - date '2026-10-08') + 1;
begin
  if auth.uid() is null then raise exception 'Entre para registrar o resultado.'; end if;
  if p_dia is null or p_dia not between hoje - 1 and hoje + 1 then raise exception 'Esse dia já passou.'; end if;
  if p_acertos is null or p_acertos not between 0 and 8 then raise exception 'Resultado inválido.'; end if;
  insert into public.datazi_diario (dia, user_id, nick, pontos, tempo_ms)
  values (p_dia, auth.uid(), left(coalesce(p_nick, ''), 16), p_acertos, case when p_tempo between 0 and 86400000 then p_tempo end)
  on conflict (dia, user_id) do nothing;
end $$;

grant execute on function public.datazi_registrar_diario(integer, text, integer, integer) to authenticated;

create or replace function public.maisoumenozi_registrar_diario(p_dia integer, p_nick text, p_acertos integer, p_tempo integer default null)
returns void language plpgsql security definer set search_path = public as $$
declare
  hoje integer := ((now() at time zone 'utc')::date - date '2026-10-09') + 1;
begin
  if auth.uid() is null then raise exception 'Entre para registrar o resultado.'; end if;
  if p_dia is null or p_dia not between hoje - 1 and hoje + 1 then raise exception 'Esse dia já passou.'; end if;
  if p_acertos is null or p_acertos not between 0 and 10 then raise exception 'Resultado inválido.'; end if;
  insert into public.maisoumenozi_diario (dia, user_id, nick, pontos, tempo_ms)
  values (p_dia, auth.uid(), left(coalesce(p_nick, ''), 16), p_acertos, case when p_tempo between 0 and 86400000 then p_tempo end)
  on conflict (dia, user_id) do nothing;
end $$;

grant execute on function public.maisoumenozi_registrar_diario(integer, text, integer, integer) to authenticated;

-- Cravazi do dia (o dia 1 é 9/10/2026): p_acertos são os pontos (de 0 a 50).
create or replace function public.cravazi_registrar_diario(p_dia integer, p_nick text, p_acertos integer, p_tempo integer default null)
returns void language plpgsql security definer set search_path = public as $$
declare
  hoje integer := ((now() at time zone 'utc')::date - date '2026-10-09') + 1;
begin
  if auth.uid() is null then raise exception 'Entre para registrar o resultado.'; end if;
  if p_dia is null or p_dia not between hoje - 1 and hoje + 1 then raise exception 'Esse dia já passou.'; end if;
  if p_acertos is null or p_acertos not between 0 and 50 then raise exception 'Resultado inválido.'; end if;
  insert into public.cravazi_diario (dia, user_id, nick, pontos, tempo_ms)
  values (p_dia, auth.uid(), left(coalesce(p_nick, ''), 16), p_acertos, case when p_tempo between 0 and 86400000 then p_tempo end)
  on conflict (dia, user_id) do nothing;
end $$;

grant execute on function public.cravazi_registrar_diario(integer, text, integer, integer) to authenticated;

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

-- Fotozi do dia (o dia 1 é 26/10/2026): p_acertos são os pontos (de 0 a 1000).
create or replace function public.fotozi_registrar_diario(p_dia integer, p_nick text, p_acertos integer, p_tempo integer default null)
returns void language plpgsql security definer set search_path = public as $$
declare
  hoje integer := ((now() at time zone 'utc')::date - date '2026-10-26') + 1;
begin
  if auth.uid() is null then raise exception 'Entre para registrar o resultado.'; end if;
  if p_dia is null or p_dia not between hoje - 1 and hoje + 1 then raise exception 'Esse dia já passou.'; end if;
  if p_acertos is null or p_acertos not between 0 and 1000 then raise exception 'Resultado inválido.'; end if;
  insert into public.fotozi_diario (dia, user_id, nick, pontos, tempo_ms)
  values (p_dia, auth.uid(), left(coalesce(p_nick, ''), 16), p_acertos, case when p_tempo between 0 and 86400000 then p_tempo end)
  on conflict (dia, user_id) do nothing;
end $$;

grant execute on function public.fotozi_registrar_diario(integer, text, integer, integer) to authenticated;

-- Censurazi do dia (o dia 1 é 26/10/2026): p_acertos são os pontos (de 0 a 1000).
create or replace function public.censurazi_registrar_diario(p_dia integer, p_nick text, p_acertos integer, p_tempo integer default null)
returns void language plpgsql security definer set search_path = public as $$
declare
  hoje integer := ((now() at time zone 'utc')::date - date '2026-10-26') + 1;
begin
  if auth.uid() is null then raise exception 'Entre para registrar o resultado.'; end if;
  if p_dia is null or p_dia not between hoje - 1 and hoje + 1 then raise exception 'Esse dia já passou.'; end if;
  if p_acertos is null or p_acertos not between 0 and 1000 then raise exception 'Resultado inválido.'; end if;
  insert into public.censurazi_diario (dia, user_id, nick, pontos, tempo_ms)
  values (p_dia, auth.uid(), left(coalesce(p_nick, ''), 16), p_acertos, case when p_tempo between 0 and 86400000 then p_tempo end)
  on conflict (dia, user_id) do nothing;
end $$;

grant execute on function public.censurazi_registrar_diario(integer, text, integer, integer) to authenticated;

-- Corzi do dia (o dia 1 é 26/10/2026): p_acertos são os pontos (de 0 a 1000).
create or replace function public.corzi_registrar_diario(p_dia integer, p_nick text, p_acertos integer, p_tempo integer default null)
returns void language plpgsql security definer set search_path = public as $$
declare
  hoje integer := ((now() at time zone 'utc')::date - date '2026-10-26') + 1;
begin
  if auth.uid() is null then raise exception 'Entre para registrar o resultado.'; end if;
  if p_dia is null or p_dia not between hoje - 1 and hoje + 1 then raise exception 'Esse dia já passou.'; end if;
  if p_acertos is null or p_acertos not between 0 and 1000 then raise exception 'Resultado inválido.'; end if;
  insert into public.corzi_diario (dia, user_id, nick, pontos, tempo_ms)
  values (p_dia, auth.uid(), left(coalesce(p_nick, ''), 16), p_acertos, case when p_tempo between 0 and 86400000 then p_tempo end)
  on conflict (dia, user_id) do nothing;
end $$;

grant execute on function public.corzi_registrar_diario(integer, text, integer, integer) to authenticated;

-- Ranking do dia de um jogo: os primeiros (p_limite) e, se a pessoa conectada ficou fora deles, a linha dela no fim.
-- posicao: empate em pontos e tempo divide o lugar. total: quantos jogaram no dia. eu: é a pessoa conectada.
create or replace function public.gamezi_ranking_dia(p_jogo text, p_dia integer, p_limite integer default 10)
returns table (posicao bigint, nick text, pontos integer, tempo_ms integer, eu boolean, total bigint)
language plpgsql stable security definer set search_path = public as $$
begin
  if p_jogo is null or p_jogo not in ('topzi', 'patozi', 'datazi', 'maisoumenozi', 'cravazi', 'tamanhozi', 'emojizi', 'contazi', 'memorizi', 'fotozi', 'censurazi', 'corzi') then raise exception 'Jogo desconhecido.'; end if;
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

-- Posição no ranking do Topzi e do Patozi (usada pelo jogo antigo em cache), com o mesmo desempate pelo tempo.
create or replace function public.topzi_minha_posicao(p_dia integer)
returns table (posicao bigint, total bigint) language sql stable security definer set search_path = public as $$
  select (select count(*) from public.topzi_diario d where d.dia = p_dia
           and (d.pontos > m.pontos or (d.pontos = m.pontos and coalesce(d.tempo_ms, 86400001) < coalesce(m.tempo_ms, 86400001)))) + 1,
         (select count(*) from public.topzi_diario d where d.dia = p_dia)
    from public.topzi_diario m where m.dia = p_dia and m.user_id = auth.uid();
$$;

create or replace function public.patozi_minha_posicao(p_dia integer)
returns table (posicao bigint, total bigint) language sql stable security definer set search_path = public as $$
  select (select count(*) from public.patozi_diario d where d.dia = p_dia
           and (d.pontos > m.pontos or (d.pontos = m.pontos and coalesce(d.tempo_ms, 86400001) < coalesce(m.tempo_ms, 86400001)))) + 1,
         (select count(*) from public.patozi_diario d where d.dia = p_dia)
    from public.patozi_diario m where m.dia = p_dia and m.user_id = auth.uid();
$$;

-- ═════════════════════════════ Salas online: a partida continua sem o anfitrião ═════════════════════════════
-- Quem sai da sala chama <jogo>_sair_da_sala: se era o anfitrião e ainda tem gente, o comando passa para quem
-- entrou primeiro (a sala só é apagada quando sai o último). Se o anfitrião some sem sair (fechou o app, caiu
-- a internet), o próximo da fila chama <jogo>_assumir_sala, que só passa o comando se o anfitrião não está mais
-- na sala ou se a sala está parada há 10 segundos (quem decide que ele sumiu é o jogo, pela presença).

do $$
declare
  jogo text;
  col text;
begin
  foreach jogo in array array['topzi', 'patozi', 'cravazi', 'tamanhozi', 'datazi', 'maisoumenozi', 'emojizi', 'contazi', 'memorizi', 'fotozi', 'censurazi', 'corzi'] loop
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
