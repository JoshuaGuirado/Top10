// Patozi: cartas, regras da partida, computador e Pato do dia.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const PASTA = path.join(__dirname, "..", "patozi");
const SITE = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(PASTA, "index.html"), "utf8");
const scripts = [...html.matchAll(/<script src="([^"]+)"/g)].map((m) => m[1]);
const DADOS = scripts.filter((s) => s.startsWith("data/"));

function carregar(...arquivos) {
  const ctx = vm.createContext({ console });
  for (const f of arquivos) vm.runInContext(fs.readFileSync(path.join(PASTA, f), "utf8"), ctx, { filename: f });
  return (expr) => vm.runInContext(expr, ctx);
}

const r = carregar(...DADOS, "js/jogo.js");

test("os scripts da página existem e estão no modo offline", () => {
  const sw = fs.readFileSync(path.join(SITE, "sw.js"), "utf8");
  for (const s of scripts) {
    const noSite = path.posix.normalize("patozi/" + s);
    assert.ok(fs.existsSync(path.join(SITE, noSite)), `falta ${noSite}`);
    assert.ok(sw.includes(`"${noSite}"`), `sw.js não guarda ${noSite}`);
  }
});

test("cartas: ids únicos, tema válido, patos de 1 a 3, resposta inteira e pergunta nos 3 idiomas", () => {
  const cartas = r("PZ_CARTAS");
  const temas = new Set(r("PZ_TEMAS.map((t) => t.id)"));
  assert.ok(cartas.length >= 400, "pelo menos 400 cartas");
  assert.equal(new Set(cartas.map((c) => c.id)).size, cartas.length, "ids repetidos");
  for (const c of cartas) {
    assert.ok(temas.has(c.tema), `${c.id}: tema desconhecido`);
    assert.ok([1, 2, 3].includes(c.patos), `${c.id}: patos`);
    assert.ok(Number.isInteger(c.resposta) && c.resposta >= 1, `${c.id}: resposta`);
    assert.equal(c.q.length, 3, `${c.id}: idiomas`);
    c.q.forEach((q) => assert.ok(typeof q === "string" && q.length > 10 && q.trim().endsWith("?") || /\)$/.test(q.trim()), `${c.id}: pergunta "${q}"`));
    if (c.ano) assert.ok(c.resposta >= 100 && c.resposta <= 2100, `${c.id}: ano estranho`);
  }
  for (const t of temas) assert.ok(r(`pzCartasDosTemas(["${t}"]).length`) >= 15, `tema ${t} com poucas cartas ativas`);
});

test("cartas óbvias (aposentadas) existem, saem das partidas e, a partir do dia 2, do Pato do dia", () => {
  const aposentadas = r("[...PZ_APOSENTADAS]");
  assert.ok(aposentadas.length > 0);
  for (const id of aposentadas) assert.ok(r(`!!pzCarta("${id}")`), `aposentada ${id} não existe`);
  const ativas = new Set(r("pzCartasDosTemas([])"));
  for (const id of aposentadas) assert.ok(!ativas.has(id), `${id} ainda entra nas partidas`);
  for (let dia = 2; dia < 40; dia++) {
    for (const id of r(`pzDiarioCartas(${dia})`)) assert.ok(!r(`PZ_APOSENTADAS.has("${id}")`), `dia ${dia}: ${id} é óbvia`);
  }
  assert.equal(JSON.stringify(r("pzDiarioCartas(1)")), JSON.stringify(["futebol-20", "brasil-4", "esporte-19", "jogos-1", "corpo-23"]), "o Pato do dia 1 não muda");
});

test("partida guarda o visual do pato de cada um", () => {
  r(`var sv = pzNovaPartida({ jogadores: [{ id: "a", nome: "A", cor: 1, pato: { chapeu: "coroa" } }, { id: "b", nome: "B", cor: 2 }] }, pzRng(3));`);
  assert.equal(r("sv.jogadores[0].pato.chapeu"), "coroa");
  assert.equal(r("sv.jogadores[1].pato"), null);
  assert.equal(r("pzPlacar(sv).find((l) => l.id === 'a').pato.chapeu"), "coroa");
});

