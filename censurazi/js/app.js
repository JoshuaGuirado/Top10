// Censurazi na tela (modo adivinhar): as proibidas aparecem como dicas, uma por vez, e a pessoa digita a palavra.
// As telas comuns (início, resultado, online e sala) são de ../gamezi-kit.js; as regras, de js/jogo.js;
// o modo "Na mesa" (times num celular só), de js/mesa.js.

const CS_NOMES_TEMAS = {
  tudo: ["Tudo", "Everything", "Todo"],
  casa: ["Casa e objetos", "Home & objects", "Casa y objetos"],
  comida: ["Comida", "Food", "Comida"],
  animais: ["Animais", "Animals", "Animales"],
  lugares: ["Lugares", "Places", "Lugares"],
  profissoes: ["Profissões", "Jobs", "Profesiones"],
  esportes: ["Esportes", "Sports", "Deportes"],
  natureza: ["Natureza", "Nature", "Naturaleza"],
  corpo: ["Corpo e saúde", "Body & health", "Cuerpo y salud"],
  transporte: ["Transporte", "Transport", "Transporte"],
  festas: ["Festas e datas", "Parties & holidays", "Fiestas y fechas"],
  tecnologia: ["Tecnologia", "Technology", "Tecnología"],
  cultura: ["Filmes e personagens", "Movies & characters", "Películas y personajes"],
};

let csN = 0; // dicas a mais na rodada da vez
let csErros = []; // chutes errados da rodada
let csResponder = null;

function csTxt(carta) {
  return carta.txt[lang] || carta.txt.pt;
}

// "_ _ _ _ _" com o tamanho da palavra (espaço e hífen aparecem); com todas as dicas, a primeira letra também.
function csTracos(palavra, comLetra) {
  return palavra.split(" ").map((parte, k) => `<span>${[...parte].map((ch, i) =>
    (ch === "-" ? '<i class="hif">-</i>' : `<i>${k === 0 && i === 0 && comLetra ? escapeHtml(ch.toUpperCase()) : ""}</i>`)).join("")}</span>`).join("");
}

function csDesenhar(el, r, e) {
  const carta = csCarta(r.id);
  const txt = csTxt(carta);
  if (e.fase === "jogando") {
    csResponder = e.responder;
    if (!e.nova) return;
    csN = 0;
    csErros = [];
    el.innerHTML = `<div class="cs-card"><p class="cs-q">${escapeHtml(t("cs.q"))}</p><div class="cs-tracos" id="cs-tracos"></div><ol class="cs-dicas" id="cs-dicas"></ol></div>
      <form class="cs-form" id="cs-form" autocomplete="off">
        <input id="cs-chute" maxlength="40" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="send" placeholder="${escapeHtml(t("cs.ph"))}">
        <button type="submit" class="btn">${escapeHtml(t("cs.guess"))}</button>
      </form>
      <p class="cs-msg" id="cs-msg" aria-live="polite"></p>
      <div class="cs-acoes"><span class="cs-vale" id="cs-vale"></span><button type="button" class="link-btn" id="cs-dica">${escapeHtml(t("cs.hint"))}</button><button type="button" class="link-btn" id="cs-desisto">${escapeHtml(t("cs.giveUp"))}</button></div>`;
    $("cs-form").onsubmit = (ev) => {
      ev.preventDefault();
      csChutar(carta);
    };
    $("cs-dica").onclick = () => csMaisDica(carta);
    $("cs-desisto").onclick = () => csResponder && csResponder({ g: "", n: csN });
    csAtualizar(carta);
    if (matchMedia("(pointer: fine)").matches) $("cs-chute").focus();
    return;
  }
  csResponder = null;
  const revelado = e.fase === "revelado";
  if (!revelado) {
    el.innerHTML = `<div class="cs-card ok"><p class="cs-q">${escapeHtml(t("cs.youGot"))}</p><p class="cs-palavra">${escapeHtml(txt[0])}</p></div>`;
    return;
  }
  el.innerHTML = `<div class="cs-card ${e.res && e.res.certo ? "ok" : "no"}"><p class="cs-q">${escapeHtml(t("cs.was"))}</p><p class="cs-palavra">${escapeHtml(txt[0])}</p>
    <ol class="cs-dicas todas">${txt.slice(1).map((d) => `<li>${escapeHtml(d)}</li>`).join("")}</ol></div>`;
}

function csAtualizar(carta) {
  const txt = csTxt(carta);
  $("cs-tracos").innerHTML = csTracos(txt[0], csN >= 5);
  $("cs-dicas").innerHTML = txt.slice(1, 2 + Math.min(csN, 4)).map((d, i) => `<li class="${i === Math.min(csN, 4) ? "nova" : ""}">${escapeHtml(d)}</li>`).join("");
  $("cs-vale").textContent = t("cs.worth", { n: CS_PONTOS[csN] });
  $("cs-dica").hidden = csN >= CS_PONTOS.length - 1;
}

function csMaisDica(carta) {
  if (csN < CS_PONTOS.length - 1) csN += 1;
  csAtualizar(carta);
}

