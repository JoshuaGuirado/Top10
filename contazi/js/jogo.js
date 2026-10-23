// Regras do Contazi, sem tela (testadas em tests/jogos-novos.test.js). Aparece uma conta; a pessoa digita o
// resultado antes de acabar o tempo. Acertou: de 50 a 100 pontos, quanto mais rápido, mais (../gamezi-rodadas.js).
// As contas ficam mais difíceis a cada rodada (nível de 1 a 10) e nunca dão resultado negativo nem com vírgula.
// Temas (partida livre e online): misto, soma e subtração, tabuada, divisão, ordem das operações, porcentagem,
// frações, potências e raízes, dobro e metade, dinheiro, horas, números romanos e sequências. O Contazi do dia
// continua com as contas do misto de sempre (ctConta). Uma conta é { texto, resposta, seg? }: texto é uma frase
// ou [pt, en, es]; com "?" no texto a tela não põe o "=" no fim; seg dá mais tempo para as que precisam de leitura.

const CT_INICIO = Date.UTC(2026, 9, 23); // Contazi do dia: o dia 1 é 23/10/2026
const CT_SEGUNDOS = 12;
const CT_NIVEIS_DIA = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const CT_NIVEIS_ONLINE = [2, 3, 4, 5, 6, 6, 7, 8, 9, 10];

function ctFazer(texto, resposta) {
  return { texto, resposta };
}

// Uma conta do nível (1: soma até 20 … 10: duas contas seguidas com números grandes).
function ctConta(nivel, rnd = Math.random) {
  const n = (a, b) => gzInteiro(a, b, rnd);
  const tipo = Math.floor(rnd() * 3);
  if (nivel <= 2) {
    const a = n(2, 9 + nivel * 4), b = n(2, 9 + nivel * 4);
    return tipo === 0 && a !== b ? ctFazer(`${Math.max(a, b)} − ${Math.min(a, b)}`, Math.abs(a - b)) : ctFazer(`${a} + ${b}`, a + b);
  }
  if (nivel <= 4) {
    if (tipo === 0) { const a = n(2, 9), b = n(2, 9); return ctFazer(`${a} × ${b}`, a * b); }
    const a = n(12, 40 + nivel * 10), b = n(11, 40 + nivel * 10);
    return tipo === 1 ? ctFazer(`${a} + ${b}`, a + b) : ctFazer(`${Math.max(a, b)} − ${Math.min(a, b)}`, Math.abs(a - b));
  }
  if (nivel <= 6) {
    if (tipo === 0) { const b = n(3, 12), r = n(3, 12); return ctFazer(`${b * r} ÷ ${b}`, r); }
    if (tipo === 1) { const a = n(6, 12 + nivel), b = n(6, 12); return ctFazer(`${a} × ${b}`, a * b); }
    const a = n(11, 60), b = n(11, 60), c = n(11, 60);
    return ctFazer(`${a} + ${b} + ${c}`, a + b + c);
  }
  if (nivel <= 8) {
    if (tipo === 0) { const a = n(3, 12), b = n(3, 12), c = n(2, 40); return ctFazer(`${a} × ${b} + ${c}`, a * b + c); }
    if (tipo === 1) { const a = n(120, 400 + nivel * 50), b = n(101, 400); return ctFazer(`${Math.max(a, b)} − ${Math.min(a, b)}`, Math.abs(a - b)); }
    const p = [10, 25, 50][n(0, 2)], base = p === 25 ? 4 * n(5, 60) : p === 50 ? 2 * n(10, 150) : 10 * n(3, 90);
    return ctFazer(`${p}% × ${base}`, (base * p) / 100);
  }
  if (tipo === 0) { const a = n(12, 25), b = n(6, 15), c = n(5, 60); return ctFazer(`${a} × ${b} − ${c}`, a * b - c); }
  if (tipo === 1) { const b = n(6, 15), r = n(12, 40); return ctFazer(`${b * r} ÷ ${b}`, r); }
  const a = n(13, 30), b = n(13, 30);
  return ctFazer(`${a} × ${b}`, a * b);
}

