// Memorizi na tela: os quatro botões coloridos que acendem na sequência e que a pessoa repete. As telas comuns
// (início, resultado, online e sala) são de ../gamezi-kit.js; as regras, de js/jogo.js.

let mzToken = 0; // muda a cada rodada desenhada: para os temporizadores da rodada anterior
let mzToques = [];
let mzResponder = null;
let mzPodeTocar = false;
let mzAudio = null;
const MZ_NOTAS = [330, 392, 494, 587]; // as 4 cores (o som de sempre)
const MZ_ESCALA = [262, 294, 330, 349, 392, 440, 494, 523, 587]; // os outros temas: dó, ré, mi, fá, sol, lá, si, dó, ré
let mzTemaDaVez = null;

const MZ_NOMES_TEMAS = {
  cores: ["4 cores", "4 colors", "4 colores"],
  cores6: ["6 cores", "6 colors", "6 colores"],
  frutas: ["Frutas", "Fruits", "Frutas"],
  animais: ["Animais", "Animals", "Animales"],
  numeros: ["Números", "Numbers", "Números"],
  notas: ["Notas musicais", "Musical notes", "Notas musicales"],
  setas: ["Setas", "Arrows", "Flechas"],
  formas: ["Formas", "Shapes", "Formas"],
  caras: ["Caras", "Faces", "Caras"],
  letras: ["Letras", "Letters", "Letras"],
  clima: ["Clima", "Weather", "Clima"],
  transportes: ["Transportes", "Transport", "Transportes"],
  bolas: ["Bolas", "Balls", "Pelotas"],
};

function mzBip(c, ms) {
  try {
    mzAudio = mzAudio || new (window.AudioContext || window.webkitAudioContext)();
    const o = mzAudio.createOscillator();
    const g = mzAudio.createGain();
    o.type = "triangle";
    o.frequency.value = mzTemaDaVez && mzTemaDaVez !== MZ_TEMAS.cores ? MZ_ESCALA[c % MZ_ESCALA.length] : MZ_NOTAS[c];
    const t0 = mzAudio.currentTime;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.12, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + ms / 1000);
    o.connect(g);
    g.connect(mzAudio.destination);
    o.start(t0);
    o.stop(t0 + ms / 1000 + 0.05);
  } catch (e) { /* sem som */ }
}

function mzAcender(c, ms) {
  const b = document.querySelector(`#round .pad.p${c}`);
  if (!b) return;
  b.classList.add("on");
  mzBip(c, ms);
  setTimeout(() => b.classList.remove("on"), ms);
}

// Os botões do tema: 4 cores em quadrado (o de sempre) ou uma grade com o símbolo de cada um.
function mzPads(r, desligados = true) {
  const tema = mzTema(r);
  const n = tema.n || tema.simbolos.length;
  const cols = n <= 4 ? 2 : n === 7 || n === 8 ? 4 : 3;
  const linhas = Math.ceil(n / cols);
  return `<div class="pads ${n === 4 && !tema.simbolos ? "classico" : "grade"}" style="grid-template-columns: repeat(${cols}, 1fr); aspect-ratio: ${cols} / ${linhas}">${Array.from({ length: n }, (_, i) => {
    const sim = tema.simbolos ? tema.simbolos[i] : "";
    const rotulo = sim || t("mz.cor" + i);
    return `<button type="button" class="pad p${i}" data-pad="${i}" ${desligados ? "disabled" : ""} aria-label="${escapeHtml(rotulo)}">${escapeHtml(sim)}</button>`;
  }).join("")}</div>`;
}

function mzBolinhas(seq, certa, r) {
  const tema = mzTema(r);
  return seq.map((c, i) => `<i class="dot p${c} ${tema.simbolos ? "sim" : ""} ${certa && certa[i] !== c ? "x" : ""}">${tema.simbolos ? escapeHtml(tema.simbolos[c] || "") : ""}</i>`).join("");
}

function mzDesenhar(el, r, e) {
  if (e.fase === "jogando") {
    if (!e.nova) return;
    const token = ++mzToken;
    mzToques = [];
    mzPodeTocar = false;
    mzResponder = e.responder;
    mzTemaDaVez = mzTema(r);
    el.innerHTML = `<p class="mz-msg" id="mz-msg">${escapeHtml(t("mz.olhe"))}</p>${mzPads(r)}<div class="mz-dots" id="mz-dots"></div>`;
    el.onclick = (ev) => {
      const b = ev.target.closest("[data-pad]");
      if (b) mzTocar(r, Number(b.dataset.pad), token);
    };
    r.seq.forEach((c, i) => setTimeout(() => token === mzToken && mzAcender(c, Math.round(MZ_MOSTRA_MS * 0.62)), 500 + i * MZ_MOSTRA_MS));
    setTimeout(() => {
      if (token !== mzToken) return;
      mzPodeTocar = true;
      el.querySelectorAll(".pad").forEach((b) => (b.disabled = false));
      $("mz-msg").textContent = t("mz.vez");
    }, 500 + r.seq.length * MZ_MOSTRA_MS);
    return;
  }
  mzToken += 1;
  mzPodeTocar = false;
  if (e.fase === "enviado") {
    el.innerHTML = `<p class="mz-msg">${escapeHtml(t("mz.enviada"))}</p>${mzPads(r)}<div class="mz-dots">${mzBolinhas(e.v || [], null, r)}</div>`;
    return;
  }
  el.innerHTML = `<p class="mz-msg">${escapeHtml(t("mz.era"))}</p><div class="mz-dots big">${mzBolinhas(r.seq, null, r)}</div>` +
    (Array.isArray(e.v) ? `<p class="mz-msg small">${escapeHtml(t("mz.sua"))}</p><div class="mz-dots">${mzBolinhas(e.v, r.seq, r)}</div>` : "");
}

