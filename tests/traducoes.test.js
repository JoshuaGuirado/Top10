// Confere as traduções das listas: todo título traduzido e nenhuma resposta (em qualquer idioma)
// valendo para dois itens da mesma lista.
const test = require("node:test");
const assert = require("node:assert/strict");
const { carregar, DADOS } = require("./carregar");

const get = carregar(...DADOS, "js/match.js");
const LISTS = get("LISTS");
const LIST_I18N = get("LIST_I18N");
const SOURCE_I18N = get("SOURCE_I18N");
const ITEM_I18N = get("ITEM_I18N");
const { normalize, stem, parseList } = get("({ normalize, stem, parseList })");

test("toda lista oficial tem título em inglês e espanhol", () => {
  const faltam = LISTS.filter((l) => !(LIST_I18N[l.id] && LIST_I18N[l.id][0] && LIST_I18N[l.id][1])).map((l) => l.id);
  assert.deepEqual([...faltam], []);
});

test("não há tradução de título para lista que não existe", () => {
  const ids = new Set(LISTS.map((l) => l.id));
  assert.deepEqual([...Object.keys(LIST_I18N).filter((id) => !ids.has(id))], []);
});

test("traduções de fonte e de item têm o formato certo", () => {
  for (const [k, v] of [...Object.entries(SOURCE_I18N), ...Object.entries(ITEM_I18N)]) {
    assert.ok(Array.isArray(v) && v.length === 2, `"${k}" precisa de [inglês, espanhol]`);
    for (const x of v) assert.ok(x === null || (typeof x === "string" && x.split("|")[0].trim()), `"${k}": tradução vazia`);
  }
});

test("traduções por lista apontam para um item que existe", () => {
  const byId = new Map(LISTS.map((l) => [l.id, l]));
  for (const k of Object.keys(ITEM_I18N).filter((k) => k.includes("/") && byId.has(k.split("/")[0]))) {
    const [id, ...rest] = k.split("/");
    const nome = rest.join("/");
    assert.ok(byId.get(id).items.some((it) => it.split("|")[0] === nome), `${k}: item não existe na lista`);
  }
});

test("nenhuma resposta traduzida vale para dois itens da mesma lista", () => {
  const erros = [];
  for (const l of LISTS) {
    const dono = new Map();
    parseList(l).forEach((it, i) => {
      for (const r of new Set(it.stems)) {
        if (dono.has(r) && dono.get(r) !== i) erros.push(`${l.id}: "${r}" vale para o nº ${dono.get(r) + 1} e o nº ${i + 1}`);
        dono.set(r, i);
      }
    });
  }
  assert.deepEqual(erros, []);
});

test("resposta em outro idioma vale (sala online com cada um no seu idioma)", () => {
  const matchGuess = get("matchGuess");
  const lista = LISTS.find((l) => l.id === "paises-populosos");
  const itens = parseList(lista);
  assert.equal(matchGuess(itens, new Set(), "Pakistan").index, 4);
  assert.equal(matchGuess(itens, new Set(), "Pakistán").index, 4);
  assert.equal(matchGuess(itens, new Set(), "Paquistão").index, 4);
});

test("nome de item com dois sentidos usa a tradução da lista", () => {
  const nome = (id, item) => ITEM_I18N[`${id}/${item}`] || ITEM_I18N[item];
  assert.equal(nome("animais-mar", "Lula")[0], "Squid");
  assert.equal(nome("p-brasileiros-famosos", "Lula"), undefined);
  assert.equal(nome("feriados", "Natal")[0], "Christmas");
  assert.equal(nome("natal", "Peru")[0], "Turkey");
  assert.equal(nome("america-sul-area", "Peru")[0], "Peru");
});
