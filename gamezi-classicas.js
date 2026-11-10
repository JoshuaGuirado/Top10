// Músicas clássicas da aba "Clássicas" da música de fundo (gamezi-musica.js). Só obras em DOMÍNIO PÚBLICO: compositor
// morto há mais de 70 anos (no Brasil, contados de 1º de janeiro do ano seguinte) ou melodia tradicional. Tocadas no
// piano (pianoReal), escritas a partir da melodia original, com acompanhamento simples feito a partir dos acordes.
//
// Formato de cada música:
//  - vozes: lista de vozes (a 1ª é a melodia). Cada voz é "nota/duração" separados por espaço, compassos separados
//    por "|". Nota: C4 = dó central, com # ou b ("F#5", "Bb3"); notas juntas com "+" ("C4+E4/4"); pausa "-/2".
//    A duração é em "unidades": por padrão 4 por tempo (semicolcheia = 1, colcheia = 2, semínima = 4).
//  - compasso: unidades por compasso (4/4 = 16, 3/4 = 12, 2/4 = 8, 3/8 = 6, 9/8 = 18); unidade: unidades por tempo.
//  - acordes (opcional): um por compasso, ou vários separados por espaço (dividem o compasso); "-" = sem acorde.
//    No estilo "preludio", cada compasso traz as 5 notas do arpejo.
//  - estilo: jeito do acompanhamento (veja gerarAcomp em gamezi-musica.js). anacruse: notas antes do 1º compasso.
//  - oitava: sobe/desce a melodia (semitons). vezes: quantas vezes toca. acelera: cada vez um pouco mais rápido.
// O teste (tests/musica.test.js) confere que todo compasso de toda voz tem o tamanho certo e que as notas existem.
// Música nova: no fim da lista, nos 3 idiomas, conferida nota a nota com a partitura original (nunca um arranjo moderno).

