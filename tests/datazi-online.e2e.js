// Teste de ponta a ponta do Datazi online: duas abas (anfitrião e convidada) jogando a mesma rodada nos três modos
// (linha do tempo, "Qual veio antes?" e "Em que ano?"). Confere os pontos, a volta para a sala, a troca de modo,
// o tempo da rodada e o histórico da partida.
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
  const base = `http://localhost:${server.address().port}/datazi/index.html`;
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
  const pontos = (p, nome) => p.evaluate((n) => partida.jogadores.find((j) => j.nome === n).pontos, nome);
  const revelou = (p) => p.waitForFunction(() => partida && partida.fase === "revelado" && document.body.dataset.screen === "game");
  // Resposta certa da rodada da vez, em cada modo.
  const certa = (p) => p.evaluate(() => {
    const r = partida.rodadas[partida.atual];
    return partida.tipo === "linha" ? dzLugarCerto(partida, r) : partida.tipo === "antes" ? dzMaisAntigo(r) : dzEvento(r).ano;
  });

  // Arthur cria a sala (modo: linha do tempo).
  const A = await page();
  await A.goto(base);
  await A.click("#online-btn");
  await A.fill("#online-nick", "Arthur");
  await A.click("#create-room-btn");
  await A.waitForSelector("#screen-lobby:not([hidden])");
  const code = (await A.textContent("#room-code")).trim();
  assert.match(code, /^[A-Z0-9]{5}$/);
  assert.equal(await A.getAttribute('#lobby-modes [data-modo="linha"]', "aria-checked"), "true");
  step("anfitrião cria a sala " + code);

  // As abas dividem o localStorage; em celulares diferentes isso não acontece.
  await A.evaluate(() => {
    localStorage.removeItem("dz:sala");
    localStorage.setItem("dz:nick", JSON.stringify("Lara"));
  });
  const B = await page();
  await B.goto(`${base}?sala=${code}`);
  await B.waitForSelector("#screen-lobby:not([hidden])");
  await A.waitForFunction(() => document.querySelectorAll("#lobby-players .lobby-player").length === 2);
  assert.equal(await B.isHidden("#lobby-start"), true, "só o anfitrião começa");
  assert.equal(await B.isDisabled('#lobby-modes [data-modo="ano"]'), true, "só o anfitrião muda o modo");
  step("convidada entra pelo link de convite");

  // ── Linha do tempo ──
  await A.click("#lobby-start");
  await A.waitForSelector("#screen-game:not([hidden])");
  await B.waitForSelector("#screen-game:not([hidden])");
  assert.deepEqual(await B.evaluate(() => [partida.rodadas, partida.linha]), await A.evaluate(() => [partida.rodadas, partida.linha]), "a mesma partida nas duas");
  assert.equal(await A.textContent("#game-round"), "Rodada 1/10");
  assert.equal(await A.isVisible("#timer"), true, "tempo da rodada");

  // Rodada 1: Lara põe no lugar certo; Arthur, no errado.
  const c0 = await certa(A);
  await B.click(`#timeline [data-pos="${c0}"]`);
  await A.waitForFunction(() => Object.keys(partida.respostas).length === 1);
  assert.equal(await B.isVisible("#sent"), true, "mostra que mandou");
  assert.equal(await B.isDisabled(`#timeline [data-pos="${c0}"]`), true, "não responde de novo");
  assert.match(await A.textContent("#players"), /Lara.*respondeu/);
  await A.click(`#timeline [data-pos="${c0 === 0 ? 1 : 0}"]`);
  await revelou(A);
  await revelou(B);
  assert.equal(await pontos(A, "Lara"), 1);
  assert.equal(await pontos(A, "Arthur"), 0);
  assert.match(await B.textContent("#game-hint"), /Certo!/);
  assert.match(await A.textContent("#game-hint"), /Errou/);
  assert.equal(await B.evaluate(() => partida.linha.length), 2, "o acontecimento entrou na linha das duas");
  assert.equal(await B.isHidden("#game-next"), true, "só o anfitrião segue");
  assert.match(await B.textContent("#sent"), /anfitrião/);
  step("linha do tempo: todo mundo respondeu, revela e quem acertou leva 1 ponto");

  for (let i = 1; i < 10; i++) {
    await A.click("#game-next");
    await B.waitForFunction((n) => partida.atual === n && partida.fase === "jogando", i);
    const c = await certa(A);
    await A.click(`#timeline [data-pos="${c}"]`);
    await B.click(`#timeline [data-pos="${c === 0 ? 1 : 0}"]`);
    await revelou(A);
  }
  await A.click("#game-next");
  await A.waitForSelector("#screen-results:not([hidden])");
  await B.waitForSelector("#screen-results:not([hidden])");
  assert.equal(await A.textContent("#res-score"), "Arthur venceu!");
  assert.equal(await B.textContent("#res-score"), "Arthur venceu!");
  assert.equal(await B.locator("#res-ranking li").count(), 2);
  assert.equal(await B.locator("#res-timeline li.event").count(), 11, "a linha do tempo inteira no fim");
  await A.waitForFunction(() => (JSON.parse(localStorage.getItem("__fakedb")).datazi_partidas || []).length === 1);
  const hist = (await db(A)).datazi_partidas;
  assert.equal(hist.length, 1, "partida no histórico");
  assert.equal(hist[0].tipo, "linha");
  assert.equal(hist[0].players.find((p) => p.nick === "Arthur").pontos, 9);
  step("10 rodadas e o mesmo resultado nas duas: Arthur 9 × 1 Lara");

  // ── Qual veio antes? ──
  await A.click("#res-again");
  await A.waitForSelector("#screen-lobby:not([hidden])");
  await B.waitForSelector("#screen-lobby:not([hidden])");
  await A.click('#lobby-modes [data-modo="antes"]');
  await B.waitForFunction(() => document.querySelector('#lobby-modes [data-modo="antes"]').getAttribute("aria-checked") === "true");
  step("volta todo mundo para a sala e o anfitrião troca o modo");

  await A.click("#lobby-start");
  await B.waitForFunction(() => partida && partida.tipo === "antes" && document.body.dataset.screen === "game");
  assert.equal(await B.locator("#game-pair .pair-btn").count(), 2);
  assert.equal(await B.isHidden("#timeline"), true);
  for (let i = 0; i < 10; i++) {
    if (i) {
      await A.click("#game-next");
      await B.waitForFunction((n) => partida.atual === n && partida.fase === "jogando", i);
    }
    const c = await certa(A);
    await B.click(`#game-pair [data-escolha="${c}"]`);
    await A.click(`#game-pair [data-escolha="${i < 3 ? c : 1 - c}"]`);
    await revelou(A);
    if (!i) {
      await revelou(B);
      assert.equal(await B.locator("#game-pair .pair-btn.right b").count(), 1, "o ano aparece no certo");
      assert.match(await B.textContent("#game-hint"), /Esse veio antes/);
    }
  }
  await A.click("#game-next");
  await B.waitForSelector("#screen-results:not([hidden])");
  assert.equal(await B.textContent("#res-score"), "Lara venceu!");
  assert.equal(await B.locator("#res-timeline li").count(), 10, "as rodadas no fim");
  step("Qual veio antes?: Lara 10 × 3 Arthur");

  // ── Em que ano? ── e o tempo da rodada: quem não responde não segura a partida.
  await A.click("#res-again");
  await B.waitForSelector("#screen-lobby:not([hidden])");
  await A.click('#lobby-modes [data-modo="ano"]');
  await B.waitForFunction(() => document.querySelector('#lobby-modes [data-modo="ano"]').getAttribute("aria-checked") === "true");
  await A.click("#lobby-start");
  await B.waitForFunction(() => partida && partida.tipo === "ano" && document.body.dataset.screen === "game");
  assert.equal(await B.isVisible("#year-input"), true);
  await A.fill("#year-input", String(await certa(A)));
  await A.click("#year-btn");
  await A.waitForFunction(() => Object.keys(partida.respostas).length === 1);
  assert.equal(await A.isHidden("#year-form"), true, "chutou, o campo some");
  await A.evaluate(() => { partida.comecou -= DZ_ONLINE_SEGUNDOS * 1000; });
  await revelou(A);
  await revelou(B);
  assert.equal(await pontos(B, "Arthur"), 10, "em cheio vale 10");
  assert.match(await B.textContent("#players"), /não respondeu/);
  assert.match(await A.textContent("#game-hint"), /\+10/);
  step("Em que ano?: acabou o tempo, revela com quem respondeu e em cheio vale 10");

  // Ano maluco não vale.
  await A.click("#game-next");
  await A.waitForFunction(() => partida.fase === "jogando");
  await A.fill("#year-input", "99999");
  await A.click("#year-btn");
  assert.match(await A.textContent("#game-hint"), /Digite um ano/);
  assert.equal(await A.evaluate(() => Object.keys(partida.respostas).length), 0);
  step("ano que não existe não é mandado");

  // Sair da sala no meio: o comando passa para a Lara.
  await A.click("#game-quit");
  await A.waitForSelector("#screen-home:not([hidden])");
  await B.waitForFunction(() => isHost(), null, { timeout: 15000 });
  step("anfitrião sai e o comando passa para quem ficou");

  assert.deepEqual(errors, []);
  console.log("\nDatazi online: tudo certo");
  await browser.close();
  server.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
