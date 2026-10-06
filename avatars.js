// Avatares no estilo boneco de montar.
// Todo avatar é um objeto de configuração (cfg) desenhado por renderAvatar().
// As skins prontas (PRESETS) e o editor "Criar o meu" usam as mesmas peças.

const SKIN_TONES = ["#F7C948", "#F6D7BE", "#EBBE97", "#C68642", "#8D5524", "#5C3A21", "#E6E9EF", "#5FA548", "#8E6FB5", "#4C8BF5"];
const COLORS = ["#16133A", "#1A1A1A", "#FFFFFF", "#D62828", "#F77F00", "#FFC23D", "#2BA84A", "#2A9D8F", "#1F4BA5", "#4CC9F0", "#7B2CBF", "#F4A6B7", "#8B5E3C", "#9AA0B5"];
const HAIR_COLORS = ["#1A1A1A", "#4A2F1B", "#8B5E3C", "#B5651D", "#E9C46A", "#F5E6A8", "#D9D9D9", "#FFFFFF", "#C1440E", "#D62828", "#2BA84A", "#4C8BF5", "#7B2CBF", "#F4A6B7"];

// Opções do editor: [valor, rótulo]
const PARTS = {
  hair: [["none", "Careca"], ["buzz", "Raspado"], ["short", "Curto"], ["spiky", "Espetado"], ["messy", "Bagunçado"], ["slick", "Penteado"], ["side", "Franja de lado"], ["bob", "Chanel"], ["long", "Longo"], ["ponytail", "Rabo de cavalo"], ["pigtails", "Maria-chiquinha"], ["bun", "Coque"], ["curly", "Cacheado"], ["afro", "Black power"], ["buns", "Coquinhos"], ["braids", "Tranças"], ["dreads", "Dreads"], ["mohawk", "Moicano"], ["fivehairs", "Cinco fios"]],
  eyes: [["normal", "Normal"], ["happy", "Feliz"], ["angry", "Bravo"], ["sleepy", "Sonolento"], ["wide", "Arregalado"], ["lashes", "Cílios"], ["wink", "Piscadinha"], ["glasses", "Óculos"], ["shades", "Óculos escuros"]],
  mouth: [["smile", "Sorriso"], ["grin", "Sorrisão"], ["smirk", "Sorriso de canto"], ["teeth", "Dentuço"], ["open", "Surpreso"], ["line", "Sério"], ["sad", "Triste"], ["tongue", "Língua"], ["lips", "Batom"], ["evil", "Malvado"]],
  beard: [["none", "Sem barba"], ["mustache", "Bigode"], ["goatee", "Cavanhaque"], ["sideburns", "Costeletas"], ["stubble", "Barba por fazer"], ["beard", "Barba"], ["long", "Barba longa"]],
  head: [["none", "Nada"], ["cap", "Boné"], ["beanie", "Gorro"], ["headband", "Faixa"], ["headphones", "Fone"], ["bow", "Laço"], ["flowers", "Coroa de flores"], ["crown", "Coroa"], ["tiara", "Tiara"], ["halo", "Auréola"], ["devil", "Chifrinhos"], ["bighorns", "Chifres grandes"], ["antennae", "Anteninhas"], ["mouse", "Orelhas de rato"], ["bunny", "Orelhas de coelho"], ["cat", "Orelhas de gato"], ["fedora", "Chapéu"], ["tophat", "Cartola"], ["straw", "Chapéu de palha"], ["cowboy", "Chapéu de caubói"], ["party", "Chapéu de festa"], ["bandana", "Bandana"], ["pirate", "Chapéu pirata"], ["wizard", "Chapéu de mago"], ["chef", "Chapéu de chef"], ["hardhat", "Capacete de obra"], ["firehat", "Capacete de bombeiro"], ["viking", "Capacete viking"], ["knight", "Elmo de cavaleiro"], ["astro", "Capacete espacial"], ["robot", "Cabeça de robô"], ["heromask", "Máscara de herói"], ["ninja", "Máscara ninja"], ["hood", "Capuz"]],
  pattern: [["plain", "Lisa"], ["stripes", "Listras"], ["hoops", "Faixas"], ["sash", "Faixa diagonal"], ["dots", "Bolinhas"], ["plaid", "Xadrez"], ["camo", "Camuflada"], ["number", "Número"], ["star", "Estrela"], ["heart", "Coração"], ["bolt", "Raio"], ["hoodie", "Moletom"], ["tank", "Regata"], ["suit", "Terno"], ["jacket", "Jaqueta"], ["overalls", "Macacão"], ["armor", "Armadura"], ["robe", "Manto"], ["scarf", "Cachecol"]],
  extra: [["none", "Nada"], ["cheeks", "Bochechas"], ["freckles", "Sardas"], ["mole", "Pinta"], ["scar", "Cicatriz"], ["bandaid", "Curativo"], ["warpaint", "Pintura de guerra"], ["whiskers", "Bigodes de raposa"], ["nose", "Nariz de palhaço"], ["domino", "Máscara nos olhos"], ["tattoo", "Tatuagem"], ["eyepatch", "Tapa-olho"]],
  item: [["none", "Nada"], ["ball", "Bola"], ["mic", "Microfone"], ["phone", "Celular"], ["trophy", "Troféu"], ["sword", "Espada"], ["shield", "Escudo"], ["wand", "Varinha"], ["balloon", "Balão"], ["guitar", "Guitarra"], ["pokeball", "Pokébola"], ["hammer", "Marreta"], ["bat", "Taco"], ["book", "Livro"], ["flask", "Frasco"], ["magnifier", "Lupa"], ["watch", "Relógio"]],
};

let avatarSeq = 0;

function darken(hex, amt = 0.18) {
  const n = parseInt(hex.slice(1), 16);
  const f = (v) => Math.max(0, Math.round(v * (1 - amt)));
  const r = f(n >> 16), g = f((n >> 8) & 255), b = f(n & 255);
  return "#" + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}

function isLight(hex) {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000 > 150;
}

function escapeSvg(text) {
  return String(text).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
}

const DEFAULT_AVATAR = {
  skin: "#F7C948", hair: "short", hairColor: "#4A2F1B", eyes: "normal", mouth: "smile",
  beard: "none", extra: "none", top: "#1F4BA5", top2: "#FFFFFF", pattern: "plain", text: "10",
  legs: "#16133A", belt: null, cape: null, head: "none", headColor: "#D62828", headColor2: "#FFC23D",
  headStyle: "", headText: "", item: "none", bg: null,
};

// Opções do editor que viram combinações de peça + estilo.
const HEAD_ALIASES = { knight: ["helmet", "knight"], robot: ["helmet", "robot"], heromask: ["mask", "plain"], ninja: ["mask", "ninja"] };

function renderAvatar(input) {
  const c = { ...DEFAULT_AVATAR, ...input };
  if (HEAD_ALIASES[c.head]) [c.head, c.headStyle] = HEAD_ALIASES[c.head];
  const id = "av" + ++avatarSeq;
  const skinDark = darken(c.skin, 0.12);
  const ink = "#1D1B2F";
  const patterns = Array.isArray(c.pattern) ? c.pattern : [c.pattern];
  const covered = c.head === "mask" || c.head === "helmet";
  const out = [];
  if (patterns.includes("tank")) c.sleeve = c.skin;

  // ── atrás ──
  if (c.bg) out.push(`<rect x="0" y="-8" width="100" height="119" fill="${c.bg}"/>`);
  if (c.cape) out.push(`<path d="M30 60 H70 L86 110 H14 Z" fill="${c.cape}"/>`);
  if (!covered) out.push(hairBack(c));
  out.push(headBack(c));

  // ── corpo ──
  out.push(`<rect x="26" y="99" width="48" height="12" fill="${c.legs}"/>`);
  out.push(`<rect x="49" y="101" width="2" height="10" fill="${darken(c.legs, 0.3)}"/>`);
  const sleeve = c.sleeve || c.top;
  out.push(`<path d="M34 59 L24 62 L16 90 L25 93 L31 73 Z" fill="${sleeve}"/>`);
  out.push(`<path d="M66 59 L76 62 L84 90 L75 93 L69 73 Z" fill="${sleeve}"/>`);
  out.push(`<circle cx="20" cy="95" r="5.5" fill="${c.skin}"/><circle cx="80" cy="95" r="5.5" fill="${c.skin}"/>`);
  out.push(`<clipPath id="${id}t"><path d="M34 58 H66 L74 100 H26 Z"/></clipPath>`);
  out.push(`<path d="M34 58 H66 L74 100 H26 Z" fill="${c.top}"/>`);
  out.push(`<g clip-path="url(#${id}t)">${patterns.map((p) => torsoPattern(p, c)).join("")}</g>`);
  if (c.belt) out.push(`<rect x="26" y="94" width="48" height="6" fill="${c.belt}"/>`);
  out.push(handItem(c.item));

  // ── cabeça ──
  out.push(`<rect x="44" y="53" width="12" height="7" fill="${skinDark}"/>`);
  out.push(`<rect x="41" y="13" width="18" height="9" rx="3" fill="${skinDark}"/>`);
  out.push(`<rect x="29" y="20" width="42" height="36" rx="11" fill="${c.skin}"/>`);

  if (!covered) {
    out.push(faceExtra(c));
    out.push(eyes(c.eyes, ink));
    if (c.extra === "domino") out.push(`<path d="M31 33 Q41 29 50 34 Q59 29 69 33 L67 41 Q58 44 50 39 Q42 44 33 41 Z" fill="#111"/>${lenses("#fff", "#111")}`);
    out.push(mouth(c.mouth, ink));
    out.push(beard(c));
    if (c.extra === "eyepatch") out.push(`<path d="M30 30 L70 25" stroke="${ink}" stroke-width="1.6"/><ellipse cx="58" cy="37" rx="5.5" ry="5" fill="${ink}"/>`);
    out.push(hairFront(c));
  }
  out.push(headFront(c, ink));

  return `<svg viewBox="0 -8 100 119" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${out.join("")}</svg>`;
}

// ───────────── peças ─────────────

