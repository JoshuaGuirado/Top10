// Regras do Maisoumenozi, sem tela (testadas em tests/maisoumenozi.test.js).
// Rodada comum: dois itens da mesma grandeza (o de cima com o número, o de baixo escondido) e a pessoa diz se o de
// baixo tem mais ou menos. O de baixo vira o de cima da próxima. Assuntos da mesma grandeza se misturam (montanha
// contra prédio contra atleta, todos em altura), e a cada 2 ou 3 rodadas muda a grandeza.
// Rodada "uau": um par escolhido a dedo, com os dois números escondidos ("Qual pesa mais?"), e uma curiosidade.
// Modos: "relogio" (60 segundos, acerto vale 10 × combo), "livre" (até o primeiro erro) e "diario" (10 rodadas).

const MM_DIARIO_QTD = 10;
const MM_RELOGIO_SEG = 60;
const MM_MARGEM = 1.1; // os dois números precisam ter pelo menos 10% de diferença (o assunto pode pedir mais)

// Desafio do dia: o dia 1 é 9/10/2026. Itens novos só entram no sorteio a partir do dia da linha nova,
// para não mudar o desafio de quem já jogou hoje (a conta é pela ordem em MM_ITENS).
const MM_DIARIO_INICIO = Date.UTC(2026, 9, 9);
// versao 1: o jeito do primeiro dia (só assuntos, sem mistura); versao 2: mistura e rodadas "uau".
const MM_DIARIO_POOLS = [
  { desde: 1, itens: 441, versao: 1 },
  { desde: 2, itens: 511, uau: 82, versao: 2 },
];

// ───────────── assuntos e itens ─────────────

// Botões prontos ([para cima, para baixo]); cada assunto usa o que combina com ele.
const MM_BOTOES = {
  mais: [["Mais", "More", "Más"], ["Menos", "Fewer", "Menos"]],
  maior: [["Maior", "Bigger", "Mayor"], ["Menor", "Smaller", "Menor"]],
  alto: [["Mais alto", "Taller", "Más alto"], ["Mais baixo", "Shorter", "Más bajo"]],
  longo: [["Mais longo", "Longer", "Más largo"], ["Mais curto", "Shorter", "Más corto"]],
  pesado: [["Mais pesado", "Heavier", "Más pesado"], ["Mais leve", "Lighter", "Más liviano"]],
  rapido: [["Mais rápido", "Faster", "Más rápido"], ["Mais lento", "Slower", "Más lento"]],
  longe: [["Mais longe", "Farther", "Más lejos"], ["Mais perto", "Closer", "Más cerca"]],
  quente: [["Mais quente", "Hotter", "Más caliente"], ["Mais frio", "Colder", "Más frío"]],
};

const MM_TEMAS = [];
const MM_ITENS = []; // todos os itens, na ordem em que foram cadastrados (a ordem nunca muda)

// Cadastra um assunto. def: { id, titulo, unidade, perguntas, botoes, margem, itens: [[valor, pt, en, es], ...] }.
// titulo, unidade ("{n} metros"), cada pergunta e cada botão são [pt, en, es]. As perguntas não citam os nomes
// (eles estão nos cartões): falam "o de baixo", "esse", "o outro", para a frase sempre concordar.
function mmTema(def) {
  const tema = { margem: MM_MARGEM, ...def, itens: [] };
  MM_TEMAS.push(tema);
  mmMais(def.id, def.itens);
}

// Itens novos num assunto que já existe (em arquivo novo, carregado depois dos outros).
function mmMais(temaId, lista) {
  const tema = MM_TEMAS.find((x) => x.id === temaId);
  for (const [valor, ...nome] of lista) {
    const item = { id: `${temaId}-${tema.itens.length + 1}`, tema: temaId, valor, nome };
    tema.itens.push(item);
    MM_ITENS.push(item);
  }
}

let mmIndice = null;

function mmItem(id) {
  if (!mmIndice || mmIndice.size !== MM_ITENS.length) mmIndice = new Map(MM_ITENS.map((i) => [i.id, i]));
  return mmIndice.get(id) || null;
}

