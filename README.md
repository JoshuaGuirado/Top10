# Gamezi

Plataforma de jogos rápidos para jogar no navegador, sozinho ou com a turma. A raiz do site (`index.html`) é o portal do Gamezi, com a lista de jogos; cada jogo fica na própria pasta: o **Topzi** (jogo de listas) em `topzi/` e o **Patozi** (jogo de chutar números, o do "Nem a pato!") em `patozi/`. Os dois usam o mesmo banco e a mesma conta.

Para adicionar um jogo novo: crie a pasta dele (`nomezi/`), ponha um cartão no `index.html` da raiz (e o texto nos três idiomas, no objeto `T`), inclua os arquivos no `sw.js` com o caminho da pasta e use as mesmas cores, fonte e o Z vermelho (ver `brand.html`).

# Topzi

Jogo de adivinhar listas para jogar sozinho ou com até 8 pessoas. Cada lista tem 10, 30 ou 50 itens em ordem, e o número do item é a pontuação: o nº 1 é o óbvio e vale 1 ponto, o último é o mais difícil e vale mais.

## Modos de jogo

| Modo | Listas | Como se vence |
| --- | --- | --- |
| **Top 10** | 10 itens | Solo, 1v1 ou todos contra todos: quem somar mais pontos |
| **Top 30** | 30 itens | Igual ao Top 10, com listas maiores |
| **Top 50** | 50 itens | Igual ao Top 10, o nº 50 vale 50 pontos |
| **Equipe contra a lista** | 10, 30 ou 50 | Todos somam juntos; o que ninguém achar vira ponto da lista. A equipe vence se fizer mais da metade dos pontos. Cada chute errado custa uma vida (3 no Top 10, 6 no Top 30, 10 no Top 50), e dá para trocar uma vida por uma dica (primeira letra e tamanho de um item). |
| **Times** | 10, 30 ou 50 | Time Vermelho × Time Preto (1v1 a 4v4). A vez alterna entre os times e cada ponto vai para o time de quem acertou. |

**Jogar online**: cada um no próprio celular. Um cria a sala, manda o código ou o link, escolhe o modo, o tempo e a lista, e começa. Funciona em todos os modos (Top 10/30/50, Equipe contra a lista e Times). Usa o Supabase (gratuito): o passo a passo está em [`supabase/LEIAME.md`](supabase/LEIAME.md) e as tabelas em [`supabase/schema.sql`](supabase/schema.sql). Quem quiser pode **conectar a conta** com e-mail e senha para guardar perfil, skin, estatísticas e recordes (tem "Esqueci a senha" e "Trocar senha").

O botão **?** no topo abre o **Como jogar**, com exemplos de peças do quadro (abre sozinho na primeira visita; o endereço `/#como-jogar` também abre).

Na tela inicial também tem a **Lista do dia**: a mesma lista de 10 para todo mundo, com 3 vidas, e o resultado vira um texto com quadradinhos para compartilhar no WhatsApp.

## Como jogar

Abra o `topzi/index.html` no navegador (ou o `index.html` da raiz, que é o portal do Gamezi). Não precisa instalar nada.

1. Escolha o modo de jogo.
2. Escolha de 1 a 8 jogadores (no modo Times, toque no time de cada um para trocar).
3. Cada jogador digita o nickname e escolhe uma skin pronta (heróis, vilões, filmes, games, futebol, profissões) ou monta a sua em "Personalizar": rosto, cabelo, acessório de cabeça, roupa, item na mão e fundo.
4. Se quiser, ligue o **modo relâmpago** (15, 30 ou 60 segundos por vez). Quem não chutar a tempo perde a vez (e, contra a lista, uma vida).
5. Escolha a lista do modo: dá para pesquisar, filtrar por categoria ou sortear.
6. Na sua vez, dê um palpite. O número do item é a pontuação: acertou o nº 8, ganhou 8 pontos; numa lista de 50, o nº 50 vale 50. Errou, passa a vez sem pontos. Também dá para passar a vez.
7. A partida acaba quando todos os itens são encontrados, quando todo mundo passa a vez seguido, quando a equipe perde todas as vidas ou quando alguém encerra.

Os palpites não diferenciam maiúsculas, acentos, singular e plural, aceitam siglas e apelidos (ex.: "SP", "BH") e perdoam um errinho de digitação. Nas listas de frases, basta acertar a ideia principal (ex.: "todo mundo" vale "Você não é todo mundo").

