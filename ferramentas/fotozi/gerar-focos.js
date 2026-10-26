// Gera fotozi/data/focos.js a partir da conferência das fotos:
//  - ferramentas/fotozi/fotos.json: o que o robô do GitHub Actions achou (verificar.py): arquivo da foto e ponto do
//    zoom (o rosto, nas fotos de gente; o assunto principal, nas outras), em % da foto inteira;
//  - ferramentas/fotozi/revisao.json: a revisão a olho das folhas de conferência. Para cada id, ou
//    { "foco": "C2" } / { "foco": [x, y] } (onde o zoom deve começar: célula da grade A–E × 1–5 ou % da foto),
//    ou { "fora": "motivo" } (foto estranha ou sem sentido: sai do sorteio).
// Rode: node ferramentas/fotozi/gerar-focos.js
const fs = require("fs");
const path = require("path");

const pasta = __dirname;
const fotos = JSON.parse(fs.readFileSync(path.join(pasta, "fotos.json"), "utf8"));
const revisao = fs.existsSync(path.join(pasta, "revisao.json")) ? JSON.parse(fs.readFileSync(path.join(pasta, "revisao.json"), "utf8")) : {};

function celula(c) {
  const m = /^([A-E])([1-5])$/.exec(String(c).toUpperCase());
  if (!m) throw new Error("célula inválida: " + c);
  return ["ABCDE".indexOf(m[1]) * 20 + 10, (Number(m[2]) - 1) * 20 + 10];
}

const focos = {};
const fora = [];
for (const [id, f] of Object.entries(fotos)) {
  const r = revisao[id] || {};
  if (r.fora || f.erro) {
    fora.push([id, r.fora || f.erro]);
    continue;
  }
  const p = r.foco ? (Array.isArray(r.foco) ? r.foco : celula(r.foco)) : f.foco;
  focos[id] = [f.arquivo, Math.round(p[0] * 10) / 10, Math.round(p[1] * 10) / 10];
}
for (const id of Object.keys(revisao)) if (!fotos[id]) throw new Error("revisão de foto que não existe: " + id);

const linhas = Object.entries(focos).map(([id, v]) => `FZ_FOCOS.${id} = ${JSON.stringify(v)};`);
const saida = `// Gerado por ferramentas/fotozi/gerar-focos.js (não edite à mão): onde o zoom começa em cada foto, conferido a olho.
// FZ_FOCOS.id = [arquivo da foto na Wikipédia, x, y] em % da foto inteira (nas fotos de gente, o rosto).
// FZ_FORA: fotos estranhas, sem sentido ou sem foto no artigo, fora do sorteio.
${linhas.join("\n")}
${fora.map(([id, motivo]) => `FZ_FORA.add(${JSON.stringify(id)}); // ${String(motivo).replace(/\n/g, " ")}`).join("\n")}
`;
fs.writeFileSync(path.join(__dirname, "..", "..", "fotozi", "data", "focos.js"), saida);
console.log(Object.keys(focos).length, "focos,", fora.length, "fora");
