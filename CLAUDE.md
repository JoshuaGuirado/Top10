# Top Ten — instruções para o Claude

- Responder em português.
- Ao terminar uma mudança: commit na branch de trabalho e, em seguida, levar o mesmo commit para a `main`
  (o dono pediu que tudo que for feito vá sempre para o código principal). Sem PR, a menos que ele peça.
- Projeto estático (HTML/CSS/JS puro, sem build, abre direto pelo arquivo). Os scripts são comuns
  (não são módulos ES) e compartilham variáveis globais; a ordem de carga está no fim do `index.html`.
- Script novo em `js/` ou `data/`: incluir no `index.html` **e** na lista `FILES` do `sw.js`
  (o teste `tests/arquivos.test.js` acusa se faltar).
- Antes de enviar: `npm test` e testar o fluxo no navegador (Playwright com o Chromium do ambiente).
