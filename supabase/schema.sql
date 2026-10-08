-- Gamezi (Topzi e Patozi): banco do modo online, dos perfis e do Pato do dia.
-- Como usar: Supabase → SQL Editor → New query → cole tudo → Run. Pode rodar de novo sem problema.
--
-- A conta é do Gamezi: uma só (auth.users) para a plataforma e todos os jogos, com login em conta.html.
-- Cada jogo tem as próprias tabelas, sempre com o nome do jogo na frente (topzi_…, patozi_…).
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
    from public.patozi_salas s;

drop view if exists public.gamezi_jogadores_nas_salas;
create view public.gamezi_jogadores_nas_salas with (security_invoker = true) as
  select 'topzi'::text as jogo, p.room_code as sala, p.nick, p.user_id, p.joined_at as entrou_em
    from public.topzi_sala_jogadores p
  union all
  select 'patozi'::text, j.sala_code, j.nick, j.user_id, j.joined_at
    from public.patozi_sala_jogadores j;

comment on view public.gamezi_salas is 'Gamezi: salas online dos dois jogos (coluna jogo = topzi ou patozi)';
comment on view public.gamezi_jogadores_nas_salas is 'Gamezi: quem está em cada sala, dos dois jogos (coluna jogo)';

revoke all on public.gamezi_salas, public.gamezi_jogadores_nas_salas from anon, authenticated;

-- ───────────── atalhos com os nomes antigos do Topzi (temporários) ─────────────
-- Quem ainda está com o site antigo aberto continua jogando: profiles, rooms, room_players e matches viram
-- visões que apontam para as tabelas novas (com as mesmas regras de segurança). Podem ser apagados quando
-- todo mundo já estiver no site novo; o comando está em supabase/LEIAME.md.
do $$
declare
  par text[];
begin
  foreach par slice 1 in array array[
    ['profiles', 'topzi_perfis'], ['rooms', 'topzi_salas'], ['room_players', 'topzi_sala_jogadores'], ['matches', 'topzi_partidas']
  ] loop
    if to_regclass('public.' || par[1]) is null then
      execute format('create view public.%I with (security_invoker = true) as select * from public.%I', par[1], par[2]);
      execute format('comment on view public.%I is %L', par[1], 'Atalho temporário para ' || par[2] || ' (nome antigo do Topzi)');
      execute format('grant select, insert, update, delete on public.%I to authenticated', par[1]);
    end if;
  end loop;
end $$;

create or replace function public.limpar_salas_antigas()
returns void language sql security definer set search_path = public as $$
  select public.topzi_limpar_salas();
$$;

grant execute on function public.limpar_salas_antigas() to authenticated;
