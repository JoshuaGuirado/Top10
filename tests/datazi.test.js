// Datazi: acontecimentos, regras da linha do tempo e Datazi do dia.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const PASTA = path.join(__dirname, "..", "datazi");
const SITE = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(PASTA, "index.html"), "utf8");
const scripts = [...html.matchAll(/<script src="([^"]+)"/g)].map((m) => m[1]);

const ctx = vm.createContext({ console });
for (const f of ["data/eventos.js", "js/jogo.js"]) vm.runInContext(fs.readFileSync(path.join(PASTA, f), "utf8"), ctx);
const r = (e) => vm.runInContext(e, ctx);

test("os scripts da página existem e estão no modo offline", () => {
  const sw = fs.readFileSync(path.join(SITE, "sw.js"), "utf8");
  for (const s of scripts) {
    const noSite = path.posix.normalize("datazi/" + s);
    assert.ok(fs.existsSync(path.join(SITE, noSite)), `falta ${noSite}`);
    assert.ok(sw.includes(`"${noSite}"`), `sw.js não guarda ${noSite}`);
  }
});

test("acontecimentos: ano inteiro, texto nos 3 idiomas e sem repetir", () => {
  const ev = r("DZ_EVENTOS");
  assert.ok(ev.length >= 100);
  const vistos = new Set();
  for (const e of ev) {
    assert.ok(Number.isInteger(e.ano) && e.ano > 0 && e.ano <= 2026, `${e.id}: ano`);
    assert.equal(e.txt.length, 3, `${e.id}: idiomas`);
    e.txt.forEach((t) => assert.ok(typeof t === "string" && t.length > 5, `${e.id}: texto`));
    assert.ok(!vistos.has(e.txt[0]), `repetido: ${e.txt[0]}`);
    vistos.add(e.txt[0]);
  }
  const pools = r("DZ_DIARIO_POOLS");
  assert.equal(pools[pools.length - 1].eventos, ev.length, "a última linha de DZ_DIARIO_POOLS precisa contar todos os acontecimentos");
});

test("linha do tempo: lugar certo, errado e fim", () => {
  // e1 = 1500, e2 = 1822, e3 = 1888, e5 = 1492
  r('var s = dzNovaPartida(["e2", "e1", "e3", "e5"], 2);');
  assert.equal(r("s.atual"), "e1");
  assert.equal(r("dzColocar(s, 0).certo"), true, "1500 antes de 1822");
  assert.deepEqual([...r("s.linha")], ["e1", "e2"]);
  assert.equal(r("dzColocar(s, 0).certo"), false, "1888 não vem antes de 1500");
  assert.deepEqual([...r("s.linha")], ["e1", "e2", "e3"], "o errado vai para o lugar certo");
  assert.equal(r("s.vidas"), 1);
  assert.equal(r("dzColocar(s, 3).certo"), false, "1492 não vem depois de 1888");
  assert.equal(r("s.fim"), true, "acabaram as vidas");
  assert.equal(r("s.acertos"), 1);
  assert.equal(r("dzColocar(s, 0)"), null, "depois do fim, nada muda");
});

test("vidas: 2 na partida livre e no Datazi do dia a partir do dia 7 (antes eram 3)", () => {
  assert.equal(r("dzNovaPartida(['e1', 'e2']).vidas"), 2);
  assert.equal(r("dzVidasDoDia(6)"), 3, "dias antigos não mudam");
  assert.equal(r("dzVidasDoDia(7)"), 2);
  assert.equal(r("dzNovaPartida(['e1', 'e2'], dzVidasDoDia(1)).vidasMax"), 3);
});

test("Datazi do dia: igual para todo mundo, anos diferentes e o dia 1 não muda", () => {
  const d1 = r("dzDiarioEventos(1)");
  assert.equal(d1.length, r("DZ_DIARIO_QTD") + 1);
  assert.equal(JSON.stringify(r("dzDiarioEventos(1)")), JSON.stringify(d1), "mesmo dia, mesmos acontecimentos");
  assert.equal(new Set(d1.map((id) => r(`dzEvento("${id}").ano`))).size, d1.length, "sem anos repetidos");
  assert.notEqual(JSON.stringify(r("dzDiarioEventos(2)")), JSON.stringify(d1));
  assert.equal(r("dzDiaNumero(new Date(2026, 9, 8))"), 1);
  assert.equal(JSON.stringify(d1), JSON.stringify(["e97","e66","e42","e65","e13","e26","e109","e106","e3"]), "o Datazi do dia 1 não pode mudar");
});

test("Qual veio antes?: pares perto um do outro, sem repetir, e até errar 2 vezes", () => {
  const pares = r("dzSortearPares(200)");
  assert.ok(pares.length >= 40, "dá para jogar bastante");
  const vistos = new Set();
  for (const [a, b] of pares) {
    const [x, y] = [r(`dzEvento("${a}").ano`), r(`dzEvento("${b}").ano`)];
    assert.notEqual(x, y, "anos diferentes");
    assert.ok(Math.abs(x - y) <= r("DZ_PAR_DISTANCIA"), "perto um do outro");
    assert.ok(!vistos.has(a) && !vistos.has(b), "sem repetir");
    vistos.add(a).add(b);
  }
  // e1 = 1500, e2 = 1822, e3 = 1888, e5 = 1492
  r('var p = dzNovaRodadas("antes", [["e1", "e2"], ["e3", "e2"], ["e1", "e5"], ["e2", "e3"]]);');
  assert.equal(r("p.vidas"), 2);
  assert.equal(r("dzResponder(p, 0).certo"), true, "1500 veio antes de 1822");
  assert.equal(r("dzResponder(p, 1)"), null, "uma resposta por rodada");
  assert.equal(r("dzProxima(p)"), false);
  assert.equal(r("dzResponder(p, 0).certo"), false, "1888 não veio antes de 1822");
  r("dzProxima(p)");
  assert.equal(r("dzResponder(p, 0).certo"), false);
  assert.equal(r("dzProxima(p)"), true, "dois erros, acabou");
  assert.equal(r("p.acertos"), 1);
});

