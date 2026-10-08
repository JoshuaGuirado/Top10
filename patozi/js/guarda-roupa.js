// Guarda-roupa do Perfil: cor e visual do seu pato (chapéu, rosto, roupa e item na asa).
// O visual fica em store("pato"), vai para a conta e aparece na partida, no resultado e na sala online.
// Os itens e o desenho ficam em visual.js (PZ_VISUAL e patoSvg).

let closetAba = "cor";

function meuPato() {
  return patoLimpo(store("pato") || {});
}

// Algo mudou na cor ou no visual: redesenha o pato grande e as opções.
function aoMudarVisual() {
  if (jogadores[0] && !jogadores[0].bot) {
    jogadores[0].cor = minhaCor();
    store("jogadores", jogadores);
  }
  $("profile-duck").innerHTML = patoSvg(minhaCor(), "happy", meuPato());
  renderGuardaRoupa();
  sfx.tick();
}

function renderGuardaRoupa() {
  const pato = meuPato();
  const cor = minhaCor();
  const abas = [{ id: "cor", nome: t("closet.color") }, ...PZ_VISUAL.map((c) => ({ id: c.id, nome: tr(c.nome) }))];
  $("closet-tabs").innerHTML = abas.map((a) =>
    `<button type="button" class="chip ${a.id === closetAba ? "active" : ""}" data-aba="${a.id}" aria-pressed="${a.id === closetAba}">${escapeHtml(a.nome)}</button>`).join("");
  let opcoes;
  if (closetAba === "cor") {
    opcoes = PZ_CORES.map((_, i) => ({ valor: i, ativo: i === cor, nome: t("closet.colorN", { n: i + 1 }), svg: patoSvg(i, "", pato) }));
  } else {
    const cat = PZ_VISUAL.find((c) => c.id === closetAba);
    opcoes = [{ id: "", nome: t("closet.none") }, ...cat.itens.map((it) => ({ id: it.id, nome: tr(it.nome) }))].map((o) => ({
      valor: o.id,
      nome: o.nome,
      ativo: (pato[cat.id] || "") === o.id,
      svg: patoSvg(cor, "", { ...pato, [cat.id]: o.id }),
    }));
  }
  $("closet-grid").innerHTML = opcoes.map((o) => `
    <button type="button" class="closet-item ${o.ativo ? "active" : ""}" data-valor="${o.valor}" aria-pressed="${o.ativo}">
      ${o.svg}<span>${escapeHtml(o.nome)}</span>
    </button>`).join("");
}

function closetClick(e) {
  const aba = e.target.closest("[data-aba]");
  if (aba) {
    closetAba = aba.dataset.aba;
    return renderGuardaRoupa();
  }
  const item = e.target.closest("[data-valor]");
  if (!item) return;
  if (closetAba === "cor") store("cor", Number(item.dataset.valor));
  else {
    const pato = meuPato();
    if (item.dataset.valor) pato[closetAba] = item.dataset.valor;
    else delete pato[closetAba];
    store("pato", pato);
  }
  aoMudarVisual();
}

function sortearVisual() {
  store("pato", patoSorteado());
  store("cor", Math.floor(Math.random() * PZ_CORES.length));
  aoMudarVisual();
}

function tirarVisual() {
  store("pato", {});
  aoMudarVisual();
}
