// Fotozi na tela: a foto bem ampliada, o campo do chute com sugestões e os botões de abrir mais ou desistir.
// As fotos vêm da Wikipédia em português (a foto principal de cada artigo, de licença livre), buscadas na hora pelo
// navegador; se uma não carregar, a rodada usa a reserva. As telas comuns são de ../gamezi-kit.js; as regras, de js/jogo.js.

const FZ_API = "https://pt.wikipedia.org/w/api.php";
const FZ_TAMANHO = 2560; // largura pedida para a foto (bem maior que a tela, para não borrar com o zoom)
// Imagem de artigo que não é foto do assunto: assinatura, mapa, brasão, bandeira, logo, diagrama…
const FZ_NAO_FOTO = /(signature|assinatura|firma|autograph|map|mapa|locator|location|coat[_ ]of[_ ]arms|bras[aã]o|escudo|flag|bandeira|logo|emblem|diagram|diagrama|icon|chart|grafico|gr[aá]fico)/i;
const FZ_NOMES_TEMAS = {
  tudo: ["Tudo", "Everything", "Todo"],
  futebol: ["Jogadores de futebol", "Soccer players", "Futbolistas"],
  famosos: ["Famosos", "Famous people", "Famosos"],
  atletas: ["Atletas", "Athletes", "Atletas"],
  comidas: ["Comidas", "Food", "Comidas"],
  frutas: ["Frutas", "Fruit", "Frutas"],
  animais: ["Animais", "Animals", "Animales"],
  lugares: ["Lugares e monumentos", "Places & landmarks", "Lugares y monumentos"],
  carros: ["Carros", "Cars", "Autos"],
  instrumentos: ["Instrumentos musicais", "Musical instruments", "Instrumentos musicales"],
  musicos: ["Cantores e músicos", "Singers & musicians", "Cantantes y músicos"],
  atores: ["Atores e atrizes", "Actors & actresses", "Actores y actrices"],
  historia: ["Gente da história", "Historical figures", "Personajes históricos"],
  pets: ["Cachorros e pets", "Dogs & pets", "Perros y mascotas"],
  plantas: ["Flores e plantas", "Flowers & plants", "Flores y plantas"],
  objetos: ["Objetos", "Objects", "Objetos"],
  esportes: ["Esportes", "Sports", "Deportes"],
  bebidas: ["Bebidas", "Drinks", "Bebidas"],
  transportes: ["Transportes", "Transport", "Transportes"],
  pinturas: ["Pinturas famosas", "Famous paintings", "Pinturas famosas"],
};

const fzCache = new Map(); // título → Promise<{ src, arquivo, pagina } | null>
const fzEscolhida = new Map(); // ids da rodada → id da foto que apareceu
const fzFocos = new Map(); // endereço da foto → ponto com mais detalhe { x, y } (em %), achado na hora
const fzDims = new Map(); // endereço da foto → [largura, altura]
let fzN = 0; // nível da foto na rodada da vez (0 = bem ampliada)
let fzAtual = null; // foto da rodada da vez
let fzResponder = null;
let fzVez = 0; // muda a cada rodada desenhada (para ignorar respostas atrasadas da busca)

