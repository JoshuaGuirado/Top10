// Uso: npm i @iconify-json/game-icons@1.2.4 @iconify-json/mdi@1.2.3 svg-path-bbox@2.1.0 numa pasta à parte e rode
// NODE_PATH=<pasta>/node_modules node ferramentas/gerar-tamanhozi.js tamanhozi/data/itens.js
//
// Gera os itens do Tamanhozi (tudo menos os países): silhueta, categoria, nome nos 3 idiomas e a medida de verdade.
// Silhuetas: game-icons.net (CC BY 3.0, de Lorc, Delapouite e outros) e Material Design Icons (Apache 2.0);
// as marcadas com "à mão" foram desenhadas aqui. A medida vale para a altura ("a") ou para a largura da caixa da
// silhueta ("c" comprimento, "l" largura, "d" diâmetro, "e" envergadura); "cv" é comprimento medido na vertical.
const fs = require("fs");
const { svgPathBbox } = require("svg-path-bbox");
const G = require("@iconify-json/game-icons/icons.json");
const M = require("@iconify-json/mdi/icons.json");

const MAO = {
  cristo: "M0 19L30 16.5L44 16.5L74 19L74 24.5L46.5 25L47.5 79L50 79L50 100L24 100L24 79L26.5 79L27.5 25L0 24.5ZM30.5 9.5a6.5 6.5 0 1 0 13 0a6.5 6.5 0 1 0-13 0Z",
  liberdade: "M2 100L38 100L35 80L32 78L31 54L27 52L26 30L28 24L29 8L31 6L30 0L27 0L26 6L25 8L24 22L22 22L23 17L21 13L19 13L17 17L18 22L14 24L12 32L15 36L14 52L9 54L8 78L5 80Z",
  burj: "M0 100L20 100L20 92L18 92L18 80L16.5 80L16.5 66L15 66L15 52L13.5 52L13.5 40L12.5 40L12.5 28L11.5 28L11.2 18L10.4 0L9.6 0L8.8 18L8.5 28L7.5 28L7.5 40L6.5 40L6.5 52L5 52L5 66L3.5 66L3.5 80L2 80L2 92L0 92Z",
  empire: "M0 100L30 100L30 80L27 80L27 74L24 74L24 30L21 30L21 25L19 25L19 19L17 19L16.2 12L15.3 0L14.7 0L13.8 12L13 19L11 19L11 25L9 25L9 30L6 30L6 74L3 74L3 80L0 80Z",
  godzilla: "M36 0L48 2L54 8L46 12L42 16L46 26L58 30L60 36L50 36L48 50L52 60L50 72L50 88L58 96L58 100L38 100L38 92L34 74L28 70L16 82L4 96L0 100L2 92L12 76L24 62L28 48L24 40L20 36L26 32L22 26L28 24L26 18L32 14L32 6Z",
};

