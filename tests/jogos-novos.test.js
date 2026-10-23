// Jogos do kit (Emojizi, Contazi, Memorizi): motor de rodadas (gamezi-rodadas.js), regras de cada um, desafio
// do dia fixo e integração com o Gamezi (portal, conta, ranking, modo offline e banco).
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const SITE = path.join(__dirname, "..");
const ler = (f) => fs.readFileSync(path.join(SITE, f), "utf8");
const JOGOS = { emojizi: ["js/jogo.js", "data/itens.js"], contazi: ["js/jogo.js"], memorizi: ["js/jogo.js"] };

function contexto(jogo) {
  const ctx = vm.createContext({ console });
  vm.runInContext(ler("gamezi-rodadas.js"), ctx);
  for (const f of JOGOS[jogo]) vm.runInContext(ler(`${jogo}/${f}`), ctx);
  return (e) => vm.runInContext(e, ctx);
}

test("os scripts e as marcas existem e estão no modo offline", () => {
  const sw = ler("sw.js");
  for (const jogo of Object.keys(JOGOS)) {
    const html = ler(`${jogo}/index.html`);
    const scripts = [...html.matchAll(/<script src="([^"]+)"/g)].map((m) => m[1]);
    assert.ok(scripts.includes("../gamezi-kit.js") && scripts.includes("../gamezi-skins.js") && scripts.includes("../gamezi-musica.js"), jogo);
    for (const s of scripts.concat(["style.css"])) {
      const noSite = path.posix.normalize(`${jogo}/${s}`);
      assert.ok(fs.existsSync(path.join(SITE, noSite)), `falta ${noSite}`);
      assert.ok(sw.includes(`"${noSite}"`), `sw.js não guarda ${noSite}`);
    }
    for (const b of ["logo", "logo-dark", "simbolo", "simbolo-escuro"]) assert.ok(sw.includes(`"brand/${jogo}-${b}.svg"`) && fs.existsSync(path.join(SITE, `brand/${jogo}-${b}.svg`)), `${jogo}: brand ${b}`);
  }
  assert.ok(sw.includes('"gamezi-kit.css"') && sw.includes('"gamezi-rodadas.js"'));
});

test("motor: pontos pelo tempo, partida livre com 3 vidas e desafio com 10 rodadas", () => {
  const r = contexto("contazi");
  assert.equal(r("gzPontosTempo(0, 10)"), 100);
  assert.equal(r("gzPontosTempo(5000, 10)"), 75);
  assert.equal(r("gzPontosTempo(99999, 10)"), 50);
  r("var s = gzNovaPartida({ proxima: ctLivre(gzRng(1)), vidas: GZ_VIDAS });");
  let rodadas = 0;
  while (!r("s.fim")) {
    rodadas++;
    r(rodadas % 2 ? "gzResponder(s, s.rodadas[s.n].resposta, 1000, ctAvaliar)" : "gzResponder(s, null, 12000, ctAvaliar)");
    assert.equal(r("gzResponder(s, 1, 0, ctAvaliar)"), null, "uma resposta por rodada");
    r("gzProxima(s)");
  }
  assert.equal(rodadas, 6, "acaba no terceiro erro");
  assert.equal(r("s.acertos"), 3);
  r("var d = gzNovaPartida({ rodadas: ctDiario(3) });");
  for (let i = 0; i < 10; i++) {
    r("gzResponder(d, d.rodadas[d.n].resposta, 0, ctAvaliar)");
    assert.equal(r("gzProxima(d)"), i === 9);
  }
  assert.equal(r("d.pontos"), 1000, "tudo certo na hora: 1.000");
});

test("motor online: a mesma rodada para todos, só a primeira resposta vale e o placar", () => {
  const r = contexto("memorizi");
  r('var o = gzNovaOnline({ jogadores: [{ id: "a", nome: "Ana" }, { id: "b", nome: "Beto", skin: { presetId: "x", avatar: {} } }], rodadas: mzOnline(gzRng(4)) });');
  assert.equal(r("o.jogadores[1].skin.presetId"), "x");
  for (let i = 0; i < 10; i++) {
    assert.equal(r('gzOnlineResponder(o, "a", o.rodadas[o.n].seq, 1000, mzValida)'), true);
    assert.equal(r('gzOnlineResponder(o, "a", [0], 1000, mzValida)'), false, "só a primeira vale");
    assert.equal(r('gzOnlineResponder(o, "b", [9], 1000, mzValida)'), false, "cor que não existe");
    r('gzOnlineResponder(o, "b", o.rodadas[o.n].seq.map((c) => (c + 1) % 4), 1000, mzValida)');
    assert.equal(r('gzOnlineTodos(o, ["a", "b"])'), true);
    r("gzOnlineRevelar(o, mzAvaliar)");
    assert.ok(r("o.ganhos.a") >= 50 && r("o.ganhos.b") === 0);
    assert.equal(r("gzOnlineProxima(o)"), i === 9);
  }
  assert.equal(JSON.stringify(r("gzPlacar(o)").map((j) => [j.nome, j.pos])), '[["Ana",1],["Beto",2]]');
});

