// Fotozi, Censurazi e Corzi (jogos do kit): dados, regras, desafio do dia fixo e integração com o Gamezi.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const SITE = path.join(__dirname, "..");
const ler = (f) => fs.readFileSync(path.join(SITE, f), "utf8");
const JOGOS = {
  fotozi: ["js/jogo.js", "data/fotos-1.js", "data/fotos-2.js", "data/fotos-3.js", "data/fotos-4.js", "data/fotos-5.js", "data/fotos-6.js", "data/focos.js"],
  censurazi: ["js/jogo.js", "data/cartas-1.js", "data/cartas-2.js", "data/cartas-3.js", "data/cartas-4.js"],
  corzi: ["js/jogo.js"],
};

function contexto(jogo) {
  const ctx = vm.createContext({ console });
  vm.runInContext(ler("gamezi-rodadas.js"), ctx);
  for (const f of JOGOS[jogo]) vm.runInContext(ler(`${jogo}/${f}`), ctx);
  return (e) => vm.runInContext(e, ctx);
}
const json = (x) => JSON.parse(JSON.stringify(x));

test("os scripts e as marcas existem e estão no modo offline", () => {
  const sw = ler("sw.js");
  for (const jogo of Object.keys(JOGOS)) {
    const scripts = [...ler(`${jogo}/index.html`).matchAll(/<script src="([^"]+)"/g)].map((m) => m[1]);
    assert.ok(scripts.includes("../gamezi-kit.js") && scripts.includes("../gamezi-skins.js") && scripts.includes("../gamezi-musica.js"), jogo);
    for (const f of JOGOS[jogo]) assert.ok(scripts.includes(f), `${jogo}: ${f} na página`);
    for (const s of scripts.concat(["style.css"])) {
      const noSite = path.posix.normalize(`${jogo}/${s}`);
      assert.ok(fs.existsSync(path.join(SITE, noSite)), `falta ${noSite}`);
      assert.ok(sw.includes(`"${noSite}"`), `sw.js não guarda ${noSite}`);
    }
    for (const b of ["logo", "logo-dark", "simbolo", "simbolo-escuro"]) assert.ok(sw.includes(`"brand/${jogo}-${b}.svg"`) && fs.existsSync(path.join(SITE, `brand/${jogo}-${b}.svg`)), `${jogo}: brand ${b}`);
  }
});

test("Corzi: 4 alternativas com as duas que confundem, cada vez mais difícil, e o dia 1 fixo", () => {
  const r = contexto("corzi");
  for (let i = 0; i < 400; i++) {
    const x = r(`czrRodada(${i % 25}, Math.random, ["misto", "cor", "palavra"][${i % 3}])`);
    assert.equal(new Set(x.opcoes).size, 4);
    for (const k of [x.tinta, x.palavra, x.resposta]) assert.ok(x.opcoes.includes(k));
    assert.equal(x.resposta, x.tipo === "cor" ? x.tinta : x.palavra);
    if (i % 3 === 1) assert.equal(x.tipo, "cor");
    if (i % 3 === 2) assert.equal(x.tipo, "palavra");
    if (x.pinturas) x.pinturas.forEach((p, k) => assert.notEqual(p, x.opcoes[k], "a alternativa nunca vem pintada da própria cor"));
  }
  assert.ok(r("czrNivel(0).segundos") > r("czrNivel(20).segundos"), "menos tempo mais adiante");
  assert.equal(r("czrNivel(0).pintadas"), false);
  assert.equal(r("czrNivel(6).pintadas"), true);
  assert.equal(r("czrOnline('misto', 20).length"), 20, "o anfitrião escolhe as rodadas");
  assert.equal(r("czrOnline('misto', 7).length"), 10, "quantidade fora da lista vira 10");
  assert.deepEqual(json(r("czrAvaliar({ resposta: 2, seg: 5 }, 2, 0)")), { certo: true, pontos: 100 });
  assert.equal(r("czrAvaliar({ resposta: 2, seg: 5 }, 3, 0).pontos"), 0);
  assert.equal(r("czrValida({ opcoes: [1, 2, 3, 4] }, 5)"), false);
  assert.equal(JSON.stringify(r("czrDiario(1).map((x) => [x.tipo, x.palavra, x.tinta, x.resposta])")),
    JSON.stringify([["palavra",1,7,1],["palavra",7,1,7],["cor",0,4,4],["palavra",3,7,3],["cor",3,5,5],["cor",4,6,6],["cor",7,0,0],["palavra",6,3,6],["cor",6,0,0],["cor",5,4,4]]), "o Corzi do dia 1 não pode mudar");
});

