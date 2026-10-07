const test = require("node:test");
const assert = require("node:assert/strict");
const { carregar, DADOS } = require("./carregar");

const get = carregar(...DADOS, "js/util.js", "js/match.js", "js/diaria.js");
const todayNumber = get("todayNumber");
const dailyList = get("dailyList");
const pool = get("dailyPool()");

test("1º de outubro de 2026 é a lista #1", () => {
  assert.equal(todayNumber(new Date(2026, 9, 1, 23, 59)), 1);
  assert.equal(todayNumber(new Date(2026, 9, 2, 0, 1)), 2);
});

test("a lista do dia é sempre a mesma e só tem 10 itens", () => {
  assert.equal(dailyList(42).id, dailyList(42).id);
  assert.equal(dailyList(42).items.length, 10);
});

test("não repete lista antes de passar por todas", () => {
  const ids = new Set();
  for (let d = 1; d <= pool.length; d++) ids.add(dailyList(d).id);
  assert.equal(ids.size, pool.length);
});