function ctDiario(dia) {
  const rnd = gzRng(dia * 7919 + 13);
  return CT_NIVEIS_DIA.map((nv) => ctConta(nv, rnd));
}

// Partida livre: sobe um nível a cada 3 contas, até o 10.
function ctLivre(tema = "misto", rnd = Math.random) {
  let k = 0;
  return () => ctDoTema(tema, Math.min(10, 1 + Math.floor(k++ / 3)), rnd);
}

function ctOnline(tema = "misto", rnd = Math.random) {
  return CT_NIVEIS_ONLINE.map((nv) => ctDoTema(tema, nv, rnd));
}

// ───────────── temas ─────────────

const CT_TEMAS = ["misto", "soma", "tabuada", "divisao", "ordem", "porcentagem", "fracao", "potencia", "dobro", "dinheiro", "horas", "romanos", "sequencia"];
const CT_LIMITE = [5, 6, 7, 8, 9, 10, 12, 13, 15, 20]; // maior fator da tabuada em cada nível

// Uma conta do tema e do nível. O misto alterna as contas de sempre com as dos outros temas.
function ctDoTema(tema, nivel, rnd = Math.random) {
  if (tema === "misto" || !CT_GERADORES[tema]) {
    if (rnd() < 0.5) return ctConta(nivel, rnd);
    const outros = CT_TEMAS.filter((x) => x !== "misto");
    tema = outros[Math.floor(rnd() * outros.length)];
  }
  return CT_GERADORES[tema](nivel, rnd);
}

