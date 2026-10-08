// Utilidades de tela: atalhos, armazenamento, ícones, o pato, sons e confete.

const $ = (id) => document.getElementById(id);

// Guarda no navegador. Tema, idioma e som são os mesmos do Gamezi (tt:); o resto é do Patozi (pz:).
const PZ_COMPARTILHADO = ["lang", "theme", "sound"];

function store(key, value) {
  const k = (PZ_COMPARTILHADO.includes(key) ? "tt:" : "pz:") + key;
  try {
    if (value === undefined) return JSON.parse(localStorage.getItem(k));
    localStorage.setItem(k, JSON.stringify(value));
    if (store.onWrite) store.onWrite(key);
  } catch (e) {
    return null;
  }
}

// Troca o conteúdo só quando mudou. A sala online redesenha várias vezes por segundo (presença e avisos);
// sem isso, um botão pode ser trocado bem na hora do toque.
function trocarHtml(el, html) {
  if (el.pzHtml === html) return;
  el.pzHtml = html;
  el.innerHTML = html;
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

function shareText(text, btn) {
  const label = btn ? btn.textContent : "";
  const done = () => {
    if (!btn) return;
    btn.textContent = t("copied");
    setTimeout(() => (btn.textContent = label), 1800);
  };
  if (navigator.share && matchMedia("(hover: none)").matches) {
    navigator.share({ text }).catch(() => {});
    return;
  }
  if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, () => prompt(t("copyPrompt"), text));
  else prompt(t("copyPrompt"), text);
}

// Lê um número digitado com ou sem pontos ("1.500", "1,500", "1500").
function lerNumero(texto) {
  const s = String(texto || "").replace(/[\s.,_]/g, "");
  if (!/^\d{1,13}$/.test(s)) return NaN;
  return Number(s);
}

// ───────────── telas ─────────────

const SCREENS = ["home", "setup", "game", "results", "daily", "online", "lobby", "profile"];