// [id, categoria, ícone, "português", "English", "español", medida, metros]
const ITENS = [
  // Monumentos e construções
  ["torre-eiffel", "monumentos", "m:eiffel-tower", "Torre Eiffel", "Eiffel Tower", "Torre Eiffel", "a", 330],
  ["torre-pisa", "monumentos", "g:pisa-tower", "Torre de Pisa", "Leaning Tower of Pisa", "Torre de Pisa", "a", 56],
  ["big-ben", "monumentos", "g:clock-tower", "Big Ben", "Big Ben", "Big Ben", "a", 96],
  ["arco-triunfo", "monumentos", "g:arc-triomphe", "Arco do Triunfo", "Arc de Triomphe", "Arco de Triunfo", "a", 50],
  ["queops", "monumentos", "g:great-pyramid", "Pirâmide de Quéops", "Great Pyramid of Giza", "Pirámide de Keops", "a", 139],
  ["esfinge", "monumentos", "g:egyptian-sphinx", "Grande Esfinge de Gizé", "Great Sphinx of Giza", "Gran Esfinge de Guiza", "a", 20],
  ["moai", "monumentos", "g:moai", "Moai (o maior de pé)", "Moai (tallest standing)", "Moái (el más alto en pie)", "a", 10],
  ["sao-basilio", "monumentos", "g:saint-basil-cathedral", "Catedral de São Basílio", "Saint Basil's Cathedral", "Catedral de San Basilio", "a", 65],
  ["opera-sydney", "monumentos", "g:sydney-opera-house", "Ópera de Sydney", "Sydney Opera House", "Ópera de Sídney", "c", 183],
  ["piramide-louvre", "monumentos", "g:louvre-pyramid", "Pirâmide do Louvre", "Louvre Pyramid", "Pirámide del Louvre", "a", 21.6],
  ["washington", "monumentos", "g:obelisk", "Monumento a Washington", "Washington Monument", "Monumento a Washington", "a", 169],
  ["tower-bridge", "monumentos", "g:tower-bridge", "Tower Bridge", "Tower Bridge", "Tower Bridge", "a", 65],
  ["kukulcan", "monumentos", "g:mayan-pyramid", "Pirâmide de Chichén Itzá", "Chichén Itzá pyramid", "Pirámide de Chichén Itzá", "a", 30],
  ["partenon", "monumentos", "g:greek-temple", "Partenon", "Parthenon", "Partenón", "l", 31],
  ["london-eye", "monumentos", "m:ferris-wheel", "London Eye", "London Eye", "London Eye", "a", 135],
  ["cristo", "monumentos", "mao:cristo", "Cristo Redentor (com o pedestal)", "Christ the Redeemer (with pedestal)", "Cristo Redentor (con el pedestal)", "a", 38],
  ["liberdade", "monumentos", "mao:liberdade", "Estátua da Liberdade (com o pedestal)", "Statue of Liberty (with pedestal)", "Estatua de la Libertad (con el pedestal)", "a", 93],
  ["burj-khalifa", "monumentos", "mao:burj", "Burj Khalifa", "Burj Khalifa", "Burj Khalifa", "a", 828],
  ["empire-state", "monumentos", "mao:empire", "Empire State Building (com a antena)", "Empire State Building (with antenna)", "Empire State Building (con la antena)", "a", 443],
  ["touro-wall-street", "monumentos", "g:charging-bull", "Touro de Wall Street", "Charging Bull (Wall Street)", "Toro de Wall Street", "c", 4.9],
  ["turbina-eolica", "monumentos", "m:wind-turbine", "Turbina eólica (com a pá em cima)", "Wind turbine (blade at the top)", "Aerogenerador (con el aspa arriba)", "a", 150],
  // Personagens, monstros e pessoas
  ["godzilla", "personagens", "mao:godzilla", "Godzilla (2019)", "Godzilla (2019)", "Godzilla (2019)", "a", 120],
  ["king-kong", "personagens", "g:gorilla", "King Kong (Ilha da Caveira, 2017)", "King Kong (Skull Island, 2017)", "King Kong (La Isla Calavera, 2017)", "a", 31.6],
  ["bfg", "personagens", "g:giant", "O Bom Gigante Amigo (livro)", "The BFG (book)", "El Gran Gigante Bonachón (libro)", "a", 7.3],
  ["pe-grande", "personagens", "g:sasquatch", "Pé-Grande (como contam)", "Bigfoot (as told)", "Pie Grande (según cuentan)", "a", 2.4],
  ["gundam", "personagens", "g:battle-mech", "Gundam RX-78-2", "Gundam RX-78-2", "Gundam RX-78-2", "a", 18],
  ["nessie", "personagens", "g:plesiosaurus", "Monstro do Lago Ness (como contam)", "Loch Ness Monster (as told)", "Monstruo del lago Ness (según cuentan)", "c", 10],
  ["darth-vader", "personagens", "m:human-male", "Darth Vader", "Darth Vader", "Darth Vader", "a", 2.02],
  ["hagrid", "personagens", "m:human-male", "Hagrid (livro)", "Hagrid (book)", "Hagrid (libro)", "a", 3.5],
  ["pessoa", "personagens", "m:human-male", "Homem adulto (média no Brasil)", "Adult man (Brazil average)", "Hombre adulto (promedio en Brasil)", "a", 1.73],
  ["wadlow", "personagens", "m:human-male", "Robert Wadlow, o mais alto da história", "Robert Wadlow, tallest ever", "Robert Wadlow, el más alto de la historia", "a", 2.72],
  ["shaq", "personagens", "m:human-male", "Shaquille O'Neal", "Shaquille O'Neal", "Shaquille O'Neal", "a", 2.16],
  ["crianca", "personagens", "m:human-child", "Criança de 5 anos", "5-year-old child", "Niño de 5 años", "a", 1.1],
  // Animais
  ["elefante", "animais", "g:elephant", "Elefante-africano", "African elephant", "Elefante africano", "a", 3.3],
  ["cachalote", "animais", "g:sperm-whale", "Cachalote", "Sperm whale", "Cachalote", "c", 16],
  ["cavalo", "animais", "m:horse", "Cavalo", "Horse", "Caballo", "c", 2.4],
  ["camelo", "animais", "g:camel", "Camelo", "Camel", "Camello", "a", 2.2],
  ["canguru", "animais", "g:kangaroo", "Canguru-vermelho (com a cauda)", "Red kangaroo (with tail)", "Canguro rojo (con la cola)", "c", 2.4],
  ["avestruz", "animais", "g:ostrich", "Avestruz", "Ostrich", "Avestruz", "a", 2.7],
  ["mamute", "animais", "g:mammoth", "Mamute-lanoso", "Woolly mammoth", "Mamut lanudo", "a", 3.4],
  ["velociraptor", "animais", "g:velociraptor", "Velociraptor (o de verdade)", "Velociraptor (the real one)", "Velociraptor (el de verdad)", "c", 2],
  ["urso-polar", "animais", "g:polar-bear", "Urso-polar", "Polar bear", "Oso polar", "c", 2.5],
  ["pinguim", "animais", "g:penguin", "Pinguim-imperador", "Emperor penguin", "Pingüino emperador", "a", 1.15],
  ["formiga", "animais", "g:ant", "Formiga-cortadeira", "Leafcutter ant", "Hormiga cortadora", "cv", 0.015],
  ["vaca", "animais", "g:cow", "Vaca", "Cow", "Vaca", "c", 2.4],
  ["bisao", "animais", "g:bison", "Bisão-americano", "American bison", "Bisonte americano", "c", 3.5],
  ["diplodoco", "animais", "g:diplodocus", "Diplodoco", "Diplodocus", "Diplodocus", "c", 26],
  ["pterodactilo", "animais", "g:pterodactylus", "Pterodáctilo", "Pterodactylus", "Pterodáctilo", "e", 1.04],
  ["coelho", "animais", "g:rabbit", "Coelho", "Rabbit", "Conejo", "c", 0.4],
  ["flamingo", "animais", "g:flamingo", "Flamingo", "Flamingo", "Flamenco", "a", 1.4],
  ["tubarao-branco", "animais", "m:shark", "Tubarão-branco", "Great white shark", "Tiburón blanco", "c", 4.5],
  ["tubarao-baleia", "animais", "m:shark", "Tubarão-baleia", "Whale shark", "Tiburón ballena", "c", 12],
  ["lula-gigante", "animais", "g:giant-squid", "Lula-gigante", "Giant squid", "Calamar gigante", "cv", 12],
  ["caracol", "animais", "g:snail", "Caracol de jardim", "Garden snail", "Caracol de jardín", "c", 0.035],
  ["cachorro", "animais", "m:dog-side", "Labrador", "Labrador", "Labrador", "c", 1],
  ["garca", "animais", "g:heron", "Garça-real", "Grey heron", "Garza real", "a", 1],
  ["cavalo-marinho", "animais", "g:seahorse", "Cavalo-marinho", "Seahorse", "Caballito de mar", "a", 0.15],
  ["joaninha", "animais", "g:ladybug", "Joaninha", "Ladybug", "Mariquita", "cv", 0.008],
  // Veículos
  ["onibus-espacial", "veiculos", "g:space-shuttle", "Ônibus espacial (com tanque e foguetes)", "Space Shuttle (with tank and boosters)", "Transbordador espacial (con tanque y cohetes)", "a", 56],
  ["saturn-v", "veiculos", "m:rocket", "Foguete Saturno V", "Saturn V rocket", "Cohete Saturno V", "a", 111],
  ["iss", "veiculos", "m:space-station", "Estação Espacial Internacional", "International Space Station", "Estación Espacial Internacional", "l", 109],
  ["typhoon", "veiculos", "g:submarine", "Submarino classe Typhoon", "Typhoon-class submarine", "Submarino clase Typhoon", "c", 175],
  ["ever-given", "veiculos", "g:cargo-ship", "Navio porta-contêineres Ever Given", "Ever Given container ship", "Portacontenedores Ever Given", "c", 400],
  ["caravela", "veiculos", "g:caravel", "Caravela (como a de Cabral)", "Caravel (like Cabral's)", "Carabela (como la de Cabral)", "c", 25],
  ["drakkar", "veiculos", "g:drakkar", "Barco viking", "Viking longship", "Barco vikingo", "c", 23],
  ["onibus", "veiculos", "m:bus-side", "Ônibus urbano", "City bus", "Autobús urbano", "c", 12],
  ["dois-andares", "veiculos", "m:bus-double-decker", "Ônibus de dois andares de Londres", "London double-decker bus", "Autobús de dos pisos de Londres", "a", 4.4],
  ["carreta", "veiculos", "g:truck", "Caminhão com carreta", "Semi-trailer truck", "Camión con remolque", "c", 18],
  ["fusca", "veiculos", "m:car-side", "Fusca", "VW Beetle", "Escarabajo (VW)", "c", 4.08],
  ["bicicleta", "veiculos", "m:bicycle", "Bicicleta", "Bicycle", "Bicicleta", "c", 1.75],
  ["hindenburg", "veiculos", "g:zeppelin", "Dirigível Hindenburg", "Hindenburg airship", "Dirigible Hindenburg", "c", 245],
  ["black-hawk", "veiculos", "g:helicopter", "Helicóptero Black Hawk", "Black Hawk helicopter", "Helicóptero Black Hawk", "c", 19.8],
  ["bagger", "veiculos", "g:bucket-wheel-excavator", "Escavadeira Bagger 293", "Bagger 293 excavator", "Excavadora Bagger 293", "a", 96],
  ["tanque", "veiculos", "g:battle-tank", "Tanque Leopard 2 (com o canhão)", "Leopard 2 tank (with gun)", "Tanque Leopard 2 (con el cañón)", "c", 10],
  ["balao", "veiculos", "m:airballoon", "Balão de ar quente", "Hot air balloon", "Globo aerostático", "a", 25],
  // Objetos
  ["piano", "objetos", "g:grand-piano", "Piano de cauda de concerto", "Concert grand piano", "Piano de cola de concierto", "c", 2.74],
  ["celular", "objetos", "g:smartphone", "iPhone 15", "iPhone 15", "iPhone 15", "a", 0.147],
  ["bola-futebol", "objetos", "g:soccer-ball", "Bola de futebol", "Soccer ball", "Balón de fútbol", "d", 0.22],
  ["bola-basquete", "objetos", "g:basketball-ball", "Bola de basquete", "Basketball", "Balón de baloncesto", "d", 0.24],
  ["geladeira", "objetos", "g:fridge", "Geladeira duplex", "Two-door fridge", "Refrigerador de dos puertas", "a", 1.8],
  ["sofa", "objetos", "g:sofa", "Sofá de 3 lugares", "3-seat sofa", "Sofá de 3 plazas", "c", 2.1],
  ["pizza", "objetos", "g:full-pizza", "Pizza grande", "Large pizza", "Pizza grande", "d", 0.35],
  ["chave", "objetos", "g:key", "Chave de casa", "House key", "Llave de casa", "cv", 0.06],
  ["porta", "objetos", "m:door", "Porta", "Door", "Puerta", "a", 2.1],
  ["cadeira", "objetos", "g:wooden-chair", "Cadeira", "Chair", "Silla", "a", 0.9],
  ["notebook", "objetos", "m:laptop", "Notebook de 15 polegadas", "15-inch laptop", "Portátil de 15 pulgadas", "l", 0.36],
  ["tv", "objetos", "m:television", "TV de 55 polegadas", "55-inch TV", "Televisor de 55 pulgadas", "l", 1.23],
  ["caneca", "objetos", "m:coffee", "Caneca", "Mug", "Taza", "a", 0.1],
  ["privada", "objetos", "m:toilet", "Vaso sanitário", "Toilet", "Inodoro", "a", 0.75],
  ["lampada", "objetos", "m:lightbulb", "Lâmpada", "Light bulb", "Bombilla", "a", 0.11],
  ["maquina-lavar", "objetos", "m:washing-machine", "Máquina de lavar", "Washing machine", "Lavadora", "a", 0.85],
  ["latinha", "objetos", "g:soda-can", "Lata de refrigerante", "Soda can", "Lata de refresco", "a", 0.122],
  ["cartao", "objetos", "m:credit-card", "Cartão de crédito", "Credit card", "Tarjeta de crédito", "l", 0.0856],
  ["dado", "objetos", "m:dice-6", "Dado", "Die", "Dado", "l", 0.016],
  // Natureza (fica junto com os monumentos: "Lugares e monumentos")
  ["fuji", "monumentos", "m:volcano", "Monte Fuji", "Mount Fuji", "Monte Fuji", "a", 3776],
  ["sequoia", "monumentos", "g:pine-tree", "Sequoia General Sherman", "General Sherman sequoia", "Secuoya General Sherman", "a", 84],
  ["arvore-natal", "monumentos", "m:pine-tree", "Árvore de Natal do Rockefeller Center", "Rockefeller Center Christmas tree", "Árbol de Navidad del Rockefeller Center", "a", 24],
  ["coqueiro", "monumentos", "g:palm-tree", "Coqueiro", "Coconut palm", "Cocotero", "a", 25],
  ["baoba", "monumentos", "g:baobab", "Baobá", "Baobab", "Baobab", "a", 25],
  ["saguaro", "monumentos", "g:cactus", "Cacto saguaro", "Saguaro cactus", "Cactus saguaro", "a", 12],
];

