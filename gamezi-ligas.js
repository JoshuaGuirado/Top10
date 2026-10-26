// Ligas entre amigos (ranking.html#ligas): um grupo com código e um ranking da semana (segunda a domingo) que soma o
// desafio do dia de todos os jogos; cada desafio vale de 0 a 100. Quem calcula e protege é o banco (gamezi_liga_*, em
// supabase/schema.sql); aqui só desenhamos. Precisa de gamezi-ranking.js (gameziCliente, gameziNick, gameziEsc) antes.
// Convite: ranking.html?liga=CODIGO. A liga escolhida fica em gz:liga.

var GZ_LIGA_TEXTOS = {
  titulo: ["Ligas com amigos", "Friend leagues", "Ligas con amigos"],
  sub: ["Ranking da semana (de segunda a domingo) só da turma, somando o desafio do dia de todos os jogos. Cada desafio vale até 100 pontos.",
    "A weekly ranking (Monday to Sunday) just for your group, adding up every game's daily challenge. Each challenge is worth up to 100 points.",
    "Ranking de la semana (de lunes a domingo) solo del grupo, sumando el desafío del día de todos los juegos. Cada desafío vale hasta 100 puntos."],
  off: ["As ligas aparecem quando o modo online está ligado.", "Leagues show up when online mode is on.", "Las ligas aparecen cuando el modo online está activo."],
  carregando: ["Carregando as ligas…", "Loading leagues…", "Cargando las ligas…"],
  erro: ["Não deu para falar com o servidor. Tente de novo.", "Couldn't reach the server. Try again.", "No se pudo conectar con el servidor. Inténtalo de nuevo."],
  nenhuma: ["Você ainda não está em nenhuma liga. Crie uma e mande o código para a turma.", "You're not in any league yet. Create one and send the code to your friends.", "Todavía no estás en ninguna liga. Crea una y manda el código al grupo."],
  seuNome: ["Seu nome na liga", "Your name in the league", "Tu nombre en la liga"],
  nomeLiga: ["Nome da liga (ex.: Los Halcones)", "League name (e.g. The Hawks)", "Nombre de la liga (ej.: Los Halcones)"],
  criar: ["Criar liga", "Create league", "Crear liga"],
  codigo: ["Código da liga", "League code", "Código de la liga"],
  entrar: ["Entrar", "Join", "Entrar"],
  convite: ["Você foi convidado para a liga {cod}.", "You've been invited to league {cod}.", "Te invitaron a la liga {cod}."],
  convidar: ["Convidar", "Invite", "Invitar"],
  copiado: ["Link copiado!", "Link copied!", "¡Enlace copiado!"],
  conviteTexto: ["Entra na minha liga do Gamezi ({nome}): {url}", "Join my Gamezi league ({nome}): {url}", "Entra en mi liga de Gamezi ({nome}): {url}"],
  sair: ["Sair da liga", "Leave league", "Salir de la liga"],
  sairConfirma: ["Sair da liga {nome}?", "Leave {nome}?", "¿Salir de la liga {nome}?"],
  semana: ["Semana de {a} a {b}", "Week of {a} to {b}", "Semana del {a} al {b}"],
  membros: ["{n} na liga", "{n} in the league", "{n} en la liga"],
  desafios: ["{n} desafios", "{n} challenges", "{n} desafíos"],
  desafio1: ["1 desafio", "1 challenge", "1 desafío"],
  vazio: ["Ninguém fez desafio do dia nesta semana ainda.", "Nobody has played a daily challenge this week yet.", "Nadie hizo un desafío del día esta semana todavía."],
  voce: ["você", "you", "tú"],
};

function gzLigaT(chave, l, vars) {
  var i = ["pt", "en", "es"].indexOf(l);
  var s = GZ_LIGA_TEXTOS[chave][i < 0 ? 0 : i];
  for (var k in vars || {}) s = s.split("{" + k + "}").join(vars[k]);
  return s;
}

function gzLigaLer(k) {
  try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; }
}

function gzLigaGuardar(k, v) {
  try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* vale só agora */ }
}

// Segunda-feira desta semana e o domingo, como "26/10" (o banco usa o horário de Brasília; aqui é só o rótulo).
function gzLigaSemana(l) {
  var d = new Date();
  var seg = new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7));
  var dom = new Date(seg.getFullYear(), seg.getMonth(), seg.getDate() + 6);
  var f = function (x) { return l === "en" ? (x.getMonth() + 1) + "/" + x.getDate() : String(x.getDate()).padStart(2, "0") + "/" + String(x.getMonth() + 1).padStart(2, "0"); };
  return gzLigaT("semana", l, { a: f(seg), b: f(dom) });
}

