// Confere listas novas antes de entrarem no jogo: node tests/validar-listas.js data/listas-x.js data/traducoes-x.js
// (caminhos a partir de topzi/). Carrega as listas atuais + o arquivo de listas, depois as traduções atuais +
// o arquivo de traduções, e faz as mesmas conferências dos testes, só para as listas novas.
const path = require("path");
const fs = require("fs");
const vm = require("vm");
const { ROOT, DADOS } = require("./carregar");

const [arqListas, arqTrad] = process.argv.slice(2);
if (!arqListas) {
  console.log("uso: node tests/validar-listas.js data/listas-x.js [data/traducoes-x.js]");
  process.exit(2);
}
const base = DADOS.filter((f) => f !== arqListas && f !== arqTrad);
const listas = base.filter((f) => !f.includes("traduc"));
const trads = base.filter((f) => f.includes("traduc"));
const ordem = [...listas, arqListas, ...trads, ...(arqTrad ? [arqTrad] : []), "js/match.js"];

const ctx = vm.createContext({ console });
const antes = { n: 0 };
for (const f of ordem) {
  if (f === arqListas) antes.n = vm.runInContext("LISTS.length", ctx);
  vm.runInContext(fs.readFileSync(path.join(ROOT, f), "utf8"), ctx, { filename: f });
}
const get = (e) => vm.runInContext(e, ctx);
const LISTS = get("LISTS");
const novas = LISTS.slice(antes.n);
const cats = new Set(get("CATEGORIES").map((c) => c.id));
const LIST_I18N = get("LIST_I18N");
const ITEM_I18N = get("ITEM_I18N");
const SOURCE_I18N = get("SOURCE_I18N");
const { normalize, stem, parseList } = get("({ normalize, stem, parseList })");
const erros = [];

const ids = new Map();
for (const l of LISTS) {
  if (ids.has(l.id)) erros.push(`id repetido: ${l.id}`);
  ids.set(l.id, l);
}
const titulosVelhos = new Set(LISTS.slice(0, antes.n).map((l) => normalize(l.title)));
for (const l of novas) {
  if (!cats.has(l.cat)) erros.push(`${l.id}: categoria "${l.cat}" não existe`);
  if (!l.title || !l.source) erros.push(`${l.id}: falta título ou fonte`);
  if (![10, 30, 50].includes(l.items.length)) erros.push(`${l.id}: tem ${l.items.length} itens (precisa 10, 30 ou 50)`);
  const m = (l.title || "").match(/^(?:Os|As) (\d+) /);
  if (!m) erros.push(`${l.id}: título precisa começar com "Os N " ou "As N "`);
  else if (Number(m[1]) !== l.items.length) erros.push(`${l.id}: título diz ${m[1]} mas tem ${l.items.length} itens`);
  if (titulosVelhos.has(normalize(l.title))) erros.push(`${l.id}: já existe lista com esse título`);
  if (!SOURCE_I18N[l.source]) erros.push(`${l.id}: fonte sem tradução (use uma fonte que já existe em data/traducoes.js): ${l.source}`);
  if (!(LIST_I18N[l.id] && LIST_I18N[l.id][0] && LIST_I18N[l.id][1])) erros.push(`${l.id}: falta título em inglês e espanhol`);
  for (const it of l.items) if (typeof it !== "string" || !it.split("|")[0].trim()) erros.push(`${l.id}: item vazio`);
  const nomes = new Set();
  for (const it of l.items) {
    const n = normalize(it.split("|")[0]);
    if (nomes.has(n)) erros.push(`${l.id}: item repetido "${it}"`);
    nomes.add(n);
  }
  const dono = new Map();
  parseList(l).forEach((it, i) => {
    for (const r of new Set(it.stems)) {
      if (dono.has(r) && dono.get(r) !== i) erros.push(`${l.id}: a resposta "${r}" vale para o nº ${dono.get(r) + 1} e o nº ${i + 1}`);
      dono.set(r, i);
    }
  });
}
for (const [k, v] of Object.entries(ITEM_I18N)) {
  if (!Array.isArray(v) || v.length !== 2) erros.push(`tradução "${k}" precisa ser [inglês, espanhol]`);
  if (k.includes("/")) {
    const [id, ...rest] = k.split("/");
    if (ids.has(id) && !ids.get(id).items.some((it) => it.split("|")[0] === rest.join("/"))) erros.push(`tradução "${k}": item não existe na lista`);
  }
}
for (const id of Object.keys(LIST_I18N)) if (!ids.has(id)) erros.push(`título traduzido para lista que não existe: ${id}`);

const porTamanho = {};
for (const l of novas) porTamanho[l.items.length] = (porTamanho[l.items.length] || 0) + 1;
console.log(`${novas.length} listas novas`, porTamanho);
if (erros.length) {
  console.log(`\n${erros.length} problema(s):\n` + [...new Set(erros)].join("\n"));
  process.exit(1);
}
console.log("Tudo certo.");
