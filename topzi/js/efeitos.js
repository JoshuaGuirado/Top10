// Som (gerado na hora, sem arquivos) e efeitos visuais.

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
      const t = t0 + i * gap;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(vol, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(t);
      osc.stop(t + dur + 0.02);
    });
  } catch (e) { /* sem áudio, sem problema */ }
}

const sfx = {
  right: (ratio) => beep([523, 659, 784, 1047, 1319].slice(0, 2 + Math.ceil(ratio * 3)), "triangle", 0.16, 0.07),
  wrong: () => beep([196, 147], "sawtooth", 0.18, 0.12, 0.08),
  tick: () => beep([880], "sine", 0.05, 0, 0.05),
  clock: () => beep([1200], "square", 0.04, 0, 0.04),
  hint: () => beep([660, 880], "sine", 0.1, 0.08, 0.1),
  win: () => beep([523, 659, 784, 1047, 784, 1047, 1319], "triangle", 0.2, 0.11),
  // "Uó uó uó uóóó": trombone triste.
  lose: () => beep([392, 370, 349, 294], "sawtooth", 0.42, 0.4, 0.07),
  // Rufar de tambor que vai crescendo até a revelação.
  drumroll: (ms = 1600) => {
    const hits = Math.floor(ms / 65);
    for (let k = 0; k < hits; k++) setTimeout(() => beep([92 + (k % 2) * 14], "triangle", 0.06, 0, 0.04 + (k / hits) * 0.14), k * 65);
  },
  crash: () => beep([1568, 2093, 2637], "square", 0.3, 0.015, 0.05),
};

const SOUND_ICONS = {
  on: '<svg class="ui-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4.2 4.2 0 0 1 0 6M18.2 6.5a8 8 0 0 1 0 11"/></svg>',
  off: '<svg class="ui-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/></svg>',
};

function renderSoundBtn() {
  const b = $("sound-btn");
  b.innerHTML = SOUND_ICONS[soundOn ? "on" : "off"];
  b.title = t(soundOn ? "nav.soundOn" : "nav.soundOff");
  b.setAttribute("aria-label", b.title);
  b.setAttribute("aria-pressed", String(soundOn));
}

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const fx = (() => {
  const canvas = $("fx");
  const ctx = canvas.getContext("2d");
  let parts = [];
  let running = false;
  const colors = ["#FF4D3D", "#FF4D3D", "#171717", "#FF8A7F", "#C9A86A"];

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
      p.vy += 0.25;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      p.life -= 1;
      ctx.save();
      ctx.globalAlpha = Math.min(1, p.life / 30);
      ctx.translate(p.x * devicePixelRatio, p.y * devicePixelRatio);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      ctx.restore();
    }
    if (parts.length) requestAnimationFrame(loop);
    else running = false;
  }

  function add(p) {
    parts.push(p);
    if (!running) { running = true; requestAnimationFrame(loop); }
  }

  return {
    burst(x, y, amount = 40) {
      if (reduceMotion) return;
      for (let i = 0; i < amount; i++) {
        const a = Math.random() * Math.PI * 2;
        const s = 3 + Math.random() * 7;
        add({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 5, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4, size: (6 + Math.random() * 6) * devicePixelRatio, color: pick(colors), life: 70 + Math.random() * 40 });
      }
    },
    // Fogos: várias explosões espalhadas pela parte de cima da tela.
    fireworks(count = 5, palette = null) {
      if (reduceMotion) return;
      for (let k = 0; k < count; k++) {
        setTimeout(() => {
          const x = innerWidth * (0.15 + Math.random() * 0.7);
          const y = innerHeight * (0.12 + Math.random() * 0.33);
          for (let i = 0; i < 70; i++) {
            const a = (i / 70) * Math.PI * 2;
            const s = 4 + Math.random() * 5;
            add({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 2, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4, size: (5 + Math.random() * 5) * devicePixelRatio, color: pick(palette || colors), life: 60 + Math.random() * 40 });
          }
        }, k * 330);
      }
    },
    rain(amount = 120) {
      if (reduceMotion) return;
      for (let i = 0; i < amount; i++) {
        add({ x: Math.random() * innerWidth, y: -20 - Math.random() * innerHeight * 0.6, vx: (Math.random() - 0.5) * 2, vy: Math.random() * 3, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3, size: (6 + Math.random() * 7) * devicePixelRatio, color: pick(colors), life: 160 + Math.random() * 80 });
      }
    },
  };
})();

function floatText(el, text, cls = "") {
  if (!el) return;
  const r = el.getBoundingClientRect();
  const f = document.createElement("div");
  f.className = "float " + cls;
  f.textContent = text;
  f.style.left = r.left + r.width / 2 + "px";
  f.style.top = r.top + window.scrollY + "px";
  document.body.appendChild(f);
  setTimeout(() => f.remove(), 1400);
}

function flash(cls) {
  document.body.classList.remove("flash-bad", "flash-epic");
  void document.body.offsetWidth;
  document.body.classList.add(cls);
  clearTimeout(flash.timer);
  flash.timer = setTimeout(() => document.body.classList.remove(cls), 700);
}

function shake(el) {
  if (!el) return;
  el.classList.remove("shake");
  void el.offsetWidth;
  el.classList.add("shake");
}
