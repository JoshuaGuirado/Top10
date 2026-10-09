// Ranking do dia de todos os jogos do Gamezi (Topzi, Patozi, Datazi e Maisoumenozi) e do portal (ranking.html).
// Quem faz mais pontos no desafio do dia fica na frente; no empate, quem levou menos tempo. Quem ordena é o
// banco (gamezi_ranking_dia, em supabase/schema.sql); aqui só buscamos e desenhamos.
// Precisa de SUPABASE_URL e SUPABASE_ANON_KEY (topzi/js/config.js). O Topzi e o Patozi já têm o próprio
// cliente do Supabase e o passam para cá; o Datazi, o Maisoumenozi e o portal usam gameziCliente().

var GAMEZI_SUPABASE_CDN = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js";
var GAMEZI_RANKING_LIMITE = 10;
var GAMEZI_TEMPO_MAX = 864e5; // o banco não guarda tempo acima de 24 horas

// Textos em [português, inglês, espanhol].
var GAMEZI_RANKING_TEXTOS = {
  titulo: ["Ranking de hoje", "Today's ranking", "Ranking de hoy"],
  carregando: ["Carregando o ranking…", "Loading the ranking…", "Cargando el ranking…"],
  vazio: ["Ninguém jogou ainda hoje. Seja o primeiro!", "Nobody has played today yet. Be the first!", "Nadie ha jugado hoy todavía. ¡Sé el primero!"],
  posicao: ["Você ficou em {pos}º de {total} hoje", "You placed #{pos} of {total} today", "Quedaste {pos}.º de {total} hoy"],
  curta: ["{pos}º de {total}", "#{pos} of {total}", "{pos}.º de {total}"],
  voce: ["você", "you", "tú"],
  desempate: ["Empate em pontos: na frente quem levou menos tempo.", "Tied on points: the faster player goes first.", "Empate en puntos: adelante quien tardó menos."],
  nome: ["Seu nome no ranking", "Your name in the ranking", "Tu nombre en el ranking"],
  entrar: ["Entrar no ranking", "Join the ranking", "Entrar al ranking"],
  erro: ["Não deu para carregar o ranking.", "Couldn't load the ranking.", "No se pudo cargar el ranking."],
};

function gameziRankingTexto(chave, l, vars) {
  var i = ["pt", "en", "es"].indexOf(l);
  var s = GAMEZI_RANKING_TEXTOS[chave][i < 0 ? 0 : i];
  for (var k in vars || {}) s = s.split("{" + k + "}").join(vars[k]);
  return s;
}

function gameziEsc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}

// Tempo em ms → "48s" ou "2:05" (ou "1h02" para quem deixou o jogo aberto).
function gameziTempo(ms) {
  if (typeof ms !== "number" || !(ms >= 0)) return "";
  var s = Math.round(ms / 1000);
  if (s < 60) return s + "s";
  var m = Math.floor(s / 60);
  if (m < 60) return m + ":" + String(s % 60).padStart(2, "0");
  return Math.floor(m / 60) + "h" + String(m % 60).padStart(2, "0");
}

// Tempo que vai para o banco: inteiro, de 0 a 24 horas (ou null, sem tempo).
function gameziTempoValido(ms) {
  return typeof ms === "number" && ms >= 0 ? Math.min(Math.round(ms), GAMEZI_TEMPO_MAX) : null;
}

// Nome para o ranking: o do próprio jogo ou o usado em outro jogo do Gamezi neste aparelho.
function gameziNick(proprio) {
  var lidos = [proprio, gameziRankingLer("pz:nick"), gameziRankingLer("dz:nick"), gameziRankingLer("mm:nick")];
  var jogadores = gameziRankingLer("tt:players");
  if (jogadores && jogadores[0]) lidos.push(jogadores[0].nick);
  for (var i = 0; i < lidos.length; i++) {
    var n = typeof lidos[i] === "string" ? lidos[i].trim().slice(0, 16) : "";
    if (n) return n;
  }
  return "";
}