function show(name) {
  SCREENS.forEach((s) => ($("screen-" + s).hidden = s !== name));
  document.body.dataset.screen = name;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ───────────── ícones ─────────────

const UI_ICONS = {
  lock: '<svg class="ui-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
  moon: '<svg class="ui-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/></svg>',
  sun: '<svg class="ui-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/></svg>',
  help: '<svg class="ui-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/><path d="M9.3 9.2a2.8 2.8 0 0 1 5.4 1c0 1.9-2.7 2.4-2.7 4"/><circle cx="12" cy="17.6" r=".6" fill="currentColor"/></svg>',
  soundOn: '<svg class="ui-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4.2 4.2 0 0 1 0 6M18.2 6.5a8 8 0 0 1 0 11"/></svg>',
  soundOff: '<svg class="ui-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/></svg>',
  user: '<svg class="ui-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8.5" r="4"/><path d="M4.5 20.5c.9-3.8 3.9-6 7.5-6s6.6 2.2 7.5 6"/></svg>',
  shield: '<svg class="ui-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M12 3 4.5 6v5.5c0 4.6 3.2 8 7.5 9.5 4.3-1.5 7.5-4.9 7.5-9.5V6z"/></svg>',
  bot: '<svg class="ui-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="8" width="16" height="11" rx="3"/><path d="M12 4v4M9 13h.01M15 13h.01M9.5 16h5"/></svg>',
};

// Ícones dos temas: traço que herda a cor do texto.
const THEME_ICONS = {
  corpo: '<path d="M12 21s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 8a4.3 4.3 0 0 1 7.5 2.8C19.5 16.4 12 21 12 21z"/><path d="M4.5 12.5h4l1.5-3 3 6 1.5-3h5"/>',
  animais: '<ellipse cx="12" cy="16" rx="4.5" ry="3.8"/><circle cx="6" cy="10.5" r="1.9"/><circle cx="9.5" cy="6.5" r="1.9"/><circle cx="14.5" cy="6.5" r="1.9"/><circle cx="18" cy="10.5" r="1.9"/>',
  espaco: '<circle cx="12" cy="12" r="5"/><ellipse cx="12" cy="12" rx="10" ry="3.5" transform="rotate(-20 12 12)"/>',
  ciencia: '<path d="M9.5 3h5M10.5 3v6L5 18.5A1.7 1.7 0 0 0 6.5 21h11a1.7 1.7 0 0 0 1.5-2.5L13.5 9V3"/><path d="M7.5 14h9"/>',
  mundo: '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>',
  brasil: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M12 7.5 19 12l-7 4.5L5 12z"/><circle cx="12" cy="12" r="2.2"/>',
  historia: '<path d="M3 9.5 12 4l9 5.5zM4 21h16M5.5 9.5v9M10 9.5v9M14 9.5v9M18.5 9.5v9M3 18.5h18"/>',
  futebol: '<circle cx="12" cy="12" r="9"/><path d="m12 8 3.4 2.5-1.3 4h-4.2l-1.3-4z"/><path d="M12 8V3.5M15.4 10.5l4.2-1.4M14.1 14.5l2.6 3.6M9.9 14.5l-2.6 3.6M8.6 10.5 4.4 9.1"/>',
  esporte: '<circle cx="12" cy="15" r="5.5"/><path d="M8.5 10.7 6 3h4l2 5 2-5h4l-2.5 7.7"/><path d="M12 12.5v5"/>',
  cinema: '<rect x="3" y="9" width="18" height="11" rx="2"/><path d="m3.5 9-.8-3.6 16.6-3.3.8 3.6z"/><path d="m8 4.8 2 3.4M13.2 3.8l2 3.4"/>',
  musica: '<path d="M9 18V5.5l11-2V16"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/><path d="M9 9.5l11-2"/>',
  jogos: '<path d="M6.5 7h11a4 4 0 0 1 3.9 4.8l-1 5a2.6 2.6 0 0 1-4.5 1.2L14.3 16H9.7l-1.6 2a2.6 2.6 0 0 1-4.5-1.2l-1-5A4 4 0 0 1 6.5 7z"/><path d="M8 10v4M6 12h4"/><circle cx="15.5" cy="11" r=".9"/><circle cx="17.5" cy="13" r=".9"/>',
  comida: '<path d="M4 11h16a8 8 0 0 1-16 0z"/><path d="M12 11V7M9 4.5c0 1.5 1.5 1.5 1.5 3M15 4.5c0 1.5-1.5 1.5-1.5 3"/><path d="M8 21h8"/>',
  numeros: '<rect x="3.5" y="3.5" width="17" height="17" rx="3"/><path d="M7 8.5h4M9 6.5v4M13.5 8.5h4M7 15.5l3 3M10 15.5l-3 3M13.5 15h4M13.5 18h4"/>',
  tecnologia: '<rect x="3" y="4.5" width="18" height="12" rx="2"/><path d="M8 20.5h8M12 16.5v4"/>',
  biblia: '<path d="M6 3.5h11.5a1 1 0 0 1 1 1V20a.5.5 0 0 1-.5.5H6.5A2.5 2.5 0 0 1 4 18V5.5a2 2 0 0 1 2-2z"/><path d="M4 18a2.5 2.5 0 0 1 2.5-2.5h12M11.5 7v6M9 9.5h5"/>',
  curiosidades: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.7.5 1.1 1.3 1.1 2.2h5c0-.9.4-1.7 1.1-2.2A6 6 0 0 0 12 3z"/>',
  transporte: '<path d="M3.5 16.5v-3.2l2.2-4.6A2 2 0 0 1 7.5 7.5h9a2 2 0 0 1 1.8 1.2l2.2 4.6v3.2a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1z"/><path d="M3.5 13.3h17"/><circle cx="7.5" cy="17.5" r="1.8"/><circle cx="16.5" cy="17.5" r="1.8"/>',
  natureza: '<path d="M3 20 9.5 8l4 7 2.5-4 5 9z"/><path d="M7.6 11.5 9.5 13l1.8-1.6"/><circle cx="17.5" cy="5.5" r="2"/>',
  arte: '<path d="M12 3.5a8.5 8.5 0 1 0 0 17c1.2 0 1.8-.8 1.8-1.7 0-1.1-.9-1.6-.9-2.6 0-1 .8-1.7 1.8-1.7h2.2a3.6 3.6 0 0 0 3.6-3.6C20.5 6.9 16.7 3.5 12 3.5z"/><circle cx="7.8" cy="11" r="1.1"/><circle cx="10.5" cy="7.3" r="1.1"/><circle cx="15" cy="7.6" r="1.1"/>',
  desenhos: '<path d="M12 3.5 14.6 9l5.9.6-4.4 4 1.3 5.9L12 16.5l-5.4 3 1.3-5.9-4.4-4L9.4 9z"/><path d="M10.3 12h.01M13.7 12h.01M10.5 14c.9.7 2.1.7 3 0"/>',
  palavras: '<path d="M4.5 5.5h15a1 1 0 0 1 1 1V15a1 1 0 0 1-1 1H11l-4.5 3.5V16h-2a1 1 0 0 1-1-1V6.5a1 1 0 0 1 1-1z"/><path d="m8 13.5 2.2-5.5 2.2 5.5M8.8 11.7h2.8M14.5 9h2.5M14.5 12h2.5"/>',
  dinheiro: '<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.8"/><path d="M6.5 9.5v5M17.5 9.5v5"/>',
};

function themeIcon(id) {
  return `<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${THEME_ICONS[id] || THEME_ICONS.curiosidades}</svg>`;
}

function temaNome(id) {
  const tema = PZ_TEMAS.find((x) => x.id === id);
  return tema ? tr(tema.nome) : id;
}

// ───────────── o pato ─────────────

const PZ_CORES = ["#FFC93C", "#FF4D3D", "#3D7BFF", "#2FBF71", "#9B5DE5", "#FF8C42", "#FF7EB6", "#2EC4D6", "#A0703C", "#F2EBDD"];

// Guarda-roupa do pato: cada categoria tem itens desenhados no mesmo quadro de 100×100 do pato.
// Camadas, de trás para a frente: atras, corpo (por cima do corpo; "CLIP" recorta no formato do corpo),
// asa (o que o pato segura), pescoco (por cima da cabeça) e topo (por cima do olho).
// O visual de cada um é { chapeu, rosto, roupa, asa } com os ids abaixo; id desconhecido é ignorado.
const PZ_TRACO = 'stroke="#171717" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"';
const PZ_VISUAL = [
  { id: "chapeu", nome: ["Chapéu", "Hat", "Sombrero"], itens: [
    { id: "bone", nome: ["Boné", "Cap", "Gorra"], topo: `<path d="M41 27a19 17 0 0 1 38 0z" fill="#FF4D3D" ${PZ_TRACO}/><path d="M76 24h15a3 3 0 0 1 0 6H75z" fill="#FF4D3D" ${PZ_TRACO}/><circle cx="60" cy="10" r="2.6" fill="#171717"/>` },
    { id: "cartola", nome: ["Cartola", "Top hat", "Sombrero de copa"], topo: `<rect x="47" y="1" width="26" height="18" rx="2" fill="#171717"/><rect x="47" y="12" width="26" height="4" fill="#FF4D3D"/><rect x="39" y="16" width="42" height="5" rx="2.5" fill="#171717"/>` },
    { id: "coroa", nome: ["Coroa", "Crown", "Corona"], topo: `<path d="M44 20 45 4l9 8 6-10 6 10 9-8 1 16z" fill="#FFC93C" ${PZ_TRACO}/><circle cx="60" cy="14" r="2.4" fill="#FF4D3D"/>` },
    { id: "festa", nome: ["Chapéu de festa", "Party hat", "Gorro de fiesta"], topo: `<path d="M48 19 60 4l12 15z" fill="#9B5DE5" ${PZ_TRACO}/><path d="M52.5 14h15M56.5 9h7" stroke="#FFC93C" stroke-width="2.5" stroke-linecap="round"/><circle cx="60" cy="4.5" r="3.5" fill="#FF7EB6" ${PZ_TRACO}/>` },
    { id: "touca", nome: ["Touca", "Beanie", "Gorro"], topo: `<path d="M42 26a18 17 0 0 1 36 0z" fill="#3D7BFF" ${PZ_TRACO}/><rect x="40" y="21" width="40" height="8" rx="4" fill="#3D7BFF" ${PZ_TRACO}/><circle cx="60" cy="7.5" r="4.5" fill="#FFF4DE" ${PZ_TRACO}/>` },
    { id: "cauboi", nome: ["Chapéu de caubói", "Cowboy hat", "Sombrero vaquero"], topo: `<path d="M47 20c0-9 3-15 7-15 2 0 4 2 6 2s4-2 6-2c4 0 7 6 7 15z" fill="#A0703C" ${PZ_TRACO}/><path d="M33 19c6 5 48 5 54 0 0 4-6 8-12 8H45c-6 0-12-4-12-8z" fill="#A0703C" ${PZ_TRACO}/><path d="M47.5 16.5h25" stroke="#171717" stroke-width="3"/>` },
    { id: "viking", nome: ["Capacete viking", "Viking helmet", "Casco vikingo"], topo: `<path d="M42 21c-6-1-10-7-9-14 3 5 7 7 12 7zM78 21c6-1 10-7 9-14-3 5-7 7-12 7z" fill="#FFF4DE" ${PZ_TRACO}/><path d="M41 27a19 17 0 0 1 38 0z" fill="#9AA3AE" ${PZ_TRACO}/><path d="M60 10v17" stroke="#171717" stroke-width="2.5"/>` },
    { id: "aureola", nome: ["Auréola", "Halo", "Aureola"], topo: `<ellipse cx="60" cy="7" rx="15" ry="4.5" fill="none" stroke="#171717" stroke-width="6.5"/><ellipse cx="60" cy="7" rx="15" ry="4.5" fill="none" stroke="#FFC93C" stroke-width="3.2"/>` },
    { id: "mago", nome: ["Chapéu de mago", "Wizard hat", "Sombrero de mago"], topo: `<path d="M43 21C49 14 52 6 61 1c1 6 5 13 17 20z" fill="#9B5DE5" ${PZ_TRACO}/><path d="M38 21.5h45" stroke="#171717" stroke-width="4.5" stroke-linecap="round"/><path d="M38 21.5h45" stroke="#9B5DE5" stroke-width="2" stroke-linecap="round"/><path d="m60 9 1.2 2.6 2.8.3-2.1 1.9.6 2.8-2.5-1.4-2.5 1.4.6-2.8-2.1-1.9 2.8-.3z" fill="#FFC93C"/>` },
    { id: "laco", nome: ["Laço", "Bow", "Moño"], topo: `<path d="M57 15 46 8v14zM57 15l11-7v14z" fill="#FF7EB6" ${PZ_TRACO}/><circle cx="57" cy="15" r="3.4" fill="#FF7EB6" ${PZ_TRACO}/>` },
  ] },
  { id: "rosto", nome: ["Rosto", "Face", "Cara"], itens: [
    { id: "oculos", nome: ["Óculos", "Glasses", "Lentes"], topo: `<circle cx="66" cy="30" r="7.5" fill="rgba(255,255,255,.3)" stroke="#171717" stroke-width="3"/><path d="M58.5 29 42 27" stroke="#171717" stroke-width="3" stroke-linecap="round"/>` },
    { id: "escuros", nome: ["Óculos escuros", "Sunglasses", "Lentes de sol"], topo: `<path d="M57 25h18v5c0 4-3 7-7 7h-4c-4 0-7-3-7-7z" fill="#171717"/><path d="M58 26 42 24" stroke="#171717" stroke-width="3" stroke-linecap="round"/><path d="M60.5 28.5h5" stroke="#fff" stroke-width="1.8" stroke-linecap="round" opacity=".75"/>` },
    { id: "coracao", nome: ["Óculos de coração", "Heart glasses", "Lentes de corazón"], topo: `<path d="M66 38c-6-4-9.5-7.5-9.5-11a4.6 4.6 0 0 1 9.5-1.3 4.6 4.6 0 0 1 9.5 1.3c0 3.5-3.5 7-9.5 11z" fill="#FF4D3D" stroke="#171717" stroke-width="2.5" stroke-linejoin="round"/><path d="M57 27.5 42 26" stroke="#171717" stroke-width="3" stroke-linecap="round"/>` },
    { id: "monoculo", nome: ["Monóculo", "Monocle", "Monóculo"], topo: `<path d="M66 37q-1 9-9 14" stroke="#171717" stroke-width="1.6" fill="none"/><circle cx="66" cy="30" r="7.5" fill="rgba(255,255,255,.3)" stroke="#171717" stroke-width="3"/><circle cx="66" cy="30" r="5.6" fill="none" stroke="#FFC93C" stroke-width="1.6"/>` },
    { id: "mascara", nome: ["Máscara de herói", "Hero mask", "Antifaz de héroe"], topo: `<path fill-rule="evenodd" d="M42 24q18-6 35 0v11q-17-4-35 0zM60.5 30a5.5 4.6 0 1 0 11 0a5.5 4.6 0 1 0-11 0z" fill="#171717"/>` },
    { id: "estrela", nome: ["Óculos de estrela", "Star glasses", "Lentes de estrella"], topo: `<path d="M57 27.5 42 25.5" stroke="#171717" stroke-width="3" stroke-linecap="round"/><path d="m66 20.5 2.8 5.6 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2-4.5-4.4 6.2-.9z" fill="#FFC93C" stroke="#171717" stroke-width="2.2" stroke-linejoin="round"/>` },
    { id: "bigode", nome: ["Bigode", "Mustache", "Bigote"], topo: `<path d="M71 42c3-4.5 7.5-4.5 10-1 2.5-3.5 7-3.5 10 1-3 3.5-7.5 3-10 .5-2.5 2.5-7 3-10-.5z" fill="#171717"/>` },
  ] },
  { id: "roupa", nome: ["Roupa", "Outfit", "Ropa"], itens: [
    { id: "cachecol", nome: ["Cachecol", "Scarf", "Bufanda"], pescoco: `<path d="M47 54l-5 15 8 1.5 3-14z" fill="#FF4D3D" ${PZ_TRACO}/><path d="M42 47q18 9 36 0l1 8q-19 10-38 0z" fill="#FF4D3D" ${PZ_TRACO}/><path d="M43.5 61.5l6 1M42.5 65.5l6 1" stroke="#FFF4DE" stroke-width="2"/>` },
    { id: "gravata", nome: ["Gravata", "Tie", "Corbata"], pescoco: `<path d="M57.5 57h5l3 13-5.5 5-5.5-5z" fill="#3D7BFF" ${PZ_TRACO}/><path d="M55.5 52h9l-2 5.5h-5z" fill="#3D7BFF" ${PZ_TRACO}/>` },
    { id: "borboleta", nome: ["Gravata-borboleta", "Bow tie", "Moño"], pescoco: `<path d="M60 55 49 49.5v11zM60 55l11-5.5v11z" fill="#FF4D3D" ${PZ_TRACO}/><circle cx="60" cy="55" r="2.8" fill="#FF4D3D" ${PZ_TRACO}/>` },
    { id: "colar", nome: ["Corrente de ouro", "Gold chain", "Cadena de oro"], pescoco: `<path d="M44 49q16 13 32 0" fill="none" stroke="#171717" stroke-width="5.5" stroke-linecap="round"/><path d="M44 49q16 13 32 0" fill="none" stroke="#FFC93C" stroke-width="2.6" stroke-dasharray="2.5 1.5"/><circle cx="60" cy="59.5" r="4.5" fill="#FFC93C" ${PZ_TRACO}/>` },
    { id: "listrada", nome: ["Camiseta listrada", "Striped shirt", "Camiseta a rayas"], corpo: `<g clip-path="url(#CLIP)"><rect y="57" width="100" height="43" fill="#FFF4DE"/><path d="M0 63h100M0 71h100M0 79h100M0 87h100" stroke="#FF4D3D" stroke-width="4"/></g>` },
    { id: "camisa", nome: ["Camisa 10", "Number 10 shirt", "Camiseta 10"], corpo: `<g clip-path="url(#CLIP)"><rect y="57" width="100" height="43" fill="#2FBF71"/><path d="M0 59h100" stroke="#FFC93C" stroke-width="4"/><text x="22" y="84" font-family="Arial, sans-serif" font-size="17" font-weight="800" fill="#FFF4DE">10</text></g>` },
    { id: "smoking", nome: ["Smoking", "Tuxedo", "Esmoquin"], corpo: `<g clip-path="url(#CLIP)"><rect y="57" width="100" height="43" fill="#171717"/><path d="M51 56h18l-9 17z" fill="#FFF4DE"/></g>`, pescoco: `<path d="M60 56.5 52 52.5v8zM60 56.5l8-4v8z" fill="#171717"/>` },
    { id: "dourada", nome: ["Capa dourada", "Golden cape", "Capa dorada"], corpo: `<path d="M50 53C36 55 20 56 9 53c-4 11-3 25 5 34 6-13 16-21 27-25 6-2 9-6 9-9z" fill="#FFC93C" ${PZ_TRACO}/><path d="M16 62l2 4 4 .6-3 2.8.8 4-3.8-2-3.8 2 .8-4-3-2.8 4-.6z" fill="#FFF4DE"/>` },
    { id: "capa", nome: ["Capa de herói", "Hero cape", "Capa de héroe"], corpo: `<path d="M50 53C36 55 20 56 9 53c-4 11-3 25 5 34 6-13 16-21 27-25 6-2 9-6 9-9z" fill="#FF4D3D" ${PZ_TRACO}/>` },
  ] },
  { id: "asa", nome: ["Na asa", "In the wing", "En el ala"], itens: [
    { id: "balao", nome: ["Balão", "Balloon", "Globo"], asa: `<path d="M40 66Q30 52 23 37" stroke="#171717" stroke-width="1.6" fill="none"/><ellipse cx="21" cy="23" rx="11" ry="13" fill="#FF4D3D" ${PZ_TRACO}/><path d="M21 36l-2.5 3h5z" fill="#FF4D3D" ${PZ_TRACO}/><path d="M15 17q2-4 6-5" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".7"/>` },
    { id: "bandeira", nome: ["Bandeira", "Flag", "Bandera"], asa: `<path d="M40 66 29 16" stroke="#171717" stroke-width="3" stroke-linecap="round"/><path d="M29.5 18 6 14l5 9-4 9 25.5 3z" fill="#2FBF71" ${PZ_TRACO}/><path d="M13 24l7-5 7 6-7 5z" fill="#FFC93C"/>` },
    { id: "pirulito", nome: ["Pirulito", "Lollipop", "Paleta"], asa: `<path d="M40 66 30 36" stroke="#FFF4DE" stroke-width="3.5" stroke-linecap="round"/><path d="M40 66 30 36" stroke="#171717" stroke-width="1" stroke-linecap="round" opacity=".4"/><circle cx="28" cy="27" r="10" fill="#FF7EB6" ${PZ_TRACO}/><path d="M28 27a3 3 0 1 1 3 3 6 6 0 1 1-6-6" stroke="#FFF4DE" stroke-width="2.2" fill="none" stroke-linecap="round"/>` },
    { id: "trofeu", nome: ["Troféu", "Trophy", "Trofeo"], asa: `<path d="M40 66 30 46" stroke="#171717" stroke-width="3" stroke-linecap="round"/><path d="M15 18h20v7c0 7-4.5 11-10 11s-10-4-10-11z" fill="#FFC93C" ${PZ_TRACO}/><path d="M15 21h-4c0 5 2 8 5 8M35 21h4c0 5-2 8-5 8" fill="none" ${PZ_TRACO}/><path d="M22 36h6v5h-6zM17 41h16v4H17z" fill="#FFC93C" ${PZ_TRACO}/>` },
    { id: "foguete", nome: ["Foguete", "Rocket", "Cohete"], asa: `<path d="M40 65 32 46" stroke="#171717" stroke-width="3" stroke-linecap="round"/><g transform="rotate(-25 26 24)"><path d="M26 5c6 5 7 15 4 24h-8c-3-9-2-19 4-24z" fill="#FFF4DE" ${PZ_TRACO}/><circle cx="26" cy="16" r="2.8" fill="#3D7BFF" stroke="#171717" stroke-width="1.6"/><path d="M22 25l-5 7h6zM30 25l5 7h-6z" fill="#FF4D3D" ${PZ_TRACO}/><path d="M23.5 30l2.5 7 2.5-7z" fill="#FFC93C"/></g>` },
    { id: "medalha", nome: ["Medalha", "Medal", "Medalla"], asa: `<path d="M40 66 30 47" stroke="#171717" stroke-width="3" stroke-linecap="round"/><path d="M18 8l6 13 6-13z" fill="#3D7BFF" ${PZ_TRACO}/><circle cx="24" cy="29" r="9.5" fill="#FFC93C" ${PZ_TRACO}/><path d="m24 24 1.5 3 3.3.5-2.4 2.3.6 3.3-3-1.6-3 1.6.6-3.3-2.4-2.3 3.3-.5z" fill="#FFF4DE"/>` },
    { id: "microfone", nome: ["Microfone", "Microphone", "Micrófono"], asa: `<path d="M40 65 31 41" stroke="#171717" stroke-width="5" stroke-linecap="round"/><circle cx="28.5" cy="34" r="8" fill="#9AA3AE" ${PZ_TRACO}/><path d="M23.5 31h10M23 35h11" stroke="#171717" stroke-width="1.4" opacity=".5"/>` },
  ] },
];

// Itens válidos do visual (o que vier do banco ou de outro aparelho passa por aqui).
function patoItens(pato) {
  if (!pato || typeof pato !== "object") return [];
  return PZ_VISUAL.map((cat) => cat.itens.find((it) => it.id === pato[cat.id])).filter(Boolean);
}

// Só os ids que existem (para salvar e mandar para o banco).
function patoLimpo(pato) {
  const out = {};
  PZ_VISUAL.forEach((cat) => {
    if (pato && cat.itens.some((it) => it.id === pato[cat.id])) out[cat.id] = pato[cat.id];
  });
  return out;
}

// Itens liberados neste aparelho (alguns só com conquistas do Gamezi, ver gamezi-conta.js).
function itensLiberados(cat) {
  if (typeof gameziProgresso !== "function") return cat.itens;
  const prog = gameziProgresso();
  return cat.itens.filter((it) => gameziItemLiberado(prog, cat.id, it.id));
}

function patoSorteado(rnd = Math.random) {
  const out = {};
  PZ_VISUAL.forEach((cat) => {
    const itens = itensLiberados(cat);
    if (rnd() < 0.55 && itens.length) out[cat.id] = itens[Math.floor(rnd() * itens.length)].id;
  });
  return out;
}

const PATO_CORPO = "M10 52c4 1 9 4 14 4h40c13 0 24 8 24 20 0 9-8 16-20 16H38C20 92 8 80 8 64c0-5 .5-9 2-12z";

// Pato de perfil, olhando para a direita. mood: "" | "sad" | "happy". pato: o visual (chapéu, rosto, roupa, asa).
function patoSvg(cor = PZ_CORES[0], mood = "", pato = null) {
  const c = typeof cor === "number" ? PZ_CORES[cor % PZ_CORES.length] : cor;
  const eye = mood === "sad"
    ? '<circle cx="66" cy="31" r="3.6" fill="#171717"/><path d="M59 24.5l11 3" stroke="#171717" stroke-width="3" stroke-linecap="round"/>'
    : mood === "happy"
      ? '<path d="M62 32q4 -5 8 0" stroke="#171717" stroke-width="3" fill="none" stroke-linecap="round"/>'
      : '<circle cx="66" cy="30" r="4" fill="#171717"/><circle cx="67.4" cy="28.6" r="1.3" fill="#fff"/>';
  const itens = patoItens(pato);
  const camada = (k) => itens.map((it) => (it[k] ? `<g data-item="${it.id}">${it[k]}</g>` : "")).join("");
  // O id do recorte depende só do visual: o mesmo pato gera o mesmo desenho (e trocarHtml não redesenha à toa).
  const clip = "pzc-" + (c + "-" + itens.map((it) => it.id).join("-")).replace(/[^a-z0-9-]/gi, "");
  const corpo = camada("corpo").replace(/CLIP/g, clip);
  return `<svg class="pato" viewBox="0 0 100 100" aria-hidden="true">
    <path d="${PATO_CORPO}" fill="${c}"/>
    ${corpo ? `<clipPath id="${clip}"><path d="${PATO_CORPO}"/></clipPath>${corpo}` : ""}
    <path d="${PATO_CORPO}" fill="none" stroke="#171717" stroke-width="3.5" stroke-linejoin="round"/>
    <path d="M36 68c8-6 22-6 28 2-6 7-20 8-28-2z" fill="rgba(0,0,0,.14)"/>
    ${camada("asa")}
    <circle cx="60" cy="34" r="20" fill="${c}" stroke="#171717" stroke-width="3.5"/>
    ${camada("pescoco")}
    <path d="M77 30c6-2 13-1 17 2-2 6-10 8-17 6z" fill="#FF4D3D" stroke="#171717" stroke-width="3.5" stroke-linejoin="round"/>
    ${eye}
    ${camada("topo")}
  </svg>`;
}

const PATO_MINI = '<svg class="pato-mini" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12.5c1 .3 2 .9 3.2.9h9c3 0 5.3 1.8 5.3 4.4 0 2-1.8 3.6-4.4 3.6H9.3C5.2 21.4 2.6 18.7 2.6 15.2c0-1 .1-1.9.4-2.7z"/><circle cx="14" cy="8.3" r="4.6"/><path d="M18 7.3c1.3-.4 3-.2 3.9.5-.4 1.4-2.3 1.8-3.9 1.4z" class="bico"/></svg>';

function patosHtml(n) {
  return `<span class="ducks" aria-label="${escapeHtml(tn("game.ducks", n))}">${PATO_MINI.repeat(Math.min(n, 6))}</span>`;
}

// ───────────── tema e som ─────────────

function isDark() {
  return (document.documentElement.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")) === "dark";
}

function renderThemeBtn() {
  const b = $("theme-btn");
  b.innerHTML = UI_ICONS[isDark() ? "sun" : "moon"];
  b.title = t(isDark() ? "nav.light" : "nav.dark");
  b.setAttribute("aria-label", b.title);
}

function toggleTheme() {
  const next = isDark() ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  store("theme", next);
  renderThemeBtn();
}

let soundOn = store("sound") !== false;
let audioCtx = null;

function beep(notes, type = "sine", dur = 0.12, gap = 0.08, vol = 0.18) {
  if (!soundOn) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const t0 = audioCtx.currentTime;
    notes.forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      const at = t0 + i * gap;
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(vol, at + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(at);
      osc.stop(at + dur + 0.02);
    });
  } catch (e) { /* sem áudio, sem problema */ }
}

