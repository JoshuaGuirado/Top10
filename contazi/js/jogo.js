// Regras do Contazi, sem tela (testadas em tests/jogos-novos.test.js). Aparece uma conta; a pessoa digita o
// resultado antes de acabar o tempo. Acertou: de 50 a 100 pontos, quanto mais rápido, mais (../gamezi-rodadas.js).
// As contas ficam mais difíceis a cada rodada (nível de 1 a 10) e nunca dão resultado negativo nem com vírgula.

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
function ctLivre(rnd = Math.random) {
  let k = 0;
  return () => ctConta(Math.min(10, 1 + Math.floor(k++ / 3)), rnd);
}

function ctOnline(rnd = Math.random) {
  return CT_NIVEIS_ONLINE.map((nv) => ctConta(nv, rnd));
}

function ctAvaliar(r, v, ms) {
  const certo = Number(v) === r.resposta;
  return { certo, pontos: certo ? gzPontosTempo(ms, CT_SEGUNDOS) : 0 };
}

function ctValida(r, v) {
  return Number.isInteger(v) && v >= 0 && v < 1e7;
}
