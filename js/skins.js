// Escolha de skin: skins prontas por grupo e editor "Personalizar".

let dialogPlayer = 0;
let dialogTab = PRESET_GROUPS[0];
let builderSection = "Rosto";
let draft = null;

function openAvatarDialog(i) {
  dialogPlayer = i;
  draft = { ...DEFAULT_AVATAR, ...JSON.parse(JSON.stringify(players[i].avatar)) };
  $("avatar-dialog-title").textContent = `Skin de ${playerName(players[i], i)}`;
  const current = players[i].presetId && presetById(players[i].presetId);
  dialogTab = current ? current.group : "builder";
  renderAvatarDialog();
  $("avatar-dialog").showModal();
}

function renderAvatarDialog() {
  const tabs = $("avatar-tabs");
  tabs.innerHTML = "";
  [...PRESET_GROUPS, "builder"].forEach((g) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "tab" + (g === "builder" ? " tab-builder" : "") + (g === dialogTab ? " active" : "");
    b.textContent = g === "builder" ? "Personalizar" : g;
    b.addEventListener("click", () => { dialogTab = g; renderAvatarDialog(); });
    tabs.appendChild(b);
  });

  const isBuilder = dialogTab === "builder";
  $("avatar-presets").hidden = isBuilder;
  $("avatar-builder").hidden = !isBuilder;
  $("builder-foot").hidden = !isBuilder;

  if (isBuilder) return renderBuilder();

  const grid = $("avatar-presets");
  grid.innerHTML = "";
  const taken = players.slice(0, playerCount).map((p, i) => (i !== dialogPlayer ? p.presetId : null));
  PRESETS.filter((p) => p.group === dialogTab).forEach((preset) => {
    const card = document.createElement("div");
    card.className = "preset" + (players[dialogPlayer].presetId === preset.id ? " active" : "");
    const inUse = taken.includes(preset.id);
    card.innerHTML = `<button type="button" class="preset-pick">${renderAvatar(preset.cfg)}<span>${escapeHtml(preset.name)}</span></button>${inUse ? '<em class="in-use">em uso</em>' : ""}<button type="button" class="preset-edit">Personalizar</button>`;
    card.querySelector(".preset-pick").addEventListener("click", () => {
      players[dialogPlayer].presetId = preset.id;
      players[dialogPlayer].avatar = { ...preset.cfg };
      store("players", players);
      $("avatar-dialog").close();
      refreshAfterAvatar();
    });
    card.querySelector(".preset-edit").addEventListener("click", () => {
      draft = { ...DEFAULT_AVATAR, ...JSON.parse(JSON.stringify(preset.cfg)) };
      dialogTab = "builder";
      renderAvatarDialog();
    });
    grid.appendChild(card);
  });
}

function swatchRow(label, colors, key, noneLabel = null) {
  const row = document.createElement("div");
  row.className = "ctrl";
  row.innerHTML = `<span class="ctrl-label">${label}</span><div class="swatches"></div>`;
  const wrap = row.querySelector(".swatches");
  const opts = noneLabel ? [null, ...colors] : colors;
  opts.forEach((col) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "swatch" + ((draft[key] || null) === col ? " active" : "") + (col ? "" : " none");
    if (col) b.style.background = col;
    b.title = col || noneLabel;
    b.setAttribute("aria-label", col || noneLabel);
    b.addEventListener("click", () => {
      if (col) draft[key] = col;
      else delete draft[key];
      renderBuilder();
    });
    wrap.appendChild(b);
  });
  return row;
}

function cycleRow(label, options, key) {
  const row = document.createElement("div");
  row.className = "ctrl";
  const value = Array.isArray(draft[key]) ? draft[key][0] : draft[key];
  let idx = options.findIndex(([v]) => v === value);
  const current = idx >= 0 ? options[idx][1] : "Especial";
  row.innerHTML = `<span class="ctrl-label">${label}</span>
    <div class="cycler"><button type="button" aria-label="Anterior">‹</button><span>${current}</span><button type="button" aria-label="Próximo">›</button></div>`;
  const [prev, next] = row.querySelectorAll("button");
  const step = (d) => {
    idx = idx < 0 ? 0 : (idx + d + options.length) % options.length;
    draft[key] = options[idx][0];
    if (key === "head") { draft.headStyle = ""; draft.headText = ""; }
    renderBuilder();
  };
  prev.addEventListener("click", () => step(-1));
  next.addEventListener("click", () => step(1));
  return row;
}

