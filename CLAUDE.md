# Gamezi (plataforma), Topzi, Patozi, Datazi, Maiorzi, Cravazi, Tamanhozi, Emojizi, Contazi e Memorizi (jogos) — instruções para o Claude

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
  (duas abas com o Supabase falso de `tests/supabase-falso.js`, para os dois jogos). Mudou o banco? Só no `supabase/schema.sql` (um script só, que precisa poder rodar de novo; nada de script parcial) e rode
  `sh tests/banco.sh` se tiver Postgres (o GitHub roda sozinho). O dono atualiza o Supabase colando o `schema.sql` inteiro.
- Listas novas de 10 itens: entram no fim (arquivo novo carregado depois dos outros) e precisam de uma linha
  nova em `DAILY_POOLS` (`topzi/js/diaria.js`) valendo a partir de amanhã, senão a lista do dia de hoje muda.
- Lista oficial nova precisa do título em inglês e espanhol em `topzi/data/traducoes-titulos.js` (o teste
  `tests/traducoes.test.js` acusa). Itens com nome diferente em outro idioma vão em `topzi/data/traducoes-itens-*.js`;
  nome com dois sentidos (Lula, Peru, Natal…) usa a chave `"id-da-lista/Nome"`.
- Links antigos na raiz (`?sala=`, `#lista=`, `#como-jogar`) são mandados para `topzi/` por um script no `<head>` do
  `index.html` da raiz; o retorno do login (links do e-mail) vai para `conta.html`. Não remova.
- A conta é do **Gamezi**, uma só para todos os jogos: entrar, criar conta, esqueci/trocar senha e sair ficam só em
  `conta.html` (raiz). Os jogos não têm tela de login: leem a sessão com `gamezi-conta.js` e mandam para
  `conta.html?volta=<jogo>`. Jogo novo: carregar `../gamezi-conta.js`, pôr a pasta em `GAMEZI_JOGOS` e em `JOGOS` da `conta.html`.
- Portal (`index.html`): os jogos ficam numa grade (`.game-grid`; 3 por linha no celular, para caber sem rolar). Jogo novo: cartão
  no fim da grade com frase curta nos 3 idiomas (`<jogo>Kind`) e `<small class="game-daily" data-jogo="<jogo>">`; o dia 1 do
  desafio do dia fica em `GAMEZI_INICIO` (`gamezi-conta.js`), que também dá o ✓ de feito hoje e a 🔥 sequência do portal. O
  `tests/todos-os-jogos.e2e.js` (no `npm run test:online`) confere em todos os jogos: sala online com skin, ranking e portal.
- Patozi: scripts comuns como no Topzi (ordem no fim do `patozi/index.html`); script novo também vai no `FILES` do
  `sw.js` com o caminho `patozi/…` (o `tests/patozi.test.js` acusa). Regras e computador ficam em `patozi/js/jogo.js`, sem tela.
  Na partida, "Chutar" e "Nem a pato!" ficam separados
  (bloco do chute, "ou", botão amarelo) e o placar escreve "X patos" e "N de M cartas": o dono pediu por causa de confusão.
- Cartas do Patozi precisam ser **difíceis**: recorde, peso, altura, distância, quantidade que ninguém sabe de cabeça
  (nada de "quantas patas tem a aranha" ou "quantas estrelas tem a bandeira"). As óbvias antigas ficam em
  `patozi/data/aposentadas.js` (fora do sorteio; não apague linhas dos `cartas-*.js`, os ids mudariam).
- Cartas novas do Patozi (a última é `cartas-7.js`): arquivo novo em `patozi/data/` carregado depois dos outros, pergunta em português, inglês e
  espanhol, resposta inteira (ano com `"ano"` no fim) e uma linha nova em `PZ_DIARIO_POOLS` valendo a partir de amanhã.
  Número que muda com o tempo leva a data na pergunta ("até 2022").
- Mudou carta do Patozi (nova ou resposta)? Rode `node supabase/gerar-respostas.js` e mande o `supabase/patozi-respostas.sql`
  para rodar no Supabase: o banco calcula os pontos do Pato do dia com essas respostas (o `tests/patozi.test.js` acusa).
