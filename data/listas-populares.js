// Listas populares: a categoria Bíblia e, em todas as categorias, as listas "óbvias" que todo mundo
// procura (mais ricos, mais títulos, mais vendidos, mais famosos). Rankings que mudam com o tempo
// dizem no título até quando valem; empates seguem a ordem de quem chegou primeiro.

const CURADORIA_POP = "Curadoria Topzi: do mais lembrado ao menos óbvio";

CATEGORIES.push({ id: "biblia", label: "Bíblia" });

LISTS.push(
  // ───────────── Bíblia ─────────────
  { id: "p-biblia-conhecidos", cat: "biblia", title: "Os 10 personagens mais conhecidos da Bíblia", source: CURADORIA_POP,
    items: ["Jesus|Jesus Cristo|Cristo", "Moisés", "Davi|Rei Davi|David", "Abraão", "Noé", "Adão", "Eva", "Maria|Virgem Maria|Nossa Senhora", "Pedro|São Pedro|Simão Pedro", "Paulo|São Paulo|Apóstolo Paulo|Saulo"] },
  { id: "p-biblia-citados", cat: "biblia", title: "Os 10 personagens mais citados pelo nome na Bíblia", source: "Curadoria Topzi (contagem aproximada de menções)",
    items: ["Jesus|Jesus Cristo|Cristo", "Davi|Rei Davi|David", "Moisés", "Jacó|Israel", "Arão|Aarão", "Saul|Rei Saul", "Salomão|Rei Salomão", "Abraão|Abrão", "José|José do Egito", "Josué"] },
  { id: "p-biblia-livros-at", cat: "biblia", title: "Os 10 primeiros livros da Bíblia", source: "A Bíblia (ordem do Antigo Testamento)",
    items: ["Gênesis|Genesis", "Êxodo|Exodo", "Levítico", "Números", "Deuteronômio", "Josué", "Juízes", "Rute", "1 Samuel|I Samuel|Primeiro Samuel|1 Sm", "2 Samuel|II Samuel|Segundo Samuel|2 Sm"] },
  { id: "p-biblia-livros-nt", cat: "biblia", title: "Os 10 primeiros livros do Novo Testamento", source: "A Bíblia (ordem do Novo Testamento)",
    items: ["Mateus|Evangelho de Mateus", "Marcos|Evangelho de Marcos", "Lucas|Evangelho de Lucas", "João|Evangelho de João", "Atos|Atos dos Apóstolos", "Romanos", "1 Coríntios|I Coríntios|Primeira aos Coríntios", "2 Coríntios|II Coríntios|Segunda aos Coríntios", "Gálatas", "Efésios"] },
  { id: "p-biblia-pragas", cat: "biblia", title: "As 10 pragas do Egito, em ordem", source: "Êxodo 7 a 12",
    items: ["Água em sangue|Sangue|~sangue", "Rãs|Sapos|~ras|~sapo", "Piolhos|Mosquitos|~piolho|~mosquito", "Moscas|~mosca", "Peste nos animais|Peste no gado|~peste|~gado|~rebanho", "Úlceras|Feridas|Tumores|~ulcera|~ferida|~tumor", "Granizo|Chuva de pedra|~granizo|~pedra", "Gafanhotos|~gafanhoto", "Trevas|Escuridão|~trevas|~escuridao", "Morte dos primogênitos|~primogenito"] },
  { id: "p-biblia-mandamentos", cat: "biblia", title: "Os Dez Mandamentos, em ordem", source: "Êxodo 20 (ordem usada pela maioria das igrejas evangélicas)",
    items: ["Não terás outros deuses|~outros deuses|~amar a deus|~um so deus", "Não farás imagem de escultura|~imagem|~escultura|~idolo", "Não tomarás o nome de Deus em vão|~em vao|~nome de deus|~santo nome", "Guardar o dia de descanso|Lembra-te do sábado|~sabado|~domingo|~descanso|~dia do senhor", "Honra teu pai e tua mãe|~pai e mae|~pai e tua mae|~honrar", "Não matarás|~matar|~mataras", "Não adulterarás|~adulter|~castidade", "Não furtarás|~furtar|~roubar|~furtaras|~roubaras", "Não dirás falso testemunho|~falso testemunho|~mentir", "Não cobiçarás|~cobicar|~cobicaras|~desejar"] },
  { id: "p-biblia-apostolos", cat: "biblia", title: "Os 10 apóstolos de Jesus mais lembrados", source: CURADORIA_POP,
    items: ["Pedro|São Pedro|Simão Pedro", "João|São João|João Evangelista", "Judas Iscariotes|Judas", "Tiago|Tiago Maior", "André|Santo André", "Tomé|São Tomé", "Mateus|São Mateus|Levi", "Filipe", "Bartolomeu|Natanael", "Simão|Simão, o Zelote|Simão Zelote"] },
  { id: "p-biblia-livros-famosos", cat: "biblia", title: "Os 10 livros mais famosos da Bíblia", source: CURADORIA_POP,
    items: ["Gênesis|Genesis", "Salmos", "Apocalipse", "Êxodo|Exodo", "Provérbios", "João|Evangelho de João", "Mateus|Evangelho de Mateus", "Atos|Atos dos Apóstolos", "Romanos", "Isaías"] },
  { id: "p-biblia-milagres", cat: "biblia", title: "Os 10 milagres de Jesus mais conhecidos", source: CURADORIA_POP,
    items: ["Água em vinho|~vinho|~bodas de cana", "Multiplicação dos pães|~paes|~pao|~multiplicacao", "Andar sobre as águas|~andar sobre|~sobre as aguas|~sobre a agua", "Ressurreição de Lázaro|~lazaro", "Cura do cego|~cego|~cegos", "Acalmar a tempestade|~tempestade", "Cura do paralítico|~paralitico", "Cura dos leprosos|~leproso", "Pesca milagrosa|~pesca", "Ressurreição da filha de Jairo|~jairo"] },
  { id: "p-biblia-mulheres", cat: "biblia", title: "As 10 mulheres mais conhecidas da Bíblia", source: CURADORIA_POP,
    items: ["Maria|Virgem Maria|Nossa Senhora", "Eva", "Maria Madalena|Madalena", "Sara|Sarai", "Ester|Rainha Ester", "Rute", "Raquel", "Rebeca", "Dalila", "Marta"] },
  { id: "p-biblia-at", cat: "biblia", title: "Os 10 personagens mais lembrados do Antigo Testamento", source: CURADORIA_POP,
    items: ["Moisés", "Noé", "Adão", "Davi|Rei Davi|David", "Abraão", "Golias", "Sansão", "Jonas", "Daniel", "Salomão|Rei Salomão"] },
  { id: "p-biblia-lugares", cat: "biblia", title: "Os 10 lugares mais famosos da Bíblia", source: CURADORIA_POP,
    items: ["Jerusalém", "Belém", "Egito", "Nazaré", "Jardim do Éden|Éden|Paraíso", "Babilônia", "Galileia|Mar da Galileia", "Monte Sinai|Sinai", "Sodoma e Gomorra|~sodoma|~gomorra", "Rio Jordão|Jordão"] },
  { id: "p-biblia-animais", cat: "biblia", title: "Os 10 animais mais lembrados da Bíblia", source: CURADORIA_POP,
    items: ["Serpente|Cobra", "Cordeiro", "Pomba", "Leão|Leões", "Jumento|Burro|Jumentinho", "Grande peixe|Baleia|Peixe", "Ovelha", "Camelo", "Corvo", "Bezerro de ouro|Bezerro"] },

  // ───────────── geografia ─────────────
  { id: "p-predios", cat: "geografia", title: "Os 10 prédios mais altos do mundo", source: "CTBUH (prédios concluídos até 2025)",
    items: ["Burj Khalifa", "Merdeka 118", "Shanghai Tower|Torre de Xangai", "Abraj Al-Bait|Torre do Relógio de Meca|Makkah Clock Tower", "Ping An Finance Centre|Ping An", "Lotte World Tower|Lotte Tower", "One World Trade Center|Freedom Tower|One WTC|World Trade Center", "Guangzhou CTF Finance Centre|CTF Guangzhou", "Tianjin CTF Finance Centre|CTF Tianjin", "CITIC Tower|China Zun"] },
  { id: "p-felizes", cat: "geografia", title: "Os 10 países mais felizes do mundo (2025)", source: "World Happiness Report 2025",
    items: ["Finlândia", "Dinamarca", "Islândia", "Suécia", "Holanda|Países Baixos", "Costa Rica", "Noruega", "Israel", "Luxemburgo", "México"] },
  { id: "p-paises-famosos", cat: "geografia", title: "Os 10 países mais famosos do mundo", source: CURADORIA_POP,
    items: ["Estados Unidos|EUA|USA", "Brasil", "China", "França", "Japão", "Itália", "Inglaterra|Reino Unido", "Alemanha", "Espanha", "Argentina"] },

  // ───────────── Brasil ─────────────
  { id: "p-brasileiros-famosos", cat: "brasil", title: "Os 10 brasileiros mais famosos no mundo", source: CURADORIA_POP,
    items: ["Pelé", "Neymar|Neymar Jr", "Ronaldinho|Ronaldinho Gaúcho", "Ayrton Senna|Senna", "Gisele Bündchen|Gisele", "Anitta", "Ronaldo|Ronaldo Fenômeno", "Paulo Coelho", "Lula", "Xuxa"] },
  { id: "p-lembra-brasil", cat: "brasil", title: "As 10 coisas que mais lembram o Brasil lá fora", source: CURADORIA_POP,
    items: ["Futebol", "Carnaval", "Samba", "Cristo Redentor", "Amazônia|Floresta Amazônica", "Praia|Praias|Copacabana", "Caipirinha", "Feijoada", "Havaianas|Chinelo", "Pão de Açúcar"] },
  { id: "p-presidentes-recentes", cat: "brasil", title: "Os 10 presidentes do Brasil mais lembrados", source: CURADORIA_POP,
    items: ["Lula|Luiz Inácio Lula da Silva", "Bolsonaro|Jair Bolsonaro", "Dilma|Dilma Rousseff", "Getúlio Vargas|Getúlio|Vargas", "Fernando Henrique Cardoso|FHC|Fernando Henrique", "Juscelino Kubitschek|JK|Juscelino", "Collor|Fernando Collor", "Temer|Michel Temer", "Deodoro da Fonseca|Deodoro|Marechal Deodoro", "Sarney|José Sarney"] },

  // ───────────── futebol ─────────────
  { id: "p-jogadores-ricos", cat: "futebol", title: "Os 10 jogadores de futebol mais bem pagos do mundo (2025)", source: "Forbes, 2025 (salário + patrocínios)",
    items: ["Cristiano Ronaldo|CR7|Cristiano", "Lionel Messi|Messi", "Karim Benzema|Benzema", "Kylian Mbappé|Mbappé", "Erling Haaland|Haaland", "Vinícius Júnior|Vinícius Jr|Vini Jr|Vinicius", "Mohamed Salah|Salah", "Sadio Mané|Mané", "Jude Bellingham|Bellingham", "Lamine Yamal|Yamal"] },
  { id: "p-champions-titulos", cat: "futebol", title: "Os 10 clubes com mais títulos da Champions League (até 2025)", source: "UEFA (empates pela ordem do primeiro título)",
    items: ["Real Madrid|Real", "Milan|AC Milan", "Bayern de Munique|Bayern", "Liverpool", "Barcelona|Barça", "Ajax", "Inter de Milão|Inter|Internazionale", "Manchester United|United|Man Utd", "Benfica", "Nottingham Forest|Forest"] },
  { id: "p-libertadores-titulos", cat: "futebol", title: "Os 10 clubes com mais títulos da Libertadores (até 2025)", source: "CONMEBOL (empates pela ordem do primeiro título)",
    items: ["Independiente", "Boca Juniors|Boca", "Peñarol|Penarol", "Estudiantes", "Flamengo|Fla|Mengão", "River Plate|River", "Santos", "Nacional|Nacional do Uruguai", "Olimpia", "Grêmio"] },
  { id: "p-bola-ouro-mais", cat: "futebol", title: "Os 10 jogadores com mais Bolas de Ouro (até 2025)", source: "France Football (empates pela ordem do primeiro prêmio)",
    items: ["Lionel Messi|Messi", "Cristiano Ronaldo|CR7|Cristiano", "Johan Cruyff|Cruyff", "Michel Platini|Platini", "Marco van Basten|Van Basten", "Alfredo Di Stéfano|Di Stéfano", "Franz Beckenbauer|Beckenbauer", "Kevin Keegan|Keegan", "Karl-Heinz Rummenigge|Rummenigge", "Ronaldo|Ronaldo Fenômeno|R9"] },

  // ───────────── esporte ─────────────
  { id: "p-atletas-ricos", cat: "esporte", title: "Os 10 atletas mais bem pagos do mundo (2025)", source: "Forbes, 2025 (salário + patrocínios)",
    items: ["Cristiano Ronaldo|CR7|Cristiano", "Stephen Curry|Curry", "Tyson Fury|Fury", "Dak Prescott|Prescott", "Lionel Messi|Messi", "LeBron James|LeBron", "Juan Soto|Soto", "Karim Benzema|Benzema", "Shohei Ohtani|Ohtani", "Kevin Durant|Durant"] },
  { id: "p-paris-2024", cat: "esporte", title: "Os 10 países com mais medalhas de ouro em Paris 2024", source: "Quadro de medalhas oficial dos Jogos de Paris 2024",
    items: ["Estados Unidos|EUA|USA", "China", "Japão", "Austrália", "França", "Holanda|Países Baixos", "Grã-Bretanha|Reino Unido|Inglaterra", "Coreia do Sul|Coreia", "Itália", "Alemanha"] },
  { id: "p-atletas-famosos", cat: "esporte", title: "Os 10 atletas mais famosos do mundo", source: CURADORIA_POP,
    items: ["Cristiano Ronaldo|CR7|Cristiano", "Lionel Messi|Messi", "Michael Jordan|Jordan", "Usain Bolt|Bolt", "LeBron James|LeBron", "Neymar|Neymar Jr", "Serena Williams|Serena", "Roger Federer|Federer", "Muhammad Ali|Ali", "Michael Phelps|Phelps"] },

  // ───────────── filmes ─────────────
  { id: "p-bilheterias", cat: "filmes", title: "As 10 maiores bilheterias da história do cinema (até 2024)", source: "Box Office Mojo (valores mundiais sem correção)",
    items: ["Avatar", "Vingadores: Ultimato|Ultimato|Avengers: Endgame|Endgame", "Avatar: O Caminho da Água|Avatar 2|O Caminho da Água", "Titanic", "Star Wars: O Despertar da Força|O Despertar da Força|Star Wars 7", "Vingadores: Guerra Infinita|Guerra Infinita|Infinity War", "Homem-Aranha: Sem Volta para Casa|Sem Volta para Casa|No Way Home", "Divertida Mente 2|Inside Out 2", "Jurassic World|Jurassic World: O Mundo dos Dinossauros", "O Rei Leão (2019)|O Rei Leão|Rei Leão"] },
  { id: "p-filmes-mais-vistos", cat: "filmes", title: "Os 10 filmes que todo mundo já viu", source: CURADORIA_POP,
    items: ["Titanic", "O Rei Leão|Rei Leão", "Harry Potter|~harry potter", "Toy Story", "Vingadores|Os Vingadores|~vingadores", "Shrek", "Star Wars|Guerra nas Estrelas|~star wars", "Esqueceram de Mim", "Frozen", "Procurando Nemo|Nemo"] },

  // ───────────── heróis ─────────────
  { id: "p-herois-bilheteria", cat: "herois", title: "Os 10 filmes de super-herói com maior bilheteria (até 2024)", source: "Box Office Mojo (filmes live-action)",
    items: ["Vingadores: Ultimato|Ultimato|Endgame", "Vingadores: Guerra Infinita|Guerra Infinita|Infinity War", "Homem-Aranha: Sem Volta para Casa|Sem Volta para Casa|No Way Home", "Os Vingadores|Vingadores|The Avengers", "Vingadores: Era de Ultron|Era de Ultron", "Pantera Negra", "Deadpool & Wolverine|Deadpool e Wolverine", "Homem de Ferro 3", "Capitão América: Guerra Civil|Guerra Civil", "Aquaman"] },
  { id: "p-herois-fortes", cat: "herois", title: "Os 10 heróis mais fortes de todos os tempos", source: CURADORIA_POP,
    items: ["Superman|Super-Homem", "Thor", "Hulk", "Capitã Marvel|Carol Danvers", "Mulher-Maravilha", "Feiticeira Escarlate|Wanda", "Doutor Estranho", "Lanterna Verde", "Flash", "Homem-Aranha"] },

  // ───────────── animes ─────────────
  { id: "p-animes-viloes", cat: "animes", title: "Os 10 vilões de anime mais famosos", source: CURADORIA_POP,
    items: ["Freeza|Frieza", "Madara|Madara Uchiha", "Orochimaru", "Cell", "Majin Boo|Buu|Boo", "Pain|Nagato", "Aizen|Sosuke Aizen", "Muzan|Muzan Kibutsuji", "Light Yagami|Light|Kira", "Equipe Rocket|Equipe Rocket (Jessie e James)|Jessie e James"] },
  { id: "p-animes-protagonistas", cat: "animes", title: "Os 10 protagonistas de anime mais famosos", source: CURADORIA_POP,
    items: ["Goku", "Naruto|Naruto Uzumaki", "Luffy|Monkey D. Luffy", "Ash|Ash Ketchum", "Seiya|Seiya de Pégaso", "Tanjiro|Tanjiro Kamado", "Eren|Eren Yeager|Eren Jaeger", "Ichigo|Ichigo Kurosaki", "Edward Elric|Ed Elric", "Yusuke|Yusuke Urameshi"] },

  // ───────────── games ─────────────
  { id: "p-jogos-vendidos", cat: "games", title: "Os 10 videogames mais vendidos da história", source: "Curadoria Topzi com base nas vendas divulgadas (2025)",
    items: ["Minecraft", "GTA V|GTA 5|Grand Theft Auto V", "Tetris", "Wii Sports", "Mario Kart 8 Deluxe|Mario Kart 8", "Red Dead Redemption 2|RDR2|Red Dead 2", "PUBG|PUBG: Battlegrounds", "Terraria", "The Witcher 3|Witcher 3", "Super Mario Bros.|Super Mario Bros"] },
  { id: "p-consoles-vendidos", cat: "games", title: "Os 10 consoles mais vendidos da história", source: "Vendas divulgadas pelas fabricantes até 2025",
    items: ["PlayStation 2|PS2", "Nintendo Switch|Switch", "Nintendo DS|DS", "Game Boy|Game Boy Color", "PlayStation 4|PS4", "PlayStation|PS1|PlayStation 1", "Wii|Nintendo Wii", "PlayStation 3|PS3", "Xbox 360", "Game Boy Advance|GBA"] },

  // ───────────── música ─────────────
  { id: "p-artistas-vendas", cat: "musica", title: "Os 10 artistas que mais venderam discos na história", source: "Curadoria Topzi com base nas vendas declaradas",
    items: ["The Beatles|Beatles", "Elvis Presley|Elvis", "Michael Jackson|MJ", "Elton John", "Queen", "Madonna", "Rihanna", "Led Zeppelin", "Pink Floyd", "Taylor Swift"] },
  { id: "p-cantoras-br", cat: "musica", title: "As 10 cantoras brasileiras mais famosas", source: CURADORIA_POP,
    items: ["Anitta", "Ivete Sangalo|Ivete", "Elis Regina|Elis", "Marília Mendonça", "Rita Lee", "Gal Costa", "Maria Bethânia|Bethânia", "Ludmilla", "Claudia Leitte", "Marisa Monte"] },
  { id: "p-cantores-br", cat: "musica", title: "Os 10 cantores brasileiros mais famosos", source: CURADORIA_POP,
    items: ["Roberto Carlos", "Tim Maia", "Caetano Veloso|Caetano", "Gilberto Gil|Gil", "Chico Buarque|Chico", "Cazuza", "Renato Russo", "Gusttavo Lima", "Djavan", "Zeca Pagodinho"] },

  // ───────────── TV ─────────────
  { id: "p-netflix", cat: "tv", title: "As 10 séries da Netflix mais famosas", source: CURADORIA_POP,
    items: ["Stranger Things", "Round 6|Squid Game", "La Casa de Papel|Money Heist", "Wandinha|Wednesday", "Bridgerton", "The Crown", "Dark", "Narcos", "Black Mirror", "You|Você"] },
  { id: "p-novelas-classicas", cat: "tv", title: "As 10 novelas mais lembradas da TV brasileira", source: CURADORIA_POP,
    items: ["Avenida Brasil", "O Clone", "Senhora do Destino", "Mulheres de Areia", "Roque Santeiro", "Pantanal", "Laços de Família", "Por Amor", "Terra Nostra", "Vale Tudo"] },

  // ───────────── ciência ─────────────
  { id: "p-elementos-conhecidos", cat: "ciencia", title: "Os 10 elementos químicos mais conhecidos", source: CURADORIA_POP,
    items: ["Oxigênio", "Hidrogênio", "Carbono", "Ferro", "Ouro", "Prata", "Nitrogênio", "Hélio", "Sódio", "Cálcio"] },
  { id: "p-planetas", cat: "ciencia", title: "Os 10 corpos celestes mais famosos", source: CURADORIA_POP,
    items: ["Sol", "Lua", "Terra", "Marte", "Júpiter", "Saturno", "Vênus", "Plutão", "Mercúrio", "Netuno"] },

  // ───────────── matemática ─────────────
  { id: "p-matematicos", cat: "matematica", title: "Os 10 matemáticos mais famosos", source: CURADORIA_POP,
    items: ["Pitágoras", "Isaac Newton|Newton", "Euclides", "Arquimedes", "Bhaskara|Bhaskara II", "Tales de Mileto|Tales", "Leonhard Euler|Euler", "Carl Friedrich Gauss|Gauss", "René Descartes|Descartes", "Fibonacci|Leonardo Fibonacci"] },
  { id: "p-simbolos-mat", cat: "matematica", title: "As 10 contas e conceitos de matemática que todo mundo aprende", source: CURADORIA_POP,
    items: ["Soma|Adição|Mais", "Subtração|Menos", "Multiplicação|Vezes", "Divisão|Dividir", "Fração|Frações", "Porcentagem|Por cento", "Raiz quadrada|Raiz", "Potência|Potenciação|Expoente", "Equação|Equações", "Regra de três"] },

  // ───────────── história ─────────────
  { id: "p-presidentes-eua", cat: "historia", title: "Os 10 presidentes dos EUA mais famosos", source: CURADORIA_POP,
    items: ["Abraham Lincoln|Lincoln", "George Washington|Washington", "Barack Obama|Obama", "Donald Trump|Trump", "John F. Kennedy|Kennedy|JFK", "Franklin D. Roosevelt|Franklin Roosevelt|FDR", "Ronald Reagan|Reagan", "Thomas Jefferson|Jefferson", "Joe Biden|Biden", "Richard Nixon|Nixon"] },
  { id: "p-imperios", cat: "historia", title: "Os 10 impérios mais famosos da história", source: CURADORIA_POP,
    items: ["Império Romano|Roma|Romano", "Império Mongol|Mongol|Mongóis", "Império Britânico|Britânico", "Império Otomano|Otomano", "Império Persa|Persa|Pérsia", "Império Macedônico|Alexandre, o Grande|Macedônico", "Império Bizantino|Bizantino", "Império Inca|Incas|Inca", "Império Asteca|Astecas|Asteca", "Império Português|Português"] },

  // ───────────── curiosidades ─────────────
  { id: "p-mais-ricos", cat: "curiosidades", title: "As 10 pessoas mais ricas do mundo (2025)", source: "Forbes, lista de bilionários de 2025",
    items: ["Elon Musk|Musk", "Mark Zuckerberg|Zuckerberg", "Jeff Bezos|Bezos", "Larry Ellison|Ellison", "Bernard Arnault|Arnault", "Warren Buffett|Buffett", "Larry Page|Page", "Sergey Brin|Brin", "Amancio Ortega|Ortega", "Steve Ballmer|Ballmer"] },
  { id: "p-marcas-valiosas", cat: "curiosidades", title: "As 10 marcas mais valiosas do mundo (2024)", source: "Interbrand, Best Global Brands 2024",
    items: ["Apple", "Microsoft", "Amazon", "Google", "Samsung", "Toyota", "Coca-Cola|Coca", "Mercedes-Benz|Mercedes", "McDonald's|McDonalds|Méqui", "BMW"] },

  // ───────────── idiomas ─────────────
  { id: "p-saudacoes-ingles", cat: "idiomas", title: "As 10 saudações mais usadas em inglês", source: CURADORIA_POP,
    items: ["Hello", "Hi", "Good morning", "How are you?|How are you", "Good night", "Hey", "Good afternoon", "What's up?|What's up|Whats up|Sup", "Good evening", "Nice to meet you"] },
  { id: "p-eu-te-amo", cat: "idiomas", title: "Como se diz \"eu te amo\" nos idiomas mais conhecidos", source: CURADORIA_POP,
    items: ["I love you (inglês)|I love you", "Te amo (espanhol)|Te quiero", "Je t'aime (francês)|Je t'aime|Je taime", "Ti amo (italiano)|Ti amo", "Ich liebe dich (alemão)|Ich liebe dich", "Aishiteru (japonês)|Aishiteru", "Saranghae (coreano)|Saranghae", "Wo ai ni (mandarim)|Wo ai ni", "Ya tebya lyublyu (russo)|Ya tebya lyublyu", "Seni seviyorum (turco)|Seni seviyorum"] },

  // ───────────── animais ─────────────
  { id: "p-animais-inteligentes", cat: "animais", title: "Os 10 animais mais inteligentes", source: CURADORIA_POP,
    items: ["Chimpanzé", "Golfinho", "Elefante", "Polvo", "Corvo", "Orangotango", "Porco", "Papagaio", "Cachorro|Cão", "Gorila"] },
  { id: "p-animais-extincao", cat: "animais", title: "Os 10 animais ameaçados de extinção mais famosos", source: CURADORIA_POP,
    items: ["Panda|Panda-gigante", "Tigre", "Rinoceronte", "Mico-leão-dourado", "Arara-azul", "Urso-polar", "Orangotango", "Gorila", "Tartaruga-marinha", "Onça-pintada|Onça"] },

  // ───────────── frases ─────────────
  { id: "p-frases-brasileiro", cat: "frases", title: "Frases que todo brasileiro fala", source: CURADORIA_POP,
    items: ["Se Deus quiser|~deus quiser", "Vou ver e te aviso|~te aviso|~vou ver", "Bora|Vamos nessa|~bora", "Nossa!|Nossa|~nossa", "Tá tranquilo|~ta tranquilo|~tranquilo", "Depois a gente marca|~a gente marca|~gente marca", "Chego em 5 minutos|~5 minutos|~cinco minutos", "Fala sério|~fala serio", "Tô morrendo de fome|~morrendo de fome", "Que calor!|~que calor"] },

  // ───────────── personagens ─────────────
  { id: "p-personagens-famosos", cat: "personagens", title: "Os 10 personagens mais famosos de todos os tempos", source: CURADORIA_POP,
    items: ["Mickey Mouse|Mickey", "Super Mario|Mario", "Batman", "Homem-Aranha", "Harry Potter", "Pikachu", "Bob Esponja", "Homer Simpson|Homer", "Superman|Super-Homem", "Sherlock Holmes|Sherlock"] },

  // ───────────── comida ─────────────
  { id: "p-delivery", cat: "comida", title: "Os 10 pratos mais pedidos no delivery", source: CURADORIA_POP,
    items: ["Hambúrguer|Hamburguer|Lanche|X-burguer", "Pizza", "Açaí", "Marmita|Prato feito|PF", "Comida japonesa|Sushi|Temaki", "Pastel", "Esfiha|Esfirra", "Frango frito|Frango", "Batata frita|Fritas", "Cachorro-quente|Hot dog"] },
  { id: "p-comidas-mundo", cat: "comida", title: "As 10 comidas mais famosas do mundo", source: CURADORIA_POP,
    items: ["Pizza", "Hambúrguer|Hamburguer", "Sushi", "Macarrão|Massa|Espaguete", "Batata frita|Fritas", "Taco|Tacos", "Cachorro-quente|Hot dog", "Lasanha", "Churrasco", "Sorvete"] },

  // ───────────── dia a dia ─────────────
  { id: "p-celular", cat: "diaadia", title: "As 10 coisas que todo mundo faz no celular", source: CURADORIA_POP,
    items: ["Mandar mensagem|~mensagem|~whatsapp|~zap", "Ver redes sociais|~rede social|~redes sociais|~instagram", "Tirar foto|~foto|~selfie", "Ver vídeo|~video|~youtube|~tiktok", "Ouvir música|~musica|~spotify", "Ligar|~ligacao|~ligar", "Jogar|~jogo|~jogar", "Ver as horas|~horas|~hora", "Pagar conta|~pix|~pagar|~banco", "Pedir comida|~ifood|~pedir comida|~delivery"] },

  // ───────────── casais ─────────────
  { id: "p-casais-brasil", cat: "casais", title: "Os 10 casais de novela mais famosos", source: CURADORIA_POP,
    items: ["Jade e Lucas|~Jade|~Lucas", "Nina e Jorginho|~Nina|~Jorginho", "Juma e Jove|~Juma|~Jove", "Clara e Marina|~Clara|~Marina", "Carminha e Max|~Carminha|~Max", "Félix e Niko|~Felix|~Niko", "Ruth e Marcos|~Ruth|~Marcos", "Rafael e Serena|~Rafael|~Serena", "Viúva Porcina e Sinhozinho Malta|~Porcina|~Sinhozinho", "Giuliana e Matteo|~Giuliana|~Matteo"] },
);
