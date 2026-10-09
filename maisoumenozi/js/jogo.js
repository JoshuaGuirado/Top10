// Regras do Maisoumenozi, sem tela (testadas em tests/maisoumenozi.test.js).
// Aparecem dois itens do mesmo assunto: o primeiro com o número à mostra, o segundo escondido. A pessoa diz se o
// segundo tem mais ou menos. Depois, o segundo vira o primeiro da próxima rodada; a cada 3 a 5 rodadas, o assunto
// muda. Na partida livre, o primeiro erro acaba com tudo; no desafio do dia, são sempre 10 rodadas.

const MM_DIARIO_QTD = 10;
const MM_MARGEM = 1.1; // os dois números precisam ter pelo menos 10% de diferença (o assunto pode pedir mais)

// Desafio do dia: o dia 1 é 9/10/2026. Itens novos só entram no sorteio a partir do dia da linha nova,
// para não mudar o desafio de quem já jogou hoje (a conta é pela ordem em MM_ITENS).
const MM_DIARIO_INICIO = Date.UTC(2026, 9, 9);
const MM_DIARIO_POOLS = [
  { desde: 1, itens: 441 },
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
  const tema = mmTemaDe(a.tema);
  const [min, max] = a.valor < b.valor ? [a.valor, b.valor] : [b.valor, a.valor];
  return min > 0 && max / min >= tema.margem;
}

// Gera as rodadas de uma partida: { tema, a, b, p (frase), novo (assunto novo) }.
// ids: os itens que podem aparecer. Nenhum item repete na mesma partida.
function mmGerador(ids, rnd) {
  const livres = new Set(ids);
  const recentes = []; // últimos assuntos, para não voltar logo
  const frases = {}; // última frase de cada assunto
  let tema = null;
  let a = null;
  let falta = 0;

  const candidatos = (t, base) => [...livres].map(mmItem).filter((i) => i.tema === t && i.id !== base.id && mmComparaveis(base, i));

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

// ───────────── partida ─────────────

// rodadas: lista pronta (desafio do dia) ou null (partida livre: gera na hora, até errar).
function mmNovaPartida(opts) {
  const s = { modo: opts.modo || "livre", rodadas: [], atual: null, acertos: 0, marcas: [], fim: false, ultimo: null, respondida: false };
  if (opts.rodadas) {
    s.fila = opts.rodadas.slice();
  } else {
    s.proxima = mmGerador(opts.ids || MM_ITENS.map((i) => i.id), opts.rnd || Math.random);
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

// resposta: "mais" ou "menos". Devolve { certo, a, b } ou null se não dá para responder agora.
function mmResponder(s, resposta) {
  if (s.fim || !s.atual || s.respondida || (resposta !== "mais" && resposta !== "menos")) return null;
  s.respondida = true;
  const a = mmItem(s.atual.a);
  const b = mmItem(s.atual.b);
  const certo = (b.valor > a.valor) === (resposta === "mais");
  s.marcas.push(certo);
  if (certo) s.acertos += 1;
  s.ultimo = { ...s.atual, certo, resposta };
  if (s.modo === "livre" && !certo) {
    s.fim = true;
    s.atual = null;
  } else if (s.fila && !s.fila.length) {
    s.fim = true;
    s.atual = null;
  }
  return s.ultimo;
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
  const proxima = mmGerador(ids, mmRng(dia * 7919 + 41));
  const out = [];
  for (let k = 0; k < MM_DIARIO_QTD; k++) out.push(proxima());
  return out;
}
