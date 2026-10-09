// Skins do Cravazi: as mesmas do Topzi (bonecos de ../topzi/js/avatars.js), com as prontas por grupo e o
// editor "Personalizar". Uma skin é { presetId, avatar }: presetId é a pronta escolhida (ou null, se
// personalizada) e avatar é o desenho (cfg de renderAvatar).

let skinAoEscolher = null;
let skinAtual = null;
let skinEmUso = [];
let skinAba = PRESET_GROUPS[0];
let skinSecao = "Rosto";
let skinRascunho = null;

function czPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Skin pronta sorteada, de preferência uma que ninguém está usando.
function czSkinSorteada(evitar = []) {
  const livres = PRESETS.filter((p) => !evitar.includes(p.id));
  const p = czPick(livres.length ? livres : PRESETS);
  return { presetId: p.id, avatar: { ...p.cfg } };
}

// Skin guardada vira algo seguro de desenhar (veio do aparelho ou de outro jogador online).
// Só passam valores curtos sem aspas nem < > (cores, nomes de peças, número da camisa).
function czSkinValida(skin) {
  if (!skin || typeof skin !== "object" || !skin.avatar || typeof skin.avatar !== "object") return null;
  const ok = (v) => v === null || typeof v === "boolean" || (typeof v === "string" && /^[#\w-]{0,24}$/.test(v));
  const avatar = {};
  Object.keys(skin.avatar).slice(0, 40).forEach((k) => {
    const v = skin.avatar[k];
    if (ok(v) || (Array.isArray(v) && v.length <= 4 && v.every(ok))) avatar[k] = v;
  });
  return { presetId: typeof skin.presetId === "string" && presetById(skin.presetId) ? skin.presetId : null, avatar };
}

function czSkinNome(skin) {
  const p = skin && skin.presetId && presetById(skin.presetId);
  return p ? presetName(p) : t("skin.custom");
}

// Desenho do boneco inteiro (classe "body") ou só do rosto (classe "face", para placar e listas).
function czBoneco(skin, classe = "face") {
  return `<span class="${classe}" aria-hidden="true">${renderAvatar((skin && skin.avatar) || DEFAULT_AVATAR)}</span>`;
}

// Abre a escolha de skin. emUso: skins prontas de outros jogadores (aparecem marcadas).
function abrirSkin(titulo, atual, emUso, aoEscolher) {
  skinAtual = czSkinValida(atual) || czSkinSorteada();
  skinEmUso = emUso || [];
  skinAoEscolher = aoEscolher;
  skinRascunho = { ...DEFAULT_AVATAR, ...JSON.parse(JSON.stringify(skinAtual.avatar)) };
  const pronta = skinAtual.presetId && presetById(skinAtual.presetId);
  skinAba = pronta ? pronta.group : "builder";
  $("skin-dialog-title").textContent = titulo;
  renderSkinDialog();
  $("skin-dialog").showModal();
}

function escolherSkin(skin) {
  $("skin-dialog").close();
  if (skinAoEscolher) skinAoEscolher(skin);
}

function renderSkinDialog() {
  const abas = $("skin-tabs");
  abas.innerHTML = "";
  [...PRESET_GROUPS, "builder"].forEach((g) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "tab" + (g === "builder" ? " tab-builder" : "") + (g === skinAba ? " active" : "");
    b.textContent = g === "builder" ? t("skin.custom") : t("group." + g);
    b.onclick = () => { skinAba = g; renderSkinDialog(); };
    abas.appendChild(b);
  });

  const editor = skinAba === "builder";
  $("skin-presets").hidden = editor;
  $("skin-builder").hidden = !editor;
  $("skin-foot").hidden = !editor;
  if (editor) return renderEditor();

  const grade = $("skin-presets");
  grade.innerHTML = "";
  PRESETS.filter((p) => p.group === skinAba).forEach((p) => {
    const card = document.createElement("div");
    card.className = "preset" + (skinAtual.presetId === p.id ? " active" : "");
    card.innerHTML = `<button type="button" class="preset-pick" data-skin="${p.id}">${renderAvatar(p.cfg)}<span>${escapeHtml(presetName(p))}</span></button>${skinEmUso.includes(p.id) ? `<em class="in-use">${escapeHtml(t("skin.inUse"))}</em>` : ""}<button type="button" class="preset-edit">${escapeHtml(t("skin.custom"))}</button>`;
    card.querySelector(".preset-pick").onclick = () => escolherSkin({ presetId: p.id, avatar: { ...p.cfg } });
    card.querySelector(".preset-edit").onclick = () => {
      skinRascunho = { ...DEFAULT_AVATAR, ...JSON.parse(JSON.stringify(p.cfg)) };
      skinAba = "builder";
      renderSkinDialog();
    };
    grade.appendChild(card);
  });
}

// ───────────── editor "Personalizar" (o mesmo do Topzi) ─────────────

function linhaCores(rotulo, cores, chave, nenhuma = null) {
  const row = document.createElement("div");
  row.className = "ctrl";
  row.innerHTML = `<span class="ctrl-label">${escapeHtml(rotulo)}</span><div class="swatches"></div>`;
  const caixa = row.querySelector(".swatches");
  (nenhuma ? [null, ...cores] : cores).forEach((cor) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "swatch" + ((skinRascunho[chave] || null) === cor ? " active" : "") + (cor ? "" : " none");
    if (cor) b.style.background = cor;
    b.title = cor || nenhuma;
    b.setAttribute("aria-label", cor || nenhuma);
    b.onclick = () => {
      if (cor) skinRascunho[chave] = cor;
      else delete skinRascunho[chave];
      renderEditor();
    };
    caixa.appendChild(b);
  });
  return row;
}

