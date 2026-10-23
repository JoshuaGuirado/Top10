-- Online novo: Datazi online, Maiorzi online e a skin de quem está nas salas do Datazi, do Tamanhozi e do Maiorzi.
-- Só o que é novo (o resto do schema.sql já rodou antes). Pode rodar de novo sem problema; o schema.sql inteiro também tem tudo isto.

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

-- Skin de quem está na sala (Datazi, Tamanhozi e Maiorzi). Entrou depois: add column if not exists.
alter table public.datazi_sala_jogadores add column if not exists skin jsonb check (skin is null or (jsonb_typeof(skin) = 'object' and octet_length(skin::text) <= 1500));
alter table public.tamanhozi_sala_jogadores add column if not exists skin jsonb check (skin is null or (jsonb_typeof(skin) = 'object' and octet_length(skin::text) <= 1500));

comment on table public.datazi_salas is 'Datazi: salas online';
comment on table public.datazi_sala_jogadores is 'Datazi: jogadores de cada sala online (com a skin)';
comment on table public.datazi_partidas is 'Datazi: histórico das partidas online (com o modo de jogo)';
comment on table public.maisoumenozi_salas is 'Maiorzi: salas online';
comment on table public.maisoumenozi_sala_jogadores is 'Maiorzi: jogadores de cada sala online (com a skin)';
comment on table public.maisoumenozi_partidas is 'Maiorzi: histórico das partidas online';

-- Nick com palavrão vira "Jogador" (função do schema.sql).
drop trigger if exists datazi_sala_jogadores_nick_limpo on public.datazi_sala_jogadores;
create trigger datazi_sala_jogadores_nick_limpo before insert or update of nick on public.datazi_sala_jogadores
  for each row execute function public.gamezi_limpar_nick();
drop trigger if exists maisoumenozi_sala_jogadores_nick_limpo on public.maisoumenozi_sala_jogadores;
create trigger maisoumenozi_sala_jogadores_nick_limpo before insert or update of nick on public.maisoumenozi_sala_jogadores
  for each row execute function public.gamezi_limpar_nick();

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
    from public.maisoumenozi_salas m;

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
    from public.maisoumenozi_sala_jogadores m;

comment on view public.gamezi_salas is 'Gamezi: salas online dos jogos (coluna jogo = topzi, patozi, cravazi, tamanhozi, datazi ou maisoumenozi)';
comment on view public.gamezi_jogadores_nas_salas is 'Gamezi: quem está em cada sala, de todos os jogos (coluna jogo)';

revoke all on public.gamezi_salas, public.gamezi_jogadores_nas_salas from anon, authenticated;

-- Quem sai da sala passa o comando para quem entrou primeiro; quem fica assume se o anfitrião sumiu.
do $$
declare
  jogo text;
  col text;
begin
  foreach jogo in array array['datazi', 'maisoumenozi'] loop
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
