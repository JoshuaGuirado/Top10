// Assuntos do Maisoumenozi (3): veículos, ilhas, desertos, lagos, corpo humano, municípios, músicas e cafeína.

mmTema({
  id: "veiculos",
  titulo: ["Velocidade máxima dos veículos", "Top speed of vehicles", "Velocidad máxima de los vehículos"],
  unidade: ["{n} km/h", "{n} km/h", "{n} km/h"],
  margem: 1.2,
  botoes: MM_BOTOES.rapido,
  perguntas: [
    ["O de baixo anda mais rápido ou mais lento?", "Does the one below go faster or slower?", "¿El de abajo va más rápido o más lento?"],
    ["Com o pé no fundo, esse é mais rápido ou mais lento?", "Flat out, is this one faster or slower?", "A fondo, ¿este es más rápido o más lento?"],
    ["Numa corrida contra o de cima, esse seria mais rápido ou mais lento?", "In a race against the one above, would this one be faster or slower?", "En una carrera contra el de arriba, ¿este sería más rápido o más lento?"],
  ],
  itens: [
    [2179, "Concorde (avião)", "Concorde (airplane)", "Concorde (avión)"],
    [920, "Boeing 747 (velocidade de cruzeiro)", "Boeing 747 (cruising speed)", "Boeing 747 (velocidad de crucero)"],
    [490, "Bugatti Chiron Super Sport (recorde)", "Bugatti Chiron Super Sport (record)", "Bugatti Chiron Super Sport (récord)"],
    [431, "Trem maglev de Xangai", "Shanghai maglev train", "Tren maglev de Shanghái"],
    [320, "Trem-bala japonês (Shinkansen)", "Japanese bullet train (Shinkansen)", "Tren bala japonés (Shinkansen)"],
    [372, "Carro de Fórmula 1 (recorde em corrida)", "Formula 1 car (race record)", "Auto de Fórmula 1 (récord en carrera)"],
    [70, "Ciclista profissional (sprint)", "Pro cyclist (sprint)", "Ciclista profesional (sprint)"],
    [40, "Navio de cruzeiro", "Cruise ship", "Crucero"],
    [25, "Patinete elétrico (limite comum)", "E-scooter (usual limit)", "Patinete eléctrico (límite común)"],
    [15, "Bicicleta comum (passeio)", "Regular bike (leisure ride)", "Bicicleta común (paseo)"],
    [5, "Pessoa caminhando", "Person walking", "Persona caminando"],
  ],
});

mmTema({
  id: "ilhas",
  titulo: ["Tamanho das ilhas", "Size of islands", "Tamaño de las islas"],
  unidade: ["{n} km²", "{n} km²", "{n} km²"],
  margem: 1.15,
  botoes: MM_BOTOES.maior,
  perguntas: [
    ["A ilha de baixo é maior ou menor?", "Is the island below bigger or smaller?", "¿La isla de abajo es más grande o más chica?"],
    ["Em área, essa ilha é maior ou menor que a de cima?", "In area, is this island bigger or smaller than the one above?", "En superficie, ¿esta isla es mayor o menor que la de arriba?"],
    ["Para dar a volta nessa ilha, o passeio seria maior ou menor?", "Would a trip around this island be bigger or smaller?", "Para dar la vuelta a esta isla, ¿el paseo sería mayor o menor?"],
  ],
  itens: [
    [2166086, "Groenlândia", "Greenland", "Groenlandia"],
    [785753, "Nova Guiné", "New Guinea", "Nueva Guinea"],
    [743330, "Bornéu", "Borneo", "Borneo"],
    [587041, "Madagascar", "Madagascar", "Madagascar"],
    [209331, "Grã-Bretanha", "Great Britain", "Gran Bretaña"],
    [109884, "Cuba", "Cuba", "Cuba"],
    [40100, "Ilha de Marajó (Pará)", "Marajó Island (Brazil)", "Isla de Marajó (Brasil)"],
    [25711, "Sicília", "Sicily", "Sicilia"],
    [10432, "Havaí (a ilha grande)", "Hawaii (the Big Island)", "Hawái (la isla grande)"],
    [9251, "Chipre", "Cyprus", "Chipre"],
    [2034, "Tenerife", "Tenerife", "Tenerife"],
    [424, "Ilha de Santa Catarina (Florianópolis)", "Santa Catarina Island (Florianópolis)", "Isla de Santa Catarina (Florianópolis)"],
    [164, "Ilha de Páscoa", "Easter Island", "Isla de Pascua"],
    [59, "Manhattan", "Manhattan", "Manhattan"],
    [17, "Fernando de Noronha (ilha principal)", "Fernando de Noronha (main island)", "Fernando de Noronha (isla principal)"],
  ],
});

