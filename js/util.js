// Utilidades usadas por todas as telas.

const $ = (id) => document.getElementById(id);

// Guarda no navegador. store.onWrite (do modo online) leva as mudanças para a conta.
function store(key, value) {
  try {
    if (value === undefined) return JSON.parse(localStorage.getItem("tt:" + key));
    localStorage.setItem("tt:" + key, JSON.stringify(value));
    if (store.onWrite) store.onWrite(key);
  } catch (e) {
    return null;
  }
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

function plural(n, one, many) {
  return `${n} ${n === 1 ? one : many}`;
}

// Copia um texto: usa o compartilhamento do celular quando existe.
function shareText(text, btn, label) {
  const done = () => {
    if (!btn) return;
    btn.textContent = "Copiado!";
    setTimeout(() => (btn.textContent = label), 1800);
  };
  if (navigator.share && matchMedia("(hover: none)").matches) {
    navigator.share({ text }).catch(() => {});
    return;
  }
  if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, () => prompt("Copie:", text));
  else prompt("Copie:", text);
}

// ───────────── navegação ─────────────

const screens = ["home", "modes", "players", "lists", "editor", "game", "results", "stats", "online", "lobby"];

function show(name) {
  screens.forEach((s) => ($("screen-" + s).hidden = s !== name));
  document.body.dataset.screen = name;
  window.scrollTo({ top: 0, behavior: "smooth" });
}
