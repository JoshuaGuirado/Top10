// Regras do Tamanhozi, sem tela (testadas em tests/tamanhozi.test.js).
// Cada rodada mostra uma coisa de referência no tamanho certo (com a medida à mostra) e, do lado, outra coisa num
// tamanho errado. A pessoa aumenta ou diminui a segunda até achar que ela está do tamanho certo perto da primeira;
// aí aparece o tamanho real. Pontos da rodada (sozinho): 100 em cheio; cada vez que a área da silhueta erra pelo
// dobro (ou pela metade), perde 50. Online: todo mundo ajusta a mesma coisa e quem chegar mais perto leva 1 ponto.
//
// Tudo é desenhado em escala de verdade (metros por unidade do desenho), então dois itens lado a lado já estão na
// proporção certa. Países (data/paises.js) só fazem par com países; o resto (data/itens.js) se mistura.

const TZ_ITENS = []; // { id, cat, nome: [pt, en, es], medida, valor, k (metros por unidade), x, y, w, h, d }
const TZ_RODADAS = 10;
const TZ_FAIXA = Math.log(10); // de ponta a ponta da barra, o tamanho muda 10 vezes (para cada lado da resposta, até onde der)
const TZ_CATEGORIAS = ["monumentos", "personagens", "animais", "veiculos", "objetos", "paises"];
const TZ_PAR_MIN = 1.3; // um item é pelo menos 1,3 vez maior que o outro…
const TZ_PAR_MAX = 12; // …e no máximo 12 vezes (senão um some na tela)
const TZ_MAX_JOGADORES = 10;
const TZ_ONLINE_SEGUNDOS = 40; // tempo de cada rodada online (depois disso revela com quem respondeu)

// Desafio do dia: o dia 1 é 13/10/2026. Itens novos só entram no sorteio a partir do dia da linha nova,
// para não mudar o desafio de quem já jogou hoje.
const TZ_DIARIO_INICIO = Date.UTC(2026, 9, 13);
const TZ_DIARIO_POOLS = [
  { desde: 1, itens: 105, paises: 129 },
];

function tzItens(lista) {
  for (const [id, cat, pt, en, es, medida, valor, k, x, y, w, h, d] of lista) TZ_ITENS.push({ id, cat, nome: [pt, en, es], medida, valor, k, x, y, w, h, d });
}

// Países: [id, pt, en, es, km², km por unidade, largura, altura, contorno].
function tzPaises(lista) {
  for (const [iso, pt, en, es, km2, u, w, h, d] of lista) TZ_ITENS.push({ id: "p" + iso, cat: "paises", nome: [pt, en, es], medida: "area", valor: km2, k: u * 1000, x: 0, y: 0, w, h, d });
}

let tzIndice = null;

function tzItem(id) {
  if (!tzIndice || tzIndice.size !== TZ_ITENS.length) tzIndice = new Map(TZ_ITENS.map((p) => [p.id, p]));
  return tzIndice.get(id) || null;
}

// Tamanho de verdade da maior medida da silhueta, em metros (para escolher pares que caibam juntos na tela).
function tzTamanho(it) {
  return Math.max(it.w, it.h) * it.k;
}

// ───────────── sorte ─────────────

