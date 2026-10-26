// Teste de ponta a ponta dos jogos do kit (Emojizi, Contazi, Memorizi, Fotozi, Censurazi, Corzi): o desafio do dia tocando na tela (com o
// ranking), a partida livre até acabarem as vidas e o online em duas abas com skin (pontos, tempo, placar, volta
// para a sala e troca de anfitrião). Usa o Supabase falso de tests/supabase-falso.js. Rode com: npm run test:online
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
  const site = `http://localhost:${server.address().port}`;
  const browser = await playwright.chromium.launch(fs.existsSync("/opt/pw-browsers/chromium") ? { executablePath: "/opt/pw-browsers/chromium" } : {});
  const errors = [];
  const step = (name) => console.log("ok -", name);
  // Resposta certa e errada da rodada da vez, em cada jogo.
  const CERTA = {
    emojizi: "(r) => r.id",
    contazi: "(r) => r.resposta",
    memorizi: "(r) => r.seq",
    corzi: "(r) => r.resposta",
    censurazi: "(r) => ({ g: csCarta(r.id).txt.pt[0], n: 0 })",
    fotozi: "(r) => ({ id: r.ids[0], g: fzFoto(r.ids[0]).nome[0], n: 0 })",
  };
  const ERRADA = {
    emojizi: "(r) => r.opcoes.find((o) => o !== r.id)",
    contazi: "(r) => r.resposta + 1",
    memorizi: "(r) => r.seq.map((c) => (c + 1) % 4)",
    corzi: "(r) => r.opcoes.find((o) => o !== r.resposta)",
    censurazi: "() => ({ g: '', n: 0 })",
    fotozi: "(r) => ({ id: r.ids[0], g: '', n: 0 })",
  };

  for (const jogo of ["contazi", "emojizi", "memorizi", "corzi", "censurazi", "fotozi"]) {
    const ctx = await browser.newContext({ viewport: { width: 400, height: 860 }, serviceWorkers: "block", locale: "pt-BR" });
    await ctx.addInitScript(fs.readFileSync(path.join(__dirname, "supabase-falso.js"), "utf8"));
    // Fotozi: a Wikipédia de mentira devolve uma imagem do próprio site para cada artigo.
    await ctx.route("https://pt.wikipedia.org/**", (r) => {
      const titulos = new URL(r.request().url()).searchParams.get("titles").split("|");
      const pages = Object.fromEntries(titulos.map((t, i) => [i + 1, { title: t, thumbnail: { source: `${site}/brand/patozi-og.png` }, pageimage: `Foto_${i}.jpg` }]));
      r.fulfill({ contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify({ query: { pages } }) });
    });
    await ctx.route("**/js/config.js", (r) => r.fulfill({ contentType: "application/javascript", body: 'const SUPABASE_URL = "https://falso.supabase.co"; const SUPABASE_ANON_KEY = "x";' }));
    const page = async () => {
      const p = await ctx.newPage();
      p.on("pageerror", (e) => errors.push(jogo + ": " + e.message));
      p.on("dialog", (d) => d.accept());
      return p;
    };
    const base = `${site}/${jogo}/index.html`;
    const db = (p) => p.evaluate(() => JSON.parse(localStorage.getItem("__fakedb") || "{}"));
    const responder = (p, qual) => p.evaluate(`responderAgora((${qual})(partida.rodadas[partida.n]))`);

    // ── Desafio do dia, com o nome pedido antes e o ranking no fim ──
    const S = await page();
    await S.goto(base);
    assert.equal(await S.evaluate(() => document.body.dataset.screen), "home");
    assert.ok(await S.isVisible("#settings-btn"));
    await S.click("#daily-btn");
    await S.waitForSelector("dialog.gamezi-nome[open]");
    await S.fill("dialog.gamezi-nome input", "Nina");
    await S.click("dialog.gamezi-nome .gamezi-nome-sim");
    await S.waitForSelector("#screen-game:not([hidden])");
    for (let i = 0; i < 10; i++) {
      if (jogo === "contazi" && i === 0) {
        // Tocando no teclado da tela.
        const resp = String(await S.evaluate(() => partida.rodadas[0].resposta));
        for (const d of resp) await S.click(`#round [data-tecla="${d}"]`);
        await S.click('#round [data-tecla="ok"]');
      } else if (jogo === "emojizi" && i === 0) {
        await S.click(`#round [data-op="${await S.evaluate(() => partida.rodadas[0].id)}"]`);
      } else if (jogo === "memorizi" && i === 0) {
        // Espera a sequência acabar de acender e repete tocando nos botões.
        await S.waitForSelector("#round .pad:not([disabled])", { timeout: 8000 });
        for (const c of await S.evaluate(() => partida.rodadas[0].seq)) await S.click(`#round [data-pad="${c}"]`);
      } else if (jogo === "corzi" && i === 0) {
        await S.click(`#round [data-op="${await S.evaluate(() => partida.rodadas[0].resposta)}"]`);
      } else if (jogo === "censurazi" && i === 0) {
        // Um chute errado mostra mais uma dica; depois acerta digitando.
        await S.fill("#cs-chute", "abacaxi azul");
        await S.click("#cs-form .btn");
        assert.equal(await S.locator("#cs-dicas li").count(), 2, "o erro mostrou mais uma dica");
        await S.fill("#cs-chute", await S.evaluate(() => csCarta(partida.rodadas[0].id).txt.pt[0]));
        await S.click("#cs-form .btn");
      } else if (jogo === "fotozi" && i === 0) {
        // Um chute errado afasta a foto; depois acerta escolhendo na lista de sugestões.
        await S.waitForSelector("#fz-quadro .fz-img");
        await S.fill("#fz-chute", "zzzz");
        await S.click("#fz-form .btn");
        assert.match(await S.textContent("#fz-vale"), /80/, "o erro tirou 20 pontos");
        const nome = await S.evaluate(() => fzAtual.nome[0]);
        await S.fill("#fz-chute", nome.slice(0, 5));
        await S.click(`#fz-sug [data-nome="${nome}"]`);
      } else await responder(S, i % 3 ? CERTA[jogo] : ERRADA[jogo]);
      await S.waitForSelector("#feedback:not([hidden])");
      if (i === 0) assert.match(await S.textContent("#verdict"), /Certo!/, "tocando na tela");
      await S.click("#game-next");
    }
    await S.waitForSelector("#screen-results:not([hidden])");
    await S.waitForSelector("#leaderboard .lb-row.me");
    assert.match(await S.textContent("#leaderboard .lb-row.me"), /Nina/);
    const dia = (await db(S))[jogo + "_diario"];
    assert.equal(dia.length, 1, "o resultado foi para o ranking");
    assert.ok(dia[0].pontos >= 6 * 50 && dia[0].tempo_ms > 0);
    assert.equal(await S.locator("#res-list li").count(), 10);
    await S.click("#res-home");
    assert.match(await S.textContent("#daily-card .daily-status"), /pontos/);
    step(`${jogo}: desafio do dia tocando na tela, com o nome antes e o ranking`);

    // ── Partida livre: acaba no terceiro erro ──
    await S.click("#free-btn");
    for (let i = 0; i < 3; i++) {
      await responder(S, ERRADA[jogo]);
      await S.click("#game-next");
    }
    await S.waitForSelector("#screen-results:not([hidden])");
    assert.match(await S.textContent("#res-sub"), /0 de 3/);
    // Acabou o tempo conta como erro.
    // Tema da partida livre: a partida só traz rodadas do tema escolhido.
    const TEMA = { emojizi: ["comida", "(r) => ejItem(r.id).cat === 'comida'"], contazi: ["romanos", "(r) => /^[IVXLCDM]+$/.test(r.texto)"], memorizi: ["numeros", "(r) => r.tema === 'numeros'"], corzi: ["cor", "(r) => r.tipo === 'cor'"], censurazi: ["comida", "(r) => csCarta(r.id).tema === 'comida'"], fotozi: ["animais", "(r) => r.ids.every((id) => fzFoto(id).tema === 'animais')"] }[jogo];
    await S.click("#res-home");
    await S.click(`#free-temas [data-tema="${TEMA[0]}"]`);
    assert.equal(await S.getAttribute(`#free-temas [data-tema="${TEMA[0]}"]`, "aria-checked"), "true");
    await S.click("#free-btn");
    for (let i = 0; i < 4; i++) {
      assert.ok(await S.evaluate(`(${TEMA[1]})(partida.rodadas[partida.n])`), "rodada do tema escolhido");
      await responder(S, CERTA[jogo]);
      await S.click("#game-next");
    }
    if (jogo === "memorizi") assert.equal(await S.locator("#round .pad").count(), 9, "o tema de números tem 9 botões");
    await S.click("#game-quit");
    await S.click(`#free-temas [data-tema="${await S.evaluate(() => GZ.temas[0].id)}"]`);
    await S.click("#free-btn");
    await S.evaluate(() => { rodadaDesde -= GZ.segundos(partida.rodadas[0]) * 1000 + 50; });
    await S.waitForSelector("#feedback:not([hidden])");
    assert.equal(await S.textContent("#verdict"), "Acabou o tempo!");
    await S.click("#game-quit");
    step(`${jogo}: partida livre até errar 3 vezes, e o tempo acaba`);

    // ── Online com skin ──
    const A = S;
    await A.click("#online-btn");
    await A.fill("#online-nick", "Arthur");
    await A.click("#create-room-btn");
    await A.waitForSelector("#screen-lobby:not([hidden])");
    const code = (await A.textContent("#room-code")).trim();
    await A.evaluate(() => {
      localStorage.removeItem(GZ.prefixo + ":sala");
      localStorage.setItem(GZ.prefixo + ":nick", JSON.stringify("Lara"));
      localStorage.removeItem("gz:skin");
    });
    const B = await page();
    await B.goto(`${base}?sala=${code}`);
    await B.waitForSelector("#screen-lobby:not([hidden])");
    await A.waitForFunction(() => document.querySelectorAll("#lobby-players .lobby-player").length === 2);
    assert.equal(await A.locator("#lobby-players .gz-face").count(), 2, "skins na sala");
    assert.equal(await B.isHidden("#lobby-start"), true);
    // O anfitrião escolhe o tema da sala; a convidada vê e não muda.
    await A.click(`#lobby-temas [data-tema="${TEMA[0]}"]`);
    await B.waitForFunction((x) => document.querySelector(`#lobby-temas [data-tema="${x}"]`).getAttribute("aria-checked") === "true", TEMA[0]);
    assert.equal(await B.isDisabled(`#lobby-temas [data-tema="${TEMA[0]}"]`), true);
    // Corzi e Fotozi: o anfitrião escolhe quantas rodadas.
    const QTD = { corzi: 20, fotozi: 5 }[jogo];
    if (QTD) {
      await A.click(`#lobby-qtd [data-qtd="${QTD}"]`);
      await B.waitForFunction((x) => document.querySelector(`#lobby-qtd [data-qtd="${x}"]`).getAttribute("aria-checked") === "true", QTD);
    } else assert.equal(await A.isHidden("#lobby-qtd-box"), true);
    await A.click("#lobby-start");
    await B.waitForFunction(() => partida && partida.online && document.body.dataset.screen === "game");
    const rodadas = await A.evaluate(() => partida.rodadas.length);
    assert.equal(rodadas, QTD || 10, "quantidade de rodadas da sala");
    assert.ok(await B.evaluate(`partida.rodadas.every(${TEMA[1]})`), "partida online do tema da sala");
    assert.deepEqual(await B.evaluate(() => partida.rodadas), await A.evaluate(() => partida.rodadas), "a mesma partida nas duas");
    for (let i = 0; i < rodadas; i++) {
      if (i) {
        await A.click("#game-next");
        await B.waitForFunction((n) => partida.n === n && partida.fase === "jogando", i);
      }
      await responder(B, i === 0 ? CERTA[jogo] : ERRADA[jogo]);
      if (i === 0) {
        await A.waitForFunction(() => Object.keys(partida.respostas).length === 1);
        assert.match(await B.textContent("#sent"), /Resposta enviada/);
      }
      await responder(A, i === 0 ? ERRADA[jogo] : CERTA[jogo]);
      await A.waitForFunction(() => partida.fase === "revelado");
      if (i === 0) {
        await B.waitForFunction(() => partida.fase === "revelado");
        assert.match(await B.textContent("#verdict"), /Certo!/);
        assert.equal(await B.isHidden("#game-next"), true, "só o anfitrião segue");
        assert.equal(await A.locator("#players .gz-face").count(), 2);
      }
    }
    await A.click("#game-next");
    await A.waitForSelector("#screen-results:not([hidden])");
    await B.waitForSelector("#screen-results:not([hidden])");
    assert.equal(await B.textContent("#res-score"), "Arthur venceu!");
    assert.equal(await B.locator("#res-ranking li .gz-face").count(), 2);
    await A.waitForFunction((j) => (JSON.parse(localStorage.getItem("__fakedb"))[j + "_partidas"] || []).length === 1, jogo);
    await A.click("#res-again");
    await B.waitForSelector("#screen-lobby:not([hidden])");
    // Quem não responde não segura a rodada.
    await A.click("#lobby-start");
    await B.waitForFunction(() => partida && partida.online && partida.n === 0 && !partida.hist.length && document.body.dataset.screen === "game");
    await responder(A, CERTA[jogo]);
    await A.evaluate(() => { partida.comecou -= GZ.segundos(partida.rodadas[0]) * 1000; });
    await B.waitForFunction(() => partida.fase === "revelado");
    assert.equal(await B.textContent("#verdict"), "Não respondeu");
    await A.click("#game-quit");
    await B.waitForFunction(() => isHost(), null, { timeout: 15000 });
    step(`${jogo}: online com skin, ${rodadas} rodadas, tempo e troca de anfitrião`);
    await ctx.close();
  }

  assert.deepEqual(errors, []);
  console.log("\nJogos do kit: tudo certo");
  await browser.close();
  server.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
