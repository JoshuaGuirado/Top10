// Regras do Mapazi, sem tela (testadas em tests/mapazi.test.js).
// Cada rodada mostra um país de referência no tamanho certo e, do lado, outro país num tamanho errado. A pessoa
// aumenta ou diminui o segundo até achar que ele está do tamanho certo perto do primeiro; aí aparece o tamanho real.
// Pontos da rodada: 100 em cheio; cada vez que a área erra pelo dobro (ou pela metade), perde 50. Dez rodadas.

const MP_PAISES = []; // { id, nome: [pt, en, es], km2, u (km por unidade do desenho), w, h, d (contorno SVG) }
const MP_RODADAS = 10;
const MP_FAIXA = Math.log(10); // o ajuste vai de 10 vezes menor a 10 vezes maior (na largura) dentro da barra

// Países de referência: os que todo mundo tem na cabeça (o Brasil aparece mais).
const MP_REFERENCIAS = ["076", "076", "076", "840", "250", "724", "620", "380", "276", "826", "392", "356", "036", "484", "032", "156", "643", "124", "710", "818"];

// Mapazi do dia: o dia 1 é 13/10/2026. Países novos só entram no sorteio a partir do dia da linha nova,
// para não mudar o desafio de quem já jogou hoje.
const MP_DIARIO_INICIO = Date.UTC(2026, 9, 13);
const MP_DIARIO_POOLS = [
  { desde: 1, paises: 129 },
];

function mpPaises(lista) {
  for (const [id, pt, en, es, km2, u, w, h, d] of lista) MP_PAISES.push({ id, nome: [pt, en, es], km2, u, w, h, d });
}

let mpIndice = null;

function mpPais(id) {
  if (!mpIndice || mpIndice.size !== MP_PAISES.length) mpIndice = new Map(MP_PAISES.map((p) => [p.id, p]));
  return mpIndice.get(id) || null;
}

// ───────────── sorte ─────────────

function mpRng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function mpEmbaralhar(lista, rnd = Math.random) {
  const a = lista.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ───────────── rodadas ─────────────

// Sorteia n rodadas com os países de "ids": referência conhecida, outro país de tamanho bem diferente
// (de 1,3 a 40 vezes a área, para mais ou para menos), sem repetir país na partida.
// Cada rodada: { ref, alvo, certo, inicio } — "certo" e "inicio" são posições na barra (de 0 a 1).
function mpSortear(ids, n, rnd = Math.random) {
  const ok = new Set(ids);
  const usados = new Set();
  const rodadas = [];
  let guarda = 0;
  while (rodadas.length < n && guarda++ < 5000) {
    const ref = MP_REFERENCIAS[Math.floor(rnd() * MP_REFERENCIAS.length)];
    if (!ok.has(ref) || usados.has(ref)) continue;
    const r = mpPais(ref);
    const alvos = mpEmbaralhar(ids, rnd).filter((id) => {
      if (id === ref || usados.has(id)) return false;
      const k = Math.abs(Math.log(mpPais(id).km2 / r.km2));
      return k >= Math.log(1.3) && k <= Math.log(40);
    });
    if (!alvos.length) continue;
    const alvo = alvos[0];
    usados.add(ref).add(alvo);
    const certo = 0.15 + 0.7 * rnd();
    // Começa longe da resposta (pelo menos 1/4 da barra), para não dar a resposta de graça.
    let inicio = certo;
    while (Math.abs(inicio - certo) < 0.25) inicio = 0.04 + 0.92 * rnd();
    rodadas.push({ ref, alvo, certo: +certo.toFixed(4), inicio: +inicio.toFixed(4) });
  }
  return rodadas;
}

// Quantas vezes maior (na largura) o país está desenhado do que deveria, para a posição v da barra.
function mpFator(rodada, v) {
  return Math.exp(MP_FAIXA * (v - rodada.certo));
}

// Pontos de uma resposta: 100 em cheio, 50 a menos por dobro (ou metade) de área errada.
function mpPontos(rodada, v) {
  const errosDeDobro = Math.abs(Math.log2(mpFator(rodada, v) ** 2));
  return Math.max(0, Math.round(100 - 50 * errosDeDobro));
}

// ───────────── partida ─────────────

function mpNovaPartida(rodadas) {
  return { rodadas, atual: 0, respostas: [], pontos: 0, fim: rodadas.length === 0 };
}

// Responde a rodada da vez com a posição v da barra. Devolve { pontos, fator } ou null.
function mpResponder(s, v) {
  if (s.fim || s.respostas.length > s.atual || !Number.isFinite(v)) return null;
  const r = s.rodadas[s.atual];
  const pos = Math.min(1, Math.max(0, v));
  const pontos = mpPontos(r, pos);
  s.respostas.push({ v: +pos.toFixed(4), pontos });
  s.pontos += pontos;
  return { pontos, fator: mpFator(r, pos) };
}

// Próxima rodada (depois de responder). Devolve true se a partida acabou.
function mpProxima(s) {
  if (s.respostas.length <= s.atual) return false;
  s.atual += 1;
  if (s.atual >= s.rodadas.length) s.fim = true;
  return s.fim;
}

// ───────────── Mapazi do dia e partida livre ─────────────

function mpDiaNumero(d = new Date()) {
  return Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - MP_DIARIO_INICIO) / 864e5) + 1;
}

function mpDiarioRodadas(dia) {
  const pool = MP_DIARIO_POOLS.filter((p) => p.desde <= Math.max(dia, 1)).pop();
  return mpSortear(MP_PAISES.slice(0, pool.paises).map((p) => p.id), MP_RODADAS, mpRng(dia * 7919 + 41));
}

function mpLivreRodadas(rnd = Math.random) {
  return mpSortear(MP_PAISES.map((p) => p.id), MP_RODADAS, rnd);
}
