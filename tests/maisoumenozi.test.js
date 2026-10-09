// Maisoumenozi: assuntos, regras do "mais ou menos" e desafio do dia.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const PASTA = path.join(__dirname, "..", "maisoumenozi");
const SITE = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(PASTA, "index.html"), "utf8");
const scripts = [...html.matchAll(/<script src="([^"]+)"/g)].map((m) => m[1]);
const PROPRIOS = scripts.filter((s) => !s.startsWith("../"));

const ctx = vm.createContext({ console });
for (const f of PROPRIOS.filter((s) => s.startsWith("js/jogo") || s.startsWith("data/"))) vm.runInContext(fs.readFileSync(path.join(PASTA, f), "utf8"), ctx);
const r = (e) => vm.runInContext(e, ctx);

test("os scripts da página existem e estão no modo offline", () => {
  const sw = fs.readFileSync(path.join(SITE, "sw.js"), "utf8");
  for (const s of scripts) {
    const noSite = path.posix.normalize("maisoumenozi/" + s);
    assert.ok(fs.existsSync(path.join(SITE, noSite)), `falta ${noSite}`);
    assert.ok(sw.includes(`"${noSite}"`), `sw.js não guarda ${noSite}`);
  }
});

test("assuntos: textos nos 3 idiomas, frases variadas e itens que dá para comparar", () => {
  const temas = r("MM_TEMAS");
  assert.ok(temas.length >= 25, "pelo menos 25 assuntos");
  const ids = new Set();
  for (const t of temas) {
    assert.ok(!ids.has(t.id), `assunto repetido: ${t.id}`);
    ids.add(t.id);
    for (const campo of ["titulo", "unidade"]) assert.equal(t[campo].length, 3, `${t.id}: ${campo}`);
    assert.ok(t.unidade.every((u) => u.includes("{n}")), `${t.id}: unidade sem {n}`);
    assert.ok(t.perguntas.length >= 3, `${t.id}: precisa de pelo menos 3 frases`);
    t.perguntas.forEach((p) => assert.ok(p.length === 3 && p.every((x) => x.length > 8 && x.includes("?")), `${t.id}: pergunta "${p[0]}"`));
    assert.equal(t.botoes.length, 2, `${t.id}: botões`);
    t.botoes.forEach((b) => assert.equal(b.length, 3, `${t.id}: botão`));
    assert.ok(t.itens.length >= 7, `${t.id}: poucos itens`);
    const nomes = new Set();
    let pares = 0;
    for (const i of t.itens) {
      assert.ok(typeof i.valor === "number" && i.valor > 0, `${i.id}: valor`);
      assert.equal(i.nome.length, 3, `${i.id}: idiomas`);
      i.nome.forEach((n) => assert.ok(typeof n === "string" && n.length >= 2 && !/\?|Não:/.test(n), `${i.id}: nome "${n}"`));
      assert.ok(!nomes.has(i.nome[0]), `${t.id}: item repetido ${i.nome[0]}`);
      nomes.add(i.nome[0]);
    }
    for (const a of t.itens) for (const b of t.itens) if (a.id < b.id && r(`mmComparaveis(mmItem("${a.id}"), mmItem("${b.id}"))`)) pares++;
    assert.ok(pares >= 20, `${t.id}: só ${pares} pares comparáveis`);
  }
});

test("rodada: certo, errado e o de baixo vira o de cima", () => {
  r("var s = mmNovaPartida({ modo: 'livre', rnd: mmRng(3) });");
  const r1 = r("s.atual");
  const certa = r(`mmItem("${r1.b}").valor > mmItem("${r1.a}").valor ? "mais" : "menos"`);
  assert.equal(r(`mmResponder(s, "${certa}").certo`), true);
  assert.equal(r("s.acertos"), 1);
  assert.equal(r("mmResponder(s, 'mais')"), null, "não responde duas vezes a mesma rodada");
  assert.equal(r("mmProxima(s)"), true);
  const r2 = r("s.atual");
  if (!r2.novo) assert.equal(r2.a, r1.b, "o de baixo sobe");
  const errada = r(`mmItem("${r2.b}").valor > mmItem("${r2.a}").valor ? "menos" : "mais"`);
  assert.equal(r(`mmResponder(s, "${errada}").certo`), false);
  assert.equal(r("s.fim"), true, "na partida livre, o primeiro erro acaba");
  assert.equal(r("mmProxima(s)"), false);
});

