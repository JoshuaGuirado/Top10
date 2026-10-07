# Top Ten

Jogo de adivinhar listas para jogar sozinho ou com até 8 pessoas. Cada lista tem 10, 30 ou 50 itens em ordem, e o número do item é a pontuação: o nº 1 é o óbvio e vale 1 ponto, o último é o mais difícil e vale mais.

## Modos de jogo

| Modo | Listas | Como se vence |
| --- | --- | --- |
| **Top 10** | 10 itens | Solo, 1v1 ou todos contra todos: quem somar mais pontos |
| **Top 30** | 30 itens | Igual ao Top 10, com listas maiores |
| **Top 50** | 50 itens | Igual ao Top 10, o nº 50 vale 50 pontos |
| **Equipe contra a lista** | 10, 30 ou 50 | Todos somam juntos; o que ninguém achar vira ponto da lista. A equipe vence se fizer mais da metade dos pontos. Cada chute errado custa uma vida (3 no Top 10, 6 no Top 30, 10 no Top 50), e dá para trocar uma vida por uma dica (primeira letra e tamanho de um item). |
| **Times** | 10, 30 ou 50 | Time Azul × Time Vermelho (1v1 a 4v4). A vez alterna entre os times e cada ponto vai para o time de quem acertou. |

**Jogar online**: cada um no próprio celular. Um cria a sala, manda o código ou o link, escolhe o modo, o tempo e a lista, e começa. Funciona em todos os modos (Top 10/30/50, Equipe contra a lista e Times). Usa o Supabase (gratuito): o passo a passo está em [`supabase/LEIAME.md`](supabase/LEIAME.md) e as tabelas em [`supabase/schema.sql`](supabase/schema.sql). Quem quiser pode **conectar a conta** com o e-mail para guardar perfil, skin, estatísticas e recordes.

Na tela inicial também tem a **Lista do dia**: a mesma lista de 10 para todo mundo, com 3 vidas, e o resultado vira um texto com quadradinhos para compartilhar no WhatsApp.

## Como jogar

Abra o `index.html` no navegador. Não precisa instalar nada.

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

- `index.html` e `style.css`: telas e visual
- `data/`: categorias e as 355 listas (`listas-grandes.js` e `listas-grandes-2.js` têm as de 30 e 50)
- `js/`: o jogo, dividido por assunto
  - `match.js`: comparação de palpites, dicas e sugestões do "Aceitar mesmo assim" (sem tela, por isso testado)
  - `partida.js`: vez, vidas, tempo e dicas · `resultado.js`: pódio e placares · `modos.js`, `jogadores.js`, `listas.js`, `diaria.js`, `estatisticas.js`
  - `util.js`, `efeitos.js` (som e confete), `skins.js`, `avatars.js`, `icons.js`, `app.js` (liga tudo)
- `js/online.js` e `js/config.js`: modo online e conta (as chaves do Supabase vão no `config.js`)
- `supabase/`: SQL do banco e passo a passo de configuração
- `sw.js` e `manifest.webmanifest`: instalar como app e jogar offline
- `tests/`: testes automáticos (`npm test`), que também rodam no GitHub a cada push, e o teste do online com duas abas e um Supabase falso (`npm run test:online`)
- `brand/` e `brand.html`: logo e guia de identidade visual

Listas sem dado oficial (rankings de opinião e de popularidade) indicam "Curadoria Top Ten" como fonte.

## Adicionar uma lista ao jogo

Em um dos arquivos de `data/`, acrescente um bloco com `id`, `cat` (uma das categorias), `title`, `source` e 10, 30 ou 50 `items` em ordem. Cada item é uma string `"Nome|apelido|apelido"`; valores começando com `~` são palavras-chave que valem se aparecerem no palpite.

Depois rode `npm test`: ele confere tamanho, categoria, ids repetidos e se alguma resposta vale para dois itens da mesma lista.

## Publicar

O site está em **https://top10-bay.vercel.app**. A Vercel publica sozinha a cada envio para a branch `main`. O jogo pode ser instalado no celular ("Adicionar à tela inicial") e funciona sem internet, menos o modo online. Abrindo o arquivo direto no computador, o modo offline não liga, mas o resto funciona.