- Rankings do dia (`topzi_diario`, `patozi_diario`, `cravazi_diario`…) só recebem resultado pelas funções `*_registrar_diario` do banco.
- Ligas entre amigos (`gamezi-ligas.js`, aba "👥 Ligas" do `ranking.html`; convite `ranking.html?liga=CODIGO`): ranking da semana
  (segunda a domingo) somando o desafio do dia de todos os jogos, cada um de 0 a 100 (pontos ÷ máximo do jogo, na função
  `gamezi_liga_ranking` do banco). Tabelas `gamezi_ligas`/`gamezi_liga_membros` só pelas funções `gamezi_liga_*`. Jogo novo
  com desafio do dia: pôr o dia 1 e o máximo em `gamezi_liga_ranking` e na visão `gamezi_uso` (schema.sql) e no
  `tests/supabase-falso.js`. Métricas: `gameziEvento` (Vercel) e a visão `gamezi_uso` (painel do Supabase).
- Desafio do dia de qualquer jogo: sem nome para o ranking, o nome é pedido **antes** de começar (`gameziNomeAntesDoDia`, em
  `gamezi-ranking.js`). Nunca mandar "Jogador" ou "Pato" para o ranking; sem nome, não manda.
- Tabelas do banco sempre com o nome do jogo na frente: `topzi_*` (perfis, salas, sala_jogadores, partidas) e `patozi_*`.
- Datazi (`datazi/`): scripts comuns, ordem no fim do `datazi/index.html`; script novo vai no `FILES` do `sw.js` com o caminho
  `datazi/…` (o `tests/datazi.test.js` acusa). Acontecimento novo: no fim de `datazi/data/eventos.js` e linha nova em
  `DZ_DIARIO_POOLS` valendo a partir de amanhã (o Datazi do dia 1 está fixado no teste).
- Nível e conquistas (todos os jogos) ficam em `gamezi-conta.js`; jogo novo precisa entrar em `gameziDadosLocais`.
- O Patozi usa o mesmo Supabase do Topzi (chaves em `topzi/js/config.js`) e tabelas próprias `patozi_*`. Nunca mexa no
  `topzi/` por causa do Patozi.
- Maiorzi (antigo Maisoumenozi): a pasta `maisoumenozi/`, os arquivos `brand/maisoumenozi-*`, as tabelas `maisoumenozi_*`, o id
  `maisoumenozi` e as chaves `mm:*` continuam com o nome antigo (não quebra links, contas nem ranking); na tela é Maiorzi. Scripts comuns, ordem no fim do `maisoumenozi/index.html` (`js/jogo.js` antes de `data/`);
  script novo vai no `FILES` do `sw.js` com o caminho `maisoumenozi/…` (o `tests/maisoumenozi.test.js` acusa). Assunto ou item novo:
  arquivo novo em `maisoumenozi/data/` carregado depois dos outros (`mmTema`/`mmMais`), textos nos 3 idiomas, pelo menos 3 perguntas
  por assunto que não citem os nomes, e linha nova em `MM_DIARIO_POOLS` valendo a partir de amanhã (o dia 1 está fixado no teste
  e usa o gerador antigo `mmGeradorV1`, que não pode mudar). Comparação maluca nova: no fim de `data/uau-1.js` (ou arquivo novo),
  os dois valores na mesma unidade e com diferença clara, e o total novo em `uau` na linha nova de `MM_DIARIO_POOLS`.
  Número que muda com o tempo leva o ano no título do assunto ("(2024)"). Assunto novo precisa da pergunta curta em
  `data/perguntas.js` (verbo que serve para qualquer nome, sem "é mais alto": "mede mais ou menos de altura?") e botões "Mais"/"Menos".
  O dono quer a tela simples: referência, pergunta e dois botões. Nada de título de assunto, frases variadas ou enfeite na partida.
