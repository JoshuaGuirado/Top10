// Banco (Supabase): login anônimo para o online, perfil do Patozi, ranking do Pato do dia e cartas enviadas.
// A conta (e-mail e senha) é a do Gamezi, a mesma de todos os jogos: fica em conta.html, na raiz.
// O projeto é o mesmo do Topzi (as chaves vêm de topzi/js/config.js). Tabelas do Patozi:
// patozi_perfis, patozi_diario, patozi_sugestoes, patozi_salas, patozi_sala_jogadores e patozi_partidas
// (ver supabase/schema.sql).

const SUPABASE_CDN = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js";
const PZ_PERFIL_CHAVES = ["stats", "diario", "nick", "cor", "pato"];

let sb = null;
let me = null; // { id, email, anon }
let perfilCarregadoPara = null;

function onlineConfigured() {
  return typeof SUPABASE_URL === "string" && !!SUPABASE_URL && typeof SUPABASE_ANON_KEY === "string" && !!SUPABASE_ANON_KEY;
}

function myId() {
  return me ? me.id : null;
}

function loadSupabase() {
  if (window.supabase) return Promise.resolve();
  return new Promise((ok, fail) => {
    const s = document.createElement("script");
    s.src = SUPABASE_CDN;
    s.onload = ok;
    s.onerror = () => fail(new Error(t("on.errNet")));
    document.head.appendChild(s);
  });
}

function setMe(session) {
  const u = session && session.user;
  me = u ? { id: u.id, email: u.email || null, anon: !!u.is_anonymous || !u.email } : null;
}

let onlineReady = null;

// Conecta e garante um login (anônimo, se a pessoa não tem conta). Chamadas juntas esperam a mesma conexão.
function ensureOnline() {
  if (!onlineConfigured()) return Promise.reject(new Error(t("on.errSetup")));
  if (!onlineReady) onlineReady = conectar().catch((err) => { onlineReady = null; throw err; });
  return onlineReady;
}

async function conectar() {
  if (!sb) {
    await loadSupabase();
    sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
    sb.auth.onAuthStateChange((event, session) => {
      setMe(session);
      renderConta();
      if (me && !me.anon && (event === "SIGNED_IN" || event === "USER_UPDATED") && perfilCarregadoPara !== me.id) {
        perfilCarregadoPara = me.id;
        setTimeout(carregarPerfil, 0);
      }
    });
  }
  const { data } = await sb.auth.getSession();
  let session = data.session;
  if (!session) {
    const res = await sb.auth.signInAnonymously();
    if (res.error) throw new Error(t("on.errAnon"));
    session = res.data.session;
  }
  setMe(session);
  return me;
}

// ───────────── perfil na conta ─────────────

let perfilTimer = null;

store.onWrite = (key) => {
  if (PZ_PERFIL_CHAVES.includes(key) && sb && me && !me.anon) {
    clearTimeout(perfilTimer);
    perfilTimer = setTimeout(salvarPerfil, 1500);
  }
};

async function salvarPerfil() {
  if (!sb || !me || me.anon) return;
  await sb.from("patozi_perfis").upsert({
    id: me.id,
    nick: (store("nick") || "").trim().slice(0, 16),
    data: { stats: store("stats"), diario: store("diario"), cor: store("cor"), pato: store("pato") },
  });
}

// Junta o que está na conta com o que está neste aparelho (nada se perde).
function juntarPerfil(remoto) {
  const d = remoto.data || {};
  if (remoto.nick && !store("nick")) store("nick", remoto.nick);
  if (Number.isInteger(d.cor) && store("cor") == null) store("cor", d.cor);
  if (d.pato && typeof d.pato === "object" && store("pato") == null) store("pato", patoLimpo(d.pato));
  const local = loadStats();
  if (d.stats && (d.stats.partidas || 0) + (d.stats.diarios || 0) > local.partidas + local.diarios) store("stats", d.stats);
  store("diario", { ...(d.diario || {}), ...(store("diario") || {}) });
}

async function carregarPerfil() {
  if (!sb || !me || me.anon) return;
  const { data } = await sb.from("patozi_perfis").select("*").eq("id", me.id).maybeSingle();
  if (data) juntarPerfil(data);
  await salvarPerfil();
  if (typeof aoMudarPerfil === "function") aoMudarPerfil();
}

