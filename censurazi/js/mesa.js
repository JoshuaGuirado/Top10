// Censurazi "Na mesa": o jogo clássico com a turma, num celular só. Em times; na vez do time, alguém pega o celular
// e explica a palavra sem falar nenhuma das 5 proibidas, e o time tenta adivinhar antes de acabar o tempo.
// Acertou: +1. Pulou: 0. Falou uma proibida (os outros times gritam!): −1. As regras ficam em js/jogo.js
// (csMesa*); este arquivo põe o cartão no início e as telas próprias no kit (GZ.extra).

const CS_MESA_TEMPOS = [60, 90, 120];
const CS_MESA_TURNOS = [2, 3, 5];
let csMesa = null;
let csMesaFim = 0; // quando acaba o turno (Date.now)
let csMesaTimer = null;
let csMesaCfg = { times: [], tempo: 60, turnos: 3 };

const CS_MESA_TEXTOS = {
  "mesa.title": ["Na mesa", "At the table", "En la mesa"],
  "mesa.sub": ["O clássico com a turma, num celular só: explique sem falar as proibidas", "The classic with friends on one phone: explain it without the forbidden words", "El clásico con amigos en un solo celular: explica sin decir las prohibidas"],
  "mesa.teams": ["Times", "Teams", "Equipos"],
  "mesa.team": ["Time {n}", "Team {n}", "Equipo {n}"],
  "mesa.addTeam": ["+ Time", "+ Team", "+ Equipo"],
  "mesa.time": ["Tempo de cada vez", "Time per turn", "Tiempo por turno"],
  "mesa.turns": ["Vezes de cada time", "Turns per team", "Turnos por equipo"],
  "mesa.theme": ["Tema", "Theme", "Tema"],
  "mesa.turnOf": ["Vez do {nome}", "{nome}'s turn", "Turno de {nome}"],
  "mesa.pass": ["Passe o celular para quem vai explicar. Só essa pessoa pode olhar a tela!", "Hand the phone to whoever will explain. Only they may look at the screen!", "Pasa el celular a quien va a explicar. ¡Solo esa persona puede mirar la pantalla!"],
  "mesa.round": ["Rodada {a} de {b}", "Round {a} of {b}", "Ronda {a} de {b}"],
  "mesa.go": ["Começar a vez", "Start the turn", "Empezar el turno"],
  "mesa.say": ["Não pode falar:", "You can't say:", "No puedes decir:"],
  "mesa.right": ["Acertou", "Got it", "Acertó"],
  "mesa.skip": ["Pular", "Skip", "Pasar"],
  "mesa.taboo": ["Falou proibida!", "Said a forbidden word!", "¡Dijo una prohibida!"],
  "mesa.timeUp": ["Acabou o tempo!", "Time's up!", "¡Se acabó el tiempo!"],
  "mesa.turnPts": ["{nome} fez {n} nesta vez", "{nome} scored {n} this turn", "{nome} hizo {n} en este turno"],
  "mesa.next": ["Próximo time", "Next team", "Siguiente equipo"],
  "mesa.end": ["Ver resultado", "See result", "Ver resultado"],
  "mesa.won": ["{nome} venceu!", "{nome} wins!", "¡{nome} ganó!"],
  "mesa.tie": ["Empate!", "It's a tie!", "¡Empate!"],
  "mesa.pts": ["{n} pontos", "{n} points", "{n} puntos"],
  "mesa.pts1": ["1 ponto", "1 point", "1 punto"],
  "mesa.again": ["Jogar de novo", "Play again", "Jugar de nuevo"],
  "mesa.quit": ["Sair", "Leave", "Salir"],
  "mesa.quitAsk": ["Sair da partida na mesa?", "Leave the table game?", "¿Salir de la partida en la mesa?"],
};

function csMesaPts(n) {
  return Math.abs(n) === 1 ? t("mesa.pts1").replace("1", n) : t("mesa.pts", { n });
}

