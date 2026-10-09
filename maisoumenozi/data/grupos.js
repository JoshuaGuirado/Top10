// Grandezas que misturam assuntos: dentro de uma grandeza, qualquer item cruza com qualquer outro
// (o Monte Fuji contra o Burj Khalifa contra o Yao Ming, tudo em altura). O número de cada assunto vira a medida
// comum pelo fator (cm → m: 0,01; mil km² → km²: 1000). Carregado depois dos assuntos.

const MM_Q_MAIS_ALTO = [
  ["O de baixo é mais alto ou mais baixo?", "Is the one below taller or shorter?", "¿El de abajo es más alto o más bajo?"],
  ["Lado a lado com o de cima, esse seria mais alto ou mais baixo?", "Side by side with the one above, would this one be taller or shorter?", "Al lado del de arriba, ¿este sería más alto o más bajo?"],
  ["Repare na unidade: esse é mais alto ou mais baixo?", "Mind the units: is this one taller or shorter?", "Ojo con la unidad: ¿este es más alto o más bajo?"],
];

mmGrupo({
  id: "g-altura",
  titulo: ["Altura: montanhas, prédios e atletas", "Height: mountains, buildings and athletes", "Altura: montañas, edificios y atletas"],
  perguntas: MM_Q_MAIS_ALTO,
  botoes: MM_BOTOES.alto,
  temas: { montanhas: 1, construcoes: 1, "atletas-altura": 0.01 },
});

mmGrupo({
  id: "g-area",
  titulo: ["Tamanho: países, estados, ilhas, desertos e lagos", "Size: countries, states, islands, deserts and lakes", "Tamaño: países, estados, islas, desiertos y lagos"],
  perguntas: [
    ["O de baixo é maior ou menor?", "Is the one below bigger or smaller?", "¿El de abajo es más grande o más chico?"],
    ["Em área, esse é maior ou menor que o de cima?", "In area, is this one bigger or smaller than the one above?", "En superficie, ¿este es mayor o menor que el de arriba?"],
    ["Se um coubesse dentro do outro: esse é maior ou menor?", "If one fit inside the other: is this one bigger or smaller?", "Si uno cupiera dentro del otro: ¿este es mayor o menor?"],
  ],
  botoes: MM_BOTOES.maior,
  temas: { "paises-area": 1000, "estados-area": 1000, desertos: 1000, ilhas: 1, lagos: 1 },
});

mmGrupo({
  id: "g-gente",
  titulo: ["Habitantes: países, estados e cidades", "Population: countries, states and cities", "Habitantes: países, estados y ciudades"],
  perguntas: [
    ["O de baixo tem mais ou menos habitantes?", "Does the one below have more or fewer people?", "¿El de abajo tiene más o menos habitantes?"],
    ["Mora mais ou menos gente nesse aí?", "Do more or fewer people live in this one?", "¿Vive más o menos gente en este?"],
    ["Contando todo mundo, esse tem mais ou menos gente que o de cima?", "Counting everyone, does this one have more or fewer people than the one above?", "Contando a todos, ¿este tiene más o menos gente que el de arriba?"],
  ],
  botoes: MM_BOTOES.mais,
  temas: { "paises-pop": 1e6, "estados-pop": 1e6, "cidades-pop": 1000 },
});

mmGrupo({
  id: "g-velocidade",
  titulo: ["Velocidade: bichos contra máquinas", "Speed: animals against machines", "Velocidad: animales contra máquinas"],
  perguntas: [
    ["O de baixo é mais rápido ou mais lento?", "Is the one below faster or slower?", "¿El de abajo es más rápido o más lento?"],
    ["Numa corrida contra o de cima, esse ganharia ou perderia? (mais rápido ou mais lento)", "In a race against the one above, would this one win or lose? (faster or slower)", "En una carrera contra el de arriba, ¿este ganaría o perdería? (más rápido o más lento)"],
    ["No máximo, esse vai mais rápido ou mais devagar?", "At top speed, does this one go faster or slower?", "Al máximo, ¿este va más rápido o más lento?"],
  ],
  botoes: MM_BOTOES.rapido,
  temas: { "animais-velocidade": 1, veiculos: 1 },
});
