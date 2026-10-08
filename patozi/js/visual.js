// Utilidades de tela: atalhos, armazenamento, ícones, o pato, sons e confete.

const $ = (id) => document.getElementById(id);

// Guarda no navegador. Tema, idioma e som são os mesmos do Gamezi (tt:); o resto é do Patozi (pz:).
const PZ_COMPARTILHADO = ["lang", "theme", "sound"];

function store(key, value) {
  const k = (PZ_COMPARTILHADO.includes(key) ? "tt:" : "pz:") + key;
  try {
    if (value === undefined) return JSON.parse(localStorage.getItem(k));
    localStorage.setItem(k, JSON.stringify(value));
    if (store.onWrite) store.onWrite(key);
  } catch (e) {
    return null;
  }
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

function shareText(text, btn) {
  const label = btn ? btn.textContent : "";
  const done = () => {
    if (!btn) return;
    btn.textContent = t("copied");
    setTimeout(() => (btn.textContent = label), 1800);
  };
  if (navigator.share && matchMedia("(hover: none)").matches) {
    navigator.share({ text }).catch(() => {});
    return;
  }
  if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, () => prompt(t("copyPrompt"), text));
  else prompt(t("copyPrompt"), text);
}

// Lê um número digitado com ou sem pontos ("1.500", "1,500", "1500").
function lerNumero(texto) {
  const s = String(texto || "").replace(/[\s.,_]/g, "");
  if (!/^\d{1,13}$/.test(s)) return NaN;
  return Number(s);
}

// ───────────── telas ─────────────

const SCREENS = ["home", "setup", "game", "results", "daily", "online", "lobby", "profile"];

