// A pergunta da rodada comum: vem logo depois do nome do item escondido, em letra grande.
//   Xícara de chá-preto
//   tem mais ou menos cafeína?
// Uma frase só por assunto (sempre a mesma), combinando com os botões. Carregado depois dos assuntos e das grandezas.

const MM_P = {
  habitantes: ["tem mais ou menos habitantes?", "has more or fewer people?", "¿tiene más o menos habitantes?"],
  tamanho: ["é maior ou menor?", "is bigger or smaller?", "¿es más grande o más chico?"],
  altura: ["mede mais ou menos de altura?", "is taller or shorter?", "¿mide más o menos de altura?"],
  comprimento: ["mede mais ou menos de comprimento?", "is longer or shorter?", "¿mide más o menos de largo?"],
  velocidade: ["vai mais rápido ou mais devagar?", "goes faster or slower?", "¿va más rápido o más despacio?"],
  peso: ["pesa mais ou menos?", "weighs more or less?", "¿pesa más o menos?"],
};

function mmCurtas(mapa) {
  for (const [id, curta] of Object.entries(mapa)) {
    const assunto = mmAssunto(id);
    if (assunto) assunto.curta = curta;
  }
}

mmCurtas({
  "paises-pop": MM_P.habitantes,
  "estados-pop": MM_P.habitantes,
  "cidades-pop": MM_P.habitantes,
  "paises-area": MM_P.tamanho,
  "estados-area": MM_P.tamanho,
  montanhas: MM_P.altura,
  construcoes: MM_P.altura,
  rios: MM_P.comprimento,
  altitude: ["fica mais alto ou mais baixo?", "sits higher or lower?", "¿está más alto o más bajo?"],
  "planetas-tamanho": MM_P.tamanho,
  "planetas-distancia": ["fica mais longe ou mais perto do Sol?", "is farther from or closer to the Sun?", "¿está más lejos o más cerca del Sol?"],
  "animais-velocidade": MM_P.velocidade,
  "animais-peso": MM_P.peso,
  "animais-vida": ["vive mais ou menos anos?", "lives more or fewer years?", "¿vive más o menos años?"],
  "animais-gestacao": ["tem gravidez mais longa ou mais curta?", "has a longer or shorter pregnancy?", "¿tiene una gestación más larga o más corta?"],
  "animais-coracao": ["tem mais ou menos batidas por minuto?", "has more or fewer heartbeats per minute?", "¿tiene más o menos latidos por minuto?"],
  metais: ["derrete mais quente ou mais frio?", "melts hotter or colder?", "¿se derrite más caliente o más frío?"],
  "filmes-duracao": ["dura mais ou menos?", "runs longer or shorter?", "¿dura más o menos?"],
  "filmes-bilheteria": ["faturou mais ou menos?", "made more or less money?", "¿recaudó más o menos?"],
  "series-episodios": ["tem mais ou menos episódios?", "has more or fewer episodes?", "¿tiene más o menos episodios?"],
  calorias: ["tem mais ou menos calorias?", "has more or fewer calories?", "¿tiene más o menos calorías?"],
  "atletas-altura": MM_P.altura,
  veiculos: MM_P.velocidade,
  ilhas: MM_P.tamanho,
  desertos: MM_P.tamanho,
  lagos: MM_P.tamanho,
  corpo: ["tem mais ou menos no corpo?", "are there more or fewer in the body?", "¿hay más o menos en el cuerpo?"],
  municipios: ["tem mais ou menos municípios?", "has more or fewer municipalities?", "¿tiene más o menos municipios?"],
  musicas: ["é mais longa ou mais curta?", "is longer or shorter?", "¿es más larga o más corta?"],
  cafeina: ["tem mais ou menos cafeína?", "has more or less caffeine?", "¿tiene más o menos cafeína?"],
  "g-altura": MM_P.altura,
  "g-area": MM_P.tamanho,
  "g-gente": MM_P.habitantes,
  "g-velocidade": MM_P.velocidade,
  "objetos-peso": MM_P.peso,
  "g-peso": MM_P.peso,
  "distancias-sp": ["fica mais longe ou mais perto de São Paulo?", "is farther from or closer to São Paulo?", "¿está más lejos o más cerca de São Paulo?"],
  idade: ["tem mais ou menos anos?", "is older or newer?", "¿tiene más o menos años?"],
  "animais-tamanho": MM_P.comprimento,
  "filmes-orcamento": ["custou mais ou menos para fazer?", "cost more or less to make?", "¿costó más o menos hacerla?"],
  "coisas-altura": MM_P.altura,
});

// Fora do sorteio (a partir do desafio do dia 2): assuntos sem graça ou que misturam mal. Ficam no arquivo para
// os ids não mudarem e o desafio do dia 1 continuar igual.
for (const id of ["corpo", "municipios", "cafeina", "metais", "animais-coracao", "animais-gestacao", "animais-vida", "musicas",
  "altitude", "planetas-distancia", "series-episodios", "estados-area", "ilhas", "lagos", "desertos"]) mmTemaDe(id).fora = true;

// Botões que combinam com a pergunta e servem para qualquer nome (a Rebeca, o Burj Khalifa): "Mais" e "Menos".
const MM_B_MAIS_MENOS = [["Mais", "More", "Más"], ["Menos", "Less", "Menos"]];
const MM_B_VELOCIDADE = [["Mais rápido", "Faster", "Más rápido"], ["Mais devagar", "Slower", "Más despacio"]];
for (const id of ["g-altura", "montanhas", "construcoes", "atletas-altura", "coisas-altura", "rios", "filmes-duracao", "animais-tamanho",
  "g-peso", "animais-peso", "objetos-peso", "idade"]) mmAssunto(id).botoes = MM_B_MAIS_MENOS;
for (const id of ["g-velocidade", "animais-velocidade", "veiculos"]) mmAssunto(id).botoes = MM_B_VELOCIDADE;
mmTemaDe("idade").botoes = [["Mais", "Older", "Más"], ["Menos", "Newer", "Menos"]];
mmTemaDe("musicas").botoes = [["Mais longa", "Longer", "Más larga"], ["Mais curta", "Shorter", "Más corta"]];
