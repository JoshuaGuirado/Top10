// Tamanhozi: itens e países, regras do ajuste de tamanho, desafio do dia e o placar online.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const PASTA = path.join(__dirname, "..", "tamanhozi");
const SITE = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(PASTA, "index.html"), "utf8");
const scripts = [...html.matchAll(/<script src="([^"]+)"/g)].map((m) => m[1]);

const ctx = vm.createContext({ console });
for (const f of ["js/jogo.js", "data/itens.js", "data/paises.js"]) vm.runInContext(fs.readFileSync(path.join(PASTA, f), "utf8"), ctx);
const r = (e) => vm.runInContext(e, ctx);
const DIA1 = "cachorro>wadlow moai>flamingo cartao>camundongo tv>cadeira hagrid>quetzalcoatlus p894>p716 pessoa>bisao mulher>bola-basquete onibus>godzilla king-kong>tanque";

test("os scripts da página existem e estão no modo offline", () => {
  const sw = fs.readFileSync(path.join(SITE, "sw.js"), "utf8");
  for (const s of scripts) {
    const noSite = path.posix.normalize("tamanhozi/" + s);
    assert.ok(fs.existsSync(path.join(SITE, noSite)), `falta ${noSite}`);
    assert.ok(sw.includes(`"${noSite}"`), `sw.js não guarda ${noSite}`);
  }
  assert.ok(scripts.indexOf("js/jogo.js") < scripts.indexOf("data/itens.js"), "jogo.js antes dos dados");
  assert.match(fs.readFileSync(path.join(SITE, "mapazi", "index.html"), "utf8"), /tamanhozi/, "o endereço antigo do Mapazi leva para o Tamanhozi");
});

test("itens e países: nome nos 3 idiomas, categoria, medida, contorno e sem repetir", () => {
  const itens = r("TZ_ITENS");
  assert.ok(itens.filter((i) => i.cat !== "paises").length >= 90);
  assert.ok(itens.filter((i) => i.cat === "paises").length >= 120);
  const ids = new Set();
  const cats = new Set(r("TZ_CATEGORIAS"));
  for (const it of itens) {
    assert.ok(!ids.has(it.id), `repetido: ${it.id}`);
    ids.add(it.id);
    assert.ok(cats.has(it.cat), `${it.id}: categoria ${it.cat}`);
    assert.equal(it.nome.length, 3);
    it.nome.forEach((n) => assert.ok(n.length >= 2, `${it.id}: nome`));
    assert.ok(["a", "c", "cv", "l", "d", "e", "area"].includes(it.medida), `${it.id}: medida`);
    assert.ok(it.valor > 0 && it.k > 0 && it.w > 0 && it.h > 0 && /^M/i.test(it.d), `${it.id}: dados`);
  }
  // A escala do desenho bate com a medida: a altura (ou largura) da silhueta vezes k dá a medida em metros.
  for (const it of itens.filter((i) => i.medida !== "area")) {
    const dim = it.medida === "a" || it.medida === "cv" ? it.h : it.w;
    assert.ok(Math.abs((dim * it.k) / it.valor - 1) < 0.001, `${it.id}: escala`);
  }
  // Áreas dos países perto das de verdade (o contorno é simplificado, então aceita uns 6% de diferença).
  for (const [id, km2] of [["p076", 8.51e6], ["p643", 17.1e6], ["p250", 0.55e6], ["p620", 0.089e6], ["p036", 7.69e6]]) {
    assert.ok(Math.abs(r(`tzItem("${id}").valor`) / km2 - 1) < 0.06, `${id}`);
  }
  for (const it of itens.filter((i) => i.cat !== "paises")) assert.ok(it.valor > 0.001 && it.valor < 10000, `${it.id}: ${it.valor} m`);
  // A proporção também é a de verdade (largura × altura em metros, com uns 3% de folga).
  const caixa = (id) => r(`(() => { const it = tzItem("${id}"); return [it.w * it.k, it.h * it.k]; })()`);
  for (const [id, w, h] of [["torre-eiffel", 125, 330], ["cristo", 28, 38], ["queops", 230, 138.5], ["burj-khalifa", 100, 828], ["fusca", 4.08, 1.5], ["boeing-747", 70.7, 19.4], ["titanic", 269, 62], ["cartao", 0.0856, 0.054], ["celular", 0.0716, 0.1476]]) {
    const [cw, ch] = caixa(id);
    assert.ok(Math.abs(cw / w - 1) < 0.03 && Math.abs(ch / h - 1) < 0.03, `${id}: ${cw.toFixed(3)} × ${ch.toFixed(3)} m`);
  }
});

