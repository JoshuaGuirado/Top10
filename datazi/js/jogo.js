// Regras do Datazi, sem tela (testadas em tests/datazi.test.js).
// A linha do tempo começa com um acontecimento já colocado (com o ano à mostra). A cada rodada aparece outro, e
// a pessoa escolhe onde ele entra na linha. Lugar certo: ponto. Lugar errado: perde uma vida, e o acontecimento
// vai para o lugar certo mesmo assim. Acaba quando acabam os acontecimentos ou as vidas (2; até o dia 6 eram 3).

const DZ_VIDAS = 2;
const DZ_VIDAS_ANTES = 3; // o Datazi do dia teve 3 vidas até o dia 6 (13/10/2026)
const DZ_VIDAS_DESDE = 7; // dia a partir do qual valem as 2 vidas
const DZ_DIARIO_QTD = 8; // acontecimentos para colocar no Datazi do dia (fora o primeiro, que já vem na linha)
const DZ_MODOS = ["linha", "antes", "ano"]; // linha do tempo, "Qual veio antes?" e "Em que ano?"
const DZ_RODADAS = 10; // rodadas do "Em que ano?" e de cada partida online
const DZ_PAR_DISTANCIA = 40; // no "Qual veio antes?", os dois são de no máximo 40 anos de distância (quando dá)
const DZ_ANO_MAX = 2100; // maior ano que dá para chutar
const DZ_MAX_JOGADORES = 10;
const DZ_ONLINE_SEGUNDOS = 30; // tempo de cada rodada online (depois disso revela com quem respondeu)

// Datazi do dia: o dia 1 é 8/10/2026. Acontecimentos novos só entram no sorteio a partir do dia da linha nova,
// para não mudar o desafio de quem já jogou hoje.
const DZ_DIARIO_INICIO = Date.UTC(2026, 9, 8);
const DZ_DIARIO_POOLS = [
  { desde: 1, eventos: 118 },
];

// ───────────── sorte ─────────────

