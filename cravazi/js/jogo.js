// Cravazi: regras, sem tela (testado em tests/cravazi.test.js).
// Cada rodada tem uma pergunta com resposta inteira. Os jogadores chutam um de cada vez; o jogo diz
// "é mais" ou "é menos" e a faixa vai fechando. Quem cravar o número exato leva o ponto da rodada.
// A rodada só acaba quando alguém crava. Depois de N rodadas, ganha quem tiver mais pontos.
// Sozinho (Cravazi do dia): 5 perguntas iguais para todo mundo, até 10 chutes em cada; quanto menos
// chutes para cravar, mais pontos (de 10 a 1). O resultado vai para o ranking do dia.

var CZ_TEMAS = [];
var CZ_PERGUNTAS = []; // { id, tema, resposta, texto: [pt, en, es], unidade: [pt, en, es] | null, ano }

// Registra um tema: czTema({ id, nome: [pt, en, es], unidade: [pt, en, es], itens: [[resposta, pt, en, es, unidade?], …] }).
// A unidade aparece ao lado do campo do chute; o item pode trocar a do tema (5º valor, null para nenhuma).
// Pergunta de ano ("In what year…") marca ano: true, para o número aparecer sem separador (1985, não 1.985).
function czTema(tema) {
  CZ_TEMAS.push({ id: tema.id, nome: tema.nome });
  tema.itens.forEach(function (it, i) {
    CZ_PERGUNTAS.push({ id: tema.id + "/" + i, tema: tema.id, resposta: it[0], texto: [it[1], it[2], it[3]], unidade: it.length > 4 ? it[4] : tema.unidade || null, ano: /\bwhat year\b/i.test(it[2]) });
  });
}

function czTemaPorId(id) {
  return CZ_TEMAS.find(function (t) { return t.id === id; }) || null;
}

function czEmbaralhar(lista, rnd) {
  var a = lista.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(rnd() * (i + 1));
    var x = a[i]; a[i] = a[j]; a[j] = x;
  }
  return a;
}

// Sorteia as perguntas da partida: primeiro as que este aparelho não viu, sem repetir tema seguido.
function czSortear(n, vistas, rnd) {
  rnd = rnd || Math.random;
  var visto = {};
  (vistas || []).forEach(function (id) { visto[id] = true; });
  var novas = czEmbaralhar(CZ_PERGUNTAS.filter(function (p) { return !visto[p.id]; }), rnd);
  var velhas = czEmbaralhar(CZ_PERGUNTAS.filter(function (p) { return visto[p.id]; }), rnd);
  return czTirarDaFila(novas.concat(velhas), n);
}

// Tira n perguntas da fila, na ordem, pulando a que repetiria o tema da anterior.
function czTirarDaFila(fila, n) {
  fila = fila.slice();
  var saida = [];
  while (saida.length < n && fila.length) {
    var ultimo = saida.length ? saida[saida.length - 1].tema : null;
    var i = fila.findIndex(function (p) { return p.tema !== ultimo; });
    saida.push(fila.splice(i < 0 ? 0 : i, 1)[0]);
  }
  return saida;
}

// jogadores: nomes ou { nome, id, skin } (2 a 8; id e skin no online). rodadas: quantas perguntas.
// perguntas: opcional (senão sorteia). seq conta as jogadas (o online ignora estado velho).
function czNovaPartida(opcoes) {
  var jogadores = opcoes.jogadores.map(function (j) {
    return typeof j === "string" ? { nome: j, pontos: 0 } : { nome: j.nome, id: j.id || null, skin: j.skin || null, pontos: 0 };
  });
  var perguntas = opcoes.perguntas || czSortear(opcoes.rodadas, opcoes.vistas, opcoes.rnd);
  var s = { jogadores: jogadores, perguntas: perguntas, rodada: 0, fim: false, rodadas: [], seq: 0 };
  czComecarRodada(s);
  return s;
}

function czComecarRodada(s) {
  s.atual = {
    pergunta: s.perguntas[s.rodada],
    baixo: 0, // a resposta é maior que isto
    alto: null, // e menor que isto (null: sem limite ainda)
    vez: s.rodada % s.jogadores.length, // quem começa muda a cada rodada
    chutes: [], // { jogador, valor, dica: "mais" | "menos" | "cravou" }
    vencedor: null,
  };
}

// Valor do chute dentro da faixa que já se sabe? (inteiro, maior que baixo e menor que alto)
function czChuteValido(s, valor) {
  var r = s.atual;
  if (!Number.isInteger(valor) || valor < 1) return false;
  return valor > r.baixo && (r.alto === null || valor < r.alto);
}

// Chute de quem está na vez. Devolve "mais", "menos", "cravou" ou null (chute fora da faixa ou rodada encerrada).
function czChutar(s, valor) {
  var r = s.atual;
  if (s.fim || r.vencedor !== null || !czChuteValido(s, valor)) return null;
  var certa = r.pergunta.resposta;
  var dica = valor === certa ? "cravou" : valor < certa ? "mais" : "menos";
  s.seq = (s.seq || 0) + 1;
  r.chutes.push({ jogador: r.vez, valor: valor, dica: dica });
  if (dica === "mais") r.baixo = valor;
  else if (dica === "menos") r.alto = valor;
  else {
    r.vencedor = r.vez;
    s.jogadores[r.vez].pontos += 1;
    s.rodadas.push({ pergunta: r.pergunta.id, vencedor: r.vez, chutes: r.chutes.length });
    return dica;
  }
  r.vez = (r.vez + 1) % s.jogadores.length;
  return dica;
}

