const test = require("node:test");
const assert = require("node:assert/strict");
const { carregar, DADOS } = require("./carregar");

const get = carregar(...DADOS, "js/util.js", "js/match.js", "js/diaria.js");
const todayNumber = get("todayNumber");
const dailyList = get("dailyList");
const dailyPool = get("dailyPool");

test("1º de outubro de 2026 é a lista #1", () => {
  assert.equal(todayNumber(new Date(2026, 9, 1, 23, 59)), 1);
  assert.equal(todayNumber(new Date(2026, 9, 2, 0, 1)), 2);
});

test("a lista do dia é sempre a mesma e só tem 10 itens", () => {
  assert.equal(dailyList(42).id, dailyList(42).id);
  assert.equal(dailyList(42).items.length, 10);
});

test("não repete lista antes de passar por todas", () => {
  const start = 1000;
  const size = dailyPool(start).length;
  const ids = new Set();
  for (let d = start; d < start + size; d++) ids.add(dailyList(d).id);
  assert.equal(ids.size, size);
});

test("listas novas não mudam a lista do dia que já passou", () => {
  // Dia 7 (7/10/2026) usa o sorteio antigo, de 294 listas.
  assert.equal(dailyPool(7).length, 294);
  assert.equal(dailyList(7).id, "disney-classicos");
});
