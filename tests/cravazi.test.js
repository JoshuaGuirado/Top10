// Cravazi: perguntas, regras da rodada (mais / menos / cravou) e placar.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const PASTA = path.join(__dirname, "..", "cravazi");
const SITE = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(PASTA, "index.html"), "utf8");
const scripts = [...html.matchAll(/<script src="([^"]+)"/g)].map((m) => m[1]);

const ctx = vm.createContext({ console });
for (const s of scripts.filter((s) => !s.startsWith("..") && !s.includes("textos") && !s.includes("app"))) {
  vm.runInContext(fs.readFileSync(path.join(PASTA, s), "utf8"), ctx);
}
const r = (e) => vm.runInContext(e, ctx);

test("os scripts da página existem e estão no modo offline", () => {
  const sw = fs.readFileSync(path.join(SITE, "sw.js"), "utf8");
  for (const s of scripts) {
    const noSite = path.posix.normalize("cravazi/" + s);
    assert.ok(fs.existsSync(path.join(SITE, noSite)), `falta ${noSite}`);
    assert.ok(sw.includes(`"${noSite}"`), `sw.js não guarda ${noSite}`);
  }
  assert.ok(scripts.indexOf("js/jogo.js") < scripts.indexOf("data/perguntas-1.js"), "jogo.js antes das perguntas");
});

test("perguntas: resposta inteira, 3 idiomas, sem repetir e de pé sozinhas", () => {
  const ps = r("CZ_PERGUNTAS");
  assert.ok(ps.length >= 200, "muitas perguntas");
  assert.ok(r("CZ_TEMAS").length >= 10, "muitos temas");
  const vistas = new Set();
  for (const p of ps) {
    assert.ok(Number.isInteger(p.resposta) && p.resposta >= 1, `${p.id}: resposta`);
    assert.equal(p.texto.length, 3, `${p.id}: idiomas`);
    p.texto.forEach((t) => assert.ok(typeof t === "string" && t.length > 10, `${p.id}: texto`));
    assert.ok(!/^(E|And|Y) /.test(p.texto[0]) && !/^(And|¿Y) /.test(p.texto[1] + p.texto[2]), `${p.id}: depende da pergunta anterior`);
    assert.ok(!/\?$/.test(p.texto[2]) || p.texto[2].includes("¿"), `${p.id}: falta o ¿ no espanhol`);
    if (p.unidade) assert.equal(p.unidade.length, 3, `${p.id}: unidade nos 3 idiomas`);
    assert.ok(!vistas.has(p.texto[0]), `repetida: ${p.texto[0]}`);
    vistas.add(p.texto[0]);
    assert.ok(r(`czTemaPorId(${JSON.stringify(p.tema)})`), `${p.id}: tema`);
  }
});