test("Censurazi: cartas com 5 proibidas nos 3 idiomas, sem repetir e sem entregar a palavra", () => {
  const r = contexto("censurazi");
  const cartas = r("CS_CARTAS");
  assert.ok(cartas.length >= 500);
  const pools = r("CS_DIARIO_POOLS");
  assert.equal(pools[pools.length - 1].cartas, cartas.length, "a última linha de CS_DIARIO_POOLS precisa contar todas as cartas");
  const norm = (s) => r(`csNormal(${JSON.stringify(s)})`);
  for (const l of ["pt", "en", "es"]) {
    const vistas = new Set();
    for (const c of cartas) {
      const txt = c.txt[l];
      assert.equal(txt.length, 6, `${c.id} ${l}: palavra e 5 proibidas`);
      txt.forEach((x) => assert.ok(x.trim().length > 1, `${c.id} ${l}: vazio`));
      for (const p of txt.slice(1)) assert.notEqual(norm(p), norm(txt[0]), `${c.id} ${l}: proibida igual à palavra`);
      // A dica não pode entregar a palavra ("taxímetro" para Táxi, "snowman" para Snow).
      if (norm(txt[0]).length >= 4) for (const p of txt.slice(1)) assert.ok(!norm(p).includes(norm(txt[0])), `${c.id} ${l}: "${p}" entrega "${txt[0]}"`);
      assert.equal(new Set(txt.slice(1).map(norm)).size, 5, `${c.id} ${l}: dica repetida`);
      assert.ok(!/[()]/.test(txt[0]), `${c.id} ${l}: palavra com parênteses é ruim de digitar`);
      assert.ok(!vistas.has(norm(txt[0])), `repetida em ${l}: ${txt[0]}`);
      vistas.add(norm(txt[0]));
    }
  }
  for (const tema of r("CS_TEMAS")) assert.ok(r(`csDoTema("${tema}").length`) >= 20, tema);
});

test("Censurazi: chute com acento, plural, outro idioma e errinho; pontos pelas dicas; dia 1 fixo", () => {
  const r = contexto("censurazi");
  r('var gel = CS_CARTAS.find((c) => c.txt.pt[0] === "Geladeira");');
  for (const g of ["geladeira", "GELADEIRA", "geladeiras", "fridge", "nevera", "geladera"]) assert.equal(r(`csAcertou(gel, ${JSON.stringify(g)})`), true, g);
  for (const g of ["", "gelo", "cozinha", "porta"]) assert.equal(r(`csAcertou(gel, ${JSON.stringify(g)})`), false, g);
  r('var rd = { id: gel.id };');
  assert.deepEqual(json(r('csAvaliar(rd, { g: "Geladeira", n: 0 })')), { certo: true, pontos: 100 });
  assert.equal(r('csAvaliar(rd, { g: "Geladeira", n: 5 }).pontos'), 40);
  assert.equal(r('csAvaliar(rd, { g: "", n: 0 }).certo'), false, "desistiu");
  assert.equal(r('csValida(rd, { g: "x", n: 9 })'), false);
  assert.equal(r("CS_PONTOS.every((p, i, a) => !i || a[i - 1] - p === 12)"), true, "cada dica tira só um pouco");
  assert.deepEqual(json(r("csDiario(1).map((x) => x.id)")), ["c104","c228","c35","c152","c176","c107","c180","c117","c232","c140"], "o Censurazi do dia 1 não pode mudar");
});