function gameziRankingLer(chave) {
  try { return JSON.parse(localStorage.getItem(chave)); } catch (e) { return null; }
}

// ───────────── conexão (Datazi, Maisoumenozi e portal) ─────────────

var gameziSb = null;
var gameziSbPronto = null;
var gameziLoginPronto = null;

function gameziRankingLigado() {
  return typeof SUPABASE_URL === "string" && !!SUPABASE_URL && typeof SUPABASE_ANON_KEY === "string" && !!SUPABASE_ANON_KEY;
}

// Cliente do Supabase (baixa a biblioteca na primeira vez). login: entra como anônimo se não houver sessão,
// como o Topzi e o Patozi fazem para registrar o resultado (o portal só lê, sem login).
function gameziCliente(login) {
  if (!gameziRankingLigado()) return Promise.reject(new Error("offline"));
  if (!gameziSbPronto) {
    gameziSbPronto = new Promise(function (ok, falha) {
      if (window.supabase) return ok();
      var s = document.createElement("script");
      s.src = GAMEZI_SUPABASE_CDN;
      s.onload = ok;
      s.onerror = function () { falha(new Error("rede")); };
      document.head.appendChild(s);
    }).then(function () {
      gameziSb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
      });
      return gameziSb;
    }).catch(function (e) { gameziSbPronto = null; throw e; });
  }
  if (!login) return gameziSbPronto;
  if (!gameziLoginPronto) {
    gameziLoginPronto = gameziSbPronto.then(function (sb) {
      return sb.auth.getSession().then(function (r) {
        if (r.data && r.data.session) return sb;
        return sb.auth.signInAnonymously().then(function (a) {
          if (a.error) throw new Error(a.error.message);
          return sb;
        });
      });
    }).catch(function (e) { gameziLoginPronto = null; throw e; });
  }
  return gameziLoginPronto;
}

// ───────────── ler e desenhar ─────────────

// Ranking do dia de um jogo: { linhas: [{ posicao, nick, pontos, tempo_ms, eu }], eu: { posicao, total } | null, total }.
// linhas traz os primeiros; quem está conectado e ficou fora deles aparece só em eu.
function gameziRankingBuscar(sb, jogo, dia, limite) {
  limite = limite || GAMEZI_RANKING_LIMITE;
  return sb.rpc("gamezi_ranking_dia", { p_jogo: jogo, p_dia: dia, p_limite: limite }).then(function (r) {
    if (r.error) throw new Error(r.error.message || "erro");
    var todas = (r.data || []).map(function (x) {
      return { posicao: Number(x.posicao), nick: x.nick, pontos: Number(x.pontos), tempo_ms: x.tempo_ms == null ? null : Number(x.tempo_ms), eu: !!x.eu, total: Number(x.total) };
    });
    var minha = todas.filter(function (x) { return x.eu; })[0];
    return {
      linhas: todas.slice(0, limite),
      eu: minha ? { posicao: minha.posicao, total: minha.total } : null,
      total: todas.length ? todas[0].total : 0,
    };
  });
}

// Linhas do ranking (o mesmo desenho em todos os jogos: posição, nome, tempo e pontos).
function gameziRankingLinhas(linhas, l) {
  return linhas.map(function (r) {
    return '<div class="lb-row' + (r.eu ? " me" : "") + '"><span>' + r.posicao + "</span><b>" + gameziEsc(r.nick || "?") +
      (r.eu ? ' <small class="muted">(' + gameziEsc(gameziRankingTexto("voce", l)) + ")</small>" : "") + "</b>" +
      '<i class="lb-time">' + gameziEsc(gameziTempo(r.tempo_ms)) + "</i><em>" + r.pontos + "</em></div>";
  }).join("");
}