test("rodada sozinho: pontos pelo erro de área e partida de 10 rodadas", () => {
  r(`var rod = { ref: "torre-eiffel", alvo: "big-ben", certo: 0.5, inicio: 0.1 };`);
  assert.equal(r("tzPontos(rod, 0.5)"), 100, "em cheio");
  const dobro = 0.5 + Math.log(Math.SQRT2) / Math.log(10); // tamanho √2 maior = área em dobro
  assert.equal(r(`tzPontos(rod, ${dobro})`), 50);
  assert.equal(r(`tzPontos(rod, ${1 - dobro})`), 50, "metade da área também perde 50");
  assert.equal(r("tzPontos(rod, 1)"), 0);
  r(`var s = tzNovaPartida(tzLivreRodadas("misto", tzRng(3)));`);
  assert.equal(r("s.rodadas.length"), 10);
  assert.equal(r("tzProxima(s)"), false, "não passa sem responder");
  assert.equal(r("tzResponder(s, s.rodadas[0].certo).pontos"), 100);
  assert.equal(r("tzResponder(s, 0.3)"), null, "não responde duas vezes");
  for (let i = 0; i < 9; i++) r("tzProxima(s); tzResponder(s, 0)");
  assert.equal(r("tzProxima(s)"), true);
  assert.equal(r("s.fim"), true);
});

test("sorteio: 10 rodadas em todo tema, pares que cabem juntos e começa longe da resposta", () => {
  for (const cat of ["misto", ...r("TZ_CATEGORIAS")]) {
    for (let seed = 1; seed <= 25; seed++) {
      const rods = r(`tzLivreRodadas("${cat}", tzRng(${seed}))`);
      assert.equal(rods.length, 10, `${cat} ${seed}`);
      const pares = new Set(rods.map((x) => [x.ref, x.alvo].sort().join("|")));
      assert.equal(pares.size, 10, "sem repetir par");
      for (const x of rods) {
        assert.ok(r(`tzParCombina(tzItem("${x.ref}"), tzItem("${x.alvo}"))`), `${x.ref} × ${x.alvo}`);
        if (cat !== "misto") assert.ok(r(`[tzItem("${x.ref}").cat, tzItem("${x.alvo}").cat].includes("${cat}")`), `${cat}: ${x.ref} × ${x.alvo}`);
        assert.ok(Math.abs(x.inicio - x.certo) >= 0.25 && x.certo >= 0.15 && x.certo <= 0.85);
      }
    }
  }
  assert.equal(r(`tzParCombina(tzItem("p076"), tzItem("torre-eiffel"))`), false, "país só com país");
});

