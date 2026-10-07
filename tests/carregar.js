// Carrega os scripts do jogo (que são scripts comuns de navegador) num contexto do Node.
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..");

function carregar(...arquivos) {
  const ctx = vm.createContext({ console });
  for (const f of arquivos) vm.runInContext(fs.readFileSync(path.join(ROOT, f), "utf8"), ctx, { filename: f });
  // Constantes e funções de nível superior ficam acessíveis por expressão.
  return (expr) => vm.runInContext(expr, ctx);
}

const DADOS = ["data/listas.js", "data/listas-mais.js", "data/listas-grandes.js", "data/listas-grandes-2.js", "data/listas-extra.js", "data/listas-grandes-3.js"];

module.exports = { carregar, DADOS, ROOT };
