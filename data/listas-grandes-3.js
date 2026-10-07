// Mais listas grandes: 30 e 50 itens. Mesmo formato de listas.js.

const GRANDE = "Curadoria Top Ten: do mais lembrado ao menos óbvio";

LISTS.push(
  // ───────────── 30 itens ─────────────
  { id: "30-naruto", cat: "animes", title: "Os 30 personagens mais lembrados de Naruto", source: GRANDE,
    items: [
      "Naruto", "Sasuke", "Sakura", "Kakashi", "Itachi", "Hinata", "Gaara", "Jiraiya", "Orochimaru", "Madara",
      "Obito|Tobi", "Minato", "Tsunade", "Shikamaru", "Rock Lee|Lee", "Neji", "Pain|Nagato", "Kurama|Kyuubi|Raposa de Nove Caudas", "Iruka", "Kiba",
      "Choji", "Ino", "Tenten", "Shino", "Kisame", "Deidara", "Hashirama", "Konohamaru", "Might Guy|Gai|Guy", "Sai",
    ] },
  { id: "30-dragon-ball", cat: "animes", title: "Os 30 personagens mais lembrados de Dragon Ball", source: GRANDE,
    items: [
      "Goku", "Vegeta", "Gohan", "Piccolo", "Kuririn|Krillin", "Bulma", "Freeza|Frieza", "Cell", "Majin Boo|Boo", "Trunks",
      "Goten", "Mestre Kame|Mestre Kami|Kame", "Yamcha", "Tenshinhan|Tenshin", "Chi-Chi|Chichi", "Bills|Beerus", "Whis", "Broly", "Raditz", "Nappa",
      "Androide 18|Número 18|C-18", "Androide 17|Número 17|C-17", "Mr. Satan|Hércule", "Videl", "Shenlong|Shenron", "Pan", "Chaoz|Chaos", "Dende", "Zamasu", "Jiren",
    ] },
  { id: "30-pokemon-famosos", cat: "games", title: "Os 30 Pokémon mais famosos", source: GRANDE,
    items: [
      "Pikachu", "Charizard", "Bulbasaur", "Squirtle", "Charmander", "Mewtwo", "Eevee", "Gengar", "Jigglypuff", "Snorlax",
      "Lucario", "Psyduck", "Mew", "Meowth", "Gyarados", "Dragonite", "Togepi", "Greninja", "Lugia", "Blastoise",
      "Venusaur", "Magikarp", "Onix", "Ditto", "Rayquaza", "Mimikyu", "Arcanine", "Lapras", "Umbreon", "Machamp",
    ] },
  { id: "30-fauna-br", cat: "animais", title: "Os 30 animais da fauna brasileira mais lembrados", source: GRANDE,
    items: [
      "Onça-pintada|Onça", "Arara-azul|Arara", "Tucano", "Capivara", "Mico-leão-dourado", "Tamanduá-bandeira|Tamanduá", "Boto-cor-de-rosa|Boto", "Jacaré", "Preguiça|Bicho-preguiça", "Lobo-guará",
      "Sucuri|Anaconda", "Tatu", "Quati", "Papagaio", "Anta", "Ema", "Seriema", "Sagui", "Bugio", "Gambá|Saruê",
      "Jabuti", "Pirarucu", "Piranha", "Peixe-boi", "Ararajuba", "Harpia|Gavião-real", "Macaco-prego", "Cachorro-do-mato", "Ouriço-cacheiro|Ouriço", "Paca",
    ] },
  { id: "30-turma-monica", cat: "personagens", title: "Os 30 personagens mais lembrados da Turma da Mônica", source: GRANDE,
    items: [
      "Mônica", "Cebolinha", "Cascão", "Magali", "Chico Bento", "Bidu", "Franjinha", "Sansão", "Anjinho", "Penadinho",
      "Horácio", "Piteco", "Astronauta", "Papa-Capim", "Rosinha", "Marina", "Do Contra", "Xaveco", "Dorinha", "Humberto",
      "Jeremias", "Titi", "Denise", "Floquinho", "Mingau", "Louco|Seu Louco", "Capitão Feio", "Dona Morte", "Zé Lelé", "Nimbus",
    ] },
  { id: "30-selecao", cat: "futebol", title: "Os 30 jogadores mais famosos da Seleção Brasileira", source: GRANDE,
    items: [
      "Pelé", "Ronaldo|Ronaldo Fenômeno", "Ronaldinho|Ronaldinho Gaúcho", "Neymar", "Romário", "Zico", "Garrincha", "Kaká", "Rivaldo", "Cafu",
      "Roberto Carlos", "Sócrates", "Bebeto", "Rivellino", "Jairzinho", "Tostão", "Taffarel", "Dunga", "Vinícius Júnior|Vini Jr|Vinicius Jr", "Adriano",
      "Thiago Silva", "Marcelo", "Casemiro", "Alisson", "Daniel Alves|Dani Alves", "Careca", "Falcão", "Júnior", "Didi", "Gérson",
    ] },
  { id: "30-marcas-comida", cat: "comida", title: "As 30 marcas de comida e bebida mais famosas no Brasil", source: GRANDE,
    items: [
      "Coca-Cola|Coca", "Nestlé", "Guaraná Antarctica|Guaraná", "Nescau", "Toddy", "Sadia", "Perdigão", "Seara", "Bauducco", "Lacta",
      "Garoto", "Danone", "Itambé", "Piracanjuba", "Elma Chips", "Doritos", "Ruffles", "Trakinas", "Oreo", "Negresco",
      "Passatempo", "Bis", "Kit Kat", "Heinz", "Hellmann's|Hellmanns", "Nissin|Miojo", "Yakult", "Kopenhagen", "Fanta", "Sprite",
    ] },
  { id: "30-disney-classicos", cat: "filmes", title: "Os 30 primeiros longas de animação da Disney, em ordem", source: "Walt Disney Animation Studios",
    items: [
      "Branca de Neve e os Sete Anões|Branca de Neve", "Pinóquio", "Fantasia", "Dumbo", "Bambi", "Alô, Amigos|Alô Amigos|Saludos Amigos", "Você Já Foi à Bahia?|Você Já Foi à Bahia|Os Três Cavaleiros", "Música, Maestro!|Música Maestro", "Como É Bom Se Divertir", "Tempo de Melodia",
      "As Aventuras de Ichabod e Sr. Sapo|Ichabod e Sr. Sapo|Ichabod", "Cinderela", "Alice no País das Maravilhas|Alice", "Peter Pan", "A Dama e o Vagabundo", "A Bela Adormecida", "101 Dálmatas|Os 101 Dálmatas", "A Espada Era a Lei", "Mogli: O Menino Lobo|Mogli", "Aristogatas|Os Aristogatas",
      "Robin Hood", "As Aventuras do Ursinho Pooh|Ursinho Pooh", "Bernardo e Bianca", "O Cão e a Raposa", "O Caldeirão Mágico", "As Peripécias de um Ratinho Detetive|Ratinho Detetive", "Oliver e Sua Turma|Oliver e Seus Companheiros|Oliver", "A Pequena Sereia", "Bernardo e Bianca na Terra dos Cangurus", "A Bela e a Fera",
    ] },
  { id: "30-jogos-celular", cat: "games", title: "Os 30 jogos de celular mais famosos", source: GRANDE,
    items: [
      "Candy Crush", "Subway Surfers", "Free Fire", "Clash Royale", "Clash of Clans", "Among Us", "Angry Birds", "Pokémon GO", "Roblox", "Minecraft",
      "Fruit Ninja", "Temple Run", "Brawl Stars", "PUBG Mobile|PUBG", "Call of Duty Mobile|COD Mobile", "Plants vs. Zombies|Plants vs Zombies", "Flappy Bird", "Stumble Guys", "Genshin Impact", "8 Ball Pool",
      "Hay Day", "My Talking Tom|Talking Tom", "Cut the Rope", "Asphalt", "Hill Climb Racing", "Geometry Dash", "Township", "Homescapes", "Gartic", "Monument Valley",
    ] },
  { id: "30-empresas-br", cat: "curiosidades", title: "As 30 empresas mais conhecidas do Brasil", source: GRANDE,
    items: [
      "Petrobras", "Itaú", "Banco do Brasil", "Caixa|Caixa Econômica", "Bradesco", "Vale", "Ambev", "Globo|Rede Globo", "Nubank", "Magazine Luiza|Magalu",
      "Natura", "O Boticário|Boticário", "Embraer", "Correios", "JBS", "Havaianas", "Casas Bahia", "Americanas", "Renner", "Riachuelo",
      "Gol", "Azul", "iFood", "Mercado Livre", "Sadia", "Localiza", "WEG", "Totvs", "BRF", "Hering",
    ] },

  // ───────────── 50 itens ─────────────
  { id: "50-personagens-filmes", cat: "filmes", title: "Os 50 personagens de cinema mais famosos", source: GRANDE,
    items: [
      "Darth Vader", "Harry Potter", "James Bond|007", "Indiana Jones", "Coringa|Joker", "Jack Sparrow", "Forrest Gump", "Rocky Balboa|Rocky", "Exterminador do Futuro|T-800", "Batman",
      "Homem-Aranha", "Shrek", "Woody", "Buzz Lightyear|Buzz", "Simba", "Elsa", "Yoda", "Luke Skywalker", "Neo", "Gandalf",
      "Hannibal Lecter|Hannibal", "John Wick", "Rambo", "Marty McFly", "E.T.|ET", "King Kong", "Godzilla", "Gollum", "Frodo", "Hermione",
      "Vito Corleone|Don Corleone", "Tony Montana", "Mary Poppins", "Willy Wonka", "Chucky", "Freddy Krueger", "Jason|Jason Voorhees", "Pennywise", "Ghostface|Pânico", "Homem de Ferro|Tony Stark",
      "Thanos", "Capitão América", "Jack Dawson", "Han Solo", "Chewbacca", "Princesa Leia|Leia", "Ferris Bueller", "Doc Brown", "Mestre dos Magos", "Maverick",
    ] },
  { id: "50-personagens-series", cat: "tv", title: "Os 50 personagens de séries mais famosos", source: GRANDE,
    items: [
      "Walter White|Heisenberg", "Jon Snow", "Eleven|Onze", "Michael Scott", "Sheldon Cooper|Sheldon", "Daenerys", "Ross", "Rachel", "Joey", "Chandler",
      "Monica", "Phoebe", "Homer Simpson|Homer", "Bart Simpson|Bart", "Professor", "Tóquio", "Wandinha|Wednesday", "Dexter", "Dr. House|House", "Barney Stinson|Barney",
      "Ted Mosby|Ted", "Jesse Pinkman|Jesse", "Saul Goodman|Saul", "Tommy Shelby", "Rick Grimes", "Daryl", "Negan", "Sherlock Holmes|Sherlock", "Dwight", "Tyrion",
      "Arya Stark|Arya", "Cersei", "Chaves", "Seu Madruga", "Kiko", "Chris", "Will Smith|Will", "Carlton", "Lucifer", "Geralt",
      "Mandaloriano|Din Djarin", "Grogu|Baby Yoda", "Lineu", "Bob Esponja", "Patrick", "Rick Sanchez|Rick", "Morty", "Tony Soprano", "Jerry Seinfeld|Seinfeld", "Steve Harrington",
    ] },
  { id: "50-atores", cat: "filmes", title: "Os 50 atores e atrizes mais famosos", source: GRANDE,
    items: [
      "Leonardo DiCaprio|DiCaprio", "Brad Pitt", "Tom Cruise", "Will Smith", "Johnny Depp", "Tom Hanks", "Angelina Jolie", "Jennifer Aniston", "Robert Downey Jr.|Downey Jr", "Dwayne Johnson|The Rock",
      "Keanu Reeves", "Morgan Freeman", "Scarlett Johansson", "Julia Roberts", "Meryl Streep", "Margot Robbie", "Jennifer Lawrence", "Emma Watson", "Zendaya", "Sandra Bullock",
      "Denzel Washington", "Al Pacino", "Robert De Niro|De Niro", "Jim Carrey", "Adam Sandler", "Vin Diesel", "Jackie Chan", "Arnold Schwarzenegger|Schwarzenegger", "Sylvester Stallone|Stallone", "Ryan Reynolds",
      "Chris Hemsworth", "Chris Evans", "Hugh Jackman", "Tom Holland", "Timothée Chalamet|Chalamet", "Natalie Portman", "Anne Hathaway", "Nicole Kidman", "Cameron Diaz", "Gal Gadot",
      "Wagner Moura", "Rodrigo Santoro", "Fernanda Montenegro", "Selton Mello", "Lázaro Ramos", "Bruce Willis", "Harrison Ford", "Matt Damon", "Ben Affleck", "Fernanda Torres",
    ] },
  { id: "50-cidades-mundo", cat: "geografia", title: "As 50 cidades mais famosas do mundo", source: GRANDE,
    items: [
      "Nova York|New York", "Paris", "Londres", "Tóquio", "Rio de Janeiro|Rio", "Roma", "Dubai", "Los Angeles", "Barcelona", "São Paulo",
      "Las Vegas", "Miami", "Hong Kong", "Istambul", "Moscou", "Pequim", "Xangai", "Sydney", "Berlim", "Amsterdã|Amsterdam",
      "Veneza", "Lisboa", "Madri", "Buenos Aires", "Cidade do México", "Toronto", "Singapura|Cingapura", "Bangkok", "Cairo", "Atenas",
      "Chicago", "San Francisco|São Francisco", "Orlando", "Cancún", "Praga", "Viena", "Seul", "Mumbai", "Jerusalém", "Florença",
      "Milão", "Munique", "Washington", "Boston", "Havana", "Cidade do Cabo", "Marrakech", "Kyoto|Quioto", "Santiago", "Montevidéu",
    ] },
  { id: "50-cozinha", cat: "diaadia", title: "As 50 coisas que toda cozinha tem", source: GRANDE,
    items: [
      "Panela", "Geladeira", "Fogão", "Faca", "Garfo", "Colher", "Prato", "Copo", "Frigideira", "Pia",
      "Micro-ondas|Microondas", "Liquidificador", "Xícara", "Panela de pressão", "Concha", "Escumadeira", "Espátula", "Tábua de carne|Tábua", "Escorredor de macarrão|Escorredor", "Ralador",
      "Abridor de latas|Abridor", "Saca-rolhas", "Peneira", "Tigela|Bowl", "Jarra", "Pote", "Garrafa térmica", "Chaleira", "Cafeteira", "Bule",
      "Batedeira", "Forma de bolo|Forma", "Assadeira", "Rolo de massa", "Batedor|Fouet", "Pano de prato", "Esponja", "Detergente", "Avental", "Pegador de panela|Luva térmica",
      "Lixeira", "Torradeira", "Sanduicheira", "Air fryer|Fritadeira", "Funil", "Pilão", "Porta-guardanapo|Guardanapo", "Taça", "Freezer", "Filtro de água|Filtro",
    ] },
  { id: "50-musicas-br", cat: "musica", title: "As 50 músicas brasileiras mais famosas", source: GRANDE,
    items: [
      "Garota de Ipanema", "Aquarela do Brasil", "Asa Branca", "Evidências", "Ai Se Eu Te Pego", "Mas Que Nada", "País Tropical", "Tempo Perdido", "Pais e Filhos", "Faroeste Caboclo",
      "Eduardo e Mônica", "Detalhes", "Como uma Onda", "Chega de Saudade", "Construção", "Águas de Março", "Trem das Onze", "Carinhoso", "Sampa", "O Leãozinho|Leãozinho",
      "Andar com Fé", "Aquarela", "Mania de Você", "Ovelha Negra", "Malandragem", "Exagerado", "Codinome Beija-Flor", "Ideologia", "Pro Dia Nascer Feliz", "Pelados em Santos",
      "Anna Júlia", "Maluco Beleza", "Metamorfose Ambulante", "Gita", "Sozinho", "Velha Infância", "Amor I Love You", "Deixa a Vida Me Levar", "Lepo Lepo", "Show das Poderosas",
      "Infiel", "Fio de Cabelo", "É o Amor", "Pense em Mim", "Cálice", "Meu Erro", "Lanterna dos Afogados", "Vira-Vira", "Tropicália", "Sina",
    ] },
);