**Algum chute estava certo?** No fim da partida, com a lista já aberta para todos, a turma pode aceitar um chute que valia (faltou um apelido na lista): escolhe o item, os pontos entram no placar e a resposta passa a valer nas próximas partidas. Só aparece com 2 ou mais jogadores e nunca na lista do dia, para ninguém aprovar o próprio chute.

**Resultado:** suspense com rufar de tambor ("E o vencedor é…"), revelação com coroa e fogos (ou trombone triste quando a lista vence), pódio subindo, destaques da partida (jogada da partida, o óbvio que ninguém lembrou, sequências) e prêmios como 🔥 3 seguidos, 🎯 zero erros e 💥 chutador oficial. Durante a partida, quem acerta 3 seguidos fica "em chamas".

**Estatísticas e recordes:** partidas, pontos, taxa de acerto, vitórias contra a lista, sequência da lista do dia e o recorde de cada lista (aparece no card da lista).

## Criar o próprio tema

Na tela de listas, "Criar lista" monta uma lista sua de 10, 30 ou 50 itens, do mais óbvio ao menos óbvio, com outras respostas aceitas para cada item. As listas criadas ficam salvas no navegador, em "Minhas listas", e podem ser editadas, apagadas ou compartilhadas: o botão "Compartilhar" copia um link que já traz a lista inteira.

## Arquivos

Na raiz ficam o portal do Gamezi (`index.html`, `gamezi.css`), as páginas de texto (`termos.html`, `privacidade.html`, `brand.html`, `404.html`, com `docs.css`), o `sw.js`, o `manifest.webmanifest`, a pasta `brand/` e os testes. O jogo fica em `topzi/`:


- `topzi/index.html` e `topzi/style.css`: telas e visual
- `topzi/data/`: categorias e as 624 listas (`listas-grandes*.js` têm as de 30 e 50; `listas-populares.js` tem a Bíblia e as listas mais procuradas de cada categoria)
- `topzi/data/traducoes*.js`: títulos, fontes e itens das listas em inglês e espanhol (a resposta vale em qualquer idioma)
- `topzi/js/`: o jogo, dividido por assunto
  - `match.js`: comparação de palpites, dicas e sugestões do "Aceitar mesmo assim" (sem tela, por isso testado)
  - `partida.js`: vez, vidas, tempo e dicas · `resultado.js`: pódio e placares · `modos.js`, `jogadores.js`, `listas.js`, `diaria.js`, `estatisticas.js`
  - `util.js`, `efeitos.js` (som e confete), `skins.js`, `avatars.js`, `icons.js`, `app.js` (liga tudo)
- `topzi/js/online.js` e `topzi/js/config.js`: modo online e conta (as chaves do Supabase vão no `config.js`)
- `supabase/`: SQL do banco e passo a passo de configuração
- `sw.js` e `manifest.webmanifest` (na raiz): instalar o Gamezi como app e jogar offline
- `tests/`: testes automáticos (`npm test`), que também rodam no GitHub a cada push, e o teste do online com duas abas e um Supabase falso (`npm run test:online`)
- `brand/` e `brand.html`: logo GAMEZI (plataforma), logo TOPZI, símbolo 10, ícones (o Z da logo no preto, na aba e no app) e manual de identidade visual (logo, cores, tipografia, componentes, ícones e tom de voz) (vermelho `#FF4D3D`, preto `#171717`, creme `#FFF4DE`)
- `termos.html` e `privacidade.html`: Termos de uso e Política de privacidade (LGPD), com o visual de `docs.css`
- `404.html`, `robots.txt` e `sitemap.xml`: página de erro e arquivos para buscadores

Listas sem dado oficial (rankings de opinião e de popularidade) indicam "Curadoria Topzi" como fonte.

## Adicionar uma lista ao jogo

Em um dos arquivos de `topzi/data/`, acrescente um bloco com `id`, `cat` (uma das categorias), `title`, `source` e 10, 30 ou 50 `items` em ordem. Cada item é uma string `"Nome|apelido|apelido"`; valores começando com `~` são palavras-chave que valem se aparecerem no palpite.

Depois rode `npm test`: ele confere tamanho, categoria, ids repetidos e se alguma resposta vale para dois itens da mesma lista.