// Busca na Wikipédia as fotos de vários artigos de uma vez (até 50 por pedido).
function fzBuscar(titulos) {
  const faltam = [...new Set(titulos)].filter((t) => !fzCache.has(t));
  for (let i = 0; i < faltam.length; i += 50) {
    const lote = faltam.slice(i, i + 50);
    const url = `${FZ_API}?action=query&format=json&origin=*&redirects=1&prop=pageimages|pageprops&ppprop=disambiguation&piprop=thumbnail|name|original&pithumbsize=${FZ_TAMANHO}&titles=${encodeURIComponent(lote.join("|"))}`;
    const pedido = fetch(url).then((r) => r.json()).then((d) => {
      const q = (d && d.query) || {};
      const vira = new Map();
      for (const x of q.normalized || []) vira.set(x.from, x.to);
      for (const x of q.redirects || []) vira.set(x.from, x.to);
      const paginas = new Map(Object.values(q.pages || {}).map((p) => [p.title, p]));
      const res = new Map();
      for (const t of lote) {
        let nome = t;
        for (let k = 0; k < 3 && vira.has(nome); k++) nome = vira.get(nome);
        const p = paginas.get(nome);
        // Só foto de verdade: nada de página de desambiguação, desenho (svg/png/gif), mapa, assinatura ou foto pequena.
        const th = p && p.thumbnail;
        const larg = th ? Math.max(th.width || 0, (p.original && p.original.width) || 0) : 0;
        const ok = th && th.source && p.pageimage && !(p.pageprops && "disambiguation" in p.pageprops) &&
          !/\.(svg|png|gif|tiff?)$/i.test(p.pageimage) && !FZ_NAO_FOTO.test(p.pageimage) && (!larg || larg >= 600) &&
          (!th.width || !th.height || (th.width / th.height < 2.6 && th.height / th.width < 2.6));
        res.set(t, ok ? { src: th.source, arquivo: p.pageimage, pagina: nome } : null);
      }
      return res;
    }).catch(() => new Map());
    for (const t of lote) fzCache.set(t, pedido.then((m) => m.get(t) || null));
  }
}

// Carrega a foto e já acha o ponto com mais detalhe dela (onde o zoom começa).
// Se o servidor não deixar ler os pixels (CORS), carrega de novo do jeito comum e fica com o ponto de reserva.
const fzSemCors = new Set();
function fzCarregarImagem(src, cors = true, gente = false) {
  return new Promise((ok) => {
    const img = new Image();
    if (cors) img.crossOrigin = "anonymous";
    img.onload = () => {
      fzDims.set(src, [img.naturalWidth, img.naturalHeight]);
      if (cors && !fzFocos.has(src)) fzFocos.set(src, gente ? fzFocoRosto(img) : fzFocoDetalhe(img));
      if (!cors) fzSemCors.add(src);
      ok(true);
    };
    img.onerror = () => (cors ? fzCarregarImagem(src, false, gente).then(ok) : ok(false));
    img.src = src;
  });
}

// A parte da foto (como ela aparece no quadro 4:5, cortada pelo meio) com mais detalhe: divide em quadradinhos, mede
// quanto a cor muda dentro de cada um e escolhe o mais "cheio" longe da borda. Num rosto cai nos olhos e na boca; numa
// comida, na comida; num prédio, nas janelas. Céu, parede e fundo liso ficam de fora. null se não der para ler a foto.
// Pixels da foto do jeito que ela aparece no quadro 4:5 (cortada pelo meio), numa grade pequena.
function fzPixels(img, W, H) {
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d", { willReadFrequently: true });
  const iw = img.naturalWidth, ih = img.naturalHeight;
  const esc = Math.max(W / iw, H / ih);
  const sw = W / esc, sh = H / esc;
  g.drawImage(img, (iw - sw) / 2, (ih - sh) / 2, sw, sh, 0, 0, W, H);
  return g.getImageData(0, 0, W, H).data;
}

