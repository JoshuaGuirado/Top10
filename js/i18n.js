// Idiomas: português, inglês e espanhol.
//
// Cada texto tem uma chave e as três versões: [pt, en, es]. t("chave", { n: 3 }) troca {n}
// pelo valor. Texto com "¦" tem singular e plural ("{n} acerto¦{n} acertos") e usa {n}.
// Listas de frases (para sortear) são três listas: [[pt…], [en…], [es…]].
// Os textos ficam em js/textos.js.

const LANGS = ["pt", "en", "es"];
const LANG_NAMES = { pt: "Português", en: "English", es: "Español" };

function detectLang() {
  const saved = store("lang");
  if (LANGS.includes(saved)) return saved;
  const nav = (navigator.language || "pt").slice(0, 2).toLowerCase();
  return LANGS.includes(nav) ? nav : "pt";
}

let lang = detectLang();
const langIndex = () => LANGS.indexOf(lang);

function fill(text, vars) {
  if (!vars) return text;
  if (text.includes("¦") && vars.n !== undefined) text = text.split("¦")[vars.n === 1 ? 0 : 1];
  return text.replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? vars[k] : m));
}

// Texto traduzido. Chave que não existe aparece como está (fácil de achar).
function t(key, vars) {
  const entry = TEXTS[key];
  if (!entry) return key;
  const text = entry[langIndex()] ?? entry[0];
  return fill(Array.isArray(text) ? pick(text) : text, vars);
}

// Lista de frases no idioma atual (para sortear ou escolher pelo índice).
function tList(key) {
  const entry = TEXTS[key];
  return entry ? entry[langIndex()] || entry[0] : [key];
}

// Mensagens que vão de um aparelho para outro no modo online viajam como
// [chave, variáveis] e cada aparelho traduz no próprio idioma.
function tMsg(msg) {
  if (!msg) return "";
  if (typeof msg === "string") return msg;
  return msg.map((part) => {
    if (typeof part === "string") return part;
    const [key, raw = {}, index] = part;
    // Variável que também precisa de tradução: ["chave", vars] ou ["@hint", nome do item].
    const vars = {};
    Object.entries(raw).forEach(([k, v]) => (vars[k] = Array.isArray(v) ? (v[0] === "@hint" ? hintFor(v[1]) : t(v[0], v[1])) : v));
    if (index !== undefined) return fill(tList(key)[index % tList(key).length], vars);
    return t(key, vars);
  }).join(" ");
}

// Nome de categoria no idioma atual (as listas em português guardam o rótulo original).
function catLabel(cat) {
  return TEXTS["cat." + cat.id] ? t("cat." + cat.id) : cat.label;
}

// Textos fixos da página: data-i18n (texto), data-i18n-html, data-i18n-ph (placeholder),
// data-i18n-aria (aria-label).
function applyStaticTexts() {
  document.documentElement.lang = { pt: "pt-BR", en: "en", es: "es" }[lang];
  document.querySelectorAll("[data-i18n]").forEach((el) => (el.textContent = t(el.dataset.i18n)));
  document.querySelectorAll("[data-i18n-html]").forEach((el) => (el.innerHTML = t(el.dataset.i18nHtml)));
  document.querySelectorAll("[data-i18n-ph]").forEach((el) => (el.placeholder = t(el.dataset.i18nPh)));
  document.querySelectorAll("[data-i18n-aria]").forEach((el) => el.setAttribute("aria-label", t(el.dataset.i18nAria)));
}

function setLang(next) {
  if (!LANGS.includes(next)) return;
  lang = next;
  store("lang", next);
  applyStaticTexts();
  if (typeof onLangChange === "function") onLangChange();
}
