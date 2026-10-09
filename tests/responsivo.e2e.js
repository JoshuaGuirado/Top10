// Teste de celular: abre as telas do portal, da conta e dos jogos em larguras de celular e acusa
// o que sai da tela na horizontal (página com rolagem para o lado ou elemento passando da borda).
// Rode com: npm run test:mobile (fotos de cada tela em tests/fotos-celular/ com FOTOS=1).
const http = require("http");
const fs = require("fs");
const path = require("path");

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

const LARGURAS = [320, 360, 390];
const FOTOS = process.env.FOTOS ? path.join(__dirname, "fotos-celular") : null;

// Roda na página: o que passa da largura da tela (fora de caixas que rolam ou cortam de propósito).
function medir(W) {
  const nome = (el) => el.tagName.toLowerCase() + (el.id ? "#" + el.id : "") + (typeof el.className === "string" && el.className ? "." + el.className.trim().split(/\s+/).join(".") : "");
  const visivel = (el) => { const s = getComputedStyle(el); return s.display !== "none" && s.visibility !== "hidden" && el.getClientRects().length; };
  const problemas = [];
  for (const el of document.querySelectorAll("body *")) {
    if (!visivel(el) || el.closest("[hidden]")) continue;
    const r = el.getBoundingClientRect();
    if (!r.width || (r.right <= W + 1 && r.left >= -1)) continue;
    // Dentro de uma caixa que rola ou corta e que cabe na tela: tudo bem.
    let p = el.parentElement, dentro = false;
    while (p && p !== document.body) {
      if (getComputedStyle(p).overflowX !== "visible") { const pr = p.getBoundingClientRect(); if (pr.right <= W + 1 && pr.left >= -1) { dentro = true; break; } }
      p = p.parentElement;
    }
    // Só o de fora: se o pai também passa, quem acusa é o pai.
    const pai = el.parentElement && el.parentElement.getBoundingClientRect();
    if (!dentro && !(pai && (pai.right > W + 1 || pai.left < -1) && el.parentElement !== document.body)) problemas.push(`${nome(el)} [${Math.round(r.left)}..${Math.round(r.right)}]`);
  }
  // Texto que vaza da própria caixa (palavra comprida demais) e passa por cima do vizinho.
  for (const el of document.querySelectorAll("body *")) {
    if (!visivel(el) || el.closest("[hidden]") || /^(INPUT|TEXTAREA|SELECT|svg|path|CANVAS)$/i.test(el.tagName)) continue;
    if (getComputedStyle(el).overflowX !== "visible" || !el.clientWidth) continue;
    const temTexto = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (temTexto && el.scrollWidth > el.clientWidth + 2) problemas.push(`texto vazando: ${nome(el)} "${el.textContent.trim().slice(0, 30)}" (${el.scrollWidth} > ${el.clientWidth})`);
  }
  const rola = document.documentElement.scrollWidth > innerWidth + 1 ? `página com ${document.documentElement.scrollWidth}px` : null;
  return { rola, problemas: problemas.slice(0, 8) };
}

