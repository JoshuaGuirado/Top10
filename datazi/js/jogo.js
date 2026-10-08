// Regras do Datazi, sem tela (testadas em tests/datazi.test.js).
// A linha do tempo começa com um acontecimento já colocado (com o ano à mostra). A cada rodada aparece outro, e
// a pessoa escolhe onde ele entra na linha. Lugar certo: ponto. Lugar errado: perde uma vida, e o acontecimento
// vai para o lugar certo mesmo assim. Acaba quando acabam os acontecimentos ou as vidas.

const DZ_VIDAS = 3;
const DZ_DIARIO_QTD = 8; // acontecimentos para colocar no Datazi do dia (fora o primeiro, que já vem na linha)

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
  return { linha: [ids[0]], fila: ids.slice(1), atual: ids[1] || null, acertos: 0, erros: 0, vidas, marcas: [], fim: ids.length < 2, ultimo: null };
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
