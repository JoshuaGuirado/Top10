// Confere todas as listas oficiais: tamanho, categoria, ids e respostas que se confundem.
const test = require("node:test");
const assert = require("node:assert/strict");
const { carregar, DADOS } = require("./carregar");

const get = carregar(...DADOS, "js/match.js");
const LISTS = get("LISTS");
const CATEGORIES = get("CATEGORIES");
const normalize = get("normalize");
const stem = get("stem");

test("ids únicos", () => {
  const vistos = new Set();
  for (const l of LISTS) {
    assert.ok(!vistos.has(l.id), `id repetido: ${l.id}`);
    vistos.add(l.id);
  }
});

test("categoria, título, fonte e tamanho válidos", () => {
  const cats = new Set(CATEGORIES.map((c) => c.id));
  for (const l of LISTS) {
    assert.ok(cats.has(l.cat), `${l.id}: categoria "${l.cat}" não existe`);
    assert.ok(l.title && l.source, `${l.id}: falta título ou fonte`);
    assert.ok([10, 30, 50].includes(l.items.length), `${l.id}: tem ${l.items.length} itens`);
    for (const it of l.items) assert.ok(typeof it === "string" && it.split("|")[0].trim(), `${l.id}: item vazio`);
  }
});

test("o número no título bate com o tamanho", () => {
  for (const l of LISTS) {
    const m = l.title.match(/^(?:Os|As) (\d+) /);
    if (m && [30, 50].includes(Number(m[1]))) assert.equal(Number(m[1]), l.items.length, l.id);
  }
});

test("nenhuma resposta vale para dois itens da mesma lista", () => {
  for (const l of LISTS) {
    const dono = new Map();
    l.items.forEach((raw, i) => {
      const respostas = raw.split("|").filter((p) => !p.startsWith("~")).map((p) => stem(normalize(p)));
      for (const r of new Set(respostas)) {
        assert.ok(!dono.has(r) || dono.get(r) === i, `${l.id}: "${r}" vale para o nº ${dono.get(r) + 1} e o nº ${i + 1}`);
        dono.set(r, i);
      }
    });
  }
});

test("pelo menos 30 listas de cada tamanho grande", () => {
  for (const n of [30, 50]) {
    const total = LISTS.filter((l) => l.items.length === n).length;
    assert.ok(total >= 30, `só ${total} listas de ${n}`);
  }
});
