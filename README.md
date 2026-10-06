# TT · Top Ten

Jogo de adivinhar listas para jogar sozinho ou com até 8 pessoas. Cada lista tem 10 itens em ordem, e o número do item é a pontuação: o nº 1 é o óbvio e vale 1 ponto, o nº 10 é o mais difícil e vale 10. Quem somar mais pontos vence.

## Como jogar

Abra o `index.html` no navegador. Não precisa instalar nada.

1. Escolha de 1 a 8 jogadores (1 = solo, 2 = 1v1, e assim por diante).
2. Cada jogador digita o nickname e escolhe uma skin: personagens prontos (heróis, vilões, filmes, games, futebol, profissões) ou uma montada do zero no "Criar o meu".
3. Escolha a lista: dá para pesquisar, filtrar por categoria ou sortear.
4. Na sua vez, dê um palpite. Acertou o nº 8? Ganhou 8 pontos. Errou? Perde uma das 3 vidas. Também dá para passar a vez.
5. A partida acaba quando os 10 itens são encontrados, todos ficam sem vidas ou todo mundo passa a vez. No fim aparece o pódio com os resultados.

Os palpites não diferenciam maiúsculas nem acentos, aceitam siglas e apelidos (ex.: "SP", "BH") e perdoam um errinho de digitação. Nas listas de frases, basta acertar a ideia principal (ex.: "todo mundo" vale "Você não é todo mundo").

## Arquivos

- `data.js`: categorias e as 105 listas
- `avatars.js`: peças dos bonecos, editor e skins prontas
- `script.js`: regras e telas do jogo
- `style.css`: visual
- `brand/` e `brand.html`: logo e guia de identidade visual

## Adicionar uma lista

Em `data.js`, acrescente um bloco ao array `LISTS` com `id`, `cat` (uma das categorias), `title`, `source` e 10 `items` em ordem. Cada item é uma string `"Nome|apelido|apelido"`; valores começando com `~` são palavras-chave que valem se aparecerem no palpite.

## Publicar

Para jogar online, ative o GitHub Pages em **Settings → Pages** e selecione a branch `main`.
