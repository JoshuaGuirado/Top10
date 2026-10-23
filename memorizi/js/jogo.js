// Regras do Memorizi, sem tela (testadas em tests/jogos-novos.test.js). Os quatro botões coloridos acendem numa
// sequência; depois a pessoa repete a sequência tocando neles. Acertou tudo: de 50 a 100 pontos, quanto mais rápido,
// mais (../gamezi-rodadas.js). A cada rodada a sequência é nova e um pouco mais comprida.

const MZ_INICIO = Date.UTC(2026, 9, 23); // Memorizi do dia: o dia 1 é 23/10/2026
const MZ_CORES = 4;
const MZ_TAMANHOS_DIA = [3, 3, 4, 4, 5, 5, 6, 6, 7, 8];
const MZ_MOSTRA_MS = 650; // cada cor acesa (com o intervalo)

// Temas da partida livre e do online: quantos botões e o que aparece em cada um (sem símbolo, só a cor).
// O Memorizi do dia é sempre o de 4 cores.
const MZ_TEMAS = {
  cores: { n: 4 },
  cores6: { n: 6 },
  frutas: { simbolos: ["🍎", "🍌", "🍇", "🍉"] },
  animais: { simbolos: ["🐶", "🐱", "🐸", "🐵", "🐷", "🐮"] },
  numeros: { simbolos: ["1", "2", "3", "4", "5", "6", "7", "8", "9"] },
  notas: { simbolos: ["Dó", "Ré", "Mi", "Fá", "Sol", "Lá", "Si"] },
  setas: { simbolos: ["⬆️", "➡️", "⬇️", "⬅️"] },
  formas: { simbolos: ["●", "▲", "■", "★", "◆", "♥"] },
  caras: { simbolos: ["😀", "😢", "😡", "😱", "😴", "😎"] },
  letras: { simbolos: ["A", "B", "C", "D", "E", "F"] },
  clima: { simbolos: ["☀️", "🌧️", "⛄", "⚡", "🌈", "🌪️"] },
  transportes: { simbolos: ["🚗", "🚌", "✈️", "🚲", "🚢", "🚀"] },
  bolas: { simbolos: ["⚽", "🏀", "🎾", "🏐"] },
};
const MZ_LISTA_TEMAS = Object.keys(MZ_TEMAS);

function mzTema(r) {
  return MZ_TEMAS[(r && r.tema) || "cores"] || MZ_TEMAS.cores;
}

// Quantos botões tem o tema.
function mzQtd(tema) {
  const t = MZ_TEMAS[tema] || MZ_TEMAS.cores;
  return t.n || t.simbolos.length;
}

function mzSequencia(tamanho, rnd = Math.random, tema = "cores") {
  const n = mzQtd(tema);
  const r = { seq: Array.from({ length: tamanho }, () => Math.floor(rnd() * n)) };
  if (tema !== "cores" && MZ_TEMAS[tema]) r.tema = tema;
  return r;
}

// Tempo da rodada: o tempo de mostrar a sequência mais 1,2 s por cor para repetir (e 3 s de folga).
function mzSegundos(r) {
  return Math.ceil((r.seq.length * MZ_MOSTRA_MS) / 1000 + 1 + r.seq.length * 1.2 + 3);
}

function mzDiario(dia) {
  const rnd = gzRng(dia * 7919 + 71);
  return MZ_TAMANHOS_DIA.map((n) => mzSequencia(n, rnd));
}

// Partida livre: começa com 3 e cresce um a cada 2 rodadas.
function mzLivre(tema = "cores", rnd = Math.random) {
  let k = 0;
  return () => mzSequencia(3 + Math.floor(k++ / 2), rnd, tema);
}

function mzOnline(tema = "cores", rnd = Math.random) {
  return MZ_TAMANHOS_DIA.map((n) => mzSequencia(n, rnd, tema));
}

function mzAvaliar(r, v, ms) {
  const certo = Array.isArray(v) && v.length === r.seq.length && v.every((c, i) => c === r.seq[i]);
  return { certo, pontos: certo ? gzPontosTempo(ms, mzSegundos(r)) : 0 };
}

function mzValida(r, v) {
  const n = mzQtd((r && r.tema) || "cores");
  return Array.isArray(v) && v.length >= 1 && v.length <= r.seq.length && v.every((c) => Number.isInteger(c) && c >= 0 && c < n);
}
