// Conta do Gamezi: uma conta só para a plataforma e todos os jogos (um único projeto do Supabase).
// Entrar, criar conta, trocar senha e sair ficam em conta.html, na raiz. O portal e os jogos só leem
// a sessão que o Supabase guarda neste navegador e, para entrar ou mexer na conta, mandam a pessoa
// para conta.html com ?volta=<pasta do jogo>, que a traz de volta para o jogo depois do login.

var GAMEZI_JOGOS = ["topzi", "patozi", "datazi"];

// Sessão salva pelo Supabase neste navegador: { email, anon } ou null. Não precisa carregar a biblioteca.
function gameziSessao() {
  try {
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (!/^sb-.+-auth-token$/.test(k)) continue;
      var s = JSON.parse(localStorage.getItem(k));
      var u = s && s.user;
      if (u) return { email: u.email || null, anon: !!u.is_anonymous || !u.email };
    }
  } catch (e) { /* sem armazenamento */ }
  return null;
}

// Tem conta conectada (e-mail e senha), não só o login anônimo usado para jogar online.
function gameziLogado() {
  var s = gameziSessao();
  return !!(s && !s.anon);
}

// Endereço da página da conta. raiz: caminho até a raiz do site ("" no portal, "../" nos jogos).
function gameziContaUrl(raiz, volta) {
  return raiz + "conta.html" + (GAMEZI_JOGOS.indexOf(volta) >= 0 ? "?volta=" + volta : "");
}

// Chegou num jogo por um link do e-mail (nova senha, confirmação): quem cuida disso é a conta.html.
function gameziRetornoDoLogin(raiz) {
  if (!/access_token|error_description|type=recovery/.test(location.hash)) return false;
  location.replace(raiz + "conta.html" + location.hash);
  return true;
}

// ═════════════════════════════ nível e conquistas ═════════════════════════════
// Contam o que a pessoa joga em todos os jogos do Gamezi. Vêm do que cada jogo guarda neste aparelho
// (e que a conta leva para outros aparelhos): tt:* (Topzi), pz:* (Patozi), dz:* (Datazi).
// Algumas conquistas liberam itens do guarda-roupa do pato (ver GAMEZI_CONQUISTAS[].item e o Patozi).

function gameziLer(chave) {
  try { return JSON.parse(localStorage.getItem(chave)); } catch (e) { return null; }
}

// Dados de cada jogo neste aparelho, no formato que gameziProgresso espera.
function gameziDadosLocais() {
  return {
    topzi: { stats: gameziLer("tt:stats") || {}, diaria: gameziLer("tt:diaria") || {} },
    patozi: { stats: gameziLer("pz:stats") || {}, diario: gameziLer("pz:diario") || {} },
    datazi: { stats: gameziLer("dz:stats") || {}, diario: gameziLer("dz:diario") || {} },
  };
}

// Maior sequência de dias seguidos numa lista de números de dia.
function gameziSequencia(dias) {
  var ord = dias.map(Number).filter(function (n) { return n >= 1; }).sort(function (a, b) { return a - b; });
  var melhor = 0, atual = 0;
  for (var i = 0; i < ord.length; i++) {
    atual = i && ord[i - 1] === ord[i] - 1 ? atual + 1 : ord[i - 1] === ord[i] ? atual : 1;
    melhor = Math.max(melhor, atual);
  }
  return melhor;
}

