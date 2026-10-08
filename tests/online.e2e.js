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
  const base = `http://localhost:${server.address().port}/topzi/index.html`;
  const browser = await playwright.chromium.launch(fs.existsSync("/opt/pw-browsers/chromium") ? { executablePath: "/opt/pw-browsers/chromium" } : {});
  const ctx = await browser.newContext({ viewport: { width: 420, height: 900 }, serviceWorkers: "block", locale: "pt-BR" });
  await ctx.addInitScript(fs.readFileSync(path.join(__dirname, "supabase-falso.js"), "utf8"));
  await ctx.addInitScript(() => localStorage.setItem("tt:ajuda", "true")); // sem o "Como jogar" da primeira visita
  await ctx.route("**/js/config.js", (r) => r.fulfill({ contentType: "application/javascript", body: 'const SUPABASE_URL = "https://falso.supabase.co"; const SUPABASE_ANON_KEY = "x";' }));
  const errors = [];
  const page = async () => {
    const p = await ctx.newPage();
    p.on("pageerror", (e) => errors.push(e.message));
    p.on("console", (m) => { if (m.text().startsWith("[online]")) console.log("   ", m.text()); });
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

  // Lara vê as listas e sugere uma; Arthur usa a sugestão.
  await B.click("#lobby-suggest");
  await B.waitForSelector("#screen-lists:not([hidden])");
  const suggested = await B.textContent(".list-card:nth-child(2) .list-title");
  await B.click(".list-card:nth-child(2) .list-play");
  await B.waitForSelector("#screen-lobby:not([hidden])");
  await A.waitForSelector(".suggestion button", { timeout: 5000 });
  assert.match(await A.textContent(".suggestion"), /sugerida por Lara/);
  assert.equal(await B.$(".suggestion button"), null, "convidada não tem o botão Usar");
  await A.click(".suggestion button");
  await B.waitForFunction((t) => document.querySelector("#lobby-settings").textContent.includes(t), suggested, { timeout: 5000 });
  step("convidada sugere uma lista e o anfitrião usa a sugestão");

  await A.click("#lobby-start");
  await B.waitForSelector("#screen-game:not([hidden])", { timeout: 5000 });
  assert.equal(await B.textContent("#game-title"), suggested);
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

  // Conta do Gamezi: uma só para todos os jogos, com login em conta.html (na raiz).
  const C = await page();
  await C.goto(base);
  await C.click(".home-account .account-btn");
  await C.waitForURL(/conta\.html\?volta=topzi$/);
  assert.match(await C.textContent("#back"), /Topzi/);
  await C.fill("#email", "lara@exemplo.com");
  await C.fill("#password", "123");
  await C.click('#login-form button[value="criar"]');
  assert.match(await C.textContent("#msg"), /6 caracteres/);
  await C.fill("#password", "segredo1");
  await C.click('#login-form button[value="criar"]');
  await C.waitForURL(/\/topzi\/$/, { timeout: 5000 });
  await C.waitForFunction(() => /lara@exemplo\.com/.test(document.querySelector(".home-account .account-line").textContent), null, { timeout: 5000 });
  await C.waitForFunction(() => JSON.parse(localStorage.getItem("__fakedb")).topzi_perfis.length === 1, null, { timeout: 5000 });
  step("conta Gamezi: cria na conta.html e volta para o Topzi já conectada, com o perfil salvo");

  await C.goto(base.replace("topzi/", "patozi/"));
  await C.click("#profile-btn");
  await C.waitForFunction(() => /lara@exemplo\.com/.test(document.querySelector("#screen-profile .account-line").textContent), null, { timeout: 5000 });
  await C.waitForFunction(() => JSON.parse(localStorage.getItem("__fakedb")).patozi_perfis.length === 1, null, { timeout: 5000 });
  step("a mesma conta já vale no Patozi, sem entrar de novo");

  await C.click("#screen-profile .account-btn");
  await C.waitForURL(/conta\.html\?volta=patozi$/);
  await C.waitForSelector("#logged:not([hidden])");
  assert.match(await C.textContent("#status"), /lara@exemplo\.com/);
  await C.waitForFunction(() => /Topzi/.test(document.getElementById("my-games").textContent) && !/Carregando/.test(document.getElementById("my-games").textContent), null, { timeout: 5000 });
  await C.click("#logout");
  await C.waitForSelector("#login-form:not([hidden])");
  assert.equal(await C.evaluate(() => gameziLogado()), false);
  await C.fill("#email", "lara@exemplo.com");
  await C.fill("#password", "errada1");
  await C.click('#login-form button[value="entrar"]');
  await C.waitForFunction(() => /errados/.test(document.getElementById("msg").textContent), null, { timeout: 5000 });
  await C.fill("#password", "segredo1");
  await C.click('#login-form button[value="entrar"]');
  await C.waitForURL(/\/patozi\/$/, { timeout: 5000 });
  step("conta.html: resumo dos jogos, sai e entra de novo, e volta para o jogo de onde veio");

  await C.goto(base.replace("topzi/index.html", ""));
  assert.equal(await C.textContent("#account span"), "Minha conta");
  step("portal do Gamezi mostra a conta conectada");

  assert.deepEqual(errors, []);
  console.log("\nTudo certo no modo online.");
  await browser.close();
  server.close();
})().catch(async (e) => {
  console.error(e);
  process.exit(1);
});