function gzLigaErro(e, l) {
  var m = e && e.message;
  return m && !/fetch|network|rede|offline/i.test(m) ? m : gzLigaT("erro", l);
}

// Desenha as ligas em box. l: idioma. Devolve uma promessa (para os testes esperarem).
function gameziLigasDesenhar(box, l) {
  var cab = "<h2>" + gameziEsc(gzLigaT("titulo", l)) + '</h2><p class="muted small">' + gameziEsc(gzLigaT("sub", l)) + "</p>";
  if (!gameziRankingLigado()) {
    box.innerHTML = cab + '<p class="muted">' + gameziEsc(gzLigaT("off", l)) + "</p>";
    return Promise.resolve(null);
  }
  box.innerHTML = cab + '<p class="small muted">' + gameziEsc(gzLigaT("carregando", l)) + "</p>";
  var convite = (new URLSearchParams(location.search).get("liga") || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  var sb;
  return gameziCliente(true).then(function (c) {
    sb = c;
    return sb.rpc("gamezi_minhas_ligas");
  }).then(function (r) {
    if (r.error) throw new Error(r.error.message);
    var ligas = r.data || [];
    var escolhida = gzLigaLer("gz:liga");
    if (!ligas.some(function (x) { return x.codigo === escolhida; })) escolhida = ligas.length ? ligas[ligas.length - 1].codigo : null;
    var jaEsta = ligas.some(function (x) { return x.codigo === convite; });
    if (jaEsta) escolhida = convite;
    var nick = gameziNick(gzLigaLer("gz:nick"));
    var campoNome = '<input class="lb-input liga-nick" maxlength="16" autocomplete="nickname" required value="' + gameziEsc(nick) + '" placeholder="' +
      gameziEsc(gzLigaT("seuNome", l)) + '" aria-label="' + gameziEsc(gzLigaT("seuNome", l)) + '">';
    var html = cab;
    if (convite.length === 6 && !jaEsta) {
      html += '<form class="liga-convite" data-acao="convite"><p><b>' + gameziEsc(gzLigaT("convite", l, { cod: convite })) + "</b></p>" + campoNome +
        '<button type="submit" class="btn">' + gameziEsc(gzLigaT("entrar", l)) + "</button></form>";
    }
    if (ligas.length) {
      html += '<div class="liga-abas" role="tablist">' + ligas.map(function (x) {
        return '<button type="button" role="tab" class="rank-tab" data-liga="' + gameziEsc(x.codigo) + '" aria-selected="' + (x.codigo === escolhida) + '">' + gameziEsc(x.nome) + "</button>";
      }).join("") + '</div><div class="liga-box" id="liga-box"></div>';
    } else if (!convite) {
      html += '<p class="muted">' + gameziEsc(gzLigaT("nenhuma", l)) + "</p>";
    }
    html += '<details class="liga-nova"' + (ligas.length ? "" : " open") + "><summary>" + gameziEsc(gzLigaT("criar", l)) + " · " + gameziEsc(gzLigaT("entrar", l)) + "</summary>" +
      '<form class="liga-form" data-acao="criar"><input class="lb-input liga-nome" maxlength="24" required placeholder="' + gameziEsc(gzLigaT("nomeLiga", l)) + '" aria-label="' +
      gameziEsc(gzLigaT("nomeLiga", l)) + '">' + campoNome + '<button type="submit" class="btn">' + gameziEsc(gzLigaT("criar", l)) + "</button></form>" +
      '<form class="liga-form" data-acao="entrar"><input class="lb-input liga-codigo" maxlength="6" required autocapitalize="characters" placeholder="' + gameziEsc(gzLigaT("codigo", l)) +
      '" aria-label="' + gameziEsc(gzLigaT("codigo", l)) + '">' + campoNome + '<button type="submit" class="btn ghost">' + gameziEsc(gzLigaT("entrar", l)) + "</button></form></details>" +
      '<p class="feedback bad liga-msg" role="status"></p>';
    box.innerHTML = html;

    var msg = box.querySelector(".liga-msg");
    var entrarEm = function (cod, nome) {
      gzLigaGuardar("gz:nick", nome);
      return sb.rpc("gamezi_liga_entrar", { p_codigo: cod, p_nick: nome }).then(function (r2) {
        if (r2.error) throw new Error(r2.error.message);
        gzLigaGuardar("gz:liga", cod.toUpperCase());
        if (convite) history.replaceState(null, "", location.pathname + "#ligas");
        return gameziLigasDesenhar(box, l);
      });
    };
    box.querySelectorAll("form[data-acao]").forEach(function (f) {
      f.onsubmit = function (e) {
        e.preventDefault();
        var nome = f.querySelector(".liga-nick").value.trim().slice(0, 16);
        if (!nome) return f.querySelector(".liga-nick").focus();
        msg.textContent = "";
        var feito;
        if (f.dataset.acao === "convite") feito = entrarEm(convite, nome);
        else if (f.dataset.acao === "entrar") feito = entrarEm(f.querySelector(".liga-codigo").value.trim().toUpperCase(), nome);
        else {
          gzLigaGuardar("gz:nick", nome);
          feito = sb.rpc("gamezi_liga_criar", { p_nome: f.querySelector(".liga-nome").value.trim(), p_nick: nome }).then(function (r2) {
            if (r2.error) throw new Error(r2.error.message);
            gzLigaGuardar("gz:liga", r2.data);
            return gameziLigasDesenhar(box, l);
          });
        }
        feito.catch(function (err) { msg.textContent = gzLigaErro(err, l); });
      };
    });
    box.querySelectorAll("[data-liga]").forEach(function (b) {
      b.onclick = function () {
        gzLigaGuardar("gz:liga", b.dataset.liga);
        box.querySelectorAll("[data-liga]").forEach(function (x) { x.setAttribute("aria-selected", x === b); });
        gzLigaRanking(sb, ligas.filter(function (x) { return x.codigo === b.dataset.liga; })[0], l, box);
      };
    });
    if (escolhida) return gzLigaRanking(sb, ligas.filter(function (x) { return x.codigo === escolhida; })[0], l, box);
    return null;
  }).catch(function (e) {
    box.innerHTML = cab + '<p class="muted">' + gameziEsc(gzLigaErro(e, l)) + "</p>";
    return null;
  });
}

function gzLigaRanking(sb, liga, l, raiz) {
  var box = raiz.querySelector("#liga-box");
  var url = location.origin + location.pathname + "?liga=" + liga.codigo;
  box.innerHTML = '<div class="liga-head"><div><b>' + gameziEsc(liga.nome) + "</b><small>" + gameziEsc(liga.codigo) + " · " + gameziEsc(gzLigaT("membros", l, { n: liga.membros })) +
    " · " + gameziEsc(gzLigaSemana(l)) + '</small></div><button type="button" class="btn liga-convidar">' + gameziEsc(gzLigaT("convidar", l)) + "</button></div>" +
    '<div class="leaderboard liga-lb"><p class="small muted">' + gameziEsc(gzLigaT("carregando", l)) + '</p></div><button type="button" class="link-btn liga-sair">' + gameziEsc(gzLigaT("sair", l)) + "</button>";
  box.querySelector(".liga-convidar").onclick = function (e) {
    var b = e.currentTarget, texto = gzLigaT("conviteTexto", l, { nome: liga.nome, url: url });
    if (navigator.share && matchMedia("(hover: none)").matches) return navigator.share({ text: texto }).catch(function () {});
    if (navigator.clipboard) navigator.clipboard.writeText(texto).then(function () {
      var antes = b.textContent;
      b.textContent = gzLigaT("copiado", l);
      setTimeout(function () { b.textContent = antes; }, 1800);
    }, function () {});
  };
  box.querySelector(".liga-sair").onclick = function () {
    if (!confirm(gzLigaT("sairConfirma", l, { nome: liga.nome }))) return;
    sb.rpc("gamezi_liga_sair", { p_codigo: liga.codigo }).then(function () { gameziLigasDesenhar(raiz, l); });
  };
  return sb.rpc("gamezi_liga_ranking", { p_codigo: liga.codigo }).then(function (r) {
    if (r.error) throw new Error(r.error.message);
    var linhas = r.data || [];
    var alguem = linhas.some(function (x) { return x.desafios > 0; });
    box.querySelector(".liga-lb").innerHTML = linhas.map(function (x) {
      var d = Number(x.desafios);
      return '<div class="lb-row' + (x.eu ? " me" : "") + '"><span>' + Number(x.posicao) + "</span><b>" + gameziEsc(x.nick) +
        (x.eu ? ' <small class="muted">(' + gameziEsc(gzLigaT("voce", l)) + ")</small>" : "") + "</b><small class=\"muted\">" +
        gameziEsc(d === 1 ? gzLigaT("desafio1", l) : gzLigaT("desafios", l, { n: d })) + "</small><em>" + Number(x.pontos) + "</em></div>";
    }).join("") + (alguem ? "" : '<p class="small muted">' + gameziEsc(gzLigaT("vazio", l)) + "</p>");
  }).catch(function (e) {
    box.querySelector(".liga-lb").innerHTML = '<p class="small muted">' + gameziEsc(gzLigaErro(e, l)) + "</p>";
  });
}
