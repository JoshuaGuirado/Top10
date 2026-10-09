// Assuntos do Maisoumenozi (4): coisas do dia a dia que todo mundo conhece, para comparações mais divertidas.
// Peso de coisas (junto com os animais), distância de São Paulo, idade de monumentos, tamanho de animais,
// quanto custou fazer filmes e alturas do dia a dia (junto com montanhas, prédios e atletas).

mmTema({
  id: "objetos-peso",
  titulo: ["Peso das coisas", "Weight of things", "Peso de las cosas"],
  unidade: ["{n} kg", "{n} kg", "{n} kg"],
  margem: 1.2,
  botoes: MM_BOTOES.pesado,
  perguntas: [
    ["O de baixo é mais pesado ou mais leve?", "Is the one below heavier or lighter?", "¿El de abajo es más pesado o más liviano?"],
    ["Na balança, esse pesa mais ou menos?", "On the scale, does this one weigh more or less?", "En la balanza, ¿este pesa más o menos?"],
    ["Para carregar, esse dá mais ou menos trabalho? (mais pesado ou mais leve)", "Is this one harder or easier to carry? (heavier or lighter)", "Para cargarlo, ¿cuesta más o menos? (más pesado o más liviano)"],
  ],
  itens: [
    [635000, "Cristo Redentor", "Christ the Redeemer", "Cristo Redentor"],
    [225000, "Estátua da Liberdade", "Statue of Liberty", "Estatua de la Libertad"],
    [62000, "Tanque de guerra (Abrams)", "Battle tank (Abrams)", "Tanque de guerra (Abrams)"],
    [41000, "Avião Boeing 737 (vazio)", "Boeing 737 airplane (empty)", "Avión Boeing 737 (vacío)"],
    [12000, "Ônibus", "Bus", "Autobús"],
    [1000, "Carro popular", "Small car", "Auto pequeño"],
    [480, "Piano de cauda", "Grand piano", "Piano de cola"],
    [150, "Moto", "Motorcycle", "Moto"],
    [80, "Geladeira", "Fridge", "Heladera"],
    [50, "Saco de cimento", "Bag of cement", "Bolsa de cemento"],
    [27, "Botijão de gás cheio", "Full gas cylinder (13 kg)", "Garrafa de gas llena"],
    [12, "Bicicleta", "Bicycle", "Bicicleta"],
    [0.43, "Bola de futebol", "Soccer ball", "Pelota de fútbol"],
    [0.17, "Celular", "Smartphone", "Celular"],
  ],
});

mmTema({
  id: "distancias-sp",
  titulo: ["Distância de São Paulo (em linha reta)", "Distance from São Paulo (straight line)", "Distancia desde São Paulo (en línea recta)"],
  unidade: ["{n} km", "{n} km", "{n} km"],
  margem: 1.15,
  botoes: MM_BOTOES.longe,
  perguntas: [
    ["Saindo de São Paulo, o de baixo fica mais longe ou mais perto?", "From São Paulo, is the one below farther or closer?", "Saliendo de São Paulo, ¿el de abajo está más lejos o más cerca?"],
    ["De avião, a viagem até esse é mais longa ou mais curta? (mais longe ou mais perto)", "By plane, is the trip there longer or shorter? (farther or closer)", "En avión, ¿el viaje hasta allí es más largo o más corto? (más lejos o más cerca)"],
    ["Comparado ao de cima, esse fica mais longe ou mais perto de SP?", "Compared with the one above, is this one farther from or closer to São Paulo?", "Comparado con el de arriba, ¿este está más lejos o más cerca de São Paulo?"],
  ],
  itens: [
    [18550, "Tóquio", "Tokyo", "Tokio"],
    [13370, "Sydney", "Sydney", "Sídney"],
    [12200, "Dubai", "Dubai", "Dubái"],
    [9400, "Paris", "Paris", "París"],
    [7690, "Nova York", "New York", "Nueva York"],
    [6560, "Miami", "Miami", "Miami"],
    [3470, "Lima", "Lima", "Lima"],
    [2690, "Manaus", "Manaus", "Manaos"],
    [2130, "Recife", "Recife", "Recife"],
    [1680, "Buenos Aires", "Buenos Aires", "Buenos Aires"],
    [1450, "Salvador", "Salvador", "Salvador"],
    [870, "Brasília", "Brasília", "Brasilia"],
    [490, "Belo Horizonte", "Belo Horizonte", "Belo Horizonte"],
    [360, "Rio de Janeiro", "Rio de Janeiro", "Río de Janeiro"],
  ],
});

