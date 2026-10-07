# Top Ten

Jogo de adivinhar listas para jogar sozinho ou com até 8 pessoas. Cada lista tem 10, 30 ou 50 itens em ordem, e o número do item é a pontuação: o nº 1 é o óbvio e vale 1 ponto, o último é o mais difícil e vale mais.

## Modos de jogo

| Modo | Listas | Como se vence |
| --- | --- | --- |
| **Top 10** | 10 itens | Solo, 1v1 ou todos contra todos: quem somar mais pontos |
| **Top 30** | 30 itens | Igual ao Top 10, com listas maiores |
| **Top 50** | 50 itens | Igual ao Top 10, o nº 50 vale 50 pontos |
| **Equipe contra a lista** | 10, 30 ou 50 | Todos somam juntos; o que ninguém achar vira ponto da lista. A equipe vence se fizer mais da metade dos pontos. Cada chute errado custa uma vida (3 no Top 10, 6 no Top 30, 10 no Top 50). |

No modo equipe, a vez continua revezando para cada um contribuir, e o resultado mostra a pontuação Equipe × Lista e quem foi o MVP.

## Como jogar

Abra o `index.html` no navegador. Não precisa instalar nada.

1. Escolha o modo de jogo.
2. Escolha de 1 a 8 jogadores (1 = solo, 2 = 1v1, e assim por diante).
3. Cada jogador digita o nickname e escolhe uma skin pronta (heróis, vilões, filmes, games, futebol, profissões) ou monta a sua em "Personalizar": rosto, cabelo, acessório de cabeça, roupa, item na mão e fundo.
4. Escolha a lista do modo: dá para pesquisar, filtrar por categoria ou sortear (no modo equipe, também por tamanho).
5. Na sua vez, dê um palpite. O número do item é a pontuação: acertou o nº 8, ganhou 8 pontos; numa lista de 50, o nº 50 vale 50. Errou, passa a vez sem pontos. Também dá para passar a vez.
6. A partida acaba quando todos os itens são encontrados, quando todo mundo passa a vez seguido, quando a equipe perde todas as vidas ou quando alguém encerra.

Os palpites não diferenciam maiúsculas, acentos, singular e plural, aceitam siglas e apelidos (ex.: "SP", "BH") e perdoam um errinho de digitação. Nas listas de frases, basta acertar a ideia principal (ex.: "todo mundo" vale "Você não é todo mundo").

## Criar o próprio tema

Na tela de listas, "Criar lista" monta uma lista sua de 10, 30 ou 50 itens, do mais óbvio ao menos óbvio, com outras respostas aceitas para cada item. As listas criadas ficam salvas no navegador, em "Minhas listas", e podem ser editadas, apagadas ou compartilhadas: o botão "Compartilhar" copia um link que já traz a lista inteira.

## Arquivos

- `data.js`, `data-mais.js`, `data-grandes.js`: categorias e as 305 listas (as de 30 e 50 itens ficam em `data-grandes.js`)
- `avatars.js`: peças dos bonecos, editor e skins prontas
- `script.js`: regras e telas do jogo
- `style.css`: visual
- `brand/` e `brand.html`: logo e guia de identidade visual (preto e branco)

Listas sem dado oficial (rankings de opinião e de popularidade) indicam "Curadoria Top Ten" como fonte.

## Adicionar uma lista ao jogo

Em um dos arquivos de dados, acrescente um bloco com `id`, `cat` (uma das categorias), `title`, `source` e 10, 30 ou 50 `items` em ordem. Cada item é uma string `"Nome|apelido|apelido"`; valores começando com `~` são palavras-chave que valem se aparecerem no palpite.

## Publicar

Para jogar online, ative o GitHub Pages em **Settings → Pages** e selecione a branch `main`.