function show(name) {
  SCREENS.forEach((s) => ($("screen-" + s).hidden = s !== name));
  document.body.dataset.screen = name;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ───────────── ícones ─────────────

const UI_ICONS = {
  moon: '<svg class="ui-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/></svg>',
  sun: '<svg class="ui-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/></svg>',
  help: '<svg class="ui-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/><path d="M9.3 9.2a2.8 2.8 0 0 1 5.4 1c0 1.9-2.7 2.4-2.7 4"/><circle cx="12" cy="17.6" r=".6" fill="currentColor"/></svg>',
  soundOn: '<svg class="ui-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4.2 4.2 0 0 1 0 6M18.2 6.5a8 8 0 0 1 0 11"/></svg>',
  soundOff: '<svg class="ui-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/></svg>',
  user: '<svg class="ui-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8.5" r="4"/><path d="M4.5 20.5c.9-3.8 3.9-6 7.5-6s6.6 2.2 7.5 6"/></svg>',
  shield: '<svg class="ui-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M12 3 4.5 6v5.5c0 4.6 3.2 8 7.5 9.5 4.3-1.5 7.5-4.9 7.5-9.5V6z"/></svg>',
  bot: '<svg class="ui-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="8" width="16" height="11" rx="3"/><path d="M12 4v4M9 13h.01M15 13h.01M9.5 16h5"/></svg>',
};

// Ícones dos temas: traço que herda a cor do texto.
const THEME_ICONS = {
  corpo: '<path d="M12 21s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 8a4.3 4.3 0 0 1 7.5 2.8C19.5 16.4 12 21 12 21z"/><path d="M4.5 12.5h4l1.5-3 3 6 1.5-3h5"/>',
  animais: '<ellipse cx="12" cy="16" rx="4.5" ry="3.8"/><circle cx="6" cy="10.5" r="1.9"/><circle cx="9.5" cy="6.5" r="1.9"/><circle cx="14.5" cy="6.5" r="1.9"/><circle cx="18" cy="10.5" r="1.9"/>',
  espaco: '<circle cx="12" cy="12" r="5"/><ellipse cx="12" cy="12" rx="10" ry="3.5" transform="rotate(-20 12 12)"/>',
  ciencia: '<path d="M9.5 3h5M10.5 3v6L5 18.5A1.7 1.7 0 0 0 6.5 21h11a1.7 1.7 0 0 0 1.5-2.5L13.5 9V3"/><path d="M7.5 14h9"/>',
  mundo: '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>',
  brasil: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M12 7.5 19 12l-7 4.5L5 12z"/><circle cx="12" cy="12" r="2.2"/>',
  historia: '<path d="M3 9.5 12 4l9 5.5zM4 21h16M5.5 9.5v9M10 9.5v9M14 9.5v9M18.5 9.5v9M3 18.5h18"/>',
  futebol: '<circle cx="12" cy="12" r="9"/><path d="m12 8 3.4 2.5-1.3 4h-4.2l-1.3-4z"/><path d="M12 8V3.5M15.4 10.5l4.2-1.4M14.1 14.5l2.6 3.6M9.9 14.5l-2.6 3.6M8.6 10.5 4.4 9.1"/>',
  esporte: '<circle cx="12" cy="15" r="5.5"/><path d="M8.5 10.7 6 3h4l2 5 2-5h4l-2.5 7.7"/><path d="M12 12.5v5"/>',
  cinema: '<rect x="3" y="9" width="18" height="11" rx="2"/><path d="m3.5 9-.8-3.6 16.6-3.3.8 3.6z"/><path d="m8 4.8 2 3.4M13.2 3.8l2 3.4"/>',
  musica: '<path d="M9 18V5.5l11-2V16"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/><path d="M9 9.5l11-2"/>',
  jogos: '<path d="M6.5 7h11a4 4 0 0 1 3.9 4.8l-1 5a2.6 2.6 0 0 1-4.5 1.2L14.3 16H9.7l-1.6 2a2.6 2.6 0 0 1-4.5-1.2l-1-5A4 4 0 0 1 6.5 7z"/><path d="M8 10v4M6 12h4"/><circle cx="15.5" cy="11" r=".9"/><circle cx="17.5" cy="13" r=".9"/>',
  comida: '<path d="M4 11h16a8 8 0 0 1-16 0z"/><path d="M12 11V7M9 4.5c0 1.5 1.5 1.5 1.5 3M15 4.5c0 1.5-1.5 1.5-1.5 3"/><path d="M8 21h8"/>',
  numeros: '<rect x="3.5" y="3.5" width="17" height="17" rx="3"/><path d="M7 8.5h4M9 6.5v4M13.5 8.5h4M7 15.5l3 3M10 15.5l-3 3M13.5 15h4M13.5 18h4"/>',
  tecnologia: '<rect x="3" y="4.5" width="18" height="12" rx="2"/><path d="M8 20.5h8M12 16.5v4"/>',
  biblia: '<path d="M6 3.5h11.5a1 1 0 0 1 1 1V20a.5.5 0 0 1-.5.5H6.5A2.5 2.5 0 0 1 4 18V5.5a2 2 0 0 1 2-2z"/><path d="M4 18a2.5 2.5 0 0 1 2.5-2.5h12M11.5 7v6M9 9.5h5"/>',
  curiosidades: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.7.5 1.1 1.3 1.1 2.2h5c0-.9.4-1.7 1.1-2.2A6 6 0 0 0 12 3z"/>',
};

function themeIcon(id) {
  return `<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${THEME_ICONS[id] || THEME_ICONS.curiosidades}</svg>`;
}

function temaNome(id) {
  const tema = PZ_TEMAS.find((x) => x.id === id);
  return tema ? tr(tema.nome) : id;
}

// ───────────── o pato ─────────────

const PZ_CORES = ["#FFC93C", "#FF4D3D", "#3D7BFF", "#2FBF71", "#9B5DE5", "#FF8C42", "#FF7EB6", "#2EC4D6", "#A0703C", "#F2EBDD"];

// Pato de perfil, olhando para a direita. mood: "" | "sad" | "happy".
function patoSvg(cor = PZ_CORES[0], mood = "") {
  const c = typeof cor === "number" ? PZ_CORES[cor % PZ_CORES.length] : cor;
  const eye = mood === "sad"
    ? '<circle cx="66" cy="31" r="3.6" fill="#171717"/><path d="M59 24.5l11 3" stroke="#171717" stroke-width="3" stroke-linecap="round"/>'
    : mood === "happy"
      ? '<path d="M62 32q4 -5 8 0" stroke="#171717" stroke-width="3" fill="none" stroke-linecap="round"/>'
      : '<circle cx="66" cy="30" r="4" fill="#171717"/><circle cx="67.4" cy="28.6" r="1.3" fill="#fff"/>';
  return `<svg class="pato" viewBox="0 0 100 100" aria-hidden="true">
    <path d="M10 52c4 1 9 4 14 4h40c13 0 24 8 24 20 0 9-8 16-20 16H38C20 92 8 80 8 64c0-5 .5-9 2-12z" fill="${c}" stroke="#171717" stroke-width="3.5" stroke-linejoin="round"/>
    <path d="M36 68c8-6 22-6 28 2-6 7-20 8-28-2z" fill="rgba(0,0,0,.14)"/>
    <circle cx="60" cy="34" r="20" fill="${c}" stroke="#171717" stroke-width="3.5"/>
    <path d="M77 30c6-2 13-1 17 2-2 6-10 8-17 6z" fill="#FF4D3D" stroke="#171717" stroke-width="3.5" stroke-linejoin="round"/>
    ${eye}
  </svg>`;
}

const PATO_MINI = '<svg class="pato-mini" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12.5c1 .3 2 .9 3.2.9h9c3 0 5.3 1.8 5.3 4.4 0 2-1.8 3.6-4.4 3.6H9.3C5.2 21.4 2.6 18.7 2.6 15.2c0-1 .1-1.9.4-2.7z"/><circle cx="14" cy="8.3" r="4.6"/><path d="M18 7.3c1.3-.4 3-.2 3.9.5-.4 1.4-2.3 1.8-3.9 1.4z" class="bico"/></svg>';

function patosHtml(n) {
  return `<span class="ducks" aria-label="${escapeHtml(tn("game.ducks", n))}">${PATO_MINI.repeat(Math.min(n, 6))}</span>`;
}

// ───────────── tema e som ─────────────

function isDark() {
  return (document.documentElement.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")) === "dark";
}

function renderThemeBtn() {
  const b = $("theme-btn");
  b.innerHTML = UI_ICONS[isDark() ? "sun" : "moon"];
  b.title = t(isDark() ? "nav.light" : "nav.dark");
  b.setAttribute("aria-label", b.title);
}

function toggleTheme() {
  const next = isDark() ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  store("theme", next);
  renderThemeBtn();
}

let soundOn = store("sound") !== false;
let audioCtx = null;

function beep(notes, type = "sine", dur = 0.12, gap = 0.08, vol = 0.18) {
  if (!soundOn) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const t0 = audioCtx.currentTime;
    notes.forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      const at = t0 + i * gap;
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(vol, at + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(at);
      osc.stop(at + dur + 0.02);
    });
  } catch (e) { /* sem áudio, sem problema */ }
}

