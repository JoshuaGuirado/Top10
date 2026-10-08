// Teste de ponta a ponta do Patozi online: duas abas (anfitrião e convidada) jogando uma partida inteira,
// com o Supabase falso de tests/supabase-falso.js. Também confere o ranking do Pato do dia.
// Rode com: npm run test:online
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
  const base = `http://localhost:${server.address().port}/patozi/index.html`;
  const browser = await playwright.chromium.launch(fs.existsSync("/opt/pw-browsers/chromium") ? { executablePath: "/opt/pw-browsers/chromium" } : {});
  const ctx = await browser.newContext({ viewport: { width: 420, height: 900 }, serviceWorkers: "block", locale: "pt-BR" });
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
  await A.evaluate(() => { localStorage.removeItem("pz:sala"); localStorage.setItem("pz:nick", JSON.stringify("Lara")); });
  const B = await page();
  await B.goto(`${base}?sala=${code}`);
  await B.waitForSelector("#screen-lobby:not([hidden])", { timeout: 8000 });
  await A.waitForFunction(() => document.querySelectorAll(".lobby-player").length === 2, null, { timeout: 5000 });
  assert.equal(await B.isVisible("#lobby-start"), false, "convidada não tem o botão Começar");
  step("convidada entra pelo link e aparece na sala");

  // Anfitrião escolhe só o tema Brasil e a duração rápida; a convidada vê a mudança.
  await A.click('#lobby-options [data-tema="brasil"]');
  await A.click('#lobby-options [data-dur="rapida"]');
  await B.waitForFunction(() => document.querySelector('#lobby-options [data-tema="brasil"]').classList.contains("active"), null, { timeout: 5000 });
  assert.equal(await B.isDisabled('#lobby-options [data-tema="brasil"]'), true, "convidada não mexe nas opções");
  step("opções do anfitrião chegam na convidada");

  await A.click("#lobby-start");
  await B.waitForSelector("#screen-game:not([hidden])", { timeout: 5000 });
  const cardA = await A.textContent("#card-q");
  assert.equal(await B.textContent("#card-q"), cardA, "mesma carta nos dois aparelhos");
  assert.match(await A.textContent("#card-theme"), /Brasil/);
  step("partida começa com a mesma carta nos dois aparelhos");

  // Joga a partida inteira pela tela: quem está na vez chuta o mínimo ou grita "Nem a pato!".
  const pages = { Arthur: A, Lara: B };
  let rodadas = 0;
  for (let k = 0; k < 300; k++) {
    if ((await screen(A)) === "results") break;
    const st = await A.evaluate(() => ({ fase: partida.fase, vez: partida.jogadores[partida.vez].nome, lances: partida.lances.length, fim: partida.fim, seq: partida.seq }));
    if (st.fase === "revelado") {
      await B.waitForFunction((s) => partida && partida.seq === s, st.seq, { timeout: 5000 });
      await A.waitForSelector("#next-btn", { timeout: 5000 });
      await B.waitForSelector("#reveal .verdict", { timeout: 5000 });
      if (rodadas === 0) {
        assert.equal(await B.textContent("#reveal .verdict"), await A.textContent("#reveal .verdict"));
        assert.equal(await B.$("#next-btn"), null, "só o anfitrião passa para a próxima carta");
        step("revelação aparece igual nos dois aparelhos");
      }
      rodadas += 1;
      if (st.fim) {
        await A.click("#next-btn");
        await B.waitForSelector("#next-btn", { timeout: 5000 });
        await B.click("#next-btn");
        break;
      }
      await A.click("#next-btn");
      await B.waitForFunction((s) => partida.seq > s, st.seq, { timeout: 5000 });
      continue;
    }
    const p = pages[st.vez];
    await p.waitForSelector("#guess", { timeout: 5000 });
    if (st.lances >= 2) await p.click("#nem-btn");
    else {
      const min = await A.evaluate(() => pzMinimo(partida));
      await p.fill("#guess", String(min + 7));
      await p.press("#guess", "Enter");
    }
    await A.waitForFunction((s) => partida.seq > s, st.seq, { timeout: 5000 });
  }
  await A.waitForSelector("#screen-results:not([hidden])", { timeout: 5000 });
  await B.waitForSelector("#screen-results:not([hidden])", { timeout: 5000 });
  assert.equal(await B.textContent("#loser h2"), await A.textContent("#loser h2"));
  assert.ok(rodadas >= 3, "jogou várias rodadas");
  step(`partida inteira com ${rodadas} rodadas e o mesmo resultado nos dois: ${await A.textContent("#loser h2")}`);

  const historico = await A.evaluate(() => JSON.parse(localStorage.getItem("__fakedb")).patozi_partidas);
  assert.equal(historico.length, 1);
  assert.equal(historico[0].players.length, 2);
  step("partida fica registrada em patozi_partidas");

  await A.click("#again-btn");
  await A.waitForSelector("#screen-lobby:not([hidden])", { timeout: 5000 });
  await B.waitForSelector("#screen-lobby:not([hidden])", { timeout: 5000 });
  step("jogar de novo leva os dois de volta para a sala");

  // Quem recarrega a página no meio da partida volta para ela.
  await A.click("#lobby-start");
  await B.waitForSelector("#screen-game:not([hidden])", { timeout: 5000 });
  await B.evaluate(() => localStorage.setItem("pz:sala", JSON.stringify(document.querySelector("#room-code").textContent)));
  await B.reload();
  await B.waitForSelector("#screen-game:not([hidden])", { timeout: 8000 });
  assert.equal(await B.textContent("#card-q"), await A.textContent("#card-q"));
  step("convidada recarrega e volta para a partida");

  // Se a convidada some, o computador joga por ela.
  await B.close();
  await A.evaluate(() => { if (partida.vez === 0) pzChutar(partida, 0, 1); partida.seq += 1; renderGame(); });
  await A.waitForFunction(() => partida.lances.some((l) => l.j === 1) || partida.fase === "revelado", null, { timeout: 25000 });
  step("o computador joga por quem saiu da sala");

  await A.click("#game-quit");
  await A.waitForSelector("#screen-home:not([hidden])");
  const salas = await A.evaluate(() => JSON.parse(localStorage.getItem("__fakedb")).patozi_salas);
  assert.equal(salas.length, 0, "sala apagada quando o anfitrião sai");
  step("anfitrião sai e a sala é fechada");

  // Pato do dia: o resultado vai para o ranking.
  await A.click("#daily-btn");
  for (let i = 0; i < 5; i++) {
    await A.fill("#daily-guess", "10");
    await A.press("#daily-guess", "Enter");
    await A.click("#daily-next");
  }
  await A.waitForSelector(".lb-row", { timeout: 5000 });
  assert.match(await A.textContent(".lb-row"), /Arthur|Lara/);
  const diario = await A.evaluate(() => JSON.parse(localStorage.getItem("__fakedb")).patozi_diario);
  assert.equal(diario.length, 1);
  step("Pato do dia vai para o ranking de hoje");

  assert.deepEqual(errors, [], "sem erros de JavaScript");
  await browser.close();
  server.close();
  console.log("Patozi online: tudo certo");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
