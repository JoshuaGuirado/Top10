// Teste de ponta a ponta do Maiorzi online: duas abas (anfitrião e convidada), cada uma com a sua skin, respondendo
// a mesma comparação. Confere os pontos, o tempo da rodada, o placar com as skins, o histórico e a volta para a sala.
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
  const base = `http://localhost:${server.address().port}/maisoumenozi/index.html`;
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
  const db = (p) => p.evaluate(() => JSON.parse(localStorage.getItem("__fakedb") || "{}"));
  const revelou = (p) => p.waitForFunction(() => partida && partida.online && partida.fase === "revelado");
  // Botão certo da rodada da vez.
  const certo = (p) => p.evaluate(() => {
    const r = partida.rodadas[partida.n];
    const [va, vb] = mmValores(r);
    return r.uau ? (vb > va ? "#uau-b" : "#uau-a") : vb > va ? "#btn-up" : "#btn-down";
  });
  const errado = { "#uau-a": "#uau-b", "#uau-b": "#uau-a", "#btn-up": "#btn-down", "#btn-down": "#btn-up" };

  // Arthur escolhe a skin e cria a sala.
  const A = await page();
  await A.goto(base);
  await A.click("#online-btn");
  await A.click("#online-skin");
  await A.click('#gz-skin-dialog .gz-skin-aba >> nth=1');
  const skinA = await A.getAttribute("#gz-skin-dialog .gz-skin-item >> nth=0", "data-skin");
  await A.click("#gz-skin-dialog .gz-skin-item >> nth=0");
  assert.equal(await A.evaluate(() => gameziMinhaSkin().presetId), skinA);
  await A.fill("#online-nick", "Arthur");
  await A.click("#create-room-btn");
  await A.waitForSelector("#screen-lobby:not([hidden])");
  const code = (await A.textContent("#room-code")).trim();
  assert.equal((await db(A)).maisoumenozi_sala_jogadores[0].skin.presetId, skinA, "a skin vai para a sala");
  step("anfitrião escolhe a skin e cria a sala " + code);

  // As abas dividem o localStorage; em celulares diferentes isso não acontece.
  await A.evaluate(() => {
    localStorage.removeItem("mm:sala");
    localStorage.setItem("mm:nick", JSON.stringify("Lara"));
    localStorage.removeItem("gz:skin");
  });
  const B = await page();
  await B.goto(`${base}?sala=${code}`);
  await B.waitForSelector("#screen-lobby:not([hidden])");
  await A.waitForFunction(() => document.querySelectorAll("#lobby-players .lobby-player").length === 2);
  assert.equal(await A.locator("#lobby-players .gz-face").count(), 2, "cada um com a sua skin na sala");
  assert.equal(await B.isHidden("#lobby-start"), true, "só o anfitrião começa");
  step("convidada entra pelo link e aparece com a skin dela");

  await A.click("#lobby-start");
  await A.waitForSelector("#screen-game:not([hidden])");
  await B.waitForSelector("#screen-game:not([hidden])");
  assert.deepEqual(await B.evaluate(() => partida.rodadas), await A.evaluate(() => partida.rodadas), "as mesmas comparações");
  assert.match(await A.textContent("#hud-left"), /Online · 1\/10/);
  assert.equal(await A.isVisible("#timebar"), true, "barra do tempo da rodada");

  // Rodada 1: Lara acerta, Arthur erra.
  const c0 = await certo(A);
  await B.click(c0);
  await A.waitForFunction(() => Object.keys(partida.respostas).length === 1);
  assert.equal(await B.isDisabled(errado[c0]), true, "respondeu, trava");
  assert.match(await B.textContent("#sent"), /Resposta enviada/);
  await A.click(errado[c0]);
  await revelou(A);
  await revelou(B);
  assert.equal(await B.textContent("#game-verdict"), "Acertou!");
  assert.equal(await A.textContent("#game-verdict"), "Errou!");
  assert.equal(await A.locator("#players .gz-face").count(), 2, "skins no placar da partida");
  assert.equal(await B.isHidden("#game-next"), true, "só o anfitrião segue");
  step("todo mundo respondeu: revela e quem acertou pontua");

  for (let i = 1; i < 10; i++) {
    await A.click("#game-next");
    await B.waitForFunction((n) => partida.n === n && partida.fase === "jogando", i);
    const c = await certo(A);
    await A.click(c);
    await B.click(errado[c]);
    await revelou(A);
  }
  await A.click("#game-next");
  await A.waitForSelector("#screen-results:not([hidden])");
  await B.waitForSelector("#screen-results:not([hidden])");
  assert.equal(await A.textContent("#res-score"), "Arthur venceu!");
  assert.equal(await B.textContent("#res-score"), "Arthur venceu!");
  assert.equal(await B.locator("#res-ranking li .gz-face").count(), 2, "placar final com as skins");
  assert.equal(await B.locator("#res-list li").count(), 10);
  await A.waitForFunction(() => (JSON.parse(localStorage.getItem("__fakedb")).maisoumenozi_partidas || []).length === 1);
  step("10 comparações e o mesmo resultado nas duas");

  // Voltar para a sala e o tempo: quem não responde não segura a partida.
  await A.click("#res-again");
  await A.waitForSelector("#screen-lobby:not([hidden])");
  await B.waitForSelector("#screen-lobby:not([hidden])");
  await A.click("#lobby-start");
  await B.waitForFunction(() => partida && partida.online && document.body.dataset.screen === "game" && partida.n === 0 && !partida.hist.length);
  await A.click(await certo(A));
  await A.evaluate(() => { partida.comecou -= MM_ONLINE_SEGUNDOS * 1000; });
  await revelou(B);
  assert.equal(await B.textContent("#game-verdict"), "Não respondeu");
  step("acabou o tempo: revela com quem respondeu");

  // Troca de skin na sala: os outros veem.
  await A.click("#home-btn");
  await A.waitForSelector("#screen-home:not([hidden])");
  await B.waitForFunction(() => isHost(), null, { timeout: 15000 });
  step("anfitrião sai e o comando passa para quem ficou");

  assert.deepEqual(errors, []);
  console.log("\nMaiorzi online: tudo certo");
  await browser.close();
  server.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
