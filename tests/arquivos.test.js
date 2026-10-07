// Todo script da página precisa existir e estar na lista do modo offline (sw.js).
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { ROOT } = require("./carregar");

const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const sw = fs.readFileSync(path.join(ROOT, "sw.js"), "utf8");
const scripts = [...html.matchAll(/<script src="([^"]+)"/g)].map((m) => m[1]);

test("os scripts da página existem", () => {
  assert.ok(scripts.length > 5);
  for (const s of scripts) assert.ok(fs.existsSync(path.join(ROOT, s)), `falta ${s}`);
});

test("o modo offline guarda todos os scripts", () => {
  for (const s of scripts) assert.ok(sw.includes(`"${s}"`), `sw.js não guarda ${s}`);
});

test("os arquivos guardados pelo modo offline existem", () => {
  const files = [...sw.matchAll(/^\s+"([^"]+)",$/gm)].map((m) => m[1]).filter((f) => f !== "./");
  for (const f of files) assert.ok(fs.existsSync(path.join(ROOT, f)), `sw.js guarda ${f}, que não existe`);
});
