// Carrega os scripts do jogo (que são scripts comuns de navegador) num contexto do Node.
const fs = require("fs");
const path = require("path");
const vm = require("vm");

// Pasta do jogo Topzi (o Gamezi, na raiz, é a plataforma que lista os jogos).
const ROOT = path.join(__dirname, "..", "topzi");
const SITE = path.join(__dirname, "..");

function carregar(...arquivos) {
  const ctx = vm.createContext({ console });
  for (const f of arquivos) vm.runInContext(fs.readFileSync(path.join(ROOT, f), "utf8"), ctx, { filename: f });
  // Constantes e funções de nível superior ficam acessíveis por expressão.
  return (expr) => vm.runInContext(expr, ctx);
}

const DADOS = ["data/listas.js", "data/listas-mais.js", "data/listas-grandes.js", "data/listas-grandes-2.js", "data/listas-extra.js", "data/listas-grandes-3.js", "data/listas-populares.js", "data/listas-n1.js", "data/listas-n2.js", "data/listas-n3.js", "data/listas-n4.js", "data/listas-n5.js", "data/listas-n6.js", "data/listas-n7.js", "data/listas-n8.js", "data/listas-n9.js", "data/traducoes.js", "data/traducoes-titulos.js", "data/traducoes-itens-1.js", "data/traducoes-itens-2.js", "data/traducoes-itens-3.js", "data/traducoes-itens-4.js", "data/traducoes-itens-5.js", "data/traducoes-itens-6.js", "data/traducoes-itens-7.js", "data/traducoes-itens-8.js", "data/traducoes-itens-9.js", "data/traducoes-itens-10.js", "data/traducoes-n1.js", "data/traducoes-n2.js", "data/traducoes-n3.js", "data/traducoes-n4.js", "data/traducoes-n5.js", "data/traducoes-n6.js", "data/traducoes-n7.js", "data/traducoes-n8.js", "data/traducoes-n9.js"];

module.exports = { carregar, DADOS, ROOT, SITE };
