// Todo script do Topzi precisa existir e estar na lista do modo offline (sw.js, na raiz do Gamezi).
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { ROOT, SITE } = require("./carregar");

const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const sw = fs.readFileSync(path.join(SITE, "sw.js"), "utf8");
const scripts = [...html.matchAll(/<script src="([^"]+)"/g)].map((m) => m[1]);

test("os scripts da página existem", () => {
  assert.ok(scripts.length > 5);
  for (const s of scripts) assert.ok(fs.existsSync(path.join(ROOT, s)), `falta ${s}`);
});

test("o modo offline guarda todos os scripts", () => {
  for (const s of scripts) {
    const noSite = path.posix.normalize("topzi/" + s);
    assert.ok(sw.includes(`"${noSite}"`), `sw.js não guarda ${noSite}`);
  }
});

test("conta do Gamezi: a página e o script existem e estão no modo offline", () => {
  const conta = fs.readFileSync(path.join(SITE, "conta.html"), "utf8");
  for (const s of [...conta.matchAll(/<script src="([^"]+)"/g)].map((m) => m[1])) {
    assert.ok(fs.existsSync(path.join(SITE, s)), `conta.html usa ${s}, que não existe`);
  }
  for (const f of ["conta.html", "gamezi-conta.js"]) assert.ok(sw.includes(`"${f}"`), `sw.js não guarda ${f}`);
  const portal = fs.readFileSync(path.join(SITE, "index.html"), "utf8");
  assert.ok(portal.includes('src="gamezi-conta.js"'), "o portal lê a conta do Gamezi");
});

test("os arquivos guardados pelo modo offline existem", () => {
  const files = [...sw.matchAll(/^\s+"([^"]+)",$/gm)].map((m) => m[1]).filter((f) => f !== "./");
  for (const f of files) assert.ok(fs.existsSync(path.join(SITE, f)), `sw.js guarda ${f}, que não existe`);
});