- Cravazi (`cravazi/`): de 2 a 8 pessoas com a turma (um celular) ou online, e o Cravazi do dia sozinho com ranking. Scripts comuns, ordem
  no fim do `cravazi/index.html` (`js/jogo.js` antes de `data/`); script novo vai no `FILES` do `sw.js` com o caminho `cravazi/…` (o
  `tests/cravazi.test.js` acusa). As skins são as do Topzi: o Cravazi carrega `../topzi/js/avatars.js` (que também tem os nomes das
  skins em inglês e espanhol) — não renomeie nada ali sem conferir o Cravazi. Online e Cravazi do dia usam o Supabase do Topzi
  (tabelas `cravazi_*`, rode `npm run test:online`). Pergunta nova: resposta inteira, nos 3 idiomas, difícil, que faça sentido sozinha
  (as perguntas são sorteadas), que não repita carta do Patozi e uma linha nova em `CZ_DIARIO_POOLS` valendo a partir de amanhã (o dia 1
  está fixado no teste). Tela simples: pergunta, "É MAIS"/"É MENOS", de quem é a vez e o campo do chute.
  Com a turma/online: 3 chutes de cada por rodada (`CZ_CHUTES_POR_JOGADOR`); ninguém cravou, ninguém pontua. Cravazi do dia:
  6 chutes por pergunta a partir do dia 6 (`czChutesDoDia`; os dias antigos continuam com 10).
- Datazi: 2 vidas (`DZ_VIDAS`); o Datazi do dia usa `dzVidasDoDia` (3 até o dia 6). Mudou regra de desafio do dia? Vale a partir
  de amanhã, como as listas. Três modos (`DZ_MODOS`): linha do tempo (o do dia), "Qual veio antes?" e "Em que ano?", na partida
  livre e no online (salas `datazi_*`, como no Tamanhozi; rode `npm run test:online`). O desafio do dia continua só na linha do tempo.
- Tamanhozi (`tamanhozi/`, antigo Mapazi; `mapazi/` só redireciona): ajustar o tamanho de uma coisa perto de outra (monumentos,
  pessoas e monstros, animais, veículos, objetos e países). Sozinho (desafio do dia com ranking e partida livre por tema) e online
  (todo mundo ajusta a mesma coisa; quem chegar mais perto leva 1 ponto; tabelas `tamanhozi_*`, rode `npm run test:online`).
  Scripts comuns, ordem no fim do `tamanhozi/index.html` (`js/jogo.js` antes de `data/`); script novo vai no `FILES` do `sw.js`
  (o `tests/tamanhozi.test.js` acusa). Dados gerados: `data/itens.js` por `ferramentas/gerar-tamanhozi.js` (animais do acervo
  de domínio público github.com/kazuhito84455/qgissvganimals; o resto desenhado no gerador com as medidas reais, para a proporção
  largura × altura ser a de verdade — o dono reclamou de proporção errada; nada de ícone de enfeite) e `data/paises.js` por
  `ferramentas/gerar-tamanhozi-paises.js` (Natural Earth, projeção de área igual). Item novo: no fim da lista `ITENS` do gerador
  (medida que todo mundo encontra; personagem com a obra no nome), gerar de novo e linha nova em `TZ_DIARIO_POOLS` valendo a partir
  de amanhã (o dia 1 está fixado no teste). Chaves `tm:*`.
- Música de fundo: `gamezi-musica.js` (raiz), feita na hora com Web Audio, sem arquivo de áudio; liga/desliga na linha "Música"
  que ela mesma põe no `#settings-dialog` (chave `tt:musica`, a mesma para todos). Jogo novo: carregar `../gamezi-musica.js`.
- Skin única do Gamezi (`gamezi-skins.js`, raiz): a mesma em todos os jogos, menos no Patozi (lá é o guarda-roupa do pato).
  Fica em `gz:skin` ({ presetId, avatar }); `gameziMinhaSkin()` lê (na 1ª vez aproveita a do Topzi ou do Cravazi) e
  `gameziGuardarSkin()` grava. A janela tem as prontas e o editor "Criar a minha"; a conta (`conta.html`) mostra e troca a skin
  e salva no perfil (`topzi_perfis.avatar`). No Topzi, o jogador 1 é a skin única (`savePlayers`); no Cravazi, `minhaSkin()`.
  Os bonecos são de `topzi/js/avatars.js` com visual 3D (degradês de luz em `renderAvatar`; desliga em `gz:3d`). Todo jogo
  carrega `../topzi/js/avatars.js` e `../gamezi-skins.js`; coluna `skin` em `<jogo>_sala_jogadores` (Topzi: `avatar`).
  Jogo novo precisa de online com skin.
