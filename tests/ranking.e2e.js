// Teste de ponta a ponta do ranking do dia (gamezi-ranking.js) no Datazi, no Maisoumenozi e no portal
// (ranking.html), com o Supabase falso de tests/supabase-falso.js. Confere o nome pedido para o ranking,
// o tempo guardado com o resultado e o desempate pelo tempo.
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
  const site = `http://localhost:${server.address().port}`;
  const browser = await playwright.chromium.launch(fs.existsSync("/opt/pw-browsers/chromium") ? { executablePath: "/opt/pw-browsers/chromium" } : {});
  const ctx = await browser.newContext({ viewport: { width: 390, height: 860 }, serviceWorkers: "block", locale: "pt-BR" });
  await ctx.addInitScript(fs.readFileSync(path.join(__dirname, "supabase-falso.js"), "utf8"));
  await ctx.route("**/js/config.js", (r) => r.fulfill({ contentType: "application/javascript", body: 'const SUPABASE_URL = "https://falso.supabase.co"; const SUPABASE_ANON_KEY = "x";' }));
  const errors = [];
  const P = await ctx.newPage();
  P.on("pageerror", (e) => errors.push(e.message));
  const step = (name) => console.log("ok -", name);
  const db = () => P.evaluate(() => ({ datazi_diario: [], maisoumenozi_diario: [], ...JSON.parse(localStorage.getItem("__fakedb") || "{}") }));

  // Datazi do dia sem nome em nenhum jogo: o ranking pede o nome antes de mandar.
  await P.goto(site + "/datazi/index.html");
  await P.click("#daily-btn");
  await P.evaluate(async () => {
    while (partida && !partida.fim) {
      await new Promise((r) => setTimeout(r, 30)); // um tempinho pensando
      colocar(0);
      proximo();
    }
    proximo();
  });
  await P.waitForSelector("#screen-results:not([hidden])");
  await P.waitForSelector("#leaderboard .lb-form");
  assert.equal((await db()).datazi_diario.length, 0, "sem nome, ainda não mandou");
  await P.fill("#leaderboard .lb-input", "Nina");
  await P.click("#leaderboard .lb-form button");
  await P.waitForSelector("#leaderboard .lb-row.me");
  assert.match(await P.textContent("#leaderboard .lb-row.me"), /Nina/);
  assert.match(await P.textContent("#leaderboard .lb-pos"), /1º de 1/);
  let linhas = (await db()).datazi_diario;
  assert.equal(linhas.length, 1);
  assert.ok(linhas[0].tempo_ms > 0, "o tempo vai junto com o resultado");
  assert.equal(await P.evaluate(() => diarios()[dzDiaNumero()].enviado), true);
  step("Datazi do dia: pede o nome, manda o resultado com o tempo e mostra o ranking");

  // Voltar para o resultado de hoje não manda de novo.
  await P.click("#res-home");
  await P.click("#daily-card [data-dia].today");
  await P.waitForSelector("#leaderboard .lb-row.me");
  assert.equal((await db()).datazi_diario.length, 1);
  step("resultado salvo mostra o ranking sem mandar de novo");

  // Maisoumenozi: o nome já é conhecido (o do Datazi), então manda direto.
  await P.goto(site + "/maisoumenozi/index.html");
  await P.click("#daily-btn");
  await P.evaluate(async () => {
    while (partida && !partida.fim) {
      await new Promise((r) => setTimeout(r, 20));
      responder(partida.atual.uau ? "a" : "mais");
      proxima();
    }
  });
  await P.waitForSelector("#screen-results:not([hidden])");
  await P.waitForSelector("#leaderboard .lb-row.me");
  assert.match(await P.textContent("#leaderboard .lb-row.me"), /Nina/);
  linhas = (await db()).maisoumenozi_diario;
  assert.equal(linhas.length, 1);
  assert.ok(linhas[0].tempo_ms > 0);
  step("Maisoumenozi do dia: manda com o nome já usado e mostra o ranking");

  // Desempate: mesmos pontos, quem levou menos tempo fica na frente; sem tempo fica atrás.
  const dia = await P.evaluate(() => mmDiaNumero());
  const minha = linhas[0];
  await P.evaluate(({ dia, pontos, tempo }) => {
    const d = JSON.parse(localStorage.getItem("__fakedb"));
    d.maisoumenozi_diario.push(
      { dia, user_id: "rapido", nick: "Rápido", pontos, tempo_ms: Math.max(0, tempo - 1), created_at: "2026-01-01" },
      { dia, user_id: "lento", nick: "Lento", pontos, tempo_ms: tempo + 60000, created_at: "2026-01-01" },
      { dia, user_id: "semtempo", nick: "Sem tempo", pontos, tempo_ms: null, created_at: "2026-01-01" },
      { dia, user_id: "craque", nick: "Craque", pontos: pontos + 1, tempo_ms: 999999, created_at: "2026-01-01" },
    );
    localStorage.setItem("__fakedb", JSON.stringify(d));
  }, { dia, pontos: minha.pontos, tempo: minha.tempo_ms });
  await P.goto(site + "/ranking.html#maisoumenozi");
  await P.waitForSelector("#rank .lb-row");
  const nomes = await P.$$eval("#rank .lb-row b", (bs) => bs.map((b) => b.firstChild.textContent.trim()));
  assert.deepEqual(nomes, ["Craque", "Rápido", "Nina", "Lento", "Sem tempo"]);
  assert.match(await P.textContent("#rank .lb-pos"), /3º de 5/);
  assert.match(await P.textContent("#rank .lb-row:nth-of-type(1) .lb-time"), /\d/);
  step("portal: ranking do Maisoumenozi com desempate pelo tempo");

  // Banco sem a função nova (schema.sql ainda não rodou): lê a tabela e ordena do mesmo jeito.
  const direto = await P.evaluate(async (dia) => {
    const sb = await gameziCliente(false);
    const rpc = sb.rpc;
    sb.rpc = (nome, a) => (nome === "gamezi_ranking_dia" ? Promise.resolve({ data: null, error: { code: "PGRST202", message: "Could not find the function" } }) : rpc(nome, a));
    const res = await gameziRankingBuscar(sb, "maisoumenozi", dia);
    sb.rpc = rpc;
    return { nomes: res.linhas.map((l) => l.nick), eu: res.eu };
  }, dia);
  assert.deepEqual(direto.nomes, ["Craque", "Rápido", "Nina", "Lento", "Sem tempo"]);
  assert.deepEqual(direto.eu, { posicao: 3, total: 5 });
  step("banco sem a função nova: o ranking ainda aparece, na mesma ordem");

  await P.click('[data-jogo="datazi"]');
  await P.waitForSelector("#rank .lb-row.me");
  assert.match(await P.textContent("#rank .lb-row.me"), /Nina/);
  await P.click('[data-jogo="topzi"]');
  await P.waitForSelector("#rank .leaderboard p.muted");
  step("portal: troca de jogo pelas abas (Topzi sem ninguém hoje)");

  await P.goto(site + "/");
  await P.click(".portal-rank");
  await P.waitForURL(/ranking\.html/);
  step("portal leva para o ranking do dia");

  assert.deepEqual(errors, [], "sem erros de JavaScript");
  await browser.close();
  server.close();
  console.log("Ranking do dia: tudo certo");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
