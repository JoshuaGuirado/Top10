// Supabase de mentira para testar o modo online no navegador, sem internet.
// Banco: localStorage (compartilhado entre abas). Tempo real: BroadcastChannel.
// Cada aba tem o próprio usuário (sessionStorage). Usado só pelos testes com Playwright.
(() => {
  const DB_KEY = "__fakedb";
  const PK = {
    topzi_salas: ["code"], topzi_sala_jogadores: ["room_code", "user_id"], topzi_perfis: ["id"], topzi_partidas: ["id"],
    patozi_salas: ["code"], patozi_sala_jogadores: ["sala_code", "user_id"], patozi_perfis: ["id"], patozi_partidas: ["id"],
    patozi_diario: ["dia", "user_id"], patozi_sugestoes: ["id"], topzi_diario: ["dia", "user_id"],
    datazi_diario: ["dia", "user_id"], maisoumenozi_diario: ["dia", "user_id"],
  };
  const empty = () => Object.fromEntries(Object.keys(PK).map((k) => [k, []]));
  const load = () => ({ ...empty(), ...(JSON.parse(localStorage.getItem(DB_KEY) || "null") || {}) });
  const save = (db) => localStorage.setItem(DB_KEY, JSON.stringify(db));
  const now = () => new Date().toISOString();

  class Query {
    constructor(table) { this.t = table; this.op = "select"; this.filters = []; this.sort = null; this.max = null; this.one = false; }
    select() { return this; }
    insert(row) { this.op = "insert"; this.payload = row; return this; }
    upsert(row) { this.op = "upsert"; this.payload = row; return this; }
    update(obj) { this.op = "update"; this.payload = obj; return this; }
    delete() { this.op = "delete"; return this; }
    eq(c, v) { this.filters.push([c, v]); return this; }
    order(c, o = {}) { this.sort = [c, o.ascending !== false]; return this; }
    limit(n) { this.max = n; return this; }
    maybeSingle() { this.one = true; return this; }
    then(ok, fail) { return new Promise((r) => setTimeout(r, 15)).then(() => this.run()).then(ok, fail); }
    run() {
      const db = load();
      const rows = db[this.t];
      const key = (r) => PK[this.t].map((k) => r[k]).join("|");
      const hit = (r) => this.filters.every(([c, v]) => r[c] === v);
      if (this.op === "insert" || this.op === "upsert") {
        const r = { created_at: now(), joined_at: now(), updated_at: now(), ...this.payload };
        if (this.t === "topzi_partidas" || this.t === "patozi_partidas" || this.t === "patozi_sugestoes") r.id = rows.length + 1;
        const old = rows.find((x) => key(x) === key(r));
        if (old && this.op === "insert") return { data: null, error: { code: "23505", message: "duplicate key" } };
        if (old) Object.assign(old, this.payload, { updated_at: now() });
        else {
          if (this.t === "topzi_sala_jogadores" && rows.filter((x) => x.room_code === r.room_code).length >= 8) return { data: null, error: { message: "A sala está cheia" } };
          if (this.t === "patozi_sala_jogadores" && rows.filter((x) => x.sala_code === r.sala_code).length >= 10) return { data: null, error: { message: "A sala está cheia" } };
          rows.push(r);
        }
        save(db);
        return { data: r, error: null };
      }
      if (this.op === "update") {
        rows.filter(hit).forEach((r) => Object.assign(r, this.payload, { updated_at: now() }));
        save(db);
        return { data: null, error: null };
      }
      if (this.op === "delete") {
        const gone = rows.filter(hit);
        db[this.t] = rows.filter((r) => !hit(r));
        if (this.t === "topzi_salas") gone.forEach((g) => (db.topzi_sala_jogadores = db.topzi_sala_jogadores.filter((p) => p.room_code !== g.code)));
        if (this.t === "patozi_salas") gone.forEach((g) => (db.patozi_sala_jogadores = db.patozi_sala_jogadores.filter((p) => p.sala_code !== g.code)));
        save(db);
        return { data: null, error: null };
      }
      let out = rows.filter(hit);
      if (this.sort) {
        const [c, asc] = this.sort;
        out = out.slice().sort((a, b) => (a[c] > b[c] ? 1 : a[c] < b[c] ? -1 : 0) * (asc ? 1 : -1));
      }
      if (this.max) out = out.slice(0, this.max);
      return { data: this.one ? out[0] || null : out, error: null };
    }
  }

  class Channel {
    constructor(name, opts) {
      this.key = opts && opts.config && opts.config.presence && opts.config.presence.key;
      this.handlers = [];
      this.seen = {};
      this.bc = new BroadcastChannel("fake-" + name);
      this.bc.onmessage = (e) => this.receive(e.data);
    }
    on(type, filter, cb) { this.handlers.push({ type, filter, cb }); return this; }
    subscribe(cb) {
      setTimeout(() => cb && cb("SUBSCRIBED"), 40);
      this.beat = setInterval(() => {
        if (this.tracked) {
          this.seen[this.key] = Date.now(); // como no Supabase, quem está na sala se vê na presença
          this.post({ kind: "here", key: this.key });
        }
        this.firePresence();
      }, 1000);
      return this;
    }
    async track() {
      this.tracked = true;
      this.seen[this.key] = Date.now();
      this.post({ kind: "here", key: this.key });
      this.post({ kind: "ask" });
      this.firePresence();
    }
    presenceState() {
      const out = {};
      Object.entries(this.seen).forEach(([k, t]) => { if (Date.now() - t < 3500) out[k] = [{}]; });
      return out;
    }
    send({ event, payload }) { this.post({ kind: "broadcast", event, payload }); return Promise.resolve("ok"); }
    post(m) { this.bc.postMessage(JSON.parse(JSON.stringify(m))); }
    receive(m) {
      if (m.kind === "broadcast") this.handlers.filter((h) => h.type === "broadcast" && h.filter.event === m.event).forEach((h) => h.cb({ payload: m.payload }));
      if (m.kind === "here") { this.seen[m.key] = Date.now(); this.firePresence(); }
      if (m.kind === "ask" && this.tracked) this.post({ kind: "here", key: this.key });
      if (m.kind === "bye") { delete this.seen[m.key]; this.firePresence(); }
    }
    firePresence() { this.handlers.filter((h) => h.type === "presence").forEach((h) => h.cb()); }
    close() { this.post({ kind: "bye", key: this.key }); clearInterval(this.beat); this.bc.close(); }
  }

  const listeners = [];
  const session = (id) => {
    const email = Object.keys(users()).find((e) => users()[e].id === id) || null;
    return { user: { id, email, is_anonymous: !email } };
  };
  // Contas com e-mail e senha (sem confirmação de e-mail, como no projeto configurado).
  const users = () => JSON.parse(localStorage.getItem("__fakeusers") || "{}");
  // Como o Supabase de verdade, guarda a sessão de quem tem conta no localStorage (sb-…-auth-token):
  // é por ela que o portal e os jogos sabem que a conta do Gamezi está conectada.
  const TOKEN = "sb-falso-auth-token";
  const signIn = (id) => {
    sessionStorage.setItem("__fakeuid", id);
    localStorage.setItem(TOKEN, JSON.stringify({ user: session(id).user }));
    setTimeout(() => listeners.forEach((l) => l("SIGNED_IN", session(id))), 0);
    return { data: { session: session(id), user: session(id).user }, error: null };
  };
  const client = {
    from: (t) => new Query(t),
    // Funções do banco usadas pelos jogos (as outras não fazem nada).
    rpc: (nome, a = {}) => new Promise((r) => setTimeout(r, 15)).then(() => {
      const uid = sessionStorage.getItem("__fakeuid");
      const db = load();
      if (nome === "patozi_registrar_diario") {
        const pontos = a.p_chutes.reduce((s, x) => s + window.pzDiarioPontos(x.chute, window.pzCarta(x.carta).resposta), 0);
        if (!db.patozi_diario.some((x) => x.dia === a.p_dia && x.user_id === uid)) db.patozi_diario.push({ dia: a.p_dia, user_id: uid, nick: a.p_nick, pontos, chutes: a.p_chutes, tempo_ms: a.p_tempo ?? null, created_at: now() });
        save(db);
        return { data: pontos, error: null };
      }
      if (nome === "topzi_registrar_diario") {
        if (!db.topzi_diario.some((x) => x.dia === a.p_dia && x.user_id === uid)) db.topzi_diario.push({ dia: a.p_dia, user_id: uid, nick: a.p_nick, lista: a.p_lista, pontos: a.p_pontos, acertos: a.p_acertos, tempo_ms: a.p_tempo ?? null, created_at: now() });
        save(db);
        return { data: null, error: null };
      }
      if (nome === "datazi_registrar_diario" || nome === "maisoumenozi_registrar_diario") {
        const tabela = nome.replace("_registrar_diario", "_diario");
        if (!uid) return { data: null, error: { message: "Entre para registrar o resultado." } };
        if (!db[tabela].some((x) => x.dia === a.p_dia && x.user_id === uid)) db[tabela].push({ dia: a.p_dia, user_id: uid, nick: a.p_nick, pontos: a.p_acertos, tempo_ms: a.p_tempo ?? null, created_at: now() });
        save(db);
        return { data: null, error: null };
      }
      // Salas: quem sai passa o comando para quem entrou primeiro; quem fica assume se o anfitrião sumiu.
      if (/^(topzi|patozi)_(sair_da_sala|assumir_sala)$/.test(nome)) {
        const jogo = nome.split("_")[0];
        const col = jogo === "topzi" ? "room_code" : "sala_code";
        const salas = db[jogo + "_salas"];
        const s = salas.find((x) => x.code === a.p_code);
        const membros = () => db[jogo + "_sala_jogadores"].filter((p) => p[col] === a.p_code).sort((x, y) => String(x.joined_at).localeCompare(String(y.joined_at)));
        if (nome.endsWith("sair_da_sala")) {
          if (!s) return { data: null, error: null };
          db[jogo + "_sala_jogadores"] = db[jogo + "_sala_jogadores"].filter((p) => !(p[col] === a.p_code && p.user_id === uid));
          if (s.host_id !== uid) { save(db); return { data: s.host_id, error: null }; }
          const novo = membros()[0];
          if (!novo) {
            db[jogo + "_salas"] = salas.filter((x) => x !== s);
            save(db);
            return { data: null, error: null };
          }
          Object.assign(s, { host_id: novo.user_id, updated_at: now() });
          save(db);
          return { data: novo.user_id, error: null };
        }
        if (!s) return { data: false, error: null };
        if (s.host_id === uid) return { data: true, error: null };
        if (!membros().some((p) => p.user_id === uid)) return { data: false, error: null };
        if (membros().some((p) => p.user_id === s.host_id) && Date.now() - new Date(s.updated_at).getTime() < 10000) return { data: false, error: null };
        Object.assign(s, { host_id: uid, updated_at: now() });
        save(db);
        return { data: true, error: null };
      }
      // Como gamezi_ranking_dia do schema.sql: mais pontos na frente; no empate, menos tempo (sem tempo fica atrás).
      if (nome === "gamezi_ranking_dia") {
        const sem = 864e5 + 1;
        const rows = db[a.p_jogo + "_diario"].filter((x) => x.dia === a.p_dia)
          .sort((x, y) => y.pontos - x.pontos || (x.tempo_ms ?? sem) - (y.tempo_ms ?? sem) || String(x.created_at).localeCompare(String(y.created_at)));
        const out = rows.map((x, i) => ({
          posicao: rows.findIndex((y) => y.pontos === x.pontos && (y.tempo_ms ?? sem) === (x.tempo_ms ?? sem)) + 1,
          nick: x.nick, pontos: x.pontos, tempo_ms: x.tempo_ms ?? null, eu: !!uid && x.user_id === uid, total: rows.length, ordem: i + 1,
        })).filter((x) => x.ordem <= (a.p_limite || 10) || x.eu);
        return { data: out, error: null };
      }
      if (nome === "patozi_minha_posicao" || nome === "topzi_minha_posicao") {
        const rows = db[nome.startsWith("patozi") ? "patozi_diario" : "topzi_diario"].filter((x) => x.dia === a.p_dia);
        const eu = rows.find((x) => x.user_id === uid);
        return { data: eu ? [{ posicao: rows.filter((x) => x.pontos > eu.pontos).length + 1, total: rows.length }] : [], error: null };
      }
      return { data: null, error: null };
    }),
    channel: (name, opts) => new Channel(name, opts),
    removeChannel: (ch) => ch.close(),
    auth: {
      async getSession() {
        const id = sessionStorage.getItem("__fakeuid");
        return { data: { session: id ? session(id) : null } };
      },
      async signInAnonymously() {
        const id = crypto.randomUUID();
        sessionStorage.setItem("__fakeuid", id);
        setTimeout(() => listeners.forEach((l) => l("SIGNED_IN", session(id))), 0);
        return { data: { session: session(id) }, error: null };
      },
      onAuthStateChange(cb) { listeners.push(cb); return { data: { subscription: { unsubscribe() {} } } }; },
      async signUp({ email, password }) {
        const all = users();
        if (all[email]) return { data: {}, error: { message: "User already registered" } };
        all[email] = { id: crypto.randomUUID(), password };
        localStorage.setItem("__fakeusers", JSON.stringify(all));
        return signIn(all[email].id);
      },
      async signInWithPassword({ email, password }) {
        const u = users()[email];
        if (!u || u.password !== password) return { data: {}, error: { message: "Invalid login credentials" } };
        return signIn(u.id);
      },
      async resetPasswordForEmail() { return { data: {}, error: null }; },
      async updateUser({ password } = {}) {
        const id = sessionStorage.getItem("__fakeuid");
        const all = users();
        const email = Object.keys(all).find((e) => all[e].id === id);
        if (password && email) { all[email].password = password; localStorage.setItem("__fakeusers", JSON.stringify(all)); }
        return { data: { user: session(id).user }, error: null };
      },
      async signOut() { sessionStorage.removeItem("__fakeuid"); localStorage.removeItem(TOKEN); return { error: null }; },
    },
  };
  window.supabase = { createClient: () => client };
})();