// Foto de gente: o rosto. Procura as manchas de cor de pele da foto e fica com a do rosto: grande, alta (mãos e braços
// ficam mais embaixo) e com detalhe dentro (olhos, boca); parede bege lisa não conta. Devolve o meio do alto dela.
// Sem pele à vista (foto em preto e branco, por exemplo), fica no lugar do rosto num retrato: no meio, um pouco acima.
const FZ_ROSTO_PADRAO = { x: 50, y: 30 };
function fzFocoRosto(img) {
  try {
    const W = 60, H = 75, G = 5;
    const d = fzPixels(img, W, H);
    const pele = (i) => {
      const r = d[i], g = d[i + 1], b = d[i + 2];
      const y = 0.299 * r + 0.587 * g + 0.114 * b;
      const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
      const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
      return y > 45 && cb >= 77 && cb <= 127 && cr >= 135 && cr <= 173 && r > g && r > b;
    };
    const lum = (x, y) => { const i = (y * W + x) * 4; return 0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2]; };
    const cols = W / G, lins = H / G;
    const cel = [];
    for (let cy = 0; cy < lins; cy++) {
      cel.push([]);
      for (let cx = 0; cx < cols; cx++) {
        let p = 0, e = 0, tom = 0;
        for (let y = cy * G; y < cy * G + G; y++) {
          for (let x = cx * G; x < cx * G + G; x++) {
            if (pele((y * W + x) * 4)) { p++; tom += lum(x, y); }
            if (x + 1 < W) e += Math.abs(lum(x + 1, y) - lum(x, y));
            if (y + 1 < H) e += Math.abs(lum(x, y + 1) - lum(x, y));
          }
        }
        cel[cy].push({ p: p / (G * G), e: e / (G * G), tom: p ? tom / p : 0 });
      }
    }
    // Manchas de pele (células vizinhas com bastante pele). Parede ou areia da cor da pele dá uma mancha enorme ou
    // grudada na borda: fica de fora. Das que sobram, ganha a maior e mais alta que não seja lisa.
    const ehPele = (cy, cx) => cel[cy][cx].p >= 0.35;
    const visto = cel.map((l) => l.map(() => false));
    let melhor = null, melhorNota = 0;
    // Começa cada mancha pela célula com mais pele (a de borda, misturada com o fundo, tem um tom que engana).
    const sementes = [];
    for (let cy = 0; cy < lins; cy++) for (let cx = 0; cx < cols; cx++) if (ehPele(cy, cx)) sementes.push([cy, cx]);
    sementes.sort((a, b) => cel[b[0]][b[1]].p - cel[a[0]][a[1]].p);
    for (const [y0, x0] of sementes) {
      {
        if (visto[y0][x0]) continue;
        const mancha = [];
        const fila = [[y0, x0]];
        visto[y0][x0] = true;
        while (fila.length) {
          const [cy, cx] = fila.pop();
          mancha.push([cy, cx]);
          for (const [dy, dx] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const ny = cy + dy, nx = cx + dx;
            // Só junta pele do mesmo tom (o rosto não gruda na parede bege em volta).
            if (ny >= 0 && ny < lins && nx >= 0 && nx < cols && !visto[ny][nx] && ehPele(ny, nx) && Math.abs(cel[ny][nx].tom - cel[y0][x0].tom) < 30) {
              visto[ny][nx] = true;
              fila.push([ny, nx]);
            }
          }
        }
        const n = mancha.length;
        const borda = mancha.filter(([cy, cx]) => cy === 0 || cx === 0 || cx === cols - 1).length;
        if (n < 3 || n > lins * cols * 0.4 || borda / n > 0.4) continue;
        const topo = Math.min(...mancha.map(([cy]) => cy));
        if (topo > lins * 0.75) continue;
        const det = mancha.reduce((t, [cy, cx]) => t + cel[cy][cx].e, 0) / n;
        // Detalhe só separa rosto (olhos, boca) de parede lisa; muito detalhe é a borda entre o rosto e o fundo, não o rosto.
        const nota = Math.min(n, 30) * (1.6 - topo / lins) * (det >= 2 ? 1 : 0.3);
        if (nota > melhorNota) { melhorNota = nota; melhor = { mancha, topo }; }
      }
    }
    if (melhor) {
      // O meio do alto da mancha (as 4 primeiras linhas): o rosto, sem o pescoço e o colo.
      const alto = melhor.mancha.filter(([cy]) => cy <= melhor.topo + 3);
      const mx = alto.reduce((t, [, cx]) => t + cx + 0.5, 0) / alto.length;
      const my = alto.reduce((t, [cy]) => t + cy + 0.5, 0) / alto.length;
      return { x: Math.round((mx / cols) * 100), y: Math.round((my / lins) * 100) };
    }
    return FZ_ROSTO_PADRAO;
  } catch (e) {
    return null; // a foto não deixa ler os pixels: usa o ponto de reserva
  }
}