// Online: quem está na vez saiu da sala. Passa a vez sem chutar (a rodada continua com os outros).
function czPassarVez(s) {
  if (s.fim || s.atual.vencedor !== null) return false;
  s.seq = (s.seq || 0) + 1;
  s.atual.vez = (s.atual.vez + 1) % s.jogadores.length;
  return true;
}

// Depois de alguém cravar: próxima rodada ou fim da partida. Devolve true se acabou.
function czProxima(s) {
  if (s.atual.vencedor === null) return false;
  s.seq = (s.seq || 0) + 1;
  s.rodada += 1;
  if (s.rodada >= s.perguntas.length) {
    s.fim = true;
    return true;
  }
  czComecarRodada(s);
  return false;
}

// Classificação: mais pontos primeiro; empate fica junto (mesma posição).
function czPlacar(s) {
  var ord = s.jogadores.map(function (j, i) { return { nome: j.nome, pontos: j.pontos, skin: j.skin || null, id: j.id || null, i: i }; })
    .sort(function (a, b) { return b.pontos - a.pontos || a.i - b.i; });
  ord.forEach(function (j, k) { j.pos = k && ord[k - 1].pontos === j.pontos ? ord[k - 1].pos : k + 1; });
  return ord;
}

// Quem venceu (pode ser mais de um, no empate).
function czVencedores(s) {
  var p = czPlacar(s);
  return p.filter(function (j) { return j.pos === 1; });
}

// ───────────── sozinho: Cravazi do dia e treino ─────────────

var CZ_SOLO_CHUTES = 10; // chutes por pergunta
var CZ_DIARIO_QTD = 5; // perguntas do Cravazi do dia
var CZ_DIARIO_INICIO = Date.UTC(2026, 9, 9); // dia 1 do Cravazi do dia

// Perguntas que entram no sorteio do dia, a partir de cada dia. Pergunta nova muda o sorteio, então
// entra com uma linha nova valendo a partir de amanhã (senão o desafio de hoje muda para quem ainda vai jogar).
var CZ_DIARIO_POOLS = [
  { desde: 1, perguntas: 239 },
];

// Pontos de uma pergunta: cravou no 1º chute vale 10, no 10º vale 1; não cravou, 0.
function czSoloPontos(chutes, cravou) {
  return cravou ? Math.max(0, CZ_SOLO_CHUTES + 1 - chutes) : 0;
}

function czNovoSolo(opcoes) {
  var s = { perguntas: opcoes.perguntas, rodada: 0, fim: false, pontos: 0, rodadas: [] };
  czComecarSolo(s);
  return s;
}

function czComecarSolo(s) {
  s.atual = { pergunta: s.perguntas[s.rodada], baixo: 0, alto: null, chutes: [], acabou: false, cravou: false };
}

// Chute sozinho: "mais", "menos" ou "cravou" (null se não vale). No último chute sem cravar a rodada acaba.
function czSoloChutar(s, valor) {
  var r = s.atual;
  if (s.fim || r.acabou || !czChuteValido(s, valor)) return null;
  var certa = r.pergunta.resposta;
  var dica = valor === certa ? "cravou" : valor < certa ? "mais" : "menos";
  r.chutes.push({ valor: valor, dica: dica });
  if (dica === "mais") r.baixo = valor;
  if (dica === "menos") r.alto = valor;
  if (dica === "cravou" || r.chutes.length >= CZ_SOLO_CHUTES) {
    r.acabou = true;
    r.cravou = dica === "cravou";
    r.pontos = czSoloPontos(r.chutes.length, r.cravou);
    s.pontos += r.pontos;
    s.rodadas.push({ pergunta: r.pergunta.id, chutes: r.chutes.length, cravou: r.cravou, pontos: r.pontos });
  }
  return dica;
}

// Depois da rodada: a próxima pergunta ou o fim. Devolve true se acabou.
function czSoloProxima(s) {
  if (!s.atual.acabou) return false;
  s.rodada += 1;
  if (s.rodada >= s.perguntas.length) {
    s.fim = true;
    return true;
  }
  czComecarSolo(s);
  return false;
}

// Número aleatório com semente (o mesmo sorteio em todos os aparelhos).
function czRng(semente) {
  var a = semente >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    var t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Número do Cravazi do dia de uma data (pelo dia do aparelho, como nos outros jogos do Gamezi).
function czDiaNumero(d) {
  d = d || new Date();
  return Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - CZ_DIARIO_INICIO) / 864e5) + 1;
}

// As 5 perguntas do dia: as mesmas para todo mundo, sem repetir tema seguido.
function czDiarioPerguntas(dia) {
  var pool = CZ_DIARIO_POOLS.filter(function (p) { return p.desde <= Math.max(dia, 1); }).pop();
  var rnd = czRng(dia * 7919 + 17);
  return czTirarDaFila(czEmbaralhar(CZ_PERGUNTAS.slice(0, pool.perguntas), rnd), CZ_DIARIO_QTD);
}