mmTema({
  id: "desertos",
  titulo: ["Tamanho dos desertos", "Size of deserts", "Tamaño de los desiertos"],
  unidade: ["{n} mil km²", "{n} thousand km²", "{n} mil km²"],
  margem: 1.2,
  botoes: MM_BOTOES.maior,
  perguntas: [
    ["O deserto de baixo é maior ou menor?", "Is the desert below bigger or smaller?", "¿El desierto de abajo es más grande o más chico?"],
    ["Esse deserto cobre uma área maior ou menor que o de cima?", "Does this desert cover a bigger or smaller area than the one above?", "¿Este desierto cubre un área mayor o menor que el de arriba?"],
    ["Tem mais ou menos areia (e gelo) para atravessar? (maior ou menor)", "More or less to cross? (bigger or smaller)", "¿Hay más o menos para cruzar? (mayor o menor)"],
  ],
  itens: [
    [14000, "Antártida (deserto gelado)", "Antarctica (cold desert)", "Antártida (desierto helado)"],
    [9200, "Saara", "Sahara", "Sahara"],
    [2330, "Deserto da Arábia", "Arabian Desert", "Desierto de Arabia"],
    [1295, "Gobi", "Gobi", "Gobi"],
    [900, "Kalahari", "Kalahari", "Kalahari"],
    [348, "Grande Deserto de Vitória (Austrália)", "Great Victoria Desert (Australia)", "Gran Desierto de Victoria (Australia)"],
    [105, "Atacama", "Atacama", "Atacama"],
    [1.5, "Lençóis Maranhenses", "Lençóis Maranhenses", "Lençóis Maranhenses"],
  ],
});

mmTema({
  id: "lagos",
  titulo: ["Tamanho dos lagos", "Size of lakes", "Tamaño de los lagos"],
  unidade: ["{n} km²", "{n} km²", "{n} km²"],
  margem: 1.15,
  botoes: MM_BOTOES.maior,
  perguntas: [
    ["O lago de baixo é maior ou menor?", "Is the lake below bigger or smaller?", "¿El lago de abajo es más grande o más chico?"],
    ["Em superfície de água, esse é maior ou menor que o de cima?", "In water surface, is this one bigger or smaller than the one above?", "En superficie de agua, ¿este es mayor o menor que el de arriba?"],
    ["Para atravessar de barco, esse seria maior ou menor?", "Crossing it by boat, would this one be bigger or smaller?", "Para cruzarlo en barco, ¿este sería mayor o menor?"],
  ],
  itens: [
    [371000, "Mar Cáspio", "Caspian Sea", "Mar Caspio"],
    [82100, "Lago Superior (EUA e Canadá)", "Lake Superior (USA and Canada)", "Lago Superior (EE. UU. y Canadá)"],
    [68800, "Lago Vitória (África)", "Lake Victoria (Africa)", "Lago Victoria (África)"],
    [31500, "Lago Baikal (Rússia)", "Lake Baikal (Russia)", "Lago Baikal (Rusia)"],
    [18960, "Lago Ontário", "Lake Ontario", "Lago Ontario"],
    [10144, "Lagoa dos Patos (RS)", "Lagoa dos Patos (Brazil)", "Laguna de los Patos (Brasil)"],
    [8372, "Lago Titicaca", "Lake Titicaca", "Lago Titicaca"],
    [580, "Lago de Genebra (Lemano)", "Lake Geneva", "Lago de Ginebra (Lemán)"],
    [56, "Lago Ness (Escócia)", "Loch Ness (Scotland)", "Lago Ness (Escocia)"],
    [20, "Lagoa da Conceição (Florianópolis)", "Lagoa da Conceição (Florianópolis)", "Laguna da Conceição (Florianópolis)"],
  ],
});

