// Skins no online dos jogos do Gamezi: os bonecos do Topzi (../topzi/js/avatars.js, carregado antes deste arquivo),
// com as prontas por grupo. Uma skin é { presetId, avatar } (o desenho é o cfg de renderAvatar). A skin escolhida fica
// em gz:skin, a mesma para todos os jogos que usam este arquivo. A janela de escolha e o estilo entram sozinhos na página.
// Usa a variável global lang do jogo (como o avatars.js).

var GZ_SKIN_TEXTO = {
  titulo: ["Sua skin", "Your skin", "Tu skin"],
  trocar: ["Trocar skin", "Change skin", "Cambiar skin"],
  fechar: ["Fechar", "Close", "Cerrar"],
  grupos: {
    "Heróis": ["Heróis", "Heroes", "Héroes"], "Vilões": ["Vilões", "Villains", "Villanos"], "Animes": ["Animes", "Anime", "Animes"],
    "Desenhos": ["Desenhos", "Cartoons", "Dibujos"], "Filmes e séries": ["Filmes e séries", "Movies & TV", "Películas y series"],
    "Games": ["Games", "Games", "Videojuegos"], "Futebol": ["Futebol", "Soccer", "Fútbol"], "Profissões": ["Profissões", "Jobs", "Profesiones"],
  },
};

function gzSkinT(arr) {
  var l = typeof lang === "string" ? lang : "pt";
  return arr[["pt", "en", "es"].indexOf(l)] || arr[0];
}

function gzSkinEscape(s) {
  return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; });
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

// Minha skin (sorteia e guarda na primeira vez).
function gameziMinhaSkin() {
  var s = null;
  try { s = gameziSkinValida(JSON.parse(localStorage.getItem("gz:skin"))); } catch (e) { s = null; }
  if (!s) {
    s = gameziSkinSorteada();
    try { localStorage.setItem("gz:skin", JSON.stringify(s)); } catch (e) { /* vale só agora */ }
  }
  return s;
}

// Boneco inteiro (classe "gz-body") ou só o rosto ("gz-face", para listas e placar).
function gameziBoneco(skin, classe) {
  var s = gameziSkinValida(skin);
  return '<span class="' + (classe || "gz-face") + '" aria-hidden="true">' + renderAvatar((s && s.avatar) || DEFAULT_AVATAR) + "</span>";
}

var gzSkinAba = null;
var gzSkinAoEscolher = null;

// Abre a escolha de skin; aoEscolher(skin) recebe a nova (já guardada em gz:skin).
function gameziEscolherSkin(aoEscolher) {
  gzSkinEstilo();
  var dlg = document.getElementById("gz-skin-dialog");
  if (!dlg) {
    dlg = document.createElement("dialog");
    dlg.id = "gz-skin-dialog";
    dlg.className = "dialog gz-skin-dialog";
    dlg.innerHTML = '<div class="dialog-inner"><div class="dialog-head"><h2 class="gz-skin-titulo"></h2><button type="button" class="text-btn gz-skin-fechar"></button></div><div class="gz-skin-abas"></div><div class="gz-skin-grade"></div></div>';
    document.body.appendChild(dlg);
    dlg.querySelector(".gz-skin-fechar").onclick = function () { dlg.close(); };
    dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
  }
  gzSkinAoEscolher = aoEscolher;
  var atual = gameziMinhaSkin();
  var pronta = atual.presetId && presetById(atual.presetId);
  gzSkinAba = pronta ? pronta.group : PRESET_GROUPS[0];
  gzSkinDesenhar();
  dlg.showModal();
}

function gzSkinDesenhar() {
  var dlg = document.getElementById("gz-skin-dialog");
  var atual = gameziMinhaSkin();
  dlg.querySelector(".gz-skin-titulo").textContent = gzSkinT(GZ_SKIN_TEXTO.titulo);
  dlg.querySelector(".gz-skin-fechar").textContent = gzSkinT(GZ_SKIN_TEXTO.fechar);
  dlg.querySelector(".gz-skin-abas").innerHTML = PRESET_GROUPS.map(function (g) {
    return '<button type="button" class="gz-skin-aba' + (g === gzSkinAba ? " active" : "") + '" data-grupo="' + gzSkinEscape(g) + '">' + gzSkinEscape(gzSkinT(GZ_SKIN_TEXTO.grupos[g] || [g])) + "</button>";
  }).join("");
  dlg.querySelector(".gz-skin-grade").innerHTML = PRESETS.filter(function (p) { return p.group === gzSkinAba; }).map(function (p) {
    return '<button type="button" class="gz-skin-item' + (atual.presetId === p.id ? " active" : "") + '" data-skin="' + gzSkinEscape(p.id) + '">' + renderAvatar(p.cfg) + "<span>" + gzSkinEscape(presetName(p)) + "</span></button>";
  }).join("");
  dlg.querySelector(".gz-skin-abas").onclick = function (e) {
    var b = e.target.closest("[data-grupo]");
    if (b) { gzSkinAba = b.dataset.grupo; gzSkinDesenhar(); }
  };
  dlg.querySelector(".gz-skin-grade").onclick = function (e) {
    var b = e.target.closest("[data-skin]");
    if (!b) return;
    var p = presetById(b.dataset.skin);
    var skin = { presetId: p.id, avatar: Object.assign({}, p.cfg) };
    try { localStorage.setItem("gz:skin", JSON.stringify(skin)); } catch (err) { /* vale só agora */ }
    dlg.close();
    if (gzSkinAoEscolher) gzSkinAoEscolher(skin);
  };
}

// Botão com o boneco e "Trocar skin" (na tela "Jogar online"). aoMudar(skin) é chamado depois de trocar.
function gameziBotaoSkin(el, aoMudar) {
  gzSkinEstilo();
  var desenhar = function () {
    el.className = "gz-skin-btn";
    el.type = "button";
    el.setAttribute("aria-label", gzSkinT(GZ_SKIN_TEXTO.trocar));
    el.innerHTML = gameziBoneco(gameziMinhaSkin(), "gz-body") + '<span class="gz-skin-edit">' + gzSkinEscape(gzSkinT(GZ_SKIN_TEXTO.trocar)) + "</span>";
  };
  desenhar();
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
    ".gz-skin-dialog { width: min(640px, calc(100vw - 24px)); }",
    ".gz-skin-abas { display: flex; gap: 6px; overflow-x: auto; padding-bottom: 4px; }",
    ".gz-skin-aba { flex: none; border: 0; border-radius: 999px; padding: 7px 12px; font: inherit; font-size: .82rem; font-weight: 700; cursor: pointer; background: var(--surface); color: var(--fg); }",
    ".gz-skin-aba.active { background: var(--fg); color: var(--bg); }",
    ".gz-skin-grade { display: grid; grid-template-columns: repeat(auto-fill, minmax(92px, 1fr)); gap: 8px; max-height: 60vh; overflow-y: auto; }",
    ".gz-skin-item { display: grid; gap: 4px; justify-items: center; border: 2px solid transparent; border-radius: var(--r-sm, 11px); padding: 6px 4px; background: var(--surface); color: var(--fg); font: inherit; font-size: .75rem; font-weight: 700; line-height: 1.15; cursor: pointer; }",
    ".gz-skin-item svg { width: 64px; height: auto; }",
    ".gz-skin-item.active, .gz-skin-item:hover { border-color: var(--fg); }",
    ".gz-nick-row { display: flex; gap: 12px; align-items: flex-end; margin-top: 16px; }",
    ".gz-nick-row .nick { flex: 1; min-width: 0; margin-top: 0; }",
  ].join("\n");
  document.head.appendChild(st);
}