function textRow(label, key, maxlength, filter = (v) => v) {
  const row = document.createElement("div");
  row.className = "ctrl";
  row.innerHTML = `<span class="ctrl-label">${label}</span><input type="text" maxlength="${maxlength}" class="num-input" value="${escapeHtml(draft[key] || "")}">`;
  row.querySelector("input").addEventListener("input", (e) => {
    draft[key] = filter(e.target.value);
    $("builder-preview").innerHTML = renderAvatar(draft);
  });
  return row;
}

const BUILDER_SECTIONS = {
  Rosto: () => [
    swatchRow("Pele", SKIN_TONES, "skin"),
    cycleRow("Olhos", PARTS.eyes, "eyes"),
    cycleRow("Boca", PARTS.mouth, "mouth"),
    cycleRow("Barba", PARTS.beard, "beard"),
    swatchRow("Cor da barba", HAIR_COLORS, "beardColor", "Igual ao cabelo"),
    cycleRow("Detalhe", PARTS.extra, "extra"),
  ],
  Cabelo: () => [
    cycleRow("Corte", PARTS.hair, "hair"),
    swatchRow("Cor", HAIR_COLORS, "hairColor"),
  ],
  "Cabeça": () => [
    cycleRow("Acessório", PARTS.head, "head"),
    swatchRow("Cor principal", COLORS, "headColor"),
    swatchRow("Segunda cor", COLORS, "headColor2"),
    ...(draft.head === "cap" ? [textRow("Letra do boné", "headText", 1, (v) => v.toUpperCase())] : []),
  ],
  Roupa: () => {
    const pat = Array.isArray(draft.pattern) ? draft.pattern : [draft.pattern];
    return [
      swatchRow("Camisa", COLORS, "top"),
      cycleRow("Estampa", PARTS.pattern, "pattern"),
      swatchRow("Cor da estampa", COLORS, "top2"),
      ...(pat.includes("number") ? [textRow("Número", "text", 2, (v) => v.replace(/\D/g, ""))] : []),
      swatchRow("Mangas", COLORS, "sleeve", "Igual à camisa"),
      swatchRow("Cinto", COLORS, "belt", "Sem cinto"),
      swatchRow("Calça", COLORS, "legs"),
      swatchRow("Capa", COLORS, "cape", "Sem capa"),
    ];
  },
  Extras: () => [
    cycleRow("Na mão", PARTS.item, "item"),
    swatchRow("Fundo", [...COLORS, ...SKIN_TONES.slice(1, 4)], "bg", "Sem fundo"),
  ],
};

function renderBuilder() {
  $("builder-preview").innerHTML = renderAvatar(draft);
  const nav = $("builder-sections");
  nav.innerHTML = "";
  Object.keys(BUILDER_SECTIONS).forEach((name) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "chip" + (name === builderSection ? " active" : "");
    b.textContent = name;
    b.addEventListener("click", () => { builderSection = name; renderBuilder(); });
    nav.appendChild(b);
  });
  const c = $("builder-controls");
  c.innerHTML = "";
  c.append(...BUILDER_SECTIONS[builderSection]());
}

function randomAvatar() {
  const r = (arr) => pick(arr)[0];
  draft = {
    ...DEFAULT_AVATAR,
    skin: pick(SKIN_TONES), hair: r(PARTS.hair), hairColor: pick(HAIR_COLORS),
    eyes: r(PARTS.eyes), mouth: r(PARTS.mouth.filter(([v]) => v !== "evil")), beard: Math.random() < 0.3 ? r(PARTS.beard) : "none",
    extra: Math.random() < 0.3 ? r(PARTS.extra) : "none", head: Math.random() < 0.5 ? r(PARTS.head) : "none",
    headColor: pick(COLORS), headColor2: pick(COLORS), top: pick(COLORS), top2: pick(COLORS),
    pattern: r(PARTS.pattern), text: String(1 + Math.floor(Math.random() * 99)), legs: pick(COLORS),
    cape: Math.random() < 0.15 ? pick(COLORS) : null, item: Math.random() < 0.4 ? r(PARTS.item) : "none",
  };
  renderBuilder();
}
