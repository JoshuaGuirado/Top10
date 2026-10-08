// Temas do Patozi e o jeito de cadastrar cartas.
// Cada carta é [patos, resposta, "pergunta em português", "in English", "en español"] e, quando a resposta
// é um ano, "ano" no fim. Os patos (1 a 3) dizem quanto a carta pesa para quem ficar com ela: a pergunta
// difícil vale mais. Toda resposta é um número inteiro.
//
// Cartas novas: entram num arquivo novo, carregado depois dos outros (assim o Pato do dia de hoje não muda),
// e precisam de uma linha nova em PZ_DIARIO_POOLS (js/jogo.js) valendo a partir de amanhã.

const PZ_TEMAS = [
  { id: "corpo", nome: ["Corpo humano", "Human body", "Cuerpo humano"] },
  { id: "animais", nome: ["Animais", "Animals", "Animales"] },
  { id: "espaco", nome: ["Espaço", "Space", "Espacio"] },
  { id: "ciencia", nome: ["Ciência", "Science", "Ciencia"] },
  { id: "mundo", nome: ["Mundo", "World", "Mundo"] },
  { id: "brasil", nome: ["Brasil", "Brazil", "Brasil"] },
  { id: "historia", nome: ["História", "History", "Historia"] },
  { id: "futebol", nome: ["Futebol", "Soccer", "Fútbol"] },
  { id: "esporte", nome: ["Esportes", "Sports", "Deportes"] },
  { id: "cinema", nome: ["Filmes e séries", "Movies and TV", "Películas y series"] },
  { id: "musica", nome: ["Música", "Music", "Música"] },
  { id: "jogos", nome: ["Games e jogos", "Games", "Juegos"] },
  { id: "comida", nome: ["Comida", "Food", "Comida"] },
  { id: "numeros", nome: ["Números e medidas", "Numbers and units", "Números y medidas"] },
  { id: "tecnologia", nome: ["Tecnologia", "Technology", "Tecnología"] },
  { id: "biblia", nome: ["Bíblia", "Bible", "Biblia"] },
  { id: "curiosidades", nome: ["Curiosidades", "Fun facts", "Curiosidades"] },
  { id: "transporte", nome: ["Carros e transportes", "Cars and transport", "Autos y transporte"] },
  { id: "natureza", nome: ["Natureza e planeta", "Nature and Earth", "Naturaleza y planeta"] },
  { id: "arte", nome: ["Arte e livros", "Art and books", "Arte y libros"] },
  { id: "desenhos", nome: ["Desenhos e animes", "Cartoons and anime", "Dibujos animados y anime"] },
  { id: "palavras", nome: ["Palavras e idiomas", "Words and languages", "Palabras e idiomas"] },
  { id: "dinheiro", nome: ["Dinheiro e trabalho", "Money and work", "Dinero y trabajo"] },
];

const PZ_CARTAS = [];

function pzCartas(tema, lista) {
  let n = PZ_CARTAS.filter((c) => c.tema === tema).length;
  for (const [patos, resposta, pt, en, es, tipo] of lista) {
    n += 1;
    PZ_CARTAS.push({ id: `${tema}-${n}`, tema, patos, resposta, q: [pt, en, es], ano: tipo === "ano" });
  }
}