function fzFocoDetalhe(img) {
  try {
    const W = 48, H = 60, G = 6;
    const d = fzPixels(img, W, H);
    const lum = (x, y) => { const i = (y * W + x) * 4; return 0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2]; };
    const cols = W / G, lins = H / G;
    let melhor = null, max = -1;
    for (let cy = 1; cy < lins - 1; cy++) {
      for (let cx = 1; cx < cols - 1; cx++) {
        let e = 0;
        for (let y = cy * G; y < cy * G + G; y++) {
          for (let x = cx * G; x < cx * G + G; x++) e += Math.abs(lum(x + 1 < W ? x + 1 : x, y) - lum(x, y)) + Math.abs(lum(x, y + 1 < H ? y + 1 : y) - lum(x, y));
        }
        // Um pouco de preferência pelo meio da foto, onde costuma estar o assunto.
        const dx = (cx + 0.5) / cols - 0.5, dy = (cy + 0.5) / lins - 0.45;
        const nota = e * (1 - 0.9 * (dx * dx + dy * dy));
        if (nota > max) { max = nota; melhor = { x: Math.round(((cx + 0.5) / cols) * 100), y: Math.round(((cy + 0.5) / lins) * 100) }; }
      }
    }
    return max > 0 ? melhor : null;
  } catch (e) {
    return null; // a foto não deixa ler os pixels: usa o ponto de reserva
  }
}

// A primeira foto da rodada que carrega de verdade (ou null, sem internet).
async function fzResolver(r) {
  const chave = r.ids.join(",");
  if (fzEscolhida.has(chave)) return { foto: fzFoto(fzEscolhida.get(chave)), dados: await fzCache.get(fzFoto(fzEscolhida.get(chave)).titulo) };
  fzBuscar(r.ids.map((id) => fzFoto(id).titulo));
  for (const id of r.ids) {
    const foto = fzFoto(id);
    const dados = await fzCache.get(foto.titulo);
    if (dados && (await fzCarregarImagem(dados.src, true, FZ_PESSOAS.includes(foto.tema)))) {
      fzEscolhida.set(chave, id);
      return { foto, dados };
    }
  }
  return null;
}

// Já vai buscando as próximas rodadas.
function fzAdiantar() {
  if (typeof partida === "undefined" || !partida || !partida.rodadas) return;
  const proximas = partida.rodadas.slice(partida.n, partida.n + 3);
  fzBuscar(proximas.flatMap((r) => r.ids.map((id) => fzFoto(id).titulo)));
  proximas.slice(1).forEach((r) => fzResolver(r));
}

function fzImg(dados, foto, n, inteira) {
  const f = fzFocos.get(dados.src) || fzFoco(foto);
  const z = inteira ? 1 : FZ_ZOOM[n];
  return `<img class="fz-img ${inteira ? "inteira" : ""}" src="${escapeHtml(dados.src)}"${fzSemCors.has(dados.src) ? "" : ' crossorigin="anonymous"'} alt="" draggable="false" style="transform-origin:${f.x}% ${f.y}%;transform:scale(${z})">`;
}

// Com o ponto conferido (em % da foto inteira): enquadra a foto no quadro de modo que o ponto apareça (foto deitada
// corta dos lados, em pé corta em cima e embaixo; o corte vai para perto do ponto) e põe o zoom em cima dele.
function fzEnquadrar(img, foto, dados) {
  const c = fzFocoConferido(foto, dados.arquivo);
  const dims = fzDims.get(dados.src);
  const caixa = img.parentElement.getBoundingClientRect();
  if (!c || !dims || !caixa.width || !caixa.height) return;
  const esc = Math.max(caixa.width / dims[0], caixa.height / dims[1]);
  const eixo = (f, lado, quadro) => {
    const sobra = lado * esc - quadro;
    const corte = Math.min(Math.max((f / 100) * lado * esc - quadro / 2, 0), sobra);
    return { pos: sobra > 0.5 ? (corte / sobra) * 100 : 50, origem: (((f / 100) * lado * esc - corte) / quadro) * 100 };
  };
  const x = eixo(c.x, dims[0], caixa.width), y = eixo(c.y, dims[1], caixa.height);
  img.style.objectPosition = `${x.pos}% ${y.pos}%`;
  img.style.transformOrigin = `${x.origem}% ${y.origem}%`;
}

