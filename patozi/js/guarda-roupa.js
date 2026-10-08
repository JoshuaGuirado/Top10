// Guarda-roupa do pato: cor, chapéu, rosto, roupa e item na asa.
// Aparece em dois lugares com o mesmo desenho: no Perfil (o seu pato, que vai para a conta) e numa janela que
// abre ao tocar no pato de um jogador, na tela de jogadores (qualquer um, inclusive o computador) e na sala
// online (só o seu). Os itens e o desenho ficam em visual.js (PZ_VISUAL e patoSvg).

// Guarda-roupas abertos: id do elemento → { aba, ler() → { cor, pato }, gravar(cor, pato) }.
const closets = {};

function meuPato() {
  return patoLimpo(store("pato") || {});
}

function ligarCloset(id, ler, gravar) {
  closets[id] = { aba: (closets[id] && closets[id].aba) || "cor", ler, gravar };
  $(id).onclick = (e) => closetClick(id, e);
  renderCloset(id);
}

function renderCloset(id) {
  const c = closets[id];
  const root = $(id);
  const { cor, pato } = c.ler();
  const previa = root.querySelector(".closet-preview");
  if (previa) previa.innerHTML = patoSvg(cor, "happy", pato);
  const abas = [{ id: "cor", nome: t("closet.color") }, ...PZ_VISUAL.map((cat) => ({ id: cat.id, nome: tr(cat.nome) }))];
  root.querySelector(".closet-tabs").innerHTML = abas.map((a) =>
    `<button type="button" class="chip ${a.id === c.aba ? "active" : ""}" data-aba="${a.id}" aria-pressed="${a.id === c.aba}">${escapeHtml(a.nome)}</button>`).join("");
  let opcoes;
  if (c.aba === "cor") {
    opcoes = PZ_CORES.map((_, i) => ({ valor: i, ativo: i === cor, nome: t("closet.colorN", { n: i + 1 }), svg: patoSvg(i, "", pato) }));
  } else {
    const cat = PZ_VISUAL.find((x) => x.id === c.aba);
    const prog = typeof gameziProgresso === "function" ? gameziProgresso() : null;
    opcoes = [{ id: "", nome: t("closet.none") }, ...cat.itens.map((it) => ({ id: it.id, nome: tr(it.nome) }))].map((o) => {
      // Item de conquista ainda não liberada: aparece com cadeado e diz como liberar.
      const conquista = o.id && prog && !gameziItemLiberado(prog, cat.id, o.id) ? gameziConquistaDoItem(cat.id, o.id) : null;
      return {
        valor: o.id,
        nome: o.nome,
        ativo: (pato[cat.id] || "") === o.id,
        trancado: conquista ? tr(conquista.como) : "",
        svg: patoSvg(cor, "", { ...pato, [cat.id]: o.id }),
      };
    });
  }
  root.querySelector(".closet-grid").innerHTML = opcoes.map((o) => o.trancado ? `
    <button type="button" class="closet-item locked" disabled title="${escapeHtml(o.trancado)}">
      ${o.svg}<span>${escapeHtml(o.nome)}</span><small>${UI_ICONS.lock || ""}${escapeHtml(o.trancado)}</small>
    </button>` : `
    <button type="button" class="closet-item ${o.ativo ? "active" : ""}" data-valor="${o.valor}" aria-pressed="${o.ativo}">
      ${o.svg}<span>${escapeHtml(o.nome)}</span>
    </button>`).join("");
}

function closetClick(id, e) {
  const c = closets[id];
  const aba = e.target.closest("[data-aba]");
  if (aba) {
    c.aba = aba.dataset.aba;
    return renderCloset(id);
  }
  const { cor, pato } = c.ler();
  const acao = e.target.closest("[data-closet]");
  const item = e.target.closest("[data-valor]");
  if (acao && acao.dataset.closet === "sortear") c.gravar(Math.floor(Math.random() * PZ_CORES.length), patoSorteado());
  else if (acao && acao.dataset.closet === "tirar") c.gravar(cor, {});
  else if (item && c.aba === "cor") c.gravar(Number(item.dataset.valor), pato);
  else if (item) {
    const novo = { ...pato };
    if (item.dataset.valor) novo[c.aba] = item.dataset.valor;
    else delete novo[c.aba];
    c.gravar(cor, novo);
  } else return;
  sfx.tick();
  renderCloset(id);
}

// ───────────── o seu pato, no Perfil ─────────────

function ligarClosetDoPerfil() {
  ligarCloset("closet", () => ({ cor: minhaCor(), pato: meuPato() }), (cor, pato) => {
    store("cor", cor);
    store("pato", patoLimpo(pato));
    aoMudarVisual();
  });
}

// A cor ou o visual do seu pato mudou: vale também para você na tela de jogadores.
function aoMudarVisual() {
  if (jogadores[0] && !jogadores[0].bot) {
    jogadores[0].cor = minhaCor();
    store("jogadores", jogadores);
  }
  $("profile-duck").innerHTML = patoSvg(minhaCor(), "happy", meuPato());
}

// ───────────── janela: vestir o pato de um jogador ─────────────

// visual: { cor, pato } de quem vai ser vestido; aoMudar(cor, pato) é chamado a cada troca.
function abrirGuardaRoupa(nome, visual, aoMudar) {
  let atual = { cor: visual.cor || 0, pato: patoLimpo(visual.pato || {}) };
  $("closet-dialog-title").textContent = t("closet.of", { nome });
  ligarCloset("closet-dialog", () => atual, (cor, pato) => {
    atual = { cor, pato: patoLimpo(pato) };
    aoMudar(atual.cor, atual.pato);
  });
  $("closet-dialog").showModal();
}