test("perguntas não se repetem", () => {
  const vistas = new Map();
  for (const c of r("PZ_CARTAS")) {
    const k = c.q[0].toLowerCase();
    assert.ok(!vistas.has(k), `pergunta repetida: ${c.id} e ${vistas.get(k)}`);
    vistas.set(k, c.id);
  }
});

test("partida: chutar, subir, duvidar e quem fica com a carta", () => {
  r(`
    var s = pzNovaPartida({ jogadores: [{ id: "a", nome: "A" }, { id: "b", nome: "B" }, { id: "c", nome: "C" }], temas: ["corpo"] }, pzRng(1));
    s.carta = "corpo-1"; s.vez = 0; // 206 ossos, 1 pato
  `);
  assert.equal(r('pzDuvidar(s, 0)'), "sem-chute");
  assert.equal(r("pzChutar(s, 1, 100)"), "vez");
  assert.equal(r("pzChutar(s, 0, 100)"), null);
  assert.equal(r("pzChutar(s, 1, 100)"), "baixo");
  assert.equal(r("pzChutar(s, 1, 150.5)"), "numero");
  assert.equal(r("pzChutar(s, 1, 190)"), null);
  assert.equal(r("s.jogadores[1].dobreis"), 0, "190 não é o dobro de 100");
  assert.equal(r("pzChutar(s, 2, 300)"), null);
  assert.equal(r("pzDuvidar(s, 0)"), null);
  assert.equal(r("s.resultado.passou"), true);
  assert.equal(r("s.resultado.perdedor"), 2, "quem chutou 300 fica com a carta");
  assert.equal(r("pzPatos(s.jogadores[2])"), 1);
  assert.equal(r("pzChutar(s, 1, 400)"), "fase");
  assert.equal(r("pzProxima(s, pzRng(2))"), null);
  assert.equal(r("s.vez"), 2, "quem ficou com a carta começa");
  assert.equal(r("s.rodada"), 2);

  r(`s.carta = "corpo-1"; pzChutar(s, 2, 200); pzDuvidar(s, 0);`);
  assert.equal(r("s.resultado.passou"), false);
  assert.equal(r("s.resultado.perdedor"), 0, "duvidou à toa, fica com a carta");
});

test("regras extras: dobrei dá escudo e na mosca dobra os patos", () => {
  r(`
    var s2 = pzNovaPartida({ jogadores: [{ id: "a", nome: "A" }, { id: "b", nome: "B" }], temas: ["corpo"] }, pzRng(3));
    s2.carta = "corpo-1"; s2.vez = 0;
    pzChutar(s2, 0, 100); pzChutar(s2, 1, 206); pzDuvidar(s2, 0);
  `);
  assert.equal(r("s2.jogadores[1].dobreis"), 1, "206 é mais que o dobro de 100");
  assert.equal(r("s2.resultado.mosca"), true);
  assert.equal(r("s2.resultado.perdedor"), 0);
  assert.equal(r("s2.resultado.patos"), 2, "1 pato em dobro");
  assert.equal(r("pzPatos(s2.jogadores[1])"), 0, "escudo não deixa ficar negativo");

  r(`
    var s3 = pzNovaPartida({ jogadores: [{ id: "a", nome: "A" }, { id: "b", nome: "B" }], temas: ["corpo"], dobrei: false, mosca: false }, pzRng(3));
    s3.carta = "corpo-1"; s3.vez = 0;
    pzChutar(s3, 0, 100); pzChutar(s3, 1, 206); pzDuvidar(s3, 0);
  `);
  assert.equal(r("s3.jogadores[1].dobreis"), 0);
  assert.equal(r("s3.resultado.patos"), 1);
});

test("fim de jogo e placar: mais patos perde", () => {
  r(`
    var s4 = pzNovaPartida({ jogadores: [{ id: "a", nome: "A" }, { id: "b", nome: "B" }, { id: "c", nome: "C" }], duracao: "rapida" }, pzRng(5));
  `);
  assert.equal(r("s4.config.meta"), 3);
  r(`
    for (let k = 0; k < 3; k++) { s4.vez = 0; pzChutar(s4, 0, 1e11); pzDuvidar(s4, 1); if (!s4.fim) pzProxima(s4); }
  `);
  assert.equal(r("s4.fim"), true);
  assert.equal(r("pzProxima(s4)"), "fase");
  const placar = r("pzPlacar(s4)");
  assert.equal(placar[placar.length - 1].id, "a");
  assert.equal(placar.filter((l) => l.perdeu).length, 1);
  assert.equal(r("pzMeta(2)"), 5);
  assert.equal(r("pzMeta(10, 'longa')"), 5);
});