const CS_MESA = {
  card: `<div class="home-card home-row mesa-card">
        <div><b data-i18n="mesa.title"></b><span data-i18n="mesa.sub"></span></div>
        <button type="button" class="btn dark" id="mesa-btn" data-i18n="btn.play"></button>
      </div>`,
  telas: `
    <section id="screen-mesa" class="screen narrow mesa" hidden>
      <h2 data-i18n="mesa.title"></h2>
      <div class="home-card">
        <p class="card-label" data-i18n="mesa.teams"></p>
        <div class="mesa-times" id="mesa-times"></div>
        <button type="button" class="btn ghost small" id="mesa-add" data-i18n="mesa.addTeam"></button>
      </div>
      <div class="home-card"><p class="card-label" data-i18n="mesa.time"></p><div class="chips" id="mesa-tempo"></div></div>
      <div class="home-card"><p class="card-label" data-i18n="mesa.turns"></p><div class="chips" id="mesa-turnos"></div></div>
      <div class="home-card"><p class="card-label" data-i18n="mesa.theme"></p><div class="chips" id="mesa-temas"></div></div>
      <div class="actions end">
        <button type="button" class="btn ghost" id="mesa-voltar" data-i18n="btn.back"></button>
        <button type="button" class="btn big" id="mesa-comecar" data-i18n="btn.start"></button>
      </div>
    </section>
    <section id="screen-mesa-vez" class="screen narrow mesa" hidden>
      <p class="kicker" id="mesa-rodada"></p>
      <h2 class="mesa-vez" id="mesa-vez"></h2>
      <p class="mesa-passe" data-i18n="mesa.pass"></p>
      <ol class="ranking" id="mesa-placar"></ol>
      <div class="actions center"><button type="button" class="btn big" id="mesa-go" data-i18n="mesa.go"></button></div>
      <div class="actions center"><button type="button" class="link-btn" id="mesa-sair" data-i18n="mesa.quit"></button></div>
    </section>
    <section id="screen-mesa-jogo" class="screen narrow mesa" hidden>
      <div class="mesa-top"><b id="mesa-quem"></b><span class="mesa-relogio" id="mesa-relogio"></span><span class="game-score" id="mesa-turno-pts"></span></div>
      <div class="mesa-carta">
        <p class="mesa-palavra" id="mesa-palavra"></p>
        <p class="mesa-nao" data-i18n="mesa.say"></p>
        <ul class="mesa-proibidas" id="mesa-proibidas"></ul>
      </div>
      <div class="mesa-botoes">
        <button type="button" class="btn mesa-certo" id="mesa-certo" data-i18n="mesa.right"></button>
        <button type="button" class="btn ghost" id="mesa-pular" data-i18n="mesa.skip"></button>
        <button type="button" class="btn mesa-buzz" id="mesa-buzz" data-i18n="mesa.taboo"></button>
      </div>
    </section>
    <section id="screen-mesa-turno" class="screen narrow mesa" hidden>
      <p class="kicker" data-i18n="mesa.timeUp"></p>
      <p class="result-score mesa-turno-res" id="mesa-turno-res"></p>
      <ol class="rounds" id="mesa-feitas"></ol>
      <div class="actions center"><button type="button" class="btn big" id="mesa-proximo"></button></div>
    </section>
    <section id="screen-mesa-fim" class="screen narrow mesa" hidden>
      <div class="result-head"><p class="kicker" data-i18n="mesa.title"></p><p class="result-score" id="mesa-vencedor"></p></div>
      <ol class="ranking" id="mesa-final"></ol>
      <div class="actions center">
        <button type="button" class="btn" id="mesa-de-novo" data-i18n="mesa.again"></button>
        <button type="button" class="btn ghost" id="mesa-inicio" data-i18n="btn.home"></button>
      </div>
    </section>`,
  ligar() {
    $("mesa-btn").onclick = csMesaAbrir;
    $("mesa-voltar").onclick = irInicio;
    $("mesa-add").onclick = () => {
      csMesaLerTimes();
      if (csMesaCfg.times.length < 4) csMesaCfg.times.push("");
      csMesaSetup();
    };
    $("mesa-times").oninput = csMesaLerTimes;
    $("mesa-times").onclick = (e) => {
      const b = e.target.closest("[data-tirar]");
      if (!b || csMesaCfg.times.length <= 2) return;
      csMesaLerTimes();
      csMesaCfg.times.splice(Number(b.dataset.tirar), 1);
      csMesaSetup();
    };
    $("mesa-tempo").onclick = (e) => {
      const b = e.target.closest("[data-v]");
      if (b) { csMesaCfg.tempo = Number(b.dataset.v); csMesaSetup(); }
    };
    $("mesa-turnos").onclick = (e) => {
      const b = e.target.closest("[data-v]");
      if (b) { csMesaCfg.turnos = Number(b.dataset.v); csMesaSetup(); }
    };
    $("mesa-temas").onclick = (e) => {
      const b = e.target.closest("[data-v]");
      if (b) { csMesaCfg.tema = b.dataset.v; csMesaSetup(); }
    };
    $("mesa-comecar").onclick = csMesaComecar;
    $("mesa-go").onclick = csMesaTurno;
    $("mesa-sair").onclick = () => confirm(t("mesa.quitAsk")) && csMesaSair();
    $("mesa-certo").onclick = () => csMesaMarcarAgora("acertou");
    $("mesa-pular").onclick = () => csMesaMarcarAgora("pulou");
    $("mesa-buzz").onclick = () => csMesaMarcarAgora("proibida");
    $("mesa-proximo").onclick = csMesaProximo;
    $("mesa-de-novo").onclick = csMesaAbrir;
    $("mesa-inicio").onclick = csMesaSair;
  },
  idioma(tela) {
    if (tela === "mesa") csMesaSetup();
    if (tela === "mesa-vez") csMesaVez();
    if (tela === "mesa-jogo") csMesaCarta();
    if (tela === "mesa-fim") csMesaFinal();
  },
};