function eyes(type, ink) {
  switch (type) {
    case "happy":
      return `<path d="M39 38 Q42 34 45 38 M55 38 Q58 34 61 38" stroke="${ink}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
    case "angry":
      return `<path d="M37 31 L46 34 M63 31 L54 34" stroke="${ink}" stroke-width="2.4" stroke-linecap="round"/><circle cx="42" cy="38" r="2.4" fill="${ink}"/><circle cx="58" cy="38" r="2.4" fill="${ink}"/>`;
    case "glasses":
      return `<circle cx="42" cy="37" r="5.5" fill="#fff" fill-opacity=".35" stroke="${ink}" stroke-width="1.8"/><circle cx="58" cy="37" r="5.5" fill="#fff" fill-opacity=".35" stroke="${ink}" stroke-width="1.8"/><path d="M47.5 37 H52.5" stroke="${ink}" stroke-width="1.8"/><circle cx="42" cy="37.5" r="2" fill="${ink}"/><circle cx="58" cy="37.5" r="2" fill="${ink}"/>`;
    case "shades":
      return `<path d="M34 33 H66 V36 Q66 42 59 42 Q53 42 52 36 H48 Q47 42 41 42 Q34 42 34 36 Z" fill="${ink}"/><path d="M37 35 L40 35" stroke="#fff" stroke-opacity=".6" stroke-width="1.4"/>`;
    case "sleepy":
      return `<path d="M38 38.5 H46 M54 38.5 H62" stroke="${ink}" stroke-width="2.2" stroke-linecap="round"/><path d="M38 36 Q42 34.6 46 36 M54 36 Q58 34.6 62 36" stroke="${ink}" stroke-width="1.1" fill="none" opacity=".55"/>`;
    case "wide":
      return `<circle cx="42" cy="37" r="4.4" fill="#fff" stroke="${ink}" stroke-width="1.3"/><circle cx="58" cy="37" r="4.4" fill="#fff" stroke="${ink}" stroke-width="1.3"/><circle cx="42" cy="37.6" r="1.9" fill="${ink}"/><circle cx="58" cy="37.6" r="1.9" fill="${ink}"/>`;
    case "lashes":
      return `<ellipse cx="42" cy="37.5" rx="2.5" ry="3" fill="${ink}"/><ellipse cx="58" cy="37.5" rx="2.5" ry="3" fill="${ink}"/><path d="M39.4 35 L37.4 33 M41 34.3 L40.4 32 M60.6 35 L62.6 33 M59 34.3 L59.6 32" stroke="${ink}" stroke-width="1.2" stroke-linecap="round"/>`;
    case "wink":
      return `<circle cx="42" cy="37.5" r="2.6" fill="${ink}"/><path d="M55 38 Q58 35 61 38" stroke="${ink}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
    default:
      return `<ellipse cx="42" cy="37.5" rx="2.5" ry="3" fill="${ink}"/><ellipse cx="58" cy="37.5" rx="2.5" ry="3" fill="${ink}"/><circle cx="42.8" cy="36.5" r=".8" fill="#fff"/><circle cx="58.8" cy="36.5" r=".8" fill="#fff"/>`;
  }
}

function lenses(color = "#fff", stroke = "#1D1B2F") {
  return `<path d="M35 34 Q41 31 46 36 Q42 42 36 40 Z" fill="${color}" stroke="${stroke}" stroke-width="1.6"/><path d="M65 34 Q59 31 54 36 Q58 42 64 40 Z" fill="${color}" stroke="${stroke}" stroke-width="1.6"/>`;
}

function mouth(type, ink) {
  switch (type) {
    case "grin":
      return `<path d="M41 45 Q50 54 59 45 Z" fill="${ink}"/><path d="M42.5 45.6 H57.5 L56.5 47.3 H43.5 Z" fill="#fff"/>`;
    case "open":
      return `<ellipse cx="50" cy="47.5" rx="3.6" ry="4" fill="${ink}"/>`;
    case "line":
      return `<path d="M44 47 H56" stroke="${ink}" stroke-width="2.2" stroke-linecap="round"/>`;
    case "tongue":
      return `<path d="M42 45 Q50 52 58 45" stroke="${ink}" stroke-width="2.2" fill="none" stroke-linecap="round"/><path d="M47 48.5 Q50 54 53 48.5 Z" fill="#E5646E"/>`;
    case "smirk":
      return `<path d="M44 47.5 Q52 49 57.5 44" stroke="${ink}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
    case "teeth":
      return `<path d="M43 46 Q50 51 57 46" stroke="${ink}" stroke-width="2.2" fill="none" stroke-linecap="round"/><rect x="47" y="48" width="6" height="4" rx=".8" fill="#fff" stroke="${ink}" stroke-width=".8"/><path d="M50 48 V52" stroke="${ink}" stroke-width=".6"/>`;
    case "sad":
      return `<path d="M43 49 Q50 44 57 49" stroke="${ink}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
    case "lips":
      return `<path d="M43 46 Q46.5 44 50 45.5 Q53.5 44 57 46 Q50 52 43 46 Z" fill="#C1121F"/>`;
    case "evil":
      return `<path d="M35 43 Q50 56 65 43" stroke="#C1121F" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M39 46 Q50 53 61 46" stroke="${ink}" stroke-width="1.6" fill="none"/>`;
    default:
      return `<path d="M43 46 Q50 51 57 46" stroke="${ink}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
  }
}

function beard(c) {
  const col = c.beardColor || c.hairColor;
  switch (c.beard) {
    case "mustache":
      return `<path d="M40 45 Q45 40 50 43 Q55 40 60 45 Q55 44 50 46 Q45 44 40 45 Z" fill="${col}"/>`;
    case "goatee":
      return `<path d="M45 51 Q50 58 55 51 Q50 53 45 51 Z" fill="${col}"/><path d="M42 44 Q50 41 58 44 Q50 43 42 44 Z" fill="${col}"/>`;
    case "sideburns":
      return `<rect x="29.5" y="27" width="4.5" height="17" rx="2" fill="${col}"/><rect x="66" y="27" width="4.5" height="17" rx="2" fill="${col}"/>`;
    case "stubble":
      return `<path d="M30 40 Q30 56 50 56 Q70 56 70 40 Q66 50 50 51 Q34 50 30 40 Z" fill="${col}" fill-opacity=".3"/>`;
    case "beard":
      return `<path d="M29.5 36 Q29 57 50 58 Q71 57 70.5 36 Q68 49 58 50 Q50 46 42 50 Q32 49 29.5 36 Z" fill="${col}"/><path d="M41 44 Q50 40 59 44 Q50 43 41 44 Z" fill="${col}"/>`;
    case "long":
      return `<path d="M30 38 Q28 60 40 72 Q50 80 60 72 Q72 60 70 38 Q68 49 58 50 Q50 46 42 50 Q32 49 30 38 Z" fill="${col}"/><path d="M40 44 Q50 40 60 44 Q50 43 40 44 Z" fill="${col}"/>`;
    default:
      return "";
  }
}

function faceExtra(c) {
  switch (c.extra) {
    case "cheeks":
      return `<circle cx="35" cy="45" r="4.2" fill="#E63946" fill-opacity=".85"/><circle cx="65" cy="45" r="4.2" fill="#E63946" fill-opacity=".85"/>`;
    case "freckles":
      return `<g fill="#B5651D" fill-opacity=".7"><circle cx="36" cy="43" r=".9"/><circle cx="39" cy="45" r=".9"/><circle cx="35" cy="46" r=".9"/><circle cx="64" cy="43" r=".9"/><circle cx="61" cy="45" r=".9"/><circle cx="65" cy="46" r=".9"/></g>`;
    case "scar":
      return `<path d="M56 23 L52 28 L56 28 L52 33" stroke="#B23A48" stroke-width="1.6" fill="none" stroke-linejoin="round"/>`;
    case "whiskers":
      return `<path d="M32 41 L39 42.5 M32 44.5 L39 44.5 M32 48 L39 46.5 M68 41 L61 42.5 M68 44.5 L61 44.5 M68 48 L61 46.5" stroke="#3B2A1A" stroke-width="1.2" stroke-linecap="round"/>`;
    case "nose":
      return `<circle cx="50" cy="42" r="4.2" fill="#D62828"/><circle cx="48.6" cy="40.6" r="1.1" fill="#fff" opacity=".6"/>`;
    case "mole":
      return `<circle cx="59.5" cy="45" r="1.2" fill="#3B2A1A"/>`;
    case "bandaid":
      return `<g transform="rotate(-20 62 29)"><rect x="56" y="26.5" width="12" height="5" rx="2" fill="#E9C9A8" stroke="#C9A27E" stroke-width=".6"/><rect x="60.5" y="27.5" width="3" height="3" fill="#F5DFC8"/></g>`;
    case "warpaint":
      return `<path d="M32 41.5 H39.5 M32 44.5 H39.5 M60.5 41.5 H68 M60.5 44.5 H68" stroke="#D62828" stroke-width="1.8"/>`;
    case "tattoo":
      return `<path d="M58 20 Q60 30 57 36 Q55 44 60 56 L64 56 Q59 44 61 36 Q64 28 62 20 Z" fill="#B3001B"/>`;
    case "muzzle":
      return `<ellipse cx="50" cy="46" rx="13" ry="8.5" fill="#F6D7BE"/><ellipse cx="50" cy="41.5" rx="2.6" ry="1.8" fill="#1D1B2F"/>`;
    case "nosebleed":
      return `<path d="M47 42 Q46 45 47.5 46" stroke="#C1121F" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;
    case "snake":
      return `<path d="M48 41 L47 43 M52 41 L53 43" stroke="#1D1B2F" stroke-width="1.2" stroke-linecap="round"/>`;
    case "chin":
      return `<path d="M44 51 V55 M48 52 V56 M52 52 V56 M56 51 V55" stroke="${darken(c.skin, 0.3)}" stroke-width="1.3" stroke-linecap="round"/>`;
    default:
      return "";
  }
}

function hairBack(c) {
  const h = c.hairColor;
  switch (c.hair) {
    case "long":
      return `<rect x="24" y="22" width="52" height="40" rx="10" fill="${h}"/>`;
    case "braids":
      return `<rect x="25" y="22" width="50" height="22" rx="10" fill="${h}"/>`;
    case "ponytail":
      return `<circle cx="74" cy="27" r="6" fill="${h}"/><path d="M76 28 Q86 40 78 56 Q76 42 72 32 Z" fill="${h}"/>`;
    case "curly":
      return `<circle cx="27" cy="38" r="8" fill="${h}"/><circle cx="73" cy="38" r="8" fill="${h}"/>`;
    case "afro":
      return `<circle cx="50" cy="28" r="28" fill="${h}"/>`;
    case "bob":
      return `<rect x="25" y="22" width="50" height="32" rx="10" fill="${h}"/>`;
    case "pigtails":
      return `<g fill="${h}"><circle cx="23" cy="31" r="7"/><circle cx="77" cy="31" r="7"/><path d="M19 35 Q13 49 20 58 Q22 46 26 37 Z M81 35 Q87 49 80 58 Q78 46 74 37 Z"/></g>`;
    case "dreads":
      return `<g fill="${h}"><rect x="24" y="24" width="6" height="34" rx="3"/><rect x="31" y="26" width="6" height="30" rx="3"/><rect x="63" y="26" width="6" height="30" rx="3"/><rect x="70" y="24" width="6" height="34" rx="3"/></g>`;
    default:
      return "";
  }
}

