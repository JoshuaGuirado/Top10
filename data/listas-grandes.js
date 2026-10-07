// Listas grandes: 30 e 50 itens. A pontuação continua sendo a posição
// (numa lista de 50, o 50º vale 50 pontos).

LISTS.push(
  // ───────────── 50 itens ─────────────
  { id: "50-herois", cat: "herois", title: "Os 50 heróis mais famosos", source: "Curadoria Topzi: do mais famoso ao menos lembrado",
    items: [
      "Homem-Aranha", "Batman", "Superman", "Homem de Ferro|Tony Stark", "Mulher-Maravilha", "Capitão América", "Hulk", "Thor", "Flash", "Pantera Negra",
      "Wolverine", "Viúva Negra", "Aquaman", "Lanterna Verde", "Capitã Marvel", "Doutor Estranho", "Deadpool", "Feiticeira Escarlate|Wanda", "Homem-Formiga", "Gavião Arqueiro",
      "Senhor das Estrelas|Star-Lord", "Groot", "Rocket|Rocket Raccoon", "Gamora", "Visão", "Falcão", "Soldado Invernal|Bucky", "Shazam", "Ciborgue", "Arqueiro Verde",
      "Supergirl", "Robin", "Batgirl", "Asa Noturna|Nightwing", "Tempestade", "Ciclope", "Jean Grey|Fênix", "Professor X|Xavier", "Vampira", "Demolidor",
      "Justiceiro", "Motoqueiro Fantasma", "Surfista Prateado", "Senhor Fantástico|Reed Richards", "Mulher Invisível", "Tocha Humana", "Coisa", "Chapolin Colorado|Chapolin", "He-Man", "Sr. Incrível|Senhor Incrível",
    ] },
  { id: "50-times", cat: "futebol", title: "Os 50 maiores times do mundo", source: "Curadoria Topzi: títulos, história e torcida",
    items: [
      "Real Madrid|Real", "Barcelona|Barça", "Manchester United|United", "Bayern de Munique|Bayern", "Liverpool", "Milan|AC Milan", "Juventus|Juve", "Paris Saint-Germain|PSG", "Chelsea", "Manchester City|City",
      "Inter de Milão|Internazionale", "Arsenal", "Boca Juniors|Boca", "River Plate|River", "Flamengo|Mengão", "Ajax", "Borussia Dortmund|Dortmund", "Atlético de Madrid", "Benfica", "Porto",
      "Palmeiras", "Corinthians", "São Paulo", "Santos", "Tottenham", "Napoli", "Roma", "Celtic", "Peñarol|Penarol", "Nacional",
      "Independiente", "Grêmio", "Internacional|Inter", "Cruzeiro", "Atlético Mineiro|Atlético-MG|Galo", "Vasco|Vasco da Gama", "Fluminense", "Botafogo", "Sporting", "Olympique de Marseille|Marseille",
      "Lazio", "Feyenoord", "PSV", "Galatasaray", "Fenerbahçe|Fenerbahce", "Rangers", "Al-Hilal", "Al-Nassr", "Inter Miami", "LA Galaxy|Los Angeles Galaxy",
    ] },
  { id: "50-animais", cat: "animais", title: "Os 50 animais mais conhecidos", source: "Curadoria Topzi: do mais lembrado ao menos óbvio",
    items: [
      "Cachorro|Cão", "Gato", "Leão", "Elefante", "Cavalo", "Vaca|Boi", "Macaco", "Tigre", "Girafa", "Galinha|Galo",
      "Porco", "Coelho", "Pato", "Urso", "Zebra", "Cobra|Serpente", "Lobo", "Tubarão", "Baleia", "Golfinho",
      "Rato", "Papagaio", "Jacaré", "Tartaruga", "Sapo", "Borboleta", "Abelha", "Formiga", "Coruja", "Águia",
      "Pinguim", "Raposa", "Ovelha|Carneiro", "Cabra|Bode", "Camelo", "Hipopótamo", "Rinoceronte", "Canguru", "Panda", "Onça|Onça-pintada",
      "Esquilo", "Polvo", "Gorila", "Arara", "Tucano", "Capivara", "Preguiça|Bicho-preguiça", "Coala", "Flamingo", "Pavão",
    ] },
  { id: "50-pokemon", cat: "games", title: "Os 50 primeiros Pokémon da Pokédex", source: "Pokédex Nacional",
    items: [
      "Bulbasaur", "Ivysaur", "Venusaur", "Charmander", "Charmeleon", "Charizard", "Squirtle", "Wartortle", "Blastoise", "Caterpie",
      "Metapod", "Butterfree", "Weedle", "Kakuna", "Beedrill", "Pidgey", "Pidgeotto", "Pidgeot", "Rattata", "Raticate",
      "Spearow", "Fearow", "Ekans", "Arbok", "Pikachu", "Raichu", "Sandshrew", "Sandslash", "Nidoran fêmea|Nidoran", "Nidorina",
      "Nidoqueen", "Nidoran macho", "Nidorino", "Nidoking", "Clefairy", "Clefable", "Vulpix", "Ninetales", "Jigglypuff", "Wigglytuff",
      "Zubat", "Golbat", "Oddish", "Gloom", "Vileplume", "Paras", "Parasect", "Venonat", "Venomoth", "Diglett",
    ] },
  { id: "50-desenhos", cat: "personagens", title: "Os 50 personagens de desenho mais famosos", source: "Curadoria Topzi: do mais lembrado ao menos óbvio",
    items: [
      "Mickey", "Pernalonga", "Bob Esponja", "Pato Donald|Donald", "Tom", "Jerry", "Scooby-Doo|Scooby", "Pica-Pau", "Homer Simpson|Homer", "Pikachu",
      "Goku", "Pateta", "Minnie", "Patolino", "Piu-Piu", "Frajola", "Papa-Léguas", "Coiote", "Popeye", "Pantera Cor-de-Rosa",
      "Fred Flintstone|Fred", "Zé Colmeia", "Garfield", "Snoopy", "Charlie Brown", "Shrek", "Woody", "Buzz Lightyear|Buzz", "Mônica", "Cebolinha",
      "Cascão", "Magali", "Bart Simpson|Bart", "Naruto", "Dora Aventureira|Dora", "Peppa Pig|Peppa", "Ben 10", "Patrick Estrela|Patrick", "Lula Molusco", "Doug",
      "Johnny Bravo", "Dexter", "Meninas Superpoderosas|Docinho|Florzinha|Lindinha", "Pinky e Cérebro|Pinky|Cérebro", "Hello Kitty", "Peter Griffin", "Rick Sanchez|Rick", "Finn", "Gumball", "Sonic",
    ] },

  // ───────────── 30 itens ─────────────
  { id: "30-times-br", cat: "futebol", title: "Os 30 times brasileiros mais famosos", source: "Curadoria Topzi: torcida e tradição",
    items: [
      "Flamengo|Mengão", "Corinthians|Timão", "São Paulo", "Palmeiras|Verdão", "Vasco|Vasco da Gama", "Santos|Peixe", "Grêmio", "Internacional|Inter", "Cruzeiro", "Atlético Mineiro|Atlético-MG|Galo",
      "Fluminense|Flu", "Botafogo|Fogão", "Bahia", "Sport", "Athletico Paranaense|Athletico|Atlético-PR|Furacão", "Fortaleza", "Ceará", "Vitória", "Coritiba|Coxa", "Goiás",
      "Ponte Preta", "Guarani", "Paysandu|Papão", "Remo", "Náutico", "Santa Cruz", "Red Bull Bragantino|Bragantino", "Juventude", "Chapecoense|Chape", "América Mineiro|América-MG",
    ] },
  { id: "30-frutas", cat: "comida", title: "As 30 frutas mais conhecidas", source: "Curadoria Topzi: do mais lembrado ao menos óbvio",
    items: [
      "Banana", "Maçã", "Laranja", "Uva", "Morango", "Melancia", "Abacaxi", "Manga", "Mamão", "Limão",
      "Pera", "Abacate", "Melão", "Kiwi", "Goiaba", "Maracujá", "Tangerina|Mexerica|Bergamota|Ponkan", "Coco", "Caju", "Açaí",
      "Acerola", "Pêssego", "Ameixa", "Cereja", "Jabuticaba", "Framboesa", "Mirtilo|Blueberry", "Figo", "Pitaya", "Graviola",
    ] },
  { id: "30-profissoes", cat: "diaadia", title: "As 30 profissões mais conhecidas", source: "Curadoria Topzi: do mais lembrado ao menos óbvio",
    items: [
      "Médico|Médica", "Professor|Professora", "Policial", "Bombeiro|Bombeira", "Advogado|Advogada", "Engenheiro|Engenheira", "Dentista", "Enfermeiro|Enfermeira", "Cozinheiro|Cozinheira|Chef", "Motorista",
      "Pedreiro", "Veterinário|Veterinária", "Jornalista", "Piloto|Piloto de avião", "Cabeleireiro|Cabeleireira", "Arquiteto|Arquiteta", "Programador|Programadora", "Garçom|Garçonete", "Padeiro|Padeira", "Eletricista",
      "Mecânico", "Psicólogo|Psicóloga", "Contador|Contadora", "Ator|Atriz", "Cantor|Cantora", "Jogador de futebol|Jogador", "Fotógrafo|Fotógrafa", "Juiz|Juíza", "Carteiro", "Astronauta",
    ] },
  { id: "30-filmes", cat: "filmes", title: "Os 30 filmes mais famosos de todos os tempos", source: "Curadoria Topzi: do mais lembrado ao menos óbvio",
    items: [
      "Titanic", "Avatar", "O Rei Leão", "Vingadores: Ultimato|Ultimato", "Star Wars", "Harry Potter", "Jurassic Park", "O Poderoso Chefão", "Toy Story", "Matrix",
      "De Volta para o Futuro", "E.T.|ET|E.T. o Extraterrestre", "Forrest Gump", "Tubarão", "Shrek", "Frozen", "O Senhor dos Anéis|Senhor dos Anéis", "Procurando Nemo|Nemo", "Rocky", "Esqueceram de Mim",
      "Homem-Aranha", "Batman: O Cavaleiro das Trevas|O Cavaleiro das Trevas", "Piratas do Caribe", "Velozes e Furiosos", "Indiana Jones", "Pulp Fiction", "Clube da Luta", "Gladiador", "O Exterminador do Futuro|Exterminador do Futuro", "Coringa",
    ] },
  { id: "30-jogadores", cat: "futebol", title: "Os 30 jogadores de futebol mais famosos", source: "Curadoria Topzi: do mais lembrado ao menos óbvio",
    items: [
      "Pelé", "Messi", "Cristiano Ronaldo|CR7|Cristiano", "Maradona", "Ronaldo|Ronaldo Fenômeno", "Neymar", "Ronaldinho|Ronaldinho Gaúcho", "Zidane", "Mbappé", "Romário",
      "Zico", "Kaká", "Beckham", "Garrincha", "Cruyff", "Beckenbauer", "Haaland", "Vini Jr.|Vinícius Júnior|Vini", "Rivaldo", "Roberto Carlos",
      "Cafu", "Ibrahimović|Ibrahimovic|Ibra", "Thierry Henry|Henry", "Iniesta", "Modrić|Modric", "Salah", "Lewandowski", "Buffon", "Marta", "Puskás|Puskas",
    ] },
  { id: "30-viloes", cat: "personagens", title: "Os 30 vilões mais famosos", source: "Curadoria Topzi: do mais lembrado ao menos óbvio",
    items: [
      "Darth Vader|Vader", "Coringa", "Thanos", "Voldemort", "Scar", "Malévola", "Loki", "Freddy Krueger|Freddy", "Jason", "Chucky",
      "Pennywise|It", "Lex Luthor", "Magneto", "Bowser", "Úrsula", "Jafar", "Cruella", "Hades", "Capitão Gancho|Gancho", "Rainha Má",
      "Hannibal Lecter|Hannibal", "Sauron", "Agente Smith", "Duende Verde", "Venom", "Bane", "Doutor Octopus|Doc Ock", "Plankton", "Megatron", "Exterminador do Futuro|T-800",
    ] },
);