test("o baralho não acaba: as cartas usadas voltam embaralhadas", () => {
  r(`var s5 = pzNovaPartida({ jogadores: [{ id: "a", nome: "A" }, { id: "b", nome: "B" }], temas: ["comida"] }, pzRng(9));`);
  const n = r("PZ_CARTAS.filter((c) => c.tema === 'comida').length");
  r(`for (let k = 0; k < ${n * 2 + 3}; k++) { s5.fase = "revelado"; s5.fim = false; s5.resultado = { perdedor: 0 }; pzProxima(s5); }`);
  assert.ok(r("pzCarta(s5.carta).tema === 'comida'"));
});

test("computador: sempre faz uma jogada válida e as partidas terminam", () => {
  const res = r(`
    (() => {
      const rnd = pzRng(42);
      let rodadas = 0;
      for (let g = 0; g < 60; g++) {
        const s = pzNovaPartida({ jogadores: [1, 2, 3, 4].map((i) => ({ id: "b" + i, nome: "B" + i, bot: true })) }, rnd);
        let guarda = 0;
        while (!s.fim && guarda++ < 200) {
          const cabecas = s.jogadores.map(() => pzBotPalpite(pzCarta(s.carta), rnd));
          let lances = 0;
          while (s.fase === "lance") {
            const a = pzBotJogada(s, cabecas[s.vez], rnd);
            const e = a.tipo === "duvidar" ? pzDuvidar(s, s.vez) : pzChutar(s, s.vez, a.valor);
            if (e) return "erro " + e + " " + JSON.stringify(a);
            if (++lances > 400) return "rodada sem fim";
          }
          rodadas++;
          if (!s.fim) pzProxima(s, rnd);
        }
        if (!s.fim) return "partida sem fim";
      }
      return rodadas;
    })()
  `);
  assert.equal(typeof res, "number", res);
});

test("Pato do dia: 5 cartas sem ano, iguais para todos no mesmo dia e diferentes no dia seguinte", () => {
  const d1 = r("pzDiarioCartas(1)");
  assert.equal(d1.length, 5);
  assert.deepEqual(r("pzDiarioCartas(1)"), d1);
  assert.notDeepEqual(r("pzDiarioCartas(2)"), d1);
  for (const id of d1) assert.equal(r(`pzCarta("${id}").ano`), false);
  assert.equal(r("pzDiaNumero(new Date(2026, 9, 8))"), 1);
  assert.equal(r("pzDiaNumero(new Date(2026, 9, 9))"), 2);
  assert.equal(r("pzDiarioPontos(206, 206)"), 100);
  assert.equal(r("pzDiarioPontos(103, 206)"), 50);
  assert.equal(r("pzDiarioPontos(207, 206)"), 0);
});

test("Pato do dia: cartas novas não mudam o desafio de dias que já passaram", () => {
  const pools = r("PZ_DIARIO_POOLS");
  const total = r("PZ_CARTAS.length");
  assert.ok(pools.length >= 1);
  assert.equal(pools[0].desde, 1);
  for (let i = 1; i < pools.length; i++) {
    assert.ok(pools[i].desde > pools[i - 1].desde, "linhas em ordem de dia");
    assert.ok(pools[i].cartas >= pools[i - 1].cartas);
  }
  assert.equal(pools[pools.length - 1].cartas, total, "a última linha de PZ_DIARIO_POOLS precisa contar todas as cartas");
});

test("textos: toda chave tem português, inglês e espanhol", () => {
  const t = carregar("js/textos.js")("PZ_T");
  for (const [k, v] of Object.entries(t)) {
    assert.equal(v.length, 3, k);
    v.forEach((s) => assert.ok(typeof s === "string" && s.length, k));
  }
});
