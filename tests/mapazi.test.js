// Mapazi: países, regras do ajuste de tamanho e Mapazi do dia.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const PASTA = path.join(__dirname, "..", "mapazi");
const SITE = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(PASTA, "index.html"), "utf8");
const scripts = [...html.matchAll(/<script src="([^"]+)"/g)].map((m) => m[1]);

const ctx = vm.createContext({ console });
for (const f of ["js/jogo.js", "data/paises.js"]) vm.runInContext(fs.readFileSync(path.join(PASTA, f), "utf8"), ctx);
const r = (e) => vm.runInContext(e, ctx);
const DIA1 = "724>418 643>148 392>688 076>706 032>484 124>231 620>188 036>598 156>792 356>566";

test("os scripts da página existem e estão no modo offline", () => {
  const sw = fs.readFileSync(path.join(SITE, "sw.js"), "utf8");
  for (const s of scripts) {
    const noSite = path.posix.normalize("mapazi/" + s);
    assert.ok(fs.existsSync(path.join(SITE, noSite)), `falta ${noSite}`);
    assert.ok(sw.includes(`"${noSite}"`), `sw.js não guarda ${noSite}`);
  }
  assert.ok(scripts.indexOf("js/jogo.js") < scripts.indexOf("data/paises.js"), "jogo.js antes dos países");
});

test("países: nome nos 3 idiomas, área, contorno e sem repetir", () => {
  const ps = r("MP_PAISES");
  assert.ok(ps.length >= 100);
  const ids = new Set();
  for (const p of ps) {
    assert.ok(!ids.has(p.id), `repetido: ${p.id}`);
    ids.add(p.id);
    assert.equal(p.nome.length, 3);
    p.nome.forEach((n) => assert.ok(n.length >= 3, `${p.id}: nome`));
    assert.ok(p.km2 > 1000 && p.u > 0 && p.w > 0 && p.h > 0 && /^M/.test(p.d), `${p.id}: dados`);
  }
  // Áreas perto das de verdade (o contorno é simplificado, então aceita uns 6% de diferença).
  const area = (id) => r(`mpPais("${id}").km2`);
  for (const [id, km2] of [["076", 8.51e6], ["643", 17.1e6], ["250", 0.55e6], ["620", 0.089e6], ["036", 7.69e6]]) {
    assert.ok(Math.abs(area(id) / km2 - 1) < 0.06, `${id}: ${area(id)} km²`);
  }
  for (const ref of r("MP_REFERENCIAS")) assert.ok(r(`!!mpPais("${ref}")`), `referência ${ref}`);
});

test("rodada: pontos pelo erro de área e partida de 10 rodadas", () => {
  r(`var rod = { ref: "076", alvo: "643", certo: 0.5, inicio: 0.1 };`);
  assert.equal(r("mpPontos(rod, 0.5)"), 100, "em cheio");
  const dobro = 0.5 + Math.log(Math.SQRT2) / Math.log(10); // largura √2 maior = área em dobro
  assert.equal(r(`mpPontos(rod, ${dobro})`), 50);
  assert.equal(r(`mpPontos(rod, ${1 - dobro})`), 50, "metade da área também perde 50");
  assert.equal(r("mpPontos(rod, 1)"), 0);
  r(`var s = mpNovaPartida(mpLivreRodadas(mpRng(3)));`);
  assert.equal(r("s.rodadas.length"), 10);
  assert.equal(r("mpProxima(s)"), false, "não passa sem responder");
  assert.equal(r("mpResponder(s, s.rodadas[0].certo).pontos"), 100);
  assert.equal(r("mpResponder(s, 0.3)"), null, "não responde duas vezes");
  for (let i = 0; i < 9; i++) r("mpProxima(s); mpResponder(s, 0)");
  assert.equal(r("mpProxima(s)"), true);
  assert.equal(r("s.fim"), true);
});

test("sorteio: países diferentes, tamanhos bem diferentes e começa longe da resposta", () => {
  for (let seed = 1; seed <= 40; seed++) {
    const rods = r(`mpLivreRodadas(mpRng(${seed}))`);
    assert.equal(rods.length, 10);
    const todos = rods.flatMap((x) => [x.ref, x.alvo]);
    assert.equal(new Set(todos).size, 20, "sem repetir país");
    for (const x of rods) {
      const k = r(`mpPais("${x.alvo}").km2 / mpPais("${x.ref}").km2`);
      assert.ok(k >= 1 / 40 - 1e-9 && k <= 40 && Math.abs(Math.log(k)) >= Math.log(1.3) - 1e-9);
      assert.ok(Math.abs(x.inicio - x.certo) >= 0.25 && x.certo >= 0.15 && x.certo <= 0.85);
    }
  }
});

test("Mapazi do dia: igual para todo mundo e o dia 1 não muda", () => {
  const d1 = JSON.stringify(r("mpDiarioRodadas(1)"));
  assert.equal(JSON.stringify(r("mpDiarioRodadas(1)")), d1);
  assert.notEqual(JSON.stringify(r("mpDiarioRodadas(2)")), d1);
  assert.equal(r("mpDiaNumero(new Date(2026, 9, 13))"), 1);
  const pools = r("MP_DIARIO_POOLS");
  assert.equal(pools[pools.length - 1].paises, r("MP_PAISES.length"), "a última linha de MP_DIARIO_POOLS precisa contar todos os países");
  assert.equal(r("mpDiarioRodadas(1).map((x) => x.ref + '>' + x.alvo).join(' ')"), DIA1, "o Mapazi do dia 1 não pode mudar");
});

test("Mapazi está no Gamezi: portal, conta, ranking e banco", () => {
  const conta = fs.readFileSync(path.join(SITE, "gamezi-conta.js"), "utf8");
  assert.match(conta, /GAMEZI_JOGOS = \[[^\]]*"mapazi"/);
  assert.match(conta, /mp:stats/);
  assert.match(conta, /mp:diario/);
  assert.match(fs.readFileSync(path.join(SITE, "conta.html"), "utf8"), /mapazi: \{ nome: "Mapazi"/);
  assert.match(fs.readFileSync(path.join(SITE, "index.html"), "utf8"), /href="mapazi\/"/);
  assert.match(fs.readFileSync(path.join(SITE, "ranking.html"), "utf8"), /id: "mapazi"/);
  const schema = fs.readFileSync(path.join(SITE, "supabase", "schema.sql"), "utf8");
  assert.match(schema, /mapazi_registrar_diario[\s\S]*date '2026-10-13'[\s\S]*not between 0 and 1000/);
  assert.match(schema, /p_jogo not in \([^)]*'mapazi'/);
  assert.ok(scripts.includes("../gamezi-conta.js") && scripts.includes("../gamezi-ranking.js") && scripts.includes("../topzi/js/config.js"));
});