test("partida livre: nunca repete item e troca de assunto", () => {
  const res = r(`(() => {
    const s = mmNovaPartida({ modo: "livre", rnd: mmRng(11) });
    const vistos = new Set();
    const temas = new Set();
    let n = 0;
    while (!s.fim && n < 1000) {
      const { a, b, tema } = s.atual;
      if (vistos.has(b)) return "repetiu " + b;
      vistos.add(a); vistos.add(b); temas.add(tema);
      const A = mmItem(a), B = mmItem(b);
      if (A.tema !== B.tema) return "assuntos diferentes";
      if (!mmComparaveis(A, B)) return "par sem diferença: " + a + " " + b;
      mmResponder(s, B.valor > A.valor ? "mais" : "menos");
      mmProxima(s);
      n++;
    }
    return { n, temas: temas.size };
  })()`);
  assert.equal(typeof res, "object", res);
  assert.ok(res.n >= 150, `uma partida perfeita teve só ${res.n} rodadas`);
  assert.ok(res.temas >= 20, "passa por vários assuntos");
});

test("desafio do dia: 10 rodadas iguais para todos, muda no dia seguinte e o dia 1 não muda", () => {
  const d1 = r("JSON.stringify(mmDiarioRodadas(1))");
  assert.equal(r("mmDiarioRodadas(1).length"), r("MM_DIARIO_QTD"));
  assert.equal(r("JSON.stringify(mmDiarioRodadas(1))"), d1);
  assert.notEqual(r("JSON.stringify(mmDiarioRodadas(2))"), d1);
  assert.equal(r("mmDiaNumero(new Date(2026, 9, 9))"), 1);
  assert.equal(
    JSON.stringify(r("mmDiarioRodadas(1).map((x) => x.a + '>' + x.b)")),
    JSON.stringify(["atletas-altura-1>atletas-altura-10", "atletas-altura-10>atletas-altura-11", "atletas-altura-11>atletas-altura-5", "filmes-bilheteria-10>filmes-bilheteria-14", "filmes-bilheteria-14>filmes-bilheteria-1", "filmes-bilheteria-1>filmes-bilheteria-4", "filmes-bilheteria-4>filmes-bilheteria-7", "animais-coracao-6>animais-coracao-4", "animais-coracao-4>animais-coracao-2", "animais-coracao-2>animais-coracao-3"]),
    "o desafio do dia 1 não pode mudar",
  );
  r(`var sd = mmNovaPartida({ modo: "diario", rodadas: mmDiarioRodadas(5) });
     for (let k = 0; k < 10; k++) { mmResponder(sd, "mais"); mmProxima(sd); }`);
  assert.equal(r("sd.fim"), true);
  assert.equal(r("sd.marcas.length"), 10, "no desafio do dia, errar não acaba: são sempre 10");
});

test("desafio do dia: itens novos não mudam os dias que já passaram", () => {
  const pools = r("MM_DIARIO_POOLS");
  assert.equal(pools[0].desde, 1);
  for (let i = 1; i < pools.length; i++) assert.ok(pools[i].desde > pools[i - 1].desde && pools[i].itens >= pools[i - 1].itens);
  assert.equal(pools[pools.length - 1].itens, r("MM_ITENS.length"), "a última linha de MM_DIARIO_POOLS precisa contar todos os itens");
});

test("textos: toda chave e toda frase de acerto e erro nos 3 idiomas", () => {
  const c = vm.createContext({ console, localStorage: { getItem: () => null }, navigator: { language: "pt-BR" } });
  vm.runInContext(fs.readFileSync(path.join(PASTA, "js/textos.js"), "utf8") + ";this.T = MM_T; this.C = MM_CERTO; this.E = MM_ERRADO;", c);
  for (const [k, v] of Object.entries(c.T)) assert.equal(v.length, 3, k);
  for (const f of [...c.C, ...c.E]) assert.equal(f.length, 3, f[0]);
  assert.ok(c.C.length >= 8 && c.E.length >= 6, "várias frases de acerto e de erro");
});