function csChutar(carta) {
  if (!csResponder) return;
  const inp = $("cs-chute");
  const g = inp.value.trim();
  if (!g) return;
  if (csAcertou(carta, g)) return csResponder({ g, n: csN });
  csErros.push(g);
  inp.value = "";
  $("cs-msg").textContent = t("cs.notIt", { g });
  inp.classList.remove("shake");
  void inp.offsetWidth;
  inp.classList.add("shake");
  csMaisDica(carta);
  inp.focus();
}

function csResumo(r) {
  const txt = csTxt(csCarta(r.id));
  return `<b class="cs-res">${escapeHtml(txt[0])}</b> <small class="muted">${escapeHtml(txt.slice(1).join(" · "))}</small>`;
}

gzIniciar({
  id: "censurazi",
  prefixo: "cs",
  nome: "Censurazi",
  inicio: CS_INICIO,
  diario: csDiario,
  livre: (tema) => csLivre(tema),
  online: (tema) => csOnline(tema),
  temas: CS_TEMAS.map((id) => ({ id, nome: CS_NOMES_TEMAS[id] })),
  segundos: () => CS_SEGUNDOS,
  avaliar: csAvaliar,
  valida: csValida,
  desenhar: csDesenhar,
  resumo: csResumo,
  respostaTexto: (r, v) => (v && v.g ? escapeHtml(v.g) : "—"),
  extra: CS_MESA,
  textos: {
    "home.tag": ["Descubra a palavra pelas proibidas. Ou jogue o clássico com a turma: explique sem falar as proibidas!", "Find the word from its forbidden words. Or play the classic with friends: explain it without saying them!", "Descubre la palabra por las prohibidas. O juega el clásico con amigos: ¡explícala sin decirlas!"],
    "daily.name": ["Censurazi do dia", "Daily Censurazi", "Censurazi del día"],
    "daily.kicker": ["Censurazi do dia #{n}", "Daily Censurazi #{n}", "Censurazi del día #{n}"],
    "cs.q": ["Qual é a palavra? Estas são proibidas:", "What's the word? These are forbidden:", "¿Cuál es la palabra? Estas están prohibidas:"],
    "cs.ph": ["Digite a palavra", "Type the word", "Escribe la palabra"],
    "cs.guess": ["Chutar", "Guess", "Probar"],
    "cs.hint": ["Mais uma proibida", "One more forbidden word", "Otra prohibida"],
    "cs.giveUp": ["Desisto", "Give up", "Me rindo"],
    "cs.worth": ["Vale {n} pontos", "Worth {n} points", "Vale {n} puntos"],
    "cs.notIt": ["Não é \"{g}\". Lá vai mais uma.", "It's not \"{g}\". Here's another.", "No es \"{g}\". Ahí va otra."],
    "cs.youGot": ["Você acertou! Era:", "You got it! It was:", "¡Acertaste! Era:"],
    "cs.was": ["A palavra era", "The word was", "La palabra era"],
    "help.html": [
      "<ol class=\"help-steps\"><li>Toda carta tem uma palavra secreta e 5 palavras <b>proibidas</b>, as que mais entregam a resposta.</li><li>Aparece uma proibida de cada vez. Digite qual é a palavra secreta.</li><li>Cada chute errado (ou \"mais uma proibida\") mostra a próxima e a rodada vale menos: 100, 88, 76, 64, 52 e 40 pontos. Com todas, aparece a primeira letra.</li></ol><p><b>Censurazi do dia:</b> as mesmas 10 para todo mundo, com ranking. <b>Partida livre:</b> até errar 3 vezes. <b>Online:</b> todo mundo tenta a mesma carta, cada um no seu celular. <b>Na mesa:</b> o jogo clássico com a turma num celular só: em times, um explica a palavra sem falar nenhuma proibida e o time adivinha antes de acabar o tempo.</p>",
      "<ol class=\"help-steps\"><li>Every card has a secret word and 5 <b>forbidden</b> words, the ones that give it away the most.</li><li>One forbidden word shows up at a time. Type the secret word.</li><li>Each wrong guess (or \"one more forbidden word\") shows the next one and the round is worth less: 100, 88, 76, 64, 52 and 40 points. With all of them, the first letter shows up too.</li></ol><p><b>Daily Censurazi:</b> the same 10 for everyone, with a ranking. <b>Free play:</b> until you miss 3 times. <b>Online:</b> everyone tries the same card on their own phone. <b>At the table:</b> the classic with friends on one phone: in teams, one player explains the word without saying any forbidden word and the team guesses before time runs out.</p>",
      "<ol class=\"help-steps\"><li>Cada carta tiene una palabra secreta y 5 palabras <b>prohibidas</b>, las que más la delatan.</li><li>Aparece una prohibida por vez. Escribe la palabra secreta.</li><li>Cada intento fallido (u \"otra prohibida\") muestra la siguiente y la ronda vale menos: 100, 88, 76, 64, 52 y 40 puntos. Con todas, aparece también la primera letra.</li></ol><p><b>Censurazi del día:</b> las mismas 10 para todos, con ranking. <b>Partida libre:</b> hasta fallar 3 veces. <b>Online:</b> todos intentan la misma carta, cada uno en su celular. <b>En la mesa:</b> el clásico con amigos en un solo celular: en equipos, uno explica la palabra sin decir ninguna prohibida y su equipo adivina antes de que se acabe el tiempo.</p>",
    ],
    ...CS_MESA_TEXTOS,
  },
});