const sfx = {
  tick: () => beep([880], "sine", 0.05, 0, 0.05),
  bid: () => beep([523, 784], "triangle", 0.1, 0.06, 0.1),
  // "Quén quén": o grito de "Nem a pato!".
  quack: () => beep([440, 330, 440, 300], "sawtooth", 0.11, 0.09, 0.07),
  drumroll: (ms = 1200) => {
    const hits = Math.floor(ms / 65);
    for (let k = 0; k < hits; k++) setTimeout(() => beep([92 + (k % 2) * 14], "triangle", 0.06, 0, 0.04 + (k / hits) * 0.14), k * 65);
  },
  good: () => beep([523, 659, 784, 1047], "triangle", 0.16, 0.07),
  bad: () => beep([196, 147], "sawtooth", 0.18, 0.12, 0.08),
  win: () => beep([523, 659, 784, 1047, 784, 1047, 1319], "triangle", 0.2, 0.11),
  lose: () => beep([392, 370, 349, 294], "sawtooth", 0.42, 0.4, 0.07),
};

function renderSoundBtn() {
  const b = $("sound-btn");
  b.innerHTML = UI_ICONS[soundOn ? "soundOn" : "soundOff"];
  b.title = t(soundOn ? "nav.soundOn" : "nav.soundOff");
  b.setAttribute("aria-label", b.title);
  b.setAttribute("aria-pressed", String(soundOn));
}

function toggleSound() {
  soundOn = !soundOn;
  store("sound", soundOn);
  renderSoundBtn();
  sfx.tick();
}

// ───────────── confete (e penas) ─────────────

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const fx = (() => {
  const canvas = $("fx");
  const ctx = canvas.getContext("2d");
  let parts = [];
  let running = false;
  const colors = ["#FF4D3D", "#FFC93C", "#171717", "#FF8A7F", "#3D7BFF", "#2FBF71"];

  function resize() {
    canvas.width = innerWidth * devicePixelRatio;
    canvas.height = innerHeight * devicePixelRatio;
  }
  addEventListener("resize", resize);
  resize();

  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    parts = parts.filter((p) => p.life > 0);
    for (const p of parts) {
      p.vy += p.feather ? 0.04 : 0.25;
      if (p.feather) p.vx = Math.sin((p.life + p.rot) / 12) * 1.6;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      p.life -= 1;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = Math.min(1, p.life / 30);
      ctx.fillStyle = p.color;
      if (p.feather) {
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size * 1.4, p.size * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();
      } else ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      ctx.restore();
    }
    if (parts.length) requestAnimationFrame(loop);
    else running = false;
  }

  function start() {
    if (!running) {
      running = true;
      requestAnimationFrame(loop);
    }
  }

  return {
    confetti(n = 140) {
      if (reduceMotion) return;
      const d = devicePixelRatio;
      for (let i = 0; i < n; i++) {
        parts.push({
          x: canvas.width / 2 + (Math.random() - 0.5) * 200 * d, y: canvas.height * 0.35,
          vx: (Math.random() - 0.5) * 22 * d, vy: (-Math.random() * 16 - 6) * d,
          rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4,
          size: (6 + Math.random() * 8) * d, color: colors[i % colors.length], life: 120 + Math.random() * 60,
        });
      }
      start();
    },
    // Penas caindo devagar, para o pato da rodada.
    feathers(color = "#FFC93C", n = 26) {
      if (reduceMotion) return;
      const d = devicePixelRatio;
      for (let i = 0; i < n; i++) {
        parts.push({
          feather: true, x: Math.random() * canvas.width, y: -20 * d - Math.random() * 200 * d,
          vx: 0, vy: (1 + Math.random() * 1.5) * d, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.05,
          size: (7 + Math.random() * 6) * d, color: i % 3 ? color : "#F2EBDD", life: 200 + Math.random() * 80,
        });
      }
      start();
    },
  };
})();