mmTema({
  id: "corpo",
  titulo: ["Quantos tem no corpo humano adulto", "How many in the adult human body", "Cuántos hay en el cuerpo humano adulto"],
  unidade: ["{n}", "{n}", "{n}"],
  botoes: MM_BOTOES.mais,
  perguntas: [
    ["No corpo, tem mais ou menos do de baixo?", "In the body, are there more or fewer of the one below?", "En el cuerpo, ¿hay más o menos del de abajo?"],
    ["Contando no corpo inteiro, o de baixo aparece mais ou menos vezes?", "Counting the whole body, does the one below show up more or fewer times?", "Contando todo el cuerpo, ¿el de abajo aparece más o menos veces?"],
    ["Você tem mais ou menos desses do que dos de cima?", "Do you have more or fewer of these than of the ones above?", "¿Tienes más o menos de estos que de los de arriba?"],
  ],
  itens: [
    [600, "Músculos (cerca de)", "Muscles (about)", "Músculos (aprox.)"],
    [206, "Ossos", "Bones", "Huesos"],
    [46, "Cromossomos (numa célula)", "Chromosomes (in one cell)", "Cromosomas (en una célula)"],
    [33, "Vértebras (contando as do cóccix)", "Vertebrae (counting the tailbone)", "Vértebras (contando las del cóccix)"],
    [32, "Dentes (com os sisos)", "Teeth (with wisdom teeth)", "Dientes (con las muelas del juicio)"],
    [24, "Costelas", "Ribs", "Costillas"],
    [12, "Pares de nervos cranianos", "Pairs of cranial nerves", "Pares de nervios craneales"],
    [5, "Lobos dos dois pulmões juntos", "Lobes of both lungs together", "Lóbulos de los dos pulmones juntos"],
    [4, "Cavidades do coração", "Chambers of the heart", "Cavidades del corazón"],
    [3, "Ossinhos de cada ouvido", "Tiny bones in each ear", "Huesecillos de cada oído"],
    [2, "Rins", "Kidneys", "Riñones"],
  ],
});

mmTema({
  id: "municipios",
  titulo: ["Quantos municípios tem o estado", "Number of municipalities per state", "Cuántos municipios tiene el estado"],
  unidade: ["{n} municípios", "{n} municipalities", "{n} municipios"],
  botoes: MM_BOTOES.mais,
  perguntas: [
    ["O estado de baixo tem mais ou menos municípios?", "Does the state below have more or fewer municipalities?", "¿El estado de abajo tiene más o menos municipios?"],
    ["Contando as cidades, esse estado tem mais ou menos que o de cima?", "Counting towns, does this state have more or fewer than the one above?", "Contando ciudades, ¿este estado tiene más o menos que el de arriba?"],
    ["Para visitar todas as cidades desse, seriam mais ou menos paradas?", "To visit every town in this one, would there be more or fewer stops?", "Para visitar todas las ciudades de este, ¿serían más o menos paradas?"],
  ],
  itens: [
    [853, "Minas Gerais", "Minas Gerais", "Minas Gerais"],
    [645, "São Paulo", "São Paulo", "São Paulo"],
    [497, "Rio Grande do Sul", "Rio Grande do Sul", "Rio Grande do Sul"],
    [417, "Bahia", "Bahia", "Bahía"],
    [399, "Paraná", "Paraná", "Paraná"],
    [295, "Santa Catarina", "Santa Catarina", "Santa Catarina"],
    [246, "Goiás", "Goiás", "Goiás"],
    [224, "Piauí", "Piauí", "Piauí"],
    [217, "Maranhão", "Maranhão", "Maranhão"],
    [185, "Pernambuco", "Pernambuco", "Pernambuco"],
    [167, "Rio Grande do Norte", "Rio Grande do Norte", "Rio Grande do Norte"],
    [144, "Pará", "Pará", "Pará"],
    [102, "Alagoas", "Alagoas", "Alagoas"],
    [92, "Rio de Janeiro", "Rio de Janeiro", "Río de Janeiro"],
    [78, "Espírito Santo", "Espírito Santo", "Espírito Santo"],
    [62, "Amazonas", "Amazonas", "Amazonas"],
    [52, "Rondônia", "Rondônia", "Rondonia"],
    [22, "Acre", "Acre", "Acre"],
    [15, "Roraima", "Roraima", "Roraima"],
  ],
});

