// Teste de ponta a ponta das ligas entre amigos (gamezi-ligas.js em ranking.html#ligas): Ana cria a liga, Beto entra
// pelo link de convite, o ranking da semana soma o desafio do dia de jogos diferentes (cada um de 0 a 100) e Beto sai.
// Usa o Supabase falso de tests/supabase-falso.js (cada aba é um usuário). Rode com: npm run test:online
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
  const base = `http://localhost:${server.address().port}/`;
  const browser = await playwright.chromium.launch(fs.existsSync("/opt/pw-browsers/chromium") ? { executablePath: "/opt/pw-browsers/chromium" } : {});
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block", locale: "pt-BR" });
  await ctx.addInitScript(fs.readFileSync(path.join(__dirname, "supabase-falso.js"), "utf8"));
  await ctx.route("**/js/config.js", (r) => r.fulfill({ contentType: "application/javascript", body: 'const SUPABASE_URL = "https://falso.supabase.co"; const SUPABASE_ANON_KEY = "x";' }));
  await ctx.route(/fonts\.|_vercel/, (r) => r.abort());
  const errors = [];
  const page = async () => {
    const p = await ctx.newPage();
    p.on("pageerror", (e) => errors.push(e.message));
    p.on("dialog", (d) => d.accept());
    return p;
  };
  const step = (name) => console.log("ok -", name);
  const linhas = (p) => p.$$eval("#liga-box .lb-row", (rs) => rs.map((r) => r.innerText.replace(/\s+/g, " ").trim()));

  // O portal leva para as ligas.
  const P = await page();
  await P.goto(base + "index.html");
  await P.click('a[href="ranking.html#ligas"]');
  await P.waitForSelector(".liga-form");
  assert.match(await P.textContent("#rank"), /ainda não está em nenhuma liga/);
  step("portal → ranking.html#ligas, sem liga ainda");

  // Ana cria a liga.
  await P.fill('.liga-form[data-acao="criar"] .liga-nome', "Los Halcones");
  await P.fill('.liga-form[data-acao="criar"] .liga-nick', "Ana");
  await P.click('.liga-form[data-acao="criar"] button');
  await P.waitForSelector("#liga-box .lb-row");
  const codigo = await P.evaluate(() => JSON.parse(localStorage.getItem("gz:liga")));
  assert.match(codigo, /^[A-Z0-9]{6}$/);
  assert.match(await P.textContent("#liga-box .liga-head"), new RegExp(`Los Halcones.*${codigo}.*1 na liga`));
  assert.deepEqual(await linhas(P), ["1 Ana (você) 0 desafios 0"]);
  step("Ana cria a liga " + codigo);

  // Desafios desta semana: Ana fez o Topzi completo (100) e meio Corzi (50); Beto fará o Datazi pela metade (50).
  const anaId = await P.evaluate(() => sessionStorage.getItem("__fakeuid"));
  const B = await page();
  await B.goto(base + "ranking.html?liga=" + codigo.toLowerCase());
  await B.waitForSelector(".liga-convite");
  assert.match(await B.textContent(".liga-convite"), new RegExp("convidado para a liga " + codigo));
  await B.fill(".liga-convite .liga-nick", "Beto");
  await B.click(".liga-convite button");
  await B.waitForFunction(() => document.querySelectorAll("#liga-box .lb-row").length === 2);
  assert.equal(await B.evaluate(() => location.search), "", "o convite sai do endereço");
  const betoId = await B.evaluate(() => sessionStorage.getItem("__fakeuid"));
  assert.notEqual(betoId, anaId);
  step("Beto entra pelo link de convite");

  await B.evaluate(([ana, beto]) => {
    const db = JSON.parse(localStorage.getItem("__fakedb"));
    const d = new Date(), hoje = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
    const dia = (ini) => Math.floor((hoje - Date.parse(ini + "T00:00:00Z")) / 864e5) + 1;
    db.topzi_diario.push({ dia: dia("2026-10-01"), user_id: ana, nick: "Ana", pontos: 55 });
    db.corzi_diario.push({ dia: dia("2026-10-26"), user_id: ana, nick: "Ana", pontos: 500 });
    db.datazi_diario.push({ dia: dia("2026-10-08"), user_id: beto, nick: "Beto", pontos: 4 });
    db.datazi_diario.push({ dia: dia("2026-10-08") - 7, user_id: beto, nick: "Beto", pontos: 8 }); // semana passada não conta
    localStorage.setItem("__fakedb", JSON.stringify(db));
  }, [anaId, betoId]);
  await B.reload();
  await B.waitForFunction(() => document.querySelectorAll("#liga-box .lb-row").length === 2);
  assert.deepEqual(await linhas(B), ["1 Ana 2 desafios 150", "2 Beto (você) 1 desafio 50"]);
  await P.reload();
  await P.waitForFunction(() => document.querySelectorAll("#liga-box .lb-row").length === 2);
  assert.deepEqual(await linhas(P), ["1 Ana (você) 2 desafios 150", "2 Beto 1 desafio 50"]);
  step("ranking da semana: cada desafio de 0 a 100, só esta semana");

  // Beto sai: a liga continua com a Ana.
  await B.click("#liga-box .liga-sair");
  await B.waitForFunction(() => /ainda não está em nenhuma liga/.test(document.querySelector("#rank").textContent));
  await P.reload();
  await P.waitForFunction(() => document.querySelectorAll("#liga-box .lb-row").length === 1);
  assert.match(await P.textContent("#liga-box .liga-head"), /1 na liga/);
  step("Beto sai e a liga continua com a Ana");

  assert.deepEqual(errors, [], "sem erros de JavaScript");
  await browser.close();
  server.close();
  console.log("Ligas entre amigos: tudo certo");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