test("Contazi: contas inteiras, sem negativo, mais difíceis no fim, e o dia 1 não muda", () => {
  const r = contexto("contazi");
  for (let nivel = 1; nivel <= 10; nivel++) {
    for (let k = 0; k < 200; k++) {
      const c = r(`ctConta(${nivel}, gzRng(${nivel * 1000 + k}))`);
      assert.ok(Number.isInteger(c.resposta) && c.resposta >= 0, `${c.texto} = ${c.resposta}`);
      const conta = c.texto.replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-").replace(/(\d+)% \* (\d+)/, "($1/100)*$2");
      assert.equal(Function(`return ${conta}`)(), c.resposta, c.texto);
    }
  }
  assert.equal(JSON.stringify(r("ctDiario(1).map((c) => c.texto + '=' + c.resposta)")), JSON.stringify(["8 + 11=19","3 + 14=17","48 + 63=111","9 × 3=27","9 ÷ 3=3","32 ÷ 8=4","429 − 318=111","9 × 5 + 40=85","16 × 6 − 17=79","390 ÷ 13=30"]), "o Contazi do dia 1 não pode mudar");
  assert.equal(r("ctAvaliar({ resposta: 56 }, 56, 0).pontos"), 100);
  assert.equal(r("ctAvaliar({ resposta: 56 }, 55, 0).certo"), false);
});

test("Memorizi: sequências que crescem, tempo da rodada e o dia 1 não muda", () => {
  const r = contexto("memorizi");
  assert.deepEqual([...r("mzDiario(1).map((s) => s.seq.length)")], [...r("MZ_TAMANHOS_DIA")]);
  assert.equal(JSON.stringify(r("mzDiario(1).map((s) => s.seq.join(''))")), JSON.stringify(["210","202","3310","2023","31311","01321","220022","233213","2131010","20331212"]), "o Memorizi do dia 1 não pode mudar");
  assert.ok(r("mzSegundos({ seq: [0, 1, 2] })") >= 9, "dá tempo de ver e repetir");
  assert.equal(r("mzAvaliar({ seq: [0, 1, 2] }, [0, 1, 2], 0).certo"), true);
  assert.equal(r("mzAvaliar({ seq: [0, 1, 2] }, [0, 1], 0).certo"), false, "pela metade não vale");
  r("var g = mzLivre(gzRng(2));");
  assert.deepEqual([1, 2, 3, 4, 5].map(() => r("g().seq.length")), [3, 3, 4, 4, 5]);
});

test("Emojizi: itens nos 3 idiomas, sem repetir, alternativas do mesmo tipo e o dia 1 não muda", () => {
  const r = contexto("emojizi");
  const itens = r("EJ_ITENS");
  assert.ok(itens.length >= 80);
  const nomes = new Set();
  const emojis = new Set();
  for (const i of itens) {
    assert.ok(["filme", "lugar"].includes(i.cat), i.id);
    assert.equal(i.nome.length, 3, i.id);
    i.nome.forEach((n) => assert.ok(typeof n === "string" && n.length >= 2, `${i.id}: nome`));
    assert.ok(!nomes.has(i.nome[0]), `repetido: ${i.nome[0]}`);
    assert.ok(!emojis.has(i.emojis), `emojis repetidos: ${i.emojis}`);
    nomes.add(i.nome[0]);
    emojis.add(i.emojis);
  }
  const pools = r("EJ_DIARIO_POOLS");
  assert.equal(pools[pools.length - 1].itens, itens.length, "a última linha de EJ_DIARIO_POOLS precisa contar todos os itens");
  for (let d = 1; d < 40; d++) {
    for (const rod of r(`ejDiario(${d})`)) {
      assert.equal(new Set(rod.opcoes).size, 4);
      assert.ok(rod.opcoes.includes(rod.id));
      assert.ok(rod.opcoes.every((id) => r(`ejItem("${id}").cat`) === r(`ejItem("${rod.id}").cat`)), "alternativas do mesmo tipo");
    }
  }
  assert.equal(JSON.stringify(r("ejDiario(1).map((x) => x.id)")), JSON.stringify(["e52","e72","e45","e12","e39","e4","e73","e40","e84","e78"]), "o Emojizi do dia 1 não pode mudar");
});

test("os jogos novos estão no Gamezi: portal, conta, ranking, banco e testes", () => {
  const conta = ler("gamezi-conta.js");
  const schema = ler("supabase/schema.sql");
  const novo = ler("supabase/jogos-novos.sql");
  const falso = ler("tests/supabase-falso.js");
  for (const [jogo, pre] of [["emojizi", "ej"], ["contazi", "ct"], ["memorizi", "mz"]]) {
    assert.match(conta, new RegExp(`GAMEZI_JOGOS = \\[[^\\]]*"${jogo}"`));
    assert.match(conta, new RegExp(`${pre}:stats`));
    assert.match(ler("conta.html"), new RegExp(`${jogo}: \\{ nome:`));
    assert.match(ler("index.html"), new RegExp(`href="${jogo}/"`));
    assert.match(ler("ranking.html"), new RegExp(`id: "${jogo}"`));
    assert.match(ler(`${jogo}/js/app.js`), new RegExp(`prefixo: "${pre}"`));
    for (const tabela of ["salas", "sala_jogadores", "partidas", "diario"]) {
      assert.match(schema, new RegExp(`create table if not exists public\\.${jogo}_${tabela} `));
      assert.match(novo, new RegExp(`create table if not exists public\\.${jogo}_${tabela} `));
    }
    assert.match(schema, new RegExp(`${jogo}_registrar_diario[\\s\\S]*date '2026-10-23'`));
    assert.match(schema, new RegExp(`p_jogo not in \\([^)]*'${jogo}'`));
    assert.match(novo, new RegExp(`p_jogo not in \\([^)]*'${jogo}'`));
  }
  assert.match(schema, /array\['topzi'[^\]]*'memorizi'\] loop[\s\S]*_sair_da_sala/, "sair e assumir a sala");
  assert.match(falso, /KIT = \["emojizi", "contazi", "memorizi"\]/);
  assert.match(ler("package.json"), /jogos-novos-online\.e2e\.js/);
});
