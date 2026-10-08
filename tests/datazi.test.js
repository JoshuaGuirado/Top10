// Datazi: acontecimentos, regras da linha do tempo e Datazi do dia.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const PASTA = path.join(__dirname, "..", "datazi");
const SITE = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(PASTA, "index.html"), "utf8");
const scripts = [...html.matchAll(/<script src="([^"]+)"/g)].map((m) => m[1]);

const ctx = vm.createContext({ console });
for (const f of ["data/eventos.js", "js/jogo.js"]) vm.runInContext(fs.readFileSync(path.join(PASTA, f), "utf8"), ctx);
const r = (e) => vm.runInContext(e, ctx);

test("os scripts da página existem e estão no modo offline", () => {
  const sw = fs.readFileSync(path.join(SITE, "sw.js"), "utf8");
  for (const s of scripts) {
    const noSite = path.posix.normalize("datazi/" + s);
    assert.ok(fs.existsSync(path.join(SITE, noSite)), `falta ${noSite}`);
    assert.ok(sw.includes(`"${noSite}"`), `sw.js não guarda ${noSite}`);
  }
});

test("acontecimentos: ano inteiro, texto nos 3 idiomas e sem repetir", () => {
  const ev = r("DZ_EVENTOS");
  assert.ok(ev.length >= 100);
  const vistos = new Set();
  for (const e of ev) {
    assert.ok(Number.isInteger(e.ano) && e.ano > 0 && e.ano <= 2026, `${e.id}: ano`);
    assert.equal(e.txt.length, 3, `${e.id}: idiomas`);
    e.txt.forEach((t) => assert.ok(typeof t === "string" && t.length > 5, `${e.id}: texto`));
    assert.ok(!vistos.has(e.txt[0]), `repetido: ${e.txt[0]}`);
    vistos.add(e.txt[0]);
  }
  const pools = r("DZ_DIARIO_POOLS");
  assert.equal(pools[pools.length - 1].eventos, ev.length, "a última linha de DZ_DIARIO_POOLS precisa contar todos os acontecimentos");
});

test("linha do tempo: lugar certo, errado e fim", () => {
  // e1 = 1500, e2 = 1822, e3 = 1888, e5 = 1492
  r('var s = dzNovaPartida(["e2", "e1", "e3", "e5"], 2);');
  assert.equal(r("s.atual"), "e1");
  assert.equal(r("dzColocar(s, 0).certo"), true, "1500 antes de 1822");
  assert.deepEqual([...r("s.linha")], ["e1", "e2"]);
  assert.equal(r("dzColocar(s, 0).certo"), false, "1888 não vem antes de 1500");
  assert.deepEqual([...r("s.linha")], ["e1", "e2", "e3"], "o errado vai para o lugar certo");
  assert.equal(r("s.vidas"), 1);
  assert.equal(r("dzColocar(s, 3).certo"), false, "1492 não vem depois de 1888");
  assert.equal(r("s.fim"), true, "acabaram as vidas");
  assert.equal(r("s.acertos"), 1);
  assert.equal(r("dzColocar(s, 0)"), null, "depois do fim, nada muda");
});

test("Datazi do dia: igual para todo mundo, anos diferentes e o dia 1 não muda", () => {
  const d1 = r("dzDiarioEventos(1)");
  assert.equal(d1.length, r("DZ_DIARIO_QTD") + 1);
  assert.equal(JSON.stringify(r("dzDiarioEventos(1)")), JSON.stringify(d1), "mesmo dia, mesmos acontecimentos");
  assert.equal(new Set(d1.map((id) => r(`dzEvento("${id}").ano`))).size, d1.length, "sem anos repetidos");
  assert.notEqual(JSON.stringify(r("dzDiarioEventos(2)")), JSON.stringify(d1));
  assert.equal(r("dzDiaNumero(new Date(2026, 9, 8))"), 1);
  assert.equal(JSON.stringify(d1), JSON.stringify(["e97","e66","e42","e65","e13","e26","e109","e106","e3"]), "o Datazi do dia 1 não pode mudar");
});