test("Censurazi na mesa: acertou +1, pulou 0, proibida −1, vez dos times e fim", () => {
  const r = contexto("censurazi");
  r('var m = csMesaNova({ times: ["A", "B"], turnos: 2, rnd: gzRng(3) }); csMesaProxCarta(m);');
  r('csMesaMarcar(m, "acertou"); csMesaMarcar(m, "acertou"); csMesaMarcar(m, "pulou"); csMesaMarcar(m, "proibida");');
  assert.equal(r("m.times[0].pontos"), 1);
  assert.equal(r("m.feitas.length"), 4);
  assert.equal(r("csMesaFimDoTurno(m)"), false);
  assert.equal(r("m.vez"), 1);
  r('csMesaProxCarta(m); csMesaMarcar(m, "acertou");');
  assert.equal(r("m.times[1].pontos"), 1);
  assert.equal(r("csMesaFimDoTurno(m)"), false);
  assert.equal(r("m.turno"), 1);
  assert.equal(r("csMesaFimDoTurno(m)"), false);
  assert.equal(r("csMesaFimDoTurno(m)"), true, "cada time jogou 2 vezes");
  assert.equal(r('csMesaMarcar(m, "x")'), false);
});

test("Fotozi: muitas fotos em vários temas, nomes nos 3 idiomas e reservas do mesmo tema", () => {
  const r = contexto("fotozi");
  const fotos = r("FZ_FOTOS");
  assert.ok(fotos.length >= 400, `${fotos.length} fotos`);
  const pools = r("FZ_DIARIO_POOLS");
  assert.equal(pools[pools.length - 1].fotos, fotos.length, "a última linha de FZ_DIARIO_POOLS precisa contar todas as fotos");
  const titulos = new Set();
  for (const f of fotos) {
    assert.ok(!titulos.has(f.titulo), `repetida: ${f.titulo}`);
    titulos.add(f.titulo);
    assert.equal(f.nome.length, 3);
    f.nome.forEach((n) => assert.ok(n && n.length > 1, f.id));
    assert.ok(r(`fzAcertou(fzFoto("${f.id}"), ${JSON.stringify(f.nome[0])})`), `${f.id}: o próprio nome vale`);
  }
  for (const tema of r("FZ_TEMAS")) assert.ok(r(`fzDoTema("${tema}").length`) >= 20, tema);
  assert.ok(r("FZ_TEMAS").length >= 19, "muitos temas");
  assert.ok(fotos.length >= 800, "muitas fotos");
  for (const x of r("fzOnline('animais', 15, gzRng(9))")) {
    assert.equal(x.ids.length, 3);
    assert.ok(x.ids.every((id) => r(`fzFoto("${id}").tema`) === "animais"), "reservas do mesmo tema");
  }
  assert.equal(r("fzOnline('tudo', 5).length"), 5);
  for (const f of fotos.slice(0, 60)) {
    const foco = r(`fzFoco(fzFoto("${f.id}"))`);
    assert.ok(foco.x >= 30 && foco.x <= 70 && foco.y >= 20 && foco.y <= 72, f.id);
  }
});

test("Fotozi: poucas etapas de zoom, cada erro afasta bastante; chute com apelido e errinho; dia 1 fixo", () => {
  const r = contexto("fotozi");
  const zoom = r("FZ_ZOOM");
  const pontos = r("FZ_PONTOS");
  assert.equal(zoom.length, pontos.length);
  assert.equal(zoom[zoom.length - 1], 1, "no fim a foto aparece inteira");
  assert.ok(zoom.length <= 5, "poucas etapas (o dono pediu)");
  zoom.forEach((z, i) => i && assert.ok(z < zoom[i - 1] && zoom[i - 1] / z >= 1.3, "cada erro afasta bastante"));
  pontos.forEach((p, i) => i && assert.equal(pontos[i - 1] - p, 20, "perde 20 por erro"));
  r('var cr7 = FZ_FOTOS.find((f) => f.titulo === "Cristiano Ronaldo");');
  for (const g of ["Cristiano Ronaldo", "cristiano ronaldo", "CR7", "cristiano", "Cristiano Ronalod"]) assert.equal(r(`fzAcertou(cr7, ${JSON.stringify(g)})`), true, g);
  for (const g of ["Ronaldo", "Messi", ""]) assert.equal(r(`fzAcertou(cr7, ${JSON.stringify(g)})`), false, g);
  r('var rd = fzRodada(cr7, gzRng(1));');
  assert.deepEqual(json(r('fzAvaliar(rd, { id: cr7.id, g: "cr7", n: 0 })')), { certo: true, pontos: 100 });
  assert.equal(r('fzAvaliar(rd, { id: cr7.id, g: "cr7", n: 4 }).pontos'), 20);
  assert.equal(r('fzAvaliar(rd, { id: "f9999", g: "cr7", n: 0 }).certo'), false, "foto que não é da rodada");
  assert.equal(r('fzAvaliar(rd, { id: cr7.id, g: "", n: 0 }).certo'), false, "desistiu");
  assert.deepEqual(json(r("fzDiario(1).map((x) => x.ids[0])")), ["f81","f70","f174","f229","f368","f144","f247","f68","f380","f207"], "o Fotozi do dia 1 não pode mudar");
});