test("perguntas não repetem as cartas do Patozi (mesma resposta e mesmo assunto)", () => {
  const pz = vm.createContext({ console });
  const pzHtml = fs.readFileSync(path.join(SITE, "patozi", "index.html"), "utf8");
  for (const [, s] of pzHtml.matchAll(/<script src="(data\/[^"]+)"/g)) vm.runInContext(fs.readFileSync(path.join(SITE, "patozi", s), "utf8"), pz);
  const comuns = new Set("quantos quantas quanto qual metros tinha primeiro primeira altura mundo brasil segundo depois contando arredondando centimetros tempo numero existem historia ganhou maior oficial minutos segundos pessoas dolares milhoes bilhoes semanas lugar sem casas decimais".split(" "));
  const palavras = (s) => new Set((s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").match(/[a-z0-9]{4,}/g) || []).filter((w) => !comuns.has(w)));
  const porResposta = new Map();
  for (const c of vm.runInContext("PZ_CARTAS", pz)) {
    if (!porResposta.has(c.resposta)) porResposta.set(c.resposta, []);
    porResposta.get(c.resposta).push(palavras(c.q[0]));
  }
  for (const p of r("CZ_PERGUNTAS")) {
    const minhas = palavras(p.texto[0]);
    for (const outra of porResposta.get(p.resposta) || []) {
      const iguais = [...minhas].filter((w) => outra.has(w));
      assert.ok(iguais.length < 2, `${p.id} parece carta do Patozi (${iguais.join(", ")}): ${p.texto[0]}`);
    }
  }
});

test("rodada: é mais, é menos, a faixa fecha e quem crava leva o ponto", () => {
  r(`var pq = [{ id: "t/0", tema: "t", resposta: 8849, texto: ["a", "b", "c"], unidade: null }, { id: "t/1", tema: "t", resposta: 5, texto: ["a", "b", "c"], unidade: null }];
     var s = czNovaPartida({ jogadores: ["Ana", "Beto", "Caio"], perguntas: pq });`);
  assert.equal(r("s.atual.vez"), 0, "a primeira rodada começa com o primeiro jogador");
  assert.equal(r("czChutar(s, 4000)"), "mais");
  assert.equal(r("s.atual.vez"), 1, "passa a vez");
  assert.equal(r("czChutar(s, 20000)"), "menos");
  assert.deepEqual([r("s.atual.baixo"), r("s.atual.alto")], [4000, 20000]);
  assert.equal(r("czChutar(s, 3000)"), null, "fora da faixa não vale");
  assert.equal(r("czChutar(s, 20000)"), null, "o limite também não vale");
  assert.equal(r("czChutar(s, 8849.5)"), null, "só número inteiro");
  assert.equal(r("s.atual.vez"), 2, "chute que não vale não passa a vez");
  assert.equal(r("czChutar(s, 9000)"), "menos");
  assert.equal(r("czChutar(s, 8849)"), "cravou");
  assert.equal(r("s.atual.vencedor"), 0, "Ana cravou");
  assert.equal(r("s.jogadores[0].pontos"), 1);
  assert.equal(r("czChutar(s, 8849)"), null, "rodada encerrada");
  assert.equal(r("czProxima(s)"), false);
  assert.equal(r("s.atual.vez"), 1, "a segunda rodada começa com o segundo jogador");
  assert.equal(r("czChutar(s, 5)"), "cravou");
  assert.equal(r("czProxima(s)"), true, "acabaram as rodadas");
  assert.equal(r("s.fim"), true);
  assert.equal(JSON.stringify(r("czPlacar(s).map((j) => [j.nome, j.pontos, j.pos])")), JSON.stringify([["Ana", 1, 1], ["Beto", 1, 1], ["Caio", 0, 3]]));
  assert.equal(r("czVencedores(s).length"), 2, "empate");
});

test("a rodada não avança sem alguém cravar", () => {
  r(`var s2 = czNovaPartida({ jogadores: ["A", "B"], perguntas: [pq[0]] });`);
  assert.equal(r("czProxima(s2)"), false);
  assert.equal(r("s2.rodada"), 0);
});

test("sorteio: perguntas diferentes, prefere as não vistas e não repete tema seguido", () => {
  const seed = 7;
  r(`var rnd = (function (a) { return function () { a |= 0; a = (a + 0x6d2b79f5) | 0; var t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; })(${seed});`);
  const lista = r("czSortear(15, [], rnd)");
  assert.equal(lista.length, 15);
  assert.equal(new Set(lista.map((p) => p.id)).size, 15, "sem repetir");
  for (let i = 1; i < lista.length; i++) assert.notEqual(lista[i].tema, lista[i - 1].tema, "tema seguido");
  const todas = r("CZ_PERGUNTAS.map((p) => p.id)");
  const naoVistas = new Set(todas.filter((_, i) => i % 20 === 0).slice(0, 10)); // de vários temas
  const vistas = todas.filter((id) => !naoVistas.has(id));
  const novas = r(`czSortear(10, ${JSON.stringify(vistas)}, rnd)`);
  assert.ok(novas.filter((p) => naoVistas.has(p.id)).length >= 8, "quase todas são as não vistas");
});

test("Cravazi está no Gamezi: portal, conta e nível", () => {
  const conta = fs.readFileSync(path.join(SITE, "gamezi-conta.js"), "utf8");
  assert.match(conta, /GAMEZI_JOGOS = \[[^\]]*"cravazi"/);
  assert.match(conta, /cz:stats/);
  assert.match(fs.readFileSync(path.join(SITE, "conta.html"), "utf8"), /cravazi: \{ nome: "Cravazi"/);
  assert.match(fs.readFileSync(path.join(SITE, "index.html"), "utf8"), /href="cravazi\/"/);
  assert.ok(scripts.includes("../gamezi-conta.js"));
  const g = vm.createContext({ console, localStorage: { getItem: (k) => (k === "cz:stats" ? JSON.stringify({ partidas: 3 }) : null), length: 0, key: () => null } });
  vm.runInContext(conta, g);
  assert.equal(vm.runInContext("gameziProgresso().partidas", g), 3, "partidas do Cravazi contam no nível");
});
