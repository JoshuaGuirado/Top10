// Conta do Gamezi: uma conta só para a plataforma e todos os jogos (um único projeto do Supabase).
// Entrar, criar conta, trocar senha e sair ficam em conta.html, na raiz. O portal e os jogos só leem
// a sessão que o Supabase guarda neste navegador e, para entrar ou mexer na conta, mandam a pessoa
// para conta.html com ?volta=<pasta do jogo>, que a traz de volta para o jogo depois do login.

var GAMEZI_JOGOS = ["topzi", "patozi"];

// Sessão salva pelo Supabase neste navegador: { email, anon } ou null. Não precisa carregar a biblioteca.
function gameziSessao() {
  try {
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (!/^sb-.+-auth-token$/.test(k)) continue;
      var s = JSON.parse(localStorage.getItem(k));
      var u = s && s.user;
      if (u) return { email: u.email || null, anon: !!u.is_anonymous || !u.email };
    }
  } catch (e) { /* sem armazenamento */ }
  return null;
}

// Tem conta conectada (e-mail e senha), não só o login anônimo usado para jogar online.
function gameziLogado() {
  var s = gameziSessao();
  return !!(s && !s.anon);
}

// Endereço da página da conta. raiz: caminho até a raiz do site ("" no portal, "../" nos jogos).
function gameziContaUrl(raiz, volta) {
  return raiz + "conta.html" + (GAMEZI_JOGOS.indexOf(volta) >= 0 ? "?volta=" + volta : "");
}

// Chegou num jogo por um link do e-mail (nova senha, confirmação): quem cuida disso é a conta.html.
function gameziRetornoDoLogin(raiz) {
  if (!/access_token|error_description|type=recovery/.test(location.hash)) return false;
  location.replace(raiz + "conta.html" + location.hash);
  return true;
}
