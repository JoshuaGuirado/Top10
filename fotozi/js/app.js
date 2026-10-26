// Fotozi na tela: a foto bem ampliada, o campo do chute com sugestões e os botões de abrir mais ou desistir.
// As fotos vêm da Wikipédia em português (a foto principal de cada artigo, de licença livre), buscadas na hora pelo
// navegador; se uma não carregar, a rodada usa a reserva. As telas comuns são de ../gamezi-kit.js; as regras, de js/jogo.js.

const FZ_API = "https://pt.wikipedia.org/w/api.php";
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
};

const fzCache = new Map(); // título → Promise<{ src, arquivo, pagina } | null>
const fzEscolhida = new Map(); // ids da rodada → id da foto que apareceu
let fzN = 0; // nível da foto na rodada da vez (0 = bem ampliada)
let fzAtual = null; // foto da rodada da vez
let fzResponder = null;
let fzVez = 0; // muda a cada rodada desenhada (para ignorar respostas atrasadas da busca)

// Busca na Wikipédia as fotos de vários artigos de uma vez (até 50 por pedido).
function fzBuscar(titulos) {
  const faltam = [...new Set(titulos)].filter((t) => !fzCache.has(t));
  for (let i = 0; i < faltam.length; i += 50) {
    const lote = faltam.slice(i, i + 50);
    const url = `${FZ_API}?action=query&format=json&origin=*&redirects=1&prop=pageimages&piprop=thumbnail|name&pithumbsize=1280&titles=${encodeURIComponent(lote.join("|"))}`;
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
        const ok = p && p.thumbnail && p.thumbnail.source && p.pageimage && !/\.(svg|png|gif)$/i.test(p.pageimage);
        res.set(t, ok ? { src: p.thumbnail.source, arquivo: p.pageimage, pagina: nome } : null);
      }
      return res;
    }).catch(() => new Map());
    for (const t of lote) fzCache.set(t, pedido.then((m) => m.get(t) || null));
  }
}

function fzCarregarImagem(src) {
  return new Promise((ok) => {
    const img = new Image();
    img.onload = () => ok(true);
    img.onerror = () => ok(false);
    img.src = src;
  });
}