window.GZ_CLASSICAS = [
  {
    id: "fur-elise", autor: "Beethoven", nome: { pt: "Para Elisa", en: "Für Elise", es: "Para Elisa" },
    bpm: 70, compasso: 6, estilo: "elise", vezes: 1, anacruse: "E5/1 D#5/1",
    vozes: [
      "E5/1 D#5/1 E5/1 B4/1 D5/1 C5/1 | A4/2 -/1 C4/1 E4/1 A4/1 | B4/2 -/1 E4/1 G#4/1 B4/1 | C5/2 -/1 E4/1 E5/1 D#5/1 |" +
      "E5/1 D#5/1 E5/1 B4/1 D5/1 C5/1 | A4/2 -/1 C4/1 E4/1 A4/1 | B4/2 -/1 E4/1 C5/1 B4/1 | A4/2 -/2 E5/1 D#5/1 |" +
      "E5/1 D#5/1 E5/1 B4/1 D5/1 C5/1 | A4/2 -/1 C4/1 E4/1 A4/1 | B4/2 -/1 E4/1 G#4/1 B4/1 | C5/2 -/1 E4/1 E5/1 D#5/1 |" +
      "E5/1 D#5/1 E5/1 B4/1 D5/1 C5/1 | A4/2 -/1 C4/1 E4/1 A4/1 | B4/2 -/1 E4/1 C5/1 B4/1 | A4/2 -/1 B4/1 C5/1 D5/1 |" +
      "E5/3 G4/1 F5/1 E5/1 | D5/3 F4/1 E5/1 D5/1 | C5/3 E4/1 D5/1 C5/1 | B4/2 -/1 E4/1 E5/1 D#5/1 |" +
      "E5/1 D#5/1 E5/1 B4/1 D5/1 C5/1 | A4/2 -/1 C4/1 E4/1 A4/1 | B4/2 -/1 E4/1 C5/1 B4/1 | A4/6",
    ],
    acordes: "- | Am | E | Am | - | Am | E | Am | - | Am | E | Am | - | Am | E | Am | C | G | Am | E | - | Am | E | Am",
  },
  {
    id: "ode-alegria", autor: "Beethoven", nome: { pt: "Ode à Alegria", en: "Ode to Joy", es: "Himno de la alegría" },
    bpm: 100, compasso: 16, estilo: "alberti", vezes: 2,
    vozes: [
      "F#5/4 F#5/4 G5/4 A5/4 | A5/4 G5/4 F#5/4 E5/4 | D5/4 D5/4 E5/4 F#5/4 | F#5/6 E5/2 E5/8 |" +
      "F#5/4 F#5/4 G5/4 A5/4 | A5/4 G5/4 F#5/4 E5/4 | D5/4 D5/4 E5/4 F#5/4 | E5/6 D5/2 D5/8 |" +
      "E5/4 E5/4 F#5/4 D5/4 | E5/4 F#5/2 G5/2 F#5/4 D5/4 | E5/4 F#5/2 G5/2 F#5/4 E5/4 | D5/4 E5/4 A4/8 |" +
      "F#5/4 F#5/4 G5/4 A5/4 | A5/4 G5/4 F#5/4 E5/4 | D5/4 D5/4 E5/4 F#5/4 | E5/6 D5/2 D5/8",
    ],
    acordes: "D | A | D | A | D | A | D | A D | A D | A D | A | D A | D | A | D | A D",
  },
  {
    id: "minueto-sol", autor: "Bach (Petzold)", nome: { pt: "Minueto em Sol", en: "Minuet in G", es: "Minueto en sol" },
    bpm: 112, compasso: 12, estilo: "valsa", vezes: 2,
    vozes: [
      "D5/4 G4/2 A4/2 B4/2 C5/2 | D5/4 G4/4 G4/4 | E5/4 C5/2 D5/2 E5/2 F#5/2 | G5/4 G4/4 G4/4 |" +
      "C5/4 D5/2 C5/2 B4/2 A4/2 | B4/4 C5/2 B4/2 A4/2 G4/2 | F#4/4 G4/2 A4/2 B4/2 G4/2 | A4/12 |" +
      "D5/4 G4/2 A4/2 B4/2 C5/2 | D5/4 G4/4 G4/4 | E5/4 C5/2 D5/2 E5/2 F#5/2 | G5/4 G4/4 G4/4 |" +
      "C5/4 D5/2 C5/2 B4/2 A4/2 | B4/4 C5/2 B4/2 A4/2 G4/2 | A4/4 B4/2 A4/2 G4/2 F#4/2 | G4/12",
    ],
    acordes: "G | G | C | G | C | G | D | D | G | G | C | G | C | G | D | G",
  },
  {
    id: "preludio-do", autor: "Bach", nome: { pt: "Prelúdio em Dó", en: "Prelude in C", es: "Preludio en do" },
    bpm: 66, compasso: 16, estilo: "preludio", vezes: 1,
    vozes: [],
    acordes:
      "C4 E4 G4 C5 E5 | C4 D4 A4 D5 F5 | B3 D4 G4 D5 F5 | C4 E4 G4 C5 E5 | C4 E4 A4 E5 A5 | C4 D4 F#4 A4 D5 |" +
      "B3 D4 G4 D5 G5 | B3 C4 E4 G4 C5 | A3 C4 E4 G4 C5 | D3 A3 D4 F#4 C5 | G3 B3 D4 G4 B4 | G3 Bb3 E4 G4 C#5 |" +
      "F3 A3 D4 A4 D5 | F3 Ab3 D4 F4 B4 | E3 G3 C4 G4 C5 | E3 F3 A3 C4 F4 | D3 F3 A3 C4 F4 | G2 D3 G3 B3 F4 |" +
      "C3 E3 G3 C4 E4",
  },
  {
    id: "serenata", autor: "Mozart", nome: { pt: "Pequena Serenata Noturna", en: "Eine kleine Nachtmusik", es: "Pequeña serenata nocturna" },
    bpm: 128, compasso: 16, estilo: "alberti", vezes: 3,
    vozes: [
      "G5/4 -/2 D5/2 G5/4 -/2 D5/2 | G5/2 D5/2 G5/2 B5/2 D6/8 | C6/4 -/2 A5/2 C6/4 -/2 A5/2 | C6/2 A5/2 F#5/2 A5/2 D5/8 |" +
      "G5/4 D5/4 G4/8",
    ],
    acordes: "G | G | D7 | D7 | G",
  },
  {
    id: "marcha-turca", autor: "Mozart", nome: { pt: "Marcha Turca", en: "Turkish March", es: "Marcha turca" },
    bpm: 116, compasso: 8, estilo: "marcha", vezes: 3, anacruse: "B4/1 A4/1 G#4/1 A4/1",
    vozes: [
      "C5/2 -/2 D5/1 C5/1 B4/1 C5/1 | E5/2 -/2 F5/1 E5/1 D#5/1 E5/1 | B5/1 A5/1 G#5/1 A5/1 B5/1 A5/1 G#5/1 A5/1 |" +
      "C6/4 A5/2 C6/2 | B5/2 A5/2 G#5/2 A5/2 | E5/4 B4/1 A4/1 G#4/1 A4/1",
    ],
    acordes: "Am | Am | E Am | Am | E | Am E",
  },
  {
    id: "canone", autor: "Pachelbel", nome: { pt: "Cânone em Ré", en: "Canon in D", es: "Canon en re" },
    bpm: 60, compasso: 16, estilo: "canon", vezes: 2,
    vozes: [
      "F#5/8 E5/8 | D5/8 C#5/8 | B4/8 A4/8 | B4/8 C#5/8 |" +
      "D5/8 C#5/8 | B4/8 A4/8 | G4/8 F#4/8 | G4/8 E4/8 |" +
      "D5/2 F#5/2 A5/2 G5/2 F#5/2 D5/2 F#5/2 E5/2 | D5/2 B4/2 D5/2 A5/2 G5/2 B5/2 A5/2 G5/2 |" +
      "F#5/2 D5/2 E5/2 C#6/2 D6/2 F#6/2 A6/2 A5/2 | B5/2 G5/2 A5/2 F#5/2 D5/2 D6/2 C#6/4",
    ],
    acordes: "D A | Bm F#m | G D | G A | D A | Bm F#m | G D | G A | D A | Bm F#m | G D | G A",
  },
  {
    id: "gymnopedie", autor: "Satie", nome: { pt: "Gymnopédie nº 1", en: "Gymnopédie No. 1", es: "Gymnopédie n.º 1" },
    bpm: 72, compasso: 12, estilo: "gymno", vezes: 3,
    vozes: [
      "-/12 | -/12 | -/12 | -/12 | -/4 F#5/4 A5/4 | G5/4 F#5/4 C#5/4 | B4/4 C#5/4 D5/4 | A4/12 | F#4/12 | -/12",
    ],
    acordes: "Gmaj7 | Dmaj7 | Gmaj7 | Dmaj7 | Gmaj7 | Dmaj7 | Gmaj7 | Dmaj7 | Gmaj7 | Dmaj7",
  },
  {
    id: "entertainer", autor: "Scott Joplin", nome: { pt: "The Entertainer", en: "The Entertainer", es: "The Entertainer" },
    bpm: 80, compasso: 8, estilo: "rag", vezes: 2, anacruse: "D5/1 D#5/1",
    vozes: [
      "E5/1 C6/2 E5/1 C6/2 E5/1 C6/1 | C6/4 C6/1 D6/1 D#6/1 E6/1 | C6/1 D6/1 E6/2 B5/1 D6/2 C6/1 | C6/6 D5/1 D#5/1 |" +
      "E5/1 C6/2 E5/1 C6/2 E5/1 C6/1 | C6/4 A5/1 G5/1 F#5/1 A5/1 | C6/1 E6/2 D6/1 C6/1 A5/1 D6/2 | D6/6 D5/1 D#5/1",
    ],
    acordes: "C | C | G7 | C | C | C A7 | D7 | G7",
  },
  {
    id: "rei-montanha", autor: "Grieg", nome: { pt: "Na Gruta do Rei da Montanha", en: "In the Hall of the Mountain King", es: "En la gruta del rey de la montaña" },
    bpm: 96, compasso: 16, estilo: "marcha", vezes: 5, acelera: true,
    vozes: [
      "B4/2 C#5/2 D5/2 E5/2 F#5/2 D5/2 F#5/4 | F5/2 C#5/2 F5/4 E5/2 C5/2 E5/4 |" +
      "B4/2 C#5/2 D5/2 E5/2 F#5/2 D5/2 F#5/2 B5/2 | A5/2 F#5/2 D5/2 F#5/2 A5/8",
    ],
    acordes: "Bm | C#7 C | Bm | F# Bm",
  },
  {
    id: "lago-cisnes", autor: "Tchaikovsky", nome: { pt: "O Lago dos Cisnes", en: "Swan Lake", es: "El lago de los cisnes" },
    bpm: 72, compasso: 16, estilo: "arpejo", vezes: 3,
    vozes: [
      "F#5/8 B4/2 C#5/2 D5/2 E5/2 | F#5/6 D5/2 F#5/6 D5/2 | F#5/6 B4/2 D5/2 B4/2 G4/2 D5/2 | B4/16",
    ],
    acordes: "Bm | Bm | Bm G | Bm",
  },
  {
    id: "primavera", autor: "Vivaldi", nome: { pt: "A Primavera", en: "Spring", es: "La primavera" },
    bpm: 100, compasso: 16, estilo: "bloco", vezes: 3, anacruse: "E5/2",
    vozes: [
      "G#5/2 G#5/2 G#5/2 F#5/1 E5/1 B5/6 B5/1 A5/1 | G#5/2 G#5/2 G#5/2 F#5/1 E5/1 B5/6 B5/1 A5/1 |" +
      "G#5/2 A5/2 B5/2 A5/2 G#5/2 F#5/2 E5/4 | E5/8 -/6 E5/2",
    ],
    acordes: "E | E | E B | E",
  },
  {
    id: "jesus-alegria", autor: "Bach", nome: { pt: "Jesus, Alegria dos Homens", en: "Jesu, Joy of Man's Desiring", es: "Jesús, alegría de los hombres" },
    bpm: 84, compasso: 18, estilo: "arpejo", vezes: 3,
    vozes: [
      "G4/2 A4/2 B4/2 D5/2 C5/2 C5/2 E5/2 D5/2 D5/2 | G5/2 F#5/2 G5/2 D5/2 B4/2 G4/2 A4/2 B4/2 C5/2 |" +
      "D5/2 E5/2 D5/2 C5/2 B4/2 A4/2 B4/2 G4/2 A4/2 | B4/2 G4/2 E4/2 D4/2 G4/2 B4/2 G4/6",
    ],
    acordes: "G C G | G G Am | G D7 G | G",
  },
  {
    id: "brahms", autor: "Brahms", nome: { pt: "Canção de Ninar", en: "Brahms' Lullaby", es: "Canción de cuna" },
    bpm: 92, compasso: 12, estilo: "valsa", vezes: 2, oitava: 12, anacruse: "E4/2 E4/2",
    vozes: [
      "G4/8 E4/2 E4/2 | G4/8 E4/2 G4/2 | C5/4 B4/6 A4/2 | A4/4 G4/4 D4/2 E4/2 | F4/4 D4/4 D4/2 E4/2 | F4/8 D4/2 F4/2 |" +
      "B4/2 A4/2 G4/4 B4/4 | C5/8 C4/2 C4/2 | C5/8 A4/2 F4/2 | G4/8 E4/2 C4/2 | F4/4 G4/4 A4/4 | G4/8 C4/2 C4/2 |" +
      "C5/8 A4/2 F4/2 | G4/8 E4/2 C4/2 | F4/4 E4/4 D4/4 | C4/8 E4/2 E4/2",
    ],
    acordes: "C | C | G7 | G7 | G7 | G7 | G7 | C | F | C | G7 | C | F | C | G7 | C",
  },
  {
    id: "greensleeves", autor: "Tradicional inglesa", nome: { pt: "Greensleeves", en: "Greensleeves", es: "Greensleeves" },
    bpm: 108, compasso: 12, estilo: "arpejo", vezes: 2, anacruse: "A4/4",
    vozes: [
      "C5/8 D5/4 | E5/6 F5/2 E5/4 | D5/8 B4/4 | G4/6 A4/2 B4/4 | C5/8 A4/4 | A4/6 G#4/2 A4/4 | B4/8 G#4/4 | E4/8 A4/4 |" +
      "C5/8 D5/4 | E5/6 F5/2 E5/4 | D5/8 B4/4 | G4/6 A4/2 B4/4 | C5/6 B4/2 A4/4 | G#4/6 F#4/2 G#4/4 | A4/8 A4/4",
    ],
    acordes: "Am | C | G | Em | Am | E | E | Am | Am | C | G | Em | Am | E | Am",
  },
  {
    id: "brilha-estrelinha", autor: "Mozart (tema tradicional)", nome: { pt: "Ah! Vous dirai-je, maman", en: "Ah! Vous dirai-je, maman", es: "Ah! Vous dirai-je, maman" },
    bpm: 100, compasso: 16, estilo: "alberti", vezes: 2, oitava: 12,
    vozes: [
      "C4/4 C4/4 G4/4 G4/4 | A4/4 A4/4 G4/8 | F4/4 F4/4 E4/4 E4/4 | D4/4 D4/4 C4/8 |" +
      "G4/4 G4/4 F4/4 F4/4 | E4/4 E4/4 D4/8 | G4/4 G4/4 F4/4 F4/4 | E4/4 E4/4 D4/8 |" +
      "C4/4 C4/4 G4/4 G4/4 | A4/4 A4/4 G4/8 | F4/4 F4/4 E4/4 E4/4 | D4/4 D4/4 C4/8",
    ],
    acordes: "C | F C | F C | G7 C | C G7 | C G7 | C G7 | C G7 | C | F C | F C | G7 C",
  },
  {
    id: "frere-jacques", autor: "Tradicional francesa", nome: { pt: "Frère Jacques (em cânone)", en: "Frère Jacques (round)", es: "Frère Jacques (canon)" },
    bpm: 96, compasso: 16, estilo: "canon", vezes: 2,
    vozes: [
      "F5/4 G5/4 A5/4 F5/4 | F5/4 G5/4 A5/4 F5/4 | A5/4 Bb5/4 C6/8 | A5/4 Bb5/4 C6/8 |" +
      "C6/2 D6/2 C6/2 Bb5/2 A5/4 F5/4 | C6/2 D6/2 C6/2 Bb5/2 A5/4 F5/4 | F5/4 C5/4 F5/8 | F5/4 C5/4 F5/8 | -/16 | -/16",
      "-/16 | -/16 | F4/4 G4/4 A4/4 F4/4 | F4/4 G4/4 A4/4 F4/4 | A4/4 Bb4/4 C5/8 | A4/4 Bb4/4 C5/8 |" +
      "C5/2 D5/2 C5/2 Bb4/2 A4/4 F4/4 | C5/2 D5/2 C5/2 Bb4/2 A4/4 F4/4 | F4/4 C4/4 F4/8 | F4/4 C4/4 F4/8",
    ],
    acordes: "F | F | F | F | F | F | F | F | F | F",
  },
  {
    id: "santos", autor: "Tradicional americana", nome: { pt: "When the Saints Go Marching In", en: "When the Saints Go Marching In", es: "When the Saints Go Marching In" },
    bpm: 120, compasso: 16, estilo: "rag", vezes: 2, oitava: 12,
    vozes: [
      "-/4 C4/4 E4/4 F4/4 | G4/16 | -/4 C4/4 E4/4 F4/4 | G4/16 | -/4 C4/4 E4/4 F4/4 | G4/8 E4/8 | C4/8 E4/8 | D4/16 |" +
      "-/4 E4/4 E4/4 D4/4 | C4/12 C4/4 | E4/8 G4/8 | G4/4 F4/12 | -/4 E4/4 F4/4 G4/4 | E4/6 C4/2 D4/8 | C4/16",
    ],
    acordes: "C | C | C | C | C | C | C | G | G | C | C C7 | F | C | C G | C",
  },
  {
    id: "cucaracha", autor: "Tradicional mexicana", nome: { pt: "La Cucaracha", en: "La Cucaracha", es: "La Cucaracha" },
    bpm: 132, compasso: 16, estilo: "rag", vezes: 3, oitava: 12,
    vozes: [
      "C4/2 C4/2 C4/2 F4/6 A4/4 | C4/2 C4/2 C4/2 F4/6 A4/4 | F4/2 F4/2 E4/2 E4/2 D4/2 D4/2 C4/4 |" +
      "C4/2 C4/2 C4/2 E4/6 G4/4 | C4/2 C4/2 C4/2 E4/6 G4/4 | C5/2 D5/2 C5/2 Bb4/2 A4/2 G4/2 F4/4",
    ],
    acordes: "F | F | C7 | C7 | C7 | C7 F",
  },
  {
    id: "susanna", autor: "Stephen Foster", nome: { pt: "Oh! Susanna", en: "Oh! Susanna", es: "Oh! Susanna" },
    bpm: 120, compasso: 16, estilo: "rag", vezes: 2, oitava: 12, anacruse: "C4/2 D4/2",
    vozes: [
      "E4/4 G4/4 G4/6 A4/2 | G4/4 E4/4 C4/6 D4/2 | E4/4 E4/4 D4/4 C4/4 | D4/12 C4/2 D4/2 |" +
      "E4/4 G4/4 G4/6 A4/2 | G4/4 E4/4 C4/6 D4/2 | E4/4 E4/4 D4/4 D4/4 | C4/12 C4/2 D4/2 |" +
      "F4/8 F4/8 | A4/4 A4/8 A4/4 | G4/4 G4/4 E4/4 C4/4 | D4/12 C4/2 D4/2 |" +
      "E4/4 G4/4 G4/6 A4/2 | G4/4 E4/4 C4/6 D4/2 | E4/4 E4/4 D4/4 D4/4 | C4/12 C4/2 D4/2",
    ],
    acordes: "C | C | C | G7 | C | C | C G7 | C | F | F | C | G7 | C | C | C G7 | C",
  },
  {
    id: "amazing-grace", autor: "Tradicional (hino)", nome: { pt: "Amazing Grace", en: "Amazing Grace", es: "Sublime gracia" },
    bpm: 84, compasso: 12, estilo: "valsa", vezes: 2, oitava: 12, anacruse: "D4/4",
    vozes: [
      "G4/8 B4/2 G4/2 | B4/8 A4/4 | G4/8 E4/4 | D4/8 D4/4 | G4/8 B4/2 G4/2 | B4/8 A4/2 B4/2 | D5/12 | D5/8 B4/4 |" +
      "D5/8 B4/2 G4/2 | B4/8 A4/4 | G4/8 E4/4 | D4/8 D4/4 | G4/8 B4/2 G4/2 | B4/8 A4/4 | G4/12 | G4/8 D4/4",
    ],
    acordes: "G | G | C | G | G | D | D | D | G | G | C | G | G | D | G | G",
  },
  {
    id: "marcha-nupcial", autor: "Wagner", nome: { pt: "Marcha Nupcial", en: "Bridal Chorus", es: "Marcha nupcial" },
    bpm: 72, compasso: 16, estilo: "bloco", vezes: 2, oitava: 12, anacruse: "F4/4",
    vozes: [
      "Bb4/3 Bb4/1 Bb4/8 F4/4 | C5/3 A4/1 Bb4/8 F4/4 | Bb4/4 Eb5/3 Eb5/1 D5/4 C5/4 | Bb4/3 A4/1 Bb4/4 C5/8 | Bb4/12 F4/4",
    ],
    acordes: "Bb | F7 Bb | Eb Bb | F7 | Bb",
  },
  {
    id: "cancan", autor: "Offenbach", nome: { pt: "Cancã (Galope Infernal)", en: "Can-can (Infernal Galop)", es: "Cancán (Galop infernal)" },
    bpm: 144, compasso: 8, estilo: "marcha", vezes: 3, oitava: 12,
    vozes: [
      "D4/4 D4/2 E4/1 G4/1 | F#4/2 E4/2 A4/4 | A4/4 A4/2 B4/1 F#4/1 | G4/2 E4/2 E4/4 |" +
      "E4/4 E4/2 G4/1 F#4/1 | E4/2 D4/2 D5/2 C#5/2 | B4/2 A4/2 G4/2 F#4/2 | E4/2 F#4/1 E4/1 D4/4",
    ],
    acordes: "D | A7 | A7 | D | A7 | A7 D | G D | A7 D",
  },
  {
    id: "toccata", autor: "Bach", nome: { pt: "Tocata e Fuga em Ré menor (início)", en: "Toccata and Fugue in D minor (opening)", es: "Tocata y fuga en re menor (inicio)" },
    bpm: 60, compasso: 16, estilo: "nenhum", vezes: 1,
    vozes: [
      "A5/1 G5/1 A5/14 | G5/1 F5/1 E5/1 D5/1 C#5/4 D5/8 | A4/1 G4/1 A4/14 | E4/4 F4/4 C#4/4 D4/4 |" +
      "A3/1 G3/1 A3/14 | G3/1 F3/1 E3/1 D3/1 C#3/4 D3/8 | C#4+E4+G4+Bb4/8 D4+F#4+A4+D5/8",
      "-/16 | -/16 | -/16 | -/16 | -/16 | -/16 | D2+D3/16",
    ],
  },
  {
    id: "sonata-luar", autor: "Beethoven", nome: { pt: "Sonata ao Luar (início)", en: "Moonlight Sonata (opening)", es: "Claro de luna (inicio)" },
    bpm: 54, compasso: 48, unidade: 12, estilo: "nenhum", vezes: 2,
    vozes: [
      "-/48 | -/48 | -/48 | -/48 | -/36 G#4/9 G#4/3 | G#4/48",
      "G#3/4 C#4/4 E4/4 G#3/4 C#4/4 E4/4 G#3/4 C#4/4 E4/4 G#3/4 C#4/4 E4/4 |" +
      "G#3/4 C#4/4 E4/4 G#3/4 C#4/4 E4/4 G#3/4 C#4/4 E4/4 G#3/4 C#4/4 E4/4 |" +
      "A3/4 C#4/4 E4/4 A3/4 C#4/4 E4/4 A3/4 D4/4 F#4/4 A3/4 D4/4 F#4/4 |" +
      "G#3/4 B#3/4 F#4/4 G#3/4 C#4/4 E4/4 G#3/4 C#4/4 D#4/4 F#3/4 B#3/4 D#4/4 |" +
      "G#3/4 C#4/4 E4/4 G#3/4 C#4/4 E4/4 G#3/4 C#4/4 E4/4 G#3/4 C#4/4 E4/4 |" +
      "G#3/4 C#4/4 E4/4 G#3/4 C#4/4 E4/4 G#3/4 C#4/4 E4/4 G#3/4 C#4/4 E4/4",
      "C#2+C#3/48 | B1+B2/48 | A1+A2/24 F#1+F#2/24 | G#1+G#2/48 | C#2+C#3/48 | C#2+C#3/48",
    ],
  },
];