function mmTemaDe(id) {
  return MM_TEMAS.find((x) => x.id === id) || null;
}

// Grandezas que juntam assuntos: { id, titulo, perguntas, botoes, temas: { idDoAssunto: fator } }.
// O fator leva o número do assunto para a mesma medida (ex.: cm → m é 0,01), para comparar um com o outro.
const MM_GRUPOS = [];

function mmGrupo(def) {
  MM_GRUPOS.push(def);
  for (const [id, fator] of Object.entries(def.temas)) {
    const tema = mmTemaDe(id);
    if (tema) Object.assign(tema, { grupo: def.id, fator });
  }
}

// O "assunto" de uma rodada: a grandeza (se o assunto faz parte de uma) ou o próprio assunto.
function mmAssunto(id) {
  return MM_GRUPOS.find((g) => g.id === id) || mmTemaDe(id);
}

function mmGrupoDoItem(item) {
  const tema = mmTemaDe(item.tema);
  return tema.grupo || tema.id;
}

// Número na medida comum da grandeza.
function mmBase(item) {
  const tema = mmTemaDe(item.tema);
  return item.valor * (tema.fator || 1);
}

// Pares "uau": { pergunta, unidade, a: [valor, pt, en, es], b: [...], fato } (textos em [pt, en, es]).
const MM_UAU = [];

function mmUau(lista) {
  for (const u of lista) MM_UAU.push({ id: "u" + (MM_UAU.length + 1), ...u });
}

// Pode cair no sorteio (os assuntos marcados como fora só ficam para o desafio do dia 1).
function mmNoSorteio(item) {
  return !mmTemaDe(item.tema).fora;
}

function mmUauDe(id) {
  return MM_UAU.find((u) => u.id === id) || null;
}

function mmNome(item, l) {
  return item.nome[l] || item.nome[0];
}

// ───────────── sorte ─────────────