function fzCredito(dados) {
  return `<a class="fz-credito" href="https://commons.wikimedia.org/wiki/File:${encodeURIComponent(dados.arquivo)}" target="_blank" rel="noopener">${escapeHtml(t("fz.credit"))}</a>`;
}

function fzDesenhar(el, r, e) {
  if (e.fase === "jogando") {
    fzResponder = e.responder;
    if (!e.nova) return;
    fzN = 0;
    fzAtual = null;
    const vez = ++fzVez;
    el.innerHTML = `<div class="fz-quadro carregando" id="fz-quadro"><span class="fz-espera">${escapeHtml(t("fz.loading"))}</span></div>
      <p class="fz-vale" id="fz-vale"></p>
      <form class="fz-form" id="fz-form" autocomplete="off">
        <input id="fz-chute" maxlength="60" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="send" placeholder="${escapeHtml(t("fz.ph"))}" disabled>
        <button type="submit" class="btn" disabled>${escapeHtml(t("fz.guess"))}</button>
      </form>
      <ul class="fz-sug" id="fz-sug" role="listbox"></ul>
      <p class="fz-msg" id="fz-msg" aria-live="polite"></p>
      <div class="fz-acoes"><button type="button" class="link-btn" id="fz-mais">${escapeHtml(t("fz.more"))}</button><button type="button" class="link-btn" id="fz-desisto">${escapeHtml(t("fz.giveUp"))}</button></div>`;
    $("fz-form").onsubmit = (ev) => {
      ev.preventDefault();
      fzChutar($("fz-chute").value);
    };
    $("fz-chute").oninput = fzSugerir;
    $("fz-sug").onclick = (ev) => {
      const b = ev.target.closest("[data-nome]");
      if (b) fzChutar(b.dataset.nome);
    };
    $("fz-mais").onclick = fzAbrirMais;
    $("fz-desisto").onclick = () => fzResponder && fzResponder({ id: fzAtual ? fzAtual.id : r.ids[0], g: "", n: fzN });
    fzResolver(r).then((achou) => {
      if (vez !== fzVez || !$("fz-quadro")) return;
      if (!achou) {
        $("fz-quadro").innerHTML = `<span class="fz-espera">${escapeHtml(t("fz.noPhoto"))}</span>`;
        $("fz-mais").hidden = true;
        return;
      }
      fzAtual = achou.foto;
      $("fz-quadro").classList.remove("carregando");
      $("fz-quadro").innerHTML = fzImg(achou.dados, achou.foto, fzN, false);
      fzEnquadrar($("fz-quadro").querySelector(".fz-img"), achou.foto, achou.dados);
      $("fz-chute").disabled = false;
      $("fz-form").querySelector(".btn").disabled = false;
      fzAtualizar();
      if (matchMedia("(pointer: fine)").matches) $("fz-chute").focus();
    });
    fzAtualizar();
    fzAdiantar();
    return;
  }
  fzResponder = null;
  fzVez += 1;
  const revelado = e.fase === "revelado";
  el.innerHTML = `<div class="fz-quadro inteira ${revelado ? (e.res && e.res.certo ? "ok" : "no") : "ok"}" id="fz-quadro"><span class="fz-espera">${escapeHtml(t("fz.loading"))}</span></div>
    <p class="fz-nome" id="fz-nome"></p>`;
  const vez = fzVez;
  fzResolver(r).then((achou) => {
    if (vez !== fzVez || !$("fz-quadro")) return;
    const foto = achou ? achou.foto : fzFoto(r.ids[0]);
    $("fz-nome").innerHTML = `${escapeHtml(revelado ? t("fz.was") : t("fz.youGot"))} <b>${escapeHtml(tr(foto.nome))}</b>`;
    $("fz-quadro").innerHTML = achou ? fzImg(achou.dados, foto, 0, true) + fzCredito(achou.dados) : "";
  });
}

