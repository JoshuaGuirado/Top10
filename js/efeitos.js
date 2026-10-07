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
  lose: () => beep([392, 330, 262, 196], "triangle", 0.28, 0.2, 0.14),
};

function renderSoundBtn() {
  $("sound-btn").textContent = soundOn ? "Som: ligado" : "Som: desligado";
  $("sound-btn").setAttribute("aria-pressed", String(soundOn));
}

const fx = (() => {
  const canvas = $("fx");
  const ctx = canvas.getContext("2d");
  let parts = [];
  let running = false;
  const colors = ["#2450F5", "#2450F5", "#0A0A0A", "#9AA0B5", "#8FA8FF"];
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
      if (reduce) return;
      for (let i = 0; i < amount; i++) {
        const a = Math.random() * Math.PI * 2;
        const s = 3 + Math.random() * 7;
        add({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 5, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4, size: (6 + Math.random() * 6) * devicePixelRatio, color: pick(colors), life: 70 + Math.random() * 40 });
      }
    },
    rain(amount = 120) {
      if (reduce) return;
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