function hairFront(c) {
  const h = c.hairColor;
  const top = `<path d="M28 33 Q27 15 50 15 Q73 15 72 33 Q70 25 60 23 Q50 21 40 23 Q30 25 28 33 Z" fill="${h}"/>`;
  switch (c.hair) {
    case "short": case "long": case "dreads": case "pigtails":
      return top;
    case "buzz":
      return `<path d="M29 31 Q28 17 50 17 Q72 17 71 31 Q69 25 60 24 Q50 23 40 24 Q31 25 29 31 Z" fill="${h}" fill-opacity=".55"/>`;
    case "side":
      return `<path d="M28 34 Q27 15 50 15 Q73 15 72 31 Q66 22 56 22 L37 35 Q31 35 28 34 Z" fill="${h}"/>`;
    case "bob":
      return `${top}<rect x="30" y="17" width="40" height="10" rx="5" fill="${h}"/>`;
    case "afro":
      return `<g fill="${h}"><circle cx="34" cy="23" r="10"/><circle cx="50" cy="17" r="12"/><circle cx="66" cy="23" r="10"/></g>`;
    case "spiky":
      return `<path d="M28 34 L29 20 L35 23 L38 10 L45 20 L50 6 L55 20 L62 10 L65 23 L71 20 L72 34 Q66 24 50 24 Q34 24 28 34 Z" fill="${h}"/>`;
    case "messy":
      return `<path d="M28 34 Q27 15 50 14 Q73 15 72 34 L67 27 L63 31 L58 25 L53 30 L48 25 L43 31 L38 26 L33 31 Z" fill="${h}"/>`;
    case "slick":
      return `<path d="M28 32 Q28 14 50 14 Q72 14 72 32 Q68 21 46 22 Q34 23 28 32 Z" fill="${h}"/>`;
    case "ponytail":
      return top;
    case "bun":
      return `<circle cx="50" cy="10" r="8" fill="${h}"/>${top}`;
    case "curly":
      return `<g fill="${h}"><circle cx="32" cy="26" r="9"/><circle cx="40" cy="18" r="10"/><circle cx="50" cy="15" r="10"/><circle cx="60" cy="18" r="10"/><circle cx="68" cy="26" r="9"/></g>`;
    case "braids":
      return `<path d="M28 34 Q27 15 50 15 Q73 15 72 34 Q66 22 50 22 Q34 22 28 34 Z" fill="${h}"/><g fill="${h}"><rect x="24" y="36" width="7" height="34" rx="3.5"/><rect x="69" y="36" width="7" height="34" rx="3.5"/></g><g stroke="${darken(h, 0.4)}" stroke-width="1"><path d="M24 46 H31 M24 54 H31 M24 62 H31 M69 46 H76 M69 54 H76 M69 62 H76"/></g>`;
    case "buns":
      return `<g fill="${h}"><circle cx="31" cy="15" r="8"/><circle cx="69" cy="15" r="8"/></g>${top}`;
    case "fivehairs":
      return `<path d="M42 21 L38 8 M46 20 L45 6 M50 20 V5 M54 20 L55 6 M58 21 L62 8" stroke="${h}" stroke-width="2" stroke-linecap="round"/>`;
    case "mohawk":
      return `<rect x="45" y="3" width="10" height="24" rx="5" fill="${h}"/>`;
    default:
      return "";
  }
}

function headBack(c) {
  const col = c.headColor;
  switch (c.head) {
    case "pika":
      return `<path d="M33 25 L16 -6 L42 20 Z" fill="${c.skin}"/><path d="M16 -6 L22 5 L26 3 Z" fill="#1D1B2F"/><path d="M67 25 L84 -6 L58 20 Z" fill="${c.skin}"/><path d="M84 -6 L78 5 L74 3 Z" fill="#1D1B2F"/>`;
    case "cat":
      return `<path d="M30 26 L30 8 L44 18 Z M70 26 L70 8 L56 18 Z" fill="${col}"/>`;
    case "ogre":
      return `<path d="M30 34 L19 29 L18 37 L30 39 Z M70 34 L81 29 L82 37 L70 39 Z" fill="${c.skin}"/>`;
    case "mouse":
      return `<circle cx="28" cy="13" r="10" fill="${col}"/><circle cx="72" cy="13" r="10" fill="${col}"/>`;
    case "bighorns":
      return `<path d="M35 24 Q22 10 29 -7 Q33 10 43 18 Z M65 24 Q78 10 71 -7 Q67 10 57 18 Z" fill="${col}"/>`;
    case "bunny":
      return `<rect x="33" y="-7" width="10" height="30" rx="5" fill="${col}"/><rect x="57" y="-7" width="10" height="30" rx="5" fill="${col}"/><rect x="36" y="-3" width="4" height="22" rx="2" fill="#F4A6B7"/><rect x="60" y="-3" width="4" height="22" rx="2" fill="#F4A6B7"/>`;
    case "hood":
      return `<path d="M22 58 Q20 10 50 9 Q80 10 78 58 Z" fill="${col}"/>`;
    default:
      return "";
  }
}

function headFront(c, ink) {
  const col = c.headColor, col2 = c.headColor2;
  switch (c.head) {
    case "cap":
      return `<path d="M28 30 Q28 11 50 11 Q72 11 72 30 Z" fill="${col}"/><path d="M25 29 H75 Q76 35 70 35 H30 Q24 35 25 29 Z" fill="${darken(col)}"/>${c.headText ? `<circle cx="50" cy="20.5" r="6.2" fill="#fff"/><text x="50" y="24.4" text-anchor="middle" font-family="Archivo, Arial, sans-serif" font-weight="900" font-size="10" fill="${col}">${escapeSvg(c.headText)}</text>` : ""}`;
    case "beanie":
      return `<path d="M27 32 Q27 9 50 9 Q73 9 73 32 Z" fill="${col}"/><rect x="26" y="26" width="48" height="8" rx="3" fill="${darken(col)}"/><circle cx="50" cy="8" r="4.5" fill="${col2}"/>`;
    case "headband":
      return `<rect x="28" y="24" width="44" height="6" rx="2" fill="${col}"/>`;
    case "headphones":
      return `<path d="M26 38 Q25 9 50 9 Q75 9 74 38" stroke="${col}" stroke-width="4" fill="none"/><rect x="21" y="30" width="9" height="15" rx="4" fill="${col}"/><rect x="70" y="30" width="9" height="15" rx="4" fill="${col}"/>`;
    case "bow":
      return `<path d="M50 17 L37 9 L37 25 Z M50 17 L63 9 L63 25 Z" fill="${col}"/><circle cx="50" cy="17" r="3.5" fill="${darken(col)}"/>`;
    case "flowers":
      return [32, 41, 50, 59, 68].map((x, i) => `<circle cx="${x}" cy="${i % 2 ? 19 : 21}" r="4.5" fill="${[col, col2, "#fff", col2, col][i]}"/><circle cx="${x}" cy="${i % 2 ? 19 : 21}" r="1.6" fill="#FFC23D"/>`).join("");
    case "halo":
      return `<ellipse cx="50" cy="5" rx="16" ry="4" fill="none" stroke="#FFC23D" stroke-width="3"/>`;
    case "devil":
      return `<path d="M33 23 L29 9 L41 19 Z M67 23 L71 9 L59 19 Z" fill="${col}"/>`;
    case "cowboy":
      return `<path d="M34 22 Q34 7 42 8 L50 12 L58 8 Q66 7 66 22 Z" fill="${col}"/><rect x="34" y="17" width="32" height="4" fill="${col2}"/><path d="M15 19 Q22 27 34 24 Q50 21 66 24 Q78 27 85 19 Q83 29 70 29 Q50 26 30 29 Q17 29 15 19 Z" fill="${darken(col)}"/>`;
    case "party":
      return `<path d="M40 19 L50 -6 L60 19 Z" fill="${col}"/><path d="M43 12 L56 8 M41.5 16 L58 12" stroke="${col2}" stroke-width="2"/><circle cx="50" cy="-6" r="3.2" fill="${col2}"/>`;
    case "hardhat":
      return `<path d="M28 30 Q28 9 50 9 Q72 9 72 30 Z" fill="${col}"/><rect x="24" y="28" width="52" height="5" rx="2" fill="${darken(col)}"/><rect x="46.5" y="9" width="7" height="19" fill="${darken(col)}" opacity=".45"/>`;
    case "viking":
      return `<path d="M34 22 Q21 18 19 3 Q27 13 38 16 Z M66 22 Q79 18 81 3 Q73 13 62 16 Z" fill="#F1E9D2"/><path d="M28 30 Q28 11 50 11 Q72 11 72 30 Z" fill="${col}"/><rect x="27" y="26" width="46" height="5" fill="${darken(col)}"/><rect x="48" y="11" width="4" height="15" fill="${darken(col)}"/>`;
    case "bighorns":
      return `<path d="M28 36 Q27 14 50 14 Q73 14 72 36 Q68 24 50 24 Q32 24 28 36 Z" fill="${col}"/>`;
    case "antennae":
      return `<path d="M42 15 L35 -1 M58 15 L65 -1" stroke="${col}" stroke-width="2.2" stroke-linecap="round"/><circle cx="35" cy="-2" r="3.2" fill="${col}"/><circle cx="65" cy="-2" r="3.2" fill="${col}"/><path d="M28 33 Q28 13 50 13 Q72 13 72 33 Q50 26 28 33 Z" fill="${col}"/>`;
    case "straw":
      return `<path d="M34 22 Q34 6 50 6 Q66 6 66 22 Z" fill="#E9C46A"/><rect x="34" y="15" width="32" height="5" fill="${col}"/><ellipse cx="50" cy="22" rx="30" ry="5.5" fill="#E2B84F"/>`;
    case "tophat":
      return `<rect x="37" y="-3" width="26" height="24" rx="2" fill="${col}"/><rect x="37" y="13" width="26" height="4" fill="${col2}"/><rect x="27" y="19" width="46" height="5" rx="2.5" fill="${col}"/>`;
    case "crown":
      return `<path d="M31 25 V9 L39 17 L45 6 L50 15 L55 6 L61 17 L69 9 V25 Z" fill="#FFC23D"/><circle cx="50" cy="21" r="2.5" fill="#D62828"/>`;
    case "tiara":
      return `<path d="M31 26 H69 L66 21 L50 17 L34 21 Z" fill="#FFC23D"/><path d="M50 16.5 L51.8 20.5 L56 21 L52.8 23.6 L53.8 27.6 L50 25.4 L46.2 27.6 L47.2 23.6 L44 21 L48.2 20.5 Z" fill="#D62828"/>`;
    case "fedora":
      return `<path d="M33 22 Q33 6 50 6 Q67 6 67 22 Z" fill="${col}"/><rect x="33" y="16" width="34" height="5" fill="${col2}"/><path d="M20 22 Q50 16 80 22 Q80 27 73 26 Q50 22 27 26 Q20 27 20 22 Z" fill="${darken(col)}"/>`;
    case "bandana":
      return `<path d="M28 31 Q28 13 50 13 Q72 13 72 31 Q50 24 28 31 Z" fill="${col}"/><path d="M70 25 L82 33 L80 22 Z" fill="${darken(col)}"/><g fill="#fff" fill-opacity=".7"><circle cx="40" cy="20" r="1.2"/><circle cx="50" cy="17" r="1.2"/><circle cx="60" cy="20" r="1.2"/></g>`;
    case "pirate":
      return `<path d="M18 22 Q50 2 82 22 Q70 26 50 24 Q30 26 18 22 Z" fill="${col}"/><path d="M30 22 Q32 4 50 3 Q68 4 70 22 Z" fill="${col}"/><circle cx="50" cy="13" r="3.5" fill="#fff"/><path d="M46 18 L54 18" stroke="#fff" stroke-width="1.6"/>`;
    case "wizard":
      return `<path d="M34 22 L54 -8 L66 22 Z" fill="${col}"/><ellipse cx="50" cy="22" rx="29" ry="5" fill="${darken(col)}"/>`;
    case "chef":
      return `<path d="M32 25 Q24 10 37 9 Q41 1 51 4 Q61 0 64 10 Q77 11 68 25 Z" fill="#fff" stroke="#DDD" stroke-width="1"/><rect x="31" y="22" width="38" height="6" rx="2" fill="#F1F1F1" stroke="#DDD" stroke-width="1"/>`;
    case "firehat":
      return `<path d="M27 31 Q27 9 50 9 Q73 9 73 31 Z" fill="${col}"/><path d="M22 30 H78 Q78 35 72 34 H28 Q22 35 22 30 Z" fill="${darken(col)}"/><path d="M44 13 H56 L54 26 H46 Z" fill="#FFC23D"/>`;
    case "astro":
      return `<circle cx="50" cy="37" r="27" fill="#BDE0FE" fill-opacity=".28" stroke="#F1F1F1" stroke-width="4"/><path d="M33 22 Q38 16 45 15" stroke="#fff" stroke-width="2.5" stroke-linecap="round" fill="none" opacity=".8"/>`;
    case "horns":
      return `<path d="M28 31 Q28 16 50 16 Q72 16 72 31 Q50 23 28 31 Z" fill="#E0A526"/><path d="M36 21 Q20 14 22 -4 Q28 12 42 18 Z M64 21 Q80 14 78 -4 Q72 12 58 18 Z" fill="#E0A526"/><path d="M28 30 L28 48 L33 46 L33 30 Z M72 30 L72 48 L67 46 L67 30 Z" fill="#E0A526"/>`;
    case "cowl": {
      const ears = c.headStyle === "bat" ? `<path d="M31 22 L31 4 L40 19 Z M69 22 L69 4 L60 19 Z" fill="${col}"/>` : "";
      const letter = c.headText ? `<text x="50" y="30" text-anchor="middle" font-family="Archivo, Arial, sans-serif" font-weight="900" font-size="9" fill="#fff">${escapeSvg(c.headText)}</text>` : "";
      return `${ears}<path d="M28.5 46 V31 Q28.5 19 50 19 Q71.5 19 71.5 31 V46 Q66 44 62 45 Q58 41 50 41 Q42 41 38 45 Q34 44 28.5 46 Z" fill="${col}"/>${lenses()}${letter}${mouth(c.mouth, ink)}`;
    }
    case "mask":
      return mask(c, ink);
    case "helmet":
      return helmet(c);
    default:
      return "";
  }
}