mmTema({
  id: "idade",
  titulo: ["Idade em 2026", "Age in 2026", "Edad en 2026"],
  unidade: ["{n} anos", "{n} years", "{n} años"],
  margem: 1.1,
  botoes: [["Mais antigo", "Older", "Más antiguo"], ["Mais novo", "Newer", "Más nuevo"]],
  perguntas: [
    ["O de baixo é mais antigo ou mais novo?", "Is the one below older or newer?", "¿El de abajo es más antiguo o más nuevo?"],
    ["Esse existe há mais ou menos tempo?", "Has this one existed for more or less time?", "¿Este existe hace más o menos tiempo?"],
    ["Comparado ao de cima, esse é mais antigo ou mais novo?", "Compared with the one above, is this one older or newer?", "Comparado con el de arriba, ¿este es más antiguo o más nuevo?"],
  ],
  itens: [
    [4580, "Pirâmides de Gizé", "Pyramids of Giza", "Pirámides de Guiza"],
    [1946, "Coliseu de Roma", "Rome's Colosseum", "Coliseo de Roma"],
    [930, "Universidade de Oxford", "University of Oxford", "Universidad de Oxford"],
    [853, "Torre de Pisa", "Leaning Tower of Pisa", "Torre de Pisa"],
    [576, "Machu Picchu", "Machu Picchu", "Machu Picchu"],
    [373, "Taj Mahal", "Taj Mahal", "Taj Mahal"],
    [167, "Big Ben", "Big Ben", "Big Ben"],
    [140, "Estátua da Liberdade", "Statue of Liberty", "Estatua de la Libertad"],
    [95, "Cristo Redentor", "Christ the Redeemer", "Cristo Redentor"],
    [76, "Maracanã", "Maracanã Stadium", "Estadio Maracaná"],
    [66, "Brasília", "Brasília", "Brasilia"],
    [57, "Pisada na Lua", "First Moon landing", "Llegada a la Luna"],
    [28, "Google", "Google", "Google"],
    [19, "iPhone", "iPhone", "iPhone"],
  ],
});

mmTema({
  id: "animais-tamanho",
  titulo: ["Comprimento dos animais", "Length of animals", "Largo de los animales"],
  unidade: ["{n} metros", "{n} meters", "{n} metros"],
  margem: 1.15,
  botoes: MM_BOTOES.longo,
  perguntas: [
    ["O bicho de baixo é mais comprido ou mais curto?", "Is the animal below longer or shorter?", "¿El animal de abajo es más largo o más corto?"],
    ["Da cabeça ao rabo, esse é maior ou menor?", "Head to tail, is this one longer or shorter?", "De la cabeza a la cola, ¿este es más largo o más corto?"],
    ["Deitado no chão, esse ocupa mais ou menos espaço? (mais comprido ou mais curto)", "Lying down, does it take up more or less space? (longer or shorter)", "Acostado, ¿ocupa más o menos espacio? (más largo o más corto)"],
  ],
  itens: [
    [30, "Baleia-azul", "Blue whale", "Ballena azul"],
    [12, "Tubarão-baleia", "Whale shark", "Tiburón ballena"],
    [8, "Orca", "Orca", "Orca"],
    [5, "Tubarão-branco", "Great white shark", "Tiburón blanco"],
    [2.5, "Golfinho", "Dolphin", "Delfín"],
    [1.7, "Ser humano", "Human", "Ser humano"],
    [1.15, "Pinguim-imperador", "Emperor penguin", "Pingüino emperador"],
    [0.5, "Gato", "Cat", "Gato"],
    [0.08, "Beija-flor", "Hummingbird", "Colibrí"],
  ],
});

