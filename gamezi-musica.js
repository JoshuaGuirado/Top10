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
  // Onde este arquivo está (para carregar gamezi-classicas.js do mesmo lugar, de qualquer pasta de jogo).
  var BASE = (document.currentScript && document.currentScript.src || "").replace(/[^/]*$/, "");
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
    { id: "classicas", nome: { pt: "Clássicas", en: "Classical", es: "Clásicas" } },
  ];
  // "Meia-Noite": jazz ORIGINAL, simples e "escorridinho" (o dono achou a 1ª versão com cara de música de shopping):
  // balada lenta com UM sax só fazendo a melodia — notas ligadas que escorregam de uma para a outra, frases de 2
  // compassos que respiram, na forma A A' B A (a frase A volta) —, piano bem discreto, contrabaixo em 2 e vassourinha.
  // Progressões de balada comuns (ii-V-I); melodia sorteada na hora, sempre em nota do acorde nos tempos fortes.
  var JZ_BPM = 76;
  var JZ_TONS = [53, 55, 51, 58, 48]; // Fá, Sol, Mi♭, Si♭, Dó
  var JZ_TIPOS = {
    m7: { notas: [0, 3, 7, 10], piano: [3, 10, 14], escala: [0, 2, 3, 5, 7, 9, 10] },
    d7: { notas: [0, 4, 7, 10], piano: [4, 10, 14], escala: [0, 2, 4, 5, 7, 9, 10] },
    maj7: { notas: [0, 4, 7, 11], piano: [4, 11, 14], escala: [0, 2, 4, 5, 7, 9, 11] },
  };
  var JZ_PROGS = [ // 8 compassos, um acorde por compasso
    [[0, "maj7"], [9, "m7"], [2, "m7"], [7, "d7"], [4, "m7"], [9, "d7"], [2, "m7"], [7, "d7"]],
    [[2, "m7"], [7, "d7"], [0, "maj7"], [0, "maj7"], [5, "maj7"], [4, "m7"], [2, "m7"], [7, "d7"]],
    [[0, "maj7"], [5, "maj7"], [4, "m7"], [9, "d7"], [2, "m7"], [7, "d7"], [0, "maj7"], [7, "d7"]],
  ];
  // Ritmos das frases do sax (2 compassos = 16 colcheias): [colcheia de início, duração]; todas terminam com um respiro.
  var JZ_RITMOS = [
    [[0, 3], [3, 1], [4, 2], [6, 2], [8, 6]],
    [[1, 1], [2, 1], [3, 1], [4, 3], [7, 1], [8, 5]],
    [[0, 4], [4, 1], [5, 1], [6, 1], [7, 1], [8, 4]],
    [[2, 2], [4, 2], [6, 1], [7, 1], [8, 2], [10, 4]],
    [[0, 2], [2, 2], [4, 4], [9, 1], [10, 1], [11, 3]],
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
  var AJUSTE_FAIXA = { normal: 1, especial: 0.6, varanda: 0.34, tempestade: 0.32, meianoite: 0.36, classicas: 0.45 };
  // Faixa "Clássicas": músicas em DOMÍNIO PÚBLICO (gamezi-classicas.js, carregado sozinho), tocadas no piano de verdade.
  // Sorteia uma e, quando acaba, sorteia outra (nunca a mesma em seguida). É uma faixa como as outras (o dono não quis
  // aba separada nem escolher música por música).
  var cl = null; // música clássica tocando: { peca, eventos, i, t0, fim }
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

  // Grau da escala menor harmônica (pode passar de 7 ou ser negativo) → nota MIDI.
  // Com o grau do acorde (r): fora do acorde V (grau 4), a 7ª elevada vira a natural (menor natural), que encaixa nos
  // acordes i, iv e VI.
  function tmpNota(d, r) {
    var o = Math.floor(d / 7), g = ((d % 7) + 7) % 7;
    var n = tp.tom + TMP_ESCALA[g] + 12 * o;
    return g === 6 && r !== undefined && r % 7 !== 4 ? n - 1 : n;
  }

  // Nota do acorde (grau r: r, r+2, r+4 em cada oitava) mais perto do grau d.
  function tmpPerto(d, r) {
    var melhor = d, dist = 99;
    for (var x = r - 14; x <= r + 21; x += 1) {
      var m = ((x - r) % 7 + 7) % 7;
      if ((m === 0 || m === 2 || m === 4) && Math.abs(x - d) < dist) { dist = Math.abs(x - d); melhor = x; }
    }
    return melhor;
  }

  // Seção nova (8 compassos): tom, duas progressões, jeito do piano e um motivo de 1 compasso que vai voltar.
  function tmpSecao() {
    // Motivo de 1 compasso: passos curtos que vão e voltam (a soma fica entre −3 e +3 da nota de partida).
    var motivo = [], t = 0, soma = 0;
    while (t < 16) {
      var len = sorte([1, 1, 2, 2, 3, 4, 1]);
      var passoM = sorte([-2, -1, 1, 2, 3, -3, 1, -1]);
      if (Math.abs(soma + passoM) > 3) passoM = -passoM;
      if (Math.abs(soma + passoM) > 3) passoM = 0;
      if (motivo.length) soma += passoM;
      motivo.push({ t: t, d: passoM, len: len });
      t += len;
    }
    return {
      tom: sorte(TMP_TONS) + 12,
      acordes: sorte(TMP_PROGS).concat(sorte(TMP_PROGS)),
      piano: Math.random() < 0.5 ? "arpejo" : "umpa",
      motivo: motivo,
      d: 7,
      compasso: [],
    };
  }

  // Planeja a melodia de 1 compasso (16 semicolcheias): corrida, o motivo da seção ou nota longa com volteio.
  // Fora da região boa (graus 0 a 17), o compasso é refeito; depois de 4 tentativas, fica a nota longa com volteio,
  // que vai para o meio (nunca um salto de oitava no meio da frase, que soava errado).
  function tmpCompasso(r, proximo) {
    for (var tentativa = 0; tentativa < 5; tentativa++) {
      var notas = tmpCompassoTipo(r, proximo, tentativa < 4 ? sorte(["corrida", "motivo", "motivo", "longa", "corrida"]) : "longa");
      var ok = notas.every(function (nn) { return nn.d >= 0 && nn.d <= 17; });
      if (ok || tentativa === 4) {
        tp.d = notas[notas.length - 1].d;
        return notas;
      }
    }
  }

  function tmpCompassoTipo(r, proximo, tipo) {
    var notas = [], d = tmpPerto(tp.d, r);
    if (tipo === "corrida") {
      // Corrida que termina EXATAMENTE numa nota do próximo acorde na última semicolcheia; se sobra tempo, começa com
      // um volteio em volta da nota de partida. Vai para cima ou para baixo conforme o espaço que tem.
      var tamanho = sorte([5, 6, 7, 8]);
      var dir = d + tamanho + 1 > 16 ? -1 : d - tamanho - 1 < 1 ? 1 : sorte([1, -1]);
      var alvo = tmpPerto(d + dir * tamanho, proximo);
      var dist = Math.min(Math.abs(alvo - d), 15), sobra = 15 - dist, passoD = alvo >= d ? 1 : -1;
      var x = d, viz = [0, 1, 0, -1];
      for (var k = 0; k < 16; k++) {
        if (k < sobra) notas.push({ t: k, d: d + viz[k % 4], len: 1 });
        else { notas.push({ t: k, d: x, len: 1 }); x += passoD; }
      }
      notas[15].d = alvo;
      // Em cada tempo a corrida se apoia numa nota do acorde (as do meio passam pela escala).
      notas.forEach(function (nn) { if (nn.t % 4 === 0) nn.d = tmpPerto(nn.d, r); });
    } else if (tipo === "motivo") {
      // Se o motivo subindo sairia da região, ele vem espelhado (descendo): assim não precisa pular de oitava.
      var soma = 0, alto = 0, baixo = 0;
      tp.motivo.forEach(function (m, j) { if (j > 0) soma += m.d; alto = Math.max(alto, soma); baixo = Math.min(baixo, soma); });
      var espelho = d + alto + 1 > 16 || d + baixo - 1 < 1 ? -1 : 1;
      tp.motivo.forEach(function (m, j) {
        var x = j === 0 ? d : d + m.d * espelho;
        // Tempo forte e nota mais longa: sempre nota do acorde.
        if (m.t % 4 === 0 || m.len >= 2) x = tmpPerto(x, r);
        notas.push({ t: m.t, d: x, len: m.len });
        d = x;
      });
    } else {
      notas.push({ t: 0, d: d, len: 8 });
      [0, 1, 0, -1].forEach(function (v, j) { notas.push({ t: 8 + j, d: d + v, len: 1 }); }); // volteio: começa na nota do acorde
      var salto = tmpPerto(d + (d > 10 ? sorte([-2, -3, -4]) : d < 5 ? sorte([2, 3, 4]) : sorte([2, 3, -2, -3])), r);
      notas.push({ t: 12, d: salto, len: 4 });
    }
    return notas;
  }

  function tocarTempestade(i, quando) {
    var sc = 60 / TMP_BPM / 4;
    var k = i % 16, compasso = Math.floor(i / 16);
    if (!tp || (k === 0 && compasso % 8 === 0)) {
      // Seção nova (às vezes em outro tom): a melodia continua no grau do tom novo mais perto da última nota tocada.
      var ultima = tp ? tmpNota(tp.d, tp.acordes[7]) : null;
      tp = tmpSecao();
      tp.d = 7;
      if (ultima !== null) {
        var melhor = 99;
        for (var gd = 0; gd <= 17; gd++) {
          if (Math.abs(tmpNota(gd) - ultima) < melhor) { melhor = Math.abs(tmpNota(gd) - ultima); tp.d = gd; }
        }
      }
    }
    var c = compasso % 8;
    var r = tp.acordes[c], prox = tp.acordes[(c + 1) % 8];
    var acorde = [r, r + 2, r + 4];
    if (k === 0) tp.compasso = tmpCompasso(r, prox);
    // Mão esquerda
    var baixoN = tmpNota(r - 14, r);
    if (tp.piano === "arpejo") {
      // Arpejo subindo em semicolcheias a cada tempo, e um acorde batido no 2 e no 4.
      var grupo = [r - 7, r - 5, r - 3, r];
      pianoReal(tmpNota(grupo[k % 4], r), quando, k % 4 === 0 ? 0.06 : 0.04, 0.9);
      if (k === 0 || k === 8) pianoReal(baixoN, quando, 0.08, 1.6);
      if (k === 4 || k === 12) acorde.forEach(function (x) { pianoReal(tmpNota(x, r), quando, 0.04, 0.5); });
    } else {
      // "Um-pá": baixo no 1 e no 3, acorde curto no 2 e no 4 (e um toquinho no contratempo).
      if (k === 0 || k === 8) pianoReal(k === 0 ? baixoN : tmpNota(r - 10, r), quando, 0.09, 0.7);
      if (k === 4 || k === 12) acorde.forEach(function (x) { pianoReal(tmpNota(x - 7, r), quando, 0.045, 0.35); });
      if ((k === 6 || k === 14) && Math.random() < 0.6) acorde.forEach(function (x) { pianoReal(tmpNota(x - 7, r), quando, 0.025, 0.25); });
    }
    // Mão direita: a melodia, um pouco mais forte que o acompanhamento.
    tp.compasso.forEach(function (nn) {
      if (nn.t === k) pianoReal(tmpNota(nn.d, r), quando, nn.len >= 4 ? 0.1 : 0.085, Math.max(0.5, nn.len * sc * 2));
    });
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

  // Sax: dente de serra com um seno por baixo (o corpo), filtro que abre com o sopro e fecha um pouco, um segundo filtro
  // que tira o agudo que fere, ar de sopro bem baixinho durante a nota e vibrato só no fim das notas longas. Nota ligada
  // à anterior (de) escorrega da altura dela até a nova, como num sax de verdade.
  function sax(n, quando, dur, vol, de) {
    var f = hz(n);
    var o = ctx.createOscillator(), corpo = ctx.createOscillator();
    var f1 = ctx.createBiquadFilter(), f2 = ctx.createBiquadFilter(), g = ctx.createGain();
    var lfo = ctx.createOscillator(), lg = ctx.createGain();
    o.type = "sawtooth";
    corpo.type = "sine";
    [o, corpo].forEach(function (x) {
      x.frequency.setValueAtTime(de ? hz(de) : f * 0.985, quando);
      x.frequency.exponentialRampToValueAtTime(f, quando + (de ? 0.07 : 0.05));
    });
    lfo.frequency.value = 4.8;
    lg.gain.setValueAtTime(0, quando);
    lg.gain.setValueAtTime(0, quando + dur * 0.4);
    lg.gain.linearRampToValueAtTime(dur > 0.6 ? 12 : 0, quando + dur);
    lfo.connect(lg);
    lg.connect(o.detune);
    lg.connect(corpo.detune);
    f1.type = "lowpass";
    f1.Q.value = 0.8;
    f1.frequency.setValueAtTime(f * 1.5, quando);
    f1.frequency.exponentialRampToValueAtTime(Math.min(2000, f * 3.5), quando + 0.08);
    f1.frequency.exponentialRampToValueAtTime(Math.min(1500, f * 2.5), quando + Math.max(0.12, dur));
    f2.type = "lowpass";
    f2.frequency.value = 2800;
    f2.Q.value = 0.3;
    var c = ctx.createGain();
    c.gain.value = 0.5;
    corpo.connect(c);
    var ataque = de ? 0.03 : 0.06;
    g.gain.setValueAtTime(0.0001, quando);
    g.gain.exponentialRampToValueAtTime(vol, quando + ataque);
    g.gain.setValueAtTime(vol * 0.9, quando + Math.max(ataque + 0.01, dur - 0.06));
    g.gain.exponentialRampToValueAtTime(0.0001, quando + dur + 0.12);
    o.connect(f1);
    c.connect(f1);
    f1.connect(f2);
    f2.connect(g);
    g.connect(saida);
    if (eco) {
      var mol = ctx.createGain();
      mol.gain.value = 0.35;
      g.connect(mol);
      mol.connect(eco);
    }
    [o, corpo, lfo].forEach(function (x) { x.start(quando); x.stop(quando + dur + 0.15); });
    // Ar do sopro: um sopro no ataque e um fiozinho durante a nota.
    pegarRuido();
    var r = ctx.createBufferSource(), rf = ctx.createBiquadFilter(), rg = ctx.createGain();
    r.buffer = ruido;
    rf.type = "bandpass";
    rf.frequency.value = Math.min(2500, f * 3);
    rf.Q.value = 1.5;
    rg.gain.setValueAtTime(0.0001, quando);
    rg.gain.exponentialRampToValueAtTime(vol * (de ? 0.08 : 0.2), quando + 0.02);
    rg.gain.exponentialRampToValueAtTime(vol * 0.05, quando + 0.1);
    rg.gain.exponentialRampToValueAtTime(0.0001, quando + dur + 0.05);
    r.connect(rf);
    rf.connect(rg);
    rg.connect(saida);
    r.start(quando, Math.random() * 0.3);
    r.stop(quando + Math.min(dur + 0.1, 0.65));
  }

  // Baixo acústico (contrabaixo): corpo grave, ataque de dedo e som que morre devagar.
  function contrabaixo(n, quando, dur) {
    var o = ctx.createOscillator(), filtro = ctx.createBiquadFilter(), g = ctx.createGain();
    o.type = "triangle";
    o.frequency.value = hz(n);
    filtro.type = "lowpass";
    filtro.frequency.setValueAtTime(800, quando);
    filtro.frequency.exponentialRampToValueAtTime(300, quando + 0.2);
    g.gain.setValueAtTime(0.0001, quando);
    g.gain.exponentialRampToValueAtTime(0.26, quando + 0.012);
    g.gain.exponentialRampToValueAtTime(0.09, quando + dur * 0.6);
    g.gain.exponentialRampToValueAtTime(0.0001, quando + dur);
    o.connect(filtro);
    filtro.connect(g);
    g.connect(saida);
    o.start(quando);
    o.stop(quando + dur + 0.05);
  }

  // Vassourinha: um "chhh" que cresce e some a cada tempo, e um toque leve no 2 e no 4.
  function vassoura(quando, dur, toque) {
    pegarRuido();
    var r = ctx.createBufferSource(), passa = ctx.createBiquadFilter(), corta = ctx.createBiquadFilter(), g = ctx.createGain();
    r.buffer = ruido;
    passa.type = "highpass";
    passa.frequency.value = 900;
    corta.type = "lowpass";
    corta.frequency.value = 3500;
    g.gain.setValueAtTime(0.0001, quando);
    g.gain.exponentialRampToValueAtTime(toque ? 0.05 : 0.018, quando + (toque ? 0.01 : dur * 0.4));
    g.gain.exponentialRampToValueAtTime(0.0001, quando + (toque ? 0.18 : dur));
    r.connect(passa);
    passa.connect(corta);
    corta.connect(g);
    g.connect(saida);
    r.start(quando, Math.random() * 0.5);
    r.stop(quando + dur + 0.05);
  }

  // Acorde da "Meia-Noite" no compasso c: { raiz (nota MIDI), tipo }.
  function jzAcorde(c) {
    var a = jz.prog[((c % 8) + 8) % 8];
    return { raiz: jz.tom + a[0], tipo: JZ_TIPOS[a[1]] };
  }

  // Notas (MIDI) da escala do acorde, ou só do acorde, na região do sax.
  function jzNotas(ac, soAcorde) {
    var lista = [], base = soAcorde ? ac.tipo.notas : ac.tipo.escala;
    for (var o = -2; o <= 3; o++) base.forEach(function (x) {
      var m = ac.raiz + x + 12 * o;
      if (m >= 56 && m <= 79) lista.push(m);
    });
    return lista.sort(function (a, b) { return a - b; });
  }

  function jzPerto(n, ac, soAcorde) {
    var melhor = n, dist = 99;
    jzNotas(ac, soAcorde).forEach(function (m) { if (Math.abs(m - n) < dist) { dist = Math.abs(m - n); melhor = m; } });
    return melhor;
  }

  // Contorno de uma frase: passos na escala, perto da nota de partida (soma entre −5 e +5), terminando descendo.
  function jzContorno(qtas) {
    var passos = [0], soma = 0;
    for (var j = 1; j < qtas; j++) {
      var p = j === qtas - 1 ? sorte([-1, -2, -1]) : sorte([-2, -1, -1, 1, 1, 2, 3, -3]);
      if (Math.abs(soma + p) > 5) p = -p;
      soma += p;
      passos.push(p);
    }
    return passos;
  }

  // Seção nova (8 compassos = 4 frases na forma A A' B A).
  function jzSecao() {
    var rA = sorte(JZ_RITMOS), rB = sorte(JZ_RITMOS);
    var cA = jzContorno(rA.length), cB = jzContorno(rB.length);
    return { tom: sorte(JZ_TONS), prog: sorte(JZ_PROGS), frases: [[rA, cA], [rA, cA], [rB, cB], [rA, cA]], n: jz ? jz.n : 67, plano: [] };
  }

  // Planeja uma frase de 2 compassos a partir do compasso c: anda pela escala seguindo o contorno; tempo forte, nota
  // longa e a última nota sempre do acorde. Nota que começa quando a anterior acaba vai ligada (escorrega).
  function jzFrase(c, ritmo, contorno) {
    var notas = [], n = jz.n, fimAnterior = -1;
    ritmo.forEach(function (rt, j) {
      var ac = jzAcorde(c + Math.floor(rt[0] / 8));
      var escala = jzNotas(ac, false);
      var idx = 0, dist = 99;
      escala.forEach(function (m, x) { if (Math.abs(m - n) < dist) { dist = Math.abs(m - n); idx = x; } });
      var alvo = escala[Math.max(0, Math.min(escala.length - 1, idx + contorno[j]))];
      if (rt[0] % 4 === 0 || rt[1] >= 3 || j === ritmo.length - 1) alvo = jzPerto(alvo, ac, true);
      notas.push({ t: rt[0], len: rt[1], n: alvo, de: rt[0] === fimAnterior ? n : null });
      fimAnterior = rt[0] + rt[1];
      n = alvo;
    });
    jz.n = n;
    return notas;
  }

  // Uma colcheia da "Meia-Noite", com swing (a de trás sai no último terço do tempo).
  function tocarMeiaNoite(i, quando) {
    var b = 60 / JZ_BPM;
    var k = i % 8, compasso = Math.floor(i / 8);
    var tq = quando + (k % 2 === 1 ? b / 6 : 0);
    if (!jz || (k === 0 && compasso % 8 === 0)) jz = jzSecao();
    var c = compasso % 8;
    var ac = jzAcorde(c), prox = jzAcorde(c + 1);
    // Vassourinha em todo tempo, toque leve no 2 e no 4.
    if (k % 2 === 0) vassoura(quando, b, false);
    if (k === 2 || k === 6) vassoura(quando, b, true);
    // Contrabaixo em 2: fundamental no 1, quinta (ou terça) no 3, às vezes uma nota de passagem no "e" do 4.
    if (k === 0) contrabaixo(ac.raiz - 12 >= 36 ? ac.raiz - 12 : ac.raiz, quando, b * 1.9);
    if (k === 4) contrabaixo((ac.raiz - 12 >= 36 ? ac.raiz - 12 : ac.raiz) + sorte([7, 7, ac.tipo.notas[1]]), quando, b * 1.6);
    if (k === 7 && Math.random() < 0.3) contrabaixo((prox.raiz - 12 >= 36 ? prox.raiz - 12 : prox.raiz) - 1, tq, b * 0.45);
    // Piano bem discreto: o acorde sem fundamental no 1 de cada compasso, às vezes um toque no "e" do 2.
    if (k === 0) ac.tipo.piano.forEach(function (x) { pianoReal(ac.raiz + x, quando + (Math.random() - 0.5) * 0.02, 0.028, b * 2.5); });
    if (k === 3 && Math.random() < 0.3) ac.tipo.piano.forEach(function (x) { pianoReal(ac.raiz + x, tq, 0.018, b); });
    // Sax: uma frase a cada 2 compassos.
    if (k === 0 && c % 2 === 0) {
      var fr = jz.frases[c / 2];
      jz.plano = jzFrase(c, fr[0], fr[1]);
    }
    var dentro = (c % 2) * 8 + k;
    jz.plano.forEach(function (nn) {
      if (nn.t === dentro) sax(nn.n, tq, nn.len * b / 2 * 0.98, 0.075, nn.de);
    });
  }

  // ───────────── Clássicas ─────────────
  function classicas() {
    return window.GZ_CLASSICAS || [];
  }

  // Notas compactadas por ferramentas/classicas/gerar.js (a partir dos MIDIs das partituras do Mutopia): cada nota é
  // espera desde a anterior, duração (centésimos de segundo), altura (− 21) e força (0 a 7), números em base 64 de
  // tamanho variável (5 bits por letra; o 6º bit diz que o número continua).
  var ALFA = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  function lerNotas(txt) {
    var pos = 0, t = 0, eventos = [];
    var num = function () {
      var v = 0, desloca = 0, c;
      do {
        c = ALFA.indexOf(txt.charAt(pos++));
        if (c < 0) throw new Error("notas inválidas");
        v += (c & 31) * Math.pow(2, desloca);
        desloca += 5;
      } while (c & 32);
      return v;
    };
    while (pos < txt.length) {
      t += num() / 100;
      var d = num() / 100, n = num() + 21, forca = num();
      // o pedal do piano não vem no MIDI: a nota soa um pouco mais que o escrito
      eventos.push({ s: t, n: n, dur: Math.max(0.3, d * 1.05 + 0.25), vol: 0.03 + forca * 0.011 });
    }
    return eventos;
  }

  function montarClassica(peca) {
    var eventos = lerNotas(peca.notas);
    var fim = eventos.reduce(function (a, e) { return Math.max(a, e.s + e.dur); }, 0);
    return { peca: peca, eventos: eventos, i: 0, duracao: fim };
  }

  // Ordem embaralhada (sempre diferente): toca todas antes de repetir alguma, e uma nova rodada embaralhada nunca
  // começa com a que acabou de tocar.
  var fila = [];
  function proximaClassica(quando) {
    var lista = classicas();
    if (!lista.length) return;
    if (!fila.length) {
      fila = lista.slice();
      for (var i = fila.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1)), x = fila[i];
        fila[i] = fila[j];
        fila[j] = x;
      }
      if (cl && fila.length > 1 && fila[0].id === cl.peca.id) fila.push(fila.shift());
    }
    var peca = fila.shift();
    cl = montarClassica(peca);
    cl.t0 = quando;
    cl.fim = quando + cl.duracao;
    if (aoTrocarClassica) aoTrocarClassica();
  }
  var aoTrocarClassica = null;

  function agendarClassicas() {
    if (!classicas().length) { carregarClassicas(); return; }
    if (!cl) proximaClassica(ctx.currentTime + 0.3);
    // Acabou: um respiro de 1,5 s e a próxima.
    if (cl.i >= cl.eventos.length && ctx.currentTime > cl.fim + 1.2) proximaClassica(ctx.currentTime + 0.3);
    // Agenda com 1 s de antecedência (aparelho lento não atrasa as notas). Nota que mesmo assim chegou atrasada é
    // pulada, e não empurrada para depois: empurrar tirava a música do compasso.
    while (cl.i < cl.eventos.length && cl.t0 + cl.eventos[cl.i].s < ctx.currentTime + 1) {
      var e = cl.eventos[cl.i++];
      var quando = cl.t0 + e.s;
      if (quando < ctx.currentTime) continue;
      pianoReal(e.n, quando, e.vol * (0.92 + Math.random() * 0.16), e.dur);
    }
  }

  var carregando = false;
  function carregarClassicas(depois) {
    if (window.GZ_CLASSICAS) { if (depois) depois(); return; }
    if (carregando || !document.createElement) return;
    carregando = true;
    var sc = document.createElement("script");
    sc.src = BASE + "gamezi-classicas.js";
    sc.onload = function () { carregando = false; if (depois) depois(); };
    sc.onerror = function () { carregando = false; };
    document.head.appendChild(sc);
  }

  function agendar() {
    var t = trilha();
    if (t === "classicas") return agendarClassicas();
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
    cl = null;
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
    var tocar = function (id) {
      if (id !== trilha()) {
        try { localStorage.setItem(CHAVE_TRILHA, id); } catch (e) { /* vale só agora */ }
        trocarTrilha();
      }
      // Escolheu com a música desligada: liga, para ouvir.
      if (!ligada()) guardar(true);
      comecar();
      atualizar();
    };
    var chip = function (texto, ativo, aoClicar) {
      var bt = document.createElement("button");
      bt.type = "button";
      bt.className = "musica-faixa";
      bt.textContent = texto;
      bt.setAttribute("aria-pressed", ativo ? "true" : "false");
      bt.onclick = aoClicar;
      return bt;
    };
    var atualizar = function () {
      var l = idioma();
      rotulo.textContent = TEXTO[l];
      var escolhida = trilha();
      var nomeAtual = FAIXAS.filter(function (f) { return f.id === escolhida; })[0].nome[l];
      if (escolhida === "classicas" && cl) nomeAtual += " · " + cl.peca.nome[l];
      atual.textContent = nomeAtual;
      seta.setAttribute("aria-label", TEXTO_FAIXAS[l]);
      seta.title = TEXTO_FAIXAS[l];
      lista.innerHTML = "";
      FAIXAS.forEach(function (f) {
        var bt = chip(f.nome[l], f.id === escolhida, function () { tocar(f.id); });
        bt.dataset.faixa = f.id;
        lista.appendChild(bt);
      });
      rotuloVol.textContent = TEXTO_VOLUME[l];
      faixa.setAttribute("aria-label", TEXTO_VOLUME[l]);
      faixa.value = volume();
      numero.textContent = volume();
      linhaVol.style.opacity = ligada() ? "1" : ".55";
      desenharBotao(b);
    };
    aoTrocarClassica = function () { if (document.getElementById("musica-btn")) atualizar(); };
    if (trilha() === "classicas") carregarClassicas(atualizar);
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

  window.gameziMusica = { comecar: comecar, parar: parar, ligada: ligada, volume: volume, trilha: trilha, montarClassica: montarClassica };
})();
