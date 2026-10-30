// Listas novas (lote 13): frases, personagens, comida, dia a dia, casais e Bíblia. Mesmo formato de listas.js.

const N13 = "Curadoria Topzi: do mais lembrado ao menos óbvio";

LISTS.push(
  // ───────────── Frases do dia a dia ─────────────
  { id: "t30-girias", cat: "frases", title: "As 30 gírias brasileiras mais usadas", source: N13,
    items: [
      "Mano|Mana", "Cara", "Top", "Massa", "Legal", "Bacana", "Firmeza", "Suave|De boa", "Partiu", "Treta",
      "Crush", "Rolê", "Zoeira", "Da hora|Daora", "Sinistro", "Trampo", "Grana", "Valeu", "Falou", "Show de bola",
      "Mina", "Balada", "Mancada", "Vacilo", "Barraco", "Bagulho", "Sextou", "Brisa", "Cringe", "Lacrou|Lacrar",
    ] },
  { id: "t30-regionalismos", cat: "frases", title: "As 30 palavras e expressões regionais mais conhecidas do Brasil", source: N13,
    items: [
      "Uai", "Bah", "Tchê", "Oxente|Oxe", "Égua", "Trem", "Arretado", "Mermão", "Meu rei", "Visse",
      "Abestado", "Barbaridade", "Guri", "Piá", "Sô", "Cabra da peste", "Eita", "Vixe|Vixi", "Tri", "Mainha",
      "Painho", "Bergamota", "Macaxeira", "Jerimum", "Cacetinho", "Sinaleira", "Mexerica", "Pão de sal", "Aperreado", "Mangar",
    ] },
  { id: "t30-frases-pai", cat: "frases", title: "As 30 frases que todo pai diz", source: N13,
    items: [
      "Pergunta pra sua mãe|~sua mae|~pra mae", "Apaga essa luz|~luz", "Dinheiro não dá em árvore|~arvore", "No meu tempo...|~meu tempo", "Fecha essa geladeira|~geladeira", "Enquanto morar debaixo do meu teto...|~teto", "Eu não sou banco|~banco", "Quem paga as contas aqui sou eu|~contas", "É pavê ou pra comer?|~pave", "Puxa o meu dedo|~dedo",
      "Não precisa de GPS, eu sei o caminho|~gps|~caminho", "Desliga a TV se não está assistindo|~tv|~televisao", "Fecha a porta que está entrando vento|~vento", "Abaixa esse volume|~volume", "Quando eu tinha a sua idade...|~sua idade", "Olha o preço disso!|~preco", "Tá rindo de quê?|~rindo", "Paciência tem limite|~paciencia", "Isso não é brinquedo|~brinquedo", "Vai com Deus|~com deus",
      "Vou ali e já volto|~ja volto", "Quem mexeu no controle?|~controle", "Bora fazer um churrasco|~churrasco", "Você acha que eu sou palhaço?|~palhaco", "Volta aqui, eu não terminei de falar|~terminei", "Na volta a gente vê|~a gente ve", "Vai dormir, já é tarde|~dormir|~tarde", "Chega de videogame|~videogame", "Quer que eu desenhe?|~desenhe", "Sabe quanto custa isso?|~quanto custa",
    ] },
  { id: "t30-frases-professor", cat: "frases", title: "As 30 frases que todo professor diz", source: N13,
    items: [
      "Isso vai cair na prova|~prova", "Silêncio!|~silencio", "Vocês são a pior turma|~pior turma", "Quem não fez a tarefa?|~tarefa|~licao|~dever de casa", "Celular guardado|~celular", "O sinal é pra mim, não pra vocês|~sinal", "Banheiro só depois|~banheiro", "Senta direito|~senta", "Copiem do quadro|~quadro|~lousa|~copiem", "Estou esperando vocês ficarem quietos|~quietos",
      "Abram o livro na página...|~pagina|~livro", "Vou chamar os seus pais|~seus pais", "A conversa está boa aí atrás?|~conversa", "Façam fila|~fila", "Quem quer ler?|~ler", "Já vou passar a chamada|~chamada", "Trabalho em grupo vale nota|~grupo|~nota", "Quem terminou pode sair|~terminou", "Vou mudar vocês de lugar|~mudar de lugar|~lugar", "Isso aqui não é recreio|~recreio",
      "Na minha época os alunos respeitavam|~respeitavam", "Ninguém sai antes de terminar|~ninguem sai", "Vou dar zero|~zero", "Sem cola!|~cola", "Quem não entendeu levanta a mão|~levanta a mao|~entendeu", "A diretora vai saber disso|~diretora|~diretoria", "Tirem as mochilas da mesa|~mochila", "Joga o chiclete fora|~chiclete", "Letra legível, por favor|~letra", "Vai ter teste surpresa|~teste surpresa|~surpresa",
    ] },

  // ───────────── Personagens ─────────────
  { id: "t30-personagens-terror", cat: "personagens", title: "Os 30 personagens de filmes de terror mais famosos", source: N13,
    items: [
      "Freddy Krueger|Freddy", "Jason Voorhees|Jason", "Michael Myers", "Chucky", "Pennywise|It", "Ghostface|Pânico", "Jigsaw", "Leatherface", "Hannibal Lecter|Hannibal", "Annabelle",
      "Samara", "Norman Bates", "Regan", "Drácula", "Frankenstein", "Pinhead", "Damien", "Carrie", "Jack Torrance", "Valak|A Freira",
      "Esther|A Órfã", "Candyman", "Zé do Caixão", "Slender Man|Slenderman", "Art, o Palhaço|Art the Clown", "M3GAN|Megan", "Xenomorfo|Alien", "Predador", "Babadook", "Tiffany|Noiva de Chucky",
    ] },
  { id: "t30-senhor-aneis", cat: "personagens", title: "Os 30 personagens mais lembrados de O Senhor dos Anéis e O Hobbit", source: N13,
    items: [
      "Frodo", "Sam|Samwise", "Gandalf", "Aragorn", "Legolas", "Gimli", "Gollum|Sméagol", "Bilbo", "Sauron", "Saruman",
      "Boromir", "Merry", "Pippin", "Arwen", "Galadriel", "Elrond", "Éowyn", "Théoden", "Faramir", "Denethor",
      "Barbárvore", "Rei Bruxo de Angmar|Rei Bruxo", "Smaug", "Thorin", "Bard", "Thranduil", "Tauriel", "Radagast", "Azog", "Língua de Cobra|Gríma",
    ] },
  { id: "t30-contos-fada", cat: "personagens", title: "Os 30 personagens de contos de fada mais famosos", source: N13,
    items: [
      "Cinderela", "Branca de Neve", "Chapeuzinho Vermelho", "Lobo Mau", "Bela Adormecida", "Rapunzel", "Pinóquio", "João e Maria", "Os Três Porquinhos|Três Porquinhos", "Peter Pan",
      "Alice", "A Pequena Sereia", "O Patinho Feio|Patinho Feio", "Gato de Botas", "Rumpelstiltskin", "Polegarzinha", "Pequeno Polegar", "A Bela e a Fera", "Aladim", "Sininho",
      "Capitão Gancho", "Fada Madrinha", "Rainha Má", "Sete Anões", "João e o Pé de Feijão", "Cachinhos Dourados", "Soldadinho de Chumbo", "Chapeleiro Maluco", "Rainha de Copas", "Gênio da Lâmpada",
    ] },
  { id: "t30-quadrinhos-tirinhas", cat: "personagens", title: "Os 30 personagens de quadrinhos e tirinhas mais lembrados (fora os super-heróis)", source: N13,
    items: [
      "Mônica", "Cebolinha", "Snoopy", "Charlie Brown", "Garfield", "Mafalda", "Calvin", "Haroldo|Hobbes", "Tintim", "Asterix",
      "Obelix", "Pato Donald", "Tio Patinhas", "Zé Carioca", "Mickey", "Recruta Zero", "Hagar|Hagar, o Horrível", "Popeye", "Olívia Palito", "Dennis, o Pimentinha|Pimentinha",
      "Luluzinha", "Bolinha", "Riquinho", "Gasparzinho", "Menino Maluquinho", "Chico Bento", "Magali", "Cascão", "Níquel Náusea", "Armandinho",
    ] },
  { id: "t30-robos", cat: "personagens", title: "Os 30 robôs mais famosos da ficção", source: N13,
    items: [
      "R2-D2", "C-3PO", "WALL-E", "Exterminador do Futuro|T-800", "Optimus Prime", "Bumblebee", "Megatron", "Baymax", "EVA", "RoboCop",
      "Johnny 5", "HAL 9000", "Ultron", "Visão", "Bender", "Rosie", "Mazinger Z", "Gundam", "BB-8", "K-2SO",
      "Data", "Ava", "Sonny", "David", "Astro Boy", "Doraemon", "Robby, o Robô|Robby", "Gigante de Ferro", "T-1000", "Marvin",
    ] },
  { id: "t30-viloes-disney", cat: "personagens", title: "Os 30 vilões mais famosos da Disney", source: N13,
    items: [
      "Malévola", "Úrsula", "Scar", "Jafar", "Cruella de Vil|Cruella", "Capitão Gancho", "Rainha Má", "Lady Tremaine|Madrasta da Cinderela", "Hades", "Gaston",
      "Mamãe Gothel|Gothel", "Shere Khan", "Frollo", "Ratigan", "Hans", "Yzma", "Dr. Facilier", "Ratcliffe", "Shan Yu", "Clayton",
      "Kaa", "Rainha de Copas", "João Honesto", "Stromboli", "Madame Mim", "Madame Medusa", "Bafo de Onça|Pete", "Rei Magnífico", "Tamatoa", "Sykes",
    ] },
  { id: "t50-caes-gatos", cat: "personagens", title: "Os 50 cães e gatos mais famosos da ficção", source: N13,
    items: [
      "Garfield", "Scooby-Doo|Scooby", "Snoopy", "Tom", "Pluto", "Frajola", "Pateta", "Bidu", "Gato de Botas", "Lassie",
      "Beethoven", "Marley", "Hachiko", "Gato Félix|Félix", "Odie", "Mingau", "Gato Risonho|Gato de Cheshire", "Krypto", "Ajudante de Papai Noel", "Brian Griffin|Brian",
      "Bolt", "Dama", "Vagabundo", "Pongo", "Totó", "Muttley", "Gromit", "Clifford", "Coragem", "Floquinho",
      "Jake", "Bluey", "Chase", "Marshall", "Hello Kitty", "Oliver", "Salem", "Lúcifer", "Marie", "Tomás O'Malley|O'Malley",
      "Duquesa", "Fígaro", "Doraemon", "Bichento|Crookshanks", "Jiji", "Luna", "Ideiafix|Idefix", "Rantanplan", "Dug", "Sr. Bigglesworth",
    ] },

  // ───────────── Comida e bebida ─────────────
  { id: "t30-festa-junina", cat: "comida", title: "As 30 comidas e bebidas de festa junina mais famosas", source: N13,
    items: [
      "Pamonha", "Canjica", "Curau", "Pé de moleque", "Paçoca", "Quentão", "Vinho quente", "Pipoca", "Milho cozido|Milho verde", "Cocada",
      "Maçã do amor", "Bolo de milho", "Arroz doce", "Cuscuz", "Cachorro-quente", "Pinhão", "Bolo de fubá", "Doce de abóbora", "Doce de leite", "Bolo de mandioca|Bolo de aipim",
      "Pastel", "Amendoim", "Pé de moça", "Caldo verde", "Espetinho|Churrasquinho", "Broa de milho", "Queijo coalho", "Tapioca", "Quebra-queixo", "Chocolate quente",
    ] },
  { id: "t30-temperos", cat: "comida", title: "Os 30 temperos e ervas mais usados na cozinha", source: N13,
    items: [
      "Sal", "Pimenta-do-reino", "Alho", "Cebola", "Orégano", "Cominho", "Colorau|Urucum", "Salsinha|Salsa", "Cebolinha", "Coentro",
      "Manjericão", "Alecrim", "Louro|Folha de louro", "Canela", "Cravo|Cravo-da-índia", "Noz-moscada", "Páprica", "Açafrão|Cúrcuma", "Gengibre", "Hortelã",
      "Tomilho", "Sálvia", "Curry", "Pimenta calabresa", "Pimenta malagueta", "Mostarda", "Erva-doce", "Gergelim", "Shoyu|Molho de soja", "Chimichurri",
    ] },
  { id: "t30-drinks", cat: "comida", title: "Os 30 drinks mais famosos", source: N13,
    items: [
      "Caipirinha", "Mojito", "Margarita", "Piña Colada|Pina Colada", "Cosmopolitan", "Daiquiri", "Dry Martini|Martini", "Negroni", "Bloody Mary", "Sex on the Beach",
      "Gin tônica|Gim tônica", "Cuba Libre", "Aperol Spritz|Spritz", "Mai Tai", "Moscow Mule", "Old Fashioned", "Manhattan", "Tequila Sunrise", "Long Island Iced Tea", "Caipiroska|Caipivodka",
      "Batida", "Sangria", "Pisco Sour", "Whisky Sour", "Blue Lagoon", "Bellini", "Mimosa", "Clericot", "Hi-Fi", "Rabo de Galo",
    ] },
  { id: "t30-comidas-rua", cat: "comida", title: "As 30 comidas de rua mais famosas do mundo", source: N13,
    items: [
      "Cachorro-quente|Hot dog", "Pastel", "Acarajé", "Taco", "Churros", "Kebab|Döner", "Falafel", "Crepe", "Pretzel", "Espetinho",
      "Pão de queijo", "Milho verde", "Pipoca", "Batata frita", "Fish and chips", "Shawarma", "Dim sum", "Takoyaki", "Banh mi", "Pad thai",
      "Arepa", "Empanada", "Burrito", "Waffle", "Caldo de cana", "Quesadilla", "Samosa", "Rolinho primavera", "Yakitori", "Choripán",
    ] },
  { id: "t30-pratos-asiaticos", cat: "comida", title: "Os 30 pratos asiáticos mais famosos (sem contar a comida japonesa)", source: N13,
    items: [
      "Rolinho primavera", "Frango xadrez", "Chop suey", "Dim sum", "Guioza|Dumpling", "Pato laqueado|Pato de Pequim", "Arroz frito|Arroz chinês", "Pad thai", "Curry", "Pho",
      "Bibimbap", "Kimchi", "Bulgogi", "Tom yum", "Satay", "Biryani", "Tikka masala|Frango tikka masala", "Samosa", "Naan|Pão naan", "Wonton",
      "Bao", "Banh mi", "Tteokbokki", "Frango agridoce", "Hot pot", "Laksa", "Nasi goreng", "Mapo tofu", "Chow mein", "Dal",
    ] },
  { id: "t30-pratos-latinos", cat: "comida", title: "Os 30 pratos mais famosos da América Latina (sem contar o Brasil)", source: N13,
    items: [
      "Taco", "Burrito", "Nachos", "Guacamole", "Quesadilla", "Enchilada", "Chili com carne|Chili", "Fajita", "Churros", "Tortilla",
      "Tamal|Tamales", "Pozole", "Mole", "Ceviche", "Empanada", "Arepa", "Alfajor", "Asado", "Choripán", "Lomo saltado",
      "Pupusa", "Gallo pinto", "Ropa vieja", "Elote", "Pico de gallo", "Tres leches", "Medialuna", "Milanesa", "Locro", "Chivito",
    ] },
  { id: "t30-paes", cat: "comida", title: "Os 30 tipos de pão mais conhecidos", source: N13,
    items: [
      "Pão francês|Pão de sal|Cacetinho", "Pão de forma", "Pão de queijo", "Pão sírio|Pão árabe", "Baguete", "Croissant", "Pão italiano", "Ciabatta", "Brioche", "Focaccia",
      "Pão integral", "Pão de batata", "Pão doce", "Bisnaguinha", "Pão de hambúrguer", "Pão de cachorro-quente|Pão de hot dog", "Sonho", "Rosca", "Broa", "Pão australiano",
      "Pão de centeio", "Pão de leite", "Bagel", "Pretzel", "Panetone", "Pão de alho", "Pão caseiro", "Pão de fermentação natural|Sourdough|Levain", "Naan", "Chipa",
    ] },
  { id: "t30-molhos", cat: "comida", title: "Os 30 molhos mais famosos", source: N13,
    items: [
      "Ketchup", "Maionese", "Mostarda", "Molho de tomate|Molho vermelho", "Barbecue|Molho barbecue", "Shoyu", "Pesto", "Molho branco|Bechamel", "Molho rosé", "Molho tártaro",
      "Chimichurri", "Molho inglês", "Molho de alho", "Vinagrete", "Molho bolonhesa|Bolonhesa", "Molho quatro queijos|Quatro queijos", "Molho madeira", "Molho de pimenta", "Sriracha", "Teriyaki",
      "Tarê", "Aioli", "Molho holandês", "Molho agridoce", "Molho caesar", "Molho ranch|Ranch", "Molho mil ilhas|Mil ilhas", "Molho carbonara|Carbonara", "Molho cheddar|Cheddar", "Molho de iogurte",
    ] },
  { id: "t30-sorvetes", cat: "comida", title: "Os 30 sabores de sorvete mais pedidos", source: N13,
    items: [
      "Chocolate", "Morango", "Creme", "Flocos", "Napolitano", "Baunilha", "Limão", "Coco", "Chocolate branco", "Pistache",
      "Doce de leite", "Leite ninho|Ninho", "Açaí", "Maracujá", "Abacaxi", "Uva", "Menta|Menta com chocolate", "Cookies", "Brigadeiro", "Passas ao rum",
      "Nata", "Tapioca", "Milho verde", "Manga", "Café", "Amendoim", "Avelã", "Crocante", "Cupuaçu", "Iogurte",
    ] },
  { id: "t30-bolos", cat: "comida", title: "Os 30 bolos mais famosos", source: N13,
    items: [
      "Bolo de cenoura|Cenoura", "Bolo de chocolate|Chocolate", "Bolo de fubá|Fubá", "Bolo de laranja|Laranja", "Bolo de milho|Milho", "Bolo de coco|Coco", "Bolo de banana|Banana", "Bolo formigueiro|Formigueiro", "Bolo prestígio|Prestígio", "Red velvet",
      "Floresta negra", "Bolo de rolo", "Bolo de mandioca|Bolo de aipim|Mandioca", "Bolo de limão|Limão", "Nega maluca", "Bolo de maçã|Maçã", "Bolo souza leão|Souza leão", "Bolo mármore|Bolo mesclado", "Bolo de abacaxi|Abacaxi", "Bolo de morango|Morango",
      "Bolo de nozes|Nozes", "Cheesecake", "Brownie", "Pão de ló", "Bolo de leite ninho|Ninho", "Bolo de maracujá|Maracujá", "Bolo de iogurte|Iogurte", "Bolo de churros|Churros", "Bolo de paçoca|Paçoca", "Bolo gelado",
    ] },
  { id: "t30-cafe-da-manha", cat: "comida", title: "As 30 coisas mais comuns no café da manhã", source: N13,
    items: [
      "Pão francês|Pão", "Café", "Leite", "Manteiga", "Queijo", "Presunto", "Ovo|Ovos|Ovo mexido", "Tapioca", "Cuscuz", "Bolo",
      "Mamão", "Banana", "Iogurte", "Granola", "Cereal|Sucrilhos", "Suco de laranja|Suco", "Achocolatado|Nescau|Toddy", "Requeijão", "Geleia", "Mel",
      "Pão de queijo", "Torrada", "Panqueca", "Bacon", "Mortadela", "Biscoito|Bolacha", "Aveia|Mingau", "Vitamina", "Chá", "Misto-quente",
    ] },
  { id: "t30-cortes-carne", cat: "comida", title: "Os 30 cortes de carne mais conhecidos", source: N13,
    items: [
      "Picanha", "Alcatra", "Fraldinha", "Maminha", "Costela", "Contrafilé", "Filé mignon", "Cupim", "Patinho", "Coxão mole",
      "Coxão duro", "Acém", "Músculo", "Lagarto", "Ancho|Bife ancho", "Chorizo|Bife de chorizo", "T-bone", "Tomahawk", "Paleta", "Peito",
      "Rabada", "Linguiça", "Coração de frango|Coraçãozinho", "Asa de frango|Asinha", "Coxa de frango|Coxa", "Sobrecoxa", "Pernil", "Lombo", "Costelinha de porco|Costelinha", "Panceta|Barriga de porco",
    ] },

  // ───────────── Dia a dia ─────────────
  { id: "t30-computador", cat: "diaadia", title: "As 30 peças e acessórios de computador mais conhecidos", source: N13,
    items: [
      "Teclado", "Mouse", "Monitor", "Processador|CPU", "Memória RAM|RAM", "HD|Disco rígido", "SSD", "Placa de vídeo", "Placa-mãe", "Fonte",
      "Gabinete", "Webcam", "Fone de ouvido", "Microfone", "Pen drive", "Impressora", "Cooler", "Roteador", "Caixa de som", "Estabilizador",
      "Nobreak", "Cabo HDMI|HDMI", "Mousepad", "Leitor de DVD|Drive de DVD", "Scanner", "Modem", "Placa de som", "Placa de rede", "Headset", "HD externo",
    ] },
  { id: "t30-comodos", cat: "diaadia", title: "Os 30 cômodos e partes da casa mais lembrados", source: N13,
    items: [
      "Sala", "Cozinha", "Quarto", "Banheiro", "Varanda", "Garagem", "Lavanderia|Área de serviço", "Quintal", "Jardim", "Escritório",
      "Corredor", "Sótão", "Porão", "Despensa", "Closet", "Suíte", "Lavabo", "Hall de entrada|Hall", "Telhado", "Piscina",
      "Área gourmet|Churrasqueira", "Sacada", "Escada", "Janela", "Porta", "Muro", "Portão", "Chaminé", "Edícula", "Copa",
    ] },
  { id: "t30-moveis", cat: "diaadia", title: "Os 30 móveis mais comuns", source: N13,
    items: [
      "Cama", "Sofá", "Mesa", "Cadeira", "Guarda-roupa", "Armário", "Estante", "Rack", "Criado-mudo|Mesa de cabeceira", "Cômoda",
      "Escrivaninha", "Poltrona", "Banqueta", "Prateleira", "Sapateira", "Penteadeira", "Beliche", "Berço", "Mesa de centro", "Aparador",
      "Cristaleira", "Puff|Pufe", "Balcão", "Rede", "Cabideiro", "Baú", "Divã", "Bicama", "Banco", "Gaveteiro",
    ] },
  { id: "t30-eletrodomesticos", cat: "diaadia", title: "Os 30 eletrodomésticos e aparelhos de casa mais comuns", source: N13,
    items: [
      "Geladeira", "Fogão", "Micro-ondas", "Máquina de lavar|Lava-roupas", "Televisão|TV", "Ventilador", "Ar-condicionado", "Liquidificador", "Batedeira", "Ferro de passar",
      "Aspirador de pó", "Secador de cabelo", "Cafeteira", "Torradeira", "Sanduicheira", "Airfryer|Fritadeira elétrica", "Freezer", "Lava-louças", "Chuveiro elétrico", "Forno elétrico",
      "Mixer", "Processador de alimentos", "Panela elétrica de arroz", "Grill", "Purificador de água", "Secadora", "Chaleira elétrica", "Aquecedor", "Umidificador", "Robô aspirador",
    ] },
  { id: "t30-material-escolar", cat: "diaadia", title: "Os 30 itens de material escolar mais comuns", source: N13,
    items: [
      "Lápis", "Caneta", "Borracha", "Apontador", "Caderno", "Régua", "Cola", "Tesoura", "Mochila", "Estojo",
      "Lápis de cor", "Giz de cera", "Canetinha|Hidrocor", "Marca-texto", "Compasso", "Transferidor", "Esquadro", "Corretivo", "Calculadora", "Agenda",
      "Fichário", "Pasta", "Livro", "Dicionário", "Massinha|Massa de modelar", "Tinta guache|Guache", "Pincel", "Papel sulfite|Sulfite", "Cartolina", "Lancheira",
    ] },
  { id: "t30-higiene", cat: "diaadia", title: "Os 30 produtos de higiene e beleza mais comuns", source: N13,
    items: [
      "Sabonete", "Shampoo|Xampu", "Condicionador", "Pasta de dente|Creme dental", "Escova de dente", "Fio dental", "Desodorante", "Perfume", "Hidratante", "Protetor solar",
      "Aparelho de barbear|Lâmina de barbear", "Esmalte", "Batom", "Base", "Rímel|Máscara de cílios", "Delineador", "Sombra", "Blush", "Pó compacto", "Demaquilante",
      "Algodão", "Cotonete", "Enxaguante bucal", "Absorvente", "Papel higiênico", "Lenço umedecido", "Creme para pentear", "Gel de cabelo|Gel", "Pente", "Escova de cabelo",
    ] },
  { id: "t30-bairro", cat: "diaadia", title: "Os 30 lugares e lojas que todo bairro tem", source: N13,
    items: [
      "Padaria", "Farmácia", "Supermercado|Mercado", "Açougue", "Banca de jornal", "Lotérica", "Posto de gasolina", "Salão de beleza", "Barbearia", "Academia",
      "Pet shop", "Papelaria", "Lanchonete", "Pizzaria", "Sorveteria", "Feira", "Sacolão|Hortifrúti", "Lavanderia", "Borracharia", "Oficina mecânica",
      "Chaveiro", "Loja de material de construção", "Bar|Boteco", "Restaurante", "Igreja", "Escola", "Banco", "Correios", "Floricultura", "Ótica",
    ] },
  { id: "t30-partes-carro", cat: "diaadia", title: "As 30 partes do carro mais conhecidas", source: N13,
    items: [
      "Volante", "Pneu", "Motor", "Freio", "Embreagem", "Acelerador", "Câmbio", "Retrovisor", "Para-brisa", "Limpador de para-brisa",
      "Farol", "Lanterna", "Porta-malas", "Capô", "Para-choque", "Bateria", "Radiador", "Cinto de segurança", "Airbag", "Banco",
      "Buzina", "Painel", "Velocímetro", "Tanque de combustível|Tanque", "Escapamento", "Estepe", "Macaco", "Roda", "Amortecedor", "Freio de mão",
    ] },
  { id: "t50-lojas", cat: "diaadia", title: "As 50 lojas e redes mais famosas do Brasil", source: N13,
    items: [
      "Magazine Luiza|Magalu", "Casas Bahia", "Americanas", "Mercado Livre", "Renner", "Riachuelo", "C&A", "Amazon", "Shopee", "Carrefour",
      "Pão de Açúcar", "Atacadão", "Assaí", "Extra", "Leroy Merlin", "Tok&Stok", "Centauro", "Decathlon", "Havan", "Marisa",
      "Hering", "O Boticário|Boticário", "Natura", "Drogasil", "Droga Raia", "Pague Menos", "Kalunga", "Fast Shop", "Netshoes", "Zara",
      "Shein", "AliExpress", "Dafiti", "Submarino", "Cobasi", "Petz", "Ponto Frio|Ponto", "Saraiva", "Livraria Cultura", "McDonald's",
      "Burger King", "Outback", "Starbucks", "Cacau Show", "Kopenhagen", "Havaianas", "Lojas Cem", "Polishop", "Camicado", "Pernambucanas",
    ] },
  { id: "t50-supermercado", cat: "diaadia", title: "As 50 coisas mais compradas no supermercado", source: N13,
    items: [
      "Arroz", "Feijão", "Açúcar", "Café", "Leite", "Óleo", "Sal", "Macarrão", "Farinha de trigo", "Ovos|Ovo",
      "Pão", "Manteiga", "Margarina", "Queijo", "Presunto", "Iogurte", "Frango", "Carne moída|Carne", "Banana", "Maçã",
      "Tomate", "Cebola", "Alho", "Batata", "Alface", "Cenoura", "Refrigerante", "Suco", "Cerveja", "Água|Água mineral",
      "Biscoito|Bolacha", "Chocolate", "Molho de tomate", "Achocolatado", "Sabão em pó", "Detergente", "Amaciante", "Água sanitária", "Papel higiênico", "Sabonete",
      "Pasta de dente|Creme dental", "Shampoo|Xampu", "Esponja", "Saco de lixo", "Requeijão", "Salsicha", "Linguiça", "Atum|Atum em lata", "Ketchup", "Papel toalha",
    ] },

  // ───────────── Casais ─────────────
  { id: "t30-casais-famosos", cat: "casais", title: "Os 30 casais de famosos mais lembrados", source: N13,
    items: [
      "Beyoncé e Jay-Z|~Beyonce|~Jay-Z", "Brad Pitt e Angelina Jolie|Brangelina|~Brad Pitt|~Angelina Jolie", "Barack e Michelle Obama|~Obama", "Príncipe William e Kate Middleton|William e Kate|~Kate Middleton", "Príncipe Harry e Meghan Markle|Harry e Meghan|~Meghan", "Charles e Diana|~Diana|~Lady Di", "David e Victoria Beckham|~Beckham", "Kim Kardashian e Kanye West|~Kanye", "Taylor Swift e Travis Kelce|~Travis Kelce|~Taylor Swift", "Justin e Hailey Bieber|~Hailey",
      "Tom Brady e Gisele Bündchen|~Gisele|~Tom Brady", "John Lennon e Yoko Ono|~Yoko|~Lennon", "Elvis e Priscilla Presley|~Priscilla", "Johnny Cash e June Carter|~June Carter|~Johnny Cash", "Kurt Cobain e Courtney Love|~Courtney Love|~Kurt Cobain", "Elizabeth Taylor e Richard Burton|~Elizabeth Taylor|~Richard Burton", "Ben Affleck e Jennifer Lopez|Bennifer|~Jennifer Lopez|~Ben Affleck", "Shakira e Piqué|~Shakira|~Pique", "Neymar e Bruna Marquezine|~Bruna Marquezine", "Xuxa e Pelé|~Xuxa",
      "Fátima Bernardes e William Bonner|~Fatima Bernardes|~William Bonner", "Tarcísio Meira e Glória Menezes|~Tarcisio|~Gloria Menezes", "Angélica e Luciano Huck|~Angelica|~Luciano Huck", "Virginia e Zé Felipe|~Virginia|~Ze Felipe", "Sandy e Lucas Lima|~Sandy", "Cauã Reymond e Grazi Massafera|~Caua Reymond|~Grazi", "Zendaya e Tom Holland|~Zendaya|~Tom Holland", "Blake Lively e Ryan Reynolds|~Blake Lively|~Ryan Reynolds", "Will Smith e Jada Pinkett|~Will Smith|~Jada", "Tom Hanks e Rita Wilson|~Tom Hanks|~Rita Wilson",
    ] },

  // ───────────── Bíblia ─────────────
  { id: "t30-biblia-nt", cat: "biblia", title: "Os 30 personagens mais lembrados do Novo Testamento", source: N13,
    items: [
      "Jesus", "Maria", "José", "Pedro", "Paulo", "João Batista", "João|João Evangelista", "Judas Iscariotes|Judas", "Maria Madalena", "Tomé",
      "Mateus", "Lucas", "Marcos", "Tiago", "André", "Filipe", "Bartolomeu", "Lázaro", "Marta", "Pôncio Pilatos|Pilatos",
      "Herodes", "Zaqueu", "Nicodemos", "Barrabás", "Estêvão", "Timóteo", "Barnabé", "Isabel", "Zacarias", "Caifás",
    ] },
  { id: "t30-biblia-animais", cat: "biblia", title: "Os 30 animais mais lembrados da Bíblia", source: N13,
    items: [
      "Serpente|Cobra", "Cordeiro", "Leão", "Pomba", "Jumento|Burro", "Camelo", "Peixe", "Grande peixe|Baleia", "Ovelha", "Corvo",
      "Bode|Cabra", "Boi", "Cavalo", "Rã|Sapo", "Gafanhoto", "Urso", "Lobo", "Raposa", "Águia", "Porco",
      "Bezerro de ouro|Bezerro", "Mosca", "Piolho", "Escorpião", "Codorniz", "Galo", "Leviatã", "Cão|Cachorro", "Pardal", "Formiga",
    ] },
  { id: "t30-biblia-historias", cat: "biblia", title: "As 30 histórias da Bíblia mais conhecidas", source: N13,
    items: [
      "Criação do mundo|Criação", "Adão e Eva", "Caim e Abel", "Arca de Noé|Dilúvio", "Torre de Babel", "Sacrifício de Isaque|Abraão e Isaque", "Sodoma e Gomorra", "José do Egito", "Moisés salvo das águas|Moisés no cesto", "Sarça ardente",
      "Pragas do Egito|Dez pragas", "Abertura do Mar Vermelho|Mar Vermelho", "Dez Mandamentos", "Bezerro de ouro", "Muralhas de Jericó|Jericó", "Sansão e Dalila", "Davi e Golias", "Rute e Noemi|Rute", "Daniel na cova dos leões", "Jonas e a baleia|Jonas",
      "Rainha Ester|Ester", "Nascimento de Jesus", "Batismo de Jesus", "Bodas de Caná|Água em vinho", "Multiplicação dos pães", "Jesus anda sobre as águas", "Ressurreição de Lázaro", "Última Ceia|Santa Ceia", "Crucificação", "Ressurreição de Jesus",
    ] },
  { id: "t30-biblia-reis-profetas", cat: "biblia", title: "Os 30 reis e profetas mais lembrados da Bíblia", source: N13,
    items: [
      "Moisés", "Davi|Rei Davi", "Salomão", "Elias", "Isaías", "Daniel", "Jonas", "Saul", "Samuel", "Jeremias",
      "Ezequiel", "Eliseu", "João Batista", "Nabucodonosor", "Faraó", "Herodes", "Ciro", "Dario", "Acabe", "Ezequias",
      "Josias", "Natã", "Oseias", "Amós", "Miqueias", "Malaquias", "Habacuque", "Joel", "Débora", "Belsazar",
    ] },
  { id: "t30-biblia-mulheres", cat: "biblia", title: "As 30 mulheres mais conhecidas da Bíblia", source: N13,
    items: [
      "Maria", "Eva", "Sara", "Rute", "Ester", "Maria Madalena", "Raquel", "Rebeca", "Dalila", "Débora",
      "Ana", "Miriã", "Noemi", "Jezabel", "Marta", "Isabel", "Lia", "Agar", "Raabe", "Betsabá|Bate-Seba",
      "Abigail", "Mical", "Tamar", "Rainha de Sabá", "Mulher de Ló", "Salomé", "Lídia", "Priscila", "Dorcas|Tabita", "Joquebede",
    ] },
);