function linhaOpcoes(rotulo, opcoes, chave) {
  const row = document.createElement("div");
  row.className = "ctrl";
  const valor = Array.isArray(skinRascunho[chave]) ? skinRascunho[chave][0] : skinRascunho[chave];
  let i = opcoes.findIndex(([v]) => v === valor);
  const atual = i >= 0 ? partName(chave, opcoes[i][0], opcoes[i][1]) : t("skin.special");
  row.innerHTML = `<span class="ctrl-label">${escapeHtml(rotulo)}</span>
    <div class="cycler"><button type="button" aria-label="${escapeHtml(t("skin.prev"))}">‹</button><span>${escapeHtml(atual)}</span><button type="button" aria-label="${escapeHtml(t("skin.next"))}">›</button></div>`;
  const [antes, depois] = row.querySelectorAll("button");
  const passo = (d) => {
    i = i < 0 ? 0 : (i + d + opcoes.length) % opcoes.length;
    skinRascunho[chave] = opcoes[i][0];
    if (chave === "head") { skinRascunho.headStyle = ""; skinRascunho.headText = ""; }
    renderEditor();
  };
  antes.onclick = () => passo(-1);
  depois.onclick = () => passo(1);
  return row;
}

function linhaTexto(rotulo, chave, max, filtro = (v) => v) {
  const row = document.createElement("div");
  row.className = "ctrl";
  row.innerHTML = `<span class="ctrl-label">${escapeHtml(rotulo)}</span><input type="text" maxlength="${max}" class="num-input" value="${escapeHtml(skinRascunho[chave] || "")}">`;
  row.querySelector("input").oninput = (e) => {
    skinRascunho[chave] = filtro(e.target.value);
    $("skin-preview").innerHTML = renderAvatar(skinRascunho);
  };
  return row;
}

