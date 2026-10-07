// Teste de ponta a ponta do modo online: duas abas (anfitrião e convidada) jogando uma partida,
// com o Supabase falso de tests/supabase-falso.js. Rode com: npm run test:online
// Precisa do Playwright com Chromium (no ambiente do Claude já vem instalado).
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
  const base = `http://localhost:${server.address().port}/index.html`;
  const browser = await playwright.chromium.launch(fs.existsSync("/opt/pw-browsers/chromium") ? { executablePath: "/opt/pw-browsers/chromium" } : {});
  const ctx = await browser.newContext({ viewport: { width: 420, height: 900 }, serviceWorkers: "block" });
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
  const guess = async (p, text) => { await p.fill("#guess", text); await p.press("#guess", "Enter"); await p.waitForTimeout(1300); };

  const A = await page();
  await A.goto(base);
  await A.click("#online-btn");
  await A.fill("#online-nick", "Arthur");
  await A.click("#create-room-btn");
  await A.waitForSelector("#screen-lobby:not([hidden])");
  const code = await A.textContent("#room-code");
  assert.match(code, /^[A-Z0-9]{5}$/);
  step("anfitrião cria a sala " + code);

  // As abas dividem o localStorage; em celulares diferentes isso não acontece.
  await A.evaluate(() => { localStorage.removeItem("tt:sala"); const p = JSON.parse(localStorage.getItem("tt:players")); p[0].nick = "Lara"; localStorage.setItem("tt:players", JSON.stringify(p)); });
  const B = await page();
  await B.goto(`${base}?sala=${code}`);
  await B.waitForSelector("#screen-lobby:not([hidden])", { timeout: 8000 });
  await A.waitForFunction(() => document.querySelectorAll(".lobby-player").length === 2, null, { timeout: 5000 });
  step("convidada entra pelo link e aparece na sala");

  await A.click("#lobby-random");
  await A.waitForTimeout(400);
  await A.click("#lobby-start");
  await B.waitForSelector("#screen-game:not([hidden])", { timeout: 5000 });
  assert.equal(await B.isDisabled("#guess"), true, "convidada não joga na vez do anfitrião");
  step("partida começa nos dois aparelhos");

  const items = await A.evaluate(() => game.list.items.map((x) => x.split("|")[0]));
  await guess(A, items[9]);
  assert.equal(await B.textContent("#progress"), "Encontrados: 1 de 10");
  assert.equal(await B.isDisabled("#guess"), false, "agora é a vez da convidada");
  await guess(B, "Narnia");
  assert.match(await A.textContent("#feedback"), /Narnia/);
  await guess(A, items[0]);
  await guess(B, items[4]);
  assert.deepEqual(await B.$$eval(".score-pts", (e) => e.map((x) => x.textContent)), ["11", "5"]);
  step("lances e placar sincronizados");

  await A.evaluate(() => { store("sala", room.code); players[0].nick = "Arthur"; store("players", players); });
  await A.reload();
  await A.waitForSelector("#screen-game:not([hidden])", { timeout: 8000 });
  await A.waitForTimeout(600);
  await guess(A, items[2]);
  assert.equal(await B.textContent("#progress"), "Encontrados: 4 de 10");
  step("anfitrião recarrega a página e a partida continua");

  await A.click("#end-btn");
  await A.waitForTimeout(6500);
  assert.equal(await B.textContent("#results-title"), await A.textContent("#results-title"));
  assert.equal(await B.isVisible("#late-contest"), false, "só o anfitrião aceita chutes");
  await A.selectOption(".contest-row select", { index: 1 });
  await A.click(".contest-row button");
  await A.waitForTimeout(1200);
  assert.match(await B.textContent("#results-sub"), /Aceito/);
  step("resultado igual nos dois e chute aceito chega na convidada");

  await A.click("#rematch-btn");
  await B.click("#rematch-btn");
  await A.waitForTimeout(600);
  await A.click("#lobby-modes .chip:nth-child(4)");
  await A.click("#lobby-random");
  await A.waitForTimeout(300);
  await A.click("#lobby-start");
  await B.waitForSelector("#screen-game:not([hidden])", { timeout: 5000 });
  await guess(A, "xpto");
  await B.click("#hint-btn");
  await B.click("#board li.pickable >> nth=-1");
  await A.waitForTimeout(800);
  assert.equal(await A.evaluate(() => game.lives), await B.evaluate(() => game.lives));
  step("equipe contra a lista: erro e dica da convidada valem para todos");

  assert.deepEqual(errors, []);
  console.log("\nTudo certo no modo online.");
  await browser.close();
  server.close();
})().catch(async (e) => {
  console.error(e);
  process.exit(1);
});