function fzAtualizar() {
  if (!$("fz-vale")) return;
  $("fz-vale").innerHTML = `<span class="fz-niveis">${FZ_PONTOS.map((_, i) => `<i class="${i < fzN ? "usado" : i === fzN ? "agora" : ""}"></i>`).join("")}</span> ${escapeHtml(t("fz.worth", { n: FZ_PONTOS[fzN] }))}`;
  $("fz-mais").hidden = fzN >= FZ_ZOOM.length - 1 || !fzAtual;
  const img = document.querySelector("#fz-quadro .fz-img");
  if (img && fzAtual) img.style.transform = `scale(${FZ_ZOOM[fzN]})`;
}

function fzAbrirMais() {
  if (fzN < FZ_ZOOM.length - 1) fzN += 1;
  fzAtualizar();
}

// Sugestões enquanto digita: nomes de todas as fotos (no idioma da pessoa) que contêm o que foi digitado.
function fzSugerir() {
  const g = fzNormal($("fz-chute").value);
  $("fz-msg").textContent = "";
  if (g.length < 2) return ($("fz-sug").innerHTML = "");
  const nomes = [...new Set(FZ_FOTOS.map((f) => tr(f.nome)))];
  const achados = nomes.filter((n) => fzNormal(n).includes(g)).sort((a, b) => fzNormal(a).indexOf(g) - fzNormal(b).indexOf(g) || a.length - b.length).slice(0, 5);
  $("fz-sug").innerHTML = achados.map((n) => `<li><button type="button" data-nome="${escapeHtml(n)}">${escapeHtml(n)}</button></li>`).join("");
}

function fzChutar(texto) {
  if (!fzResponder || !fzAtual) return;
  const g = String(texto || "").trim();
  if (!g) return;
  if (fzAcertou(fzAtual, g)) return fzResponder({ id: fzAtual.id, g, n: fzN });
  const inp = $("fz-chute");
  inp.value = "";
  $("fz-sug").innerHTML = "";
  $("fz-msg").textContent = fzN < FZ_ZOOM.length - 1 ? t("fz.notIt", { g }) : t("fz.notItLast", { g });
  inp.classList.remove("shake");
  void inp.offsetWidth;
  inp.classList.add("shake");
  fzAbrirMais();
  inp.focus();
}

function fzResumo(r) {
  const id = fzEscolhida.get(r.ids.join(",")) || r.ids[0];
  return `${escapeHtml(tr(fzFoto(id).nome))} <small class="muted">· ${escapeHtml(tr(FZ_NOMES_TEMAS[fzFoto(id).tema]))}</small>`;
}

