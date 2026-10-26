// Skin única do Gamezi: a mesma em todos os jogos (menos o Patozi, que tem o guarda-roupa do pato). São os bonecos
// do Topzi (../topzi/js/avatars.js, carregado antes deste arquivo), com as prontas por grupo e o editor "Criar a minha".
// Uma skin é { presetId, avatar } (o desenho é o cfg de renderAvatar; presetId é null na personalizada). Fica em
// gz:skin; o visual 3D liga e desliga em gz:3d. Quem tinha skin só no Topzi (tt:players) ou no Cravazi (cz:skin)
// continua com ela. A janela de escolha e o estilo entram sozinhos na página. Usa a variável global lang do jogo.

var GZ_SKIN_TEXTO = {
  titulo: ["Sua skin", "Your skin", "Tu skin"],
  sub: ["A mesma em todos os jogos do Gamezi.", "The same in every Gamezi game.", "La misma en todos los juegos de Gamezi."],
  trocar: ["Trocar skin", "Change skin", "Cambiar skin"],
  fechar: ["Fechar", "Close", "Cerrar"],
  criar: ["Criar a minha", "Make my own", "Crear la mía"],
  editar: ["Editar", "Edit", "Editar"],
  usar: ["Usar esta skin", "Use this skin", "Usar esta skin"],
  sortear: ["Sortear", "Random", "Al azar"],
  visual3d: ["Visual 3D", "3D look", "Estilo 3D"],
  especial: ["Especial", "Special", "Especial"],
  anterior: ["Anterior", "Previous", "Anterior"],
  proximo: ["Próximo", "Next", "Siguiente"],
  grupos: {
    "Heróis": ["Heróis", "Heroes", "Héroes"], "Vilões": ["Vilões", "Villains", "Villanos"], "Animes": ["Animes", "Anime", "Animes"],
    "Desenhos": ["Desenhos", "Cartoons", "Dibujos"], "Filmes e séries": ["Filmes e séries", "Movies & TV", "Películas y series"],
    "Games": ["Games", "Games", "Videojuegos"], "Futebol": ["Futebol", "Soccer", "Fútbol"], "Profissões": ["Profissões", "Jobs", "Profesiones"],
  },
  secoes: { rosto: ["Rosto", "Face", "Cara"], cabelo: ["Cabelo", "Hair", "Pelo"], cabeca: ["Cabeça", "Head", "Cabeza"], roupa: ["Roupa", "Outfit", "Ropa"], extras: ["Extras", "Extras", "Extras"] },
  ctrl: {
    skin: ["Pele", "Skin tone", "Piel"], eyes: ["Olhos", "Eyes", "Ojos"], mouth: ["Boca", "Mouth", "Boca"], beard: ["Barba", "Beard", "Barba"],
    beardColor: ["Cor da barba", "Beard color", "Color de barba"], sameHair: ["Igual ao cabelo", "Same as hair", "Igual al pelo"],
    extra: ["Detalhe", "Detail", "Detalle"], hair: ["Corte", "Haircut", "Corte"], color: ["Cor", "Color", "Color"],
    head: ["Acessório", "Accessory", "Accesorio"], headColor: ["Cor principal", "Main color", "Color principal"],
    headColor2: ["Segunda cor", "Second color", "Segundo color"], capLetter: ["Letra do boné", "Cap letter", "Letra de la gorra"],
    shirt: ["Camisa", "Shirt", "Camiseta"], pattern: ["Estampa", "Print", "Estampado"], patternColor: ["Cor da estampa", "Print color", "Color del estampado"],
    number: ["Número", "Number", "Número"], sleeves: ["Mangas", "Sleeves", "Mangas"], sameShirt: ["Igual à camisa", "Same as shirt", "Igual a la camiseta"],
    belt: ["Cinto", "Belt", "Cinturón"], noBelt: ["Sem cinto", "No belt", "Sin cinturón"], legs: ["Calça", "Pants", "Pantalón"],
    cape: ["Capa", "Cape", "Capa"], noCape: ["Sem capa", "No cape", "Sin capa"], item: ["Na mão", "Holding", "En la mano"],
    bg: ["Fundo", "Background", "Fondo"], noBg: ["Sem fundo", "No background", "Sin fondo"],
  },
};