var GAMEZI_CONQUISTAS = [
  { id: "primeira", nome: ["Primeira partida", "First game", "Primera partida"], como: ["Jogue uma partida de qualquer jogo", "Play a game of anything", "Juega una partida de cualquier juego"], ok: function (p) { return p.partidas >= 1; } },
  { id: "dez", nome: ["10 partidas", "10 games", "10 partidas"], como: ["Jogue 10 partidas", "Play 10 games", "Juega 10 partidas"], ok: function (p) { return p.partidas >= 10; }, item: "rosto:estrela" },
  { id: "cem", nome: ["100 partidas", "100 games", "100 partidas"], como: ["Jogue 100 partidas", "Play 100 games", "Juega 100 partidas"], ok: function (p) { return p.partidas >= 100; } },
  { id: "dias3", nome: ["3 dias seguidos", "3-day streak", "3 días seguidos"], como: ["Faça o desafio do dia 3 dias seguidos", "Play the daily challenge 3 days in a row", "Haz el desafío del día 3 días seguidos"], ok: function (p) { return p.sequencia >= 3; }, item: "chapeu:aureola" },
  { id: "dias7", nome: ["7 dias seguidos", "7-day streak", "7 días seguidos"], como: ["Faça o desafio do dia 7 dias seguidos", "Play the daily challenge 7 days in a row", "Haz el desafío del día 7 días seguidos"], ok: function (p) { return p.sequencia >= 7; }, item: "asa:foguete" },
  { id: "completa", nome: ["Lista completa", "Full list", "Lista completa"], como: ["Ache todos os itens de uma lista no Topzi", "Find every item on a Topzi list", "Encuentra todos los ítems de una lista en Topzi"], ok: function (p) { return p.listaCompleta >= 1; } },
  { id: "venceu", nome: ["Venceu a lista", "Beat the list", "Le ganaste a la lista"], como: ["Vença a lista no Topzi (contra a lista ou lista do dia)", "Beat the list in Topzi (vs. the list or daily list)", "Gánale a la lista en Topzi (contra la lista o lista del día)"], ok: function (p) { return p.venceuLista >= 1; }, item: "asa:medalha" },
  { id: "escapou", nome: ["Escapou 10 vezes", "Escaped 10 times", "Te salvaste 10 veces"], como: ["Não seja o pato em 10 partidas do Patozi", "Don't be the duck in 10 Patozi games", "No seas el pato en 10 partidas de Patozi"], ok: function (p) { return p.escapou >= 10; }, item: "roupa:dourada" },
  { id: "nempato", nome: ["Nem a pato certeiro", "Spot-on call", "Ni de pato certero"], como: ["Acerte 5 \"Nem a pato!\" no Patozi", "Make 5 correct \"No way!\" calls in Patozi", "Acierta 5 \"¡Ni de pato!\" en Patozi"], ok: function (p) { return p.duvidasCertas >= 5; } },
  { id: "dois", nome: ["Explorador", "Explorer", "Explorador"], como: ["Jogue pelo menos dois jogos do Gamezi", "Play at least two Gamezi games", "Juega al menos dos juegos de Gamezi"], ok: function (p) { return p.jogos >= 2; } },
  { id: "nivel5", nome: ["Nível 5", "Level 5", "Nivel 5"], como: ["Chegue ao nível 5", "Reach level 5", "Llega al nivel 5"], ok: function (p) { return p.nivel >= 5; }, item: "chapeu:mago" },
  { id: "nivel10", nome: ["Nível 10", "Level 10", "Nivel 10"], como: ["Chegue ao nível 10", "Reach level 10", "Llega al nivel 10"], ok: function (p) { return p.nivel >= 10; } },
];

// XP: 10 por partida, 15 por desafio do dia, 1 por acerto no Topzi e 5 por vez que escapou no Patozi.
// Nível n começa em 50·n·(n−1) XP (nível 2 com 100, 3 com 300, 4 com 600…).
function gameziProgresso(d) {
  d = d || gameziDadosLocais();
  var tz = (d.topzi && d.topzi.stats) || {}, pz = (d.patozi && d.patozi.stats) || {}, dz = (d.datazi && d.datazi.stats) || {};
  var diasTopzi = Object.keys((d.topzi && d.topzi.diaria) || {});
  var diasPatozi = Object.keys((d.patozi && d.patozi.diario) || {}).filter(function (k) {
    var r = d.patozi.diario[k];
    return r && r.pontos && r.pontos.length >= 5;
  });
  var diasDatazi = Object.keys((d.datazi && d.datazi.diario) || {});
  var p = {
    partidas: (tz.games || 0) + (pz.partidas || 0) + (dz.partidas || 0),
    desafios: diasTopzi.length + diasPatozi.length + diasDatazi.length,
    sequencia: Math.max(gameziSequencia(diasTopzi), gameziSequencia(diasPatozi), gameziSequencia(diasDatazi)),
    listaCompleta: tz.perfect || 0,
    venceuLista: (tz.vsWins || 0) + diasTopzi.filter(function (k) { var r = d.topzi.diaria[k]; return r && r.score > r.total / 2; }).length,
    escapou: pz.escapou || 0,
    duvidasCertas: pz.duvidasCertas || 0,
    jogos: [tz.games || diasTopzi.length, pz.partidas || diasPatozi.length, dz.partidas || diasDatazi.length].filter(Boolean).length,
  };
  p.xp = p.partidas * 10 + p.desafios * 15 + (tz.hits || 0) + (pz.escapou || 0) * 5;
  p.nivel = Math.floor((1 + Math.sqrt(1 + (8 * p.xp) / 100)) / 2);
  p.xpNivel = 50 * p.nivel * (p.nivel - 1);
  p.xpProximo = 50 * (p.nivel + 1) * p.nivel;
  p.conquistas = GAMEZI_CONQUISTAS.map(function (c) { return { id: c.id, nome: c.nome, como: c.como, item: c.item || null, feita: !!c.ok(p) }; });
  return p;
}

// Itens do guarda-roupa liberados ("chapeu:aureola" → conquista que libera).
function gameziItemLiberado(progresso, categoria, item) {
  var c = GAMEZI_CONQUISTAS.find(function (x) { return x.item === categoria + ":" + item; });
  return !c || progresso.conquistas.some(function (x) { return x.id === c.id && x.feita; });
}

function gameziConquistaDoItem(categoria, item) {
  return GAMEZI_CONQUISTAS.find(function (x) { return x.item === categoria + ":" + item; }) || null;
}