function csMesaAbrir() {
  const salvo = store("mesa") || {};
  csMesaCfg = {
    times: Array.isArray(salvo.times) && salvo.times.length >= 2 ? salvo.times.slice(0, 4) : ["", ""],
    tempo: CS_MESA_TEMPOS.includes(salvo.tempo) ? salvo.tempo : 60,
    turnos: CS_MESA_TURNOS.includes(salvo.turnos) ? salvo.turnos : 3,
    tema: CS_TEMAS.includes(salvo.tema) ? salvo.tema : "tudo",
  };
  csMesaSetup();
  show("mesa");
}

function csMesaChips(el, lista, atual, nome = (v) => v) {
  el.innerHTML = lista.map((v) => `<button type="button" class="chip ${v === atual ? "active" : ""}" aria-pressed="${v === atual}" data-v="${v}">${escapeHtml(nome(v))}</button>`).join("");
}

function csMesaSetup() {
  $("mesa-times").innerHTML = csMesaCfg.times.map((n, i) => `<div class="mesa-time-row">
      <input maxlength="16" value="${escapeHtml(n)}" data-i="${i}" placeholder="${escapeHtml(t("mesa.team", { n: i + 1 }))}" aria-label="${escapeHtml(t("mesa.team", { n: i + 1 }))}">
      ${csMesaCfg.times.length > 2 ? `<button type="button" class="icon-btn" data-tirar="${i}" aria-label="×">${KIT_ICONES.x}</button>` : ""}</div>`).join("");
  $("mesa-add").hidden = csMesaCfg.times.length >= 4;
  csMesaChips($("mesa-tempo"), CS_MESA_TEMPOS, csMesaCfg.tempo, (v) => v + "s");
  csMesaChips($("mesa-turnos"), CS_MESA_TURNOS, csMesaCfg.turnos);
  csMesaChips($("mesa-temas"), CS_TEMAS, csMesaCfg.tema, (v) => tr(CS_NOMES_TEMAS[v]));
}

function csMesaLerTimes() {
  $("mesa-times").querySelectorAll("[data-i]").forEach((inp) => (csMesaCfg.times[Number(inp.dataset.i)] = inp.value));
}

function csMesaComecar() {
  csMesaLerTimes();
  store("mesa", { ...csMesaCfg, times: csMesaCfg.times.map((n) => n.trim()) });
  const nomes = csMesaCfg.times.map((n, i) => n.trim() || t("mesa.team", { n: i + 1 }));
  csMesa = csMesaNova({ times: nomes, turnos: csMesaCfg.turnos, tema: csMesaCfg.tema });
  csMesaVez();
  show("mesa-vez");
}

function csMesaPlacarHtml() {
  const ord = csMesa.times.map((x, i) => ({ ...x, i })).sort((a, b) => b.pontos - a.pontos || a.i - b.i);
  ord.forEach((x, k) => (x.pos = k && ord[k - 1].pontos === x.pontos ? ord[k - 1].pos : k + 1));
  return ord.map((x) => `<li class="${x.pos === 1 ? "first" : ""}"><span class="pos">${x.pos}º</span><b>${escapeHtml(x.nome)}</b><span>${escapeHtml(csMesaPts(x.pontos))}</span></li>`).join("");
}