mmTema({
  id: "filmes-orcamento",
  titulo: ["Quanto custou fazer o filme", "How much the movie cost to make", "Cuánto costó hacer la película"],
  unidade: ["US$ {n} milhões", "US$ {n} million", "US$ {n} millones"],
  margem: 1.2,
  botoes: MM_BOTOES.mais,
  perguntas: [
    ["O filme de baixo custou mais ou menos para fazer?", "Did the movie below cost more or less to make?", "¿La película de abajo costó más o menos?"],
    ["Para gravar esse, gastaram mais ou menos?", "Did they spend more or less to shoot this one?", "Para filmar esta, ¿gastaron más o menos?"],
    ["Comparado ao de cima, esse foi mais caro ou mais barato? (mais ou menos)", "Compared with the one above, was this one pricier or cheaper? (more or less)", "Comparada con la de arriba, ¿esta fue más cara o más barata? (más o menos)"],
  ],
  itens: [
    [379, "Piratas do Caribe: Navegando em Águas Misteriosas", "Pirates of the Caribbean: On Stranger Tides", "Piratas del Caribe: Navegando aguas misteriosas"],
    [356, "Vingadores: Ultimato", "Avengers: Endgame", "Vengadores: Endgame"],
    [237, "Avatar", "Avatar", "Avatar"],
    [200, "Titanic", "Titanic", "Titanic"],
    [145, "Barbie", "Barbie", "Barbie"],
    [100, "Oppenheimer", "Oppenheimer", "Oppenheimer"],
    [63, "Jurassic Park", "Jurassic Park", "Jurassic Park"],
    [45, "O Rei Leão (1994)", "The Lion King (1994)", "El rey león (1994)"],
    [30, "Toy Story", "Toy Story", "Toy Story"],
    [11, "Star Wars (1977)", "Star Wars (1977)", "Star Wars (1977)"],
    [9, "Tubarão (1975)", "Jaws (1975)", "Tiburón (1975)"],
    [3.3, "Cidade de Deus", "City of God", "Ciudad de Dios"],
  ],
});

mmTema({
  id: "coisas-altura",
  titulo: ["Altura das coisas", "Height of things", "Altura de las cosas"],
  unidade: ["{n} metros", "{n} meters", "{n} metros"],
  margem: 1.1,
  botoes: MM_BOTOES.alto,
  perguntas: [
    ["O de baixo é mais alto ou mais baixo?", "Is the one below taller or shorter?", "¿El de abajo es más alto o más bajo?"],
    ["Lado a lado com o de cima, esse seria mais alto ou mais baixo?", "Side by side with the one above, would this one be taller or shorter?", "Al lado del de arriba, ¿este sería más alto o más bajo?"],
    ["Em pé, esse fica mais alto ou mais baixo?", "Standing, is this one taller or shorter?", "De pie, ¿este es más alto o más bajo?"],
  ],
  itens: [
    [30, "Prédio de 10 andares", "10-story building", "Edificio de 10 pisos"],
    [5.5, "Girafa", "Giraffe", "Jirafa"],
    [4.4, "Ônibus de dois andares", "Double-decker bus", "Autobús de dos pisos"],
    [3.05, "Cesta de basquete", "Basketball hoop", "Aro de baloncesto"],
    [2.44, "Trave do gol de futebol", "Soccer goal", "Arco de fútbol"],
    [2.1, "Porta de casa", "House door", "Puerta de casa"],
    [1.8, "Geladeira duplex", "Two-door fridge", "Heladera de dos puertas"],
  ],
});

// Peso: os animais e as coisas se misturam (girafa × Fusca × tanque de guerra).
mmGrupo({
  id: "g-peso",
  titulo: ["Peso: bichos e coisas", "Weight: animals and things", "Peso: animales y cosas"],
  perguntas: [
    ["O de baixo é mais pesado ou mais leve?", "Is the one below heavier or lighter?", "¿El de abajo es más pesado o más liviano?"],
    ["Na balança, esse pesa mais ou menos?", "On the scale, does this one weigh more or less?", "En la balanza, ¿este pesa más o menos?"],
    ["Comparado ao de cima, esse é mais pesado ou mais leve?", "Compared with the one above, is this one heavier or lighter?", "Comparado con el de arriba, ¿este es más pesado o más liviano?"],
  ],
  botoes: MM_BOTOES.pesado,
  temas: { "animais-peso": 1, "objetos-peso": 1 },
});

// As alturas do dia a dia entram na grandeza de altura (com montanhas, prédios e atletas).
Object.assign(mmTemaDe("coisas-altura"), { grupo: "g-altura", fator: 1 });
MM_GRUPOS.find((g) => g.id === "g-altura").temas["coisas-altura"] = 1;
