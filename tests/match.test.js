const test = require("node:test");
const assert = require("node:assert/strict");
const { carregar } = require("./carregar");

const get = carregar("js/match.js");
const { normalize, parseList, matchGuess, rankCandidates, hintFor, similarity } = get("({ normalize, parseList, matchGuess, rankCandidates, hintFor, similarity })");

const lista = {
  items: [
    "São Paulo|SP|Sampa",
    "Rio de Janeiro|RJ|Rio",
    "Belo Horizonte|BH",
    "Bananas",
    "Você não é todo mundo|~todo mundo",
    "Pelé|Edson Arantes do Nascimento",
  ],
};
const itens = parseList(lista);
// Objetos criados dentro do vm têm outro protótipo: passa por JSON para comparar.
const plain = (v) => JSON.parse(JSON.stringify(v));
const acha = (palpite, achados = new Map()) => plain(matchGuess(itens, achados, palpite));

test("normaliza acentos, maiúsculas, pontuação e artigo", () => {
  assert.equal(normalize("  O São-Paulo! "), "sao paulo");
  assert.equal(normalize("Tom & Jerry"), "tom e jerry");
});

test("aceita nome, sigla e apelido", () => {
  assert.deepEqual(acha("sao paulo"), { index: 0 });
  assert.deepEqual(acha("SP"), { index: 0 });
  assert.deepEqual(acha("rio"), { index: 1 });
  assert.deepEqual(acha("bh"), { index: 2 });
});

test("singular e plural valem o mesmo", () => {
  assert.deepEqual(acha("banana"), { index: 3 });
});

test("frases valem pela palavra-chave", () => {
  assert.deepEqual(acha("ah, mas você não é TODO MUNDO"), { index: 4 });
});

test("perdoa um errinho de digitação", () => {
  assert.deepEqual(acha("Belo Horisonte"), { index: 2 });
  assert.equal(acha("Belo Hxxxxxonte"), null);
});

test("avisa quando o item já foi achado", () => {
  assert.deepEqual(acha("sp", new Map([[0, 0]])), { dup: 0 });
});

test("palpite errado não acha nada", () => {
  assert.equal(acha("Curitiba"), null);
  assert.equal(acha("   "), null);
});

test("respostas aprendidas passam a valer", () => {
  const comAprendida = parseList(lista, { 5: [normalize("Rei do Futebol")] });
  assert.deepEqual(plain(matchGuess(comAprendida, new Map(), "rei do futebol")), { index: 5 });
});

test("candidatos para 'Aceitar mesmo assim' trazem o mais parecido primeiro", () => {
  assert.equal(rankCandidates(itens, new Map(), "edson arantes", 3)[0], 5);
  assert.equal(rankCandidates(itens, new Map(), "belo horiz", 3)[0], 2);
  // Itens já achados não aparecem.
  assert.ok(!rankCandidates(itens, new Map([[2, 0]]), "belo horiz", 3).includes(2));
});

test("parecença vai de 0 a 1", () => {
  assert.equal(similarity("abc", "abc"), 1);
  assert.equal(similarity("", "abc"), 0);
  assert.ok(similarity("flamengo", "flamengo rj") >= 0.6);
});

test("dica mostra a primeira letra e o tamanho", () => {
  assert.equal(hintFor("Brasil"), "B… · 6 letras");
  assert.equal(hintFor("São Paulo"), "S… · 8 letras · 2 palavras");
});
