// Música de fundo do Gamezi, igual em todos os jogos: feita na hora pelo navegador (Web Audio), sem arquivo de áudio.
// Uma base calma (acordes, baixo e um dedilhado) que dá a volta a cada 8 compassos, baixinha para não atrapalhar.
// Liga e desliga em Configurações (a linha "Música" entra sozinha no #settings-dialog); fica guardado em tt:musica,
// o mesmo para todos os jogos. Logo abaixo, a linha "Volume" (de 0 a 100, em tt:musica-volume): o dono pediu uma
// margem bem grande, então vai do silêncio a bem alto (o 100 é umas 14 vezes o volume de antes). Os navegadores só deixam tocar som depois do primeiro toque na tela, então ela começa aí.
// Para quando a aba fica escondida.
// Faixas: a setinha da linha "Música" abre a lista (FAIXAS; a escolhida fica em tt:musica-trilha). "Padrão" é a de
// cima. "Entardecer" (id "especial"): outra trilha, original, no ESTILO das trilhas ambientes de jogo
// (o dono pediu "o mais perto do C418 sem burlar direitos"): piano abafado com muito eco, tempo solto, pequenos motivos que
// voltam com variação, um fundo suave e pausas longas entre os trechos. Tudo sorteado na hora (tom, acordes, motivo),
// nunca repete igual; nenhuma melodia ou sequência de acordes de música existente — copiar isso não pode.

