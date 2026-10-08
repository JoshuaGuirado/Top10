// Gera supabase/patozi-respostas.sql com a resposta de cada carta do Patozi, para o banco calcular os pontos
// do Pato do dia (patozi_registrar_diario). Rode depois de adicionar cartas: node supabase/gerar-respostas.js
// e depois rode o arquivo gerado no Supabase (SQL Editor). O teste tests/patozi.test.js avisa se faltar.
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const PASTA = path.join(__dirname, "..", "patozi");
const html = fs.readFileSync(path.join(PASTA, "index.html"), "utf8");
const ctx = vm.createContext({});
for (const s of [...html.matchAll(/<script src="(data\/[^"]+)"/g)].map((m) => m[1])) {
  vm.runInContext(fs.readFileSync(path.join(PASTA, s), "utf8"), ctx);
}
const cartas = vm.runInContext("PZ_CARTAS", ctx);

function gerarSql() {
  const linhas = [];
  for (let i = 0; i < cartas.length; i += 8) {
    linhas.push("  " + cartas.slice(i, i + 8).map((c) => `('${c.id}',${c.resposta})`).join(","));
  }
  return `-- Respostas das cartas do Patozi (${cartas.length}), para o banco calcular os pontos do Pato do dia.
-- Gerado por supabase/gerar-respostas.js. Pode rodar de novo: atualiza o que mudou.
insert into public.patozi_respostas (carta, resposta) values
${linhas.join(",\n")}
on conflict (carta) do update set resposta = excluded.resposta;
`;
}

module.exports = { gerarSql };
if (require.main === module) {
  fs.writeFileSync(path.join(__dirname, "patozi-respostas.sql"), gerarSql());
  console.log(`patozi-respostas.sql: ${cartas.length} cartas`);
}
