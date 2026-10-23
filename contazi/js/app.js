// Contazi na tela: a conta, o visor e o teclado de números. As telas comuns (início, resultado, online e sala)
// são de ../gamezi-kit.js; as regras, de js/jogo.js.

let ctDigitado = "";

// Texto da conta no idioma da pessoa; sem "?", a tela põe o "=" no fim.
function ctTexto(r) {
  const txt = Array.isArray(r.texto) ? tr(r.texto) : r.texto;
  return txt.includes("?") ? txt : txt + " =";
}

const CT_NOMES_TEMAS = {
  misto: ["Misto", "Mixed", "Mixto"],
  soma: ["Soma e subtração", "Add & subtract", "Suma y resta"],
  tabuada: ["Tabuada", "Times tables", "Tablas de multiplicar"],
  divisao: ["Divisão", "Division", "División"],
  ordem: ["Ordem das operações", "Order of operations", "Orden de operaciones"],
  porcentagem: ["Porcentagem", "Percentages", "Porcentajes"],
  fracao: ["Frações", "Fractions", "Fracciones"],
  potencia: ["Potências e raízes", "Powers & roots", "Potencias y raíces"],
  dobro: ["Dobro e metade", "Double & half", "Doble y mitad"],
  dinheiro: ["Dinheiro e troco", "Money & change", "Dinero y vuelto"],
  horas: ["Horas e tempo", "Time units", "Horas y tiempo"],
  romanos: ["Números romanos", "Roman numerals", "Números romanos"],
  sequencia: ["Sequências", "Number sequences", "Secuencias"],
};
let ctResponder = null;

const CT_TECLAS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "apagar", "0", "ok"];

function ctDesenhar(el, r, e) {
  if (e.fase === "jogando") {
    ctResponder = e.responder;
    if (!e.nova) return;
    ctDigitado = "";
    el.innerHTML = `<div class="conta ${ctTexto(r).length > 14 ? "longa" : ""}"><p>${escapeHtml(ctTexto(r))}</p><b id="visor">?</b></div>
      <div class="teclado">${CT_TECLAS.map((k) => `<button type="button" class="tecla ${k === "ok" ? "ok" : k === "apagar" ? "apagar" : ""}" data-tecla="${k}" aria-label="${escapeHtml(k === "ok" ? t("ct.ok") : k === "apagar" ? t("ct.del") : k)}">${k === "ok" ? escapeHtml(t("ct.ok")) : k === "apagar" ? "⌫" : k}</button>`).join("")}</div>`;
    el.onclick = (ev) => {
      const b = ev.target.closest("[data-tecla]");
      if (b) ctTecla(b.dataset.tecla);
    };
    return;
  }
  ctResponder = null;
  const revelado = e.fase === "revelado";
  const certo = revelado && e.res && e.res.certo;
  el.innerHTML = `<div class="conta ${ctTexto(r).length > 14 ? "longa" : ""} ${revelado ? (certo ? "right" : "wrong") : ""}"><p>${escapeHtml(ctTexto(r))}</p><b>${revelado ? fmt(r.resposta) : escapeHtml(e.v)}</b></div>` +
    (revelado && !certo && e.v !== null && e.v !== undefined ? `<p class="ct-sua">${escapeHtml(t("ct.your", { v: fmt(e.v) }))}</p>` : "");
}

function ctTecla(k) {
  if (!ctResponder) return;
  if (k === "apagar") ctDigitado = ctDigitado.slice(0, -1);
  else if (k === "ok") {
    if (ctDigitado) ctResponder(Number(ctDigitado));
    return;
  } else if (ctDigitado.length < 7) ctDigitado = (ctDigitado + k).replace(/^0+(?=\d)/, "");
  const visor = $("visor");
  if (visor) visor.textContent = ctDigitado || "?";
}

// No computador: números, Backspace e Enter.
addEventListener("keydown", (e) => {
  if (!ctResponder || document.body.dataset.screen !== "game" || document.querySelector("dialog[open]")) return;
  if (/^\d$/.test(e.key)) ctTecla(e.key);
  else if (e.key === "Backspace") ctTecla("apagar");
  else if (e.key === "Enter") ctTecla("ok");
  else return;
  e.preventDefault();
});

gzIniciar({
  id: "contazi",
  prefixo: "ct",
  nome: "Contazi",
  inicio: CT_INICIO,
  diario: ctDiario,
  livre: (tema) => ctLivre(tema),
  online: (tema) => ctOnline(tema),
  temas: CT_TEMAS.map((id) => ({ id, nome: CT_NOMES_TEMAS[id] })),
  segundos: ctSegundos,
  avaliar: ctAvaliar,
  valida: ctValida,
  desenhar: ctDesenhar,
  resumo: (r) => `${escapeHtml(ctTexto(r).replace(/ =$/, ""))} → ${fmt(r.resposta)}`,
  respostaTexto: (r, v) => escapeHtml(fmt(v)),
  textos: {
    "home.tag": ["Contas de cabeça contra o relógio.", "Mental math against the clock.", "Cuentas de cabeza contra el reloj."],
    "daily.name": ["Contazi do dia", "Daily Contazi", "Contazi del día"],
    "daily.kicker": ["Contazi do dia #{n}", "Daily Contazi #{n}", "Contazi del día #{n}"],
    "ct.ok": ["OK", "OK", "OK"],
    "ct.del": ["Apagar", "Delete", "Borrar"],
    "ct.your": ["Você digitou {v}", "You typed {v}", "Escribiste {v}"],
    "help.html": [
      "<ol class=\"help-steps\"><li>Aparece uma conta: faça de cabeça e digite o resultado.</li><li>Acertou: de 50 a 100 pontos, quanto mais rápido, mais. Errou ou acabou o tempo (12 segundos; 15 a 18 nas que têm frase): 0.</li><li>As contas ficam mais difíceis a cada rodada. Na partida livre e no online dá para escolher o tema: tabuada, porcentagem, frações, números romanos, troco, sequências e mais.</li></ol><p><b>Contazi do dia:</b> as mesmas 10 contas para todo mundo, com ranking. <b>Partida livre:</b> até errar 3 vezes. <b>Online:</b> todo mundo faz a mesma conta; quem acerta mais rápido ganha mais.</p>",
      "<ol class=\"help-steps\"><li>A math problem shows up: solve it in your head and type the answer.</li><li>Right: 50 to 100 points, the faster the more. Wrong or out of time (12 seconds; 15 to 18 for word problems): 0.</li><li>The problems get harder every round. In free play and online you can pick the theme: times tables, percentages, fractions, Roman numerals, change, sequences and more.</li></ol><p><b>Daily Contazi:</b> the same 10 problems for everyone, with a ranking. <b>Free play:</b> until you miss 3 times. <b>Online:</b> everyone gets the same problem; the fastest right answer scores the most.</p>",
      "<ol class=\"help-steps\"><li>Aparece una cuenta: hazla de cabeza y escribe el resultado.</li><li>Si aciertas: de 50 a 100 puntos, cuanto más rápido, más. Si fallas o se acaba el tiempo (12 segundos; 15 a 18 en las que tienen frase): 0.</li><li>Las cuentas son más difíciles en cada ronda. En la partida libre y online puedes elegir el tema: tablas, porcentajes, fracciones, números romanos, vuelto, secuencias y más.</li></ol><p><b>Contazi del día:</b> las mismas 10 cuentas para todos, con ranking. <b>Partida libre:</b> hasta fallar 3 veces. <b>Online:</b> todos hacen la misma cuenta; quien acierta más rápido gana más.</p>",
    ],
  },
});