test("online: quem chega mais perto leva 1 ponto (empate: os dois) e quem não respondeu não pontua", () => {
  r(`var on = tzNovaOnline({ jogadores: [{ id: "a", nome: "Ana" }, { id: "b", nome: "Beto" }, { id: "c", nome: "Caio" }], rodadas: [{ ref: "torre-eiffel", alvo: "big-ben", certo: 0.5, inicio: 0.1 }, { ref: "fusca", alvo: "onibus", certo: 0.4, inicio: 0.8 }], agora: 0 });`);
  assert.equal(r("tzOnlineResponder(on, 'a', 0.55)"), true);
  assert.equal(r("tzOnlineResponder(on, 'a', 0.5)"), false, "só a primeira resposta vale");
  assert.equal(r("tzOnlineResponder(on, 'x', 0.5)"), false, "quem não está na partida não responde");
  assert.equal(r("tzOnlineTodos(on, ['a', 'b'])"), false);
  r("tzOnlineResponder(on, 'b', 0.47)");
  assert.equal(r("tzOnlineTodos(on, ['a', 'b'])"), true);
  assert.equal(r("tzOnlineRevelar(on)"), true);
  assert.deepEqual([...r("on.ganhadores")], ["b"], "0,47 está mais perto de 0,5 que 0,55");
  assert.deepEqual([...r("on.jogadores.map((j) => j.pontos)")], [0, 1, 0]);
  assert.equal(r("tzOnlineResponder(on, 'c', 0.5)"), false, "depois de revelar não vale");
  assert.equal(r("tzOnlineProxima(on, 1)"), false);
  r("tzOnlineResponder(on, 'a', 0.3); tzOnlineResponder(on, 'c', 0.5); tzOnlineRevelar(on)");
  assert.deepEqual([...r("on.ganhadores")].sort(), ["a", "c"], "mesma distância para mais e para menos: empate");
  assert.equal(r("tzOnlineProxima(on, 2)"), true, "acabaram as rodadas");
  assert.equal(JSON.stringify(r("tzPlacar(on).map((j) => [j.nome, j.pontos, j.pos])")), JSON.stringify([["Ana", 1, 1], ["Beto", 1, 1], ["Caio", 1, 1]]));
});

test("desafio do dia: igual para todo mundo e o dia 1 não muda", () => {
  const d1 = JSON.stringify(r("tzDiarioRodadas(1)"));
  assert.equal(JSON.stringify(r("tzDiarioRodadas(1)")), d1);
  assert.notEqual(JSON.stringify(r("tzDiarioRodadas(2)")), d1);
  assert.equal(r("tzDiaNumero(new Date(2026, 9, 13))"), 1);
  const pools = r("TZ_DIARIO_POOLS");
  const ultimo = pools[pools.length - 1];
  assert.equal(ultimo.itens, r("TZ_ITENS.filter((i) => i.cat !== 'paises').length"), "a última linha de TZ_DIARIO_POOLS precisa contar todos os itens");
  assert.equal(ultimo.paises, r("TZ_ITENS.filter((i) => i.cat === 'paises').length"), "e todos os países");
  assert.equal(r("tzDiarioRodadas(1).map((x) => x.ref + '>' + x.alvo).join(' ')"), DIA1, "o desafio do dia 1 não pode mudar");
});

test("Tamanhozi está no Gamezi: portal, conta, ranking, online e banco", () => {
  const conta = fs.readFileSync(path.join(SITE, "gamezi-conta.js"), "utf8");
  assert.match(conta, /GAMEZI_JOGOS = \[[^\]]*"tamanhozi"/);
  assert.match(conta, /tm:stats/);
  assert.match(conta, /tm:diario/);
  assert.match(fs.readFileSync(path.join(SITE, "conta.html"), "utf8"), /tamanhozi: \{ nome: "Tamanhozi"/);
  assert.match(fs.readFileSync(path.join(SITE, "index.html"), "utf8"), /href="tamanhozi\/"/);
  assert.match(fs.readFileSync(path.join(SITE, "ranking.html"), "utf8"), /id: "tamanhozi"/);
  const schema = fs.readFileSync(path.join(SITE, "supabase", "schema.sql"), "utf8");
  assert.match(schema, /tamanhozi_registrar_diario[\s\S]*date '2026-10-13'[\s\S]*not between 0 and 1000/);
  assert.match(schema, /p_jogo not in \([^)]*'tamanhozi'/);
  for (const tabela of ["tamanhozi_salas", "tamanhozi_sala_jogadores", "tamanhozi_partidas", "tamanhozi_diario"]) assert.match(schema, new RegExp(`create table if not exists public\\.${tabela}`));
  assert.match(schema, /array\['topzi', 'patozi', 'cravazi', 'tamanhozi'\]/, "sair e assumir a sala");
  assert.ok(scripts.includes("../gamezi-conta.js") && scripts.includes("../gamezi-ranking.js") && scripts.includes("../topzi/js/config.js"));
  assert.match(fs.readFileSync(path.join(SITE, "package.json"), "utf8"), /tamanhozi-online\.e2e\.js/);
});