// A primeira foto da rodada que carrega de verdade (ou null, sem internet).
async function fzResolver(r) {
  const chave = r.ids.join(",");
  if (fzEscolhida.has(chave)) return { foto: fzFoto(fzEscolhida.get(chave)), dados: await fzCache.get(fzFoto(fzEscolhida.get(chave)).titulo) };
  fzBuscar(r.ids.map((id) => fzFoto(id).titulo));
  for (const id of r.ids) {
    const foto = fzFoto(id);
    const dados = await fzCache.get(foto.titulo);
    if (dados && (await fzCarregarImagem(dados.src))) {
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
  const f = fzFoco(foto);
  const z = inteira ? 1 : FZ_ZOOM[n];
  return `<img class="fz-img ${inteira ? "inteira" : ""}" src="${escapeHtml(dados.src)}" alt="" draggable="false" style="transform-origin:${f.x}% ${f.y}%;transform:scale(${z})">`;
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
    "home.tag": ["Só um pedacinho da foto. Quem é? O que é? Cada erro abre um pouco mais e vale um pouco menos.", "Just a tiny piece of the photo. Who is it? What is it? Each miss zooms out a bit and is worth a bit less.", "Solo un pedacito de la foto. ¿Quién es? ¿Qué es? Cada error abre un poco más y vale un poco menos."],
    "daily.name": ["Fotozi do dia", "Daily Fotozi", "Fotozi del día"],
    "daily.kicker": ["Fotozi do dia #{n}", "Daily Fotozi #{n}", "Fotozi del día #{n}"],
    "fz.loading": ["Carregando a foto…", "Loading the photo…", "Cargando la foto…"],
    "fz.noPhoto": ["Não deu para carregar a foto. Confira a internet e toque em Desisto para seguir.", "Couldn't load the photo. Check your connection and tap Give up to move on.", "No se pudo cargar la foto. Revisa internet y toca Me rindo para seguir."],
    "fz.ph": ["Quem ou o que é?", "Who or what is it?", "¿Quién o qué es?"],
    "fz.guess": ["Chutar", "Guess", "Probar"],
    "fz.more": ["Abrir mais a foto (−10)", "Zoom out (−10)", "Abrir más la foto (−10)"],
    "fz.giveUp": ["Desisto", "Give up", "Me rindo"],
    "fz.worth": ["Vale {n} pontos", "Worth {n} points", "Vale {n} puntos"],
    "fz.notIt": ["Não é \"{g}\". A foto abriu um pouco.", "It's not \"{g}\". The photo zoomed out a bit.", "No es \"{g}\". La foto se abrió un poco."],
    "fz.notItLast": ["Não é \"{g}\".", "It's not \"{g}\".", "No es \"{g}\"."],
    "fz.youGot": ["Você acertou:", "You got it:", "Acertaste:"],
    "fz.was": ["Era", "It was", "Era"],
    "fz.credit": ["Foto: Wikimedia Commons", "Photo: Wikimedia Commons", "Foto: Wikimedia Commons"],
    "help.html": [
      "<ol class=\"help-steps\"><li>Aparece só um pedacinho bem ampliado de uma foto: um jogador, um famoso, uma comida, um bicho, um lugar…</li><li>Digite quem ou o que é (aparecem sugestões enquanto você digita).</li><li>Cada chute errado afasta um pouco a foto, e a rodada vale um pouco menos: 100, 90, 80… até 30 com a foto inteira. Dá também para abrir mais sem chutar.</li></ol><p><b>Fotozi do dia:</b> as mesmas 10 para todo mundo, com ranking. <b>Partida livre:</b> escolha o tema e vá até errar 3 vezes. <b>Online:</b> todo mundo vê a mesma foto, cada um no seu celular; o anfitrião escolhe o tema e 5, 10 ou 15 rodadas.</p><p class=\"small muted\">As fotos são da Wikipédia (Wikimedia Commons), com licença livre; o crédito aparece no fim de cada rodada.</p>",
      "<ol class=\"help-steps\"><li>Just a tiny, very zoomed-in piece of a photo shows up: a soccer player, a celebrity, a dish, an animal, a place…</li><li>Type who or what it is (suggestions show up as you type).</li><li>Each wrong guess zooms out a bit and the round is worth a bit less: 100, 90, 80… down to 30 with the full photo. You can also zoom out without guessing.</li></ol><p><b>Daily Fotozi:</b> the same 10 for everyone, with a ranking. <b>Free play:</b> pick a theme and go until you miss 3 times. <b>Online:</b> everyone sees the same photo on their own phone; the host picks the theme and 5, 10 or 15 rounds.</p><p class=\"small muted\">Photos come from Wikipedia (Wikimedia Commons) under free licenses; the credit shows at the end of each round.</p>",
      "<ol class=\"help-steps\"><li>Aparece solo un pedacito muy ampliado de una foto: un futbolista, un famoso, una comida, un animal, un lugar…</li><li>Escribe quién o qué es (aparecen sugerencias mientras escribes).</li><li>Cada intento fallido abre un poco la foto y la ronda vale un poco menos: 100, 90, 80… hasta 30 con la foto entera. También puedes abrir más sin intentar.</li></ol><p><b>Fotozi del día:</b> las mismas 10 para todos, con ranking. <b>Partida libre:</b> elige el tema y sigue hasta fallar 3 veces. <b>Online:</b> todos ven la misma foto, cada uno en su celular; el anfitrión elige el tema y 5, 10 o 15 rondas.</p><p class=\"small muted\">Las fotos son de Wikipedia (Wikimedia Commons), con licencia libre; el crédito aparece al final de cada ronda.</p>",
    ],
  },
});
