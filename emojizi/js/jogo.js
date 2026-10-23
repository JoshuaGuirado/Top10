// Regras do Emojizi, sem tela (testadas em tests/jogos-novos.test.js). Aparecem uns emojis e quatro alternativas:
// qual filme, desenho, série, história ou lugar eles contam? Acertou: de 50 a 100 pontos, quanto mais rápido, mais
// (../gamezi-rodadas.js). As alternativas erradas são do mesmo tipo da certa.
// Itens novos entram no FIM de data/itens.js (os ids são a ordem) e precisam de uma linha nova em EJ_DIARIO_POOLS
// valendo a partir de amanhã, para o Emojizi do dia de hoje não mudar.

const EJ_INICIO = Date.UTC(2026, 9, 23); // Emojizi do dia: o dia 1 é 23/10/2026
const EJ_SEGUNDOS = 15;
const EJ_ITENS = []; // { id, cat, emojis, nome: [pt, en, es] }
const EJ_DIARIO_POOLS = [
  { desde: 1, itens: 84 },
];

function ejItens(cat, lista) {
  for (const [emojis, pt, en, es] of lista) EJ_ITENS.push({ id: "e" + (EJ_ITENS.length + 1), cat, emojis, nome: [pt, en, es] });
}

let ejIndice = null;

function ejItem(id) {
  if (!ejIndice || ejIndice.size !== EJ_ITENS.length) ejIndice = new Map(EJ_ITENS.map((i) => [i.id, i]));
  return ejIndice.get(id) || null;
}

// Uma rodada: o item e as quatro alternativas embaralhadas (três do mesmo tipo).
function ejRodada(item, rnd, itens = EJ_ITENS) {
  const outros = gzEmbaralhar(itens.filter((i) => i.cat === item.cat && i.id !== item.id), rnd).slice(0, 3).map((i) => i.id);
  return { id: item.id, opcoes: gzEmbaralhar([item.id, ...outros], rnd) };
}

function ejSortear(n, rnd, itens = EJ_ITENS) {
  return gzEmbaralhar(itens, rnd).slice(0, n).map((i) => ejRodada(i, rnd, itens));
}

function ejDiario(dia) {
  const pool = EJ_DIARIO_POOLS.filter((p) => p.desde <= Math.max(dia, 1)).pop();
  return ejSortear(GZ_DIARIO_QTD, gzRng(dia * 7919 + 37), EJ_ITENS.slice(0, pool.itens));
}

// Partida livre: todos os itens embaralhados, sem repetir até dar a volta.
function ejLivre(rnd = Math.random) {
  let fila = [];
  return () => {
    if (!fila.length) fila = gzEmbaralhar(EJ_ITENS, rnd);
    return ejRodada(fila.pop(), rnd);
  };
}

function ejOnline(rnd = Math.random) {
  return ejSortear(GZ_DIARIO_QTD, rnd);
}

function ejAvaliar(r, v, ms) {
  const certo = v === r.id;
  return { certo, pontos: certo ? gzPontosTempo(ms, EJ_SEGUNDOS) : 0 };
}

function ejValida(r, v) {
  return typeof v === "string" && r.opcoes.includes(v);
}
