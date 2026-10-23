// Memorizi na tela: os quatro botões coloridos que acendem na sequência e que a pessoa repete. As telas comuns
// (início, resultado, online e sala) são de ../gamezi-kit.js; as regras, de js/jogo.js.

let mzToken = 0; // muda a cada rodada desenhada: para os temporizadores da rodada anterior
let mzToques = [];
let mzResponder = null;
let mzPodeTocar = false;
let mzAudio = null;
const MZ_NOTAS = [330, 392, 494, 587];

function mzBip(c, ms) {
  try {
    mzAudio = mzAudio || new (window.AudioContext || window.webkitAudioContext)();
    const o = mzAudio.createOscillator();
    const g = mzAudio.createGain();
    o.type = "triangle";
    o.frequency.value = MZ_NOTAS[c];
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

function mzPads(desligados = true) {
  return `<div class="pads">${[0, 1, 2, 3].map((i) => `<button type="button" class="pad p${i}" data-pad="${i}" ${desligados ? "disabled" : ""} aria-label="${escapeHtml(t("mz.cor" + i))}"></button>`).join("")}</div>`;
}

function mzBolinhas(seq, certa) {
  return seq.map((c, i) => `<i class="dot p${c} ${certa && certa[i] !== c ? "x" : ""}"></i>`).join("");
}

function mzDesenhar(el, r, e) {
  if (e.fase === "jogando") {
    if (!e.nova) return;
    const token = ++mzToken;
    mzToques = [];
    mzPodeTocar = false;
    mzResponder = e.responder;
    el.innerHTML = `<p class="mz-msg" id="mz-msg">${escapeHtml(t("mz.olhe"))}</p>${mzPads()}<div class="mz-dots" id="mz-dots"></div>`;
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
    el.innerHTML = `<p class="mz-msg">${escapeHtml(t("mz.enviada"))}</p>${mzPads()}<div class="mz-dots">${mzBolinhas(e.v || [])}</div>`;
    return;
  }
  el.innerHTML = `<p class="mz-msg">${escapeHtml(t("mz.era"))}</p><div class="mz-dots big">${mzBolinhas(r.seq)}</div>` +
    (Array.isArray(e.v) ? `<p class="mz-msg small">${escapeHtml(t("mz.sua"))}</p><div class="mz-dots">${mzBolinhas(e.v, r.seq)}</div>` : "");
}

function mzTocar(r, c, token) {
  if (!mzPodeTocar || token !== mzToken) return;
  mzAcender(c, 180);
  mzToques.push(c);
  const dots = $("mz-dots");
  if (dots) dots.innerHTML = mzBolinhas(mzToques);
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
  livre: () => mzLivre(),
  online: () => mzOnline(),
  segundos: mzSegundos,
  avaliar: mzAvaliar,
  valida: mzValida,
  desenhar: mzDesenhar,
  resumo: (r) => `<span class="mz-dots small">${mzBolinhas(r.seq)}</span>`,
  respostaTexto: (r, v) => `<span class="mz-dots small">${mzBolinhas(v, r.seq)}</span>`,
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
    "help.html": [
      "<ol class=\"help-steps\"><li>Os botões coloridos acendem numa sequência: preste atenção.</li><li>Depois, toque nos botões na mesma ordem.</li><li>Acertou tudo: de 50 a 100 pontos, quanto mais rápido, mais. Errou uma cor ou acabou o tempo: 0.</li><li>A cada rodada a sequência fica mais comprida.</li></ol><p><b>Memorizi do dia:</b> as mesmas 10 sequências para todo mundo, com ranking. <b>Partida livre:</b> até errar 3 vezes. <b>Online:</b> todo mundo vê a mesma sequência; quem repete certo mais rápido ganha mais.</p>",
      "<ol class=\"help-steps\"><li>The colored buttons light up in a sequence: watch closely.</li><li>Then tap the buttons in the same order.</li><li>All right: 50 to 100 points, the faster the more. One wrong color or out of time: 0.</li><li>The sequence gets longer every round.</li></ol><p><b>Daily Memorizi:</b> the same 10 sequences for everyone, with a ranking. <b>Free play:</b> until you miss 3 times. <b>Online:</b> everyone sees the same sequence; the fastest correct repeat scores the most.</p>",
      "<ol class=\"help-steps\"><li>Los botones de colores se encienden en una secuencia: presta atención.</li><li>Después, toca los botones en el mismo orden.</li><li>Si aciertas todo: de 50 a 100 puntos, cuanto más rápido, más. Si fallas un color o se acaba el tiempo: 0.</li><li>En cada ronda la secuencia es más larga.</li></ol><p><b>Memorizi del día:</b> las mismas 10 secuencias para todos, con ranking. <b>Partida libre:</b> hasta fallar 3 veces. <b>Online:</b> todos ven la misma secuencia; quien la repite bien más rápido gana más.</p>",
    ],
  },
});
