// Gera gamezi-classicas.js a partir dos MIDIs do Mutopia Project (baixados pelo robô .github/workflows/classicas-midi.yml
// em ferramentas/classicas/midi/). Lê as notas de cada MIDI (leitor próprio, sem programa de fora), corta num fim de
// compasso perto de MAX_SEG segundos e grava tudo compactado. Os dados de cada música (nome, autor, licença da partitura
// digitada) ficam em ferramentas/classicas/musicas.json.
// Rode: node ferramentas/classicas/gerar.js
const fs = require("fs");
const path = require("path");

const PASTA = __dirname;
const MAX_SEG = 240; // até 4 minutos por música
const musicas = JSON.parse(fs.readFileSync(path.join(PASTA, "musicas.json"), "utf8"));

// ───────────── leitor de MIDI (Standard MIDI File) ─────────────
function lerMidi(buf) {
  let p = 0;
  const u32 = () => { const v = buf.readUInt32BE(p); p += 4; return v; };
  const u16 = () => { const v = buf.readUInt16BE(p); p += 2; return v; };
  const vlq = () => { let v = 0, b; do { b = buf[p++]; v = (v << 7) | (b & 0x7f); } while (b & 0x80); return v; };
  if (buf.toString("ascii", 0, 4) !== "MThd") throw new Error("não é MIDI");
  p = 4;
  const tamHeader = u32();
  u16(); // formato
  const ntracks = u16();
  const divisao = u16();
  if (divisao & 0x8000) throw new Error("MIDI com tempo SMPTE não suportado");
  p = 8 + tamHeader;
  const notas = [], tempos = [], compassos = [];
  for (let t = 0; t < ntracks; t++) {
    if (buf.toString("ascii", p, p + 4) !== "MTrk") throw new Error("trilha inválida");
    p += 4;
    const fim = u32() + p;
    let tick = 0, status = 0;
    const abertas = {};
    while (p < fim) {
      tick += vlq();
      let b = buf[p];
      if (b & 0x80) { status = b; p++; } else b = status; // running status
      const tipo = status & 0xf0;
      if (status === 0xff) {
        const meta = buf[p++];
        const len = vlq();
        if (meta === 0x51) tempos.push({ tick, us: (buf[p] << 16) | (buf[p + 1] << 8) | buf[p + 2] });
        if (meta === 0x58) compassos.push({ tick, num: buf[p], den: 2 ** buf[p + 1] });
        p += len;
      } else if (status === 0xf0 || status === 0xf7) {
        p += vlq();
      } else if (tipo === 0x90 || tipo === 0x80) {
        const nota = buf[p++], vel = buf[p++];
        const chave = (status & 0x0f) * 128 + nota;
        if (tipo === 0x90 && vel > 0) {
          (abertas[chave] = abertas[chave] || []).push({ tick, vel });
        } else if (abertas[chave] && abertas[chave].length) {
          const a = abertas[chave].shift();
          notas.push({ ini: a.tick, fim: tick, nota, vel: a.vel });
        }
      } else if (tipo === 0xc0 || tipo === 0xd0) {
        p += 1;
      } else {
        p += 2;
      }
    }
    p = fim;
  }
  // ticks → segundos, com as mudanças de andamento
  tempos.sort((a, b) => a.tick - b.tick);
  const mapa = [{ tick: 0, seg: 0, us: 500000 }];
  for (const tp of tempos) {
    const ult = mapa[mapa.length - 1];
    const seg = ult.seg + ((tp.tick - ult.tick) * ult.us) / divisao / 1e6;
    if (tp.tick === ult.tick) ult.us = tp.us;
    else mapa.push({ tick: tp.tick, seg, us: tp.us });
  }
  const seg = (tick) => {
    let m = mapa[0];
    for (const x of mapa) if (x.tick <= tick) m = x; else break;
    return m.seg + ((tick - m.tick) * m.us) / divisao / 1e6;
  };
  // fins de compasso (para cortar num lugar natural)
  compassos.sort((a, b) => a.tick - b.tick);
  if (!compassos.length || compassos[0].tick > 0) compassos.unshift({ tick: 0, num: 4, den: 4 });
  const ultimoTick = Math.max(...notas.map((n) => n.fim));
  const barras = [];
  for (let i = 0; i < compassos.length; i++) {
    const c = compassos[i], fimC = i + 1 < compassos.length ? compassos[i + 1].tick : ultimoTick;
    const tam = (divisao * 4 * c.num) / c.den;
    for (let t = c.tick; t < fimC; t += tam) barras.push(seg(t));
  }
  barras.push(seg(ultimoTick));
  return { notas: notas.map((n) => ({ s: seg(n.ini), d: seg(n.fim) - seg(n.ini), n: n.nota, v: n.vel })), barras };
}