const SKIN_SECOES = {
  Rosto: () => [
    linhaCores(t("ctrl.skin"), SKIN_TONES, "skin"),
    linhaOpcoes(t("ctrl.eyes"), PARTS.eyes, "eyes"),
    linhaOpcoes(t("ctrl.mouth"), PARTS.mouth, "mouth"),
    linhaOpcoes(t("ctrl.beard"), PARTS.beard, "beard"),
    linhaCores(t("ctrl.beardColor"), HAIR_COLORS, "beardColor", t("ctrl.sameHair")),
    linhaOpcoes(t("ctrl.extra"), PARTS.extra, "extra"),
  ],
  Cabelo: () => [
    linhaOpcoes(t("ctrl.hair"), PARTS.hair, "hair"),
    linhaCores(t("ctrl.color"), HAIR_COLORS, "hairColor"),
  ],
  "Cabeça": () => [
    linhaOpcoes(t("ctrl.head"), PARTS.head, "head"),
    linhaCores(t("ctrl.headColor"), COLORS, "headColor"),
    linhaCores(t("ctrl.headColor2"), COLORS, "headColor2"),
    ...(skinRascunho.head === "cap" ? [linhaTexto(t("ctrl.capLetter"), "headText", 1, (v) => v.toUpperCase())] : []),
  ],
  Roupa: () => {
    const estampas = Array.isArray(skinRascunho.pattern) ? skinRascunho.pattern : [skinRascunho.pattern];
    return [
      linhaCores(t("ctrl.shirt"), COLORS, "top"),
      linhaOpcoes(t("ctrl.pattern"), PARTS.pattern, "pattern"),
      linhaCores(t("ctrl.patternColor"), COLORS, "top2"),
      ...(estampas.includes("number") ? [linhaTexto(t("ctrl.number"), "text", 2, (v) => v.replace(/\D/g, ""))] : []),
      linhaCores(t("ctrl.sleeves"), COLORS, "sleeve", t("ctrl.sameShirt")),
      linhaCores(t("ctrl.belt"), COLORS, "belt", t("ctrl.noBelt")),
      linhaCores(t("ctrl.legs"), COLORS, "legs"),
      linhaCores(t("ctrl.cape"), COLORS, "cape", t("ctrl.noCape")),
    ];
  },
  Extras: () => [
    linhaOpcoes(t("ctrl.item"), PARTS.item, "item"),
    linhaCores(t("ctrl.bg"), [...COLORS, ...SKIN_TONES.slice(1, 4)], "bg", t("ctrl.noBg")),
  ],
};

function renderEditor() {
  $("skin-preview").innerHTML = renderAvatar(skinRascunho);
  const nav = $("skin-sections");
  nav.innerHTML = "";
  Object.keys(SKIN_SECOES).forEach((nome) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "tab" + (nome === skinSecao ? " active" : "");
    b.textContent = t("builder." + nome);
    b.onclick = () => { skinSecao = nome; renderEditor(); };
    nav.appendChild(b);
  });
  const c = $("skin-controls");
  c.innerHTML = "";
  c.append(...SKIN_SECOES[skinSecao]());
}

function skinEditorSorteado() {
  const r = (arr) => czPick(arr)[0];
  skinRascunho = {
    ...DEFAULT_AVATAR,
    skin: czPick(SKIN_TONES), hair: r(PARTS.hair), hairColor: czPick(HAIR_COLORS),
    eyes: r(PARTS.eyes), mouth: r(PARTS.mouth.filter(([v]) => v !== "evil")), beard: Math.random() < 0.3 ? r(PARTS.beard) : "none",
    extra: Math.random() < 0.3 ? r(PARTS.extra) : "none", head: Math.random() < 0.5 ? r(PARTS.head) : "none",
    headColor: czPick(COLORS), headColor2: czPick(COLORS), top: czPick(COLORS), top2: czPick(COLORS),
    pattern: r(PARTS.pattern), text: String(1 + Math.floor(Math.random() * 99)), legs: czPick(COLORS),
    cape: Math.random() < 0.15 ? czPick(COLORS) : null, item: Math.random() < 0.4 ? r(PARTS.item) : "none",
  };
  renderEditor();
}

function ligarSkins() {
  $("skin-random").onclick = skinEditorSorteado;
  $("skin-save").onclick = () => escolherSkin({ presetId: null, avatar: { ...skinRascunho } });
}