const sfx = {
  tick: () => beep([880], "sine", 0.05, 0, 0.05),
  bid: () => beep([523, 784], "triangle", 0.1, 0.06, 0.1),
  // "Quén quén": o grito de "Nem a pato!".
  quack: () => beep([440, 330, 440, 300], "sawtooth", 0.11, 0.09, 0.07),
  drumroll: (ms = 1200) => {
    const hits = Math.floor(ms / 65);
    for (let k = 0; k < hits; k++) setTimeout(() => beep([92 + (k % 2) * 14], "triangle", 0.06, 0, 0.04 + (k / hits) * 0.14), k * 65);
  },
  good: () => beep([523, 659, 784, 1047], "triangle", 0.16, 0.07),
  bad: () => beep([196, 147], "sawtooth", 0.18, 0.12, 0.08),
  win: () => beep([523, 659, 784, 1047, 784, 1047, 1319], "triangle", 0.2, 0.11),
  lose: () => beep([392, 370, 349, 294], "sawtooth", 0.42, 0.4, 0.07),
};

function renderSoundBtn() {
  const b = $("sound-btn");
  b.innerHTML = UI_ICONS[soundOn ? "soundOn" : "soundOff"];
  b.title = t(soundOn ? "nav.soundOn" : "nav.soundOff");
  b.setAttribute("aria-label", b.title);
  b.setAttribute("aria-pressed", String(soundOn));
}

