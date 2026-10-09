// Teste de ponta a ponta do Cravazi: duas abas (anfitrião e convidada) jogando uma partida online inteira,
// com as skins na sala e no placar, e o Cravazi do dia (sozinho) mandando o resultado para o ranking.
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
  const base = `http://localhost:${server.address().port}/cravazi/index.html`;
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

  // Arthur escolhe a skin do Mario e cria a sala com 5 rodadas.
  const A = await page();
  await A.goto(base);
  await A.click("#online-btn");
  await A.click("#online-skin");
  await A.waitForSelector("#skin-dialog[open]");
  await A.click('#skin-tabs .tab:has-text("Games")');
  await A.click('#skin-presets [data-skin="mario"]');
  await A.fill("#online-nick", "Arthur");
  await A.click("#create-room-btn");
  await A.waitForSelector("#screen-lobby:not([hidden])");
  const code = (await A.textContent("#room-code")).trim();
  assert.match(code, /^[A-Z0-9]{5}$/);
  await A.click('#lobby-rounds [data-r="5"]');
  await A.waitForFunction(() => JSON.parse(localStorage.getItem("__fakedb")).cravazi_salas[0].settings.rodadas === 5); // rodadas salvas na sala
  step("anfitrião escolhe a skin e cria a sala " + code);

  // As abas dividem o localStorage; em celulares diferentes isso não acontece.
  await A.evaluate(() => {
    localStorage.removeItem("cz:sala");
    localStorage.setItem("cz:nick", JSON.stringify("Lara"));
    localStorage.setItem("cz:skin", JSON.stringify({ presetId: "pikachu", avatar: PRESETS.find((p) => p.id === "pikachu").cfg }));
  });
  const B = await page();
  await B.goto(`${base}?sala=${code}`);
  await B.waitForSelector("#screen-lobby:not([hidden])");
  await A.waitForFunction(() => document.querySelectorAll("#lobby-players .lobby-player").length === 2);
  const linhas = (await db(A)).cravazi_sala_jogadores;
  assert.equal(linhas.find((p) => p.nick === "Arthur").skin.presetId, "mario", "skin do anfitrião na sala");
  assert.equal(linhas.find((p) => p.nick === "Lara").skin.presetId, "pikachu", "skin da convidada na sala");
  assert.equal(await B.isHidden("#lobby-start"), true, "só o anfitrião começa");
  assert.equal(await B.isDisabled('#lobby-rounds [data-r="5"]'), true, "só o anfitrião muda as rodadas");
  step("convidada entra pelo link de convite com a própria skin");

  await A.click("#lobby-start");
  await A.waitForSelector("#screen-game:not([hidden])");
  await B.waitForSelector("#screen-game:not([hidden])");
  assert.equal(await A.textContent("#round"), "Rodada 1 de 5");
  assert.equal(await B.evaluate(() => partida.perguntas[0].id), await A.evaluate(() => partida.perguntas[0].id), "mesma pergunta nas duas");
  assert.equal(await A.locator("#score .chip .face svg").count(), 2, "placar com as skins");
  step("partida começa nas duas abas");

  // Rodada 1: Arthur começa; Lara espera a vez.
  assert.equal(await A.textContent("#turn"), "Sua vez!");
  assert.equal(await B.isVisible("#wait-msg"), true, "quem não está na vez espera");
  assert.equal(await B.isHidden("#guess-row"), true);
  await A.fill("#guess", "1");
  await A.click("#guess-btn");
  await B.waitForFunction(() => partida.atual.chutes.length === 1);
  assert.match(await B.textContent("#hint-who"), /Arthur chutou 1/);
  assert.equal(await B.textContent("#turn"), "Sua vez!");
  // Lara crava pela própria tela: o chute vai para o anfitrião, que manda o estado de volta.
  const resposta = await B.evaluate(() => partida.atual.pergunta.resposta);
  await B.fill("#guess", String(resposta));
  await B.click("#guess-btn");
  await A.waitForSelector("#nailed:not([hidden])");
  await B.waitForSelector("#nailed:not([hidden])");
  assert.equal(await A.textContent("#nailed-who"), "Lara cravou!");
  assert.equal(await A.evaluate(() => partida.jogadores[1].pontos), 1);
  step("chute da convidada passa pelo anfitrião e a rodada fecha nas duas");

  // A convidada também pode passar para a próxima rodada.
  await B.click("#next-btn");
  await A.waitForFunction(() => partida.rodada === 1);
  await B.waitForFunction(() => partida.rodada === 1 && !document.querySelector("#play").hidden);
  assert.equal(await B.textContent("#turn"), "Sua vez!", "a 2ª rodada começa com o 2º jogador");
  step("próxima rodada pela convidada");

  // As outras rodadas: quem está na vez crava.
  for (let i = 1; i < 5; i++) {
    const vezDeA = await A.evaluate(() => partida.jogadores[partida.atual.vez].id === me.id);
    const P = vezDeA ? A : B;
    await P.waitForFunction(() => !document.querySelector("#guess-row").hidden);
    await P.fill("#guess", String(await P.evaluate(() => partida.atual.pergunta.resposta)));
    await P.click("#guess-btn");
    await A.waitForSelector("#nailed:not([hidden])");
    await A.click("#next-btn");
    if (i < 4) await B.waitForFunction((n) => partida.rodada === n, i + 1);
  }
  await A.waitForSelector("#screen-results:not([hidden])");
  await B.waitForSelector("#screen-results:not([hidden])");
  assert.equal(await A.locator("#res-ranking li").count(), 2);
  assert.equal(await B.textContent("#res-again"), "Voltar para a sala");
  await A.waitForFunction(() => (JSON.parse(localStorage.getItem("__fakedb")).cravazi_partidas || []).length === 1); // partida no histórico
  assert.ok(await A.evaluate(() => partidaContada) && await B.evaluate(() => partidaContada), "a partida conta nas estatísticas dos dois");
  step("fim da partida nas duas abas, com o histórico salvo");

  // De volta para a sala; a convidada sai e o anfitrião continua lá.
  await A.click("#res-again");
  await A.waitForSelector("#screen-lobby:not([hidden])");
  await B.waitForSelector("#screen-lobby:not([hidden])");
  await B.click("#leave-room");
  await B.waitForSelector("#screen-home:not([hidden])");
  await A.waitForFunction(() => document.querySelectorAll("#lobby-players .lobby-player").length === 1);
  step("voltam para a sala e a convidada sai");

  // Cravazi do dia sozinho: o nome já é conhecido (o do online), então manda direto para o ranking.
  await B.evaluate(() => localStorage.setItem("cz:nick", JSON.stringify("Lara")));
  await B.click("#daily-btn");
  await B.waitForSelector("#screen-solo:not([hidden])");
  assert.equal(await B.textContent("#solo-kicker"), "Cravazi do dia #" + (await B.evaluate(() => czDiaNumero())));
  for (let i = 0; i < 5; i++) {
    const r = await B.evaluate(() => solo.atual.pergunta.resposta);
    if (i === 0) {
      await B.fill("#solo-guess", String(r + 1));
      await B.click("#solo-guess-btn");
      assert.match(await B.textContent("#solo-hint-big"), /É MENOS/);
    }
    await B.waitForTimeout(20);
    await B.fill("#solo-guess", String(r));
    await B.click("#solo-guess-btn");
    await B.waitForSelector("#solo-end:not([hidden])");
    await B.click("#solo-next");
  }
  await B.waitForSelector("#screen-solo-results:not([hidden])");
  assert.equal(await B.textContent("#solo-res-score"), "49 pontos");
  await B.waitForSelector("#leaderboard .lb-row.me");
  assert.match(await B.textContent("#leaderboard .lb-row.me"), /Lara/);
  const dia = (await db(B)).cravazi_diario;
  assert.equal(dia.length, 1);
  assert.equal(dia[0].pontos, 49);
  assert.ok(dia[0].tempo_ms > 0, "o tempo vai junto para desempatar");
  await B.click("#solo-res-home");
  assert.match(await B.textContent("#daily-card"), /49 de 50 pontos/);
  await B.click("#daily-card [data-dia].today");
  await B.waitForSelector("#leaderboard .lb-row.me");
  assert.equal((await db(B)).cravazi_diario.length, 1, "não manda de novo");
  step("Cravazi do dia: 49 pontos no ranking do dia, uma vez só");

  // Treino: perguntas sorteadas, sem ranking.
  await B.click("#solo-res-train");
  await B.waitForSelector("#screen-solo:not([hidden])");
  assert.equal(await B.textContent("#solo-kicker"), "Treino");
  step("treino abre sem ranking");

  // O anfitrião sai no meio da partida: a convidada assume a sala e a vez dele passa sozinha.
  await B.click("#home-btn");
  await B.evaluate(() => localStorage.removeItem("cz:sala"));
  await B.goto(`${base}?sala=${code}`);
  await A.waitForFunction(() => document.querySelectorAll("#lobby-players .lobby-player").length === 2);
  await A.click("#lobby-start");
  await B.waitForSelector("#screen-game:not([hidden])");
  await A.evaluate(() => localStorage.removeItem("cz:sala"));
  await A.click("#game-quit");
  await A.waitForSelector("#screen-home:not([hidden])");
  await B.waitForFunction(() => isHost(), null, { timeout: 15000 });
  await B.waitForFunction(() => souDaVez(), null, { timeout: 15000 });
  await B.fill("#guess", "1");
  await B.click("#guess-btn");
  assert.equal(await B.evaluate(() => partida.atual.chutes.length), 1, "a convidada, agora anfitriã, aplica o próprio chute");
  await B.waitForFunction(() => souDaVez(), null, { timeout: 15000 });
  step("anfitrião sai: a convidada assume e a vez de quem saiu passa");

  // Aparelho novo, sem nome em nenhum jogo: o desafio do dia pede o nome antes de começar (nada de
  // "Jogador" ou "Pato" no ranking). Confere no Cravazi, no Patozi e no Topzi.
  const ctx2 = await browser.newContext({ viewport: { width: 400, height: 860 }, serviceWorkers: "block", locale: "pt-BR" });
  await ctx2.addInitScript(fs.readFileSync(path.join(__dirname, "supabase-falso.js"), "utf8"));
  await ctx2.route("**/js/config.js", (r) => r.fulfill({ contentType: "application/javascript", body: 'const SUPABASE_URL = "https://falso.supabase.co"; const SUPABASE_ANON_KEY = "x";' }));
  const N = await ctx2.newPage();
  N.on("pageerror", (e) => errors.push(e.message));
  const site = base.replace("/cravazi/index.html", "");
  for (const [jogo, tela] of [["cravazi", "#screen-solo"], ["patozi", "#screen-daily"], ["topzi", "#screen-game"]]) {
    await N.goto(`${site}/${jogo}/index.html`);
    await N.waitForTimeout(300);
    await N.evaluate(() => document.querySelectorAll("dialog[open]").forEach((d) => d.close())); // "Como jogar" da primeira visita
    await N.click("#daily-btn");
    await N.waitForSelector("dialog.gamezi-nome[open]");
    assert.equal(await N.isVisible(tela), false, `${jogo}: não começa sem o nome`);
    if (jogo === "cravazi") {
      await N.fill("dialog.gamezi-nome input", "Zé");
      await N.click("dialog.gamezi-nome .gamezi-nome-sim");
      await N.waitForSelector(tela + ":not([hidden])");
      assert.equal(await N.evaluate(() => store("nick")), "Zé");
      await N.evaluate(() => localStorage.removeItem("cz:nick"));
    }
  }
  step("sem nome, o desafio do dia pede o nome antes (Cravazi, Patozi e Topzi)");
  await ctx2.close();

  assert.deepEqual(errors, [], "sem erros na página");
  await browser.close();
  server.close();
  console.log("Cravazi online e do dia: tudo certo");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
