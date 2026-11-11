// Brilho da tela do Gamezi, igual em todos os jogos e páginas: uma camada preta transparente por cima de tudo (que não
// atrapalha o toque), para escurecer mais do que o mínimo do aparelho (o dono pediu). As janelas abertas (<dialog>)
// ficam numa camada acima de tudo, então escurecem com filtro. A linha "Brilho" (de 10 a 100, igual à do volume da
// música) entra sozinha no #settings-dialog; o valor fica em gz:brilho. Carregado no <head> de cada página, para a tela já
// abrir escura, sem piscar.

(function () {
  var CHAVE = "gz:brilho";
  var MINIMO = 10;
  var TEXTO = { pt: "Brilho", en: "Brightness", es: "Brillo" };

  function brilho() {
    try {
      var v = JSON.parse(localStorage.getItem(CHAVE));
      return typeof v === "number" && v >= MINIMO && v <= 100 ? v : 100;
    } catch (e) { return 100; }
  }

  function aplicar(v) {
    var raiz = document.documentElement;
    raiz.style.setProperty("--gz-escuro", String((100 - v) / 100));
    raiz.style.setProperty("--gz-brilho", String(v / 100));
    if (v < 100) raiz.setAttribute("data-gz-escuro", ""); else raiz.removeAttribute("data-gz-escuro");
  }

  var css = document.createElement("style");
  css.id = "gamezi-brilho-css";
  css.textContent =
    "html[data-gz-escuro]::after{content:'';position:fixed;inset:0;background:#000;opacity:var(--gz-escuro,0);" +
    "pointer-events:none;z-index:2147483647}" +
    "html[data-gz-escuro] dialog[open]{filter:brightness(var(--gz-brilho,1))}" +
    ".gz-brilho{display:flex;align-items:center;gap:8px;flex:1;max-width:220px}" +
    ".gz-brilho input{flex:1;min-width:0;accent-color:var(--accent,#ff4d3d)}" +
    ".gz-brilho output{min-width:2.2em;text-align:right;font-variant-numeric:tabular-nums}";
  (document.head || document.documentElement).appendChild(css);
  aplicar(brilho());

  function idioma() {
    var l = (document.documentElement.lang || "pt").slice(0, 2);
    return TEXTO[l] ? l : "pt";
  }

  // Linha "Brilho" nas Configurações (quando a página tem a janela; nos jogos do kit ela é criada depois).
  function colocarNasConfiguracoes() {
    var caixa = document.querySelector("#settings-dialog .dialog-inner");
    if (!caixa || document.getElementById("gz-brilho")) return !!caixa;
    var linha = document.createElement("div");
    linha.className = "setting-row";
    linha.innerHTML = '<span class="gz-brilho-rotulo"></span><span class="gz-brilho"><input type="range" id="gz-brilho" min="' +
      MINIMO + '" max="100" step="1"><output></output></span>';
    caixa.appendChild(linha);
    var rotulo = linha.querySelector(".gz-brilho-rotulo");
    var faixa = linha.querySelector("input");
    var numero = linha.querySelector("output");
    var atualizar = function () {
      rotulo.textContent = TEXTO[idioma()];
      faixa.setAttribute("aria-label", TEXTO[idioma()]);
      faixa.value = brilho();
      numero.textContent = brilho();
    };
    atualizar();
    faixa.oninput = function () {
      var v = Number(faixa.value);
      try { localStorage.setItem(CHAVE, JSON.stringify(v)); } catch (e) { /* vale só agora */ }
      numero.textContent = v;
      aplicar(v);
    };
    var dlg = document.getElementById("settings-dialog");
    if (dlg) new MutationObserver(atualizar).observe(dlg, { attributes: true, attributeFilter: ["open"] });
    return true;
  }

  function procurar() {
    if (colocarNasConfiguracoes()) return;
    // A janela de Configurações dos jogos do kit é montada depois: espera ela aparecer.
    var obs = new MutationObserver(function () { if (colocarNasConfiguracoes()) obs.disconnect(); });
    obs.observe(document.documentElement, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", procurar);
  else procurar();
  // Outra aba mudou o brilho: acompanha.
  addEventListener("storage", function (e) { if (e.key === CHAVE) aplicar(brilho()); });

  window.gameziBrilho = { brilho: brilho, aplicar: aplicar };
})();
