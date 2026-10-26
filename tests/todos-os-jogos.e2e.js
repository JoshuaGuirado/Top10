// Conferência geral dos 12 jogos do Gamezi: cada um abre sem erro, cria sala online com o visual do jogador
// (skin, avatar do Topzi ou pato do Patozi) e tem a aba no ranking do dia (ranking.html) mostrando quem jogou.
// Também confere o portal: todos os jogos aparecem e cabem sem rolagem para o lado no celular.
// Usa o Supabase falso de tests/supabase-falso.js. Rode com: npm run test:online
const http = require("http");
const fs = require("fs");
const path = require("path");
const assert = require("node:assert/strict");

const ROOT = path.join(__dirname, "..");
const playwright = (() => {
  try { return require("playwright"); } catch (e) { return require(path.join(require("child_process").execSync("npm root -g").toString().trim(), "playwright")); }
})();

const TYPES = { ".html": "text/html", ".js": "application/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".webmanifest": "application/manifest+json" };
const server = http.createServer((req, res) => {
  const file = path.join(ROOT, decodeURIComponent(req.url.split("?")[0]).replace(/\/$/, "/index.html"));
  if (!file.startsWith(ROOT) || !fs.existsSync(file)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});

// Coluna do visual de cada um na sala: o Topzi guarda o avatar; o Patozi, o pato; os outros, a skin.
const VISUAL = { topzi: "avatar", patozi: "pato" };
const SALA = { topzi: "room_code" };

(async () => {
  const conta = fs.readFileSync(path.join(ROOT, "gamezi-conta.js"), "utf8");
  const JOGOS = JSON.parse(conta.match(/GAMEZI_JOGOS = (\[[^\]]*\])/)[1]);
  assert.equal(JOGOS.length, 12);

  await new Promise((r) => server.listen(0, r));
  const base = `http://localhost:${server.address().port}/`;
  const browser = await playwright.chromium.launch(fs.existsSync("/opt/pw-browsers/chromium") ? { executablePath: "/opt/pw-browsers/chromium" } : {});
  const step = (name) => console.log("ok -", name);
  const errors = [];

  for (const jogo of JOGOS) {
    // Um contexto por jogo: cada um com o próprio banco falso (no localStorage) e o próprio login.
    const ctx = await browser.newContext({ viewport: { width: 400, height: 860 }, serviceWorkers: "block", locale: "pt-BR" });
    await ctx.addInitScript(fs.readFileSync(path.join(__dirname, "supabase-falso.js"), "utf8"));
    await ctx.route("**/js/config.js", (r) => r.fulfill({ contentType: "application/javascript", body: 'const SUPABASE_URL = "https://falso.supabase.co"; const SUPABASE_ANON_KEY = "x";' }));
    await ctx.route(/wikipedia|wikimedia|fonts\.|_vercel/, (r) => r.abort());
    const p = await ctx.newPage();
    p.on("pageerror", (e) => errors.push(jogo + ": " + e.message));
    p.on("dialog", (d) => d.accept());

    await p.goto(base + jogo + "/index.html");
    await p.evaluate(() => document.querySelectorAll("dialog[open]").forEach((d) => d.close())); // ajuda da primeira visita
    await p.click("#online-btn");
    await p.fill("#online-nick", "Lara");
    await p.click("#create-room-btn");
    await p.waitForSelector("#screen-lobby:not([hidden])");
    const code = (await p.textContent("#room-code")).trim();
    assert.match(code, /^[A-Z0-9]{5}$/, jogo + ": código da sala");
    await p.waitForFunction((t) => (JSON.parse(localStorage.getItem("__fakedb") || "{}")[t] || []).length === 1, jogo + "_sala_jogadores");
    const linha = await p.evaluate((t) => JSON.parse(localStorage.getItem("__fakedb"))[t][0], jogo + "_sala_jogadores");
    assert.equal(linha[SALA[jogo] || "sala_code"], code, jogo + ": entrou na própria sala");
    assert.equal(linha.nick, "Lara", jogo + ": nome na sala");
    const visual = linha[VISUAL[jogo] || "skin"];
    assert.ok(visual && typeof visual === "object", jogo + ": visual guardado na sala");
    // O pato sem roupa é {} e a cor dele fica na coluna cor; nos outros jogos a skin sempre tem algo.
    if (jogo === "patozi") assert.equal(typeof linha.cor, "number", "patozi: cor do pato");
    else assert.ok(Object.keys(visual).length, jogo + ": skin com as peças");
    assert.ok(await p.$eval("#lobby-players", (el) => !!el.querySelector("svg, img")), jogo + ": o visual aparece na lista da sala");
    step(`${jogo}: sala online ${code} com o visual do jogador`);

    // Ranking do dia do jogo no portal, com uma pessoa que já jogou hoje.
    const r = await ctx.newPage();
    r.on("pageerror", (e) => errors.push("ranking " + jogo + ": " + e.message));
    await r.goto(base + "ranking.html#" + jogo);
    const dia = await r.evaluate((id) => diaDe(JOGOS.filter((j) => j.id === id)[0]), jogo);
    assert.ok(dia >= 1, jogo + ": o desafio do dia já começou");
    await r.evaluate(([t, d]) => {
      const db = JSON.parse(localStorage.getItem("__fakedb") || "{}");
      db[t] = [{ dia: d, user_id: "outra", nick: "Joshua", pontos: 7, tempo_ms: 42000, created_at: new Date().toISOString() }];
      localStorage.setItem("__fakedb", JSON.stringify(db));
    }, [jogo + "_diario", dia]);
    await r.reload();
    await r.waitForFunction(() => document.querySelector("#lb") && /Joshua/.test(document.querySelector("#lb").textContent), null, { timeout: 8000 });
    assert.equal(await r.getAttribute(`[data-jogo="${jogo}"]`, "aria-selected"), "true", jogo + ": aba escolhida");
    step(`${jogo}: ranking do dia #${dia} no ranking.html`);
    await ctx.close();
  }

  // Portal: todos os jogos, sem rolagem para o lado, no celular pequeno e no computador.
  for (const [w, h] of [[320, 640], [390, 844], [1366, 768]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, serviceWorkers: "block", locale: "pt-BR" });
    const p = await ctx.newPage();
    p.on("pageerror", (e) => errors.push("portal: " + e.message));
    await ctx.route(/fonts\.|_vercel/, (r) => r.abort());
    await p.goto(base + "index.html");
    const r = await p.evaluate(() => ({
      jogos: [...document.querySelectorAll(".game-grid a.game-row")].map((a) => a.getAttribute("href").replace("/", "")),
      largura: document.documentElement.scrollWidth,
      dias: [...document.querySelectorAll(".game-daily")].filter((e) => !e.hidden && /#\d+/.test(e.textContent)).length,
      estouro: [...document.querySelectorAll(".game-row")].filter((a) => a.scrollWidth > a.clientWidth + 1).map((a) => a.textContent.trim().split(/\s+/)[0]),
    }));
    assert.deepEqual(r.jogos.slice().sort(), JOGOS.slice().sort(), "todos os jogos no portal");
    assert.equal(r.largura, w, `portal sem rolagem para o lado em ${w}px`);
    assert.equal(r.dias, 12, "número do desafio do dia de cada jogo");
    assert.deepEqual(r.estouro, [], `nenhum cartão estoura em ${w}px`);
    await ctx.close();
  }
  step("portal com os 12 jogos no celular e no computador");

  assert.deepEqual(errors, [], "sem erros de JavaScript");
  await browser.close();
  server.close();
  console.log("Todos os jogos: online com visual e ranking do dia funcionando.");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
