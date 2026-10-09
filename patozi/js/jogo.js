// Regras do Patozi, sem tela (dá para testar no Node). O estado da partida é um objeto simples
// (só números, textos e ids de carta), então o modo online manda ele inteiro pelo Realtime.
//
// Rodada: uma carta com pergunta de resposta numérica. Cada um, na sua vez, chuta um número MAIOR que o
// último chute ou grita "Nem a pato!", duvidando de que o último chute ainda caiba na resposta.
// Revela: se o último chute passou da resposta, quem chutou fica com a carta; se não passou, fica quem
// duvidou. Quem ficou com a carta começa a próxima rodada. Quando alguém junta a meta de cartas, o jogo
// acaba e quem tiver mais patos perde; todo o resto ganha.
//
// Regras extras (opcionais): "Dobrei" (chutar o dobro ou mais do chute anterior dá um escudo que tira um
// pato no fim) e "Na mosca" (quem duvida de um chute exato leva a carta com patos em dobro).

const PZ_MAX_JOGADORES = 10;
const PZ_MAX_CHUTE = 1e12;

// Pato do dia: o dia 1 é 8/10/2026. Cartas novas só entram no sorteio a partir do dia da linha nova,
// para não mudar o desafio de quem já jogou hoje. semAposentadas: a partir dessa linha, as cartas óbvias
// de data/aposentadas.js ficam fora.
const PZ_DIARIO_INICIO = Date.UTC(2026, 9, 8);
const PZ_DIARIO_QTD = 5;
const PZ_DIARIO_POOLS = [
  { desde: 1, cartas: 437 },
  { desde: 2, cartas: 831, semAposentadas: true }, // 9/10/2026: temas novos e cartas-6 (km, tamanhos, quantidades); só cartas difíceis
  { desde: 3, cartas: 931, semAposentadas: true }, // 10/10/2026: cartas-7 (mais 100 difíceis)
];

// ───────────── sorte ─────────────

function pzRng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pzEmbaralhar(arr, rnd = Math.random) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pzGauss(rnd) {
  const u = Math.max(rnd(), 1e-9);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rnd());
}