// ───────────── compactação: base 64 com números de tamanho variável ─────────────
const ALFA = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
function codificar(notas) {
  // cada nota: espera desde a nota anterior e duração (centésimos de segundo), altura e força (0 a 7)
  let txt = "", antes = 0;
  const num = (v) => { do { let s = v & 31; v >>= 5; if (v) s |= 32; txt += ALFA[s]; } while (v); };
  for (const x of notas) {
    const ini = Math.round(x.s * 100);
    num(ini - antes);
    num(Math.min(800, Math.max(1, Math.round(x.d * 100))));
    num(x.n - 21);
    num(Math.min(7, Math.floor(x.v / 16)));
    antes = ini;
  }
  return txt;
}

// ───────────── gera o arquivo ─────────────
const saida = [];
for (const m of musicas) {
  const pasta = path.join(PASTA, "midi");
  let arqs = [];
  if (fs.existsSync(path.join(pasta, m.id + ".mid"))) arqs = [path.join(pasta, m.id + ".mid")];
  else if (fs.existsSync(path.join(pasta, m.id))) arqs = fs.readdirSync(path.join(pasta, m.id)).filter((f) => /\.midi?$/i.test(f)).sort().map((f) => path.join(pasta, m.id, f));
  if (m.arquivo) arqs = arqs.filter((a) => path.basename(a) === m.arquivo);
  if (!arqs.length) { console.log("sem MIDI:", m.id); continue; }
  const lido = lerMidi(fs.readFileSync(arqs[0]));
  let notas = lido.notas.filter((x) => x.n >= 21 && x.n <= 108).sort((a, b) => a.s - b.s || a.n - b.n);
  const comeco = notas.length ? notas[0].s : 0;
  notas.forEach((x) => (x.s -= comeco));
  // corta no último fim de compasso antes de MAX_SEG
  const total = Math.max(...notas.map((x) => x.s + x.d));
  let corte = total;
  if (total > MAX_SEG + 20) {
    corte = Math.max(...lido.barras.map((b) => b - comeco).filter((b) => b <= MAX_SEG && b > 30));
    notas = notas.filter((x) => x.s < corte - 0.01);
  }
  saida.push({ ...m, duracao: Math.round(Math.min(total, corte)), notas: codificar(notas), qtd: notas.length });
  console.log(m.id.padEnd(22), String(notas.length).padStart(5), "notas", Math.round(Math.min(total, corte)) + " s", total > corte ? `(de ${Math.round(total)} s)` : "");
}

const linhas = saida.map((m) => "  " + JSON.stringify({ id: m.id, autor: m.autor, nome: m.nome, fonte: m.fonte, duracao: m.duracao, notas: m.notas }));
fs.writeFileSync(path.join(PASTA, "..", "..", "gamezi-classicas.js"),
`// Gerado por ferramentas/classicas/gerar.js (não edite à mão): as músicas da faixa "Clássicas" da música de fundo.
// Só obras em DOMÍNIO PÚBLICO (compositor morto há mais de 70 anos ou melodia tradicional), com as notas tiradas das
// partituras livres do Mutopia Project (www.mutopiaproject.org). Em "fonte": quem digitou a partitura e a licença dela;
// as partituras em Creative Commons pedem o crédito, e os dados tirados delas seguem a mesma licença.
// "notas": cada nota em base 64 (espera desde a anterior e duração em centésimos de segundo, altura e força).
window.GZ_CLASSICAS = [
${linhas.join(",\n")},
];
`);
console.log(saida.length, "músicas gravadas em gamezi-classicas.js");