// ───────────── Pato do dia e cartas enviadas ─────────────

// Erro do banco em texto para a pessoa. Tabela que não existe: o schema.sql ainda não rodou no Supabase.
function erroDoBanco(error) {
  const m = (error && error.message) || "";
  if (error && (error.code === "42P01" || error.code === "PGRST205" || /does not exist|could not find the table/i.test(m))) return new Error(t("on.errDb"));
  return new Error(m || t("on.errNet"));
}

// O banco calcula os pontos a partir dos chutes (patozi_registrar_diario) e guarda o tempo, que desempata o
// ranking. Banco sem o tempo (schema.sql antigo): registra sem ele; sem a função: grava direto, como antes.
async function enviarDiario(dia, reg) {
  await ensureOnline();
  const nick = (store("nick") || "").trim().slice(0, 16) || "Pato";
  const chutes = pzDiarioCartas(dia).map((carta, k) => ({ carta, chute: reg.chutes[k] }));
  const semFuncao = (error) => error && (error.code === "PGRST202" || /could not find the function/i.test(error.message || ""));
  let { error } = await sb.rpc("patozi_registrar_diario", { p_dia: dia, p_nick: nick, p_chutes: chutes, p_tempo: gameziTempoValido(reg.ms) });
  if (semFuncao(error)) ({ error } = await sb.rpc("patozi_registrar_diario", { p_dia: dia, p_nick: nick, p_chutes: chutes }));
  if (semFuncao(error)) {
    ({ error } = await sb.from("patozi_diario").insert({ dia, user_id: me.id, nick, pontos: diarioTotal(reg), chutes: reg.chutes }));
  }
  if (error && error.code !== "23505") throw erroDoBanco(error);
}

async function enviarSugestao(pergunta, resposta, fonte, tema) {
  await ensureOnline();
  const { error } = await sb.from("patozi_sugestoes").insert({ user_id: me.id, nick: (store("nick") || "").slice(0, 16), pergunta, resposta, fonte, tema, idioma: lang });
  if (error) throw erroDoBanco(error);
}

// ───────────── conta do Gamezi ─────────────
// A conta é do Gamezi (uma só para todos os jogos): entrar, criar conta, trocar senha e sair ficam em
// ../conta.html (ver gamezi-conta.js). Aqui o Patozi só mostra quem está conectado e leva para lá.

function contaEmail() {
  if (me) return me.anon ? null : me.email;
  const s = gameziSessao();
  return s && !s.anon ? s.email : null;
}

function linhaConta() {
  if (!onlineConfigured()) return escapeHtml(t("account.needSetup"));
  const email = contaEmail();
  if (email) return t("account.connected", { email: `<b>${escapeHtml(email)}</b>` });
  return escapeHtml(t("account.pitch"));
}

function renderConta() {
  document.querySelectorAll(".account-line").forEach((el) => (el.innerHTML = linhaConta()));
  document.querySelectorAll(".account-btn").forEach((b) => {
    b.hidden = !onlineConfigured();
    b.textContent = t(contaEmail() ? "account.mine" : b.dataset.label || "account.enter");
  });
}

// Vai para a conta do Gamezi, que volta para o Patozi depois do login. Antes, salva o perfil (sem demorar).
async function abrirConta() {
  clearTimeout(perfilTimer);
  await Promise.race([salvarPerfil().catch(() => {}), new Promise((r) => setTimeout(r, 1500))]);
  location.href = gameziContaUrl("../", "patozi");
}

// Quem já entrou na conta do Gamezi (aqui ou em outro jogo) conecta sozinho e traz o perfil da conta.
// Quem só tem o login anônimo do online também reconecta, para voltar para a sala.
function conectarSeJaTemConta() {
  if (!onlineConfigured() || !gameziSessao()) return;
  ensureOnline().then(() => {
    renderConta();
    if (me && !me.anon && perfilCarregadoPara !== me.id) {
      perfilCarregadoPara = me.id;
      return carregarPerfil();
    }
  }).catch(() => {});
}
