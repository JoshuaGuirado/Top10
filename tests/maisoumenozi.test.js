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

// Resposta certa para a rodada atual (comum: "mais"/"menos"; maluca: "a"/"b").
r(`function certaDe(rd) { const [va, vb] = mmValores(rd); return rd.uau ? (vb > va ? "b" : "a") : (vb > va ? "mais" : "menos"); }
   function erradaDe(rd) { return { mais: "menos", menos: "mais", a: "b", b: "a" }[certaDe(rd)]; }`);

test("assuntos fora do sorteio não aparecem (a partir do dia 2)", () => {
  const fora = r("JSON.stringify((() => { const s = mmNovaPartida({ modo: 'relogio', rnd: mmRng(4) }); const out = []; for (let k = 0; k < 200 && !s.fim; k++) { const rd = s.atual; if (!rd.uau) out.push(mmItem(rd.a).tema, mmItem(rd.b).tema); mmResponder(s, certaDe(rd)); mmProxima(s); } return out.filter((t) => mmTemaDe(t).fora); })())");
  assert.equal(fora, "[]");
});

test("pergunta da rodada: cada assunto e cada grandeza têm uma frase só, nos 3 idiomas", () => {
  for (const id of r("[...MM_TEMAS.map((t) => t.id), ...MM_GRUPOS.map((g) => g.id)]")) {
    const curta = r(`mmAssunto("${id}").curta`);
    assert.ok(Array.isArray(curta) && curta.length === 3, `${id}: falta a pergunta (data/perguntas.js)`);
    curta.forEach((q) => assert.ok(q.endsWith("?"), `${id}: "${q}"`));
  }
});

test("rodada: certo, errado e o de baixo vira o de cima", () => {
  r("var s = mmNovaPartida({ modo: 'livre', rnd: mmRng(3), uaus: [] });");
  const r1 = r("s.atual");
  assert.equal(r("mmResponder(s, certaDe(s.atual)).certo"), true);
  assert.equal(r("s.acertos"), 1);
  assert.equal(r("mmResponder(s, 'mais')"), null, "não responde duas vezes a mesma rodada");
  assert.equal(r("mmProxima(s)"), true);
  const r2 = r("s.atual");
  if (!r2.novo) assert.equal(r2.a, r1.b, "o de baixo sobe");
  assert.equal(r("mmResponder(s, erradaDe(s.atual)).certo"), false);
  assert.equal(r("s.fim"), true, "no modo sem errar, o primeiro erro acaba");
  assert.equal(r("mmProxima(s)"), false);
});

test("partida: nunca repete, mistura assuntos da mesma grandeza e traz comparações malucas", () => {
  const res = r(`(() => {
    const s = mmNovaPartida({ modo: "relogio", rnd: mmRng(11) });
    const vistos = new Set();
    const grandezas = new Set();
    let misturou = 0, uaus = 0, n = 0;
    while (!s.fim && n < 600) {
      const rd = s.atual;
      if (rd.uau) {
        if (vistos.has(rd.uau)) return "uau repetido " + rd.uau;
        vistos.add(rd.uau); uaus++;
      } else {
        const A = mmItem(rd.a), B = mmItem(rd.b);
        if (vistos.has(B.id)) return "repetiu " + B.id;
        vistos.add(A.id); vistos.add(B.id); grandezas.add(rd.tema);
        if (mmGrupoDoItem(A) !== mmGrupoDoItem(B)) return "grandezas diferentes: " + A.id + " " + B.id;
        if (A.tema !== B.tema) misturou++;
        if (!mmComparaveis(A, B)) return "par sem diferença: " + A.id + " " + B.id;
      }
      mmResponder(s, certaDe(rd));
      mmProxima(s);
      n++;
    }
    return { n, grandezas: grandezas.size, misturou, uaus };
  })()`);
  assert.equal(typeof res, "object", res);
  assert.ok(res.n >= 150, `uma partida perfeita teve só ${res.n} rodadas`);
  assert.ok(res.grandezas >= 10, "passa por várias grandezas");
  assert.ok(res.misturou >= 10, "cruza assuntos diferentes da mesma grandeza");
  assert.ok(res.uaus >= 20, "traz comparações malucas");
});