function dzRng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function dzEmbaralhar(lista, rnd = Math.random) {
  const a = lista.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ───────────── acontecimentos ─────────────

let dzIndice = null;

function dzEvento(id) {
  if (!dzIndice || dzIndice.size !== DZ_EVENTOS.length) dzIndice = new Map(DZ_EVENTOS.map((e) => [e.id, e]));
  return dzIndice.get(id) || null;
}

// n acontecimentos de anos diferentes (para não ter empate na linha), na ordem sorteada.
function dzSortear(ids, n, rnd) {
  const anos = new Set();
  const out = [];
  for (const id of dzEmbaralhar(ids, rnd)) {
    const ano = dzEvento(id).ano;
    if (anos.has(ano)) continue;
    anos.add(ano);
    out.push(id);
    if (out.length === n) break;
  }
  return out;
}

// ───────────── partida ─────────────

// ids: o primeiro já começa na linha; os outros aparecem um por um.
function dzNovaPartida(ids, vidas = DZ_VIDAS) {
  return { linha: [ids[0]], fila: ids.slice(1), atual: ids[1] || null, acertos: 0, erros: 0, vidas, vidasMax: vidas, marcas: [], fim: ids.length < 2, ultimo: null };
}

// Vidas no Datazi do dia de um dia (os dias antigos continuam com as regras de antes).
function dzVidasDoDia(dia) {
  return dia && dia < DZ_VIDAS_DESDE ? DZ_VIDAS_ANTES : DZ_VIDAS;
}

// Posições certas para o acontecimento: entre os que vieram antes e os que vieram depois (ano igual vale dos dois lados).
function dzLugarCerto(s, id) {
  const ano = dzEvento(id).ano;
  let pos = 0;
  while (pos < s.linha.length && dzEvento(s.linha[pos]).ano < ano) pos++;
  return pos;
}

function dzCabe(s, id, pos) {
  const ano = dzEvento(id).ano;
  const antes = pos > 0 ? dzEvento(s.linha[pos - 1]).ano : -Infinity;
  const depois = pos < s.linha.length ? dzEvento(s.linha[pos]).ano : Infinity;
  return antes <= ano && ano <= depois;
}

// Coloca o acontecimento da vez na posição escolhida (0 = antes de todos). Devolve { certo, pos } (pos onde ficou).
function dzColocar(s, pos) {
  if (s.fim || !s.atual) return null;
  const id = s.atual;
  const certo = Number.isInteger(pos) && pos >= 0 && pos <= s.linha.length && dzCabe(s, id, pos);
  const onde = certo ? pos : dzLugarCerto(s, id);
  s.linha.splice(onde, 0, id);
  s.marcas.push(certo);
  if (certo) s.acertos += 1;
  else {
    s.erros += 1;
    s.vidas -= 1;
  }
  s.fila.shift();
  s.atual = s.fila[0] || null;
  s.ultimo = { id, certo, pos: onde };
  if (!s.atual || s.vidas <= 0) s.fim = true;
  return s.ultimo;
}

// ───────────── "Qual veio antes?" e "Em que ano?" ─────────────

// Pares de acontecimentos de anos diferentes e perto um do outro (para não ser fácil), sem repetir nenhum.
function dzSortearPares(n, rnd = Math.random, ids = DZ_EVENTOS.map((e) => e.id)) {
  const fila = dzEmbaralhar(ids, rnd);
  const usados = new Set();
  const pares = [];
  for (const a of fila) {
    if (pares.length === n) break;
    if (usados.has(a)) continue;
    const ano = dzEvento(a).ano;
    const b = fila.find((x) => x !== a && !usados.has(x) && dzEvento(x).ano !== ano && Math.abs(dzEvento(x).ano - ano) <= DZ_PAR_DISTANCIA);
    if (!b) continue;
    usados.add(a);
    usados.add(b);
    pares.push([a, b]);
  }
  return pares;
}

// Qual dos dois do par veio antes (0 ou 1).
function dzMaisAntigo(par) {
  return dzEvento(par[0]).ano < dzEvento(par[1]).ano ? 0 : 1;
}

// "Em que ano?": em cheio vale 10; quanto mais longe, menos.
function dzPontosAno(chute, ano) {
  const d = Math.abs(chute - ano);
  return d === 0 ? 10 : d <= 2 ? 7 : d <= 5 ? 5 : d <= 10 ? 3 : d <= 25 ? 1 : 0;
}

function dzAnoValido(v) {
  return Number.isInteger(v) && v >= 1 && v <= DZ_ANO_MAX;
}

// Resposta de uma rodada: "antes" é 0 ou 1 (qual dos dois); "ano" é o ano chutado. Devolve { certo, pontos }.
function dzAvaliar(tipo, rodada, v) {
  if (tipo === "antes") {
    const certo = v === dzMaisAntigo(rodada);
    return { certo, pontos: certo ? 1 : 0 };
  }
  const pontos = dzAnoValido(v) ? dzPontosAno(v, dzEvento(rodada).ano) : 0;
  return { certo: pontos === 10, pontos };
}

// Partida sozinho de "Qual veio antes?" (até acabarem as vidas) ou "Em que ano?" (sem vidas, todas as rodadas).
function dzNovaRodadas(tipo, rodadas, vidas = tipo === "antes" ? DZ_VIDAS : 0) {
  return { tipo, rodadas, atual: 0, respostas: [], acertos: 0, pontos: 0, vidas, vidasMax: vidas, fim: !rodadas.length };
}

// Responde a rodada da vez (uma vez só). Devolve { v, certo, pontos } ou null.
function dzResponder(s, v) {
  if (s.fim || s.respostas.length > s.atual) return null;
  const r = { v, ...dzAvaliar(s.tipo, s.rodadas[s.atual], v) };
  s.respostas.push(r);
  if (r.certo) s.acertos += 1;
  s.pontos += r.pontos;
  if (s.vidasMax && !r.certo) s.vidas -= 1;
  return r;
}

// Vai para a próxima rodada (depois de responder). Devolve true se a partida acabou.
function dzProxima(s) {
  if (s.fim || s.respostas.length <= s.atual) return s.fim;
  s.atual += 1;
  if (s.atual >= s.rodadas.length || (s.vidasMax && s.vidas <= 0)) s.fim = true;
  return s.fim;
}

function dzLivreRodadas(tipo, rnd = Math.random) {
  if (tipo === "antes") return dzSortearPares(DZ_EVENTOS.length, rnd);
  return dzSortear(DZ_EVENTOS.map((e) => e.id), DZ_RODADAS, rnd);
}

// ───────────── online: todo mundo joga a mesma rodada ─────────────
// Estado (o anfitrião roda e manda inteiro pelo Realtime): tipo, jogadores [{ id, nome, pontos }], rodadas, linha (só
// na linha do tempo), atual, fase ("jogando" ou "revelado"), respostas da rodada { id: v }, ganhos da rodada { id: pontos },
// hist, fim e seq. Linha do tempo e "Qual veio antes?": acertou, 1 ponto. "Em que ano?": de 0 a 10 pela distância.

function dzNovaOnline({ jogadores, tipo = "linha", rnd = Math.random, agora = Date.now() }) {
  if (!DZ_MODOS.includes(tipo)) tipo = "linha";
  let rodadas;
  let linha = [];
  if (tipo === "antes") rodadas = dzSortearPares(DZ_RODADAS, rnd);
  else {
    rodadas = dzSortear(DZ_EVENTOS.map((e) => e.id), DZ_RODADAS + (tipo === "linha" ? 1 : 0), rnd);
    if (tipo === "linha") linha = [rodadas.shift()];
  }
  return {
    v: 1, online: true, tipo, jogadores: jogadores.slice(0, DZ_MAX_JOGADORES).map((j) => ({ id: j.id, nome: j.nome, skin: j.skin || null, pontos: 0 })),
    rodadas, linha, atual: 0, fase: "jogando", respostas: {}, ganhos: {}, hist: [], fim: false, seq: 1, comecou: agora,
  };
}

function dzOnlineValida(s, v) {
  if (!Number.isInteger(v)) return false;
  if (s.tipo === "linha") return v >= 0 && v <= s.linha.length;
  if (s.tipo === "antes") return v === 0 || v === 1;
  return dzAnoValido(v);
}

// Resposta de um jogador na rodada da vez (só a primeira vale). Devolve true se valeu.
function dzOnlineResponder(s, id, v) {
  if (s.fim || s.fase !== "jogando" || !s.jogadores.some((j) => j.id === id) || id in s.respostas || !dzOnlineValida(s, v)) return false;
  s.respostas[id] = v;
  s.seq += 1;
  return true;
}

// Todo mundo que está na partida (ids) já respondeu?
function dzOnlineTodos(s, ids) {
  return ids.every((id) => id in s.respostas);
}

// Revela a rodada: cada um ganha os pontos da própria resposta; na linha do tempo, o acontecimento vai para o lugar certo.
function dzOnlineRevelar(s) {
  if (s.fim || s.fase !== "jogando") return false;
  const r = s.rodadas[s.atual];
  s.ganhos = {};
  for (const [id, v] of Object.entries(s.respostas)) {
    const pontos = s.tipo === "linha" ? (dzCabe(s, r, v) ? 1 : 0) : dzAvaliar(s.tipo, r, v).pontos;
    s.ganhos[id] = pontos;
    s.jogadores.find((j) => j.id === id).pontos += pontos;
  }
  if (s.tipo === "linha") s.linha.splice(dzLugarCerto(s, r), 0, r);
  s.hist.push({ r, respostas: { ...s.respostas }, ganhos: { ...s.ganhos } });
  s.fase = "revelado";
  s.seq += 1;
  return true;
}

// Próxima rodada (depois de revelar). Devolve true se a partida acabou.
function dzOnlineProxima(s, agora = Date.now()) {
  if (s.fase !== "revelado" || s.fim) return false;
  s.atual += 1;
  s.seq += 1;
  if (s.atual >= s.rodadas.length) {
    s.fim = true;
    return true;
  }
  s.fase = "jogando";
  s.respostas = {};
  s.ganhos = {};
  s.comecou = agora;
  return false;
}

// Classificação: mais pontos primeiro; empate fica junto (mesma posição).
function dzPlacar(s) {
  const ord = s.jogadores.map((j, i) => ({ id: j.id, nome: j.nome, pontos: j.pontos, i })).sort((a, b) => b.pontos - a.pontos || a.i - b.i);
  ord.forEach((j, k) => (j.pos = k && ord[k - 1].pontos === j.pontos ? ord[k - 1].pos : k + 1));
  return ord;
}

// ───────────── Datazi do dia ─────────────

function dzDiaNumero(d = new Date()) {
  return Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - DZ_DIARIO_INICIO) / 864e5) + 1;
}

function dzDiarioEventos(dia) {
  const pool = DZ_DIARIO_POOLS.filter((p) => p.desde <= Math.max(dia, 1)).pop();
  const ids = DZ_EVENTOS.slice(0, pool.eventos).map((e) => e.id);
  return dzSortear(ids, DZ_DIARIO_QTD + 1, dzRng(dia * 7919 + 29));
}

// Partida livre: todos os acontecimentos, até acabarem as vidas.
function dzLivreEventos(rnd = Math.random) {
  return dzSortear(DZ_EVENTOS.map((e) => e.id), DZ_EVENTOS.length, rnd);
}
