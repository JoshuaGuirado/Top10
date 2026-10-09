// Cravazi: regras, sem tela (testado em tests/cravazi.test.js).
// Cada rodada tem uma pergunta com resposta inteira. Os jogadores chutam um de cada vez; o jogo diz
// "é mais" ou "é menos" e a faixa vai fechando. Quem cravar o número exato leva o ponto da rodada.
// A rodada só acaba quando alguém crava. Depois de N rodadas, ganha quem tiver mais pontos.

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
  var fila = novas.concat(velhas);
  var saida = [];
  while (saida.length < n && fila.length) {
    var ultimo = saida.length ? saida[saida.length - 1].tema : null;
    var i = fila.findIndex(function (p) { return p.tema !== ultimo; });
    saida.push(fila.splice(i < 0 ? 0 : i, 1)[0]);
  }
  return saida;
}

// jogadores: nomes (2 a 8). rodadas: quantas perguntas. perguntas: opcional (senão sorteia).
function czNovaPartida(opcoes) {
  var jogadores = opcoes.jogadores.map(function (nome) { return { nome: nome, pontos: 0 }; });
  var perguntas = opcoes.perguntas || czSortear(opcoes.rodadas, opcoes.vistas, opcoes.rnd);
  var s = { jogadores: jogadores, perguntas: perguntas, rodada: 0, fim: false, rodadas: [] };
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

// Depois de alguém cravar: próxima rodada ou fim da partida. Devolve true se acabou.
function czProxima(s) {
  if (s.atual.vencedor === null) return false;
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
  var ord = s.jogadores.map(function (j, i) { return { nome: j.nome, pontos: j.pontos, i: i }; })
    .sort(function (a, b) { return b.pontos - a.pontos || a.i - b.i; });
  ord.forEach(function (j, k) { j.pos = k && ord[k - 1].pontos === j.pontos ? ord[k - 1].pos : k + 1; });
  return ord;
}

// Quem venceu (pode ser mais de um, no empate).
function czVencedores(s) {
  var p = czPlacar(s);
  return p.filter(function (j) { return j.pos === 1; });
}