gzIniciar({
  id: "fotozi",
  prefixo: "fz",
  nome: "Fotozi",
  inicio: FZ_INICIO,
  diario: fzDiario,
  livre: (tema) => fzLivre(tema),
  online: (tema, qtd) => fzOnline(tema, qtd),
  quantias: FZ_QUANTIAS,
  temas: FZ_TEMAS.map((id) => ({ id, nome: FZ_NOMES_TEMAS[id] })),
  segundos: () => FZ_SEGUNDOS,
  avaliar: fzAvaliar,
  valida: fzValida,
  desenhar: fzDesenhar,
  resumo: fzResumo,
  respostaTexto: (r, v) => (v && v.g ? escapeHtml(v.g) : "—"),
  textos: {
    "home.tag": ["Só um pedacinho da foto. Quem é? O que é? Cada erro abre mais a foto e vale menos.", "Just a tiny piece of the photo. Who is it? What is it? Each miss zooms out a bit and is worth a bit less.", "Solo un pedacito de la foto. ¿Quién es? ¿Qué es? Cada error abre un poco más y vale un poco menos."],
    "daily.name": ["Fotozi do dia", "Daily Fotozi", "Fotozi del día"],
    "daily.kicker": ["Fotozi do dia #{n}", "Daily Fotozi #{n}", "Fotozi del día #{n}"],
    "fz.loading": ["Carregando a foto…", "Loading the photo…", "Cargando la foto…"],
    "fz.noPhoto": ["Não deu para carregar a foto. Confira a internet e toque em Desisto para seguir.", "Couldn't load the photo. Check your connection and tap Give up to move on.", "No se pudo cargar la foto. Revisa internet y toca Me rindo para seguir."],
    "fz.ph": ["Quem ou o que é?", "Who or what is it?", "¿Quién o qué es?"],
    "fz.guess": ["Chutar", "Guess", "Probar"],
    "fz.more": ["Abrir mais a foto (−20)", "Zoom out (−20)", "Abrir más la foto (−20)"],
    "fz.giveUp": ["Desisto", "Give up", "Me rindo"],
    "fz.worth": ["Vale {n} pontos", "Worth {n} points", "Vale {n} puntos"],
    "fz.notIt": ["Não é \"{g}\". A foto abriu um pouco.", "It's not \"{g}\". The photo zoomed out a bit.", "No es \"{g}\". La foto se abrió un poco."],
    "fz.notItLast": ["Não é \"{g}\".", "It's not \"{g}\".", "No es \"{g}\"."],
    "fz.youGot": ["Você acertou:", "You got it:", "Acertaste:"],
    "fz.was": ["Era", "It was", "Era"],
    "fz.credit": ["Foto: Wikimedia Commons", "Photo: Wikimedia Commons", "Foto: Wikimedia Commons"],
    "help.html": [
      "<ol class=\"help-steps\"><li>Aparece só um pedacinho bem ampliado de uma foto: um jogador, um famoso, uma comida, um bicho, um lugar…</li><li>Digite quem ou o que é (aparecem sugestões enquanto você digita).</li><li>Cada chute errado afasta a foto, e a rodada vale menos: 100, 80, 60, 40 e 20 com a foto inteira. Dá também para abrir mais sem chutar.</li></ol><p><b>Fotozi do dia:</b> as mesmas 10 para todo mundo, com ranking. <b>Partida livre:</b> escolha o tema e vá até errar 3 vezes. <b>Online:</b> todo mundo vê a mesma foto, cada um no seu celular; o anfitrião escolhe o tema e 5, 10 ou 15 rodadas.</p><p class=\"small muted\">As fotos são da Wikipédia (Wikimedia Commons), com licença livre; o crédito aparece no fim de cada rodada.</p>",
      "<ol class=\"help-steps\"><li>Just a tiny, very zoomed-in piece of a photo shows up: a soccer player, a celebrity, a dish, an animal, a place…</li><li>Type who or what it is (suggestions show up as you type).</li><li>Each wrong guess zooms out and the round is worth less: 100, 80, 60, 40 and 20 with the full photo. You can also zoom out without guessing.</li></ol><p><b>Daily Fotozi:</b> the same 10 for everyone, with a ranking. <b>Free play:</b> pick a theme and go until you miss 3 times. <b>Online:</b> everyone sees the same photo on their own phone; the host picks the theme and 5, 10 or 15 rounds.</p><p class=\"small muted\">Photos come from Wikipedia (Wikimedia Commons) under free licenses; the credit shows at the end of each round.</p>",
      "<ol class=\"help-steps\"><li>Aparece solo un pedacito muy ampliado de una foto: un futbolista, un famoso, una comida, un animal, un lugar…</li><li>Escribe quién o qué es (aparecen sugerencias mientras escribes).</li><li>Cada intento fallido abre la foto y la ronda vale menos: 100, 80, 60, 40 y 20 con la foto entera. También puedes abrir más sin intentar.</li></ol><p><b>Fotozi del día:</b> las mismas 10 para todos, con ranking. <b>Partida libre:</b> elige el tema y sigue hasta fallar 3 veces. <b>Online:</b> todos ven la misma foto, cada uno en su celular; el anfitrión elige el tema y 5, 10 o 15 rondas.</p><p class=\"small muted\">Las fotos son de Wikipedia (Wikimedia Commons), con licencia libre; el crédito aparece al final de cada ronda.</p>",
    ],
  },
});
