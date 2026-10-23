// Motor de rodadas dos jogos novos do Gamezi (Emojizi, Contazi, Memorizi), sem tela (testado em tests/jogos-novos.test.js).
// Todo jogo é uma sequência de rodadas: aparece uma pergunta, a pessoa responde dentro do tempo e ganha pontos
// (acertou: de 50 a 100, quanto mais rápido, mais; errou ou acabou o tempo: 0). Cada jogo diz como são as rodadas
// e como avaliar uma resposta; o resto (desafio do dia, partida livre com vidas e online) é igual para todos.

const GZ_PONTOS_MIN = 50; // acertou no último segundo
const GZ_PONTOS_MAX = 100; // acertou na hora
const GZ_DIARIO_QTD = 10; // rodadas do desafio do dia e de cada partida online
const GZ_VIDAS = 3; // partida livre: até errar 3 vezes
const GZ_MAX_JOGADORES = 10;

function gzRng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gzEmbaralhar(lista, rnd = Math.random) {
  const a = lista.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function gzInteiro(min, max, rnd = Math.random) {
  return min + Math.floor(rnd() * (max - min + 1));
}

// Número do desafio do dia (inicio: Date.UTC do dia 1).
function gzDiaNumero(inicio, d = new Date()) {
  return Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - inicio) / 864e5) + 1;
}

// Pontos de um acerto pelo tempo que levou (ms) dentro do limite da rodada (segundos).
function gzPontosTempo(ms, segundos) {
  const k = Math.max(0, Math.min(1, 1 - (Number(ms) || 0) / (segundos * 1000)));
  return GZ_PONTOS_MIN + Math.round((GZ_PONTOS_MAX - GZ_PONTOS_MIN) * k);
}

// ───────────── sozinho ─────────────
// rodadas: lista pronta (desafio do dia); proxima: gerador de rodadas sem fim (partida livre, que acaba nas vidas).

function gzNovaPartida({ rodadas = [], proxima = null, vidas = 0 }) {
  const s = { rodadas: rodadas.slice(), proxima, n: 0, respostas: [], pontos: 0, acertos: 0, vidas, vidasMax: vidas, fim: false };
  if (!s.rodadas.length && proxima) s.rodadas.push(proxima());
  s.fim = !s.rodadas.length;
  return s;
}

// Responde a rodada da vez (v = null: acabou o tempo). avaliar(rodada, v, ms) → { certo, pontos }.
function gzResponder(s, v, ms, avaliar) {
  if (s.fim || s.respostas.length > s.n) return null;
  const r = v === null || v === undefined ? { certo: false, pontos: 0 } : avaliar(s.rodadas[s.n], v, ms);
  const resp = { v: v === undefined ? null : v, ms: Math.round(ms), certo: !!r.certo, pontos: r.certo ? r.pontos : 0 };
  s.respostas.push(resp);
  s.pontos += resp.pontos;
  if (resp.certo) s.acertos += 1;
  else if (s.vidasMax) s.vidas -= 1;
  return resp;
}

// Próxima rodada (depois de responder). Devolve true se a partida acabou.
function gzProxima(s) {
  if (s.fim || s.respostas.length <= s.n) return s.fim;
  s.n += 1;
  if (s.vidasMax && s.vidas <= 0) s.fim = true;
  else if (s.n >= s.rodadas.length) {
    if (s.proxima) s.rodadas.push(s.proxima());
    else s.fim = true;
  }
  return s.fim;
}

// ───────────── online: todo mundo responde a mesma rodada ─────────────
// Estado (o anfitrião roda e manda inteiro pelo Realtime): jogadores [{ id, nome, skin, pontos }], rodadas, n,
// fase ("jogando" ou "revelado"), respostas { id: { v, ms } }, ganhos { id: pontos }, hist, fim, seq e comecou.

function gzNovaOnline({ jogadores, rodadas, agora = Date.now() }) {
  return {
    v: 1, online: true, jogadores: jogadores.slice(0, GZ_MAX_JOGADORES).map((j) => ({ id: j.id, nome: j.nome, skin: j.skin || null, pontos: 0 })),
    rodadas, n: 0, fase: "jogando", respostas: {}, ganhos: {}, hist: [], fim: false, seq: 1, comecou: agora,
  };
}

// Resposta de um jogador (só a primeira vale). valida(rodada, v) diz se a resposta serve para a rodada.
function gzOnlineResponder(s, id, v, ms, valida) {
  if (s.fim || s.fase !== "jogando" || !s.jogadores.some((j) => j.id === id) || id in s.respostas) return false;
  if (!valida(s.rodadas[s.n], v)) return false;
  s.respostas[id] = { v, ms: Math.max(0, Math.round(Number(ms) || 0)) };
  s.seq += 1;
  return true;
}

function gzOnlineTodos(s, ids) {
  return ids.every((id) => id in s.respostas);
}

function gzOnlineRevelar(s, avaliar) {
  if (s.fim || s.fase !== "jogando") return false;
  const r = s.rodadas[s.n];
  s.ganhos = {};
  for (const [id, resp] of Object.entries(s.respostas)) {
    const a = avaliar(r, resp.v, resp.ms);
    s.ganhos[id] = a.certo ? a.pontos : 0;
    s.jogadores.find((j) => j.id === id).pontos += s.ganhos[id];
  }
  s.hist.push({ r, respostas: { ...s.respostas }, ganhos: { ...s.ganhos } });
  s.fase = "revelado";
  s.seq += 1;
  return true;
}

// Próxima rodada (depois de revelar). Devolve true se a partida acabou.
function gzOnlineProxima(s, agora = Date.now()) {
  if (s.fase !== "revelado" || s.fim) return false;
  s.n += 1;
  s.seq += 1;
  if (s.n >= s.rodadas.length) {
    s.fim = true;
    return true;
  }
  s.fase = "jogando";
  s.respostas = {};
  s.ganhos = {};
  s.comecou = agora;
  return false;
}

// Classificação: mais pontos primeiro; empate fica junto (mesma posição).
function gzPlacar(s) {
  const ord = s.jogadores.map((j, i) => ({ id: j.id, nome: j.nome, skin: j.skin, pontos: j.pontos, i })).sort((a, b) => b.pontos - a.pontos || a.i - b.i);
  ord.forEach((j, k) => (j.pos = k && ord[k - 1].pontos === j.pontos ? ord[k - 1].pos : k + 1));
  return ord;
}