// Uma casa decimal basta; o espaço na frente evita grudar no número anterior ("3.96.5" → "4 .5", não "4.5").
const arred = (d) => d.replace(/-?\d*\.\d+(?:e-?\d+)?/g, (n) => " " + String(Math.round(Number(n) * 10) / 10)).replace(/([A-Za-z]) /g, "$1");
const linhas = [];
for (const [id, cat, ic, pt, en, es, medida, metros] of ITENS) {
  let d;
  if (ic.startsWith("mao:")) d = MAO[ic.slice(4)];
  else {
    const [p, nome] = ic.split(":");
    const icone = (p === "g" ? G : M).icons[nome];
    if (!icone) throw new Error("ícone não existe: " + ic);
    if (/<(g|use|circle|rect|ellipse)\b|transform=/.test(icone.body)) throw new Error("ícone com mais que path: " + ic);
    d = arred([...icone.body.matchAll(/ d="([^"]+)"/g)].map((m) => m[1]).join(""));
  }
  const [x0, y0, x1, y1] = svgPathBbox(d);
  const w = x1 - x0, h = y1 - y0;
  const dim = medida === "a" || medida === "cv" ? h : w;
  // k = metros por unidade do desenho.
  linhas.push(`  ${JSON.stringify([id, cat, pt, en, es, medida, metros, +(metros / dim).toPrecision(6), +x0.toFixed(1), +y0.toFixed(1), +w.toFixed(1), +h.toFixed(1), d])},`);
}
fs.writeFileSync(process.argv[2], `// Itens do Tamanhozi (os países ficam em paises.js): [id, categoria, "português", "English", "español", medida, metros,
// metros por unidade do desenho, x, y, largura e altura da silhueta, contorno SVG]. Gerado por ferramentas/gerar-tamanhozi.js.
// medida: a = altura, c = comprimento, cv = comprimento (em pé, na vertical), l = largura, d = diâmetro, e = envergadura.
// Silhuetas: game-icons.net (CC BY 3.0: Lorc, Delapouite e outros), Material Design Icons (Apache 2.0) e algumas desenhadas à mão.
// Itens novos entram no FIM (a ordem é usada pelo sorteio do dia) e precisam de uma linha nova em TZ_DIARIO_POOLS.

tzItens([
${linhas.join("\n")}
]);
`);
console.log(linhas.length, "itens", fs.statSync(process.argv[2]).size, "bytes");
