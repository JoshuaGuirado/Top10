// Banco (Supabase): login, conta com e-mail e senha, perfil do Patozi, ranking do Pato do dia e cartas enviadas.
// É o mesmo projeto e a mesma conta do Topzi (as chaves vêm de topzi/js/config.js). Tabelas do Patozi:
// patozi_perfis, patozi_diario, patozi_sugestoes, patozi_salas, patozi_sala_jogadores e patozi_partidas
// (ver supabase/schema.sql).

const SUPABASE_CDN = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js";
const PZ_PERFIL_CHAVES = ["stats", "diario", "nick", "cor"];

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
      if (event === "PASSWORD_RECOVERY") setTimeout(() => abrirConta("password"), 0);
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
    data: { stats: store("stats"), diario: store("diario"), cor: store("cor") },
  });
}

// Junta o que está na conta com o que está neste aparelho (nada se perde).
function juntarPerfil(remoto) {
  const d = remoto.data || {};
  if (remoto.nick && !store("nick")) store("nick", remoto.nick);
  if (Number.isInteger(d.cor) && store("cor") == null) store("cor", d.cor);
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

async function enviarDiario(dia, reg) {
  await ensureOnline();
  const nick = (store("nick") || "").trim().slice(0, 16) || "Pato";
  const { error } = await sb.from("patozi_diario").insert({ dia, user_id: me.id, nick, pontos: diarioTotal(reg), chutes: reg.chutes });
  if (error && error.code !== "23505") throw new Error(error.message);
}

async function buscarRanking(dia) {
  await ensureOnline();
  const { data, error } = await sb.from("patozi_diario").select("*").eq("dia", dia).order("pontos", { ascending: false }).limit(20);
  if (error) throw new Error(t("on.errNet"));
  return data || [];
}

async function enviarSugestao(pergunta, resposta, fonte) {
  await ensureOnline();
  const { error } = await sb.from("patozi_sugestoes").insert({ user_id: me.id, nick: (store("nick") || "").slice(0, 16), pergunta, resposta, fonte, idioma: lang });
  if (error) throw new Error(error.message);
}

// ───────────── conta (e-mail e senha) ─────────────

function linhaConta() {
  if (!onlineConfigured()) return escapeHtml(t("account.needSetup"));
  if (me && !me.anon) return t("account.connected", { email: `<b>${escapeHtml(me.email)}</b>` });
  return escapeHtml(t("account.pitch"));
}

function renderConta() {
  document.querySelectorAll(".account-line").forEach((el) => (el.innerHTML = linhaConta()));
  document.querySelectorAll(".account-btn").forEach((b) => {
    b.hidden = !onlineConfigured();
    b.textContent = t(me && !me.anon ? "account.mine" : "account.enter");
  });
}

function contaMsg(texto, bom) {
  const m = $("account-msg");
  m.className = "feedback" + (bom ? " good" : " bad");
  m.textContent = texto;
}

async function abrirConta(modoConta) {
  $("account-msg").textContent = "";
  try {
    await ensureOnline();
  } catch (e) {
    contaMsg(e.message);
  }
  const logado = me && !me.anon;
  const novaSenha = modoConta === "password" && logado;
  $("account-status").innerHTML = novaSenha ? escapeHtml(t("account.recovery")) : linhaConta();
  $("account-form").hidden = logado;
  $("password-form").hidden = !novaSenha;
  $("account-logged").hidden = !logado || novaSenha;
  if (!$("account-dialog").open) $("account-dialog").showModal();
}

function lerFormConta() {
  const email = $("account-email").value.trim();
  const password = $("account-password").value;
  if (!/^\S+@\S+\.\S+$/.test(email)) return contaMsg(t("account.errEmail"));
  if (password.length < 6) return contaMsg(t("account.errPassword"));
  return { email, password };
}

async function contaEntrar(e) {
  e.preventDefault();
  const form = lerFormConta();
  if (!form) return;
  const criar = e.submitter && e.submitter.value === "criar";
  try {
    await ensureOnline();
    const res = criar ? await sb.auth.signUp(form) : await sb.auth.signInWithPassword(form);
    if (res.error) {
      const m = res.error.message || "";
      if (/already|registered|exists/i.test(m)) return contaMsg(t("account.errTaken"));
      if (/invalid login|credentials/i.test(m)) return contaMsg(t("account.errLogin"));
      if (/not confirmed/i.test(m)) return contaMsg(t("account.errConfirm"));
      if (/password/i.test(m) && /least|short|weak/i.test(m)) return contaMsg(t("account.errPassword"));
      return contaMsg(m);
    }
    if (!res.data.session) return contaMsg(t("account.needConfirm", { email: form.email }), true);
    setMe(res.data.session);
    perfilCarregadoPara = me.id;
    await carregarPerfil();
    renderConta();
    $("account-password").value = "";
    await abrirConta();
    contaMsg(t(criar ? "account.created" : "account.loggedIn"), true);
  } catch (err) {
    contaMsg(err.message);
  }
}

async function contaEsqueci() {
  const email = $("account-email").value.trim();
  if (!/^\S+@\S+\.\S+$/.test(email)) return contaMsg(t("account.errEmail"));
  try {
    await ensureOnline();
    const res = await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname });
    if (res.error) return contaMsg(res.error.message);
    contaMsg(t("account.sentReset", { email }), true);
  } catch (err) {
    contaMsg(err.message);
  }
}

async function contaNovaSenha(e) {
  e.preventDefault();
  const password = $("new-password").value;
  if (password.length < 6) return contaMsg(t("account.errPassword"));
  const res = await sb.auth.updateUser({ password });
  if (res.error) return contaMsg(res.error.message);
  $("new-password").value = "";
  await abrirConta();
  contaMsg(t("account.passwordSaved"), true);
}

async function contaSair() {
  if (!sb) return;
  await salvarPerfil();
  await sb.auth.signOut();
  me = null;
  onlineReady = null;
  $("account-dialog").close();
  renderConta();
}

// Quem já tem sessão (de uma conta ou do Topzi) conecta sozinho, sem esperar um clique.
function conectarSeJaTemConta() {
  if (!onlineConfigured()) return;
  let temSessao = false;
  try {
    temSessao = Object.keys(localStorage).some((k) => /^sb-.*-auth-token$/.test(k)) || /access_token|type=recovery/.test(location.hash);
  } catch (e) { /* sem armazenamento */ }
  if (temSessao) ensureOnline().then(renderConta, () => {});
}
