// Emojizi na tela: os emojis e as quatro alternativas. As telas comuns (início, resultado, online e sala)
// são de ../gamezi-kit.js; as regras, de js/jogo.js; os itens, de data/itens.js.

function ejDesenhar(el, r, e) {
  if (e.fase === "jogando" && !e.nova) return;
  const item = ejItem(r.id);
  const revelado = e.fase === "revelado";
  el.innerHTML = `<p class="emojis">${escapeHtml(item.emojis)}</p>
    <p class="ej-q">${escapeHtml(t("ej.q." + item.cat))}</p>
    <div class="opcoes">${r.opcoes.map((id) => {
      const cls = revelado ? (id === r.id ? "right" : id === e.v ? "wrong" : "") : id === e.v ? "chosen" : "";
      return `<button type="button" class="opcao ${cls}" data-op="${id}" ${e.fase === "jogando" ? "" : "disabled"}>${escapeHtml(tr(ejItem(id).nome))}</button>`;
    }).join("")}</div>`;
  el.onclick = (ev) => {
    const b = ev.target.closest("[data-op]");
    if (b && e.fase === "jogando") e.responder(b.dataset.op);
  };
}

gzIniciar({
  id: "emojizi",
  prefixo: "ej",
  nome: "Emojizi",
  inicio: EJ_INICIO,
  diario: ejDiario,
  livre: () => ejLivre(),
  online: () => ejOnline(),
  segundos: () => EJ_SEGUNDOS,
  avaliar: ejAvaliar,
  valida: ejValida,
  desenhar: ejDesenhar,
  resumo: (r) => `${escapeHtml(ejItem(r.id).emojis)} ${escapeHtml(tr(ejItem(r.id).nome))}`,
  respostaTexto: (r, v) => (ejItem(v) ? escapeHtml(tr(ejItem(v).nome)) : "—"),
  textos: {
    "home.tag": ["Qual filme, desenho ou lugar os emojis contam?", "Which movie, cartoon or place do the emojis tell?", "¿Qué película, dibujo o lugar cuentan los emojis?"],
    "daily.name": ["Emojizi do dia", "Daily Emojizi", "Emojizi del día"],
    "daily.kicker": ["Emojizi do dia #{n}", "Daily Emojizi #{n}", "Emojizi del día #{n}"],
    "ej.q.filme": ["Qual filme, desenho, série ou história?", "Which movie, cartoon, show or story?", "¿Qué película, dibujo, serie o cuento?"],
    "ej.q.lugar": ["Qual lugar?", "Which place?", "¿Qué lugar?"],
    "help.html": [
      "<ol class=\"help-steps\"><li>Aparecem uns emojis: eles contam um filme, um desenho, uma série, uma história ou um lugar.</li><li>Toque na alternativa certa.</li><li>Acertou: de 50 a 100 pontos, quanto mais rápido, mais. Errou ou acabou o tempo (15 segundos): 0.</li></ol><p><b>Emojizi do dia:</b> os mesmos 10 para todo mundo, com ranking. <b>Partida livre:</b> até errar 3 vezes. <b>Online:</b> todo mundo vê os mesmos emojis; quem acerta mais rápido ganha mais.</p>",
      "<ol class=\"help-steps\"><li>Some emojis show up: they tell a movie, a cartoon, a show, a story or a place.</li><li>Tap the right answer.</li><li>Right: 50 to 100 points, the faster the more. Wrong or out of time (15 seconds): 0.</li></ol><p><b>Daily Emojizi:</b> the same 10 for everyone, with a ranking. <b>Free play:</b> until you miss 3 times. <b>Online:</b> everyone sees the same emojis; the fastest right answer scores the most.</p>",
      "<ol class=\"help-steps\"><li>Aparecen unos emojis: cuentan una película, un dibujo, una serie, un cuento o un lugar.</li><li>Toca la respuesta correcta.</li><li>Si aciertas: de 50 a 100 puntos, cuanto más rápido, más. Si fallas o se acaba el tiempo (15 segundos): 0.</li></ol><p><b>Emojizi del día:</b> los mismos 10 para todos, con ranking. <b>Partida libre:</b> hasta fallar 3 veces. <b>Online:</b> todos ven los mismos emojis; quien acierta más rápido gana más.</p>",
    ],
  },
});