function mask(c, ink) {
  const col = c.headColor, col2 = c.headColor2;
  const base = `<rect x="41" y="13" width="18" height="9" rx="3" fill="${darken(col, 0.1)}"/><rect x="28.5" y="19.5" width="43" height="37" rx="11" fill="${col}"/>`;
  switch (c.headStyle) {
    case "web":
      return `${base}<g stroke="${col2}" stroke-width=".9" fill="none" opacity=".75"><path d="M50 38 L50 20 M50 38 L30 30 M50 38 L70 30 M50 38 L32 52 M50 38 L68 52 M50 38 L50 56"/><path d="M42 33 Q50 30 58 33 M36 37 Q50 26 64 37 M40 45 Q50 49 60 45 M34 49 Q50 56 66 49"/></g>${lenses()}`;
    case "wolverine":
      return `${base}<path d="M33 36 L24 16 L42 31 Z M67 36 L76 16 L58 31 Z" fill="${col2}"/>${lenses()}<path d="M32 44 H68 V50 Q68 56 58 56 H42 Q32 56 32 50 Z" fill="${c.skin}"/>${mouth("line", ink)}`;
    case "panther":
      return `<path d="M31 24 L33 14 L40 21 Z M69 24 L67 14 L60 21 Z" fill="${col}"/>${base}<path d="M50 21 L46 34 L50 38 L54 34 Z" fill="${col2}" opacity=".7"/>${lenses("#E9ECEF")}`;
    case "flash":
      return `${base}<path d="M28 33 L19 28 L24 36 L18 38 L29 40 Z M72 33 L81 28 L76 36 L82 38 L71 40 Z" fill="${col2}"/>${lenses()}<path d="M33 44 H67 V50 Q67 56 58 56 H42 Q33 56 33 50 Z" fill="${c.skin}"/>${mouth(c.mouth, ink)}`;
    case "deadpool":
      return `${base}<path d="M31 30 Q41 27 47 36 Q41 45 32 41 Z M69 30 Q59 27 53 36 Q59 45 68 41 Z" fill="#111"/>${lenses()}`;
    case "ninja":
      return `${base}<rect x="31" y="31" width="38" height="12" rx="5" fill="${c.skin}"/>${eyes("angry", ink)}<path d="M70 30 L84 26 L80 36 Z" fill="${col}"/>`;
    default:
      return `${base}${lenses()}`;
  }
}

function helmet(c) {
  const col = c.headColor, col2 = c.headColor2;
  switch (c.headStyle) {
    case "iron":
      return `<rect x="27" y="17" width="46" height="41" rx="12" fill="${col}"/><path d="M33 27 Q50 23 67 27 L65 49 Q50 58 35 49 Z" fill="${col2}"/><rect x="37" y="34" width="10" height="3.5" rx="1.5" fill="#E9FBFF"/><rect x="53" y="34" width="10" height="3.5" rx="1.5" fill="#E9FBFF"/><path d="M43 48 H57" stroke="${darken(col2, 0.35)}" stroke-width="1.6"/>`;
    case "vader":
      return `<path d="M22 58 L26 27 Q27 11 50 11 Q73 11 74 27 L78 58 Q66 52 50 52 Q34 52 22 58 Z" fill="${col}"/><path d="M33 30 H67 L64 53 H36 Z" fill="${col2}"/><path d="M34 32 H47 L45 39 H36 Z M66 32 H53 L55 39 H64 Z" fill="#0B0B0B"/><path d="M45 44 L50 53 L55 44 Z" fill="#0B0B0B"/><path d="M47 46 H53 M47.8 48.5 H52.2" stroke="${col2}" stroke-width=".9"/>`;
    case "chief":
      return `<rect x="27" y="16" width="46" height="42" rx="13" fill="${col}"/><path d="M32 29 H68 Q71 40 62 45 H38 Q29 40 32 29 Z" fill="${col2}"/><path d="M36 31 Q42 30 46 33" stroke="#fff" stroke-width="2" opacity=".6" fill="none" stroke-linecap="round"/>`;
    case "robot":
      return `<path d="M50 16 V7" stroke="${darken(col, 0.3)}" stroke-width="2"/><circle cx="50" cy="6" r="3" fill="#D62828"/><rect x="27" y="16" width="46" height="42" rx="7" fill="${col}"/><circle cx="41" cy="34" r="5" fill="${col2}"/><circle cx="59" cy="34" r="5" fill="${col2}"/><rect x="38" y="45" width="24" height="6" rx="2" fill="${darken(col, 0.35)}"/><path d="M43 45 V51 M48 45 V51 M53 45 V51 M58 45 V51" stroke="${col}" stroke-width="1.2"/>`;
    default:
      return `<rect x="27" y="17" width="46" height="41" rx="12" fill="${col}"/><rect x="33" y="33" width="34" height="5" rx="2" fill="#111"/>`;
  }
}