mmTema({
  id: "musicas",
  titulo: ["Duração de músicas famosas (versão do álbum)", "Length of famous songs (album version)", "Duración de canciones famosas (versión del álbum)"],
  unidade: ["{n} segundos", "{n} seconds", "{n} segundos"],
  margem: 1.08,
  botoes: MM_BOTOES.longo,
  perguntas: [
    ["A música de baixo é mais longa ou mais curta?", "Is the song below longer or shorter?", "¿La canción de abajo es más larga o más corta?"],
    ["Do primeiro ao último acorde, essa dura mais ou menos?", "From the first to the last note, does this one last longer or shorter?", "Del primer al último acorde, ¿esta dura más o menos?"],
    ["Cantando junto, essa acaba antes ou depois da de cima? (mais curta ou mais longa)", "Singing along, does this one end sooner or later than the one above? (shorter or longer)", "Cantando, ¿esta termina antes o después que la de arriba? (más corta o más larga)"],
  ],
  itens: [
    [537, "November Rain (Guns N' Roses)", "November Rain (Guns N' Roses)", "November Rain (Guns N' Roses)"],
    [482, "Stairway to Heaven (Led Zeppelin)", "Stairway to Heaven (Led Zeppelin)", "Stairway to Heaven (Led Zeppelin)"],
    [431, "Hey Jude (Beatles)", "Hey Jude (The Beatles)", "Hey Jude (The Beatles)"],
    [391, "Hotel California (Eagles)", "Hotel California (Eagles)", "Hotel California (Eagles)"],
    [355, "Bohemian Rhapsody (Queen)", "Bohemian Rhapsody (Queen)", "Bohemian Rhapsody (Queen)"],
    [301, "Smells Like Teen Spirit (Nirvana)", "Smells Like Teen Spirit (Nirvana)", "Smells Like Teen Spirit (Nirvana)"],
    [229, "Despacito", "Despacito", "Despacito"],
    [183, "Imagine (John Lennon)", "Imagine (John Lennon)", "Imagine (John Lennon)"],
    [113, "Old Town Road (original)", "Old Town Road (original)", "Old Town Road (original)"],
  ],
});

mmTema({
  id: "cafeina",
  titulo: ["Cafeína numa porção (aproximado)", "Caffeine per serving (approximate)", "Cafeína por porción (aproximado)"],
  unidade: ["{n} mg de cafeína", "{n} mg of caffeine", "{n} mg de cafeína"],
  margem: 1.3,
  botoes: MM_BOTOES.mais,
  perguntas: [
    ["O de baixo tem mais ou menos cafeína?", "Does the one below have more or less caffeine?", "¿El de abajo tiene más o menos cafeína?"],
    ["Para ficar acordado, esse ajuda mais ou menos?", "To stay awake, does this one help more or less?", "Para quedarse despierto, ¿este ayuda más o menos?"],
    ["Em cafeína, essa porção ganha ou perde da de cima? (mais ou menos)", "In caffeine, does this serving have more or less than the one above?", "En cafeína, ¿esta porción tiene más o menos que la de arriba?"],
  ],
  itens: [
    [160, "Lata grande de energético (473 ml)", "Large energy drink can (473 ml)", "Lata grande de bebida energética (473 ml)"],
    [95, "Xícara de café coado (240 ml)", "Cup of brewed coffee (240 ml)", "Taza de café filtrado (240 ml)"],
    [63, "Um espresso", "One espresso", "Un espresso"],
    [47, "Xícara de chá-preto", "Cup of black tea", "Taza de té negro"],
    [34, "Lata de refrigerante de cola (350 ml)", "Can of cola (350 ml)", "Lata de refresco de cola (350 ml)"],
    [12, "Barra de chocolate ao leite (40 g)", "Milk chocolate bar (40 g)", "Barra de chocolate con leche (40 g)"],
    [2, "Xícara de café descafeinado", "Cup of decaf coffee", "Taza de café descafeinado"],
  ],
});
