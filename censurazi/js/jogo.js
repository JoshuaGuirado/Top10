// Regras do Censurazi, sem tela (testadas em tests/jogos-fotozi-censurazi-corzi.test.js).
// Cada carta tem uma palavra e as 5 proibidas (as mais óbvias para explicar a palavra).
//  - Adivinhar (desafio do dia, partida livre e online): as proibidas viram dicas. Aparece a primeira; cada chute
//    errado (ou "mais uma dica") mostra a próxima e a rodada vale um pouco menos. Acertou: de 100 a 40 pontos.
//  - Na mesa (js/mesa.js): o jogo clássico, com times num celular só; quem explica não pode falar as proibidas.
// Cartas novas entram no FIM de data/cartas-*.js (os ids são a ordem) e precisam de uma linha nova em
// CS_DIARIO_POOLS valendo a partir de amanhã, para o Censurazi do dia de hoje não mudar.

const CS_INICIO = Date.UTC(2026, 9, 26); // Censurazi do dia: o dia 1 é 26/10/2026
const CS_SEGUNDOS = 45;
const CS_PONTOS = [100, 88, 76, 64, 52, 40]; // pela quantidade de dicas a mais (0 a 5)
const CS_CARTAS = []; // { id, tema, txt: { pt: [palavra, ...5], en, es } }
const CS_DIARIO_POOLS = [{ desde: 1, cartas: 240 }];
const CS_TEMAS = ["tudo", "casa", "comida", "animais", "lugares", "profissoes", "esportes", "natureza", "corpo", "transporte", "festas", "tecnologia", "cultura"];

function csCartas(lista) {
  for (const [tema, pt, en, es] of lista) {
    CS_CARTAS.push({ id: "c" + (CS_CARTAS.length + 1), tema, txt: { pt: pt.split("|"), en: en.split("|"), es: es.split("|") } });
  }
}

let csIndice = null;
function csCarta(id) {
  if (!csIndice || csIndice.size !== CS_CARTAS.length) csIndice = new Map(CS_CARTAS.map((c) => [c.id, c]));
  return csIndice.get(id) || null;
}

function csDoTema(tema) {
  return !tema || tema === "tudo" ? CS_CARTAS : CS_CARTAS.filter((c) => c.tema === tema);
}

// Texto para comparar: minúsculas, sem acento, sem espaço nem pontuação.
function csNormal(s) {
  return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");
}

// Distância de edição pequena (para perdoar um erro de digitação).
function csDistancia(a, b) {
  if (Math.abs(a.length - b.length) > 1) return 2;
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  }
  return d[a.length][b.length];
}

// O chute bate com a palavra da carta? Vale em qualquer dos 3 idiomas, no plural e com um errinho de digitação.
function csAcertou(carta, chute) {
  const g = csNormal(chute);
  if (!g) return false;
  return ["pt", "en", "es"].some((l) => {
    const p = csNormal(carta.txt[l][0]);
    return g === p || g === p + "s" || g + "s" === p || g === p + "es" || (p.length >= 5 && csDistancia(g, p) <= 1);
  });
}

function csRodada(carta) {
  return { id: carta.id };
}

function csSortear(n, rnd, cartas = CS_CARTAS) {
  return gzEmbaralhar(cartas, rnd).slice(0, n).map(csRodada);
}

function csDiario(dia) {
  const pool = CS_DIARIO_POOLS.filter((p) => p.desde <= Math.max(dia, 1)).pop();
  return csSortear(GZ_DIARIO_QTD, gzRng(dia * 7919 + 53), CS_CARTAS.slice(0, pool.cartas));
}

// Partida livre: as cartas do tema embaralhadas, sem repetir até dar a volta.
function csLivre(tema = "tudo", rnd = Math.random) {
  const cartas = csDoTema(tema);
  let fila = [];
  return () => {
    if (!fila.length) fila = gzEmbaralhar(cartas, rnd);
    return csRodada(fila.pop());
  };
}

function csOnline(tema = "tudo", rnd = Math.random) {
  return csSortear(GZ_DIARIO_QTD, rnd, csDoTema(tema));
}

// Resposta: { g: o chute certo, n: quantas dicas a mais precisou (0 a 5) }. A tela só manda quando acerta.
function csValida(r, v) {
  return !!v && typeof v === "object" && typeof v.g === "string" && v.g.length <= 40 && Number.isInteger(v.n) && v.n >= 0 && v.n < CS_PONTOS.length;
}

function csAvaliar(r, v) {
  const carta = csCarta(r.id);
  const certo = !!carta && csValida(r, v) && csAcertou(carta, v.g);
  return { certo, pontos: certo ? CS_PONTOS[v.n] : 0 };
}

// ───────────── Na mesa: times, um celular só ─────────────
// Estado: times [{ nome, pontos }], vez (índice do time), turno (0, 1, …), turnos (por time), cartas (fila de ids),
// atual (id), feitas [{ id, r: "acertou" | "pulou" | "proibida" }] do turno.

function csMesaNova({ times, turnos = 3, tema = "tudo", rnd = Math.random }) {
  return { times: times.map((nome) => ({ nome, pontos: 0 })), vez: 0, turno: 0, turnos, fila: gzEmbaralhar(csDoTema(tema), rnd).map((c) => c.id), atual: null, feitas: [], fim: false, tema };
}

function csMesaProxCarta(m) {
  if (!m.fila.length) m.fila = gzEmbaralhar(csDoTema(m.tema)).map((c) => c.id);
  m.atual = m.fila.pop();
  return m.atual;
}

// Resultado da carta da vez: acertou (+1), pulou (0) ou falou proibida (−1).
function csMesaMarcar(m, r) {
  if (!m.atual || !["acertou", "pulou", "proibida"].includes(r)) return false;
  m.feitas.push({ id: m.atual, r });
  m.times[m.vez].pontos += r === "acertou" ? 1 : r === "proibida" ? -1 : 0;
  csMesaProxCarta(m);
  return true;
}

// Acabou o tempo do turno: passa para o outro time. Devolve true se a partida acabou.
function csMesaFimDoTurno(m) {
  m.atual = null;
  m.feitas = [];
  m.vez = (m.vez + 1) % m.times.length;
  if (m.vez === 0) m.turno += 1;
  m.fim = m.turno >= m.turnos;
  return m.fim;
}