// Probabilidade de uma normal padrão ficar abaixo de x.
function pzPhi(x) {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp((-x * x) / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return x > 0 ? 1 - p : p;
}

// ───────────── cartas ─────────────

let pzIndice = null;

function pzCarta(id) {
  if (!pzIndice || pzIndice.size !== PZ_CARTAS.length) pzIndice = new Map(PZ_CARTAS.map((c) => [c.id, c]));
  return pzIndice.get(id) || null;
}

// Cartas que entram nas partidas: as dos temas escolhidos, menos as óbvias demais (data/aposentadas.js).
function pzCartasDosTemas(temas) {
  const ok = temas && temas.length ? new Set(temas) : null;
  return PZ_CARTAS.filter((c) => (!ok || ok.has(c.tema)) && !PZ_APOSENTADAS.has(c.id)).map((c) => c.id);
}

// Quantas cartas alguém precisa juntar para o jogo acabar.
function pzMeta(nJogadores, duracao = "normal") {
  const base = nJogadores <= 4 ? 5 : nJogadores <= 7 ? 4 : 3;
  return Math.max(2, base + ({ rapida: -2, normal: 0, longa: 2 }[duracao] || 0));
}

// ───────────── partida ─────────────

function pzNovaPartida(opts, rnd = Math.random) {
  const jogadores = opts.jogadores.slice(0, PZ_MAX_JOGADORES).map((j) => ({
    id: j.id, nome: j.nome, cor: j.cor, pato: j.pato || null, bot: !!j.bot, cartas: [], dobreis: 0,
  }));
  const temas = opts.temas || [];
  const duracao = opts.duracao || "normal";
  const s = {
    v: 1,
    jogadores,
    config: { temas, duracao, meta: pzMeta(jogadores.length, duracao), dobrei: opts.dobrei !== false, mosca: opts.mosca !== false },
    baralho: pzEmbaralhar(pzCartasDosTemas(temas), rnd),
    usadas: [],
    // opts.comeca: índice de quem abre a primeira rodada; sem ele, sorteia.
    vez: ((sorteio) => (Number.isInteger(opts.comeca) && opts.comeca >= 0 && opts.comeca < jogadores.length ? opts.comeca : sorteio))(Math.floor(rnd() * jogadores.length)),
    rodada: 0,
    carta: null,
    lances: [],
    fase: "lance",
    resultado: null,
    fim: false,
    hist: [],
    seq: 0,
  };
  pzNovaRodada(s, null, rnd);
  return s;
}

function pzNovaRodada(s, quemComeca, rnd = Math.random) {
  if (!s.baralho.length) {
    s.baralho = pzEmbaralhar(s.usadas, rnd);
    s.usadas = [];
  }
  s.carta = s.baralho.pop();
  s.usadas.push(s.carta);
  s.lances = [];
  s.fase = "lance";
  s.resultado = null;
  s.rodada += 1;
  if (quemComeca != null) s.vez = quemComeca;
  s.seq += 1;
}

function pzUltimo(s) {
  return s.lances.length ? s.lances[s.lances.length - 1] : null;
}

function pzMinimo(s) {
  const u = pzUltimo(s);
  return u ? u.valor + 1 : 1;
}

function pzProximo(s, j) {
  return (j + 1) % s.jogadores.length;
}

// Devolve um código de erro (texto) ou null se deu certo.
function pzChutar(s, j, valor) {
  if (s.fase !== "lance") return "fase";
  if (j !== s.vez) return "vez";
  if (!Number.isInteger(valor) || valor > PZ_MAX_CHUTE) return "numero";
  if (valor < pzMinimo(s)) return "baixo";
  const u = pzUltimo(s);
  const dobrei = !!(s.config.dobrei && u && valor >= u.valor * 2);
  if (dobrei) s.jogadores[j].dobreis += 1;
  s.lances.push({ j, valor, dobrei });
  s.vez = pzProximo(s, j);
  s.seq += 1;
  return null;
}

function pzDuvidar(s, j) {
  if (s.fase !== "lance") return "fase";
  if (j !== s.vez) return "vez";
  const u = pzUltimo(s);
  if (!u) return "sem-chute";
  const carta = pzCarta(s.carta);
  const resposta = carta.resposta;
  const passou = u.valor > resposta;
  const mosca = !!(s.config.mosca && u.valor === resposta);
  const perdedor = passou ? u.j : j;
  const patos = carta.patos * (mosca ? 2 : 1);
  s.jogadores[perdedor].cartas.push({ id: carta.id, patos });
  s.resultado = { desafiante: j, chutador: u.j, valor: u.valor, resposta, passou, mosca, perdedor, patos };
  s.hist.push({ carta: carta.id, ...s.resultado });
  s.fase = "revelado";
  s.fim = s.jogadores.some((p) => p.cartas.length >= s.config.meta);
  s.seq += 1;
  return null;
}

function pzProxima(s, rnd = Math.random) {
  if (s.fase !== "revelado" || s.fim) return "fase";
  pzNovaRodada(s, s.resultado.perdedor, rnd);
  return null;
}

function pzPatos(p) {
  return Math.max(0, p.cartas.reduce((n, c) => n + c.patos, 0) - p.dobreis);
}

// Do que se saiu melhor (menos patos) para o pato. Quem tiver mais patos perde (empate: perdem juntos).
function pzPlacar(s) {
  const linhas = s.jogadores.map((p, i) => ({ i, nome: p.nome, cor: p.cor, pato: p.pato, bot: p.bot, id: p.id, cartas: p.cartas.length, dobreis: p.dobreis, patos: pzPatos(p) }));
  const max = Math.max(...linhas.map((l) => l.patos));
  linhas.forEach((l) => (l.perdeu = l.patos === max));
  return linhas.sort((a, b) => a.patos - b.patos || a.cartas - b.cartas || a.i - b.i);
}

// ───────────── computador ─────────────

// Cada computador tem um "palpite interno" por carta: perto da resposta, mais longe nas difíceis.
function pzBotPalpite(carta, rnd = Math.random) {
  const g = pzGauss(rnd);
  if (carta.ano) {
    const s = [5, 18, 45][carta.patos - 1] || 18;
    return { ano: true, est: carta.resposta + g * s, s };
  }
  const sig = [0.15, 0.32, 0.55][carta.patos - 1] || 0.32;
  return { ano: false, est: carta.resposta * Math.exp(g * sig), s: sig };
}

// Na cabeça do computador, qual a chance de "valor" ainda caber na resposta.
function pzBotChance(b, valor) {
  if (b.ano) return pzPhi((b.est + 0.5 - valor) / b.s);
  return pzPhi((Math.log(Math.max(b.est, 0.5) + 0.5) - Math.log(Math.max(valor, 0.5))) / b.s);
}

// Número redondo, como uma pessoa chutaria (2 algarismos significativos).
function pzRedondo(x) {
  if (x < 20) return Math.max(1, Math.round(x));
  const p = 10 ** (Math.floor(Math.log10(x)) - 1);
  return Math.round(x / p) * p;
}

// O próximo número redondo acima de v.
function pzSubir(v, ano) {
  if (ano || v < 20) return v + 1;
  const p = 10 ** (Math.floor(Math.log10(v)) - 1);
  return (Math.floor(v / p) + 1) * p;
}

function pzBotJogada(s, b, rnd = Math.random) {
  const u = pzUltimo(s);
  const ousadia = (rnd() - 0.5) * 0.12;
  if (u && pzBotChance(b, u.valor) < 0.42 + ousadia) return { tipo: "duvidar" };
  const minimo = pzMinimo(s);
  const alvo = b.ano ? Math.round(b.est - b.s * (0.2 + 0.7 * rnd())) : pzRedondo(b.est * Math.exp(-b.s * (0.2 + 0.8 * rnd())));
  let valor = Math.max(minimo, pzSubir(u ? u.valor : 0, b.ano));
  if (alvo > valor && (!u || rnd() < 0.55)) valor = alvo;
  if (!u) valor = Math.max(1, alvo);
  if (u && pzBotChance(b, valor) < 0.36) return { tipo: "duvidar" };
  return { tipo: "chutar", valor: Math.max(valor, minimo) };
}

// ───────────── Pato do dia ─────────────

function pzDiaNumero(d = new Date()) {
  return Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - PZ_DIARIO_INICIO) / 864e5) + 1;
}

function pzDiarioCartas(dia) {
  const pool = PZ_DIARIO_POOLS.filter((p) => p.desde <= Math.max(dia, 1)).pop();
  const candidatas = PZ_CARTAS.slice(0, pool.cartas)
    .filter((c) => !c.ano && c.resposta >= 10 && !(pool.semAposentadas && PZ_APOSENTADAS.has(c.id)))
    .map((c) => c.id);
  return pzEmbaralhar(candidatas, pzRng(dia * 7919 + 13)).slice(0, PZ_DIARIO_QTD);
}

// Quanto mais perto da resposta sem passar, mais pontos (até 100 por carta). Passou: zero.
function pzDiarioPontos(chute, resposta) {
  if (!Number.isFinite(chute) || chute < 0 || chute > resposta) return 0;
  return Math.floor((100 * chute) / resposta);
}