(async () => {
  await new Promise((r) => server.listen(0, r));
  const base = `http://localhost:${server.address().port}`;
  const browser = await playwright.chromium.launch(fs.existsSync("/opt/pw-browsers/chromium") ? { executablePath: "/opt/pw-browsers/chromium" } : {});
  if (FOTOS) fs.mkdirSync(FOTOS, { recursive: true });
  let falhas = 0;
  const erros = [];

  for (const W of LARGURAS) {
    const ctx = await browser.newContext({ viewport: { width: W, height: 700 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, serviceWorkers: "block", locale: "pt-BR" });
    await ctx.addInitScript(fs.readFileSync(path.join(__dirname, "supabase-falso.js"), "utf8"));
    await ctx.addInitScript(() => { localStorage.setItem("tt:ajuda", "true"); localStorage.setItem("pz:ajuda", "true"); localStorage.setItem("dz:ajuda", "true"); });
    await ctx.route("**/js/config.js", (r) => r.fulfill({ contentType: "application/javascript", body: 'const SUPABASE_URL = "https://falso.supabase.co"; const SUPABASE_ANON_KEY = "x";' }));
    const page = await ctx.newPage();
    page.on("pageerror", (e) => erros.push(`${W}px: ${e.message}`));
    page.on("dialog", (d) => d.accept());

    const conferir = async (tela) => {
      await page.waitForTimeout(250);
      // Algo passou da borda no meio de uma animação: o celular afasta o zoom e a tela toda encolhe.
      const zoom = [await page.evaluate(() => innerWidth)];
      // Espera as animações de entrada (elas mexem com transform e passariam da borda por um instante).
      await page.evaluate(() => Promise.race([
        Promise.all(document.getAnimations().filter((a) => a.effect && a.effect.getComputedTiming().iterations !== Infinity).map((a) => a.finished.catch(() => {}))),
        new Promise((r) => setTimeout(r, 3000)),
      ]));
      const m = await page.evaluate(medir, W);
      zoom.push(await page.evaluate(() => innerWidth));
      if (zoom.some((w) => w > W)) m.rola = `tela encolheu (largura ${Math.max(...zoom)}px)` + (m.rola ? ", " + m.rola : "");
      const ruim = m.rola || m.problemas.length;
      if (ruim) falhas++;
      console.log(`${ruim ? "FALHA" : "ok   "} ${W}px ${tela}${m.rola ? " — " + m.rola : ""}`);
      m.problemas.forEach((p) => console.log("        " + p));
      if (FOTOS) await page.screenshot({ path: path.join(FOTOS, `${W}-${tela.replace(/[^a-z0-9]+/gi, "-")}.png`), fullPage: true });
    };
    const fechar = () => page.evaluate(() => document.querySelectorAll("dialog[open]").forEach((d) => d.close()));
    const tentar = async (tela, fn) => {
      try { await fn(); await conferir(tela); } catch (e) { falhas++; console.log(`ERRO  ${W}px ${tela}: ${e.message.split("\n")[0]}`); }
    };

    // ── Gamezi ──
    await tentar("portal", () => page.goto(base + "/index.html"));
    await tentar("conta", () => page.goto(base + "/conta.html?volta=topzi"));
    await tentar("conta-criar", async () => { const b = page.locator("[data-modo=criar], #to-signup, [data-tab=criar]").first(); if (await b.count()) await b.click(); });

    // ── Topzi ──
    await tentar("topzi-inicio", () => page.goto(base + "/topzi/index.html"));
    await tentar("topzi-config", () => page.click("#settings-btn"));
    await fechar();
    await tentar("topzi-ajuda", () => page.click("#help-btn"));
    await fechar();
    await tentar("topzi-modos", () => page.click("#start-btn"));
    await tentar("topzi-jogadores", () => page.click("#mode-grid .mode-card >> nth=1"));
    await tentar("topzi-categorias", () => page.click("#to-lists-btn"));
    await tentar("topzi-listas", () => page.click("#lists-cats button >> nth=1"));
    await tentar("topzi-partida", () => page.click("#screen-lists .list-play >> nth=0"));
    await tentar("topzi-partida-chutes", async () => {
      for (const g of ["brasil", "pizza", "azul"]) { if (await page.isVisible("#guess")) { await page.fill("#guess", g); await page.press("#guess", "Enter"); await page.waitForTimeout(900); } }
    });
    await tentar("topzi-resultado", async () => { await page.evaluate(() => (typeof endGame === "function" ? endGame() : showResults())); await page.waitForTimeout(600); });
    await tentar("topzi-perfil", async () => { await page.evaluate(() => goHome()); await page.click("#profile-btn"); });
    await tentar("topzi-avatar", () => page.click("#profile-avatar"));
    await fechar();
    await tentar("topzi-online", async () => { await page.evaluate(() => goHome()); await page.click("#online-btn"); });
    await tentar("topzi-sala", async () => { await page.fill("#online-nick", "Arthur Henrique"); await page.click("#create-room-btn"); await page.waitForSelector("#screen-lobby:not([hidden])"); });
    await tentar("topzi-diaria", async () => { await page.evaluate(() => { localStorage.removeItem("tt:sala"); }); await page.goto(base + "/topzi/index.html"); await page.click("#daily-btn"); });

    // ── Patozi ──
    await tentar("patozi-inicio", () => page.goto(base + "/patozi/index.html"));
    await tentar("patozi-config", () => page.click("#settings-btn"));
    await fechar();
    await tentar("patozi-ajuda", () => page.click("#help-btn"));
    await fechar();
    await tentar("patozi-jogadores", () => page.click("#start-btn"));
    await tentar("patozi-guarda-roupa", () => page.click("#player-list .duck-btn >> nth=1"));
    await tentar("patozi-guarda-roupa-chapeu", () => page.click("#closet-dialog .closet-tabs button >> nth=1"));
    await fechar();
    await tentar("patozi-opcoes", () => page.evaluate(() => document.querySelectorAll("details").forEach((d) => (d.open = true))));
    await tentar("patozi-partida", () => page.click("#setup-go"));
    await tentar("patozi-chute", async () => { await page.waitForSelector("#guess", { timeout: 20000 }); await page.fill("#guess", "123456789"); await page.press("#guess", "Enter"); await page.waitForTimeout(400); });
    await tentar("patozi-revelacao", async () => {
      for (let i = 0; i < 30 && !(await page.isVisible("#reveal")); i++) {
        if (await page.isVisible("#nem-btn:not([disabled])")) await page.click("#nem-btn");
        else if (await page.isVisible("#guess")) { await page.fill("#guess", "999999999"); await page.press("#guess", "Enter"); }
        await page.waitForTimeout(500);
      }
    });
    await tentar("patozi-resultado", async () => { await page.evaluate(() => { partida.fim = true; mostrarResultado(); }); });
    await tentar("patozi-diario", async () => { await page.goto(base + "/patozi/index.html"); await page.click("#daily-btn"); });
    await tentar("patozi-perfil", async () => { await page.goto(base + "/patozi/index.html"); await page.click("#profile-btn"); });
    await tentar("patozi-online", async () => { await page.goto(base + "/patozi/index.html"); await page.click("#online-btn"); });
    await tentar("patozi-sala", async () => { const n = page.locator("#online-nick"); if (await n.count()) await n.fill("Arthur Henrique"); await page.click("#create-room-btn"); await page.waitForSelector("#screen-lobby:not([hidden])"); });

    // ── Datazi ──
    await tentar("datazi-inicio", async () => { await page.evaluate(() => localStorage.removeItem("pz:sala")); await page.goto(base + "/datazi/index.html"); });
    await tentar("datazi-config", () => page.click("#settings-btn"));
    await fechar();
    await tentar("datazi-ajuda", () => page.click("#help-btn"));
    await fechar();
    await tentar("datazi-partida", () => page.click("#daily-btn"));
    await tentar("datazi-colocou", () => page.click("#timeline .slot button >> nth=0"));
    await tentar("datazi-resultado", async () => {
      for (let i = 0; i < 12 && (await page.isVisible("#screen-game")); i++) {
        if (await page.isVisible("#game-next")) await page.click("#game-next");
        else await page.click("#timeline .slot button >> nth=-1");
        await page.waitForTimeout(150);
      }
    });
    // ── Maisoumenozi ──
    await tentar("mais-inicio", () => page.goto(base + "/maisoumenozi/index.html"));
    await tentar("mais-ajuda", () => page.click("#help-btn"));
    await fechar();
    await tentar("mais-relogio", () => page.click("#clock-btn"));
    await tentar("mais-relogio-maluca", async () => {
      await page.evaluate(() => { partida.atual = { uau: "u3", novo: true }; renderJogo(); });
      await page.click("#uau-a");
    });
    await tentar("mais-relogio-fim", async () => { await page.evaluate(() => { fimDoTempo = performance.now(); }); await page.waitForSelector("#screen-results:not([hidden])"); });
    await tentar("mais-inicio-2", () => page.click("#res-home"));
    await tentar("mais-partida", () => page.click("#daily-btn"));
    await tentar("mais-respondeu", () => page.click("#btn-up"));
    await tentar("mais-resultado", async () => {
      for (let i = 0; i < 30 && (await page.isVisible("#screen-game")); i++) {
        if (await page.isVisible("#game-next")) await page.click("#game-next").catch(() => {});
        else await page.click("#btn-down").catch(() => {});
        await page.waitForTimeout(150);
      }
    });
    // ── Cravazi ──
    await tentar("crava-inicio", () => page.goto(base + "/cravazi/index.html"));
    await tentar("crava-ajuda", () => page.click("#help-btn"));
    await fechar();
    await tentar("crava-turma", () => page.click("#together-btn"));
    await tentar("crava-oito-jogadores", async () => { for (let i = 0; i < 6; i++) await page.click("#add-player"); });
    await tentar("crava-skins", () => page.click('#players [data-skin="7"]'));
    await tentar("crava-skins-editor", () => page.click("#skin-tabs .tab-builder"));
    await tentar("crava-skins-pronta", async () => { await page.click("#skin-tabs .tab >> nth=0"); await page.click("#skin-presets [data-skin] >> nth=2"); });
    await tentar("crava-partida", () => page.click("#start-btn"));
    await tentar("crava-chutou", async () => { await page.fill("#guess", "1"); await page.click("#guess-btn"); });
    await tentar("crava-fora", async () => { await page.fill("#guess", "1"); await page.click("#guess-btn"); });
    await tentar("crava-cravou", async () => {
      await page.fill("#guess", String(await page.evaluate(() => partida.atual.pergunta.resposta)));
      await page.click("#guess-btn");
    });
    await tentar("crava-resultado", async () => {
      for (let i = 0; i < 40 && (await page.isVisible("#screen-game")); i++) {
        if (await page.isVisible("#next-btn")) await page.click("#next-btn");
        else { await page.fill("#guess", String(await page.evaluate(() => partida.atual.pergunta.resposta))); await page.click("#guess-btn"); }
      }
    });
    await tentar("crava-dia", async () => { await page.goto(base + "/cravazi/index.html"); await page.click("#daily-btn"); });
    await tentar("crava-dia-chute", async () => { await page.fill("#solo-guess", "1"); await page.click("#solo-guess-btn"); });
    await tentar("crava-dia-resultado", async () => {
      for (let i = 0; i < 20 && (await page.isVisible("#screen-solo")); i++) {
        if (await page.isVisible("#solo-next")) await page.click("#solo-next");
        else { await page.fill("#solo-guess", String(await page.evaluate(() => solo.atual.pergunta.resposta))); await page.click("#solo-guess-btn"); }
      }
    });
    await tentar("crava-online", async () => { await page.goto(base + "/cravazi/index.html"); await page.click("#online-btn"); });
    await tentar("crava-sala", async () => { await page.fill("#online-nick", "Arthur Henrique"); await page.click("#create-room-btn"); await page.waitForSelector("#screen-lobby:not([hidden])"); });
    await tentar("portal-com-nivel", async () => { await page.evaluate(() => localStorage.removeItem("cz:sala")); await page.goto(base + "/index.html"); });
    await tentar("conta-nivel", () => page.goto(base + "/conta.html"));

    await ctx.close();
  }
  await browser.close();
  server.close();
  if (erros.length) { console.log("\nErros na página:\n" + [...new Set(erros)].join("\n")); }
  console.log(falhas ? `\n${falhas} tela(s) com problema` : "\nTudo cabe na tela.");
  process.exit(falhas || erros.length ? 1 : 0);
})();