function toggleSound() {
  soundOn = !soundOn;
  store("sound", soundOn);
  renderSoundBtn();
  sfx.tick();
}

// ───────────── confete (e penas) ─────────────

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const fx = (() => {
  const canvas = $("fx");
  const ctx = canvas.getContext("2d");
  let parts = [];
  let running = false;
  const colors = ["#FF4D3D", "#FFC93C", "#171717", "#FF8A7F", "#3D7BFF", "#2FBF71"];

  function resize() {
    canvas.width = innerWidth * devicePixelRatio;
    canvas.height = innerHeight * devicePixelRatio;
  }
  addEventListener("resize", resize);
  resize();

  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    parts = parts.filter((p) => p.life > 0);
    for (const p of parts) {
      p.vy += p.feather ? 0.04 : 0.25;
      if (p.feather) p.vx = Math.sin((p.life + p.rot) / 12) * 1.6;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      p.life -= 1;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = Math.min(1, p.life / 30);
      ctx.fillStyle = p.color;
      if (p.feather) {
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size * 1.4, p.size * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();
      } else ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      ctx.restore();
    }
    if (parts.length) requestAnimationFrame(loop);
    else running = false;
  }

  function start() {
    if (!running) {
      running = true;
      requestAnimationFrame(loop);
    }
  }

  return {
    confetti(n = 140) {
      if (reduceMotion) return;
      const d = devicePixelRatio;
      for (let i = 0; i < n; i++) {
        parts.push({
          x: canvas.width / 2 + (Math.random() - 0.5) * 200 * d, y: canvas.height * 0.35,
          vx: (Math.random() - 0.5) * 22 * d, vy: (-Math.random() * 16 - 6) * d,
          rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4,
          size: (6 + Math.random() * 8) * d, color: colors[i % colors.length], life: 120 + Math.random() * 60,
        });
      }
      start();
    },
    // Penas caindo devagar, para o pato da rodada.
    feathers(color = "#FFC93C", n = 26) {
      if (reduceMotion) return;
      const d = devicePixelRatio;
      for (let i = 0; i < n; i++) {
        parts.push({
          feather: true, x: Math.random() * canvas.width, y: -20 * d - Math.random() * 200 * d,
          vx: 0, vy: (1 + Math.random() * 1.5) * d, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.05,
          size: (7 + Math.random() * 6) * d, color: i % 3 ? color : "#F2EBDD", life: 200 + Math.random() * 80,
        });
      }
      start();
    },
  };
})();