test("Em que ano?: pontos pela distância e 10 rodadas", () => {
  const pts = (d) => r(`dzPontosAno(${1950 + d}, 1950)`);
  assert.deepEqual([0, 1, 2, 3, 5, 6, 10, 11, 25, 26, -26].map(pts), [10, 7, 7, 5, 5, 3, 3, 1, 1, 0, 0]);
  const ids = r('dzLivreRodadas("ano")');
  assert.equal(ids.length, r("DZ_RODADAS"));
  r(`var a = dzNovaRodadas("ano", ${JSON.stringify(ids)});`);
  assert.equal(r("a.vidasMax"), 0, "sem vidas");
  for (let i = 0; i < ids.length; i++) {
    r(`dzResponder(a, i % 2 ? 0 : dzEvento(a.rodadas[a.atual]).ano)`.replace("i % 2", String(i % 2)));
    assert.equal(r("dzProxima(a)"), i === ids.length - 1);
  }
  assert.equal(r("a.pontos"), 50, "5 em cheio, 5 que não valem nada (ano 0 não vale)");
  assert.equal(r("a.acertos"), 5);
});

test("online: todo mundo responde a mesma rodada e cada um leva os seus pontos", () => {
  const jog = '[{ id: "a", nome: "Ana" }, { id: "b", nome: "Beto" }]';
  // Linha do tempo: o acontecimento vai para o lugar certo e quem acertou leva 1 ponto.
  r(`var o = dzNovaOnline({ jogadores: ${jog}, tipo: "linha", rnd: dzRng(5) });`);
  assert.equal(r("o.rodadas.length"), r("DZ_RODADAS"));
  assert.equal(r("o.linha.length"), 1);
  const certo = r("dzLugarCerto(o, o.rodadas[0])");
  assert.equal(r(`dzOnlineResponder(o, "a", ${certo})`), true);
  assert.equal(r(`dzOnlineResponder(o, "a", ${1 - certo})`), false, "só a primeira vale");
  assert.equal(r('dzOnlineResponder(o, "x", 0)'), false, "quem não está na partida não responde");
  assert.equal(r('dzOnlineResponder(o, "b", 5)'), false, "posição que não existe");
  assert.equal(r('dzOnlineTodos(o, ["a", "b"])'), false);
  r(`dzOnlineResponder(o, "b", ${1 - certo})`);
  assert.equal(r('dzOnlineTodos(o, ["a", "b"])'), true);
  r("dzOnlineRevelar(o)");
  assert.deepEqual({ ...r("o.ganhos") }, { a: 1, b: 0 });
  assert.equal(r("o.linha.length"), 2, "entrou na linha");
  assert.equal(r("dzOnlineResponder(o, 'b', 0)"), false, "depois de revelar, não responde mais");
  assert.equal(r("dzOnlineProxima(o)"), false);
  assert.equal(r("o.fase"), "jogando");

  // Qual veio antes?: 1 ponto para quem acertou; quem não respondeu não pontua.
  r(`var q = dzNovaOnline({ jogadores: ${jog}, tipo: "antes", rnd: dzRng(9) });`);
  assert.equal(r("q.rodadas.length"), r("DZ_RODADAS"));
  r('dzOnlineResponder(q, "b", dzMaisAntigo(q.rodadas[0]))');
  r("dzOnlineRevelar(q)");
  assert.deepEqual({ ...r("q.ganhos") }, { b: 1 });

  // Em que ano?: os pontos da distância; até o fim e o placar.
  r(`var y = dzNovaOnline({ jogadores: ${jog}, tipo: "ano", rnd: dzRng(3) });`);
  for (let i = 0; i < r("DZ_RODADAS"); i++) {
    r('dzOnlineResponder(y, "a", dzEvento(y.rodadas[y.atual]).ano)');
    r('dzOnlineResponder(y, "b", dzEvento(y.rodadas[y.atual]).ano + 3)');
    r("dzOnlineRevelar(y)");
    assert.equal(r("dzOnlineProxima(y)"), i === r("DZ_RODADAS") - 1);
  }
  assert.equal(JSON.stringify(r("dzPlacar(y)").map((j) => [j.nome, j.pontos, j.pos])), '[["Ana",100,1],["Beto",50,2]]');
  assert.equal(r('dzOnlineResponder(y, "a", 0)'), false, "acabou");
});

test("Datazi online está no banco, no Supabase falso e nos testes", () => {
  const schema = fs.readFileSync(path.join(SITE, "supabase", "schema.sql"), "utf8");
  for (const tabela of ["datazi_salas", "datazi_sala_jogadores", "datazi_partidas"]) assert.match(schema, new RegExp(`create table if not exists public\\.${tabela}`));
  assert.match(schema, /array\[[^\]]*'datazi'[^\]]*\] loop[\s\S]*_sair_da_sala/, "sair e assumir a sala");
  const novo = fs.readFileSync(path.join(SITE, "supabase", "online-novo.sql"), "utf8");
  assert.match(novo, /create table if not exists public\.datazi_salas/);
  assert.match(fs.readFileSync(path.join(__dirname, "supabase-falso.js"), "utf8"), /datazi_salas/);
  assert.match(fs.readFileSync(path.join(SITE, "package.json"), "utf8"), /datazi-online\.e2e\.js/);
});