function tzRng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function tzEmbaralhar(lista, rnd = Math.random) {
  const a = lista.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ───────────── rodadas ─────────────

function tzParCombina(a, b) {
  if ((a.cat === "paises") !== (b.cat === "paises")) return false;
  const r = tzTamanho(a) / tzTamanho(b);
  const k = Math.max(r, 1 / r);
  return k >= TZ_PAR_MIN && k <= TZ_PAR_MAX;
}

// Sorteia n rodadas com os itens de "ids". categoria: "misto" (uma categoria sorteada por rodada) ou uma das
// TZ_CATEGORIAS. Em cada rodada, um item é da categoria (o "principal") e o outro combina com ele (da mesma categoria
// quando dá; no misto, de qualquer uma); quem vira referência é sorteado. Não repete item enquanto houver item novo
// na categoria. Cada rodada: { ref, alvo, certo, inicio } (posições na barra, de 0 a 1).
function tzSortear(ids, n, categoria = "misto", rnd = Math.random) {
  const itens = ids.map(tzItem).filter(Boolean);
  const usados = new Set();
  const pares = new Set();
  const rodadas = [];
  let guarda = 0;
  while (rodadas.length < n && guarda++ < 3000) {
    const cat = categoria === "misto" ? TZ_CATEGORIAS[Math.floor(rnd() * TZ_CATEGORIAS.length)] : categoria;
    const daCat = itens.filter((it) => it.cat === cat);
    const novos = daCat.filter((it) => !usados.has(it.id));
    const opcoes = novos.length ? novos : daCat;
    if (!opcoes.length) continue;
    const p = opcoes[Math.floor(rnd() * opcoes.length)];
    const livres = tzEmbaralhar(itens, rnd).filter((it) => it.id !== p.id && !usados.has(it.id) && tzParCombina(p, it) && !pares.has([p.id, it.id].sort().join("|")));
    const outro = (categoria === "misto" ? null : livres.find((it) => it.cat === cat)) || livres[0];
    if (!outro) continue;
    usados.add(p.id).add(outro.id);
    pares.add([p.id, outro.id].sort().join("|"));
    const [ref, alvo] = rnd() < 0.5 ? [p, outro] : [outro, p];
    const certo = 0.15 + 0.7 * rnd();
    // Começa longe da resposta (pelo menos 1/4 da barra), para não dar a resposta de graça.
    let inicio = certo;
    while (Math.abs(inicio - certo) < 0.25) inicio = 0.04 + 0.92 * rnd();
    rodadas.push({ ref: ref.id, alvo: alvo.id, certo: +certo.toFixed(4), inicio: +inicio.toFixed(4) });
  }
  return rodadas;
}

// Quantas vezes maior que o certo (na largura e na altura) a coisa ajustada está, para a posição v da barra.
function tzFator(rodada, v) {
  return Math.exp(TZ_FAIXA * (v - rodada.certo));
}

// Pontos de uma resposta (sozinho): 100 em cheio, 50 a menos por dobro (ou metade) de área errada.
function tzPontos(rodada, v) {
  return Math.max(0, Math.round(100 - 50 * Math.abs(Math.log2(tzFator(rodada, v) ** 2))));
}

// Erro de uma resposta, para comparar quem chegou mais perto (0 é em cheio; mesma distância para mais e para menos).
function tzErro(rodada, v) {
  return Math.abs(v - rodada.certo);
}

// ───────────── partida sozinho ─────────────

function tzNovaPartida(rodadas) {
  return { rodadas, atual: 0, respostas: [], pontos: 0, fim: rodadas.length === 0 };
}

// Responde a rodada da vez com a posição v da barra. Devolve { pontos, fator } ou null.
function tzResponder(s, v) {
  if (s.fim || s.respostas.length > s.atual || !Number.isFinite(v)) return null;
  const r = s.rodadas[s.atual];
  const pos = Math.min(1, Math.max(0, v));
  const pontos = tzPontos(r, pos);
  s.respostas.push({ v: +pos.toFixed(4), pontos });
  s.pontos += pontos;
  return { pontos, fator: tzFator(r, pos) };
}

// Próxima rodada (depois de responder). Devolve true se a partida acabou.
function tzProxima(s) {
  if (s.respostas.length <= s.atual) return false;
  s.atual += 1;
  if (s.atual >= s.rodadas.length) s.fim = true;
  return s.fim;
}

// ───────────── online: todo mundo ajusta a mesma coisa ─────────────
// Estado (o anfitrião roda e manda inteiro pelo Realtime): jogadores [{ id, nome, pontos }], rodadas, atual,
// fase ("ajuste" ou "revelado"), respostas da rodada { id: v }, ganhadores da rodada, hist, fim e seq.

function tzNovaOnline(opcoes) {
  const jogadores = opcoes.jogadores.slice(0, TZ_MAX_JOGADORES).map((j) => ({ id: j.id, nome: j.nome, pontos: 0 }));
  const s = { v: 1, online: true, jogadores, rodadas: opcoes.rodadas, atual: 0, fase: "ajuste", respostas: {}, ganhadores: [], hist: [], fim: false, seq: 1, comecou: opcoes.agora || Date.now() };
  return s;
}

// Resposta de um jogador na rodada da vez (só a primeira vale). Devolve true se valeu.
function tzOnlineResponder(s, id, v) {
  if (s.fim || s.fase !== "ajuste" || !Number.isFinite(v) || !s.jogadores.some((j) => j.id === id) || id in s.respostas) return false;
  s.respostas[id] = +Math.min(1, Math.max(0, v)).toFixed(4);
  s.seq += 1;
  return true;
}

// Todo mundo que está na partida (ids) já respondeu?
function tzOnlineTodos(s, ids) {
  return ids.every((id) => id in s.respostas);
}

// Revela: quem chegou mais perto leva 1 ponto (empate: todos os mais perto). Quem não respondeu não pontua.
function tzOnlineRevelar(s) {
  if (s.fim || s.fase !== "ajuste") return false;
  const r = s.rodadas[s.atual];
  const erros = Object.entries(s.respostas).map(([id, v]) => ({ id, erro: tzErro(r, v) }));
  const menor = Math.min(...erros.map((e) => e.erro));
  s.ganhadores = erros.filter((e) => e.erro <= menor + 1e-9).map((e) => e.id);
  s.ganhadores.forEach((id) => (s.jogadores.find((j) => j.id === id).pontos += 1));
  s.hist.push({ ref: r.ref, alvo: r.alvo, respostas: { ...s.respostas }, ganhadores: s.ganhadores.slice() });
  s.fase = "revelado";
  s.seq += 1;
  return true;
}

// Próxima rodada (depois de revelar). Devolve true se a partida acabou.
function tzOnlineProxima(s, agora = Date.now()) {
  if (s.fase !== "revelado" || s.fim) return false;
  s.atual += 1;
  s.seq += 1;
  if (s.atual >= s.rodadas.length) {
    s.fim = true;
    return true;
  }
  s.fase = "ajuste";
  s.respostas = {};
  s.ganhadores = [];
  s.comecou = agora;
  return false;
}

// Classificação: mais pontos primeiro; empate fica junto (mesma posição).
function tzPlacar(s) {
  const ord = s.jogadores.map((j, i) => ({ id: j.id, nome: j.nome, pontos: j.pontos, i })).sort((a, b) => b.pontos - a.pontos || a.i - b.i);
  ord.forEach((j, k) => (j.pos = k && ord[k - 1].pontos === j.pontos ? ord[k - 1].pos : k + 1));
  return ord;
}

// ───────────── desafio do dia e partida livre ─────────────

function tzDiaNumero(d = new Date()) {
  return Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - TZ_DIARIO_INICIO) / 864e5) + 1;
}

// Os ids que entram no sorteio do dia (itens e países até a linha de TZ_DIARIO_POOLS do dia).
function tzDiarioIds(dia) {
  const pool = TZ_DIARIO_POOLS.filter((p) => p.desde <= Math.max(dia, 1)).pop();
  const itens = TZ_ITENS.filter((it) => it.cat !== "paises").slice(0, pool.itens);
  const paises = TZ_ITENS.filter((it) => it.cat === "paises").slice(0, pool.paises);
  return itens.concat(paises).map((it) => it.id);
}

function tzDiarioRodadas(dia) {
  return tzSortear(tzDiarioIds(dia), TZ_RODADAS, "misto", tzRng(dia * 7919 + 41));
}

function tzLivreRodadas(categoria = "misto", rnd = Math.random) {
  return tzSortear(TZ_ITENS.map((it) => it.id), TZ_RODADAS, categoria, rnd);
}