function torsoPattern(p, c) {
  const a = c.top2;
  switch (p) {
    case "stripes":
      return `<g fill="${a}"><rect x="31" y="56" width="6" height="46"/><rect x="43" y="56" width="6" height="46"/><rect x="55" y="56" width="6" height="46"/><rect x="67" y="56" width="6" height="46"/></g>`;
    case "dots":
      return `<g fill="${a}">${[[34, 64], [46, 62], [58, 64], [40, 74], [52, 73], [64, 75], [34, 86], [46, 84], [58, 86], [40, 96], [52, 95], [66, 95]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.6"/>`).join("")}</g>`;
    case "plaid":
      return `<g stroke="${a}" stroke-width="3" opacity=".6"><path d="M20 66 H80 M20 80 H80 M20 94 H80 M38 56 V102 M50 56 V102 M62 56 V102"/></g><g stroke="${a}" stroke-width="1" opacity=".5"><path d="M20 73 H80 M20 87 H80 M44 56 V102 M56 56 V102"/></g>`;
    case "camo":
      return `<g fill="${a}"><ellipse cx="38" cy="66" rx="7" ry="4"/><ellipse cx="60" cy="72" rx="8" ry="5"/><ellipse cx="44" cy="86" rx="9" ry="5"/><ellipse cx="66" cy="92" rx="6" ry="4"/></g><g fill="${darken(c.top, 0.35)}"><ellipse cx="54" cy="62" rx="5" ry="3"/><ellipse cx="34" cy="78" rx="5" ry="4"/><ellipse cx="58" cy="84" rx="5" ry="3"/><ellipse cx="40" cy="97" rx="6" ry="3"/></g>`;
    case "hoodie":
      return `<path d="M35 58 Q50 68 65 58" stroke="${darken(c.top, 0.3)}" stroke-width="3" fill="none"/><path d="M45 61 V72 M55 61 V72" stroke="${a}" stroke-width="1.5"/><path d="M38 84 H62 L60 98 H40 Z" fill="${darken(c.top, 0.18)}"/>`;
    case "tank":
      return `<path d="M34 58 H42 L41 65 Q37 64 34 62 Z M66 58 H58 L59 65 Q63 64 66 62 Z" fill="${c.skin}"/>`;
    case "heart":
      return `<path d="M50 84 C38 76 40 66 46 67 C48 67.5 49.5 69 50 70.5 C50.5 69 52 67.5 54 67 C60 66 62 76 50 84 Z" fill="${a}"/>`;
    case "sash":
      return `<path d="M34 58 L44 58 L76 94 L76 102 L68 102 Z" fill="${a}"/>`;
    case "hoops":
      return `<g fill="${a}"><rect x="20" y="70" width="60" height="5"/><rect x="20" y="84" width="60" height="5"/></g>`;
    case "number":
      return `<text x="50" y="89" text-anchor="middle" font-family="Archivo, Arial, sans-serif" font-weight="900" font-size="22" fill="${c.textColor || a}">${escapeSvg(c.text)}</text>`;
    case "emblem":
      return `<circle cx="50" cy="74" r="9" fill="${a}"/><text x="50" y="78.5" text-anchor="middle" font-family="Archivo, Arial, sans-serif" font-weight="900" font-size="12" fill="${c.textColor || c.top}">${escapeSvg(c.text)}</text>`;
    case "diamond":
      return `<path d="M39 66 H61 L65 71 L50 86 L35 71 Z" fill="${a}"/><text x="50" y="79" text-anchor="middle" font-family="Archivo, Arial, sans-serif" font-weight="900" font-size="12" fill="${c.textColor || c.top}">${escapeSvg(c.text)}</text>`;
    case "bolt":
      return `<circle cx="50" cy="74" r="10" fill="#fff"/><path d="M52 64 L44 76 H50 L47 85 L56 72 H50 Z" fill="${a}"/>`;
    case "star":
      return `<path d="M50 63 L53.2 70.6 L61.4 71.2 L55.1 76.4 L57.1 84.4 L50 80 L42.9 84.4 L44.9 76.4 L38.6 71.2 L46.8 70.6 Z" fill="${a}"/>`;
    case "web":
      return `<g stroke="${a}" stroke-width=".9" fill="none" opacity=".7"><path d="M50 58 V100 M50 70 L28 62 M50 70 L72 62 M50 70 L30 92 M50 70 L70 92"/><path d="M40 64 Q50 68 60 64 M34 74 Q50 80 66 74 M30 88 Q50 94 70 88"/></g><path d="M50 66 L47 70 L50 76 L53 70 Z M44 68 L56 74 M56 68 L44 74" stroke="${a}" stroke-width="1.4" fill="${a}"/>`;
    case "overalls":
      return `<rect x="35" y="78" width="30" height="24" fill="${a}"/><path d="M38 58 L38 80 M62 58 L62 80" stroke="${a}" stroke-width="5"/><circle cx="38" cy="80" r="2.2" fill="#FFC23D"/><circle cx="62" cy="80" r="2.2" fill="#FFC23D"/><rect x="20" y="92" width="60" height="10" fill="${a}"/>`;
    case "suit":
      return `<path d="M43 58 L50 74 L57 58 Z" fill="#fff"/><path d="M48.5 60 H51.5 L52.5 72 L50 75 L47.5 72 Z" fill="${a}"/><path d="M34 58 L43 58 L50 76 L44 70 Z M66 58 L57 58 L50 76 L56 70 Z" fill="${darken(c.top, 0.25)}"/>`;
    case "jacket":
      return `<path d="M42 58 L50 100 L58 58 Z" fill="${a}"/><path d="M42 58 L46 100 M58 58 L54 100" stroke="${darken(c.top, 0.3)}" stroke-width="1.5"/>`;
    case "vest":
      return `<path d="M34 58 H42 L46 100 H26 Z M66 58 H58 L54 100 H74 Z" fill="${a}"/>`;
    case "armor":
      return `<g fill="${a}"><rect x="38" y="64" width="11" height="9" rx="2"/><rect x="51" y="64" width="11" height="9" rx="2"/><rect x="40" y="76" width="9" height="8" rx="2"/><rect x="51" y="76" width="9" height="8" rx="2"/><rect x="41" y="87" width="8" height="7" rx="2"/><rect x="51" y="87" width="8" height="7" rx="2"/></g>`;
    case "abs":
      return `<path d="M50 62 V98 M40 72 H60 M41 82 H59 M42 91 H58 M36 62 Q43 68 50 63 Q57 68 64 62" stroke="${a}" stroke-width="1.6" fill="none"/>`;
    case "reactor":
      return `<path d="M38 60 L36 98 M62 60 L64 98" stroke="${a}" stroke-width="4"/><circle cx="50" cy="71" r="6.5" fill="#E9FBFF" stroke="${a}" stroke-width="2"/><circle cx="50" cy="71" r="3" fill="#7FDBFF"/>`;
    case "collar":
      return `<path d="M38 58 L50 58 L44 66 Z M62 58 L50 58 L56 66 Z" fill="${a}"/>`;
    case "robe":
      return `<path d="M50 58 V100" stroke="${a}" stroke-width="3"/><path d="M40 58 L50 70 L60 58" stroke="${a}" stroke-width="3" fill="none"/>`;
    case "scarf":
      return `<path d="M36 58 H64 L62 64 H38 Z" fill="${a}"/><rect x="54" y="60" width="7" height="26" fill="${a}"/><g fill="${c.textColor || "#FFC23D"}"><rect x="54" y="66" width="7" height="3"/><rect x="54" y="74" width="7" height="3"/><rect x="38" y="60" width="4" height="4"/><rect x="48" y="60" width="4" height="4"/></g>`;
    case "bat":
      return `<path d="M36 72 Q40 66 44 70 L46 66 L48 69 H52 L54 66 L56 70 Q60 66 64 72 Q58 71 56 76 Q52 72 50 78 Q48 72 44 76 Q42 71 36 72 Z" fill="${a}"/>`;
    case "necklace":
      return `<path d="M38 60 Q50 74 62 60" stroke="${a}" stroke-width="2.5" fill="none" stroke-dasharray="3 2"/><path d="M50 72 V100 M40 82 H60" stroke="${a}" stroke-width="1" opacity=".5"/>`;
    case "panel":
      return `<rect x="39" y="66" width="22" height="16" rx="2" fill="${a}"/><circle cx="44" cy="71" r="2" fill="#D62828"/><circle cx="50" cy="71" r="2" fill="#2BA84A"/><circle cx="56" cy="71" r="2" fill="#4CC9F0"/><rect x="42" y="76" width="16" height="3" rx="1" fill="#fff" opacity=".7"/>`;
    case "strap":
      return `<path d="M36 58 L66 96" stroke="${a}" stroke-width="5"/>`;
    case "belly":
      return `<ellipse cx="50" cy="82" rx="12" ry="14" fill="${a}"/>`;
    case "chevron":
      return `<path d="M36 64 L50 74 L64 64 L64 70 L50 80 L36 70 Z" fill="${a}"/>`;
    case "coat":
      return `<path d="M34 58 H44 L48 100 H26 Z M66 58 H56 L52 100 H74 Z" fill="#fff"/><path d="M40 60 Q36 76 46 80 Q54 82 56 74" stroke="${a}" stroke-width="2" fill="none"/><circle cx="56" cy="73" r="2.5" fill="#9AA0B5"/>`;
    case "buttons":
      return `<g fill="${a}"><circle cx="45" cy="68" r="1.8"/><circle cx="55" cy="68" r="1.8"/><circle cx="45" cy="78" r="1.8"/><circle cx="55" cy="78" r="1.8"/><circle cx="45" cy="88" r="1.8"/><circle cx="55" cy="88" r="1.8"/></g>`;
    default:
      return "";
  }
}

function handItem(type) {
  switch (type) {
    case "ball":
      return `<circle cx="84" cy="100" r="7" fill="#fff" stroke="#111" stroke-width="1"/><path d="M84 96.5 L87 98.7 L86 102.2 L82 102.2 L81 98.7 Z" fill="#111"/>`;
    case "mic":
      return `<path d="M80 93 L82.5 81" stroke="#333" stroke-width="3" stroke-linecap="round"/><circle cx="83" cy="77.5" r="4.2" fill="#555"/>`;
    case "phone":
      return `<rect x="76" y="78" width="9" height="15" rx="1.8" fill="#111"/><rect x="77.2" y="79.6" width="6.6" height="10.6" fill="#4CC9F0"/>`;
    case "trophy":
      return `<path d="M73 78 H87 V82 Q87 91 80 91 Q73 91 73 82 Z" fill="#FFC23D"/><rect x="78" y="91" width="4" height="3" fill="#FFC23D"/><rect x="74.5" y="93.5" width="11" height="3" fill="#B8860B"/>`;
    case "sword":
      return `<path d="M80 90 V54" stroke="#C0C6D4" stroke-width="3.2"/><path d="M80 54 L78.4 57 H81.6 Z" fill="#C0C6D4"/><path d="M74.5 89 H85.5" stroke="#8B5E3C" stroke-width="3" stroke-linecap="round"/>`;
    case "shield":
      return `<path d="M9 79 H31 V93 Q31 104 20 109 Q9 104 9 93 Z" fill="#1F4BA5" stroke="#9AA0B5" stroke-width="2"/><path d="M20 84 L22.4 89.5 L28 90 L23.6 93.6 L25 99 L20 96 L15 99 L16.4 93.6 L12 90 L17.6 89.5 Z" fill="#fff"/>`;
    case "wand":
      return `<path d="M80 95 L91 79" stroke="#5C3A21" stroke-width="2.4" stroke-linecap="round"/><circle cx="91.5" cy="78.5" r="1.8" fill="#FFC23D"/>`;
    case "balloon":
      return `<path d="M81 92 Q85 72 87 61" stroke="#777" stroke-width=".8" fill="none"/><ellipse cx="87" cy="52" rx="8" ry="10" fill="#D62828"/><path d="M85.5 62 L88.5 62 L87 60 Z" fill="#D62828"/>`;
    case "guitar":
      return `<path d="M60 70 L90 58" stroke="#3B2A1A" stroke-width="3"/><ellipse cx="62" cy="86" rx="10" ry="8" fill="#D62828" transform="rotate(-20 62 86)"/><ellipse cx="68" cy="79" rx="7" ry="6" fill="#D62828" transform="rotate(-20 68 79)"/><circle cx="64" cy="83" r="2" fill="#1A1A1A"/>`;
    case "pokeball":
      return `<circle cx="84" cy="99" r="6.5" fill="#fff" stroke="#111" stroke-width="1"/><path d="M77.5 99 A6.5 6.5 0 0 1 90.5 99 Z" fill="#D62828" stroke="#111" stroke-width="1"/><circle cx="84" cy="99" r="2" fill="#fff" stroke="#111" stroke-width="1"/>`;
    case "hammer":
      return `<path d="M80 94 V70" stroke="#FFC23D" stroke-width="3"/><rect x="71" y="61" width="18" height="10" rx="3" fill="#D62828"/><rect x="71" y="61" width="5" height="10" rx="2" fill="#FFC23D"/><rect x="84" y="61" width="5" height="10" rx="2" fill="#FFC23D"/>`;
    case "bat":
      return `<path d="M80 95 L91 65" stroke="#B5651D" stroke-width="4.5" stroke-linecap="round"/>`;
    case "book":
      return `<rect x="73" y="83" width="15" height="12" rx="1.5" fill="#1F4BA5"/><rect x="75" y="85" width="11" height="8" fill="#fff" opacity=".85"/>`;
    case "flask":
      return `<path d="M78.5 75 V81 L73.5 91 Q72.5 94.5 76 94.5 H84 Q87.5 94.5 86.5 91 L81.5 81 V75 Z" fill="#7FDBFF" stroke="#555" stroke-width="1"/><path d="M75 89 H85" stroke="#2BA84A" stroke-width="3"/>`;
    case "magnifier":
      return `<circle cx="86" cy="79" r="5.5" fill="#BDE0FE" fill-opacity=".5" stroke="#333" stroke-width="2"/><path d="M82.5 83.5 L80 94" stroke="#333" stroke-width="2.5" stroke-linecap="round"/>`;
    case "watch":
      return `<rect x="15.5" y="85" width="9" height="6.5" rx="2" fill="#2BA84A" stroke="#1A1A1A" stroke-width="1.2"/>`;
    default:
      return "";
  }
}

// ───────────── skins prontas ─────────────
// Inspiradas em personagens, jogadores e profissões reais. Todas usam as peças acima.

const PRESET_GROUPS = ["Heróis", "Vilões", "Animes", "Desenhos", "Filmes e séries", "Games", "Futebol", "Profissões"];

