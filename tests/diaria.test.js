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

test("Top 30 e Top 50 do dia: começam em 14/11/2026, listas do tamanho certo, sem repetir e o dia 1 fixo", () => {
  assert.equal(todayNumber(new Date(2026, 10, 14, 12), 30), 1);
  assert.equal(todayNumber(new Date(2026, 10, 14, 12), 50), 1);
  assert.equal(todayNumber(new Date(2026, 10, 14, 12)), 45); // o Top 10 continua contando de 1º/10
  for (const tam of [30, 50]) {
    assert.equal(dailyList(1, tam).items.length, tam);
    const size = dailyPool(500, tam).length;
    const ids = new Set();
    for (let d = 500; d < 500 + size; d++) ids.add(dailyList(d, tam).id);
    assert.equal(ids.size, size, `Top ${tam} repetiu lista antes de passar por todas`);
  }
  // Listas novas de 30 ou 50 não podem mudar o desafio de um dia que já começou (linha nova em DAILY_POOLS_BIG).
  assert.equal(dailyList(1, 30).id, "30-legumes");
  assert.equal(dailyList(1, 50).id, "50-jogos-playstation");
});
