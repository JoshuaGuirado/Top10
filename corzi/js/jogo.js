// Regras do Corzi, sem tela (testadas em tests/jogos-fotozi-censurazi-corzi.test.js). Aparece o nome de uma cor escrito
// com a tinta de outra ("AZUL" pintado de vermelho). A rodada pede a COR da tinta ou a PALAVRA escrita, e a pessoa toca
// na alternativa certa (são 4, sempre com as duas que confundem). Acertou: de 50 a 100 pontos, quanto mais rápido, mais
// (../gamezi-rodadas.js). Quanto mais longe na partida, mais difícil: menos tempo e alternativas também pintadas.

const CZR_INICIO = Date.UTC(2026, 9, 26); // Corzi do dia: o dia 1 é 26/10/2026
// Cores (a tinta aparece num cartão escuro, então todas se leem bem, até o amarelo e o branco).
const CZR_CORES = [
  { id: "vermelho", hex: "#FF4136", nome: ["VERMELHO", "RED", "ROJO"] },
  { id: "azul", hex: "#3D7BFF", nome: ["AZUL", "BLUE", "AZUL"] },
  { id: "verde", hex: "#2ECC40", nome: ["VERDE", "GREEN", "VERDE"] },
  { id: "amarelo", hex: "#FFDC00", nome: ["AMARELO", "YELLOW", "AMARILLO"] },
  { id: "roxo", hex: "#B163FF", nome: ["ROXO", "PURPLE", "MORADO"] },
  { id: "laranja", hex: "#FF851B", nome: ["LARANJA", "ORANGE", "NARANJA"] },
  { id: "rosa", hex: "#FF6EC7", nome: ["ROSA", "PINK", "ROSA"] },
  { id: "branco", hex: "#FFFFFF", nome: ["BRANCO", "WHITE", "BLANCO"] },
];
const CZR_QUANTIAS = [10, 20, 30]; // rodadas da partida online (o anfitrião escolhe)
// Modos (os "temas" do kit): misto (a rodada diz se é a cor ou a palavra), só a cor, só a palavra.
const CZR_TEMAS = ["misto", "cor", "palavra"];

// Nível de dificuldade pela rodada (0, 1, 2…): quantas cores entram, quanto tempo e se as alternativas vêm pintadas.
function czrNivel(i) {
  return {
    cores: Math.min(CZR_CORES.length, 4 + Math.floor(i / 3)),
    segundos: Math.max(3, 6 - Math.floor(i / 5)),
    pintadas: i >= 4,
    iguais: i < 3 ? 0.25 : 0.1, // chance de a palavra ser da mesma cor da tinta
  };
}

// Uma rodada. i: posição na partida (deixa mais difícil); modo: "misto", "cor" ou "palavra".
function czrRodada(i, rnd = Math.random, modo = "misto") {
  const nv = czrNivel(i);
  const cores = gzEmbaralhar(CZR_CORES.map((_, k) => k), rnd).slice(0, nv.cores);
  const tinta = cores[0];
  const palavra = rnd() < nv.iguais ? tinta : cores[1];
  const tipo = modo === "cor" || modo === "palavra" ? modo : rnd() < 0.6 ? "cor" : "palavra";
  const resposta = tipo === "cor" ? tinta : palavra;
  // As 4 alternativas: a certa, a que confunde (a outra) e mais cores até dar 4.
  const outras = cores.filter((c) => c !== tinta && c !== palavra);
  const opcoes = gzEmbaralhar([...new Set([tinta, palavra, ...outras])].slice(0, 4), rnd);
  while (opcoes.length < 4) {
    const c = gzEmbaralhar(CZR_CORES.map((_, k) => k), rnd).find((k) => !opcoes.includes(k));
    opcoes.push(c);
  }
  // Alternativas pintadas: cada nome com a tinta de outra cor (nunca a dele).
  const pinturas = nv.pintadas ? opcoes.map((c) => gzEmbaralhar(CZR_CORES.map((_, k) => k).filter((k) => k !== c), rnd)[0]) : null;
  return { tipo, palavra, tinta, resposta, opcoes, pinturas, seg: nv.segundos };
}

function czrSortear(n, rnd, modo = "misto") {
  return Array.from({ length: n }, (_, i) => czrRodada(i, rnd, modo));
}

// Corzi do dia: 10 rodadas, iguais para todo mundo, no modo misto.
function czrDiario(dia) {
  return czrSortear(GZ_DIARIO_QTD, gzRng(dia * 7919 + 61), "misto");
}

// Partida livre: sem fim, cada vez mais difícil (acaba nas 3 vidas).
function czrLivre(modo = "misto", rnd = Math.random) {
  let i = 0;
  return () => czrRodada(i++, rnd, modo);
}

function czrOnline(modo = "misto", qtd = 10, rnd = Math.random) {
  return czrSortear(CZR_QUANTIAS.includes(qtd) ? qtd : 10, rnd, modo);
}

function czrSegundos(r) {
  return r.seg || 5;
}

function czrAvaliar(r, v, ms) {
  const certo = v === r.resposta;
  return { certo, pontos: certo ? gzPontosTempo(ms, czrSegundos(r)) : 0 };
}

function czrValida(r, v) {
  return Number.isInteger(v) && r.opcoes.includes(v);
}
