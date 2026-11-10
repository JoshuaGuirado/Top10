// Música de fundo (gamezi-musica.js): toca cada faixa por um tempo com um "áudio de mentira" e confere que nenhuma
// dá erro e todas tocam notas. Pegou de verdade uma faixa que sumiu (funções apagadas sem querer, e ela ficou muda).
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const codigo = fs.readFileSync(path.join(__dirname, "..", "gamezi-musica.js"), "utf8");
const classicasJs = fs.readFileSync(path.join(__dirname, "..", "gamezi-classicas.js"), "utf8");

// Um nó de áudio que aceita qualquer coisa (conectar, ligar, mexer em parâmetros…).
function no() {
  const param = () => ({ value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {}, setTargetAtTime() {} });
  return new Proxy({}, {
    get(alvo, k) {
      if (k in alvo) return alvo[k];
      if (["frequency", "detune", "gain", "Q"].includes(k)) return (alvo[k] = param());
      if (k === "getChannelData") return () => new Float32Array(16);
      return () => {};
    },
    set(alvo, k, v) { alvo[k] = v; return true; },
  });
}

function tocar(faixa, segundos) {
  let notas = 0, tick = null;
  const ctx = {
    currentTime: 0, sampleRate: 8000, state: "running", destination: no(),
    resume() {}, suspend() {},
    createBuffer: () => no(),
  };
  for (const tipo of ["Gain", "BiquadFilter", "Convolver", "BufferSource"]) ctx["create" + tipo] = () => no();
  ctx.createOscillator = () => { const o = no(); o.start = () => { notas++; }; return o; };
  const guardado = { "tt:musica-trilha": faixa };
  const janela = {
    AudioContext: function () { return ctx; },
    localStorage: { getItem: (k) => (k in guardado ? guardado[k] : null), setItem: (k, v) => { guardado[k] = v; } },
    document: { hidden: false, readyState: "complete", addEventListener() {}, querySelector: () => null, getElementById: () => null, documentElement: { lang: "pt" } },
    addEventListener() {}, removeEventListener() {},
    setInterval: (f) => { tick = f; return 1; }, clearInterval() {},
    Math, JSON, console,
  };
  janela.window = janela;
  const contexto = vm.createContext(janela);
  vm.runInContext(classicasJs, contexto);
  vm.runInContext(codigo, contexto);
  janela.gameziMusica.comecar();
  assert.ok(tick, faixa + ": não começou a tocar");
  for (let t = 0; t < segundos * 10; t++) {
    ctx.currentTime += 0.1;
    tick();
  }
  return { notas, janela };
}

test("todas as faixas de música tocam sem erro", () => {
  const faixas = [...codigo.matchAll(/\{ id: "([a-z]+)", nome: \{ pt:/g)].map((m) => m[1]);
  assert.ok(faixas.length >= 5, "faixas: " + faixas.join(", "));
  for (const f of faixas) {
    const { notas } = tocar(f, 60);
    assert.ok(notas > 50, `${f}: só ${notas} notas em 60 s`);
  }
});

test("toda faixa tem nome nos 3 idiomas e acerto de volume", () => {
  for (const m of codigo.matchAll(/\{ id: "([a-z]+)", nome: \{ pt: "[^"]+", en: "[^"]+", es: "[^"]+" \} \}/g)) {
    assert.match(codigo, new RegExp(`AJUSTE_FAIXA = \\{[^}]*\\b${m[1]}: [0-9.]+`), m[1] + " sem AJUSTE_FAIXA");
  }
});

test("clássicas: todas tiradas das partituras do Mutopia, com crédito, notas no piano e duração boa", () => {
  const { janela } = tocar("classicas", 1);
  const lista = janela.GZ_CLASSICAS;
  assert.ok(lista.length >= 35, `${lista.length} músicas`);
  const ids = new Set();
  for (const p of lista) {
    assert.ok(!ids.has(p.id), "id repetido: " + p.id);
    ids.add(p.id);
    assert.ok(p.nome.pt && p.nome.en && p.nome.es && p.autor, p.id + ": nome nos 3 idiomas e autor");
    assert.match(p.fonte, /^Mutopia Project, partitura digitada por .+ \((Public Domain|Creative Commons .+)\)$/, p.id + ": crédito e licença");
    const m = janela.gameziMusica.montarClassica(p);
    assert.ok(m.eventos.length > 50, p.id + ": poucas notas");
    assert.ok(m.eventos.every((e) => e.n >= 21 && e.n <= 108 && e.vol > 0 && e.dur > 0), p.id + ": nota fora do piano");
    assert.ok(m.duracao > 20 && m.duracao < 280, `${p.id}: dura ${Math.round(m.duracao)} s`);
  }
  // A faixa emenda uma música na outra: em 10 minutos passa por várias sem parar.
  assert.ok(tocar("classicas", 600).notas > 5000, "a faixa Clássicas parou");
});