function csMesaVez() {
  if (!csMesa) return;
  $("mesa-rodada").textContent = t("mesa.round", { a: csMesa.turno + 1, b: csMesa.turnos });
  $("mesa-vez").textContent = t("mesa.turnOf", { nome: csMesa.times[csMesa.vez].nome });
  $("mesa-placar").innerHTML = csMesaPlacarHtml();
}

function csMesaTurno() {
  csMesaProxCarta(csMesa);
  csMesa.feitas = [];
  csMesaFim = Date.now() + csMesaCfg.tempo * 1000;
  show("mesa-jogo");
  csMesaCarta();
  clearInterval(csMesaTimer);
  csMesaTimer = setInterval(csMesaTique, 200);
  csMesaTique();
}

function csMesaCarta() {
  if (!csMesa || !csMesa.atual) return;
  const txt = csTxt(csCarta(csMesa.atual));
  $("mesa-quem").textContent = csMesa.times[csMesa.vez].nome;
  $("mesa-palavra").textContent = txt[0];
  $("mesa-proibidas").innerHTML = txt.slice(1).map((d) => `<li>${escapeHtml(d)}</li>`).join("");
  const pts = csMesa.feitas.reduce((n, f) => n + (f.r === "acertou" ? 1 : f.r === "proibida" ? -1 : 0), 0);
  $("mesa-turno-pts").textContent = (pts > 0 ? "+" : "") + pts;
}

function csMesaTique() {
  const resta = Math.max(0, csMesaFim - Date.now());
  const s = Math.ceil(resta / 1000);
  $("mesa-relogio").textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  $("mesa-relogio").classList.toggle("pouco", s <= 10);
  if (resta <= 0) csMesaAcabouTempo();
}

function csMesaMarcarAgora(r) {
  if (!csMesa || document.body.dataset.screen !== "mesa-jogo") return;
  csMesaMarcar(csMesa, r);
  if (r === "proibida" && navigator.vibrate) navigator.vibrate(200);
  csMesaCarta();
  const c = document.querySelector(".mesa-carta");
  c.classList.remove("pop");
  void c.offsetWidth;
  c.classList.add("pop");
}

function csMesaAcabouTempo() {
  clearInterval(csMesaTimer);
  if (navigator.vibrate) navigator.vibrate([300, 100, 300]);
  const feitas = csMesa.feitas.slice();
  const time = csMesa.times[csMesa.vez].nome;
  const pts = feitas.reduce((n, f) => n + (f.r === "acertou" ? 1 : f.r === "proibida" ? -1 : 0), 0);
  const acabou = csMesaFimDoTurno(csMesa);
  $("mesa-turno-res").textContent = t("mesa.turnPts", { nome: time, n: (pts > 0 ? "+" : "") + pts });
  $("mesa-feitas").innerHTML = feitas.map((f) => {
    const txt = csTxt(csCarta(f.id));
    const sinal = f.r === "acertou" ? "+1" : f.r === "proibida" ? "−1" : "0";
    return `<li class="${f.r === "acertou" ? "ok" : "no"}"><span>${escapeHtml(txt[0])}<em>${escapeHtml(t(f.r === "acertou" ? "mesa.right" : f.r === "proibida" ? "mesa.taboo" : "mesa.skip"))}</em></span><b>${sinal}</b></li>`;
  }).join("");
  $("mesa-proximo").textContent = t(acabou ? "mesa.end" : "mesa.next");
  show("mesa-turno");
}

function csMesaProximo() {
  if (!csMesa) return irInicio();
  if (csMesa.fim) {
    const st = { partidas: 0, pontos: 0, recorde: 0, online: 0, ...(store("stats") || {}) };
    st.partidas += 1;
    st.mesa = (st.mesa || 0) + 1;
    store("stats", st);
    csMesaFinal();
    return show("mesa-fim");
  }
  csMesaVez();
  show("mesa-vez");
}

function csMesaFinal() {
  if (!csMesa) return;
  const max = Math.max(...csMesa.times.map((x) => x.pontos));
  const venc = csMesa.times.filter((x) => x.pontos === max);
  $("mesa-vencedor").textContent = venc.length === 1 ? t("mesa.won", { nome: venc[0].nome }) : t("mesa.tie");
  $("mesa-final").innerHTML = csMesaPlacarHtml();
}

function csMesaSair() {
  clearInterval(csMesaTimer);
  csMesa = null;
  irInicio();
}
