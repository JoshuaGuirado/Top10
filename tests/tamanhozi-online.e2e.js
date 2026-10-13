// Teste de ponta a ponta do Tamanhozi online: duas abas (anfitrião e convidada) ajustando a mesma coisa em cada
// rodada; quem chega mais perto leva 1 ponto. Também confere a volta para a sala e o histórico da partida.
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

(async () => {
  await new Promise((r) => server.listen(0, r));
  const base = `http://localhost:${server.address().port}/tamanhozi/index.html`;
  const browser = await playwright.chromium.launch(fs.existsSync("/opt/pw-browsers/chromium") ? { executablePath: "/opt/pw-browsers/chromium" } : {});
  const ctx = await browser.newContext({ viewport: { width: 400, height: 860 }, serviceWorkers: "block", locale: "pt-BR" });
  await ctx.addInitScript(fs.readFileSync(path.join(__dirname, "supabase-falso.js"), "utf8"));
  await ctx.route("**/js/config.js", (r) => r.fulfill({ contentType: "application/javascript", body: 'const SUPABASE_URL = "https://falso.supabase.co"; const SUPABASE_ANON_KEY = "x";' }));
  const errors = [];
  const page = async () => {
    const p = await ctx.newPage();
    p.on("pageerror", (e) => errors.push(e.message));
    p.on("dialog", (d) => d.accept());
    return p;
  };
  const step = (name) => console.log("ok -", name);
  const screen = (p) => p.evaluate(() => document.body.dataset.screen);
  const db = (p) => p.evaluate(() => JSON.parse(localStorage.getItem("__fakedb") || "{}"));

  // Arthur cria a sala e escolhe o tema "Animais".
  const A = await page();
  await A.goto(base);
  await A.click("#online-btn");
  await A.fill("#online-nick", "Arthur");
  await A.click("#create-room-btn");
  await A.waitForSelector("#screen-lobby:not([hidden])");
  const code = (await A.textContent("#room-code")).trim();
  assert.match(code, /^[A-Z0-9]{5}$/);
  await A.click('#lobby-cats [data-cat="animais"]');
  await A.waitForFunction(() => JSON.parse(localStorage.getItem("__fakedb")).tamanhozi_salas[0].settings.categoria === "animais");
  step("anfitrião cria a sala " + code + " e escolhe o tema");

  // As abas dividem o localStorage; em celulares diferentes isso não acontece.
  await A.evaluate(() => {
    localStorage.removeItem("tm:sala");
    localStorage.setItem("tm:nick", JSON.stringify("Lara"));
  });
  const B = await page();
  await B.goto(`${base}?sala=${code}`);
  await B.waitForSelector("#screen-lobby:not([hidden])");
  await A.waitForFunction(() => document.querySelectorAll("#lobby-players .lobby-player").length === 2);
  assert.equal(await B.isHidden("#lobby-start"), true, "só o anfitrião começa");
  assert.equal(await B.isDisabled('#lobby-cats [data-cat="misto"]'), true, "só o anfitrião muda o tema");
  step("convidada entra pelo link de convite");

  await A.click("#lobby-start");
  await A.waitForSelector("#screen-game:not([hidden])");
  await B.waitForSelector("#screen-game:not([hidden])");
  const r0 = await A.evaluate(() => partida.rodadas[0]);
  assert.deepEqual(await B.evaluate(() => partida.rodadas[0]), r0, "a mesma coisa nas duas");
  assert.equal(await A.textContent("#game-round"), "Rodada 1/10");
  assert.ok(await A.evaluate(() => [tzItem(partida.rodadas[0].ref).cat, tzItem(partida.rodadas[0].alvo).cat].includes("animais")), "rodada do tema escolhido");
  step("partida começa nas duas abas com a mesma rodada");

  // Rodada 1: Lara ajusta bem perto do certo; Arthur, longe. Lara leva o ponto.
  await B.evaluate(() => mover(partida.rodadas[0].certo + 0.01));
  await B.click("#game-confirm");
  await A.waitForFunction(() => Object.keys(partida.respostas).length === 1);
  assert.equal(await B.isVisible("#sent"), true, "mostra que mandou");
  assert.equal(await A.isVisible("#game-confirm"), true, "Arthur ainda está ajustando");
  await A.evaluate(() => mover(partida.rodadas[0].certo + 0.3));
  await A.click("#game-confirm");
  await A.waitForSelector("#game-reveal:not([hidden])");
  await B.waitForSelector("#game-reveal:not([hidden])");
  assert.match(await B.textContent("#reveal"), /Mais perto: Lara/);
  assert.equal(await A.evaluate(() => partida.jogadores.find((j) => j.nome === "Lara").pontos), 1);
  assert.equal(await B.isHidden("#game-next"), true, "só o anfitrião segue");
  step("todo mundo respondeu: revela e quem chegou mais perto leva 1 ponto");

  // As outras rodadas: os dois respondem; o anfitrião segue até o fim.
  for (let i = 1; i < 10; i++) {
    await A.click("#game-next");
    await B.waitForFunction((n) => partida.atual === n && partida.fase === "ajuste", i);
    await A.evaluate(() => mover(partida.rodadas[partida.atual].certo));
    await A.click("#game-confirm");
    await B.evaluate(() => mover(partida.rodadas[partida.atual].certo + 0.2));
    await B.click("#game-confirm");
    await A.waitForSelector("#game-reveal:not([hidden])");
  }
  await A.click("#game-next");
  await A.waitForSelector("#screen-results:not([hidden])");
  await B.waitForSelector("#screen-results:not([hidden])");
  assert.equal(await A.textContent("#res-score"), "Arthur venceu!");
  assert.equal(await B.textContent("#res-score"), "Arthur venceu!");
  assert.equal(await A.locator("#res-ranking li").count(), 2);
  const hist = (await db(A)).tamanhozi_partidas;
  assert.equal(hist.length, 1, "partida no histórico");
  assert.equal(hist[0].players.find((p) => p.nick === "Arthur").pontos, 9);
  step("10 rodadas e o mesmo resultado nas duas: Arthur 9 × 1 Lara");

  // Voltar para a sala: o anfitrião leva todo mundo.
  await A.click("#res-again");
  await A.waitForSelector("#screen-lobby:not([hidden])");
  await B.waitForSelector("#screen-lobby:not([hidden])");
  step("volta todo mundo para a sala");

  // Tempo da rodada: quem não responde não segura a partida.
  await A.click("#lobby-start");
  await B.waitForSelector("#screen-game:not([hidden])");
  await A.evaluate(() => { partida.comecou -= TZ_ONLINE_SEGUNDOS * 1000; mover(partida.rodadas[0].certo); confirmar(); });
  await A.waitForSelector("#game-reveal:not([hidden])", { timeout: 5000 });
  await B.waitForSelector("#game-reveal:not([hidden])", { timeout: 5000 });
  assert.match(await B.textContent("#players"), /não respondeu/);
  step("acabou o tempo: revela com quem respondeu");

  assert.deepEqual(errors, []);
  console.log("\nTamanhozi online: tudo certo");
  await browser.close();
  server.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