const PRESETS = [
  // Heróis
  { id: "aranha", name: "Homem-Aranha", group: "Heróis", cfg: { skin: "#F6D7BE", head: "mask", headStyle: "web", headColor: "#D62828", headColor2: "#3A0D0D", top: "#D62828", top2: "#3A0D0D", pattern: "web", sleeve: "#1F4BA5", legs: "#1F4BA5" } },
  { id: "batman", name: "Batman", group: "Heróis", cfg: { skin: "#F6D7BE", head: "cowl", headStyle: "bat", headColor: "#2B2D42", mouth: "line", top: "#6C757D", top2: "#111111", pattern: "bat", sleeve: "#2B2D42", belt: "#FFC23D", cape: "#1B1B2F", legs: "#2B2D42" } },
  { id: "superman", name: "Superman", group: "Heróis", cfg: { skin: "#F6D7BE", hair: "slick", hairColor: "#1A1A1A", top: "#1F5BD6", top2: "#FFC23D", pattern: "diamond", text: "S", textColor: "#D62828", cape: "#D62828", belt: "#FFC23D", legs: "#1F5BD6" } },
  { id: "maravilha", name: "Mulher-Maravilha", group: "Heróis", cfg: { skin: "#EBBE97", hair: "long", hairColor: "#1A1A1A", head: "tiara", top: "#C1121F", top2: "#FFC23D", pattern: "chevron", belt: "#FFC23D", legs: "#1D3557" } },
  { id: "hulk", name: "Hulk", group: "Heróis", cfg: { skin: "#5FA548", hair: "messy", hairColor: "#1A1A1A", eyes: "angry", mouth: "grin", top: "#5FA548", top2: "#3F7A2F", pattern: "abs", legs: "#6A4C93" } },
  { id: "ferro", name: "Homem de Ferro", group: "Heróis", cfg: { head: "helmet", headStyle: "iron", headColor: "#B3001B", headColor2: "#FFC23D", top: "#B3001B", top2: "#FFC23D", pattern: "reactor", legs: "#B3001B" } },
  { id: "capitao", name: "Capitão América", group: "Heróis", cfg: { skin: "#F6D7BE", head: "cowl", headColor: "#1F4BA5", headText: "A", top: "#1F4BA5", top2: "#FFFFFF", pattern: ["hoops", "star"], legs: "#1F4BA5", belt: "#D62828" } },
  { id: "thor", name: "Thor", group: "Heróis", cfg: { skin: "#F6D7BE", hair: "long", hairColor: "#E9C46A", beard: "stubble", top: "#3D405B", top2: "#9AA0B5", pattern: "armor", cape: "#C1121F", legs: "#1D1D2C" } },
  { id: "pantera", name: "Pantera Negra", group: "Heróis", cfg: { head: "mask", headStyle: "panther", headColor: "#1C1C24", headColor2: "#9AA0B5", top: "#1C1C24", top2: "#C0C6D4", pattern: "necklace", legs: "#1C1C24" } },
  { id: "flash", name: "Flash", group: "Heróis", cfg: { skin: "#F6D7BE", head: "mask", headStyle: "flash", headColor: "#D62828", headColor2: "#FFC23D", top: "#D62828", top2: "#FFC23D", pattern: "bolt", belt: "#FFC23D", legs: "#D62828" } },
  { id: "wolverine", name: "Wolverine", group: "Heróis", cfg: { skin: "#F6D7BE", head: "mask", headStyle: "wolverine", headColor: "#FFC23D", headColor2: "#1A1A1A", top: "#FFC23D", top2: "#1F4BA5", pattern: "vest", sleeve: "#1F4BA5", legs: "#1F4BA5", belt: "#D62828" } },

  // Vilões
  { id: "coringa", name: "Coringa", group: "Vilões", cfg: { skin: "#F1F1F1", hair: "slick", hairColor: "#2A9D3F", mouth: "evil", top: "#6A2C91", top2: "#2A9D3F", pattern: "suit", legs: "#6A2C91" } },
  { id: "vader", name: "Darth Vader", group: "Vilões", cfg: { head: "helmet", headStyle: "vader", headColor: "#111111", headColor2: "#555B6E", top: "#1A1A1A", top2: "#555B6E", pattern: "panel", cape: "#0D0D0D", legs: "#111111" } },
  { id: "thanos", name: "Thanos", group: "Vilões", cfg: { skin: "#8E6FB5", hair: "none", eyes: "angry", mouth: "line", extra: "chin", top: "#1F4BA5", top2: "#E0A526", pattern: "armor", legs: "#1F4BA5" } },
  { id: "loki", name: "Loki", group: "Vilões", cfg: { skin: "#F6D7BE", hair: "long", hairColor: "#1A1A1A", mouth: "evil", head: "horns", top: "#2D6A4F", top2: "#E0A526", pattern: "armor", cape: "#2D6A4F", legs: "#1B1B1B" } },
  { id: "voldemort", name: "Voldemort", group: "Vilões", cfg: { skin: "#E6E9EF", hair: "none", eyes: "angry", mouth: "line", extra: "snake", top: "#1A1A1A", top2: "#3A3A3A", pattern: "robe", legs: "#111111" } },

  // Filmes e séries
  { id: "harry", name: "Harry Potter", group: "Filmes e séries", cfg: { skin: "#F6D7BE", hair: "messy", hairColor: "#1A1A1A", eyes: "glasses", extra: "scar", top: "#1C1C1C", top2: "#8B1E2D", textColor: "#E0A526", pattern: "scarf", legs: "#333333" } },
  { id: "sparrow", name: "Jack Sparrow", group: "Filmes e séries", cfg: { skin: "#E8B48A", hair: "dreads", hairColor: "#2B1A10", beard: "goatee", head: "bandana", headColor: "#9B1C1C", top: "#E9E2D0", top2: "#5B3A29", pattern: "vest", legs: "#3D2B1F" } },
  { id: "indiana", name: "Indiana Jones", group: "Filmes e séries", cfg: { skin: "#EBBE97", hair: "short", hairColor: "#4A2F1B", beard: "stubble", head: "fedora", headColor: "#7A5230", headColor2: "#3B2A1A", top: "#C9B48A", top2: "#6B4423", pattern: "jacket", legs: "#6B5B45" } },
  { id: "wandinha", name: "Wandinha", group: "Filmes e séries", cfg: { skin: "#F1E7E4", hair: "braids", hairColor: "#111111", mouth: "line", top: "#111111", top2: "#FFFFFF", pattern: "collar", legs: "#111111" } },
  { id: "shrek", name: "Shrek", group: "Filmes e séries", cfg: { skin: "#8DB600", hair: "none", head: "ogre", mouth: "grin", top: "#E9E2D0", top2: "#6B4F2A", pattern: "vest", belt: "#3B2A1A", legs: "#5B4636" } },
  { id: "gandalf", name: "Gandalf", group: "Filmes e séries", cfg: { skin: "#F6D7BE", hair: "long", hairColor: "#D9D9D9", beard: "long", beardColor: "#EDEDED", head: "wizard", headColor: "#8D99AE", top: "#8D99AE", top2: "#6C757D", pattern: "robe", legs: "#6C757D" } },
  { id: "onze", name: "Onze", group: "Filmes e séries", cfg: { skin: "#F6D7BE", hair: "short", hairColor: "#5A3A22", mouth: "line", extra: "nosebleed", top: "#F4A6B7", top2: "#FFFFFF", pattern: "collar", legs: "#2B4C7E" } },
  { id: "jedi", name: "Mestre Jedi", group: "Filmes e séries", cfg: { skin: "#F6D7BE", hair: "short", hairColor: "#B5651D", beard: "beard", top: "#E9DCC0", top2: "#8B5E3C", pattern: "robe", belt: "#5C4033", legs: "#5C4033" } },

  // Games
  { id: "mario", name: "Mario", group: "Games", cfg: { skin: "#F6D7BE", hair: "short", hairColor: "#4A2F1B", beard: "mustache", beardColor: "#2B1A10", head: "cap", headColor: "#E52521", headText: "M", top: "#E52521", top2: "#1F4BA5", pattern: "overalls", legs: "#1F4BA5" } },
  { id: "luigi", name: "Luigi", group: "Games", cfg: { skin: "#F6D7BE", hair: "short", hairColor: "#4A2F1B", beard: "mustache", beardColor: "#2B1A10", head: "cap", headColor: "#2BA84A", headText: "L", top: "#2BA84A", top2: "#1F4BA5", pattern: "overalls", legs: "#1F4BA5" } },
  { id: "link", name: "Link", group: "Games", cfg: { skin: "#F6D7BE", hair: "short", hairColor: "#E9C46A", head: "hood", headColor: "#2BA84A", top: "#2BA84A", top2: "#1E7A36", pattern: "strap", belt: "#6B4423", legs: "#E9E2D0" } },
  { id: "pikachu", name: "Pikachu", group: "Games", cfg: { skin: "#FFD43B", hair: "none", head: "pika", extra: "cheeks", mouth: "tongue", top: "#FFD43B", top2: "#8B5E3C", pattern: "plain", legs: "#FFD43B" } },
  { id: "chief", name: "Master Chief", group: "Games", cfg: { head: "helmet", headStyle: "chief", headColor: "#4B5D3A", headColor2: "#E0A526", top: "#4B5D3A", top2: "#3A4A2D", pattern: "armor", legs: "#3A4A2D" } },
  { id: "kratos", name: "Kratos", group: "Games", cfg: { skin: "#E6E2DA", hair: "none", beard: "beard", beardColor: "#1A1A1A", extra: "tattoo", eyes: "angry", mouth: "line", top: "#E6E2DA", top2: "#7A4E2D", pattern: "strap", legs: "#5A4632" } },
  { id: "lara", name: "Lara Croft", group: "Games", cfg: { skin: "#EBBE97", hair: "ponytail", hairColor: "#5A3A22", top: "#2A9D8F", top2: "#5A3A22", pattern: "strap", belt: "#3B2A1A", legs: "#8B6F47" } },
  { id: "steve", name: "Steve (Minecraft)", group: "Games", cfg: { skin: "#C9946B", hair: "short", hairColor: "#3B2A1A", beard: "stubble", mouth: "line", top: "#2BB3C0", legs: "#3F48A8" } },
  { id: "sonic", name: "Sonic", group: "Games", cfg: { skin: "#1F5BD6", hair: "spiky", hairColor: "#1F5BD6", extra: "muzzle", mouth: "grin", top: "#1F5BD6", top2: "#F6D7BE", pattern: "belly", legs: "#1F5BD6" } },

  // Futebol
  { id: "pele", name: "Pelé", group: "Futebol", cfg: { skin: "#5C3A21", hair: "short", hairColor: "#111111", mouth: "grin", top: "#FFDF00", top2: "#009C3B", pattern: "number", text: "10", legs: "#1F4BA5" } },
  { id: "neymar", name: "Neymar", group: "Futebol", cfg: { skin: "#C68642", hair: "spiky", hairColor: "#E2B04A", beard: "stubble", beardColor: "#3B2A1A", eyes: "wink", top: "#FFDF00", top2: "#009C3B", pattern: "number", text: "10", legs: "#1F4BA5" } },
  { id: "ronaldinho", name: "Ronaldinho", group: "Futebol", cfg: { skin: "#8D5524", hair: "curly", hairColor: "#111111", head: "headband", headColor: "#FFFFFF", mouth: "grin", top: "#FFDF00", top2: "#009C3B", pattern: "number", text: "10", legs: "#1F4BA5" } },
  { id: "marta", name: "Marta", group: "Futebol", cfg: { skin: "#8D5524", hair: "ponytail", hairColor: "#111111", top: "#FFDF00", top2: "#009C3B", pattern: "number", text: "10", legs: "#1F4BA5" } },
  { id: "messi", name: "Messi", group: "Futebol", cfg: { skin: "#F6D7BE", hair: "short", hairColor: "#5A3A22", beard: "beard", top: "#FFFFFF", top2: "#75AADB", textColor: "#16133A", pattern: ["stripes", "number"], text: "10", legs: "#16133A" } },
  { id: "cr7", name: "Cristiano Ronaldo", group: "Futebol", cfg: { skin: "#EBBE97", hair: "slick", hairColor: "#1A1A1A", top: "#C8102E", top2: "#FFC23D", pattern: "number", text: "7", legs: "#046A38" } },
  { id: "vini", name: "Vini Jr.", group: "Futebol", cfg: { skin: "#5C3A21", hair: "short", hairColor: "#111111", mouth: "grin", top: "#FFFFFF", top2: "#16133A", pattern: "number", text: "7", legs: "#FFFFFF" } },
  { id: "mbappe", name: "Mbappé", group: "Futebol", cfg: { skin: "#8D5524", hair: "none", top: "#1F2A5C", top2: "#FFFFFF", pattern: "number", text: "10", legs: "#FFFFFF" } },

  // Profissões
  { id: "astronauta", name: "Astronauta", group: "Profissões", cfg: { skin: "#F6D7BE", hair: "short", hairColor: "#4A2F1B", head: "astro", top: "#F1F1F1", top2: "#1F4BA5", pattern: "panel", legs: "#F1F1F1" } },
  { id: "bombeiro", name: "Bombeiro", group: "Profissões", cfg: { skin: "#EBBE97", hair: "short", hairColor: "#1A1A1A", beard: "mustache", head: "firehat", headColor: "#D62828", top: "#3A3A3A", top2: "#FFC23D", pattern: "hoops", legs: "#3A3A3A" } },
  { id: "chef", name: "Chef", group: "Profissões", cfg: { skin: "#F6D7BE", hair: "short", hairColor: "#4A2F1B", beard: "mustache", head: "chef", top: "#FFFFFF", top2: "#333333", pattern: "buttons", legs: "#333333" } },
  { id: "medica", name: "Médica", group: "Profissões", cfg: { skin: "#C68642", hair: "bun", hairColor: "#2B1A10", top: "#2A9D8F", top2: "#16133A", pattern: "coat", legs: "#2A9D8F" } },
  { id: "ninja", name: "Ninja", group: "Profissões", cfg: { skin: "#F6D7BE", head: "mask", headStyle: "ninja", headColor: "#1A1A1A", top: "#1A1A1A", belt: "#D62828", legs: "#1A1A1A" } },
  { id: "robo", name: "Robô", group: "Profissões", cfg: { head: "helmet", headStyle: "robot", headColor: "#9AA0B5", headColor2: "#4CC9F0", top: "#9AA0B5", top2: "#4CC9F0", pattern: "panel", legs: "#6C757D" } },
  { id: "pirata", name: "Pirata", group: "Profissões", cfg: { skin: "#EBBE97", hair: "long", hairColor: "#2B1A10", beard: "beard", head: "pirate", headColor: "#1A1A1A", extra: "eyepatch", top: "#FFFFFF", top2: "#C1121F", pattern: "vest", belt: "#3B2A1A", legs: "#3D2B1F" } },
  { id: "rockstar", name: "Rockstar", group: "Profissões", cfg: { skin: "#F6D7BE", hair: "long", hairColor: "#1A1A1A", eyes: "shades", mouth: "tongue", top: "#1A1A1A", top2: "#D62828", pattern: "jacket", legs: "#1F2A44" } },
  { id: "gamer", name: "Gamer", group: "Profissões", cfg: { skin: "#C68642", hair: "messy", hairColor: "#2B1A10", head: "headphones", headColor: "#7B2CBF", mouth: "open", top: "#7B2CBF", top2: "#4CC9F0", pattern: "bolt", legs: "#222222" } },
  { id: "realeza", name: "Rei/Rainha", group: "Profissões", cfg: { skin: "#F6D7BE", hair: "long", hairColor: "#E9C46A", head: "crown", top: "#7B2CBF", top2: "#FFC23D", pattern: "robe", cape: "#7B2CBF", legs: "#3C096C" } },

  // Mais heróis
  { id: "viuva", name: "Viúva Negra", group: "Heróis", cfg: { skin: "#F6D7BE", hair: "bob", hairColor: "#C1440E", top: "#1A1A1A", sleeve: "#1A1A1A", belt: "#9AA0B5", legs: "#1A1A1A", mouth: "smirk" } },
  { id: "capita", name: "Capitã Marvel", group: "Heróis", cfg: { skin: "#F6D7BE", hair: "long", hairColor: "#E9C46A", top: "#D62828", top2: "#FFC23D", pattern: "star", sleeve: "#1F4BA5", legs: "#1F4BA5", belt: "#FFC23D" } },
  { id: "deadpool", name: "Deadpool", group: "Heróis", cfg: { skin: "#F6D7BE", head: "mask", headStyle: "deadpool", headColor: "#B3001B", top: "#B3001B", top2: "#1A1A1A", pattern: "strap", legs: "#B3001B", item: "sword" } },
  { id: "robin", name: "Robin", group: "Heróis", cfg: { skin: "#F6D7BE", hair: "slick", hairColor: "#1A1A1A", extra: "domino", top: "#D62828", top2: "#FFC23D", pattern: "emblem", text: "R", textColor: "#1A1A1A", sleeve: "#2BA84A", cape: "#FFC23D", legs: "#2BA84A" } },
  { id: "estranho", name: "Doutor Estranho", group: "Heróis", cfg: { skin: "#F6D7BE", hair: "slick", hairColor: "#1A1A1A", beard: "goatee", top: "#1F2A5C", top2: "#C0C6D4", pattern: "robe", cape: "#C1121F", legs: "#1F2A5C" } },
  { id: "chapolin", name: "Chapolin Colorado", group: "Heróis", cfg: { skin: "#F6D7BE", head: "antennae", headColor: "#D62828", eyes: "wide", top: "#D62828", top2: "#FFC23D", pattern: "heart", legs: "#D62828", item: "hammer" } },

  // Mais vilões
  { id: "arlequina", name: "Arlequina", group: "Vilões", cfg: { skin: "#F1F1F1", hair: "pigtails", hairColor: "#F5E6A8", mouth: "lips", eyes: "lashes", top: "#1A1A1A", top2: "#D62828", pattern: "jacket", sleeve: "#1F4BA5", legs: "#D62828", item: "bat" } },
  { id: "malevola", name: "Malévola", group: "Vilões", cfg: { skin: "#E6E9EF", head: "bighorns", headColor: "#1A1A1A", eyes: "angry", mouth: "lips", top: "#1A1A1A", top2: "#3A3A3A", pattern: "robe", cape: "#1A1A1A", legs: "#1A1A1A" } },
  { id: "duende", name: "Duende Verde", group: "Vilões", cfg: { skin: "#5FA548", hair: "none", eyes: "angry", mouth: "evil", top: "#5FA548", top2: "#6A2C91", pattern: "vest", legs: "#5FA548" } },
  { id: "bowser", name: "Bowser", group: "Vilões", cfg: { skin: "#F2C14E", hair: "mohawk", hairColor: "#D62828", head: "devil", headColor: "#F1E9D2", eyes: "angry", mouth: "grin", top: "#2BA84A", top2: "#F2C14E", pattern: "belly", legs: "#2BA84A" } },

  // Animes
  { id: "goku", name: "Goku", group: "Animes", cfg: { skin: "#F6D7BE", hair: "spiky", hairColor: "#1A1A1A", mouth: "grin", top: "#F77F00", top2: "#1F4BA5", pattern: "jacket", sleeve: "#1F4BA5", belt: "#1F4BA5", legs: "#F77F00" } },
  { id: "vegeta", name: "Vegeta", group: "Animes", cfg: { skin: "#F6D7BE", hair: "spiky", hairColor: "#1A1A1A", eyes: "angry", mouth: "smirk", top: "#1F4BA5", top2: "#FFFFFF", pattern: "armor", legs: "#1F4BA5" } },
  { id: "naruto", name: "Naruto", group: "Animes", cfg: { skin: "#F6D7BE", hair: "spiky", hairColor: "#F2C14E", head: "headband", headColor: "#1F4BA5", extra: "whiskers", mouth: "grin", top: "#F77F00", top2: "#1A1A1A", pattern: "jacket", legs: "#F77F00" } },
  { id: "sasuke", name: "Sasuke", group: "Animes", cfg: { skin: "#F6D7BE", hair: "messy", hairColor: "#1A1A1A", eyes: "angry", mouth: "line", top: "#F1F1F1", top2: "#2B2D42", pattern: "jacket", belt: "#6A2C91", legs: "#2B2D42" } },
  { id: "luffy", name: "Luffy", group: "Animes", cfg: { skin: "#F6D7BE", hair: "short", hairColor: "#1A1A1A", head: "straw", headColor: "#D62828", mouth: "grin", top: "#D62828", top2: "#F6D7BE", pattern: "jacket", legs: "#1F4BA5", belt: "#FFC23D" } },
  { id: "zoro", name: "Zoro", group: "Animes", cfg: { skin: "#E8B48A", hair: "short", hairColor: "#2BA84A", eyes: "angry", mouth: "smirk", top: "#FFFFFF", top2: "#2BA84A", pattern: "sash", legs: "#1A1A1A", item: "sword" } },
  { id: "seiya", name: "Seiya", group: "Animes", cfg: { skin: "#F6D7BE", hair: "messy", hairColor: "#7A3E1D", head: "tiara", top: "#D62828", top2: "#E9ECEF", pattern: "armor", legs: "#D62828" } },
  { id: "ash", name: "Ash", group: "Animes", cfg: { skin: "#F6D7BE", hair: "spiky", hairColor: "#1A1A1A", head: "cap", headColor: "#D62828", top: "#1F4BA5", top2: "#FFFFFF", pattern: "jacket", legs: "#2B4C7E", item: "pokeball" } },
  { id: "sailor", name: "Sailor Moon", group: "Animes", cfg: { skin: "#F6D7BE", hair: "pigtails", hairColor: "#F5E6A8", head: "tiara", eyes: "lashes", top: "#FFFFFF", top2: "#1F4BA5", pattern: "collar", belt: "#D62828", legs: "#1F4BA5" } },
  { id: "tanjiro", name: "Tanjiro", group: "Animes", cfg: { skin: "#F6D7BE", hair: "short", hairColor: "#7A1F1F", extra: "scar", top: "#2BA84A", top2: "#1A1A1A", pattern: "plaid", legs: "#1A1A1A", item: "sword" } },

  // Desenhos
  { id: "homer", name: "Homer", group: "Desenhos", cfg: { skin: "#FFD90F", hair: "none", beard: "stubble", beardColor: "#8B5E3C", eyes: "wide", top: "#FFFFFF", legs: "#1F4BA5" } },
  { id: "bart", name: "Bart", group: "Desenhos", cfg: { skin: "#FFD90F", hair: "spiky", hairColor: "#FFD90F", eyes: "wide", mouth: "smirk", top: "#F77F00", legs: "#1F4BA5" } },
  { id: "monica", name: "Mônica", group: "Desenhos", cfg: { skin: "#F6D7BE", hair: "bob", hairColor: "#1A1A1A", mouth: "teeth", top: "#D62828", legs: "#D62828" } },
  { id: "cebolinha", name: "Cebolinha", group: "Desenhos", cfg: { skin: "#F6D7BE", hair: "fivehairs", hairColor: "#1A1A1A", mouth: "smirk", top: "#2BA84A", legs: "#1A1A1A" } },
  { id: "cascao", name: "Cascão", group: "Desenhos", cfg: { skin: "#F6D7BE", hair: "messy", hairColor: "#1A1A1A", extra: "freckles", mouth: "grin", top: "#FFC23D", legs: "#D62828" } },
  { id: "magali", name: "Magali", group: "Desenhos", cfg: { skin: "#F6D7BE", hair: "bob", hairColor: "#1A1A1A", mouth: "tongue", top: "#FFC23D", legs: "#FFC23D" } },
  { id: "chaves", name: "Chaves", group: "Desenhos", cfg: { skin: "#F6D7BE", hair: "short", hairColor: "#7A4E2D", head: "cap", headColor: "#8B5E3C", extra: "freckles", top: "#9A8C5A", top2: "#5C4033", pattern: "overalls", legs: "#5C4033" } },
  { id: "mickey", name: "Mickey", group: "Desenhos", cfg: { skin: "#F6D7BE", hair: "none", head: "mouse", headColor: "#1A1A1A", mouth: "grin", top: "#1A1A1A", top2: "#FFC23D", pattern: "buttons", legs: "#D62828" } },
  { id: "picapau", name: "Pica-Pau", group: "Desenhos", cfg: { skin: "#1F4BA5", hair: "mohawk", hairColor: "#D62828", extra: "muzzle", mouth: "grin", top: "#1F4BA5", top2: "#F6D7BE", pattern: "belly", legs: "#1F4BA5" } },
  { id: "fred", name: "Fred Flintstone", group: "Desenhos", cfg: { skin: "#F6D7BE", hair: "messy", hairColor: "#1A1A1A", beard: "stubble", top: "#F77F00", top2: "#1A1A1A", pattern: "dots", legs: "#F77F00" } },
  { id: "ben10", name: "Ben 10", group: "Desenhos", cfg: { skin: "#F6D7BE", hair: "side", hairColor: "#7A4E2D", top: "#FFFFFF", top2: "#1A1A1A", pattern: "stripes", legs: "#2BA84A", item: "watch" } },
  { id: "dora", name: "Dora", group: "Desenhos", cfg: { skin: "#C68642", hair: "bob", hairColor: "#4A2F1B", top: "#F4A6B7", legs: "#F77F00" } },

  // Mais filmes e séries
  { id: "barbie", name: "Barbie", group: "Filmes e séries", cfg: { skin: "#F6D7BE", hair: "long", hairColor: "#F5E6A8", eyes: "lashes", mouth: "lips", top: "#F72585", top2: "#FFFFFF", pattern: "dots", legs: "#F72585" } },
  { id: "joel", name: "Sobrevivente", group: "Filmes e séries", cfg: { skin: "#E8B48A", hair: "messy", hairColor: "#4A2F1B", beard: "beard", top: "#2B4C7E", top2: "#8B5E3C", pattern: "plaid", legs: "#5B4636" } },
  { id: "rocky", name: "Rocky", group: "Filmes e séries", cfg: { skin: "#E8B48A", hair: "short", hairColor: "#1A1A1A", eyes: "sleepy", top: "#E8B48A", top2: "#D62828", pattern: "abs", legs: "#D62828", item: "trophy" } },
  { id: "tarzan", name: "Tarzan", group: "Filmes e séries", cfg: { skin: "#E8B48A", hair: "long", hairColor: "#5A3A22", top: "#E8B48A", top2: "#C9A27E", pattern: "abs", legs: "#8B5E3C" } },

  // Mais games
  { id: "ryu", name: "Ryu", group: "Games", cfg: { skin: "#F6D7BE", hair: "short", hairColor: "#1A1A1A", head: "headband", headColor: "#D62828", eyes: "angry", mouth: "line", top: "#FFFFFF", top2: "#E6E6E6", pattern: "robe", belt: "#1A1A1A", legs: "#FFFFFF" } },
  { id: "chunli", name: "Chun-Li", group: "Games", cfg: { skin: "#F6D7BE", hair: "buns", hairColor: "#1A1A1A", top: "#1F4BA5", top2: "#FFC23D", pattern: "chevron", legs: "#1F4BA5" } },
  { id: "peach", name: "Princesa Peach", group: "Games", cfg: { skin: "#F6D7BE", hair: "long", hairColor: "#F5E6A8", head: "crown", eyes: "lashes", top: "#F4A6B7", legs: "#F4A6B7" } },
  { id: "kirby", name: "Kirby", group: "Games", cfg: { skin: "#F4A6B7", hair: "none", eyes: "wide", extra: "cheeks", mouth: "open", top: "#F4A6B7", legs: "#D62828" } },
  { id: "crash", name: "Crash", group: "Games", cfg: { skin: "#F77F00", hair: "spiky", hairColor: "#7A3E1D", eyes: "wide", mouth: "grin", top: "#F77F00", legs: "#1F4BA5" } },
  { id: "zelda", name: "Zelda", group: "Games", cfg: { skin: "#F6D7BE", hair: "long", hairColor: "#E9C46A", head: "tiara", top: "#F1F1F1", top2: "#7B2CBF", pattern: "robe", legs: "#F1F1F1" } },
  { id: "geralt", name: "Bruxo", group: "Games", cfg: { skin: "#E6E2DA", hair: "long", hairColor: "#E6E6E6", beard: "stubble", eyes: "angry", mouth: "line", top: "#1A1A1A", top2: "#8B5E3C", pattern: "strap", legs: "#1A1A1A", item: "sword" } },

  // Mais futebol
  { id: "ronaldo", name: "Ronaldo Fenômeno", group: "Futebol", cfg: { skin: "#C68642", hair: "buzz", hairColor: "#1A1A1A", mouth: "teeth", top: "#FFDF00", top2: "#009C3B", pattern: "number", text: "9", legs: "#1F4BA5" } },
  { id: "zico", name: "Zico", group: "Futebol", cfg: { skin: "#F6D7BE", hair: "curly", hairColor: "#3B2A1A", top: "#D62828", top2: "#1A1A1A", textColor: "#FFFFFF", pattern: ["hoops", "number"], text: "10", legs: "#FFFFFF" } },
  { id: "romario", name: "Romário", group: "Futebol", cfg: { skin: "#8D5524", hair: "buzz", hairColor: "#1A1A1A", mouth: "smirk", top: "#FFDF00", top2: "#009C3B", pattern: "number", text: "11", legs: "#1F4BA5" } },
  { id: "kaka", name: "Kaká", group: "Futebol", cfg: { skin: "#F6D7BE", hair: "side", hairColor: "#3B2A1A", top: "#D62828", top2: "#1A1A1A", textColor: "#FFFFFF", pattern: ["stripes", "number"], text: "22", legs: "#FFFFFF" } },
  { id: "haaland", name: "Haaland", group: "Futebol", cfg: { skin: "#F6D7BE", hair: "bun", hairColor: "#F5E6A8", top: "#6CABDD", top2: "#FFFFFF", pattern: "number", text: "9", legs: "#FFFFFF" } },
  { id: "cafu", name: "Cafu", group: "Futebol", cfg: { skin: "#5C3A21", hair: "buzz", hairColor: "#1A1A1A", mouth: "grin", top: "#FFDF00", top2: "#009C3B", pattern: "number", text: "2", legs: "#1F4BA5", item: "trophy" } },

  // Mais profissões
  { id: "policial", name: "Policial", group: "Profissões", cfg: { skin: "#C68642", hair: "short", hairColor: "#1A1A1A", head: "cap", headColor: "#1F2A5C", top: "#1F2A5C", top2: "#FFC23D", pattern: "buttons", legs: "#1F2A5C" } },
  { id: "professora", name: "Professora", group: "Profissões", cfg: { skin: "#EBBE97", hair: "bun", hairColor: "#9AA0B5", eyes: "glasses", top: "#7B2CBF", top2: "#FFFFFF", pattern: "collar", legs: "#3C096C", item: "book" } },
  { id: "cientista", name: "Cientista", group: "Profissões", cfg: { skin: "#F6D7BE", hair: "messy", hairColor: "#E6E6E6", eyes: "glasses", top: "#4CC9F0", top2: "#2A9D8F", pattern: "coat", legs: "#333333", item: "flask" } },
  { id: "magico", name: "Mágico", group: "Profissões", cfg: { skin: "#F6D7BE", hair: "short", hairColor: "#1A1A1A", beard: "mustache", head: "tophat", headColor: "#1A1A1A", headColor2: "#D62828", top: "#1A1A1A", top2: "#D62828", pattern: "suit", cape: "#1A1A1A", legs: "#1A1A1A", item: "wand" } },
  { id: "palhaco", name: "Palhaço", group: "Profissões", cfg: { skin: "#F6D7BE", hair: "afro", hairColor: "#D62828", extra: "nose", mouth: "grin", top: "#FFC23D", top2: "#D62828", pattern: "dots", legs: "#1F4BA5", item: "balloon" } },
  { id: "detetive", name: "Detetive", group: "Profissões", cfg: { skin: "#F6D7BE", hair: "short", hairColor: "#4A2F1B", head: "fedora", headColor: "#8B5E3C", headColor2: "#3B2A1A", top: "#C9B48A", top2: "#8B5E3C", pattern: "jacket", legs: "#5B4636", item: "magnifier" } },
  { id: "fazendeiro", name: "Fazendeiro", group: "Profissões", cfg: { skin: "#E8B48A", hair: "short", hairColor: "#4A2F1B", beard: "stubble", head: "cowboy", headColor: "#E9C46A", headColor2: "#8B5E3C", top: "#D62828", top2: "#1A1A1A", pattern: "plaid", legs: "#1F4BA5" } },
  { id: "dj", name: "DJ", group: "Profissões", cfg: { skin: "#8D5524", hair: "curly", hairColor: "#1A1A1A", head: "headphones", headColor: "#1A1A1A", eyes: "shades", top: "#1A1A1A", top2: "#4CC9F0", pattern: "bolt", legs: "#1F2A44" } },
  { id: "skatista", name: "Skatista", group: "Profissões", cfg: { skin: "#F6D7BE", hair: "long", hairColor: "#8B5E3C", head: "beanie", headColor: "#2A9D8F", headColor2: "#FFFFFF", top: "#2A9D8F", top2: "#FFFFFF", pattern: "hoodie", legs: "#555555" } },
  { id: "surfista", name: "Surfista", group: "Profissões", cfg: { skin: "#C68642", hair: "long", hairColor: "#E9C46A", mouth: "grin", top: "#4CC9F0", top2: "#FFFFFF", pattern: "tank", legs: "#F77F00" } },
];

function presetById(id) {
  return PRESETS.find((p) => p.id === id);
}
