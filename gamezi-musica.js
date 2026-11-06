// Música de fundo do Gamezi, igual em todos os jogos: feita na hora pelo navegador (Web Audio), sem arquivo de áudio.
// Uma base calma (acordes, baixo e um dedilhado) que dá a volta a cada 8 compassos, baixinha para não atrapalhar.
// Liga e desliga em Configurações (a linha "Música" entra sozinha no #settings-dialog); fica guardado em tt:musica,
// o mesmo para todos os jogos. Logo abaixo, a linha "Volume" (de 0 a 100, em tt:musica-volume): o dono pediu uma
// margem bem grande, então vai do silêncio a bem alto (o 100 é umas 14 vezes o volume de antes). Os navegadores só deixam tocar som depois do primeiro toque na tela, então ela começa aí.
// Para quando a aba fica escondida.
// "Música especial" (tt:musica-trilha = "especial"): outra trilha, original, de piano calmo com notas espaçadas, eco e
// silêncios, sorteada na hora (nunca repete igual). Não é cópia de música de ninguém (o dono pediu as do Minecraft;
// copiar melodia de música com dono não pode, então é só o clima: calma, espaçada, com eco).

(function () {
  var CHAVE = "tt:musica";
  var CHAVE_VOLUME = "tt:musica-volume";
  var TEXTO = { pt: "Música", en: "Music", es: "Música" };
  var TEXTO_VOLUME = { pt: "Volume", en: "Volume", es: "Volumen" };
  var BPM = 84;
  var CHAVE_TRILHA = "tt:musica-trilha";
  var TEXTO_ESPECIAL = { pt: "Música especial", en: "Special music", es: "Música especial" };
  var VOLUME_PADRAO = 26;
  // Trilha especial: um tempo a cada ~0,9 s; cada acorde dura 8 tempos. Ré maior com sétimas e nonas, bem aberto.
  var ESP_BPM = 66;
  var ESP_ACORDES = [[50, 57, 61, 64, 69], [47, 54, 57, 62, 66], [43, 50, 54, 59, 64], [45, 52, 57, 61, 64], [42, 49, 52, 57, 61], [43, 50, 55, 59, 62]];
  var ESP_ESCALA = [69, 71, 73, 74, 76, 78, 81, 83, 85, 86]; // Ré maior, região média-aguda do piano // na escala de 0 a 100; dá o volume de antes (0,07)
  // Acordes (notas MIDI): Dó, Lá menor, Fá, Sol, Mi menor, Lá menor, Ré menor, Sol.
  var ACORDES = [[60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62], [52, 55, 59], [57, 60, 64], [50, 53, 57], [55, 59, 62]];
  var DEDILHADO = [0, 1, 2, 1, 2, 1, 0, 2]; // qual nota do acorde em cada colcheia (mais uma oitava acima)

  var ctx = null, saida = null, eco = null, timer = null, passo = 0, proximo = 0, tocando = false;
  var espAcorde = 0, espNota = 4, espDescanso = 0;

  function trilha() {
    try { return localStorage.getItem(CHAVE_TRILHA) === "especial" ? "especial" : "normal"; } catch (e) { return "normal"; }
  }

  function ligada() {
    try { var v = JSON.parse(localStorage.getItem(CHAVE)); return v !== false; } catch (e) { return true; }
  }

  function guardar(v) {
    try { localStorage.setItem(CHAVE, JSON.stringify(v)); } catch (e) { /* sem armazenamento: vale só agora */ }
  }

  // 0 a 100 na tela; o ouvido sente volume mais ou menos ao quadrado, então o ganho é (v/100)².
  function volume() {
    try {
      var v = JSON.parse(localStorage.getItem(CHAVE_VOLUME));
      return typeof v === "number" && v >= 0 && v <= 100 ? v : VOLUME_PADRAO;
    } catch (e) { return VOLUME_PADRAO; }
  }

  function ganho(v) {
    return Math.max(0.0001, Math.pow(v / 100, 2));
  }

  function hz(nota) {
    return 440 * Math.pow(2, (nota - 69) / 12);
  }

  function nota(freq, quando, dur, tipo, vol, ataque) {
    var o = ctx.createOscillator();
    var g = ctx.createGain();
    o.type = tipo;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, quando);
    g.gain.exponentialRampToValueAtTime(vol, quando + ataque);
    g.gain.exponentialRampToValueAtTime(0.0001, quando + dur);
    o.connect(g);
    g.connect(saida);
    o.start(quando);
    o.stop(quando + dur + 0.05);
  }

  // Uma colcheia: dedilhado sempre; no começo do compasso, o acorde (suave) e o baixo.
  // Eco de sala grande (ruído que vai sumindo), só para a trilha especial.
  function criarEco() {
    var dur = 3.2, n = Math.floor(ctx.sampleRate * dur);
    var buf = ctx.createBuffer(2, n, ctx.sampleRate);
    for (var c = 0; c < 2; c++) {
      var d = buf.getChannelData(c);
      for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2.6);
    }
    var conv = ctx.createConvolver();
    conv.buffer = buf;
    var volta = ctx.createGain();
    volta.gain.value = 0.55;
    conv.connect(volta);
    volta.connect(saida);
    return conv;
  }

  // Uma nota de "piano": ataque rápido e som que vai morrendo devagar (fundamental + harmônicos fracos).
  function piano(n, quando, vol, dur) {
    var f = hz(n);
    [[1, "sine", 1], [2, "sine", 0.28], [3, "triangle", 0.08]].forEach(function (h) {
      var o = ctx.createOscillator();
      var g = ctx.createGain();
      o.type = h[1];
      o.frequency.value = f * h[0];
      g.gain.setValueAtTime(0.0001, quando);
      g.gain.exponentialRampToValueAtTime(vol * h[2], quando + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, quando + dur / h[0]);
      o.connect(g);
      g.connect(saida);
      if (eco) g.connect(eco);
      o.start(quando);
      o.stop(quando + dur + 0.05);
    });
  }

  // Um tempo da trilha especial. No começo de cada acorde: o acorde dedilhado devagar, às vezes só o baixo.
  // A melodia é sorteada: poucas notas, quase sempre perto da anterior, e às vezes um trecho inteiro em silêncio.
  function tocarEspecial(i, quando) {
    var tempo = i % 8;
    if (tempo === 0) {
      if (i > 0) espAcorde = Math.random() < 0.7 ? (espAcorde + 1) % ESP_ACORDES.length : Math.floor(Math.random() * ESP_ACORDES.length);
      espDescanso = Math.random() < 0.22 ? 8 : 0;
      var ac = ESP_ACORDES[espAcorde];
      var so = Math.random() < 0.25;
      ac.forEach(function (n, k) {
        if (so && k > 1) return;
        piano(n, quando + k * (0.11 + Math.random() * 0.06), k === 0 ? 0.11 : 0.06, 7);
      });
    }
    if (espDescanso > 0) { espDescanso -= 1; return; }
    if (Math.random() < (tempo % 2 ? 0.18 : 0.38)) {
      espNota = Math.max(0, Math.min(ESP_ESCALA.length - 1, espNota + [-2, -1, -1, 1, 1, 2, 0][Math.floor(Math.random() * 7)]));
      var atraso = Math.random() < 0.3 ? 60 / ESP_BPM / 2 : 0;
      piano(ESP_ESCALA[espNota], quando + atraso, 0.07 + Math.random() * 0.03, 4.5);
    }
  }

  function tocarPasso(i, quando) {
    var colcheia = 60 / BPM / 2;
    var acorde = ACORDES[Math.floor(i / 8) % ACORDES.length];
    var k = i % 8;
    if (k === 0) {
      acorde.forEach(function (n) { nota(hz(n), quando, colcheia * 8, "sine", 0.05, 0.4); });
      nota(hz(acorde[0] - 24), quando, colcheia * 3.5, "triangle", 0.12, 0.02);
    }
    if (k === 4) nota(hz(acorde[0] - 24), quando, colcheia * 3.5, "triangle", 0.08, 0.02);
    nota(hz(acorde[DEDILHADO[k]] + 12), quando, colcheia * 1.6, "triangle", 0.045, 0.01);
  }

  function agendar() {
    var especial = trilha() === "especial";
    var passoDur = especial ? 60 / ESP_BPM : 60 / BPM / 2;
    while (proximo < ctx.currentTime + 0.25) {
      if (especial) tocarEspecial(passo, proximo);
      else tocarPasso(passo, proximo);
      passo += 1;
      proximo += passoDur;
    }
  }

  // Troca de trilha: recomeça do primeiro compasso (as notas que já soaram terminam sozinhas).
  function trocarTrilha() {
    passo = 0;
    espAcorde = 0;
    if (ctx) proximo = ctx.currentTime + 0.3;
  }

  function comecar() {
    if (tocando || !ligada() || document.hidden) return;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      if (!ctx) {
        ctx = new AC();
        saida = ctx.createGain();
        saida.gain.value = ganho(volume());
        saida.connect(ctx.destination);
        try { eco = criarEco(); } catch (e) { eco = null; }
      }
      if (ctx.state === "suspended") ctx.resume();
    } catch (e) {
      return;
    }
    tocando = true;
    proximo = ctx.currentTime + 0.1;
    timer = setInterval(agendar, 100);
    agendar();
  }

  function parar() {
    tocando = false;
    clearInterval(timer);
    timer = null;
    if (ctx && ctx.state === "running") ctx.suspend();
  }

  function idioma() {
    var l = (document.documentElement.lang || "pt").slice(0, 2);
    return TEXTO[l] ? l : "pt";
  }

  var ICONE = '<svg class="ui-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>';

  function desenharBotao(b) {
    var on = ligada();
    b.innerHTML = ICONE + (on ? "" : '<path d="M3 3l18 18"/>') + "</svg>";
    b.setAttribute("aria-pressed", on ? "true" : "false");
    b.title = TEXTO[idioma()];
    b.setAttribute("aria-label", TEXTO[idioma()]);
    b.style.opacity = on ? "1" : ".55";
  }

  // Linha "Música" nas Configurações do jogo (depois de Tema/Som).
  function colocarNasConfiguracoes() {
    var caixa = document.querySelector("#settings-dialog .dialog-inner");
    if (!caixa || document.getElementById("musica-btn")) return;
    var linha = document.createElement("div");
    linha.className = "setting-row";
    linha.innerHTML = '<span class="musica-rotulo"></span><button type="button" class="icon-btn" id="musica-btn"></button>';
    caixa.appendChild(linha);
    var linhaVol = document.createElement("div");
    linhaVol.className = "setting-row";
    linhaVol.innerHTML = '<span class="musica-rotulo"></span><span class="musica-volume"><input type="range" id="musica-volume" min="0" max="100" step="1"><output></output></span>';
    caixa.appendChild(linhaVol);
    var linhaEsp = document.createElement("div");
    linhaEsp.className = "setting-row";
    linhaEsp.innerHTML = '<span class="musica-rotulo"></span><button type="button" class="icon-btn" id="musica-especial-btn"></button>';
    caixa.appendChild(linhaEsp);
    if (!document.getElementById("musica-volume-css")) {
      var css = document.createElement("style");
      css.id = "musica-volume-css";
      css.textContent = ".musica-volume{display:flex;align-items:center;gap:8px;flex:1;max-width:220px}" +
        ".musica-volume input{flex:1;min-width:0;accent-color:var(--accent,#ff4d3d)}" +
        ".musica-volume output{min-width:2.2em;text-align:right;font-variant-numeric:tabular-nums}";
      document.head.appendChild(css);
    }
    var rotulo = linha.querySelector(".musica-rotulo");
    var rotuloVol = linhaVol.querySelector(".musica-rotulo");
    var rotuloEsp = linhaEsp.querySelector(".musica-rotulo");
    var bEsp = linhaEsp.querySelector("button");
    var b = linha.querySelector("button");
    var faixa = linhaVol.querySelector("input");
    var numero = linhaVol.querySelector("output");
    var atualizar = function () {
      rotulo.textContent = TEXTO[idioma()];
      rotuloVol.textContent = TEXTO_VOLUME[idioma()];
      faixa.setAttribute("aria-label", TEXTO_VOLUME[idioma()]);
      faixa.value = volume();
      numero.textContent = volume();
      linhaVol.style.opacity = ligada() ? "1" : ".55";
      var esp = trilha() === "especial";
      rotuloEsp.textContent = TEXTO_ESPECIAL[idioma()];
      bEsp.innerHTML = '<svg class="ui-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>' + (esp ? "" : '<path d="M3 3l18 18"/>') + "</svg>";
      bEsp.setAttribute("aria-pressed", esp ? "true" : "false");
      bEsp.setAttribute("aria-label", TEXTO_ESPECIAL[idioma()]);
      bEsp.title = TEXTO_ESPECIAL[idioma()];
      bEsp.style.opacity = esp ? "1" : ".55";
      desenharBotao(b);
    };
    faixa.oninput = function () {
      var v = Number(faixa.value);
      try { localStorage.setItem(CHAVE_VOLUME, JSON.stringify(v)); } catch (e) { /* vale só agora */ }
      numero.textContent = v;
      if (saida) saida.gain.setTargetAtTime(ganho(v), ctx.currentTime, 0.05);
      // Mexeu no volume com a música desligada: liga, para dar para ouvir como ficou.
      if (!ligada() && v > 0) {
        guardar(true);
        comecar();
        atualizar();
      }
    };
    atualizar();
    bEsp.onclick = function () {
      var esp = trilha() !== "especial";
      try { localStorage.setItem(CHAVE_TRILHA, esp ? "especial" : "normal"); } catch (e) { /* vale só agora */ }
      trocarTrilha();
      // Escolheu a especial com a música desligada: liga, para ouvir.
      if (!ligada()) guardar(true);
      comecar();
      atualizar();
    };
    b.onclick = function () {
      var on = !ligada();
      guardar(on);
      if (on) comecar(); else parar();
      atualizar();
    };
    // O idioma pode mudar com a tela aberta: atualiza o texto quando as Configurações abrem.
    var dlg = document.getElementById("settings-dialog");
    if (dlg) new MutationObserver(atualizar).observe(dlg, { attributes: true, attributeFilter: ["open"] });
  }

  function primeiroToque() {
    removeEventListener("pointerdown", primeiroToque, true);
    removeEventListener("keydown", primeiroToque, true);
    comecar();
  }

  addEventListener("pointerdown", primeiroToque, true);
  addEventListener("keydown", primeiroToque, true);
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) parar();
    else if (ctx) comecar();
  });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", colocarNasConfiguracoes);
  else colocarNasConfiguracoes();

  window.gameziMusica = { comecar: comecar, parar: parar, ligada: ligada, volume: volume, trilha: trilha };
})();
