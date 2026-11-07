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
    { id: "tempestade", nome: { pt: "Tempestade", en: "Tempest", es: "Tempestad" } },
    { id: "meianoite", nome: { pt: "Meia-Noite", en: "Midnight", es: "Medianoche" } },
  ];
  // "Meia-Noite": jazz ORIGINAL de clube, gostoso de ouvir (o dono pediu "um jazzinho com os de sopro"): swing, baixo
  // andando, prato de condução, piano comping e sopros (sax e trompete) fazendo frases com respiração; às vezes os dois
  // juntos, em terças, no "tema" (um motivo da seção que volta). Progressões ii-V-I comuns; tudo sorteado na hora.
  var JZ_BPM = 116;
  var JZ_TONS = [53, 55, 51, 58, 48]; // Fá, Sol, Mi♭, Si♭, Dó
  var JZ_TIPOS = {
    m7: { notas: [0, 3, 7, 10], piano: [3, 10, 14], escala: [0, 2, 3, 5, 7, 9, 10] },
    d7: { notas: [0, 4, 7, 10], piano: [4, 10, 14], escala: [0, 2, 4, 5, 7, 9, 10] },
    maj7: { notas: [0, 4, 7, 11], piano: [4, 11, 14], escala: [0, 2, 4, 5, 7, 9, 11] },
  };
  var JZ_PROGS = [
    [[2, "m7"], [7, "d7"], [0, "maj7"], [9, "d7"]],
    [[0, "maj7"], [9, "d7"], [2, "m7"], [7, "d7"]],
    [[4, "m7"], [9, "d7"], [2, "m7"], [7, "d7"]],
    [[5, "maj7"], [4, "m7"], [2, "m7"], [7, "d7"]],
  ];
  // "Tempestade": ORIGINAL, rápida e frenética no estilo de czardas e do Presto agitato (o dono pediu "estilo Czardas e
  // Moonlight Sonata", com melodia criativa). Só piano de verdade (pianoReal; o dono não quis som eletrônico): melodia com
  // corridas, volteios e notas longas; acompanhamento em arpejos subindo em semicolcheias ou no "um-pá" do czardas. Tom
  // menor harmônico (o sabor cigano), mas a 7ª elevada só aparece no acorde V (nos outros, a 7ª natural), para não soar
  // errado; a melodia anda sem saltos de oitava (o dono achou umas sequências que não encaixavam). As notas fortes da melodia
  // são sempre do acorde; cada seção tem um motivo que volta. Melodia sorteada na hora.
  var TMP_BPM = 152;
  var TMP_TONS = [57, 50, 52, 55, 48]; // Lá, Ré, Mi, Sol, Dó (menor)
  var TMP_ESCALA = [0, 2, 3, 5, 7, 8, 11]; // menor harmônica
  var TMP_PROGS = [[0, 3, 4, 0], [0, 5, 3, 4], [0, 4, 0, 4], [5, 3, 4, 0], [0, 3, 0, 4], [3, 0, 4, 0]]; // graus (i, iv, V, VI)
  // "Varanda": ORIGINAL no estilo das faixas eletrônicas "tropicais"/chill (o dono pediu algo como "Ylang Ylang", do FKJ;
  // a música tem dono, então NADA da melodia ou do riff dela, nem transposto: só o estilo). O que faz o estilo: um riff
  // curto de 2 compassos repetido em loop (sorteado a cada seção, com variações), um vamp de 2 a 3 acordes, bumbo macio em
  // todo tempo com shaker, fundo que "bombeia" junto com o bumbo, piano elétrico com chorus e um dedilhado tipo guitarra.
  var VAR_BPM = 104;
  var VAR_TONS = [50, 51, 53, 55, 56, 46]; // Ré, Mi♭, Fá, Sol, Lá♭, Si♭ (a nota do baixo)
  // Tipos de acorde (intervalos a partir do baixo; o baixo toca a fundamental sozinho, a mão direita o resto).
  var VAR_TIPOS = { m9: [10, 14, 15, 19], maj9: [11, 14, 16, 19], m7: [7, 10, 15, 19], maj7: [7, 11, 16, 19], sus: [7, 10, 14, 17] };
  // Vamps comuns no gênero (graus a partir da tônica, em semitons, com o tipo), cada acorde dura 2 compassos.
  var VAR_VAMPS = [
    [[9, "m9"], [5, "maj7"]],
    [[2, "m9"], [7, "sus"]],
    [[0, "maj9"], [9, "m7"], [5, "maj9"]],
    [[9, "m7"], [7, "sus"], [5, "maj7"]],
    [[5, "maj9"], [0, "maj7"]],
  ];
  // Lugares do riff dentro de 2 compassos (semicolcheias): sincopados, como no gênero.
  var VAR_LUGARES = [0, 3, 6, 8, 10, 11, 14, 16, 19, 22, 24, 26, 27, 30];
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

  // Acerto de volume de cada faixa, para todas soarem mais ou menos iguais ao trocar (medido no pico de cada uma).
  var AJUSTE_FAIXA = { normal: 1, especial: 0.6, varanda: 0.34, tempestade: 0.32, meianoite: 0.36 };
  var ajuste = null;
  var ctx = null, saida = null, eco = null, timer = null, passo = 0, proximo = 0, tocando = false;
  var esp = null; // trecho da trilha especial que está tocando (ou null na pausa / antes de começar)
  var espPausa = 0;
  var tp = null; // seção da "Tempestade"
  var jz = null; // refrão da "Meia-Noite"
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

  // Um segundo de ruído branco (bateria, prato e o ar dos sopros), feito uma vez só.
  function pegarRuido() {
    if (ruido) return;
    ruido = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    var d = ruido.getChannelData(0);
    for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
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
    pegarRuido();
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

  // Dedilhado tipo guitarra: dente de serra num filtro que fecha rápido (o "ploc" da corda) e some logo.
  function corda(n, quando, vol) {
    var f = hz(n);
    var o = ctx.createOscillator(), o2 = ctx.createOscillator(), filtro = ctx.createBiquadFilter(), g = ctx.createGain();
    o.type = "sawtooth";
    o2.type = "triangle";
    o.frequency.value = f;
    o2.frequency.value = f;
    o2.detune.value = 7;
    filtro.type = "lowpass";
    filtro.Q.value = 2;
    filtro.frequency.setValueAtTime(f * 7, quando);
    filtro.frequency.exponentialRampToValueAtTime(f * 1.3, quando + 0.25);
    g.gain.setValueAtTime(0.0001, quando);
    g.gain.exponentialRampToValueAtTime(vol, quando + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, quando + 0.9);
    o.connect(filtro);
    o2.connect(filtro);
    filtro.connect(g);
    g.connect(saida);
    if (eco) {
      var mol = ctx.createGain();
      mol.gain.value = 0.3;
      g.connect(mol);
      mol.connect(eco);
    }
    [o, o2].forEach(function (x) { x.start(quando); x.stop(quando + 0.95); });
  }

  // Fundo que "bombeia": o acorde inteiro, longo, que abaixa a cada bumbo e volta logo depois.
  function fundoBombeando(notas, quando, tempos) {
    var b = 60 / VAR_BPM;
    var g = ctx.createGain(), filtro = ctx.createBiquadFilter();
    filtro.type = "lowpass";
    filtro.frequency.value = 1500;
    g.gain.setValueAtTime(0.0001, quando);
    for (var t = 0; t < tempos; t++) {
      var q = quando + t * b;
      g.gain.setValueAtTime(0.004, q);
      g.gain.linearRampToValueAtTime(0.018, q + b * 0.6);
    }
    g.gain.linearRampToValueAtTime(0.0001, quando + tempos * b);
    filtro.connect(g);
    g.connect(saida);
    notas.forEach(function (n, k) {
      [-8, 8].forEach(function (d) {
        var o = ctx.createOscillator();
        o.type = "sawtooth";
        o.frequency.value = hz(n);
        o.detune.value = d + k;
        var a = ctx.createGain();
        a.gain.value = 0.25;
        o.connect(a);
        a.connect(filtro);
        o.start(quando);
        o.stop(quando + tempos * b + 0.05);
      });
    });
  }

  // Sorteia uma seção: tom, vamp, o ritmo do piano e do baixo e um riff ORIGINAL de 2 compassos. O riff é guardado
  // como "qual nota do acorde" (0 = a mais grave … 5), não como nota fixa: assim ele acompanha cada acorde do vamp e
  // nunca bate com a harmonia (o dono achou umas notas aleatórias soltas em cima de uma nota só de base).
  function novaSecao() {
    var lugares = VAR_LUGARES.slice(), riff = {};
    var tam = 5 + Math.floor(Math.random() * 3), idx = 2 + Math.floor(Math.random() * 2);
    var escolhidos = [];
    while (escolhidos.length < tam) escolhidos.push(lugares.splice(Math.floor(Math.random() * lugares.length), 1)[0]);
    escolhidos.sort(function (a, b) { return a - b; }).forEach(function (l) {
      riff[l] = idx;
      idx = Math.max(0, Math.min(6, idx + sorte([-2, -1, -1, 1, 1, 2])));
    });
    return {
      tom: sorte(VAR_TONS),
      vamp: sorte(VAR_VAMPS),
      riff: riff,
      variacao: null,
      piano: sorte([[0, 6, 10], [2, 6, 11, 14], [0, 3, 8, 11], [3, 6, 10, 14]]), // onde o piano bate o acorde
      baixo: sorte([[[0, 3], [6, 0], [10, 7]], [[0, 4], [7, 12], [10, 0]], [[0, 2], [3, 0], [8, 7], [11, 0]]]), // [lugar, intervalo]
    };
  }

  // Uma semicolcheia da "Varanda". As semicolcheias "de trás" saem um pouco atrasadas (balanço).
  function tocarVaranda(i, quando) {
    var sc = 60 / VAR_BPM / 4;
    var k = i % 16; // posição no compasso
    var compasso = Math.floor(i / 16);
    var dois = i % 32; // posição dentro do riff de 2 compassos
    if (k % 2 === 1) quando += sc * 0.18;
    // Seção nova a cada 16 compassos; a primeira começa só com o riff e o fundo (a bateria entra no 3º compasso).
    if (!vr || (i % (16 * 16) === 0 && i > 0)) vr = novaSecao();
    var naSecao = compasso % 16;
    var ac = vr.vamp[Math.floor(naSecao / 2) % vr.vamp.length];
    var raiz = vr.tom + ac[0];
    if (raiz > 55) raiz -= 12;
    var mao = VAR_TIPOS[ac[1]].map(function (x) { return raiz + 12 + x - (raiz + 12 + x > 79 ? 12 : 0); });
    var solto = function () { return (Math.random() - 0.5) * 0.015; };
    var comBateria = naSecao >= 2 && !(naSecao === 15 && k >= 8);
    // Notas do acorde da mão direita, de baixo para cima, em duas oitavas (o riff escolhe por posição).
    var arpejo = mao.slice().sort(function (a, b) { return a - b; });
    arpejo = arpejo.concat(arpejo.map(function (n) { return n + 12; }));
    // Fundo bombeando, bem baixinho por trás: o acorde do vamp, 2 compassos de cada vez.
    if (dois === 0) fundoBombeando(mao.slice(0, 3), quando, 8);
    // Bateria: bumbo macio em todo tempo, palma/aro no 2 e no 4, shaker nas semicolcheias (mais forte no contratempo).
    if (comBateria) {
      if (k % 4 === 0) bateria("bumbo", quando, 0.42);
      if (k === 4 || k === 12) bateria("caixa", quando + 0.01, 0.13);
      bateria("chimbal", quando, k % 4 === 2 ? 0.045 : 0.018);
    }
    // Baixo: o mesmo desenho a seção inteira (fundamental, quinta e oitava), desde o 3º compasso.
    if (naSecao >= 2) vr.baixo.forEach(function (b) {
      if (b[0] === k) baixo(raiz - 12 + b[1], quando, sc * 2.5, b[1] === 0 ? 0.2 : 0.15);
    });
    // Piano elétrico com chorus: o acorde inteiro, sempre no mesmo ritmo da seção, desde o começo (é ele que dá a harmonia).
    if (vr.piano.indexOf(k) >= 0) {
      mao.forEach(function (n) {
        rhodes(n, quando + solto(), 0.032, sc * 4);
        rhodes(n + 0.08, quando + 0.012 + solto(), 0.02, sc * 4);
      });
    }
    // O riff: 2 compassos em loop, sempre com notas do acorde da vez. A cada 4 repetições, uma variação.
    if (dois === 0) {
      vr.variacao = null;
      if (Math.floor(naSecao / 2) % 4 === 3) {
        var l = sorte(Object.keys(vr.riff));
        vr.variacao = { lugar: Number(l), idx: Math.max(0, Math.min(6, vr.riff[l] + sorte([-1, 1]))) };
      }
    }
    var idx = vr.riff[dois];
    if (vr.variacao && vr.variacao.lugar === dois) idx = vr.variacao.idx;
    if (idx !== undefined) {
      var n = arpejo[Math.min(idx, arpejo.length - 1)] + 12;
      while (n > 86) n -= 12;
      corda(n, quando + solto(), 0.08);
    }
  }

  // Piano de verdade: soma de harmônicos de corda (um pouquinho mais agudos que o exato, como numa corda de aço), os
  // agudos morrendo antes dos graves, duas cordas levemente desafinadas por nota e o "toc" do martelo no começo.
  function pianoReal(n, quando, vol, dur) {
    var f = hz(n);
    var B = 0.0003; // quanto os harmônicos sobem (inarmonicidade da corda)
    var brilho = Math.min(1, 0.5 + vol * 4);
    var g = ctx.createGain(), filtro = ctx.createBiquadFilter();
    filtro.type = "lowpass";
    filtro.frequency.setValueAtTime(Math.min(9000, f * 10 * brilho), quando);
    filtro.frequency.exponentialRampToValueAtTime(Math.min(4000, f * 3.5), quando + 0.4);
    g.gain.value = vol;
    filtro.connect(g);
    g.connect(saida);
    if (eco) {
      var mol = ctx.createGain();
      mol.gain.value = 0.22;
      g.connect(mol);
      mol.connect(eco);
    }
    var fim = quando + dur + 0.3;
    for (var h = 1; h <= 7; h++) {
      var fh = h * f * Math.sqrt(1 + B * h * h);
      if (fh > 12000) break;
      var amp = 1 / Math.pow(h, 1.4);
      var queda = dur / (1 + 0.35 * (h - 1)); // agudos morrem antes
      (h <= 2 ? [-1.2, 1.2] : [0]).forEach(function (des) {
        var o = ctx.createOscillator(), a = ctx.createGain();
        o.type = "sine";
        o.frequency.value = fh;
        o.detune.value = des;
        a.gain.setValueAtTime(0.0001, quando);
        a.gain.exponentialRampToValueAtTime(amp * (h <= 2 ? 0.5 : 1), quando + 0.004);
        a.gain.exponentialRampToValueAtTime(amp * 0.35, quando + 0.08 + queda * 0.15);
        a.gain.exponentialRampToValueAtTime(0.0001, quando + queda + 0.2);
        o.connect(a);
        a.connect(filtro);
        o.start(quando);
        o.stop(fim);
      });
    }
    // Martelo: um "toc" curtinho e abafado.
    pegarRuido();
    var r = ctx.createBufferSource(), rf = ctx.createBiquadFilter(), rg = ctx.createGain();
    r.buffer = ruido;
    rf.type = "bandpass";
    rf.frequency.value = Math.min(3000, f * 2);
    rf.Q.value = 1;
    rg.gain.setValueAtTime(0.08, quando);
    rg.gain.exponentialRampToValueAtTime(0.0001, quando + 0.025);
    r.connect(rf);
    rf.connect(rg);
    rg.connect(g);
    r.start(quando, Math.random() * 0.8);
    r.stop(quando + 0.03);
  }

  // Trompete mais natural (o dono achou o antigo artificial e pediu para não ficar estridente): a nota "escorrega"
  // de baixo para a afinação no começo (os lábios), entra devagarinho, e o brilho acompanha a força do sopro — abre no
  // ataque e fecha um pouco depois, sem ressonância no filtro e com um segundo filtro que corta o agudo que fere.
  function trompete(n, quando, dur, vol) {
    var f = hz(n);
    var o = ctx.createOscillator(), o2 = ctx.createOscillator();
    var f1 = ctx.createBiquadFilter(), f2 = ctx.createBiquadFilter(), g = ctx.createGain();
    var lfo = ctx.createOscillator(), lg = ctx.createGain();
    o.type = "sawtooth";
    o2.type = "triangle";
    [o, o2].forEach(function (x) {
      x.frequency.setValueAtTime(f * 0.97, quando);
      x.frequency.exponentialRampToValueAtTime(f, quando + 0.045);
    });
    o2.detune.value = -4;
    lfo.frequency.value = 5.2;
    lg.gain.setValueAtTime(0, quando);
    lg.gain.setValueAtTime(0, quando + Math.min(0.25, dur * 0.4));
    lg.gain.linearRampToValueAtTime(dur > 0.45 ? 9 : 2, quando + dur);
    lfo.connect(lg);
    lg.connect(o.detune);
    lg.connect(o2.detune);
    f1.type = "lowpass";
    f1.Q.value = 0.5;
    var topo = Math.min(2300, f * 4.5);
    f1.frequency.setValueAtTime(f * 1.3, quando);
    f1.frequency.exponentialRampToValueAtTime(topo, quando + 0.06);
    f1.frequency.exponentialRampToValueAtTime(Math.min(1700, f * 3), quando + Math.max(0.1, dur * 0.7));
    f2.type = "lowpass";
    f2.frequency.value = 3200;
    f2.Q.value = 0.3;
    var mix = ctx.createGain();
    mix.gain.value = 0.6;
    o2.connect(mix);
    g.gain.setValueAtTime(0.0001, quando);
    g.gain.exponentialRampToValueAtTime(vol, quando + 0.05);
    g.gain.setValueAtTime(vol * 0.85, quando + Math.max(0.06, dur - 0.05));
    g.gain.exponentialRampToValueAtTime(0.0001, quando + dur + 0.1);
    o.connect(f1);
    mix.connect(f1);
    f1.connect(f2);
    f2.connect(g);
    g.connect(saida);
    if (eco) {
      var mol = ctx.createGain();
      mol.gain.value = 0.3;
      g.connect(mol);
      mol.connect(eco);
    }
    [o, o2, lfo].forEach(function (x) { x.start(quando); x.stop(quando + dur + 0.15); });
  }

  // Sopro: o sax (o trompete tem função própria, logo acima). Filtro que abre no ataque, sopro de ar no começo e vibrato
  // que só aparece no fim das notas longas.
  function sopro(n, quando, dur, vol, instr) {
    if (instr === "trompete") return trompete(n, quando, dur, vol * 0.85);
    var f = hz(n);
    var o = ctx.createOscillator(), o2 = ctx.createOscillator(), filtro = ctx.createBiquadFilter(), g = ctx.createGain();
    var lfo = ctx.createOscillator(), lg = ctx.createGain();
    o.type = "sawtooth";
    o2.type = "square";
    o.frequency.value = f;
    o2.frequency.value = f;
    o2.detune.value = 5;
    lfo.frequency.value = 5;
    lg.gain.setValueAtTime(0, quando);
    lg.gain.setValueAtTime(0, quando + dur * 0.5);
    lg.gain.linearRampToValueAtTime(dur > 0.5 ? 14 : 0, quando + dur);
    lfo.connect(lg);
    lg.connect(o.detune);
    lg.connect(o2.detune);
    filtro.type = "lowpass";
    filtro.Q.value = 1.5;
    var aberto = Math.min(2600, f * 4);
    filtro.frequency.setValueAtTime(f * 1.2, quando);
    filtro.frequency.exponentialRampToValueAtTime(aberto, quando + 0.05);
    filtro.frequency.exponentialRampToValueAtTime(aberto * 0.6, quando + dur);
    var mix = ctx.createGain();
    mix.gain.value = 0.35;
    o2.connect(mix);
    g.gain.setValueAtTime(0.0001, quando);
    g.gain.exponentialRampToValueAtTime(vol, quando + 0.03);
    g.gain.setValueAtTime(vol * 0.8, quando + Math.max(0.04, dur - 0.04));
    g.gain.exponentialRampToValueAtTime(0.0001, quando + dur + 0.08);
    o.connect(filtro);
    mix.connect(filtro);
    filtro.connect(g);
    g.connect(saida);
    if (eco) {
      var mol = ctx.createGain();
      mol.gain.value = 0.3;
      g.connect(mol);
      mol.connect(eco);
    }
    [o, o2, lfo].forEach(function (x) { x.start(quando); x.stop(quando + dur + 0.12); });
    // O ar do sopro no começo da nota.
    pegarRuido();
    var r = ctx.createBufferSource(), rf = ctx.createBiquadFilter(), rg = ctx.createGain();
    r.buffer = ruido;
    rf.type = "bandpass";
    rf.frequency.value = f * 3;
    rg.gain.setValueAtTime(vol * 0.25, quando);
    rg.gain.exponentialRampToValueAtTime(0.0001, quando + 0.06);
    r.connect(rf);
    rf.connect(rg);
    rg.connect(saida);
    r.start(quando, Math.random() * 0.8);
    r.stop(quando + 0.08);
  }

  // Baixo acústico (contrabaixo): corpo grave, ataque de dedo e som que morre rápido.
  function contrabaixo(n, quando, dur) {
    var o = ctx.createOscillator(), filtro = ctx.createBiquadFilter(), g = ctx.createGain();
    o.type = "triangle";
    o.frequency.value = hz(n);
    filtro.type = "lowpass";
    filtro.frequency.setValueAtTime(900, quando);
    filtro.frequency.exponentialRampToValueAtTime(350, quando + 0.15);
    g.gain.setValueAtTime(0.0001, quando);
    g.gain.exponentialRampToValueAtTime(0.28, quando + 0.01);
    g.gain.exponentialRampToValueAtTime(0.08, quando + dur * 0.8);
    g.gain.exponentialRampToValueAtTime(0.0001, quando + dur);
    o.connect(filtro);
    filtro.connect(g);
    g.connect(saida);
    o.start(quando);
    o.stop(quando + dur + 0.05);
  }

  // Prato de condução: ruído agudo com um "ding" metálico.
  function prato(quando, vol) {
    pegarRuido();
    var r = ctx.createBufferSource(), filtro = ctx.createBiquadFilter(), g = ctx.createGain();
    r.buffer = ruido;
    filtro.type = "bandpass";
    filtro.frequency.value = 6500;
    filtro.Q.value = 0.8;
    g.gain.setValueAtTime(vol, quando);
    g.gain.exponentialRampToValueAtTime(0.0001, quando + 0.45);
    r.connect(filtro);
    filtro.connect(g);
    g.connect(saida);
    r.start(quando, Math.random() * 0.5);
    r.stop(quando + 0.5);
  }

  // Acorde da "Meia-Noite" no compasso c do refrão: [nota MIDI do baixo, tipo].
  function jzAcorde(c) {
    var a = jz.prog[c % 4];
    return { raiz: jz.tom + a[0], tipo: JZ_TIPOS[a[1]] };
  }

  // Nota da escala do acorde mais perto de n (ou só das notas do acorde, se soAcorde).
  function jzPerto(n, ac, soAcorde) {
    var lista = soAcorde ? ac.tipo.notas : ac.tipo.escala, melhor = n, dist = 99;
    for (var o = -2; o <= 3; o++) lista.forEach(function (x) {
      var m = ac.raiz + x + 12 * o;
      if (Math.abs(m - n) < dist) { dist = Math.abs(m - n); melhor = m; }
    });
    return melhor;
  }

  // Refrão novo (8 compassos): tom, progressão (2 vezes), quem sola e se é "tema" (sopros juntos com motivo que volta).
  function jzRefrao() {
    var motivo = [], t = 0;
    while (t < 8) {
      var len = sorte([1, 1, 1, 2, 2, 3]);
      motivo.push({ t: t, passo: sorte([-2, -1, 1, 2, 3, -3, 4]), len: len, pausa: Math.random() < 0.15 });
      t += len;
    }
    return {
      tom: sorte(JZ_TONS),
      prog: sorte(JZ_PROGS),
      solista: Math.random() < 0.5 ? "sax" : "trompete",
      tema: Math.random() < 0.4,
      motivo: motivo,
      n: jz ? jz.n : 70,
      frase: 0,
      descanso: 0,
      plano: [],
    };
  }

  // Planeja as colcheias do sopro num compasso: frases com respiração; no tema, o motivo da seção.
  function jzCompasso(c) {
    var ac = jzAcorde(c), prox = jzAcorde(c + 1), notas = [];
    if (jz.tema && c % 2 === 0) {
      var n = jzPerto(jz.n, ac, true);
      jz.motivo.forEach(function (m, j) {
        if (j > 0) n = jzPerto(n + m.passo * 2, ac, m.t === 0 || m.t === 4);
        if (!m.pausa) notas.push({ t: m.t, n: n, len: m.len });
      });
      jz.n = n;
      return notas;
    }
    if (jz.tema) return notas; // no tema, o compasso de resposta fica para o piano
    for (var t = 0; t < 8; t++) {
      if (jz.descanso > 0) { jz.descanso -= 1; continue; }
      var forte = t % 2 === 0;
      var n2;
      if (t === 7) n2 = jzPerto(prox.raiz + sorte([4, 3, 7]), prox, true) - 1; // aproximação cromática do próximo acorde
      else n2 = jzPerto(jz.n + sorte([-2, -1, -1, 1, 1, 2, 3, -3, 4]), ac, forte);
      while (n2 > 80) n2 -= 12;
      while (n2 < 58) n2 += 12;
      var longa = forte && Math.random() < 0.12;
      notas.push({ t: t, n: n2, len: longa ? 3 : 1 });
      if (longa) t += 2;
      jz.n = n2;
      jz.frase += 1;
      if (jz.frase > 5 + Math.random() * 8) { jz.frase = 0; jz.descanso = 2 + Math.floor(Math.random() * 5); }
    }
    return notas;
  }

  // Uma colcheia da "Meia-Noite", com swing (a de trás sai no último terço do tempo).
  function tocarMeiaNoite(i, quando) {
    var b = 60 / JZ_BPM;
    var k = i % 8, compasso = Math.floor(i / 8);
    if (k % 2 === 1) quando += b / 6;
    if (!jz || (k === 0 && compasso % 8 === 0)) jz = jzRefrao();
    var c = compasso % 8;
    var ac = jzAcorde(c), prox = jzAcorde(c + 1);
    var solto = function () { return (Math.random() - 0.5) * 0.02; };
    // Bateria: condução "tching, tching-ga" no prato, chimbal no 2 e no 4, bumbo bem de leve.
    if (k % 2 === 0 || k === 3 || k === 7) prato(quando, k === 3 || k === 7 ? 0.03 : k % 4 === 2 ? 0.05 : 0.04);
    if (k === 2 || k === 6) bateria("chimbal", quando, 0.04);
    if (k % 2 === 0) bateria("bumbo", quando, 0.06);
    if (k % 2 === 1 && Math.random() < 0.12) bateria("caixa", quando, 0.03);
    // Baixo andando: 1 nota por tempo (fundamental, notas do acorde e aproximação cromática no 4º tempo).
    if (k % 2 === 0) {
      var tempo = k / 2, nb;
      if (tempo === 0) nb = ac.raiz - 12;
      else if (tempo === 3) nb = prox.raiz - 12 + sorte([-1, 1]);
      else nb = ac.raiz - 12 + ac.tipo.notas[1 + Math.floor(Math.random() * 3)] - (Math.random() < 0.4 ? 12 : 0);
      while (nb < 33) nb += 12;
      contrabaixo(nb, quando, b * 0.95);
    }
    // Piano comping: acorde sem fundamental em lugares sincopados.
    if ((k === 1 && Math.random() < 0.4) || (k === 3 && Math.random() < 0.6) || (k === 6 && Math.random() < 0.4)) {
      ac.tipo.piano.forEach(function (x) { piano(ac.raiz + x, quando + solto(), 0.045, b * 1.2); });
    }
    // Sopros
    if (k === 0) jz.plano = jzCompasso(c);
    jz.plano.forEach(function (nn) {
      if (nn.t !== k) return;
      var dur = nn.len * b / 2 * 0.95;
      sopro(nn.n, quando + solto(), dur, 0.07, jz.tema ? "sax" : jz.solista);
      if (jz.tema) sopro(jzPerto(nn.n - 4, ac, true), quando + solto(), dur, 0.05, "trompete"); // a segunda voz, uma terça abaixo
    });
  }

  function agendar() {
    var t = trilha();
    var especial = t === "especial";
    var passoDur = especial ? 60 / ESP_BPM : t === "varanda" ? 60 / VAR_BPM / 4 : t === "tempestade" ? 60 / TMP_BPM / 4 : t === "meianoite" ? 60 / JZ_BPM / 2 : 60 / BPM / 2;
    while (proximo < ctx.currentTime + 0.25) {
      if (especial) tocarEspecial(passo, proximo);
      else if (t === "varanda") tocarVaranda(passo, proximo);
      else if (t === "tempestade") tocarTempestade(passo, proximo);
      else if (t === "meianoite") tocarMeiaNoite(passo, proximo);
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
    tp = null;
    jz = null;
    if (ctx) proximo = ctx.currentTime + 0.3;
    if (ajuste) ajuste.gain.setTargetAtTime(AJUSTE_FAIXA[trilha()], ctx.currentTime, 0.1);
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
        ajuste = ctx.createGain();
        ajuste.gain.value = AJUSTE_FAIXA[trilha()];
        saida.connect(ajuste);
        ajuste.connect(ctx.destination);
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
