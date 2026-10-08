// Gamezi: nível e conquistas (gamezi-conta.js), que contam o que se joga em todos os jogos.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ctx = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "gamezi-conta.js"), "utf8"), ctx);
const r = (e) => vm.runInContext(e, ctx);

test("nível: começa no 1 e sobe com partidas e desafios do dia", () => {
  assert.equal(r("gameziProgresso({}).nivel"), 1);
  assert.equal(r("gameziProgresso({ topzi: { stats: { games: 10 }, diaria: {} } }).nivel"), 2, "100 XP = nível 2");
  assert.equal(r("gameziProgresso({ topzi: { stats: { games: 30 }, diaria: {} } }).nivel"), 3, "300 XP = nível 3");
  const p = r("gameziProgresso({ topzi: { stats: { games: 3, hits: 7 }, diaria: { 1: { score: 40, total: 55 } } }, patozi: { stats: { partidas: 2, escapou: 1 }, diario: {} } })");
  assert.equal(p.partidas, 5);
  assert.equal(p.xp, 5 * 10 + 15 + 7 + 5);
  assert.equal(p.jogos, 2);
});

test("conquistas: sequência de dias, lista vencida e itens do guarda-roupa", () => {
  assert.equal(r("gameziSequencia(['1', '2', '3', '5', '6'])"), 3);
  const p = r("gameziProgresso({ topzi: { stats: { games: 1 }, diaria: { 4: { score: 40, total: 55 }, 5: { score: 1, total: 55 }, 6: { score: 3, total: 55 } } } })");
  const feitas = p.conquistas.filter((c) => c.feita).map((c) => c.id);
  assert.ok(feitas.includes("primeira") && feitas.includes("dias3") && feitas.includes("venceu"));
  assert.equal(r(`gameziItemLiberado(${JSON.stringify(p)}, "chapeu", "aureola")`), true, "3 dias seguidos libera a auréola");
  assert.equal(r(`gameziItemLiberado(${JSON.stringify(p)}, "chapeu", "mago")`), false, "o chapéu de mago é do nível 5");
  assert.equal(r(`gameziItemLiberado(${JSON.stringify(p)}, "chapeu", "coroa")`), true, "itens sem conquista são livres");
});

test("conquistas: nome e como liberar nos três idiomas", () => {
  for (const c of r("GAMEZI_CONQUISTAS")) {
    assert.equal(c.nome.length, 3, c.id);
    assert.equal(c.como.length, 3, c.id);
  }
});