test("relógio: pontos, combo que multiplica e erro que zera o combo", () => {
  r("var sr = mmNovaPartida({ modo: 'relogio', rnd: mmRng(21), uaus: [] });");
  const ganhos = [];
  for (let k = 0; k < 7; k++) {
    ganhos.push(r("mmResponder(sr, certaDe(sr.atual)).ganhou"));
    r("mmProxima(sr)");
  }
  assert.deepEqual(ganhos, [10, 10, 10, 20, 20, 20, 30], "×2 a partir do 3º acerto seguido (o 4º já vale dobrado), ×3 a partir do 6º");
  assert.equal(r("sr.pontos"), 120);
  assert.equal(r("mmResponder(sr, erradaDe(sr.atual)).ganhou"), 0);
  assert.equal(r("sr.combo"), 0, "errar zera o combo");
  assert.equal(r("sr.fim"), false, "no relógio, errar não acaba a partida");
  assert.equal(r("sr.maiorCombo"), 7);
  r("mmProxima(sr); mmTempoAcabou(sr)");
  assert.equal(r("sr.fim"), true);
  assert.equal(r("mmMultiplicador(100)"), 5, "o combo vai até ×5");
});

test("comparações malucas: textos nos 3 idiomas e uma diferença clara", () => {
  const uaus = r("MM_UAU");
  assert.ok(uaus.length >= 50);
  for (const u of uaus) {
    for (const campo of ["pergunta", "unidade", "fato"]) assert.equal(u[campo].length, 3, `${u.id}: ${campo}`);
    assert.ok(u.unidade.every((x) => x.includes("{n}")), `${u.id}: unidade`);
    for (const lado of [u.a, u.b]) {
      assert.equal(lado.length, 4, `${u.id}: lado`);
      assert.ok(typeof lado[0] === "number" && lado[0] > 0, `${u.id}: valor`);
    }
    const razao = Math.max(u.a[0], u.b[0]) / Math.min(u.a[0], u.b[0]);
    assert.ok(razao >= 1.07, `${u.id}: números perto demais (${u.a[1]} × ${u.b[1]})`);
  }
  r("var su = mmNovaPartida({ modo: 'diario', rodadas: [{ uau: 'u1', novo: true }] });");
  assert.equal(r("mmResponder(su, 'mais')"), null, "na maluca, responde tocando num dos dois");
  assert.equal(r("mmResponder(su, 'b').certo"), true, "30 elefantes pesam mais que uma baleia-azul");
  assert.equal(r("su.ultimo.ganhou"), 20, "a maluca vale o dobro");
});

test("desafio do dia: 10 rodadas iguais para todos, 5 malucas a partir do dia 2 e o dia 1 não muda", () => {
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
  for (const dia of [2, 3, 30]) assert.equal(r(`mmDiarioRodadas(${dia}).filter((x) => x.uau).length`), 5, `dia ${dia}: 5 malucas`);
  r(`var sd = mmNovaPartida({ modo: "diario", rodadas: mmDiarioRodadas(5) });
     for (let k = 0; k < 10; k++) { mmResponder(sd, erradaDe(sd.atual)); mmProxima(sd); }`);
  assert.equal(r("sd.fim"), true);
  assert.equal(r("sd.marcas.length"), 10, "no desafio do dia, errar não acaba: são sempre 10");
});

test("desafio do dia: itens novos não mudam os dias que já passaram", () => {
  const pools = r("MM_DIARIO_POOLS");
  assert.equal(pools[0].desde, 1);
  for (let i = 1; i < pools.length; i++) assert.ok(pools[i].desde > pools[i - 1].desde && pools[i].itens >= pools[i - 1].itens);
  assert.equal(pools[pools.length - 1].itens, r("MM_ITENS.length"), "a última linha de MM_DIARIO_POOLS precisa contar todos os itens");
  assert.equal(pools[pools.length - 1].uau, r("MM_UAU.length"), "a última linha de MM_DIARIO_POOLS precisa contar todas as malucas");
});

test("textos: toda chave e toda frase de acerto e erro nos 3 idiomas", () => {
  const c = vm.createContext({ console, localStorage: { getItem: () => null }, navigator: { language: "pt-BR" } });
  vm.runInContext(fs.readFileSync(path.join(PASTA, "js/textos.js"), "utf8") + ";this.T = MM_T; this.C = MM_CERTO; this.E = MM_ERRADO;", c);
  for (const [k, v] of Object.entries(c.T)) assert.equal(v.length, 3, k);
  for (const f of [...c.C, ...c.E]) assert.equal(f.length, 3, f[0]);
  assert.ok(c.C.length >= 8 && c.E.length >= 6, "várias frases de acerto e de erro");
});
