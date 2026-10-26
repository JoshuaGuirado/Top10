// Corzi na tela: o que tocar (a COR ou a PALAVRA), a palavra pintada num cartão escuro e as 4 alternativas.
// As telas comuns (início, resultado, online e sala) são de ../gamezi-kit.js; as regras, de js/jogo.js.

const CZR_NOMES_TEMAS = {
  misto: ["Misto", "Mixed", "Mixto"],
  cor: ["Só a cor", "Color only", "Solo el color"],
  palavra: ["Só a palavra", "Word only", "Solo la palabra"],
};

function czrNome(k) {
  return tr(CZR_CORES[k].nome);
}

function czrDesenhar(el, r, e) {
  if (e.fase === "jogando" && !e.nova) return;
  const revelado = e.fase === "revelado";
  const pede = r.tipo === "cor" ? t("cz.cor") : t("cz.palavra");
  el.innerHTML = `<p class="czr-pede ${r.tipo}">${pede}</p>
    <div class="czr-cartao"><b style="color:${CZR_CORES[r.tinta].hex}">${escapeHtml(czrNome(r.palavra))}</b></div>
    <div class="czr-opcoes">${r.opcoes.map((k, i) => {
      const cls = revelado ? (k === r.resposta ? "right" : k === e.v ? "wrong" : "") : k === e.v ? "chosen" : "";
      const cor = r.pinturas ? ` style="color:${CZR_CORES[r.pinturas[i]].hex}"` : "";
      return `<button type="button" class="czr-op ${r.pinturas ? "pintada" : ""} ${cls}" data-op="${k}" ${e.fase === "jogando" ? "" : "disabled"}${cor}>${escapeHtml(czrNome(k))}</button>`;
    }).join("")}</div>`;
  el.onclick = (ev) => {
    const b = ev.target.closest("[data-op]");
    if (b && e.fase === "jogando") e.responder(Number(b.dataset.op));
  };
}

function czrResumo(r) {
  const tipo = r.tipo === "cor" ? t("cz.resCor") : t("cz.resPalavra");
  return `<i class="czr-mini" style="color:${CZR_CORES[r.tinta].hex}">${escapeHtml(czrNome(r.palavra))}</i> ${escapeHtml(tipo)}: ${escapeHtml(czrNome(r.resposta))}`;
}

gzIniciar({
  id: "corzi",
  prefixo: "cr",
  nome: "Corzi",
  inicio: CZR_INICIO,
  diario: czrDiario,
  livre: (tema) => czrLivre(tema),
  online: (tema, qtd) => czrOnline(tema, qtd),
  quantias: CZR_QUANTIAS,
  temas: CZR_TEMAS.map((id) => ({ id, nome: CZR_NOMES_TEMAS[id] })),
  segundos: czrSegundos,
  avaliar: czrAvaliar,
  valida: czrValida,
  desenhar: czrDesenhar,
  resumo: czrResumo,
  respostaTexto: (r, v) => (CZR_CORES[v] ? escapeHtml(czrNome(v)) : "—"),
  textos: {
    "home.tag": ["A palavra diz uma cor, a tinta é outra. Toque rápido na certa!", "The word says one color, the ink is another. Tap the right one, fast!", "La palabra dice un color, la tinta es otro. ¡Toca rápido el correcto!"],
    "daily.name": ["Corzi do dia", "Daily Corzi", "Corzi del día"],
    "daily.kicker": ["Corzi do dia #{n}", "Daily Corzi #{n}", "Corzi del día #{n}"],
    "lobby.theme": ["Modo", "Mode", "Modo"],
    "cz.cor": ["Toque na <b>COR</b> da tinta", "Tap the ink <b>COLOR</b>", "Toca el <b>COLOR</b> de la tinta"],
    "cz.palavra": ["Toque no que está <b>ESCRITO</b>", "Tap what is <b>WRITTEN</b>", "Toca lo que está <b>ESCRITO</b>"],
    "cz.resCor": ["cor", "color", "color"],
    "cz.resPalavra": ["palavra", "word", "palabra"],
    "help.html": [
      "<ol class=\"help-steps\"><li>Aparece o nome de uma cor pintado com outra tinta: <b style=\"background:#171717;color:#FF4136;padding:0 6px;border-radius:6px\">AZUL</b>.</li><li>Leia o pedido em cima: <b>COR</b> (toque na cor da tinta, aqui vermelho) ou <b>ESCRITO</b> (toque no que está escrito, aqui azul).</li><li>Acertou: de 50 a 100 pontos, quanto mais rápido, mais. Errou ou acabou o tempo: 0.</li><li>Quanto mais longe, mais difícil: mais cores, menos tempo e alternativas pintadas para confundir.</li></ol><p><b>Corzi do dia:</b> as mesmas 10 para todo mundo, com ranking. <b>Partida livre:</b> até errar 3 vezes. <b>Online:</b> todo mundo vê a mesma ao mesmo tempo, como no Kahoot; quem toca certo mais rápido ganha mais. O anfitrião escolhe 10, 20 ou 30 rodadas.</p>",
      "<ol class=\"help-steps\"><li>A color name shows up painted in another ink: <b style=\"background:#171717;color:#FF4136;padding:0 6px;border-radius:6px\">BLUE</b>.</li><li>Read the request on top: <b>COLOR</b> (tap the ink color, here red) or <b>WRITTEN</b> (tap what is written, here blue).</li><li>Right: 50 to 100 points, the faster the more. Wrong or out of time: 0.</li><li>The further you go, the harder: more colors, less time and painted answers to trick you.</li></ol><p><b>Daily Corzi:</b> the same 10 for everyone, with a ranking. <b>Free play:</b> until you miss 3 times. <b>Online:</b> everyone sees the same one at the same time, like Kahoot; the fastest right tap scores the most. The host picks 10, 20 or 30 rounds.</p>",
      "<ol class=\"help-steps\"><li>Aparece el nombre de un color pintado con otra tinta: <b style=\"background:#171717;color:#FF4136;padding:0 6px;border-radius:6px\">AZUL</b>.</li><li>Lee el pedido arriba: <b>COLOR</b> (toca el color de la tinta, aquí rojo) o <b>ESCRITO</b> (toca lo que está escrito, aquí azul).</li><li>Si aciertas: de 50 a 100 puntos, cuanto más rápido, más. Si fallas o se acaba el tiempo: 0.</li><li>Cuanto más avanzas, más difícil: más colores, menos tiempo y respuestas pintadas para confundir.</li></ol><p><b>Corzi del día:</b> los mismos 10 para todos, con ranking. <b>Partida libre:</b> hasta fallar 3 veces. <b>Online:</b> todos ven lo mismo al mismo tiempo, como en Kahoot; quien toca bien más rápido gana más. El anfitrión elige 10, 20 o 30 rondas.</p>",
    ],
  },
});
