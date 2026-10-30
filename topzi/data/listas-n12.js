// Listas novas (lote 12): ciência, matemática, história, curiosidades, idiomas e animais. Mesmo formato de listas.js.

const N12 = "Curadoria Topzi: do mais lembrado ao menos óbvio";

LISTS.push(
  // ───────────── Ciência ─────────────
  { id: "t30-musculos", cat: "ciencia", title: "Os 30 músculos mais conhecidos do corpo humano", source: N12,
    items: [
      "Bíceps", "Tríceps", "Abdômen|Abdominal|Reto abdominal", "Peitoral", "Glúteo|Glúteos", "Quadríceps", "Panturrilha|Gastrocnêmio", "Coração|Miocárdio", "Deltoide", "Trapézio",
      "Dorsal|Grande dorsal", "Diafragma", "Língua", "Oblíquos|Oblíquo", "Posterior de coxa|Isquiotibiais", "Lombar|Lombares", "Masseter", "Adutores", "Abdutores", "Sóleo",
      "Esternocleidomastoideo", "Romboide", "Serrátil", "Bíceps femoral", "Psoas|Iliopsoas", "Sartório", "Tibial anterior", "Orbicular dos olhos", "Bucinador", "Manguito rotador",
    ] },
  { id: "t30-nutrientes", cat: "ciencia", title: "As 30 vitaminas e nutrientes mais conhecidos", source: N12,
    items: [
      "Vitamina C", "Vitamina D", "Proteína", "Ferro", "Cálcio", "Vitamina A", "Vitamina B12", "Carboidrato", "Fibra", "Gordura",
      "Vitamina E", "Magnésio", "Zinco", "Potássio", "Ômega 3", "Vitamina K", "Sódio", "Ácido fólico|Vitamina B9", "Colágeno", "Iodo",
      "Fósforo", "Selênio", "Vitamina B6", "Tiamina|Vitamina B1", "Riboflavina|Vitamina B2", "Niacina|Vitamina B3", "Biotina", "Glicose", "Aminoácidos", "Antioxidantes",
    ] },
  { id: "t30-fenomenos", cat: "ciencia", title: "Os 30 fenômenos da natureza mais conhecidos", source: N12,
    items: [
      "Arco-íris", "Furacão", "Tornado", "Terremoto|Sismo", "Tsunami|Maremoto", "Aurora boreal", "Eclipse", "Raio|Relâmpago", "Trovão", "Neve",
      "Granizo|Chuva de granizo", "Chuva", "Neblina|Nevoeiro", "Erupção vulcânica|Erupção", "Maré", "Geada", "Orvalho", "Ciclone", "Tempestade", "Monção",
      "El Niño", "Avalanche", "Seca|Estiagem", "Enchente|Inundação", "Estrela cadente|Meteoro", "Miragem", "Pororoca", "Redemoinho", "Onda de calor", "Tufão",
    ] },
  { id: "t30-astronautas", cat: "ciencia", title: "Os 30 astronautas mais famosos", source: N12,
    items: [
      "Neil Armstrong|Armstrong", "Yuri Gagarin|Gagarin", "Buzz Aldrin|Aldrin", "Marcos Pontes", "Valentina Tereshkova|Tereshkova", "John Glenn", "Alan Shepard|Shepard", "Michael Collins", "Sally Ride", "Chris Hadfield|Hadfield",
      "Jim Lovell|Lovell", "Gene Cernan|Cernan", "Alexei Leonov|Leonov", "Scott Kelly", "Mark Kelly", "Peggy Whitson", "Christa McAuliffe", "Mae Jemison", "Samantha Cristoforetti", "Thomas Pesquet",
      "Tim Peake", "Yang Liwei", "Pete Conrad", "Gus Grissom", "Ed White", "Kalpana Chawla", "Sunita Williams", "Gherman Titov|Titov", "Valeri Polyakov|Polyakov", "Jared Isaacman",
    ] },
  { id: "t30-instrumentos-ciencia", cat: "ciencia", title: "Os 30 instrumentos de ciência e de laboratório mais conhecidos", source: N12,
    items: [
      "Microscópio", "Telescópio", "Termômetro", "Balança", "Bússola", "Lupa", "Tubo de ensaio", "Béquer|Becker", "Bico de Bunsen", "Pipeta",
      "Proveta", "Erlenmeyer", "Barômetro", "Sismógrafo", "Estetoscópio", "Cronômetro", "Paquímetro", "Dinamômetro", "Higrômetro", "Anemômetro",
      "Pluviômetro", "Voltímetro", "Amperímetro", "Multímetro", "Centrífuga", "Funil", "Placa de Petri", "Contador Geiger", "Osciloscópio", "Prisma",
    ] },
  { id: "t30-arvores-plantas", cat: "ciencia", title: "As 30 árvores e plantas mais conhecidas", source: N12,
    items: [
      "Ipê", "Pau-brasil", "Araucária|Pinheiro-do-paraná", "Coqueiro", "Bananeira", "Mangueira", "Jabuticabeira", "Cacto", "Bambu", "Eucalipto",
      "Pinheiro", "Carvalho", "Seringueira", "Baobá", "Sequoia", "Palmeira", "Samambaia", "Babosa|Aloe vera", "Espada-de-são-jorge", "Comigo-ninguém-pode",
      "Girassol", "Vitória-régia", "Cerejeira", "Oliveira", "Salgueiro", "Jacarandá", "Buriti", "Mandacaru", "Jequitibá", "Figueira",
    ] },
  { id: "t50-elementos-conhecidos", cat: "ciencia", title: "Os 50 elementos químicos mais conhecidos", source: N12,
    items: [
      "Oxigênio", "Hidrogênio", "Carbono", "Ferro", "Ouro", "Prata", "Nitrogênio", "Hélio", "Cálcio", "Sódio",
      "Cobre", "Alumínio", "Cloro", "Potássio", "Urânio", "Chumbo", "Mercúrio", "Zinco", "Enxofre", "Fósforo",
      "Magnésio", "Silício", "Flúor", "Platina", "Iodo", "Neônio", "Titânio", "Níquel", "Lítio", "Estanho",
      "Cobalto", "Plutônio", "Rádio", "Argônio", "Tungstênio", "Manganês", "Cromo", "Selênio", "Bromo", "Boro",
      "Berílio", "Arsênio", "Césio", "Polônio", "Radônio", "Xenônio", "Criptônio", "Paládio", "Irídio", "Bismuto",
    ] },

  // ───────────── Matemática ─────────────
  { id: "t30-triangulares", cat: "matematica", title: "Os 30 primeiros números triangulares", source: "Matemática",
    items: [
      "1|um", "3|três", "6|seis", "10|dez", "15|quinze", "21|vinte e um", "28|vinte e oito", "36|trinta e seis", "45|quarenta e cinco", "55|cinquenta e cinco",
      "66|sessenta e seis", "78|setenta e oito", "91|noventa e um", "105", "120", "136", "153", "171", "190", "210",
      "231", "253", "276", "300", "325", "351", "378", "406", "435", "465",
    ] },
  { id: "t30-cubos", cat: "matematica", title: "Os 30 primeiros cubos perfeitos", source: "Matemática",
    items: [
      "1|um", "8|oito", "27|vinte e sete", "64|sessenta e quatro", "125|cento e vinte e cinco", "216|duzentos e dezesseis", "343|trezentos e quarenta e três", "512|quinhentos e doze", "729|setecentos e vinte e nove", "1000|mil",
      "1331", "1728", "2197", "2744", "3375", "4096", "4913", "5832", "6859", "8000",
      "9261", "10648", "12167", "13824", "15625", "17576", "19683", "21952", "24389", "27000",
    ] },
  { id: "t30-termos-matematica", cat: "matematica", title: "As 30 palavras de matemática mais lembradas", source: N12,
    items: [
      "Soma|Adição", "Subtração", "Multiplicação", "Divisão", "Fração", "Porcentagem", "Equação", "Raiz quadrada", "Potência|Potenciação", "Número primo",
      "Ângulo", "Triângulo", "Círculo", "Quadrado", "Área", "Perímetro", "Volume", "Média", "Pi", "Hipotenusa",
      "Teorema de Pitágoras|Pitágoras", "Logaritmo", "Função", "Gráfico", "Matriz", "Derivada", "Integral", "Probabilidade", "Diâmetro", "Seno",
    ] },
  { id: "t50-quadrados", cat: "matematica", title: "Os 50 primeiros quadrados perfeitos", source: "Matemática",
    items: [
      "1|um", "4|quatro", "9|nove", "16|dezesseis", "25|vinte e cinco", "36|trinta e seis", "49|quarenta e nove", "64|sessenta e quatro", "81|oitenta e um", "100|cem",
      "121", "144", "169", "196", "225", "256", "289", "324", "361", "400|quatrocentos",
      "441", "484", "529", "576", "625", "676", "729", "784", "841", "900|novecentos",
      "961", "1024", "1089", "1156", "1225", "1296", "1369", "1444", "1521", "1600|mil e seiscentos",
      "1681", "1764", "1849", "1936", "2025", "2116", "2209", "2304", "2401", "2500|dois mil e quinhentos",
    ] },
  { id: "t50-romanos", cat: "matematica", title: "Os 50 primeiros números em algarismos romanos", source: "Matemática",
    items: [
      "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X",
      "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX",
      "XXI", "XXII", "XXIII", "XXIV", "XXV", "XXVI", "XXVII", "XXVIII", "XXIX", "XXX",
      "XXXI", "XXXII", "XXXIII", "XXXIV", "XXXV", "XXXVI", "XXXVII", "XXXVIII", "XXXIX", "XL",
      "XLI", "XLII", "XLIII", "XLIV", "XLV", "XLVI", "XLVII", "XLVIII", "XLIX", "L",
    ] },

  // ───────────── História ─────────────
  { id: "t30-papas", cat: "historia", title: "Os 30 papas mais famosos", source: N12,
    items: [
      "São Pedro", "João Paulo II", "Francisco|Papa Francisco", "Bento XVI", "Leão XIV", "João XXIII", "Paulo VI", "Pio XII", "Gregório Magno|Gregório I", "Leão Magno|Leão I",
      "Inocêncio III", "Urbano II", "Alexandre VI|Rodrigo Bórgia", "Júlio II", "Leão X", "Pio IX", "Leão XIII", "Pio X", "Clemente VII", "Bonifácio VIII",
      "João Paulo I", "Pio XI", "Bento XV", "Gregório XIII", "Sisto IV", "Pio V", "Silvestre I", "Pio VII", "Paulo III", "Gregório VII",
    ] },
  { id: "t30-deuses-gregos", cat: "historia", title: "Os 30 deuses e titãs gregos mais lembrados", source: N12,
    items: [
      "Zeus", "Poseidon", "Hades", "Atena", "Afrodite", "Apolo", "Ares", "Hermes", "Hera", "Ártemis",
      "Dionísio", "Hefesto", "Deméter", "Cronos", "Gaia", "Perséfone", "Eros", "Héstia", "Prometeu", "Atlas",
      "Urano", "Nix", "Hélio|Hélios", "Selene", "Nike", "Pã", "Hécate", "Morfeu", "Tânatos", "Nêmesis",
    ] },
  { id: "t30-mulheres-historia", cat: "historia", title: "As 30 mulheres mais famosas da história", source: N12,
    items: [
      "Cleópatra", "Joana d'Arc", "Marie Curie", "Frida Kahlo", "Anne Frank", "Madre Teresa de Calcutá|Madre Teresa", "Princesa Diana|Lady Di", "Rainha Elizabeth II|Elizabeth II", "Maria Antonieta", "Rainha Vitória",
      "Rainha Elizabeth I|Elizabeth I", "Catarina, a Grande|Catarina II", "Florence Nightingale", "Rosa Parks", "Malala Yousafzai|Malala", "Amelia Earhart", "Eva Perón|Evita", "Indira Gandhi", "Margaret Thatcher|Thatcher", "Anita Garibaldi",
      "Princesa Isabel", "Coco Chanel", "Helen Keller", "Ada Lovelace", "Nefertiti", "Harriet Tubman", "Simone de Beauvoir", "Golda Meir", "Angela Merkel|Merkel", "Chiquinha Gonzaga",
    ] },
  { id: "t30-obras-arte", cat: "historia", title: "As 30 obras de arte mais famosas", source: N12,
    items: [
      "Mona Lisa|Gioconda", "A Noite Estrelada", "O Grito", "A Última Ceia|Santa Ceia", "O Nascimento de Vênus", "A Criação de Adão", "Guernica", "A Persistência da Memória", "Moça com Brinco de Pérola", "O Beijo",
      "O Pensador", "Davi", "Vênus de Milo", "Abaporu", "Os Girassóis", "Impressão, Nascer do Sol", "Gótico Americano", "A Ronda Noturna", "As Meninas", "O Jardim das Delícias Terrenas|O Jardim das Delícias",
      "A Liberdade Guiando o Povo", "O Filho do Homem", "Latas de Sopa Campbell|Sopa Campbell", "Operários|Os Operários", "Retirantes|Os Retirantes", "Ninfeias|As Ninfeias", "A Escola de Atenas", "Pietà", "Nighthawks|Falcões da Noite", "A Grande Onda de Kanagawa|A Grande Onda",
    ] },
  { id: "t30-imperios", cat: "historia", title: "Os 30 impérios e civilizações mais famosos da história", source: N12,
    items: [
      "Império Romano", "Egito Antigo", "Grécia Antiga", "Império Mongol", "Império Britânico", "Império Otomano", "Império Persa", "Império Inca|Incas", "Astecas|Império Asteca", "Maias",
      "Império Bizantino", "Vikings", "Mesopotâmia", "Babilônia", "Império Português", "Império Espanhol", "Império Russo", "Império Napoleônico", "Império Carolíngio", "Sacro Império Romano-Germânico",
      "Império Austro-Húngaro", "Império do Japão", "Império Mogol", "Império Macedônico|Império de Alexandre", "Sumérios", "Fenícios", "Cartago", "Império do Mali", "Assírios", "Império do Brasil",
    ] },
  { id: "t30-exploradores", cat: "historia", title: "Os 30 navegadores e exploradores mais famosos", source: N12,
    items: [
      "Cristóvão Colombo|Colombo", "Pedro Álvares Cabral|Cabral", "Vasco da Gama", "Fernão de Magalhães|Magalhães", "Américo Vespúcio", "Marco Polo", "James Cook|Capitão Cook", "Bartolomeu Dias", "Hernán Cortés|Cortés", "Francisco Pizarro|Pizarro",
      "Roald Amundsen|Amundsen", "Robert Scott", "Ernest Shackleton|Shackleton", "Leif Erikson", "Erik, o Vermelho", "Zheng He", "Ibn Battuta", "Infante Dom Henrique|Henrique, o Navegador", "David Livingstone|Livingstone", "Jacques Cartier",
      "Edmund Hillary|Hillary", "Tenzing Norgay", "Francis Drake|Drake", "Juan Sebastián Elcano|Elcano", "Henry Hudson", "Abel Tasman", "Jacques Cousteau|Cousteau", "Vicente Pinzón", "Fernão Dias", "Amyr Klink",
    ] },
  { id: "t30-acontecimentos", cat: "historia", title: "Os 30 acontecimentos mais famosos da história", source: N12,
    items: [
      "Revolução Francesa", "Segunda Guerra Mundial", "Descobrimento da América", "Chegada do homem à Lua|Homem na Lua", "Queda do Muro de Berlim", "Independência do Brasil", "Revolução Industrial", "Primeira Guerra Mundial", "Independência dos Estados Unidos", "Descobrimento do Brasil",
      "Abolição da escravatura|Lei Áurea", "Proclamação da República", "Ataques de 11 de Setembro|11 de Setembro", "Naufrágio do Titanic", "Queda de Roma", "Queda de Constantinopla", "Reforma Protestante", "Renascimento", "Peste Negra", "Grandes Navegações",
      "Crise de 1929|Quebra da Bolsa", "Revolução Russa", "Bomba de Hiroshima", "Pandemia de Covid-19|Pandemia", "Inconfidência Mineira", "Diretas Já", "Plano Real", "Fim do Apartheid", "Acidente de Chernobyl|Chernobyl", "Assassinato de Kennedy",
    ] },
  { id: "t30-monumentos-antigos", cat: "historia", title: "Os 30 monumentos e sítios antigos mais famosos", source: N12,
    items: [
      "Pirâmides de Gizé|Pirâmides do Egito", "Esfinge|Grande Esfinge", "Coliseu", "Partenon|Acrópole", "Stonehenge", "Muralha da China|Grande Muralha", "Machu Picchu", "Chichén Itzá", "Petra", "Angkor Wat",
      "Teotihuacan", "Exército de Terracota|Guerreiros de Terracota", "Pompeia", "Templo de Karnak|Karnak", "Abu Simbel", "Vale dos Reis", "Persépolis", "Estátuas da Ilha de Páscoa|Moais", "Panteão", "Fórum Romano",
      "Muralha de Adriano", "Linhas de Nazca|Nazca", "Troia", "Palácio de Cnossos|Cnossos", "Delfos", "Templo de Ártemis", "Farol de Alexandria", "Colosso de Rodes", "Jardins Suspensos da Babilônia", "Göbekli Tepe",
    ] },
  { id: "t50-pintores", cat: "historia", title: "Os 50 pintores e artistas plásticos mais famosos", source: N12,
    items: [
      "Leonardo da Vinci|Da Vinci", "Michelangelo", "Vincent van Gogh|Van Gogh", "Pablo Picasso|Picasso", "Claude Monet|Monet", "Salvador Dalí|Dalí", "Rembrandt", "Frida Kahlo|Frida", "Rafael|Rafael Sanzio", "Andy Warhol|Warhol",
      "Sandro Botticelli|Botticelli", "Caravaggio", "Gustav Klimt|Klimt", "Edvard Munch|Munch", "Johannes Vermeer|Vermeer", "Francisco de Goya|Goya", "Diego Velázquez|Velázquez", "Tarsila do Amaral|Tarsila", "Candido Portinari|Portinari", "Romero Britto",
      "Di Cavalcanti", "Anita Malfatti", "Pierre-Auguste Renoir|Renoir", "Edgar Degas|Degas", "Paul Cézanne|Cézanne", "Paul Gauguin|Gauguin", "Henri Matisse|Matisse", "Wassily Kandinsky|Kandinsky", "René Magritte|Magritte", "Jackson Pollock|Pollock",
      "Jean-Michel Basquiat|Basquiat", "Edward Hopper|Hopper", "Édouard Manet|Manet", "Hieronymus Bosch|Bosch", "El Greco", "Joan Miró|Miró", "Marc Chagall|Chagall", "Amedeo Modigliani|Modigliani", "Toulouse-Lautrec", "Piet Mondrian|Mondrian",
      "Banksy", "Keith Haring", "Diego Rivera", "Georgia O'Keeffe", "Aleijadinho", "Auguste Rodin|Rodin", "Donatello", "Hokusai", "Jan van Eyck|Van Eyck", "William Turner|Turner",
    ] },

  // ───────────── Curiosidades ─────────────
  { id: "t30-sobrenomes", cat: "curiosidades", title: "Os 30 sobrenomes mais comuns do Brasil", source: "Levantamentos de registros civis",
    items: [
      "Silva", "Santos", "Oliveira", "Souza|Sousa", "Rodrigues", "Ferreira", "Alves", "Pereira", "Lima", "Gomes",
      "Costa", "Ribeiro", "Martins", "Carvalho", "Almeida", "Lopes", "Soares", "Fernandes", "Vieira", "Barbosa",
      "Rocha", "Dias", "Nascimento", "Andrade", "Moreira", "Nunes", "Marques", "Machado", "Mendes", "Freitas",
    ] },
  { id: "t30-empresarios", cat: "curiosidades", title: "Os 30 empresários mais famosos do mundo", source: N12,
    items: [
      "Elon Musk|Musk", "Steve Jobs", "Bill Gates", "Jeff Bezos|Bezos", "Mark Zuckerberg|Zuckerberg", "Warren Buffett|Buffett", "Walt Disney", "Henry Ford", "Richard Branson|Branson", "Jack Ma",
      "Oprah Winfrey|Oprah", "Larry Page", "Sergey Brin", "Bernard Arnault|Arnault", "Jensen Huang", "Sam Altman|Altman", "Tim Cook", "Carlos Slim", "Amancio Ortega", "Ray Kroc",
      "Enzo Ferrari", "Soichiro Honda", "Michael Dell", "Phil Knight", "Howard Schultz", "Larry Ellison", "Jorge Paulo Lemann|Lemann", "Silvio Santos", "Abilio Diniz", "Luiza Trajano",
    ] },
  { id: "t30-fobias", cat: "curiosidades", title: "As 30 fobias mais conhecidas", source: N12,
    items: [
      "Aracnofobia|~aranha", "Claustrofobia|~lugar fechado", "Acrofobia|~altura", "Agorafobia|~multidao", "Aerofobia|~aviao", "Nictofobia|~escuro", "Glossofobia|~falar em publico", "Fobia social", "Coulrofobia|~palhaco", "Tripofobia|~buracos",
      "Ofidiofobia|~cobra", "Cinofobia|~cachorro", "Hematofobia|~sangue", "Tanatofobia|~morte", "Misofobia|Germofobia|~germes", "Nomofobia|~celular", "Talassofobia|~mar", "Astrafobia|Brontofobia|~trovao", "Tripanofobia|~agulha|~injecao", "Odontofobia|~dentista",
      "Emetofobia|~vomito", "Entomofobia|~insetos", "Ailurofobia|~gato", "Ornitofobia|~passaros", "Fobofobia|~medo do medo", "Hipopotomonstrosesquipedaliofobia|~palavras grandes", "Triscaidecafobia|~numero 13", "Filofobia|~se apaixonar", "Autofobia|~ficar sozinho", "Xenofobia|~estrangeiros",
    ] },
  { id: "t30-supersticoes", cat: "curiosidades", title: "As 30 superstições mais famosas", source: N12,
    items: [
      "Gato preto", "Passar debaixo da escada|~escada", "Sexta-feira 13", "Quebrar espelho|~espelho", "Ferradura", "Trevo de quatro folhas|~trevo", "Bater na madeira|~madeira", "Pé de coelho|~coelho", "Abrir guarda-chuva dentro de casa|~guarda chuva", "Chinelo virado|~chinelo",
      "Sal grosso", "Arruda", "Mau-olhado|Olho gordo|Olho grosso", "Figa", "Pular sete ondas|~sete ondas", "Roupa branca no Réveillon|~roupa branca", "Lentilha no Ano-Novo|~lentilha", "Romã no Dia de Reis|~roma", "Entrar com o pé direito|~pe direito", "Vassoura atrás da porta|~vassoura",
      "Bolsa no chão|~bolsa", "Cruzar os dedos|~dedos", "Pedido para estrela cadente|~estrela cadente", "Simpatia de Santo Antônio|~santo antonio", "Orelha quente|~orelha", "Coceira na mão|~coceira", "Não varrer a casa à noite|~varrer", "Elefante de costas para a porta|~elefante", "Doze uvas no Ano-Novo|~uvas", "Calcinha amarela no Réveillon|~calcinha",
    ] },
  { id: "t30-simbolos", cat: "curiosidades", title: "Os 30 símbolos mais conhecidos", source: N12,
    items: [
      "Coração", "Estrela", "Cruz", "Cifrão", "Arroba", "Hashtag|Jogo da velha", "Paz e amor|Símbolo da paz", "Yin-yang", "Infinito", "Caveira",
      "Trevo", "Âncora", "Coroa", "Raio", "Seta|Flecha", "Smile|Carinha sorrindo", "Lua crescente|Meia-lua", "Estrela de Davi", "Reciclagem|Símbolo da reciclagem", "Wi-Fi",
      "Copyright", "Pi", "Olho de Hórus", "Ankh|Cruz ansata", "Ômega", "Caduceu", "Interrogação|Ponto de interrogação", "Exclamação|Ponto de exclamação", "Porcentagem", "E comercial|Ampersand",
    ] },
  { id: "t30-objetos-antigos", cat: "curiosidades", title: "Os 30 objetos antigos que marcaram época", source: N12,
    items: [
      "Fita cassete|Fita K7", "Disquete", "Walkman", "Videocassete|VHS", "Orelhão", "Telefone de disco", "Pager|Bip", "Tamagotchi", "Discman", "Máquina de escrever",
      "Polaroid", "Game Boy", "Atari", "Televisão de tubo|TV de tubo", "Disco de vinil|Vinil|LP", "Vitrola|Toca-discos", "Fax", "Lista telefônica", "Cartão telefônico|Ficha telefônica", "Tijolão|Celular tijolão",
      "Mimeógrafo", "Enciclopédia Barsa|Barsa", "Álbum de fotos", "Guia de ruas|Mapa de papel", "MP3 player", "iPod", "Câmera de filme|Filme fotográfico", "Rádio de pilha", "Antena de TV", "Despertador de corda",
    ] },
  { id: "t50-termos-internet", cat: "curiosidades", title: "Os 50 termos de internet e tecnologia mais usados", source: N12,
    items: [
      "Wi-Fi", "Senha", "Login", "Download", "Upload", "Site", "Aplicativo|App", "Link", "Selfie", "Print|Captura de tela",
      "Nuvem", "Backup", "Vírus", "Hacker", "Spam", "E-mail", "Emoji", "Hashtag", "Bluetooth", "Streaming",
      "Algoritmo", "Inteligência artificial|IA", "Bug", "Cookie", "Navegador", "Software", "Hardware", "Pixel", "Gigabyte|GB", "Megabyte|MB",
      "QR Code", "Pix", "Meme", "Curtida|Like", "Postagem|Post", "Stories|Story", "Live", "Influenciador", "Podcast", "Chatbot",
      "Internet", "Online", "Offline", "Firewall", "Phishing", "Criptomoeda", "Blockchain", "Spoiler", "Feed", "Notificação",
    ] },

  // ───────────── Idiomas ─────────────
  { id: "t30-corpo-ingles", cat: "idiomas", title: "As 30 partes do corpo mais básicas em inglês", source: "Inglês",
    items: [
      "Head", "Hand", "Eye|Eyes", "Mouth", "Nose", "Ear|Ears", "Arm", "Leg", "Foot|Feet", "Hair",
      "Face", "Finger", "Heart", "Knee", "Shoulder", "Neck", "Back", "Teeth|Tooth", "Lips|Lip", "Chin",
      "Elbow", "Toe", "Stomach|Belly", "Chest", "Thumb", "Wrist", "Ankle", "Eyebrow", "Cheek", "Tongue",
    ] },
  { id: "t30-animais-espanhol", cat: "idiomas", title: "Os 30 animais mais básicos em espanhol", source: "Espanhol",
    items: [
      "Perro", "Gato", "Caballo", "Vaca", "Cerdo", "Pájaro", "Pez", "Ratón", "León", "Tigre",
      "Oso", "Mono", "Elefante", "Conejo", "Gallina", "Pato", "Oveja", "Serpiente", "Tortuga", "Jirafa",
      "Lobo", "Zorro", "Rana", "Abeja", "Mariposa", "Araña", "Ballena", "Tiburón", "Cebra", "Águila",
    ] },
  { id: "t30-comidas-espanhol", cat: "idiomas", title: "As 30 comidas e bebidas mais básicas em espanhol", source: "Espanhol",
    items: [
      "Pan", "Agua", "Leche", "Huevo", "Carne", "Pollo", "Pescado", "Arroz", "Frijoles", "Queso",
      "Manzana", "Plátano", "Naranja", "Fresa", "Uva", "Tomate", "Papa|Patata", "Cebolla", "Ajo", "Sal",
      "Azúcar", "Café", "Té", "Jugo|Zumo", "Cerveza", "Vino", "Mantequilla", "Galleta", "Pastel|Torta", "Helado",
    ] },
  { id: "t30-alemao", cat: "idiomas", title: "As 30 palavras em alemão mais conhecidas", source: "Alemão",
    items: [
      "Hallo", "Danke", "Bitte", "Ja", "Nein", "Guten Morgen", "Guten Tag", "Gute Nacht", "Tschüss", "Auf Wiedersehen",
      "Bier", "Kindergarten", "Wurst", "Prost", "Hund", "Katze", "Haus", "Liebe", "Ich liebe dich", "Entschuldigung",
      "Wasser", "Brot", "Kaputt", "Autobahn", "Gesundheit", "Achtung", "Wunderbar", "Schmetterling", "Frau", "Mädchen",
    ] },
  { id: "t30-abreviacoes", cat: "idiomas", title: "As 30 abreviações de internet mais usadas no Brasil", source: N12,
    items: [
      "vc (você)|vc", "tb (também)|tb|tbm", "blz (beleza)|blz", "pq (porque)|pq", "kkk (risada)|kkk|kkkk", "rs (risos)|rs", "msg (mensagem)|msg", "obg (obrigado)|obg", "tmj (tamo junto)|tmj", "sdds (saudades)|sdds|sdd",
      "pfv (por favor)|pfv|pfvr", "bjs (beijos)|bjs|bj", "vlw (valeu)|vlw", "flw (falou)|flw", "mds (meu Deus)|mds", "aff|af", "cmg (comigo)|cmg", "ctz (certeza)|ctz", "hj (hoje)|hj", "dps (depois)|dps",
      "td (tudo)|td", "nd (nada)|nd", "fds (fim de semana)|fds", "sla (sei lá)|sla", "lol", "omg", "bff", "tbt", "dm", "pv (privado)|pv",
    ] },
  { id: "t30-latim", cat: "idiomas", title: "As 30 expressões em latim mais usadas no português", source: "Latim",
    items: [
      "Carpe diem", "Habeas corpus", "Et cetera|Etc", "Status quo", "Per capita", "Curriculum vitae", "Vice-versa", "Versus", "Sui generis", "Persona non grata",
      "In loco", "Grosso modo", "Ipsis litteris", "A priori", "Data venia", "De facto", "Lato sensu", "Stricto sensu", "Mea culpa", "Post mortem",
      "Quórum|Quorum", "Alma mater", "Ad hoc", "Modus operandi", "Pro bono", "Habitat", "Veni, vidi, vici", "Alea jacta est", "In vitro", "Bona fide",
    ] },
  { id: "t50-numeros-ingles", cat: "idiomas", title: "Os 50 primeiros números em inglês", source: "Inglês",
    items: [
      "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
      "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen", "Twenty",
      "Twenty-one", "Twenty-two", "Twenty-three", "Twenty-four", "Twenty-five", "Twenty-six", "Twenty-seven", "Twenty-eight", "Twenty-nine", "Thirty",
      "Thirty-one", "Thirty-two", "Thirty-three", "Thirty-four", "Thirty-five", "Thirty-six", "Thirty-seven", "Thirty-eight", "Thirty-nine", "Forty",
      "Forty-one", "Forty-two", "Forty-three", "Forty-four", "Forty-five", "Forty-six", "Forty-seven", "Forty-eight", "Forty-nine", "Fifty",
    ] },
  { id: "t50-tupi", cat: "idiomas", title: "As 50 palavras de origem tupi mais conhecidas", source: N12,
    items: [
      "Abacaxi", "Mandioca", "Pipoca", "Jacaré", "Tatu", "Capivara", "Arara", "Jabuti", "Piranha", "Caju",
      "Maracujá", "Pitanga", "Jabuticaba", "Mingau", "Paçoca", "Peteca", "Cutucar", "Perereca", "Sabiá", "Tamanduá",
      "Carioca", "Pindaíba", "Catapora", "Capim", "Cupim", "Siri", "Tucano", "Urubu", "Sucuri", "Jiboia",
      "Mutirão", "Pereba", "Jururu", "Xará", "Caatinga", "Tapioca", "Pororoca", "Biboca", "Aipim", "Mandacaru",
      "Ipê", "Buriti", "Açaí", "Guaraná", "Jenipapo", "Arapuca", "Cumbuca", "Cuia", "Tocaia", "Capoeira",
    ] },
  { id: "t50-espanhol-palavras", cat: "idiomas", title: "As 50 palavras em espanhol mais conhecidas", source: "Espanhol",
    items: [
      "Hola", "Gracias", "Por favor", "Adiós", "Buenos días", "Buenas noches", "Te quiero", "Amigo", "Sí", "Señor",
      "Fiesta", "Mañana", "Hasta luego", "Perdón", "Cerveza", "Playa", "Agua", "Casa", "Perro", "Amor",
      "Corazón", "Vida", "Chico", "Chica", "Niño", "Hermano", "Madre", "Padre", "Bueno", "Bonito",
      "Feo", "Grande", "Pequeño", "Mucho", "Poco", "Dinero", "Trabajo", "Comida", "Calle", "Coche",
      "Siempre", "Nunca", "Hoy", "Ayer", "Vamos", "Lo siento", "¿Qué tal?|Qué tal", "Escuela", "Libro", "Señora",
    ] },

  // ───────────── Animais ─────────────
  { id: "t30-racas-gatos", cat: "animais", title: "As 30 raças de gato mais conhecidas", source: N12,
    items: [
      "Persa", "Siamês", "Maine Coon", "Sphynx|Gato sem pelo", "Angorá", "Ragdoll", "Bengal|Bengala", "British Shorthair", "Scottish Fold", "Abissínio",
      "Siberiano", "Exótico", "Sagrado da Birmânia|Birmanês", "Azul-russo", "Himalaio", "Norueguês da Floresta", "Savannah", "Devon Rex", "Cornish Rex", "Burmês|Burmese",
      "Oriental", "Manx", "Bombaim", "Chartreux", "Somali", "Van Turco", "Ocicat", "Munchkin", "Vira-lata|SRD", "Mau Egípcio",
    ] },
  { id: "t30-animais-amazonia", cat: "animais", title: "Os 30 animais da Amazônia mais lembrados", source: N12,
    items: [
      "Onça-pintada|Onça", "Boto-cor-de-rosa|Boto", "Arara", "Tucano", "Preguiça|Bicho-preguiça", "Sucuri|Anaconda", "Jacaré", "Pirarucu", "Peixe-boi", "Ariranha",
      "Capivara", "Anta", "Macaco-prego", "Sagui", "Tamanduá", "Harpia|Gavião-real", "Piranha", "Poraquê|Peixe-elétrico", "Jabuti", "Tartaruga-da-amazônia",
      "Uacari", "Bugio|Guariba", "Macaco-aranha", "Queixada", "Cutia", "Paca", "Jiboia", "Papagaio", "Sapo-flecha|Rã-dardo", "Tambaqui",
    ] },
  { id: "t30-animais-australia", cat: "animais", title: "Os 30 animais da Austrália mais lembrados", source: N12,
    items: [
      "Canguru", "Coala", "Ornitorrinco", "Emu", "Equidna", "Vombate|Wombat", "Diabo-da-tasmânia", "Dingo", "Wallaby|Valabi", "Cacatua",
      "Periquito-australiano", "Casuar", "Cucaburra|Kookaburra", "Crocodilo-de-água-salgada", "Taipan", "Lagarto-de-gola|Clamidossauro", "Diabo-espinhoso", "Quokka", "Tigre-da-tasmânia|Tilacino", "Peixe-pedra",
      "Vespa-do-mar|Água-viva-caixa", "Polvo-de-anéis-azuis", "Aranha-de-teia-de-funil", "Petauro-do-açúcar|Sugar glider", "Cisne-negro", "Lóris-arco-íris|Lorikeet", "Numbat", "Bilby", "Gambá-australiano|Possum", "Tubarão-branco",
    ] },
  { id: "t30-animais-estimacao", cat: "animais", title: "Os 30 animais de estimação mais comuns", source: N12,
    items: [
      "Cachorro|Cão", "Gato", "Peixe", "Hamster", "Coelho", "Papagaio", "Calopsita", "Periquito", "Tartaruga", "Porquinho-da-índia",
      "Canário", "Furão", "Chinchila", "Iguana", "Cobra", "Gerbil", "Jabuti", "Agapornis", "Cacatua", "Axolote",
      "Ouriço|Ouriço-pigmeu", "Mini porco|Porco", "Cavalo", "Galinha", "Pato", "Gecko|Lagartixa-leopardo", "Tarântula", "Betta", "Mandarim", "Camaleão",
    ] },
  { id: "t30-animais-perigosos", cat: "animais", title: "Os 30 animais mais perigosos do mundo", source: N12,
    items: [
      "Mosquito", "Cobra", "Escorpião", "Tubarão", "Crocodilo", "Hipopótamo", "Leão", "Tigre", "Urso", "Elefante",
      "Água-viva", "Aranha", "Abelha", "Lobo", "Búfalo", "Rinoceronte", "Polvo-de-anéis-azuis", "Peixe-pedra", "Sapo-dardo|Rã-dardo", "Baiacu",
      "Piranha", "Jacaré", "Onça", "Hiena", "Barbeiro", "Caramujo", "Mosca tsé-tsé", "Carrapato", "Javali", "Leopardo",
    ] },
  { id: "t30-pantanal-cerrado", cat: "animais", title: "Os 30 animais do Pantanal e do Cerrado mais lembrados", source: N12,
    items: [
      "Tuiuiú", "Lobo-guará", "Tamanduá-bandeira", "Ema", "Seriema", "Capivara", "Jacaré-do-pantanal|Jacaré", "Onça-pintada|Onça", "Arara-azul", "Cervo-do-pantanal",
      "Tatu-canastra", "Anta", "Sucuri", "Piranha", "Tucano", "Ariranha", "Quati", "Veado-campeiro", "Tamanduá-mirim", "Cachorro-do-mato",
      "Jaguatirica", "Cutia", "Curicaca", "Tatu-bola", "Queixada", "Pacu", "Dourado", "Pintado", "Bugio", "Colhereiro",
    ] },
  { id: "t30-animais-polares", cat: "animais", title: "Os 30 animais do Ártico e da Antártida mais lembrados", source: N12,
    items: [
      "Urso-polar", "Pinguim-imperador|Pinguim", "Foca", "Morsa", "Leão-marinho", "Orca", "Beluga", "Narval", "Raposa-do-ártico", "Lobo-do-ártico",
      "Rena", "Boi-almiscarado", "Lebre-ártica", "Coruja-das-neves", "Lemingue", "Arminho", "Baleia-azul", "Krill", "Pinguim-rei", "Pinguim-de-adélia",
      "Elefante-marinho", "Foca-leopardo", "Baleia-jubarte|Jubarte", "Albatroz", "Papagaio-do-mar|Puffin", "Glutão", "Baleia-da-groenlândia", "Andorinha-do-ártico", "Tubarão-da-groenlândia", "Petrel",
    ] },
  { id: "t30-animais-asia", cat: "animais", title: "Os 30 animais da Ásia mais lembrados", source: N12,
    items: [
      "Panda|Panda-gigante", "Tigre", "Elefante-asiático", "Orangotango", "Dragão-de-komodo", "Iaque", "Camelo-bactriano", "Leopardo-das-neves", "Rinoceronte-indiano", "Pavão",
      "Naja", "Macaco-japonês|Macaco-das-neves", "Panda-vermelho", "Gibão", "Társio", "Búfalo-asiático|Búfalo-d'água", "Lóris", "Pangolim", "Anta-malaia", "Urso-malaio",
      "Pato-mandarim", "Mangusto", "Bicho-da-seda", "Píton", "Urso-negro-asiático", "Gaur", "Grou-de-crista-vermelha", "Macaco-narigudo", "Leopardo-nebuloso", "Cobra-real",
    ] },
  { id: "t50-peixes", cat: "animais", title: "Os 50 peixes mais conhecidos", source: N12,
    items: [
      "Tubarão", "Salmão", "Atum", "Bacalhau", "Tilápia", "Sardinha", "Peixe-palhaço", "Piranha", "Pirarucu", "Tambaqui",
      "Dourado", "Pintado|Surubim", "Pacu", "Lambari", "Truta", "Carpa", "Peixe-espada", "Baiacu", "Robalo", "Badejo",
      "Linguado", "Merluza", "Pescada", "Corvina", "Tainha", "Arraia", "Moreia", "Cavalo-marinho", "Enguia", "Betta",
      "Kinguio|Peixe-dourado", "Tucunaré", "Traíra", "Bagre", "Garoupa", "Anchova", "Cação", "Cherne", "Peixe-voador", "Peixe-lua",
      "Peixe-leão", "Cirurgião-patela|Peixe-cirurgião", "Barracuda", "Marlim", "Espadarte", "Matrinxã", "Cavalinha", "Arenque", "Cascudo|Acari", "Neon|Tetra-neon",
    ] },
  { id: "t50-zoologico", cat: "animais", title: "Os 50 animais de zoológico mais lembrados", source: N12,
    items: [
      "Leão", "Elefante", "Girafa", "Zebra", "Macaco", "Tigre", "Hipopótamo", "Rinoceronte", "Urso", "Jacaré",
      "Pinguim", "Flamingo", "Avestruz", "Camelo", "Canguru", "Gorila", "Chimpanzé", "Lobo", "Onça", "Leopardo",
      "Panda", "Tartaruga", "Cobra", "Foca", "Lhama", "Suricato", "Lêmure", "Arara", "Tucano", "Hiena",
      "Anta", "Orangotango", "Urso-polar", "Pavão", "Coala", "Crocodilo", "Búfalo", "Guepardo|Chita", "Capivara", "Lontra",
      "Pelicano", "Águia", "Coruja", "Iguana", "Ema", "Antílope", "Bisão", "Babuíno", "Tamanduá", "Dromedário",
    ] },
  { id: "t50-nomes-cachorro", cat: "animais", title: "Os 50 nomes de cachorro mais comuns no Brasil", source: N12,
    items: [
      "Thor", "Mel", "Luna", "Bob", "Nina", "Max", "Pipoca", "Fred", "Belinha", "Pandora",
      "Lola", "Billy", "Toby|Tobby", "Zeus", "Bela", "Pretinha", "Princesa", "Amora", "Theo", "Chico",
      "Marley", "Simba", "Bento", "Frida", "Kiara", "Maya", "Mia", "Jade", "Cacau", "Teddy",
      "Snoopy", "Scooby", "Nala", "Lili", "Pingo", "Mike", "Bolinha", "Floquinho", "Duque", "Spike",
      "Rex", "Totó", "Paçoca", "Lua", "Bidu", "Zara", "Pitoco", "Fiona", "Lucky", "Kira",
    ] },
);
