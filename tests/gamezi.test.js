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

test("sequência do Gamezi: dias seguidos com algum desafio do dia, de qualquer jogo", () => {
  const dados = (topzi, corzi, patozi) => JSON.stringify({ topzi: { stats: {}, diaria: topzi }, corzi: { stats: {}, diario: corzi }, patozi: { stats: {}, diario: patozi } });
  const hoje = "new Date(2026, 9, 26)"; // Topzi #26, Corzi #1, Patozi #19
  assert.equal(r(`gameziDiaDe("topzi", ${hoje})`), 26);
  assert.equal(r(`gameziDiaDe("corzi", ${hoje})`), 1);
  // Topzi nos dias 24 e 25, Corzi hoje: 3 dias seguidos, 1 jogo feito hoje.
  assert.equal(JSON.stringify(r(`gameziSequenciaAtual(${dados({ 24: {}, 25: {} }, { 1: {} }, {})}, ${hoje})`)), JSON.stringify({ dias: 3, jogouHoje: true, hoje: 1 }));
  // Ainda não jogou hoje: conta até ontem. Pato do dia pela metade não conta.
  assert.equal(JSON.stringify(r(`gameziSequenciaAtual(${dados({ 23: {}, 25: {} }, {}, { 19: { pontos: [1, 2] } })}, ${hoje})`)), JSON.stringify({ dias: 1, jogouHoje: false, hoje: 0 }));
  assert.equal(r(`gameziSequenciaAtual(${dados({}, {}, {})}, ${hoje}).dias`), 0);
});
