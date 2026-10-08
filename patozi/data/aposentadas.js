// Cartas óbvias demais (quantas patas tem a aranha, 27 estrelas na bandeira, 20 times na Série A, 1500…):
// muita gente crava a resposta, e no Patozi a graça é ninguém saber direito. Elas continuam nos arquivos para os
// ids das outras não mudarem (partidas em andamento e o Pato do dia de dias passados), mas saem do sorteio das
// partidas e do Pato do dia a partir do dia 2 (9/10/2026). Carta nova precisa ser difícil: recorde, peso, altura,
// distância, quantidade que ninguém imagina.

const PZ_APOSENTADAS = new Set(Object.entries({
  corpo: [1, 2, 3, 4, 8, 9, 11, 13, 14, 18, 19, 20, 21, 22, 23],
  animais: [1, 2, 3, 4, 6, 7, 8, 9, 12, 13, 14, 15, 16, 17, 18, 19, 21, 25, 26, 27, 28],
  espaco: [1, 2, 6, 10, 13, 14, 18, 21, 22],
  ciencia: [1, 2, 3, 6, 7, 10, 11, 18, 20, 22],
  mundo: [2, 3, 5, 7, 12, 14, 15, 18, 23, 24, 25, 26],
  brasil: [1, 2, 3, 4, 7, 8, 9, 10, 11, 12, 14, 15, 18, 19, 20, 21, 24, 26, 27, 28, 29, 30, 31, 32],
  historia: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 19, 20, 24],
  futebol: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 15, 16, 17, 18, 20, 21, 22, 25, 26, 27, 28, 29, 30],
  esporte: [1, 2, 6, 7, 9, 10, 12, 14, 15, 17, 18, 21, 22, 23, 26, 27, 28, 29],
  cinema: [1, 2, 3, 4, 5, 7, 10, 11, 14, 15, 16, 18, 21, 22, 23],
  musica: [1, 2, 4, 5, 6, 9, 10, 11, 14, 18, 19, 20, 24],
  jogos: [2, 3, 8, 9, 10, 11, 13, 20, 21, 23, 24, 25, 26, 28],
  comida: [1, 2, 5, 6, 9, 10, 12, 13, 14, 16],
  numeros: [1, 2, 4, 5, 6, 8, 9, 10, 12, 13, 14, 15, 16, 17, 20, 22, 23, 24, 26, 27, 28],
  tecnologia: [1, 12, 13, 14, 15, 16, 18, 20, 23],
  biblia: [3, 4, 5, 6, 7, 9, 11, 12, 15, 16, 17, 18, 19, 21, 22, 25, 26],
  curiosidades: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21],
}).flatMap(([tema, ns]) => ns.map((n) => `${tema}-${n}`)));