Para o jogo em inglês e espanhol, acrescente o título traduzido em `topzi/data/traducoes-titulos.js` e, se algum item tiver outro nome nesses idiomas, a tradução em `topzi/data/traducoes-itens-*.js` (`"Nome": ["English|outra grafia", "Español"]`). O `npm test` avisa se faltar título ou se uma resposta traduzida valer para dois itens.

## Publicar

O site está em **https://top10-bay.vercel.app**. A Vercel publica sozinha a cada envio para a branch `main`. O jogo pode ser instalado no celular ("Adicionar à tela inicial") e funciona sem internet, menos o modo online. Abrindo o arquivo direto no computador, o modo offline não liga, mas o resto funciona.

# Patozi

Jogo de chutar números para 2 a 10 jogadores, no mesmo celular (dá para completar a mesa com o computador) ou online, cada um no seu.

## Como jogar

1. Uma carta é virada: uma pergunta com resposta em número ("Quantos ossos tem o corpo humano adulto?"). Cada carta vale de 1 a 3 patos.
2. Na sua vez, chute um número **maior** que o último chute, ou grite **"Nem a pato!"** se achar que o último chute já passou da resposta.
3. A resposta é revelada. Se o chute passou, quem chutou fica com a carta; se não passou, quem duvidou fica com ela. Quem ficou com a carta começa a próxima rodada.
4. Quando alguém junta a meta de cartas (5 com até 4 jogadores, 4 com até 7, 3 com mais; a duração Rápida tira 2 e a Longa põe 2), o jogo acaba. **Quem tiver mais patos perde**; todo o resto ganha.

Regras extras (ligadas por padrão, dá para desligar): **Dobrei** (chutar o dobro ou mais do chute anterior dá um escudo que tira 1 pato no fim) e **Na mosca** (duvidar de um chute exato custa a carta com patos em dobro).

**Pato do dia**: 5 perguntas iguais para todo mundo, todo dia. Chegue o mais perto possível sem passar (até 100 pontos por pergunta; passou, zero). O resultado entra no ranking do dia e vira um texto para compartilhar.

**Online**: um cria a sala, manda o código ou o link (`patozi/?sala=CODIGO`), escolhe os temas, a duração e as regras, e começa. Quem recarrega a página volta para a partida; se alguém sai no meio, o computador joga por ele.

**Perfil**: nome e cor do pato, estatísticas (partidas, vezes que escapou, vezes que foi o pato, "Nem a pato!" certeiros, patos recebidos, dobreis, Pato do dia), conta (a mesma do Topzi) e "Mande uma carta", que guarda sugestões de perguntas no banco.

## Arquivos do Patozi

- `patozi/index.html` e `patozi/style.css`: telas e visual (mesmas cores, fonte e peças do Topzi)
- `patozi/data/temas.js`: os 17 temas e a função que cadastra as cartas; `patozi/data/cartas-*.js`: as 437 cartas, em português, inglês e espanhol
- `patozi/js/jogo.js`: regras, computador e Pato do dia, sem tela (testado em `tests/patozi.test.js`)
- `patozi/js/partida.js` (partida na tela), `diario.js` (Pato do dia), `online.js` (salas), `conta.js` (banco, conta e perfil), `visual.js` (ícones, o pato, som e confete), `textos.js` (os três idiomas), `app.js` (liga tudo)
- As chaves do Supabase vêm do `topzi/js/config.js` (é o mesmo projeto)
- Banco: tabelas `patozi_*` no `supabase/schema.sql`
- Marca: `brand/patozi-logo*.svg`, `brand/patozi-simbolo*.svg` e `brand/patozi-og.png` (ver `brand.html`)

## Adicionar cartas

Crie um arquivo novo em `patozi/data/` (por exemplo `cartas-4.js`), carregado no `patozi/index.html` depois dos outros e incluído no `FILES` do `sw.js` (`patozi/data/cartas-4.js`). Dentro, use `pzCartas("tema", [[patos, resposta, "pergunta", "question", "pregunta"], ...])`; quando a resposta for um ano, ponha `"ano"` no fim. Depois, acrescente uma linha em `PZ_DIARIO_POOLS` (`patozi/js/jogo.js`) valendo a partir de amanhã, com o novo total de cartas, para o Pato do dia de hoje não mudar. O `npm test` confere tudo isso.