const CT_SOBRESCRITO = { 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹" };

function ctPotencia(base, exp) {
  return `${base}${String(exp).split("").map((d) => CT_SOBRESCRITO[d]).join("")}`;
}

function ctRomano(n) {
  const tab = [[1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"], [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
  let out = "";
  for (const [v, l] of tab) while (n >= v) { out += l; n -= v; }
  return out;
}

const CT_GERADORES = {
  soma(nivel, rnd) {
    const max = [10, 20, 30, 50, 80, 100, 200, 500, 800, 1000][nivel - 1];
    const n = () => gzInteiro(Math.max(2, Math.floor(max / 10)), max, rnd);
    if (nivel >= 7 && rnd() < 0.4) {
      const a = n(), b = n(), c = gzInteiro(2, Math.min(a + b - 1, max), rnd);
      return ctFazer(`${a} + ${b} − ${c}`, a + b - c);
    }
    const a = n(), b = n();
    return rnd() < 0.5 || a === b ? ctFazer(`${a} + ${b}`, a + b) : ctFazer(`${Math.max(a, b)} − ${Math.min(a, b)}`, Math.abs(a - b));
  },
  tabuada(nivel, rnd) {
    const a = gzInteiro(2, CT_LIMITE[nivel - 1], rnd), b = gzInteiro(2, CT_LIMITE[nivel - 1], rnd);
    return ctFazer(`${a} × ${b}`, a * b);
  },
  divisao(nivel, rnd) {
    const b = gzInteiro(2, CT_LIMITE[nivel - 1], rnd), r = gzInteiro(2, CT_LIMITE[nivel - 1] + nivel, rnd);
    return ctFazer(`${b * r} ÷ ${b}`, r);
  },
  ordem(nivel, rnd) {
    const n = (a, b) => gzInteiro(a, b, rnd);
    for (;;) {
      const a = n(2, 5 + nivel * 2), b = n(2, 4 + nivel), c = n(2, 4 + nivel), d = n(2, 9);
      const formas = [
        [`${a} + ${b} × ${c}`, a + b * c],
        [`${b * c + a} − ${b} × ${c}`, a],
        [`(${a} + ${b}) × ${c}`, (a + b) * c],
        [`${a} × ${b} − ${c} × ${d}`, a * b - c * d],
        [`${a} + ${b * d} ÷ ${d}`, a + b],
        [`(${a} + ${b}) × ${c} − ${d}`, (a + b) * c - d],
        [`${a} × (${b} + ${c}) ÷ ${a}`, b + c],
      ];
      const [texto, resposta] = formas[Math.floor(rnd() * Math.min(formas.length, 2 + Math.ceil(nivel / 2)))];
      if (resposta >= 0) return ctFazer(texto, resposta);
    }
  },
  porcentagem(nivel, rnd) {
    const p = [50, 10, 25, 20, 5, 75, 30, 15, 40, 60][gzInteiro(0, Math.min(9, nivel), rnd)];
    const passo = 100 / ctMdc(p, 100);
    const base = passo * gzInteiro(1, 4 + nivel * 3, rnd);
    return ctFazer(`${p}% × ${base}`, (base * p) / 100);
  },
  fracao(nivel, rnd) {
    const d = [2, 3, 4, 5, 6, 8, 10][gzInteiro(0, Math.min(6, 1 + Math.floor(nivel / 2)), rnd)];
    let num = gzInteiro(1, d - 1, rnd);
    while (ctMdc(num, d) > 1) num -= 1; // fração simplificada (2/8 vira 1/8)
    const base = d * gzInteiro(2, 3 + nivel * 2, rnd);
    return ctFazer([`${num}/${d} de ${base}`, `${num}/${d} of ${base}`, `${num}/${d} de ${base}`], (base / d) * num);
  },
  potencia(nivel, rnd) {
    const tipo = gzInteiro(0, Math.min(3, Math.floor(nivel / 3)), rnd);
    if (tipo === 0) { const b = gzInteiro(2, 5 + nivel, rnd); return ctFazer(ctPotencia(b, 2), b * b); }
    if (tipo === 1) { const b = gzInteiro(2, 6 + nivel * 2, rnd); return ctFazer(`√${b * b}`, b); }
    if (tipo === 2) { const b = gzInteiro(2, 6, rnd); return ctFazer(ctPotencia(b, 3), b * b * b); }
    const e = gzInteiro(4, 10, rnd);
    return ctFazer(ctPotencia(2, e), 2 ** e);
  },
  dobro(nivel, rnd) {
    const n = gzInteiro(4 + nivel * 2, 20 + nivel * 15, rnd);
    const tipo = gzInteiro(0, Math.min(3, 1 + Math.floor(nivel / 3)), rnd);
    if (tipo === 0) return ctFazer([`Dobro de ${n}`, `Double ${n}`, `Doble de ${n}`], n * 2);
    if (tipo === 1) return ctFazer([`Metade de ${n * 2}`, `Half of ${n * 2}`, `Mitad de ${n * 2}`], n);
    if (tipo === 2) return ctFazer([`Triplo de ${n}`, `Triple ${n}`, `Triple de ${n}`], n * 3);
    return ctFazer([`Um quarto de ${n * 4}`, `A quarter of ${n * 4}`, `Un cuarto de ${n * 4}`], n);
  },
  dinheiro(nivel, rnd) {
    const r = { seg: 18 };
    if (nivel <= 4 || rnd() < 0.4) {
      const nota = [10, 20, 50, 100, 100, 200][Math.min(5, Math.floor(nivel / 2))];
      const preco = gzInteiro(Math.floor(nota / 5), nota - 1, rnd);
      return { ...r, ...ctFazer([`Custou R$\u00a0${preco}. Pagou com R$\u00a0${nota}. Troco?`, `It cost $${preco}. You paid with $${nota}. Change?`, `Costó $${preco}. Pagaste con $${nota}. ¿Vuelto?`], nota - preco) };
    }
    const q = gzInteiro(2, 3 + Math.floor(nivel / 2), rnd), preco = gzInteiro(3, 6 + nivel * 3, rnd);
    if (rnd() < 0.5) return { ...r, ...ctFazer([`${q} itens de R$\u00a0${preco}. Total?`, `${q} items at $${preco} each. Total?`, `${q} cosas de $${preco}. ¿Total?`], q * preco) };
    const nota = Math.ceil((q * preco + 1) / 50) * 50;
    return { ...r, ...ctFazer([`${q} itens de R$\u00a0${preco}, pagos com R$\u00a0${nota}. Troco?`, `${q} items at $${preco}, paid with $${nota}. Change?`, `${q} cosas de $${preco}, pagadas con $${nota}. ¿Vuelto?`], nota - q * preco) };
  },
  horas(nivel, rnd) {
    const r = { seg: 18 };
    const tipo = gzInteiro(0, Math.min(4, Math.floor(nivel / 2)), rnd);
    if (tipo === 0) { const h = gzInteiro(1, 5, rnd), m = 5 * gzInteiro(1, 11, rnd); return { ...r, ...ctFazer([`${h} h ${m} min em minutos?`, `${h} h ${m} min in minutes?`, `¿${h} h ${m} min en minutos?`], h * 60 + m) }; }
    if (tipo === 1) { const m = gzInteiro(2, 12, rnd); return { ...r, ...ctFazer([`${m} min em segundos?`, `${m} min in seconds?`, `¿${m} min en segundos?`], m * 60) }; }
    if (tipo === 2) { const d = gzInteiro(2, 9, rnd); return { ...r, ...ctFazer([`${d} dias em horas?`, `${d} days in hours?`, `¿${d} días en horas?`], d * 24) }; }
    if (tipo === 3) { const sem = gzInteiro(2, 12, rnd); return { ...r, ...ctFazer([`${sem} semanas em dias?`, `${sem} weeks in days?`, `¿${sem} semanas en días?`], sem * 7) }; }
    const m = 15 * gzInteiro(1, 3, rnd), h = gzInteiro(1, 2, rnd);
    return { ...r, ...ctFazer([`${h} h ${m} min em segundos?`, `${h} h ${m} min in seconds?`, `¿${h} h ${m} min en segundos?`], (h * 60 + m) * 60) };
  },
  romanos(nivel, rnd) {
    const max = [10, 20, 30, 50, 100, 200, 500, 1000, 2000, 3000][nivel - 1];
    const n = gzInteiro(Math.max(2, Math.floor(max / 4)), max, rnd);
    return ctFazer(ctRomano(n), n);
  },
  sequencia(nivel, rnd) {
    const r = { seg: 15 };
    const tipo = gzInteiro(0, Math.min(4, Math.floor(nivel / 2)), rnd);
    let seq;
    if (tipo === 0) { const a = gzInteiro(1, 20, rnd), k = gzInteiro(2, 4 + nivel, rnd); seq = [0, 1, 2, 3, 4].map((i) => a + k * i); }
    else if (tipo === 1) { const a = gzInteiro(1, 5, rnd), k = gzInteiro(2, 3, rnd); seq = [0, 1, 2, 3, 4].map((i) => a * k ** i); }
    else if (tipo === 2) { const a = gzInteiro(1, 6, rnd); seq = [0, 1, 2, 3, 4].map((i) => (a + i) ** 2); }
    else if (tipo === 3) { let x = gzInteiro(1, 5, rnd), y = gzInteiro(x, x + 4, rnd); seq = [x, y]; while (seq.length < 6) seq.push(seq[seq.length - 1] + seq[seq.length - 2]); }
    else { const a = gzInteiro(60, 120, rnd), k = gzInteiro(3, 9, rnd); seq = [0, 1, 2, 3, 4].map((i) => a - k * i); }
    const resposta = seq.pop();
    return { ...r, ...ctFazer(`${seq.join(", ")}, ?`, resposta) };
  },
};

function ctMdc(a, b) {
  return b ? ctMdc(b, a % b) : a;
}

function ctSegundos(r) {
  return r.seg || CT_SEGUNDOS;
}

function ctAvaliar(r, v, ms) {
  const certo = Number(v) === r.resposta;
  return { certo, pontos: certo ? gzPontosTempo(ms, ctSegundos(r)) : 0 };
}

function ctValida(r, v) {
  return Number.isInteger(v) && v >= 0 && v < 1e7;
}
