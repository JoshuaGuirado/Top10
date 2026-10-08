# Gamezi (plataforma), Topzi e Patozi (jogos) — instruções para o Claude

- Responder em português.
- Ao terminar uma mudança: commit na branch de trabalho e, em seguida, levar o mesmo commit para a `main`
  (o dono pediu que tudo que for feito vá sempre para o código principal). Sem PR, a menos que ele peça.
- Projeto estático (HTML/CSS/JS puro, sem build, abre direto pelo arquivo). A raiz é o portal do **Gamezi**
  (`index.html`, `gamezi.css`); cada jogo fica numa pasta — o Topzi está em `topzi/` e o Patozi em `patozi/`. Imagens da marca ficam em
  `brand/` (na raiz; o Topzi usa `../brand/…`). Termos, privacidade e manual de marca são do Gamezi.
- No Topzi, os scripts são comuns (não são módulos ES) e compartilham variáveis globais; a ordem de carga está
  no fim do `topzi/index.html`.
- Script novo em `topzi/js/` ou `topzi/data/`: incluir no `topzi/index.html` **e** na lista `FILES` do `sw.js`
  da raiz, com o caminho `topzi/…` (o teste `tests/arquivos.test.js` acusa se faltar).
- Antes de enviar: `npm test` e testar o fluxo no navegador (Playwright com o Chromium do ambiente).
- Mexeu no online (`topzi/js/online.js`, `patozi/js/online.js`, partida ou resultado)? Rode também `npm run test:online`
  (duas abas com o Supabase falso de `tests/supabase-falso.js`, para os dois jogos). Mudou o banco? Atualize `supabase/schema.sql` (precisa poder rodar de novo).
- Listas novas de 10 itens: entram no fim (arquivo novo carregado depois dos outros) e precisam de uma linha
  nova em `DAILY_POOLS` (`topzi/js/diaria.js`) valendo a partir de amanhã, senão a lista do dia de hoje muda.
- Lista oficial nova precisa do título em inglês e espanhol em `topzi/data/traducoes-titulos.js` (o teste
  `tests/traducoes.test.js` acusa). Itens com nome diferente em outro idioma vão em `topzi/data/traducoes-itens-*.js`;
  nome com dois sentidos (Lula, Peru, Natal…) usa a chave `"id-da-lista/Nome"`.
- Links antigos na raiz (`?sala=`, `#lista=`, `#como-jogar`, retorno do login) são mandados para `topzi/` por um
  script no `<head>` do `index.html` da raiz; não remova.
- Patozi: scripts comuns como no Topzi (ordem no fim do `patozi/index.html`); script novo também vai no `FILES` do
  `sw.js` com o caminho `patozi/…` (o `tests/patozi.test.js` acusa). Regras e computador ficam em `patozi/js/jogo.js`, sem tela.
- Cartas novas do Patozi: arquivo novo em `patozi/data/` carregado depois dos outros, pergunta em português, inglês e
  espanhol, resposta inteira (ano com `"ano"` no fim) e uma linha nova em `PZ_DIARIO_POOLS` valendo a partir de amanhã.
  Número que muda com o tempo leva a data na pergunta ("até 2022").
- O Patozi usa o mesmo Supabase do Topzi (chaves em `topzi/js/config.js`) e tabelas próprias `patozi_*`. Nunca mexa no
  `topzi/` por causa do Patozi.
