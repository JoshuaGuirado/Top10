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
  for (const s of scripts) assert.ok(sw.includes(`"topzi/${s}"`), `sw.js não guarda topzi/${s}`);
});

test("os arquivos guardados pelo modo offline existem", () => {
  const files = [...sw.matchAll(/^\s+"([^"]+)",$/gm)].map((m) => m[1]).filter((f) => f !== "./");
  for (const f of files) assert.ok(fs.existsSync(path.join(SITE, f)), `sw.js guarda ${f}, que não existe`);
});