function mzTocar(r, c, token) {
  if (!mzPodeTocar || token !== mzToken) return;
  mzAcender(c, 180);
  mzToques.push(c);
  const dots = $("mz-dots");
  if (dots) dots.innerHTML = mzBolinhas(mzToques, null, r);
  const errou = mzToques[mzToques.length - 1] !== r.seq[mzToques.length - 1];
  if (errou || mzToques.length === r.seq.length) {
    mzPodeTocar = false;
    mzResponder(mzToques.slice());
  }
}

gzIniciar({
  id: "memorizi",
  prefixo: "mz",
  nome: "Memorizi",
  inicio: MZ_INICIO,
  diario: mzDiario,
  livre: (tema) => mzLivre(tema),
  online: (tema) => mzOnline(tema),
  temas: MZ_LISTA_TEMAS.map((id) => ({ id, nome: MZ_NOMES_TEMAS[id] })),
  segundos: mzSegundos,
  avaliar: mzAvaliar,
  valida: mzValida,
  desenhar: mzDesenhar,
  resumo: (r) => `<span class="mz-dots small">${mzBolinhas(r.seq, null, r)}</span>`,
  respostaTexto: (r, v) => `<span class="mz-dots small">${mzBolinhas(v, r.seq, r)}</span>`,
  textos: {
    "home.tag": ["Memorize a sequência de cores e repita.", "Memorize the color sequence and repeat it.", "Memoriza la secuencia de colores y repítela."],
    "daily.name": ["Memorizi do dia", "Daily Memorizi", "Memorizi del día"],
    "daily.kicker": ["Memorizi do dia #{n}", "Daily Memorizi #{n}", "Memorizi del día #{n}"],
    "mz.olhe": ["Preste atenção…", "Watch closely…", "Presta atención…"],
    "mz.vez": ["Sua vez! Repita a sequência.", "Your turn! Repeat the sequence.", "¡Tu turno! Repite la secuencia."],
    "mz.enviada": ["Sequência enviada!", "Sequence sent!", "¡Secuencia enviada!"],
    "mz.era": ["A sequência era:", "The sequence was:", "La secuencia era:"],
    "mz.sua": ["A sua:", "Yours:", "La tuya:"],
    "mz.cor0": ["Vermelho", "Red", "Rojo"],
    "mz.cor1": ["Amarelo", "Yellow", "Amarillo"],
    "mz.cor2": ["Azul", "Blue", "Azul"],
    "mz.cor3": ["Verde", "Green", "Verde"],
    "mz.cor4": ["Roxo", "Purple", "Morado"],
    "mz.cor5": ["Laranja", "Orange", "Naranja"],
    "help.html": [
      "<ol class=\"help-steps\"><li>Os botões coloridos acendem numa sequência: preste atenção.</li><li>Depois, toque nos botões na mesma ordem.</li><li>Acertou tudo: de 50 a 100 pontos, quanto mais rápido, mais. Errou uma cor ou acabou o tempo: 0.</li><li>A cada rodada a sequência fica mais comprida.</li><li>Na partida livre e no online dá para escolher o tema: 6 cores, frutas, animais, números, notas musicais, setas e mais.</li></ol><p><b>Memorizi do dia:</b> as mesmas 10 sequências para todo mundo, com ranking. <b>Partida livre:</b> até errar 3 vezes. <b>Online:</b> todo mundo vê a mesma sequência; quem repete certo mais rápido ganha mais.</p>",
      "<ol class=\"help-steps\"><li>The colored buttons light up in a sequence: watch closely.</li><li>Then tap the buttons in the same order.</li><li>All right: 50 to 100 points, the faster the more. One wrong color or out of time: 0.</li><li>The sequence gets longer every round.</li><li>In free play and online you can pick the theme: 6 colors, fruits, animals, numbers, musical notes, arrows and more.</li></ol><p><b>Daily Memorizi:</b> the same 10 sequences for everyone, with a ranking. <b>Free play:</b> until you miss 3 times. <b>Online:</b> everyone sees the same sequence; the fastest correct repeat scores the most.</p>",
      "<ol class=\"help-steps\"><li>Los botones de colores se encienden en una secuencia: presta atención.</li><li>Después, toca los botones en el mismo orden.</li><li>Si aciertas todo: de 50 a 100 puntos, cuanto más rápido, más. Si fallas un color o se acaba el tiempo: 0.</li><li>En cada ronda la secuencia es más larga.</li><li>En la partida libre y online puedes elegir el tema: 6 colores, frutas, animales, números, notas musicales, flechas y más.</li></ol><p><b>Memorizi del día:</b> las mismas 10 secuencias para todos, con ranking. <b>Partida libre:</b> hasta fallar 3 veces. <b>Online:</b> todos ven la misma secuencia; quien la repite bien más rápido gana más.</p>",
    ],
  },
});