- Maiorzi online (`maisoumenozi/js/online.js`, tabelas `maisoumenozi_*`): todo mundo responde a mesma comparação (15 s), acertou
  vale 1 (a maluca, 2); 10 rodadas sorteadas por `mmNovaOnline`. Usa os cartões da partida sozinho (`renderNormal`/`renderUau`).
- Emojizi (`emojizi/`), Contazi (`contazi/`) e Memorizi (`memorizi/`) são "jogos do kit": as telas (início, partida, resultado,
  online e sala), o desafio do dia com ranking, a partida livre (3 vidas) e o online com skin são de `gamezi-kit.js` +
  `gamezi-kit.css` (raiz); as rodadas (pontos de 50 a 100 pelo tempo) são de `gamezi-rodadas.js`. Cada jogo só tem `js/jogo.js`
  (regras, sem tela), `js/app.js` (desenha a rodada e chama `gzIniciar`) e `style.css`. O dia 1 dos três é 23/10/2026 e está fixado
  em `tests/jogos-novos.test.js`. Chaves: `ej:*`, `ct:*`, `mz:*`. Item novo no Emojizi: no fim de `emojizi/data/itens.js`, nos 3
  idiomas, e linha nova em `EJ_DIARIO_POOLS` valendo a partir de amanhã. Banco: tabelas `<jogo>_salas`, `_sala_jogadores`,
  `_partidas` e `_diario` (no `schema.sql`). Jogo novo do mesmo tipo: copiar um dos três.
- Temas dos jogos do kit (partida livre e sala online; `GZ.temas`, `store("tema")`, `settings.tema` da sala): Emojizi `EJ_TEMAS`
  (o `cat` de cada item; itens novos em `data/itens-2.js` ou arquivo novo, nos 3 idiomas, com linha nova em `EJ_DIARIO_POOLS`),
  Contazi `CT_TEMAS`/`CT_GERADORES` (toda conta dá inteiro ≥ 0; frase em [pt, en, es]; o testes confere) e Memorizi `MZ_TEMAS`
  (de 4 a 9 botões). O desafio do dia não usa tema: Contazi e Memorizi continuam com o misto e as 4 cores (o dia 1 está fixado).
- Fotozi (`fotozi/`), Censurazi (`censurazi/`) e Corzi (`corzi/`) também são jogos do kit (chaves `fz:*`, `cs:*`, `cr:*`; o dia 1 é
  26/10/2026, fixado em `tests/jogos-fotozi-censurazi-corzi.test.js`; banco no `schema.sql`).
  O kit aceita `GZ.quantias` (o anfitrião escolhe quantas rodadas na sala; Corzi 10/20/30, Fotozi 5/10/15) e `GZ.extra` (cartão e
  telas próprias no início: o "Na mesa" do Censurazi, em `censurazi/js/mesa.js`).
- Fotozi: as fotos NÃO ficam no repositório. Cada item é o título do artigo da Wikipédia em português (`fotozi/data/fotos-*.js`); o
  navegador busca a foto principal (licença livre) pela API da Wikipédia e mostra o crédito. Foto nova: título que existe no
  pt.wikipedia, nome nos 3 idiomas e apelidos, no FIM, com linha nova em `FZ_DIARIO_POOLS`. Cada erro afasta só um pouco a foto e
  tira só 10 pontos (o dono pediu assim). O zoom começa em 4,2× (mais que isso borra) e a foto vem com 2560 px; o pedacinho
  é a parte com mais detalhe da foto (`fzFocoDetalhe`, lendo os pixels), não um ponto ao acaso; nas fotos de gente (`FZ_PESSOAS`)
  é o ROSTO (`fzFocoRosto`, pela cor de pele no alto da foto; o dono reclamou de zoom só no corpo); páginas de desambiguação e
  imagens que não são foto (assinatura, mapa, brasão, logo…) são puladas e entra a reserva. Os testes simulam a Wikipédia.
- Censurazi: cartas com a palavra e 5 proibidas nos 3 idiomas (da mais vaga para a mais óbvia), no FIM, com linha nova em
  `CS_DIARIO_POOLS`. Corzi: cores em `CZR_CORES` (aparecem num cartão escuro).