(function () {
  var CHAVE = "tt:musica";
  var CHAVE_VOLUME = "tt:musica-volume";
  var TEXTO = { pt: "Música", en: "Music", es: "Música" };
  var TEXTO_VOLUME = { pt: "Volume", en: "Volume", es: "Volumen" };
  var BPM = 84;
  var CHAVE_TRILHA = "tt:musica-trilha";
  // Faixas que a pessoa escolhe na setinha da linha "Música". O id "especial" é o da trilha "Entardecer" (nome antigo,
  // mantido para quem já tinha escolhido). Faixa nova: um item aqui e o caso dela em agendar().
  var FAIXAS = [
    { id: "normal", nome: { pt: "Padrão", en: "Default", es: "Predeterminada" } },
    { id: "especial", nome: { pt: "Entardecer", en: "Dusk", es: "Atardecer" } },
    { id: "varanda", nome: { pt: "Varanda", en: "Porch", es: "Terraza" } },
  ];
  // "Varanda": ORIGINAL no estilo neo-soul/lo-fi (o dono pediu "no estilo de Ylang Ylang", do FKJ; a música tem dono,
  // então só o estilo: piano elétrico, acordes de 9ª e 13ª, baixo macio, bateria leve com balanço, frases curtas).
  // Anda de semicolcheia em semicolcheia; cada acorde dura um compasso; tom e sequência sorteados a cada 8 compassos.
  var VAR_BPM = 88;
  var VAR_TONS = [50, 51, 53, 55, 56, 46]; // Ré, Mi♭, Fá, Sol, Lá♭, Si♭ (a nota do baixo)
  // Tipos de acorde (intervalos a partir do baixo; o baixo toca a fundamental sozinho, a mão direita o resto).
  var VAR_TIPOS = { m9: [10, 14, 15, 19], maj9: [11, 14, 16, 19], d13: [10, 16, 21, 26], m11: [10, 15, 17, 22] };
  // Caminhos de acordes comuns no gênero (graus a partir da tônica, em semitons, com o tipo de cada um).
  var VAR_CAMINHOS = [
    [[2, "m9"], [7, "d13"], [0, "maj9"], [9, "m9"]],
    [[5, "maj9"], [4, "m9"], [9, "m11"], [2, "m9"]],
    [[9, "m9"], [2, "m11"], [7, "d13"], [0, "maj9"]],
    [[0, "maj9"], [5, "maj9"], [4, "m9"], [9, "m9"]],
    [[2, "m11"], [5, "maj9"], [9, "m9"], [7, "d13"]],
  ];
  var VAR_PENTA = [0, 2, 4, 7, 9]; // frases do piano: pentatônica maior do tom
  var TEXTO_FAIXAS = { pt: "Escolher a faixa", en: "Choose the track", es: "Elegir la pista" };
  var VOLUME_PADRAO = 26; // na escala de 0 a 100; dá o volume de antes (0,07)
  // Trilha especial: um tempo a cada ~1,1 s; cada acorde dura 4 tempos; cada trecho tem de 4 a 8 acordes, termina na
  // tônica (o último acorde soa mais) e depois vem uma pausa curta de 2 a 4 tempos com uma nota de fundo (o dono achou
  // o silêncio longo e o começo/fim secos). Tom maior sorteado a cada trecho; acordes com sétima e nona, abertos.
  var ESP_BPM = 54;
  var ESP_TONS = [48, 50, 53, 55, 45, 52]; // Dó, Ré, Fá, Sol, Lá, Mi (a nota do baixo)
  var ESP_ESCALA = [0, 2, 4, 5, 7, 9, 11]; // escala maior
  // Para onde cada grau costuma ir (harmonia comum de qualquer música tranquila, sem copiar nenhuma).
  var ESP_CAMINHOS = { 0: [3, 5, 3, 1], 1: [4, 3, 0], 2: [5, 3], 3: [0, 4, 5, 1, 0], 4: [0, 5, 3], 5: [3, 1, 2, 3] };
  // Acordes (notas MIDI): Dó, Lá menor, Fá, Sol, Mi menor, Lá menor, Ré menor, Sol.
  var ACORDES = [[60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62], [52, 55, 59], [57, 60, 64], [50, 53, 57], [55, 59, 62]];
  var DEDILHADO = [0, 1, 2, 1, 2, 1, 0, 2]; // qual nota do acorde em cada colcheia (mais uma oitava acima)

  var ctx = null, saida = null, eco = null, timer = null, passo = 0, proximo = 0, tocando = false;
  var esp = null; // trecho da trilha especial que está tocando (ou null na pausa / antes de começar)
  var espPausa = 0;
  var vr = null; // seção da "Varanda" (tom e sequência de acordes)
  var ruido = null; // um segundo de ruído branco, para a bateria

  function trilha() {
    var t = null;
    try { t = localStorage.getItem(CHAVE_TRILHA); } catch (e) { /* sem armazenamento */ }
    return FAIXAS.some(function (f) { return f.id === t; }) ? t : "normal";
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

  // Eco de sala grande (ruído que vai sumindo), só para a trilha especial.
  function criarEco() {
    var dur = 5, n = Math.floor(ctx.sampleRate * dur);
    var buf = ctx.createBuffer(2, n, ctx.sampleRate);
    for (var c = 0; c < 2; c++) {
      var d = buf.getChannelData(c);
      for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3);
    }
    var conv = ctx.createConvolver();
    conv.buffer = buf;
    var volta = ctx.createGain();
    volta.gain.value = 0.75;
    conv.connect(volta);
    volta.connect(saida);
    return conv;
  }

  function sorte(lista) {
    return lista[Math.floor(Math.random() * lista.length)];
  }

  // Nota da escala do trecho: grau (0, 1, 2… pode passar de 7) a partir da tônica, numa oitava.
  function grau(tonica, g, oitava) {
    var o = Math.floor(g / 7);
    return tonica + ESP_ESCALA[((g % 7) + 7) % 7] + 12 * (o + oitava);
  }

  // Piano abafado ("felt piano"): ataque macio, harmônicos fracos e um filtro que fecha enquanto a nota soa.
  function piano(n, quando, vol, dur) {
    var f = hz(n);
    var filtro = ctx.createBiquadFilter();
    filtro.type = "lowpass";
    filtro.Q.value = 0.3;
    filtro.frequency.setValueAtTime(Math.min(2600, f * 6), quando);
    filtro.frequency.exponentialRampToValueAtTime(Math.max(300, f * 1.5), quando + dur * 0.6);
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, quando);
    g.gain.exponentialRampToValueAtTime(vol, quando + 0.014);
    g.gain.exponentialRampToValueAtTime(vol * 0.35, quando + 0.6);
    g.gain.exponentialRampToValueAtTime(0.0001, quando + dur);
    filtro.connect(g);
    g.connect(saida);
    if (eco) g.connect(eco);
    [[1, 0, 1], [2, 2, 0.32], [3, -3, 0.1], [4, 1, 0.04]].forEach(function (h) {
      var o = ctx.createOscillator();
      var a = ctx.createGain();
      o.type = "sine";
      o.frequency.value = f * h[0];
      o.detune.value = h[1];
      a.gain.value = h[2];
      o.connect(a);
      a.connect(filtro);
      o.start(quando);
      o.stop(quando + dur + 0.05);
    });
  }

  // Fundo suave: duas notas longas que entram devagar, com um balanço leve na afinação.
  function fundo(notas, quando, dur) {
    quando = Math.max(quando, ctx.currentTime + 0.01); // entra um pouco antes do acorde, mas nunca antes de agora
    notas.forEach(function (n) {
      var o = ctx.createOscillator();
      var g = ctx.createGain();
      var lfo = ctx.createOscillator();
      var lg = ctx.createGain();
      o.type = "triangle";
      o.frequency.value = hz(n);
      lfo.frequency.value = 0.2 + Math.random() * 0.2;
      lg.gain.value = 4;
      lfo.connect(lg);
      lg.connect(o.detune);
      g.gain.setValueAtTime(0.0001, quando);
      g.gain.exponentialRampToValueAtTime(0.018, quando + dur * 0.4);
      g.gain.exponentialRampToValueAtTime(0.0001, quando + dur);
      o.connect(g);
      g.connect(saida);
      if (eco) g.connect(eco);
      o.start(quando);
      lfo.start(quando);
      o.stop(quando + dur + 0.05);
      lfo.stop(quando + dur + 0.05);
    });
  }

  // Sorteia um trecho: tom, sequência de graus (andando pelos caminhos comuns) e um motivo curto de melodia
  // (de 3 a 5 notas, em tempos soltos) que volta em quase todos os acordes, um pouco mudado.
  function novoTrecho() {
    var graus = [sorte([0, 0, 3, 5])];
    var n = 4 + Math.floor(Math.random() * 4);
    while (graus.length < n) graus.push(sorte(ESP_CAMINHOS[graus[graus.length - 1]]));
    if (graus[graus.length - 1] !== 0) graus.push(0); // o trecho sempre termina "em casa", para não acabar no ar
    var motivo = [], g = sorte([2, 4, 4, 7]), t = Math.random() < 0.5 ? 0 : 0.5;
    var tam = 3 + Math.floor(Math.random() * 3);
    for (var k = 0; k < tam && t < 3.6; k++) {
      motivo.push({ g: g, t: t });
      g += sorte([-2, -1, -1, 1, 1, 2, 3, -3]);
      g = Math.max(0, Math.min(11, g));
      t += sorte([0.5, 1, 1, 1.5]);
    }
    return { tonica: sorte(ESP_TONS), graus: graus, motivo: motivo, comFundo: Math.random() < 0.6, batida: 0, variar: 0 };
  }

  // Um tempo da trilha especial (rubato: cada nota sai um tiquinho antes ou depois).
  function tocarEspecial(i, quando) {
    var tempo = 60 / ESP_BPM;
    var solto = function () { return (Math.random() - 0.5) * 0.08; };
    if (!esp) {
      if (espPausa > 0) { espPausa -= 1; return; }
      esp = novoTrecho();
    }
    var b = esp.batida;
    var c = Math.floor(b / 4);
    if (c >= esp.graus.length) {
      // Pausa curta (2 a 4 tempos) com uma nota de fundo segurando o tom: nada de silêncio seco entre os trechos.
      espPausa = 2 + Math.floor(Math.random() * 3);
      fundo([grau(esp.tonica, 0, 1), grau(esp.tonica, 4, 1)], quando - tempo * 0.5, tempo * (espPausa + 4));
      esp = null;
      return;
    }
    var gr = esp.graus[c], ton = esp.tonica;
    var primeiro = c === 0, ultimo = c === esp.graus.length - 1;
    if (b % 4 === 0) {
      // Acorde aberto: baixo, quinta, sétima ou nona, e a terça uma oitava acima; dedilhado devagar ou junto.
      var notas = [grau(ton, gr, 0), grau(ton, gr + 4, 0), grau(ton, gr + sorte([6, 8]), 0), grau(ton, gr + 2, 1)];
      var dedilha = Math.random() < 0.6;
      notas.forEach(function (n, k) {
        // O primeiro acorde entra mais baixinho; o último soa mais tempo, morrendo devagar.
        var vol = (k === 0 ? 0.1 : 0.05 + Math.random() * 0.02) * (primeiro ? 0.7 : 1);
        piano(n, quando + (dedilha || ultimo ? k * (0.16 + Math.random() * 0.08) : 0) + solto(), vol, ultimo ? 10 : 7);
      });
      if (esp.comFundo || primeiro || ultimo) fundo([grau(ton, gr, 1), grau(ton, gr + 4, 1)], quando - (primeiro ? tempo : 0), tempo * (ultimo ? 6 : 4.5));
      // Em ~1 de cada 4 acordes a melodia descansa; nos outros, o motivo volta (às vezes com uma nota mudada).
      esp.semMelodia = Math.random() < 0.25 || primeiro;
      esp.variar = Math.random() < 0.45 ? 1 + Math.floor(Math.random() * esp.motivo.length) : 0;
    }
    if (!esp.semMelodia) {
      var dentro = b % 4;
      esp.motivo.forEach(function (m, k) {
        if (m.t < dentro || m.t >= dentro + 1) return;
        var g = m.g + (esp.variar === k + 1 ? sorte([-1, 1, 2]) : 0);
        piano(grau(ton, g, ton >= 50 ? 1 : 2), quando + (m.t - dentro) * tempo + solto(), 0.055 + Math.random() * 0.025, 5);
      });
    }
    esp.batida += 1;
  }

  // Uma colcheia: dedilhado sempre; no começo do compasso, o acorde (suave) e o baixo.
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

  // Piano elétrico: síntese FM simples (o "plim" do martelo que some rápido) com um tremolo leve.
  function rhodes(n, quando, vol, dur) {
    var f = hz(n);
    var c = ctx.createOscillator(), m = ctx.createOscillator(), mg = ctx.createGain(), g = ctx.createGain();
    c.type = "sine";
    m.type = "sine";
    c.frequency.value = f;
    m.frequency.value = f;
    mg.gain.setValueAtTime(f * 1.4, quando);
    mg.gain.exponentialRampToValueAtTime(f * 0.08, quando + 0.4);
    m.connect(mg);
    mg.connect(c.frequency);
    g.gain.setValueAtTime(0.0001, quando);
    g.gain.exponentialRampToValueAtTime(vol, quando + 0.006);
    g.gain.exponentialRampToValueAtTime(vol * 0.45, quando + 0.35);
    g.gain.exponentialRampToValueAtTime(0.0001, quando + dur);
    var filtro = ctx.createBiquadFilter();
    filtro.type = "lowpass";
    filtro.frequency.value = 2400;
    c.connect(filtro);
    filtro.connect(g);
    g.connect(saida);
    if (eco) {
      var mol = ctx.createGain();
      mol.gain.value = 0.35;
      g.connect(mol);
      mol.connect(eco);
    }
    c.start(quando);
    m.start(quando);
    c.stop(quando + dur + 0.05);
    m.stop(quando + dur + 0.05);
  }

  function baixo(n, quando, dur, vol) {
    var o = ctx.createOscillator(), g = ctx.createGain(), filtro = ctx.createBiquadFilter();
    o.type = "triangle";
    o.frequency.value = hz(n);
    filtro.type = "lowpass";
    filtro.frequency.value = 500;
    g.gain.setValueAtTime(0.0001, quando);
    g.gain.exponentialRampToValueAtTime(vol, quando + 0.02);
    g.gain.exponentialRampToValueAtTime(vol * 0.6, quando + dur * 0.7);
    g.gain.exponentialRampToValueAtTime(0.0001, quando + dur);
    o.connect(filtro);
    filtro.connect(g);
    g.connect(saida);
    o.start(quando);
    o.stop(quando + dur + 0.05);
  }

  // Bateria leve: bumbo (seno que cai de tom), caixa de aro e chimbal (ruído filtrado bem curto).
  function bateria(peca, quando, vol) {
    var g = ctx.createGain();
    g.connect(saida);
    if (peca === "bumbo") {
      var o = ctx.createOscillator();
      o.frequency.setValueAtTime(120, quando);
      o.frequency.exponentialRampToValueAtTime(42, quando + 0.12);
      g.gain.setValueAtTime(vol, quando);
      g.gain.exponentialRampToValueAtTime(0.0001, quando + 0.3);
      o.connect(g);
      o.start(quando);
      o.stop(quando + 0.32);
      return;
    }
    if (!ruido) {
      ruido = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      var d = ruido.getChannelData(0);
      for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    var r = ctx.createBufferSource(), filtro = ctx.createBiquadFilter();
    r.buffer = ruido;
    var curto = peca === "chimbal" ? 0.05 : 0.12;
    filtro.type = peca === "chimbal" ? "highpass" : "bandpass";
    filtro.frequency.value = peca === "chimbal" ? 7000 : 1800;
    g.gain.setValueAtTime(vol, quando);
    g.gain.exponentialRampToValueAtTime(0.0001, quando + curto);
    r.connect(filtro);
    filtro.connect(g);
    r.start(quando, Math.random() * 0.8);
    r.stop(quando + curto + 0.02);
  }

  // Uma semicolcheia da "Varanda". As semicolcheias "de trás" saem um pouco atrasadas (o balanço do gênero).
  function tocarVaranda(i, quando) {
    var sc = 60 / VAR_BPM / 4;
    var k = i % 16; // posição no compasso
    var compasso = Math.floor(i / 16);
    if (k % 2 === 1) quando += sc * 0.28;
    if (!vr || (k === 0 && compasso % 8 === 0)) {
      vr = { tom: VAR_TONS[Math.floor(Math.random() * VAR_TONS.length)], caminho: VAR_CAMINHOS[Math.floor(Math.random() * VAR_CAMINHOS.length)], frase: null };
    }
    var ac = vr.caminho[compasso % 4];
    var raiz = vr.tom + ac[0];
    if (raiz > 55) raiz -= 12;
    var mao = VAR_TIPOS[ac[1]].map(function (x) { return raiz + 12 + x - (raiz + 12 + x > 79 ? 12 : 0); });
    var solto = function () { return (Math.random() - 0.5) * 0.02; };
    // Bateria: bumbo no 1 e no "e" do 3, aro no 2 e no 4, chimbal nas colcheias (às vezes some, para respirar).
    var semBateria = compasso % 8 === 7 && k >= 8;
    if (!semBateria) {
      if (k === 0 || k === 10 || (k === 7 && Math.random() < 0.3)) bateria("bumbo", quando, 0.5);
      if (k === 4 || k === 12) bateria("caixa", quando + 0.01, 0.16);
      if (k % 2 === 0) bateria("chimbal", quando, k % 4 === 0 ? 0.05 : 0.03);
      else if (Math.random() < 0.15) bateria("chimbal", quando, 0.02);
    }
    // Baixo: fundamental no 1, notas de passagem sorteadas.
    if (k === 0) baixo(raiz - 12, quando, sc * 5, 0.22);
    if (k === 6 && Math.random() < 0.6) baixo(raiz - 12 + (Math.random() < 0.5 ? 7 : 12), quando, sc * 2, 0.15);
    if (k === 10) baixo(raiz - 12, quando, sc * 3, 0.17);
    if (k === 14 && Math.random() < 0.5) baixo(raiz - 12 + (Math.random() < 0.5 ? 10 : 5), quando, sc * 2, 0.13);
    // Acorde no piano elétrico: no 1 (às vezes um pouquinho antes), e um toque curto no "e" do 2 ou do 3.
    if (k === 0) mao.forEach(function (n, j) { rhodes(n, quando + j * 0.012 + solto(), 0.06, sc * 14); });
    if ((k === 6 || k === 11) && Math.random() < 0.55) mao.forEach(function (n) { rhodes(n, quando + solto(), 0.04, sc * 3); });
    // Frase curta: sorteada no começo de alguns compassos, de 3 a 6 notas da pentatônica, depois silêncio.
    if (k === 0) {
      vr.frase = null;
      if (compasso % 2 === 1 && Math.random() < 0.7) {
        var t = 2 + Math.floor(Math.random() * 3), notas = {}, g = Math.floor(Math.random() * 5), tam = 3 + Math.floor(Math.random() * 4);
        for (var j = 0; j < tam && t < 15; j++) {
          notas[t] = vr.tom + 24 + 12 * Math.floor(g / 5) + VAR_PENTA[((g % 5) + 5) % 5];
          g = Math.max(0, Math.min(9, g + [-2, -1, -1, 1, 1, 2][Math.floor(Math.random() * 6)]));
          t += [1, 2, 2, 3][Math.floor(Math.random() * 4)];
        }
        vr.frase = notas;
      }
    }
    if (vr.frase && vr.frase[k] !== undefined) rhodes(vr.frase[k], quando + solto(), 0.07, sc * 4);
  }

  function agendar() {
    var t = trilha();
    var especial = t === "especial";
    var passoDur = especial ? 60 / ESP_BPM : t === "varanda" ? 60 / VAR_BPM / 4 : 60 / BPM / 2;
    while (proximo < ctx.currentTime + 0.25) {
      if (especial) tocarEspecial(passo, proximo);
      else if (t === "varanda") tocarVaranda(passo, proximo);
      else tocarPasso(passo, proximo);
      passo += 1;
      proximo += passoDur;
    }
  }

  // Troca de trilha: recomeça do primeiro compasso (as notas que já soaram terminam sozinhas).
  function trocarTrilha() {
    passo = 0;
    esp = null;
    espPausa = 0;
    vr = null;
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

  // Linha "Música" nas Configurações do jogo (depois de Tema/Som): liga/desliga e uma setinha que abre a lista de faixas.
  // Logo abaixo, a linha "Volume".
  function colocarNasConfiguracoes() {
    var caixa = document.querySelector("#settings-dialog .dialog-inner");
    if (!caixa || document.getElementById("musica-btn")) return;
    var linha = document.createElement("div");
    linha.className = "setting-row";
    linha.innerHTML = '<span class="musica-nome"><span class="musica-rotulo"></span><small class="musica-atual"></small></span>' +
      '<span class="musica-botoes"><button type="button" class="icon-btn musica-seta" id="musica-faixas-btn" aria-expanded="false">' +
      '<svg class="ui-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>' +
      '</button><button type="button" class="icon-btn" id="musica-btn"></button></span>';
    caixa.appendChild(linha);
    var lista = document.createElement("div");
    lista.className = "musica-faixas";
    lista.id = "musica-faixas";
    lista.hidden = true;
    caixa.appendChild(lista);
    var linhaVol = document.createElement("div");
    linhaVol.className = "setting-row";
    linhaVol.innerHTML = '<span class="musica-rotulo"></span><span class="musica-volume"><input type="range" id="musica-volume" min="0" max="100" step="1"><output></output></span>';
    caixa.appendChild(linhaVol);
    if (!document.getElementById("musica-volume-css")) {
      var css = document.createElement("style");
      css.id = "musica-volume-css";
      css.textContent = ".musica-volume{display:flex;align-items:center;gap:8px;flex:1;max-width:220px}" +
        ".musica-volume input{flex:1;min-width:0;accent-color:var(--accent,#ff4d3d)}" +
        ".musica-volume output{min-width:2.2em;text-align:right;font-variant-numeric:tabular-nums}" +
        ".musica-nome{display:flex;flex-direction:column;gap:1px}" +
        ".musica-atual{font-size:.78rem;font-weight:600;color:var(--muted,#888)}" +
        ".musica-botoes{display:flex;gap:8px}" +
        ".musica-seta svg{transition:transform .2s}.musica-seta[aria-expanded=true] svg{transform:rotate(180deg)}" +
        ".musica-faixas{display:flex;flex-wrap:wrap;gap:8px;padding:2px 0 12px;border-bottom:1.5px solid var(--line,#ddd)}" +
        ".musica-faixa{font:inherit;font-weight:700;font-size:.9rem;padding:8px 14px;border-radius:999px;cursor:pointer;" +
        "border:1.5px solid var(--line,#ddd);background:transparent;color:inherit}" +
        ".musica-faixa[aria-pressed=true]{background:var(--fg,#1a1a1a);color:var(--bg,#fff);border-color:var(--fg,#1a1a1a)}";
      document.head.appendChild(css);
    }
    var rotulo = linha.querySelector(".musica-rotulo");
    var atual = linha.querySelector(".musica-atual");
    var seta = linha.querySelector(".musica-seta");
    var rotuloVol = linhaVol.querySelector(".musica-rotulo");
    var b = linha.querySelector("#musica-btn");
    var faixa = linhaVol.querySelector("input");
    var numero = linhaVol.querySelector("output");
    var atualizar = function () {
      var l = idioma();
      rotulo.textContent = TEXTO[l];
      var escolhida = trilha();
      atual.textContent = FAIXAS.filter(function (f) { return f.id === escolhida; })[0].nome[l];
      seta.setAttribute("aria-label", TEXTO_FAIXAS[l]);
      seta.title = TEXTO_FAIXAS[l];
      lista.innerHTML = "";
      FAIXAS.forEach(function (f) {
        var bt = document.createElement("button");
        bt.type = "button";
        bt.className = "musica-faixa";
        bt.dataset.faixa = f.id;
        bt.textContent = f.nome[l];
        bt.setAttribute("aria-pressed", f.id === escolhida ? "true" : "false");
        bt.onclick = function () {
          if (f.id !== trilha()) {
            try { localStorage.setItem(CHAVE_TRILHA, f.id); } catch (e) { /* vale só agora */ }
            trocarTrilha();
          }
          // Escolheu uma faixa com a música desligada: liga, para ouvir.
          if (!ligada()) guardar(true);
          comecar();
          atualizar();
        };
        lista.appendChild(bt);
      });
      rotuloVol.textContent = TEXTO_VOLUME[l];
      faixa.setAttribute("aria-label", TEXTO_VOLUME[l]);
      faixa.value = volume();
      numero.textContent = volume();
      linhaVol.style.opacity = ligada() ? "1" : ".55";
      desenharBotao(b);
    };
    seta.onclick = function () {
      lista.hidden = !lista.hidden;
      seta.setAttribute("aria-expanded", lista.hidden ? "false" : "true");
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