function mmRng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Embaralha sempre do mesmo jeito para a mesma sorte (o desafio do dia é igual em qualquer navegador).
function mmEmbaralhar(lista, rnd) {
  const a = lista.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function mmEscolher(lista, rnd) {
  return lista[Math.floor(rnd() * lista.length)];
}

// ───────────── rodadas ─────────────

// Dá para comparar: números diferentes o bastante para não ter dúvida (dados aproximados não viram pegadinha).
function mmComparaveis(a, b) {
  const margem = Math.max(mmTemaDe(a.tema).margem, mmTemaDe(b.tema).margem);
  const [x, y] = [mmBase(a), mmBase(b)];
  const [min, max] = x < y ? [x, y] : [y, x];
  return min > 0 && max / min >= margem;
}

// Jeito do primeiro dia (versao 1): um assunto por vez, sem mistura. Fica só para o desafio do dia 1 não mudar.
function mmComparaveisV1(a, b) {
  const tema = mmTemaDe(a.tema);
  const [min, max] = a.valor < b.valor ? [a.valor, b.valor] : [b.valor, a.valor];
  return min > 0 && max / min >= tema.margem;
}

function mmGeradorV1(ids, rnd) {
  const livres = new Set(ids);
  const recentes = []; // últimos assuntos, para não voltar logo
  const frases = {}; // última frase de cada assunto
  let tema = null;
  let a = null;
  let falta = 0;

  const candidatos = (t, base) => [...livres].map(mmItem).filter((i) => i.tema === t && i.id !== base.id && mmComparaveisV1(base, i));

  function trocarAssunto() {
    const temas = [...new Set([...livres].map((id) => mmItem(id).tema))];
    const opcoes = temas.filter((t) => !recentes.includes(t));
    const ordem = mmEmbaralhar(opcoes.length ? opcoes : temas, rnd);
    for (const t of ordem) {
      const itens = [...livres].map(mmItem).filter((i) => i.tema === t);
      const base = mmEscolher(itens, rnd);
      if (base && candidatos(t, base).length) {
        tema = t;
        a = base;
        livres.delete(base.id);
        falta = 3 + Math.floor(rnd() * 3);
        recentes.push(t);
        if (recentes.length > Math.min(4, MM_TEMAS.length - 1)) recentes.shift();
        return true;
      }
    }
    return false;
  }

  return function proxima() {
    let novo = false;
    if (!tema || falta <= 0 || !candidatos(tema, a).length) {
      if (!trocarAssunto()) return null;
      novo = true;
    }
    // Prefere números mais próximos (mais difícil), mas às vezes vem um fácil.
    const cs = candidatos(tema, a).sort((x, y) => Math.abs(Math.log(x.valor / a.valor)) - Math.abs(Math.log(y.valor / a.valor)));
    const b = rnd() < 0.6 ? mmEscolher(cs.slice(0, Math.max(1, Math.ceil(cs.length / 3))), rnd) : mmEscolher(cs, rnd);
    livres.delete(b.id);
    const n = mmTemaDe(tema).perguntas.length;
    let p = Math.floor(rnd() * n);
    if (n > 1 && p === frases[tema]) p = (p + 1) % n;
    frases[tema] = p;
    const rodada = { tema, a: a.id, b: b.id, p, novo };
    a = b;
    falta -= 1;
    return rodada;
  };
}

// Gera as rodadas de uma partida. Rodada comum: { tema (grandeza ou assunto), a, b, p (frase), novo }.
// Rodada uau: { uau: id, novo: true }. ids: itens que podem aparecer; uaus: pares uau. Nada repete na partida.
function mmGerador(ids, rnd, uaus = [], uauNas = null) {
  const livres = new Set(ids.filter((id) => mmNoSorteio(mmItem(id))));
  const uauFila = mmEmbaralhar(uaus, rnd);
  const recentes = []; // últimas grandezas, para não voltar logo
  const frases = {};
  let grupo = null;
  let a = null;
  let falta = 0;
  let desdeUau = 0;
  let geradas = 0;

  const itensDo = (g) => [...livres].map(mmItem).filter((i) => mmGrupoDoItem(i) === g);
  const candidatos = (g, base) => itensDo(g).filter((i) => i.id !== base.id && mmComparaveis(base, i));

  function trocarGrandeza() {
    const grupos = [...new Set([...livres].map((id) => mmGrupoDoItem(mmItem(id))))];
    const opcoes = grupos.filter((g) => !recentes.includes(g));
    for (const g of mmEmbaralhar(opcoes.length ? opcoes : grupos, rnd)) {
      const base = mmEscolher(itensDo(g), rnd);
      if (base && candidatos(g, base).length) {
        grupo = g;
        a = base;
        livres.delete(base.id);
        falta = 2 + Math.floor(rnd() * 2);
        recentes.push(g);
        if (recentes.length > 6) recentes.shift();
        return true;
      }
    }
    return false;
  }

  function rodadaUau() {
    grupo = null;
    desdeUau = 0;
    return { uau: uauFila.shift(), novo: true };
  }

  return function proxima() {
    geradas += 1;
    // uauNas (desafio do dia): o par uau cai sempre nas mesmas rodadas. Senão, de tempos em tempos.
    if (uauNas && uauFila.length && uauNas.includes(geradas)) return rodadaUau();
    const trocar = !grupo || falta <= 0 || !candidatos(grupo, a).length;
    if (!uauNas && uauFila.length && desdeUau >= 2 && rnd() < 0.5) return rodadaUau();
    let novo = false;
    if (trocar) {
      if (!trocarGrandeza()) return uauFila.length ? rodadaUau() : null;
      novo = true;
    }
    const base = mmBase(a);
    const cs = candidatos(grupo, a).sort((x, y) => Math.abs(Math.log(mmBase(x) / base)) - Math.abs(Math.log(mmBase(y) / base)));
    const b = rnd() < 0.6 ? mmEscolher(cs.slice(0, Math.max(1, Math.ceil(cs.length / 3))), rnd) : mmEscolher(cs, rnd);
    livres.delete(b.id);
    const n = mmAssunto(grupo).perguntas.length;
    let p = Math.floor(rnd() * n);
    if (n > 1 && p === frases[grupo]) p = (p + 1) % n;
    frases[grupo] = p;
    const rodada = { tema: grupo, a: a.id, b: b.id, p, novo };
    a = b;
    falta -= 1;
    desdeUau += 1;
    return rodada;
  };
}

// ───────────── partida ─────────────

// rodadas: lista pronta (desafio do dia) ou nada (gera na hora: "livre" até errar, "relogio" até o tempo acabar).
function mmNovaPartida(opts) {
  const s = {
    modo: opts.modo || "livre", rodadas: [], atual: null, acertos: 0, marcas: [], fim: false, ultimo: null, respondida: false,
    pontos: 0, combo: 0, maiorCombo: 0,
  };
  if (opts.rodadas) {
    s.fila = opts.rodadas.slice();
  } else {
    s.proxima = mmGerador(opts.ids || MM_ITENS.map((i) => i.id), opts.rnd || Math.random, opts.uaus || MM_UAU.map((u) => u.id));
  }
  mmAvancar(s);
  return s;
}

function mmAvancar(s) {
  const r = s.fila ? s.fila.shift() : s.proxima();
  if (!r) {
    s.atual = null;
    s.fim = true;
    return;
  }
  s.atual = r;
  s.rodadas.push(r);
}

// Multiplicador do combo: x1 nos 2 primeiros acertos seguidos, x2 do 3º, x3 do 6º… até x5.
function mmMultiplicador(combo) {
  return Math.min(5, 1 + Math.floor(combo / 3));
}

// Os dois números da rodada (comum: na medida comum; uau: os do par).
function mmValores(r) {
  if (r.uau) {
    const u = mmUauDe(r.uau);
    return [u.a[0], u.b[0]];
  }
  return [mmBase(mmItem(r.a)), mmBase(mmItem(r.b))];
}

// resposta: "mais"/"menos" (rodada comum, sobre o de baixo) ou "a"/"b" (rodada uau, qual tem mais).
// Devolve { certo, ganhou, ... } ou null se não dá para responder agora.
function mmResponder(s, resposta) {
  if (s.fim || !s.atual || s.respondida) return null;
  const uau = !!s.atual.uau;
  if (uau ? !["a", "b"].includes(resposta) : !["mais", "menos"].includes(resposta)) return null;
  s.respondida = true;
  const [va, vb] = mmValores(s.atual);
  const certo = uau ? (resposta === "b") === (vb > va) : (vb > va) === (resposta === "mais");
  s.marcas.push(certo);
  let ganhou = 0;
  if (certo) {
    s.acertos += 1;
    s.combo += 1;
    s.maiorCombo = Math.max(s.maiorCombo, s.combo);
    ganhou = (uau ? 20 : 10) * mmMultiplicador(s.combo - 1);
    s.pontos += ganhou;
  } else s.combo = 0;
  s.ultimo = { ...s.atual, certo, resposta, ganhou };
  if (s.modo === "livre" && !certo) {
    s.fim = true;
    s.atual = null;
  } else if (s.fila && !s.fila.length) {
    s.fim = true;
    s.atual = null;
  }
  return s.ultimo;
}

// O tempo do modo relógio acabou (quem conta o tempo é a tela).
function mmTempoAcabou(s) {
  s.fim = true;
  s.atual = null;
}

// Depois de mostrar se acertou: a próxima rodada.
function mmProxima(s) {
  if (s.fim || !s.respondida) return false;
  s.respondida = false;
  mmAvancar(s);
  return !s.fim;
}

// ───────────── desafio do dia ─────────────

function mmDiaNumero(d = new Date()) {
  return Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - MM_DIARIO_INICIO) / 864e5) + 1;
}

function mmDiarioRodadas(dia) {
  const pool = MM_DIARIO_POOLS.filter((p) => p.desde <= Math.max(dia, 1)).pop();
  const ids = MM_ITENS.slice(0, pool.itens).map((i) => i.id);
  const proxima = pool.versao === 1
    ? mmGeradorV1(ids, mmRng(dia * 7919 + 41))
    : mmGerador(ids, mmRng(dia * 7919 + 41), MM_UAU.slice(0, pool.uau).map((u) => u.id), [2, 4, 6, 8, 10]);
  const out = [];
  for (let k = 0; k < MM_DIARIO_QTD; k++) out.push(proxima());
  return out;
}