test("Fotozi, Censurazi e Corzi estão no Gamezi: portal, conta, ranking, banco e testes", () => {
  const conta = ler("gamezi-conta.js");
  const schema = ler("supabase/schema.sql");
  const falso = ler("tests/supabase-falso.js");
  for (const [jogo, pre] of [["fotozi", "fz"], ["censurazi", "cs"], ["corzi", "cr"]]) {
    assert.match(conta, new RegExp(`GAMEZI_JOGOS = \\[[^\\]]*"${jogo}"`));
    assert.match(conta, new RegExp(`${pre}:stats`));
    assert.match(conta, new RegExp(`var novos = \\[[^\\]]*"${jogo}"`), "conta no nível");
    assert.match(ler("conta.html"), new RegExp(`${jogo}: \\{ nome:`));
    assert.match(ler("index.html"), new RegExp(`href="${jogo}/"`));
    assert.match(ler("ranking.html"), new RegExp(`id: "${jogo}"[^\\n]*Date\\.UTC\\(2026, 9, 26\\)`));
    assert.match(ler(`${jogo}/js/app.js`), new RegExp(`prefixo: "${pre}"`));
    assert.match(ler("sw.js"), new RegExp(`"${jogo}"\\]\\.find|"${jogo}", `), "página offline");
    for (const tabela of ["salas", "sala_jogadores", "partidas", "diario"]) assert.match(schema, new RegExp(`create table if not exists public\\.${jogo}_${tabela} `));
    assert.match(schema, new RegExp(`${jogo}_registrar_diario[\\s\\S]*?date '2026-10-26'`));
    assert.match(schema, new RegExp(`p_jogo not in \\([^)]*'${jogo}'`));
    assert.match(falso, new RegExp(`KIT = \\[[^\\]]*"${jogo}"`));
  }
  assert.match(schema, /array\['topzi'[^\]]*'corzi'\] loop[\s\S]*_sair_da_sala/, "sair e assumir a sala");
});

test("o banco é um script só (schema.sql, que roda de novo) e o ranking do dia aceita todos os jogos", () => {
  // Os scripts parciais (online-novo, jogos-novos…) repetiam partes do schema.sql e um antigo desfazia o novo.
  assert.deepEqual(fs.readdirSync(path.join(SITE, "supabase")).filter((a) => a.endsWith(".sql")).sort(), ["patozi-respostas.sql", "schema.sql"]);
  assert.match(ler(".github/workflows/testes.yml"), /tests\/banco\.sh/, "o GitHub roda o schema.sql num Postgres de verdade");
  const jogos = JSON.parse(ler("gamezi-conta.js").match(/GAMEZI_JOGOS = (\[[^\]]*\])/)[1]);
  for (const arq of fs.readdirSync(path.join(SITE, "supabase")).filter((a) => a.endsWith(".sql"))) {
    const sql = ler(`supabase/${arq}`);
    if (!/function public\.gamezi_ranking_dia/.test(sql)) continue;
    const lista = sql.match(/p_jogo not in \(([^)]*)\)/)[1];
    for (const jogo of jogos) assert.match(lista, new RegExp(`'${jogo}'`), `${arq}: falta ${jogo}`);
  }
});