// Desenha o ranking do dia em box. cliente: Promise do cliente do Supabase. Devolve a Promise do resultado
// (ou null, se não deu para carregar: aí o box some, como antes).
function gameziRankingDesenhar(box, cliente, jogo, dia, l) {
  if (!box) return Promise.resolve(null);
  var titulo = "<h3>" + gameziEsc(gameziRankingTexto("titulo", l)) + "</h3>";
  box.hidden = false;
  box.innerHTML = titulo + '<p class="small muted">' + gameziEsc(gameziRankingTexto("carregando", l)) + "</p>";
  return Promise.resolve(cliente).then(function (sb) {
    return gameziRankingBuscar(sb, jogo, dia);
  }).then(function (res) {
    box.innerHTML = titulo +
      (res.eu ? '<p class="lb-pos">' + gameziEsc(gameziRankingTexto("posicao", l, { pos: res.eu.posicao, total: res.eu.total })) + "</p>" : "") +
      (res.linhas.length
        ? gameziRankingLinhas(res.linhas, l) + '<p class="small muted lb-note">' + gameziEsc(gameziRankingTexto("desempate", l)) + "</p>"
        : '<p class="small muted">' + gameziEsc(gameziRankingTexto("vazio", l)) + "</p>");
    return res;
  }, function () {
    box.hidden = true;
    return null;
  });
}

// ───────────── Datazi e Maisoumenozi: mandar o resultado do dia ─────────────

// Manda o resultado de hoje (uma vez: reg.enviado) e desenha o ranking do dia em box. Sem nome para o ranking,
// pede um antes (fica guardado no jogo). Resultado de outro dia só mostra o ranking (não conta).
// o: { box, jogo, dia, hoje, reg: { acertos, ms, enviado }, salvar(reg), nick, guardarNick(nome), lang }
function gameziRankingDoDia(o) {
  if (!o.box) return Promise.resolve(null);
  if (!gameziRankingLigado()) {
    o.box.hidden = true;
    return Promise.resolve(null);
  }
  if (o.dia !== o.hoje || o.reg.enviado) return gameziRankingDesenhar(o.box, gameziCliente(false), o.jogo, o.dia, o.lang);
  var nick = gameziNick(o.nick);
  if (!nick) return gameziRankingPedirNome(o);
  var envio = gameziCliente(true).then(function (sb) {
    return sb.rpc(o.jogo + "_registrar_diario", { p_dia: o.dia, p_nick: nick, p_acertos: o.reg.acertos, p_tempo: gameziTempoValido(o.reg.ms) }).then(function (r) {
      if (r.error) throw new Error(r.error.message || "erro");
      o.reg.enviado = true;
      o.salvar(o.reg);
      return sb;
    });
  });
  // Sem internet (ou banco sem a função): tenta de novo da próxima vez que o resultado aparecer.
  return gameziRankingDesenhar(o.box, envio, o.jogo, o.dia, o.lang);
}

function gameziRankingPedirNome(o) {
  var l = o.lang;
  o.box.hidden = false;
  o.box.innerHTML = "<h3>" + gameziEsc(gameziRankingTexto("titulo", l)) + "</h3>" +
    '<form class="lb-form"><input class="lb-input" maxlength="16" autocomplete="nickname" placeholder="' + gameziEsc(gameziRankingTexto("nome", l)) +
    '" aria-label="' + gameziEsc(gameziRankingTexto("nome", l)) + '"><button type="submit" class="btn">' + gameziEsc(gameziRankingTexto("entrar", l)) + "</button></form>";
  var form = o.box.querySelector("form");
  return new Promise(function (ok) {
    form.onsubmit = function (e) {
      e.preventDefault();
      var nome = form.querySelector("input").value.trim().slice(0, 16);
      if (!nome) return form.querySelector("input").focus();
      o.guardarNick(nome);
      o.nick = nome;
      ok(gameziRankingDoDia(o));
    };
  });
}