function gzSkinT(arr) {
  var l = typeof lang === "string" ? lang : "pt";
  return arr[["pt", "en", "es"].indexOf(l)] || arr[0];
}

function gzSkinEscape(s) {
  return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; });
}

function gzSkinLer(chave) {
  try { return JSON.parse(localStorage.getItem(chave)); } catch (e) { return null; }
}

// Skin que veio do aparelho ou de outro jogador vira algo seguro de desenhar: só valores curtos, sem aspas nem < >.
function gameziSkinValida(skin) {
  if (!skin || typeof skin !== "object" || !skin.avatar || typeof skin.avatar !== "object") return null;
  var ok = function (v) { return v === null || typeof v === "boolean" || (typeof v === "string" && /^[#\w-]{0,24}$/.test(v)); };
  var avatar = {};
  Object.keys(skin.avatar).slice(0, 40).forEach(function (k) {
    var v = skin.avatar[k];
    if (ok(v) || (Array.isArray(v) && v.length <= 4 && v.every(ok))) avatar[k] = v;
  });
  return { presetId: typeof skin.presetId === "string" && presetById(skin.presetId) ? skin.presetId : null, avatar: avatar };
}

function gameziSkinSorteada() {
  var p = PRESETS[Math.floor(Math.random() * PRESETS.length)];
  return { presetId: p.id, avatar: Object.assign({}, p.cfg) };
}

// Guarda a skin única (todos os jogos leem daqui) e avisa a página (evento "gamezi-skin").
function gameziGuardarSkin(skin) {
  var s = gameziSkinValida(skin);
  if (!s) return null;
  try { localStorage.setItem("gz:skin", JSON.stringify(s)); } catch (e) { /* vale só agora */ }
  try { window.dispatchEvent(new CustomEvent("gamezi-skin", { detail: s })); } catch (e) { /* navegador antigo */ }
  return s;
}

// Minha skin. Na primeira vez, aproveita a que a pessoa já tinha no Topzi ou no Cravazi; senão, sorteia uma pronta.
function gameziMinhaSkin() {
  var s = gameziSkinValida(gzSkinLer("gz:skin"));
  if (s) return s;
  var topzi = gzSkinLer("tt:players");
  s = gameziSkinValida(gzSkinLer("cz:skin")) ||
    (Array.isArray(topzi) && topzi[0] ? gameziSkinValida({ presetId: topzi[0].presetId || null, avatar: topzi[0].avatar }) : null) ||
    gameziSkinSorteada();
  try { localStorage.setItem("gz:skin", JSON.stringify(s)); } catch (e) { /* vale só agora */ }
  return s;
}

function gameziSkinNome(skin) {
  var p = skin && skin.presetId && presetById(skin.presetId);
  return p ? presetName(p) : gzSkinT(GZ_SKIN_TEXTO.criar);
}

// Boneco inteiro (classe "gz-body") ou só o rosto ("gz-face", para listas e placar).
function gameziBoneco(skin, classe) {
  var s = gameziSkinValida(skin);
  return '<span class="' + (classe || "gz-face") + '" aria-hidden="true">' + renderAvatar((s && s.avatar) || DEFAULT_AVATAR) + "</span>";
}

function gameziSkin3d(ligar) {
  if (ligar === undefined) return typeof avatar3d === "function" ? avatar3d() : true;
  try { localStorage.setItem("gz:3d", JSON.stringify(!!ligar)); } catch (e) { /* vale só agora */ }
  try { window.dispatchEvent(new CustomEvent("gamezi-skin", { detail: gameziMinhaSkin() })); } catch (e) { /* navegador antigo */ }
  return !!ligar;
}

// ───────────── janela de escolha ─────────────

var gzSkinAba = null;
var gzSkinAoEscolher = null;
var gzSkinRascunho = null;
var gzSkinSecao = "rosto";

// Abre a escolha de skin; aoEscolher(skin) recebe a nova (já guardada em gz:skin).
function gameziEscolherSkin(aoEscolher) {
  gzSkinEstilo();
  var dlg = document.getElementById("gz-skin-dialog");
  if (!dlg) {
    dlg = document.createElement("dialog");
    dlg.id = "gz-skin-dialog";
    dlg.className = "dialog gz-skin-dialog";
    dlg.innerHTML = '<div class="dialog-inner"><div class="dialog-head"><div><h2 class="gz-skin-titulo"></h2><p class="gz-skin-sub"></p></div>' +
      '<button type="button" class="text-btn gz-skin-fechar"></button></div>' +
      '<label class="gz-skin-3d"><input type="checkbox"><span></span></label>' +
      '<div class="gz-skin-abas"></div><div class="gz-skin-grade"></div><div class="gz-skin-editor" hidden></div></div>';
    document.body.appendChild(dlg);
    dlg.querySelector(".gz-skin-fechar").onclick = function () { dlg.close(); };
    dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
    dlg.querySelector(".gz-skin-3d input").onchange = function (e) { gameziSkin3d(e.target.checked); gzSkinDesenhar(); };
  }
  gzSkinAoEscolher = aoEscolher;
  var atual = gameziMinhaSkin();
  var pronta = atual.presetId && presetById(atual.presetId);
  gzSkinAba = pronta ? pronta.group : "criar";
  gzSkinRascunho = Object.assign({}, DEFAULT_AVATAR, JSON.parse(JSON.stringify(atual.avatar)));
  gzSkinDesenhar();
  dlg.showModal();
}

function gzSkinEscolher(skin) {
  var s = gameziGuardarSkin(skin);
  document.getElementById("gz-skin-dialog").close();
  if (gzSkinAoEscolher && s) gzSkinAoEscolher(s);
}

function gzSkinDesenhar() {
  var dlg = document.getElementById("gz-skin-dialog");
  var atual = gameziMinhaSkin();
  dlg.querySelector(".gz-skin-titulo").textContent = gzSkinT(GZ_SKIN_TEXTO.titulo);
  dlg.querySelector(".gz-skin-sub").textContent = gzSkinT(GZ_SKIN_TEXTO.sub);
  dlg.querySelector(".gz-skin-fechar").textContent = gzSkinT(GZ_SKIN_TEXTO.fechar);
  dlg.querySelector(".gz-skin-3d span").textContent = gzSkinT(GZ_SKIN_TEXTO.visual3d);
  dlg.querySelector(".gz-skin-3d input").checked = gameziSkin3d();
  dlg.querySelector(".gz-skin-abas").innerHTML = ["criar"].concat(PRESET_GROUPS).map(function (g) {
    var nome = g === "criar" ? gzSkinT(GZ_SKIN_TEXTO.criar) : gzSkinT(GZ_SKIN_TEXTO.grupos[g] || [g]);
    return '<button type="button" class="gz-skin-aba' + (g === "criar" ? " gz-skin-aba-criar" : "") + (g === gzSkinAba ? " active" : "") + '" data-grupo="' + gzSkinEscape(g) + '">' + gzSkinEscape(nome) + "</button>";
  }).join("");
  dlg.querySelector(".gz-skin-abas").onclick = function (e) {
    var b = e.target.closest("[data-grupo]");
    if (b) { gzSkinAba = b.dataset.grupo; gzSkinDesenhar(); }
  };
  var editor = gzSkinAba === "criar";
  var grade = dlg.querySelector(".gz-skin-grade");
  grade.hidden = editor;
  dlg.querySelector(".gz-skin-editor").hidden = !editor;
  if (editor) return gzSkinEditor();
  grade.innerHTML = PRESETS.filter(function (p) { return p.group === gzSkinAba; }).map(function (p) {
    return '<div class="gz-skin-item' + (atual.presetId === p.id ? " active" : "") + '"><button type="button" class="gz-skin-pick" data-skin="' + gzSkinEscape(p.id) + '">' +
      renderAvatar(p.cfg) + "<span>" + gzSkinEscape(presetName(p)) + '</span></button><button type="button" class="gz-skin-edit-btn" data-editar="' +
      gzSkinEscape(p.id) + '">' + gzSkinEscape(gzSkinT(GZ_SKIN_TEXTO.editar)) + "</button></div>";
  }).join("");
  grade.onclick = function (e) {
    var b = e.target.closest("[data-skin], [data-editar]");
    if (!b) return;
    var p = presetById(b.dataset.skin || b.dataset.editar);
    if (b.dataset.skin) return gzSkinEscolher({ presetId: p.id, avatar: Object.assign({}, p.cfg) });
    gzSkinRascunho = Object.assign({}, DEFAULT_AVATAR, JSON.parse(JSON.stringify(p.cfg)));
    gzSkinAba = "criar";
    gzSkinDesenhar();
  };
}

// ───────────── editor "Criar a minha" (as mesmas peças do Topzi e do Cravazi) ─────────────

function gzSkinCores(rotulo, cores, chave, nenhuma) {
  var lista = nenhuma ? [null].concat(cores) : cores;
  var atual = gzSkinRascunho[chave] || null;
  return '<div class="gz-ctrl"><span class="gz-ctrl-label">' + gzSkinEscape(rotulo) + '</span><div class="gz-swatches">' + lista.map(function (cor) {
    return '<button type="button" class="gz-swatch' + (atual === cor ? " active" : "") + (cor ? "" : " none") + '" data-chave="' + chave + '" data-cor="' + (cor || "") +
      '"' + (cor ? ' style="background:' + cor + '"' : "") + ' aria-label="' + gzSkinEscape(cor || nenhuma) + '" title="' + gzSkinEscape(cor || nenhuma) + '"></button>';
  }).join("") + "</div></div>";
}

function gzSkinOpcoes(rotulo, opcoes, chave) {
  var valor = Array.isArray(gzSkinRascunho[chave]) ? gzSkinRascunho[chave][0] : gzSkinRascunho[chave];
  var i = opcoes.map(function (o) { return o[0]; }).indexOf(valor);
  var atual = i >= 0 ? partName(chave, opcoes[i][0], opcoes[i][1]) : gzSkinT(GZ_SKIN_TEXTO.especial);
  return '<div class="gz-ctrl"><span class="gz-ctrl-label">' + gzSkinEscape(rotulo) + '</span><div class="gz-cycler">' +
    '<button type="button" data-ciclo="' + chave + '" data-passo="-1" aria-label="' + gzSkinEscape(gzSkinT(GZ_SKIN_TEXTO.anterior)) + '">‹</button><span>' + gzSkinEscape(atual) +
    '</span><button type="button" data-ciclo="' + chave + '" data-passo="1" aria-label="' + gzSkinEscape(gzSkinT(GZ_SKIN_TEXTO.proximo)) + '">›</button></div></div>';
}

function gzSkinTexto(rotulo, chave, max) {
  return '<div class="gz-ctrl"><span class="gz-ctrl-label">' + gzSkinEscape(rotulo) + '</span><input type="text" class="gz-skin-texto" maxlength="' + max +
    '" data-texto="' + chave + '" value="' + gzSkinEscape(gzSkinRascunho[chave] || "") + '"></div>';
}

var GZ_SKIN_OPCOES = { eyes: "eyes", mouth: "mouth", beard: "beard", extra: "extra", hair: "hair", head: "head", pattern: "pattern", item: "item" };

function gzSkinSecaoHtml(secao) {
  var c = GZ_SKIN_TEXTO.ctrl, r = gzSkinRascunho, T = gzSkinT;
  if (secao === "rosto") return gzSkinCores(T(c.skin), SKIN_TONES, "skin") + gzSkinOpcoes(T(c.eyes), PARTS.eyes, "eyes") + gzSkinOpcoes(T(c.mouth), PARTS.mouth, "mouth") +
    gzSkinOpcoes(T(c.beard), PARTS.beard, "beard") + gzSkinCores(T(c.beardColor), HAIR_COLORS, "beardColor", T(c.sameHair)) + gzSkinOpcoes(T(c.extra), PARTS.extra, "extra");
  if (secao === "cabelo") return gzSkinOpcoes(T(c.hair), PARTS.hair, "hair") + gzSkinCores(T(c.color), HAIR_COLORS, "hairColor");
  if (secao === "cabeca") return gzSkinOpcoes(T(c.head), PARTS.head, "head") + gzSkinCores(T(c.headColor), COLORS, "headColor") + gzSkinCores(T(c.headColor2), COLORS, "headColor2") +
    (r.head === "cap" ? gzSkinTexto(T(c.capLetter), "headText", 1) : "");
  if (secao === "roupa") {
    var estampas = Array.isArray(r.pattern) ? r.pattern : [r.pattern];
    return gzSkinCores(T(c.shirt), COLORS, "top") + gzSkinOpcoes(T(c.pattern), PARTS.pattern, "pattern") + gzSkinCores(T(c.patternColor), COLORS, "top2") +
      (estampas.indexOf("number") >= 0 ? gzSkinTexto(T(c.number), "text", 2) : "") + gzSkinCores(T(c.sleeves), COLORS, "sleeve", T(c.sameShirt)) +
      gzSkinCores(T(c.belt), COLORS, "belt", T(c.noBelt)) + gzSkinCores(T(c.legs), COLORS, "legs") + gzSkinCores(T(c.cape), COLORS, "cape", T(c.noCape));
  }
  return gzSkinOpcoes(T(c.item), PARTS.item, "item") + gzSkinCores(T(c.bg), COLORS.concat(SKIN_TONES.slice(1, 4)), "bg", T(c.noBg));
}

function gzSkinEditor() {
  var box = document.querySelector("#gz-skin-dialog .gz-skin-editor");
  box.innerHTML = '<div class="gz-skin-preview">' + renderAvatar(gzSkinRascunho) + '</div><div class="gz-skin-lado"><div class="gz-skin-secoes">' +
    Object.keys(GZ_SKIN_TEXTO.secoes).map(function (s) {
      return '<button type="button" class="gz-skin-aba' + (s === gzSkinSecao ? " active" : "") + '" data-secao="' + s + '">' + gzSkinEscape(gzSkinT(GZ_SKIN_TEXTO.secoes[s])) + "</button>";
    }).join("") + '</div><div class="gz-skin-ctrls">' + gzSkinSecaoHtml(gzSkinSecao) + '</div></div><div class="gz-skin-pe">' +
    '<button type="button" class="gz-skin-sortear">' + gzSkinEscape(gzSkinT(GZ_SKIN_TEXTO.sortear)) + '</button><button type="button" class="gz-skin-usar">' +
    gzSkinEscape(gzSkinT(GZ_SKIN_TEXTO.usar)) + "</button></div>";
  box.onclick = function (e) {
    var b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.secao) { gzSkinSecao = b.dataset.secao; return gzSkinEditor(); }
    if (b.dataset.chave) {
      if (b.dataset.cor) gzSkinRascunho[b.dataset.chave] = b.dataset.cor;
      else delete gzSkinRascunho[b.dataset.chave];
      return gzSkinEditor();
    }
    if (b.dataset.ciclo) {
      var chave = b.dataset.ciclo, opcoes = PARTS[GZ_SKIN_OPCOES[chave]];
      var valor = Array.isArray(gzSkinRascunho[chave]) ? gzSkinRascunho[chave][0] : gzSkinRascunho[chave];
      var i = opcoes.map(function (o) { return o[0]; }).indexOf(valor);
      i = i < 0 ? 0 : (i + Number(b.dataset.passo) + opcoes.length) % opcoes.length;
      gzSkinRascunho[chave] = opcoes[i][0];
      if (chave === "head") { gzSkinRascunho.headStyle = ""; gzSkinRascunho.headText = ""; }
      return gzSkinEditor();
    }
    if (b.classList.contains("gz-skin-sortear")) { gzSkinRascunho = gzSkinAleatoria(); return gzSkinEditor(); }
    if (b.classList.contains("gz-skin-usar")) gzSkinEscolher({ presetId: null, avatar: Object.assign({}, gzSkinRascunho) });
  };
  box.oninput = function (e) {
    var chave = e.target.dataset.texto;
    if (!chave) return;
    var v = e.target.value;
    gzSkinRascunho[chave] = chave === "text" ? v.replace(/\D/g, "") : v.toUpperCase().replace(/[^A-Z0-9]/g, "");
    box.querySelector(".gz-skin-preview").innerHTML = renderAvatar(gzSkinRascunho);
  };
}

function gzSkinAleatoria() {
  var um = function (arr) { return arr[Math.floor(Math.random() * arr.length)]; };
  var peca = function (arr) { return um(arr)[0]; };
  return Object.assign({}, DEFAULT_AVATAR, {
    skin: um(SKIN_TONES), hair: peca(PARTS.hair), hairColor: um(HAIR_COLORS), eyes: peca(PARTS.eyes),
    mouth: peca(PARTS.mouth.filter(function (o) { return o[0] !== "evil"; })), beard: Math.random() < 0.3 ? peca(PARTS.beard) : "none",
    extra: Math.random() < 0.3 ? peca(PARTS.extra) : "none", head: Math.random() < 0.5 ? peca(PARTS.head) : "none",
    headColor: um(COLORS), headColor2: um(COLORS), top: um(COLORS), top2: um(COLORS), pattern: peca(PARTS.pattern),
    text: String(1 + Math.floor(Math.random() * 99)), legs: um(COLORS), cape: Math.random() < 0.15 ? um(COLORS) : null,
    item: Math.random() < 0.4 ? peca(PARTS.item) : "none",
  });
}

// Botão com o boneco e "Trocar skin" (na tela "Jogar online" e na conta). aoMudar(skin) é chamado depois de trocar.
function gameziBotaoSkin(el, aoMudar) {
  gzSkinEstilo();
  var desenhar = function () {
    el.className = "gz-skin-btn";
    el.type = "button";
    el.setAttribute("aria-label", gzSkinT(GZ_SKIN_TEXTO.trocar));
    el.innerHTML = gameziBoneco(gameziMinhaSkin(), "gz-body") + '<span class="gz-skin-edit">' + gzSkinEscape(gzSkinT(GZ_SKIN_TEXTO.trocar)) + "</span>";
  };
  desenhar();
  window.addEventListener("gamezi-skin", desenhar);
  el.onclick = function () {
    gameziEscolherSkin(function (skin) {
      desenhar();
      if (aoMudar) aoMudar(skin);
    });
  };
}

function gzSkinEstilo() {
  if (document.getElementById("gz-skin-estilo")) return;
  var st = document.createElement("style");
  st.id = "gz-skin-estilo";
  st.textContent = [
    ".gz-body { display: block; line-height: 0; }",
    ".gz-body svg { width: 100%; height: auto; }",
    ".gz-face { display: inline-block; flex: none; width: 28px; height: 28px; border-radius: 50%; overflow: hidden; background: var(--bg); line-height: 0; position: relative; vertical-align: middle; }",
    ".gz-face svg { position: absolute; width: 156%; height: auto; left: -28%; top: 1%; }",
    ".gz-skin-btn { position: relative; flex: none; width: 92px; border: 0; background: var(--surface); border-radius: var(--r-sm, 11px); padding: 8px 12px 0; line-height: 0; overflow: hidden; cursor: pointer; }",
    ".gz-skin-edit { position: absolute; left: 0; right: 0; bottom: 0; padding: 4px 0; font: inherit; font-size: .7rem; font-weight: 800; line-height: 1.2; text-align: center; color: var(--bg); background: var(--fg); }",
    ".gz-skin-dialog { width: min(680px, calc(100vw - 24px)); max-height: calc(100vh - 24px); border: 0; border-radius: 20px; padding: 0; background: var(--bg); color: var(--fg); }",
    ".gz-skin-dialog::backdrop { background: rgba(0, 0, 0, .5); }",
    ".gz-skin-dialog .dialog-inner { padding: 18px; }",
    ".gz-skin-dialog h2 { margin: 0; font-stretch: 75%; font-weight: 800; font-size: 1.7rem; line-height: 1.05; }",
    ".gz-skin-fechar { flex: none; border: 0; background: none; padding: 4px; font: inherit; font-weight: 700; color: var(--muted); text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }",
    ".gz-skin-grade[hidden] { display: none; }",
    ".gz-skin-dialog .dialog-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }",
    ".gz-skin-sub { margin: 2px 0 0; color: var(--muted); font-size: .85rem; }",
    ".gz-skin-3d { display: inline-flex; align-items: center; gap: 8px; margin: 8px 0 10px; font-weight: 700; font-size: .88rem; cursor: pointer; }",
    ".gz-skin-3d input { width: 18px; height: 18px; accent-color: var(--accent, #FF4B3E); }",
    ".gz-skin-abas, .gz-skin-secoes { display: flex; gap: 6px; overflow-x: auto; padding-bottom: 4px; }",
    ".gz-skin-aba { flex: none; border: 0; border-radius: 999px; padding: 7px 12px; font: inherit; font-size: .82rem; font-weight: 700; cursor: pointer; background: var(--surface); color: var(--fg); }",
    ".gz-skin-aba.active { background: var(--fg); color: var(--bg); }",
    ".gz-skin-aba-criar { box-shadow: inset 0 0 0 2px var(--fg); }",
    ".gz-skin-grade { display: grid; grid-template-columns: repeat(auto-fill, minmax(96px, 1fr)); gap: 8px; max-height: 58vh; overflow-y: auto; margin-top: 6px; }",
    ".gz-skin-item { display: grid; border: 2px solid transparent; border-radius: var(--r-sm, 11px); background: var(--surface); overflow: hidden; }",
    ".gz-skin-item.active, .gz-skin-item:hover { border-color: var(--fg); }",
    ".gz-skin-pick { display: grid; gap: 4px; justify-items: center; border: 0; background: none; color: var(--fg); padding: 6px 4px 4px; font: inherit; font-size: .75rem; font-weight: 700; line-height: 1.15; cursor: pointer; }",
    ".gz-skin-pick svg { width: 66px; height: auto; }",
    ".gz-skin-edit-btn { border: 0; border-top: 1px solid var(--bg); background: none; color: var(--muted); font: inherit; font-size: .7rem; font-weight: 700; padding: 4px; cursor: pointer; }",
    ".gz-skin-edit-btn:hover { color: var(--fg); }",
    ".gz-skin-editor { display: grid; grid-template-columns: 150px minmax(0, 1fr); gap: 12px; margin-top: 6px; }",
    ".gz-skin-editor[hidden] { display: none; }",
    ".gz-skin-preview { background: var(--surface); border-radius: var(--r-sm, 11px); padding: 10px; line-height: 0; align-self: start; }",
    ".gz-skin-preview svg { width: 100%; height: auto; }",
    ".gz-skin-lado { min-width: 0; display: grid; gap: 8px; align-content: start; }",
    ".gz-skin-ctrls { display: grid; gap: 10px; max-height: 44vh; overflow-y: auto; }",
    ".gz-ctrl { display: grid; gap: 4px; }",
    ".gz-ctrl-label { font-size: .78rem; font-weight: 800; color: var(--muted); }",
    ".gz-swatches { display: flex; flex-wrap: wrap; gap: 5px; }",
    ".gz-swatch { width: 24px; height: 24px; border-radius: 50%; border: 2px solid var(--surface); box-shadow: 0 0 0 1px rgba(0,0,0,.15); cursor: pointer; padding: 0; }",
    ".gz-swatch.none { background: repeating-linear-gradient(45deg, var(--surface) 0 4px, var(--bg) 4px 8px); }",
    ".gz-swatch.active { box-shadow: 0 0 0 2px var(--fg); }",
    ".gz-cycler { display: flex; align-items: center; gap: 6px; }",
    ".gz-cycler button { width: 32px; height: 32px; border: 0; border-radius: 50%; background: var(--surface); color: var(--fg); font: inherit; font-size: 1.2rem; font-weight: 800; cursor: pointer; }",
    ".gz-cycler span { flex: 1; text-align: center; font-weight: 700; font-size: .9rem; }",
    ".gz-skin-texto { width: 80px; padding: 6px 10px; border-radius: 10px; border: 2px solid var(--surface); background: var(--bg); color: var(--fg); font: inherit; font-weight: 700; }",
    ".gz-skin-pe { grid-column: 1 / -1; display: flex; justify-content: flex-end; gap: 8px; }",
    ".gz-skin-pe button { border: 0; border-radius: 999px; padding: 10px 18px; font: inherit; font-weight: 800; cursor: pointer; background: var(--surface); color: var(--fg); }",
    ".gz-skin-pe .gz-skin-usar { background: var(--accent, #FF4B3E); color: var(--on-accent, #fff); }",
    "@media (max-width: 520px) { .gz-skin-editor { grid-template-columns: 96px minmax(0, 1fr); } .gz-skin-ctrls { max-height: 40vh; } }",
    ".gz-nick-row { display: flex; gap: 12px; align-items: flex-end; margin-top: 16px; }",
    ".gz-nick-row .nick { flex: 1; min-width: 0; margin-top: 0; }",
  ].join("\n");
  document.head.appendChild(st);
}
