// Regras do Fotozi, sem tela (testadas em tests/jogos-fotozi-censurazi-corzi.test.js).
// Aparece só um pedacinho bem ampliado de uma foto (um jogador, uma comida, um lugar…). A pessoa chuta o nome;
// cada chute errado (ou "abrir mais") afasta um pouco a foto e a rodada vale um pouco menos: de 100 a 30 pontos.
// As fotos são as principais dos artigos da Wikipédia em português (licença livre); o navegador busca na hora.
// Cada rodada leva duas fotos reserva do mesmo tema, para o caso de uma foto não carregar.
// Fotos novas entram no FIM de data/fotos-*.js (os ids são a ordem) e precisam de uma linha nova em
// FZ_DIARIO_POOLS valendo a partir de amanhã, para o Fotozi do dia de hoje não mudar.

const FZ_INICIO = Date.UTC(2026, 9, 26); // Fotozi do dia: o dia 1 é 26/10/2026
const FZ_SEGUNDOS = 60;
const FZ_ZOOM = [4.2, 3.4, 2.8, 2.3, 1.9, 1.55, 1.25, 1]; // quanto a foto está ampliada em cada nível (de perto, mas sem borrar)
const FZ_PONTOS = [100, 90, 80, 70, 60, 50, 40, 30]; // quanto vale acertar em cada nível
const FZ_RESERVAS = 2;
const FZ_QUANTIAS = [5, 10, 15]; // rodadas da partida online (o anfitrião escolhe)
const FZ_FOTOS = []; // { id, tema, titulo, nome: [pt, en, es], apelidos: [] }
const FZ_DIARIO_POOLS = [
  { desde: 1, fotos: 427 },
  { desde: 2, fotos: 841 }, // data/fotos-4.js e fotos-5.js (músicos, atores, história, pets, plantas, objetos…)
];
const FZ_TEMAS = ["tudo", "futebol", "famosos", "musicos", "atores", "atletas", "historia", "comidas", "frutas", "bebidas", "animais", "pets", "plantas", "lugares", "carros", "transportes", "objetos", "instrumentos", "esportes", "pinturas"];
const FZ_PESSOAS = ["futebol", "famosos", "musicos", "atores", "atletas", "historia"]; // nas fotos de gente, o pedacinho é o rosto

function fzFotos(tema, lista) {
  for (const [titulo, pt, en, es, apelidos] of lista) {
    FZ_FOTOS.push({ id: "f" + (FZ_FOTOS.length + 1), tema, titulo, nome: [pt, en || pt, es || pt], apelidos: apelidos ? apelidos.split("|") : [] });
  }
}

let fzIndice = null;
function fzFoto(id) {
  if (!fzIndice || fzIndice.size !== FZ_FOTOS.length) fzIndice = new Map(FZ_FOTOS.map((f) => [f.id, f]));
  return fzIndice.get(id) || null;
}

function fzDoTema(tema) {
  return !tema || tema === "tudo" ? FZ_FOTOS : FZ_FOTOS.filter((f) => f.tema === tema);
}

// Ponto de reserva do pedacinho ampliado (em % da foto), quando a tela não consegue achar a parte com mais detalhe
// (js/app.js, fzFocoDetalhe). Sempre o mesmo para a mesma foto.
function fzFoco(foto) {
  let h = 0;
  for (const c of foto.id + foto.titulo) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const rnd = gzRng(h);
  const gente = FZ_PESSOAS.includes(foto.tema);
  return gente ? { x: 50, y: 30 } : { x: Math.round(32 + rnd() * 36), y: Math.round(30 + rnd() * 40) };
}

function fzNormal(s) {
  return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\(.*?\)/g, "").replace(/[^a-z0-9]/g, "");
}

function fzDistancia(a, b) {
  if (Math.abs(a.length - b.length) > 2) return 3;
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  }
  return d[a.length][b.length];
}

// Todos os jeitos aceitos de escrever a resposta (nos 3 idiomas e os apelidos), já normalizados.
function fzAceitos(foto) {
  return [...new Set([...foto.nome, ...foto.apelidos].map(fzNormal).filter(Boolean))];
}

// O chute bate com a foto? Perdoa acento, maiúscula e um ou dois errinhos de digitação em nomes compridos.
function fzAcertou(foto, chute) {
  const g = fzNormal(chute);
  if (!g) return false;
  return fzAceitos(foto).some((a) => g === a || (a.length >= 6 && fzDistancia(g, a) <= (a.length >= 10 ? 2 : 1)));
}

// Uma rodada: a foto e as reservas (do mesmo tema), na ordem de tentar.
function fzRodada(foto, rnd, fotos = FZ_FOTOS) {
  const reservas = gzEmbaralhar(fotos.filter((f) => f.tema === foto.tema && f.id !== foto.id), rnd).slice(0, FZ_RESERVAS).map((f) => f.id);
  return { ids: [foto.id, ...reservas] };
}

function fzSortear(n, rnd, fotos = FZ_FOTOS) {
  return gzEmbaralhar(fotos, rnd).slice(0, n).map((f) => fzRodada(f, rnd, fotos));
}

function fzDiario(dia) {
  const pool = FZ_DIARIO_POOLS.filter((p) => p.desde <= Math.max(dia, 1)).pop();
  return fzSortear(GZ_DIARIO_QTD, gzRng(dia * 7919 + 71), FZ_FOTOS.slice(0, pool.fotos));
}

// Partida livre: as fotos do tema embaralhadas, sem repetir até dar a volta.
function fzLivre(tema = "tudo", rnd = Math.random) {
  const fotos = fzDoTema(tema);
  let fila = [];
  return () => {
    if (!fila.length) fila = gzEmbaralhar(fotos, rnd);
    return fzRodada(fila.pop(), rnd);
  };
}

function fzOnline(tema = "tudo", qtd = 10, rnd = Math.random) {
  return fzSortear(FZ_QUANTIAS.includes(qtd) ? qtd : 10, rnd, fzDoTema(tema));
}

// Resposta: { id: a foto que apareceu, g: o chute certo, n: o nível da foto (0 a 7) }. A tela só manda quando acerta
// (ou com g vazio, quando a pessoa desiste).
function fzValida(r, v) {
  return !!v && typeof v === "object" && r.ids.includes(v.id) && typeof v.g === "string" && v.g.length <= 60 && Number.isInteger(v.n) && v.n >= 0 && v.n < FZ_PONTOS.length;
}

function fzAvaliar(r, v) {
  const certo = fzValida(r, v) && fzAcertou(fzFoto(v.id), v.g);
  return { certo, pontos: certo ? FZ_PONTOS[v.n] : 0 };
}
