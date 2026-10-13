// Uso: rode da raiz do projeto, com o acervo de animais baixado em uma pasta à parte:
//   git clone --depth 1 https://github.com/kazuhito84455/qgissvganimals <pasta>
//   NODE_PATH=<pasta com svg-path-bbox em node_modules> node ferramentas/gerar-tamanhozi.js tamanhozi/data/itens.js <pasta>/svg
//
// Gera os itens do Tamanhozi (tudo menos os países). Dois tipos de silhueta:
//  - Animais: do acervo "QGIS svg icons - Animal silhouettes" (domínio público, Unlicense), de lado e realistas.
//  - O resto (monumentos, prédios, veículos, objetos, pessoas e monstros): desenhado aqui, com as medidas reais em
//    metros (ou centímetros), para a proporção (largura × altura) ser a de verdade.
// Em todos, a medida informada é a da caixa da silhueta: a altura ("a"), ou a largura ("c" comprimento, "l" largura,
// "d" diâmetro, "e" envergadura). Assim, desenhar dois itens com os mesmos metros por pixel mostra o tamanho real.
const fs = require("fs");
const path = require("path");
const { svgPathBbox } = require("svg-path-bbox");

// ───────────── ajudantes de desenho (pontos com y para cima; a saída é SVG, com y para baixo) ─────────────

const fmt = (v) => String(Math.round(v * 1000) / 1000);
const areaDe = (p) => p.reduce((s, [x, y], i) => { const [x2, y2] = p[(i + 1) % p.length]; return s + x * y2 - x2 * y; }, 0) / 2;

// Polígono. Contornos de fora sempre no mesmo sentido e buracos no sentido contrário (regra "nonzero"):
// assim dá para juntar peças que se sobrepõem e ainda abrir janelas.
function poly(pts, buraco = false) {
  let p = pts.map(([x, y]) => [x, -y]);
  if ((areaDe(p) < 0) !== buraco) p = p.reverse();
  return "M" + p.map(([x, y]) => fmt(x) + " " + fmt(y)).join("L") + "Z";
}
// Meia figura (do alto do centro, descendo pela direita) espelhada para a esquerda.
const espelho = (meia, buraco) => poly([...meia, ...meia.slice().reverse().map(([x, y]) => [-x, y])], buraco);
const elipse = (cx, cy, rx, ry, buraco, n = 44) => poly(Array.from({ length: n }, (_, i) => [cx + rx * Math.cos((2 * Math.PI * i) / n), cy + ry * Math.sin((2 * Math.PI * i) / n)]), buraco);
const circulo = (cx, cy, r, buraco, n) => elipse(cx, cy, r, r, buraco, n);
const ret = (x, y, w, h, buraco) => poly([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], buraco);
function arred(x, y, w, h, r, buraco) {
  const pts = [];
  const canto = (cx, cy, a0) => { for (let i = 0; i <= 6; i++) { const a = a0 + (Math.PI / 2) * (i / 6); pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); } };
  canto(x + w - r, y + r, -Math.PI / 2); canto(x + w - r, y + h - r, 0); canto(x + r, y + h - r, Math.PI / 2); canto(x + r, y + r, Math.PI);
  return poly(pts, buraco);
}
// Traço grosso de (x1, y1) a (x2, y2).
function linha(x1, y1, x2, y2, w) {
  const d = Math.hypot(x2 - x1, y2 - y1), nx = (-(y2 - y1) / d) * (w / 2), ny = ((x2 - x1) / d) * (w / 2);
  return poly([[x1 + nx, y1 + ny], [x2 + nx, y2 + ny], [x2 - nx, y2 - ny], [x1 - nx, y1 - ny]]);
}
// Arco (janela em arco, porta): retângulo com meio círculo em cima.
function arco(x, y, w, h, buraco) {
  const r = w / 2, pts = [[x, y], [x + w, y], [x + w, y + h - r]];
  for (let i = 1; i < 12; i++) { const a = (Math.PI * i) / 12; pts.push([x + r + r * Math.cos(a), y + h - r + r * Math.sin(a)]); }
  pts.push([x, y + h - r]);
  return poly(pts, buraco);
}
const girar = (pts, cx, cy, graus) => { const a = (graus * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a); return pts.map(([x, y]) => [cx + x * c - y * s, cy + x * s + y * c]); };
const cisalhar = (pts, k) => pts.map(([x, y]) => [x + k * y, y]);
const juntar = (...partes) => partes.flat().join("");

// ───────────── desenhos ─────────────
// Unidades: metros nos grandes, centímetros nos pequenos (a escala final sai da medida, então só a proporção importa).

const D = {};

// Torre Eiffel: 330 m (com a antena), base de 125 m; arco entre os pés e vão entre o 1º e o 2º andar.
D.eiffel = () => juntar(
  espelho([[0, 330], [0.7, 330], [0.7, 312], [1.6, 306], [2.2, 300], [3.2, 290], [3.5, 280], [6.5, 277], [6.5, 274], [5, 273], [7, 250], [9.5, 215], [12.5, 180], [15.5, 150], [18.5, 125], [20, 117], [24, 116], [24, 113], [21, 112], [25, 98], [30, 80], [35, 66], [38.5, 59], [46, 58], [46, 55], [42, 54], [46, 44], [51, 30], [56, 16], [62.5, 0], [48, 0], [46, 8], [41, 17], [34, 25], [24, 32], [12, 37], [0, 39]]),
  espelho([[0, 110], [12, 110], [17, 95], [22, 80], [26.5, 63], [0, 63]], true),
);
// Cristo Redentor: 30 m de estátua + 8 m de pedestal; 28 m de braço a braço.
D.cristo = () => espelho([[0, 38], [0.9, 37.8], [1.5, 37.1], [1.75, 36], [1.65, 34.8], [1.25, 34.1], [1.05, 33.4], [2.3, 32.6], [3.2, 31.5], [4.5, 31.2], [9, 30.9], [12.6, 30.6], [13.6, 30.2], [14.1, 29.4], [13.9, 28.6], [13.2, 28.3], [12.4, 28.7], [8.5, 28.9], [4.6, 28.6], [3.7, 27.6], [3.4, 24], [3.5, 18], [3.7, 13], [4.1, 9.8], [4.6, 8.6], [5.6, 8.6], [5.6, 8], [5, 7.6], [5, 0.6], [5.6, 0.4], [5.6, 0]]);
// Estátua da Liberdade: 93 m do chão à tocha (base em estrela, pedestal de 47 m e estátua de 46 m).
D.liberdade = () => poly([[-45, 0], [45, 0], [45, 8.5], [30, 11], [14, 11], [14, 13], [12.5, 14], [12, 40], [13.5, 42], [13.5, 44], [10, 46], [10, 47], [5.5, 47], [5, 52], [4.8, 60], [5.6, 66], [6.3, 66.3], [6.8, 73], [4.3, 73.8], [4, 76], [3.2, 77.5], [2.1, 78.2], [1.3, 79], [1.6, 80.6], [3.9, 82.4], [1.7, 81.8], [2.6, 84.3], [0.8, 82.6], [0.3, 85], [-0.4, 82.6], [-2.2, 84.2], [-1.6, 81.6], [-1.3, 80.6], [-1.1, 79], [-2.3, 78], [-3.3, 80], [-3.9, 86], [-3.7, 88.7], [-3, 89], [-3.4, 90.3], [-4.1, 93], [-5.1, 90.6], [-5.6, 89.2], [-4.9, 88.8], [-5.5, 86], [-5, 80], [-4.6, 76], [-5.4, 70], [-5.9, 60], [-6.4, 52], [-6.5, 47], [-10, 47], [-10, 46], [-13.5, 44], [-13.5, 42], [-12, 40], [-12.5, 14], [-14, 13], [-14, 11], [-30, 11], [-45, 8.5]]);
// Big Ben (Torre Elizabeth): 96 m, 12 m de largura, relógio entre 54 e 65 m.
D.bigben = () => juntar(
  espelho([[0, 96], [0.35, 95], [1.2, 90], [2.6, 82], [3.4, 77.5], [4.4, 77.5], [4.4, 74], [5.4, 73.5], [5.4, 66], [6.3, 65.5], [6.3, 54], [5.5, 53.5], [5.5, 4], [6, 3.5], [6, 0]]),
  circulo(0, 59.7, 3.5, true),
);
// Torre de Pisa: 56 m, 15,5 m de diâmetro, inclinada uns 4 graus.
D.pisa = () => juntar(
  poly(cisalhar([[-7.75, 0], [7.75, 0], [7.75, 50], [6.3, 50], [6.3, 55.5], [4, 56.7], [-4, 56.7], [-6.3, 55.5], [-6.3, 50], [-7.75, 50]], 0.07)),
  ...[7, 14, 21, 28, 35, 42].map((h) => poly(cisalhar([[-6.8, h], [6.8, h], [6.8, h + 4], [-6.8, h + 4]], 0.07), true)),
);
D.queops = () => poly([[-115.15, 0], [115.15, 0], [0, 138.5]]);
D.louvre = () => poly([[-17.7, 0], [17.7, 0], [0, 21.6]]);
// Arco do Triunfo: 50 m de altura, 45 m de largura, vão de 29 m.
D.arco = () => espelho([[0, 50], [22.5, 50], [22.5, 45.5], [23, 45], [23, 43], [22.5, 42.5], [22.5, 0], [7.3, 0], [7.3, 22], [6.9, 24.6], [5.7, 26.8], [4, 28.5], [2, 29.2], [0, 29.3]]);
D.washington = () => espelho([[0, 169.3], [5.25, 152.4], [8.4, 0]]);
// Burj Khalifa: 828 m, recuos a cada trecho e a ponta fina.
D.burj = () => espelho([[0, 828], [0.6, 780], [1.6, 700], [3, 640], [6, 630], [6, 600], [11, 595], [11, 560], [17, 555], [17, 500], [24, 495], [24, 430], [31, 425], [31, 340], [38, 335], [38, 240], [44, 235], [44, 140], [50, 135], [50, 0]]);
// Empire State Building: 443 m com a antena (381 m até o terraço).
D.empire = () => espelho([[0, 443], [0.6, 410], [1.5, 381], [5, 378], [6, 360], [7, 330], [12, 322], [13, 320], [13, 316], [17, 313], [17, 300], [22, 298], [22, 104], [25, 102], [25, 86], [29, 84], [29, 26], [35, 25], [35, 0]]);
// Tokyo Skytree: 634 m, base de 68 m, dois mirantes.
D.skytree = () => espelho([[0, 634], [1, 600], [2.5, 497], [7, 495], [8, 470], [12, 456], [12, 444], [9, 440], [10, 380], [16, 356], [16, 338], [11, 334], [14, 250], [20, 150], [27, 60], [34, 0]]);
// Coliseu: 189 m de comprimento e 48 m de altura; um lado desabado; três andares de arcos.
D.coliseu = () => {
  const partes = [poly([[0, 0], [189, 0], [189, 48], [112, 48], [104, 45], [97, 40], [88, 37.5], [0, 37.5]])];
  for (let x = 2.4; x + 4.2 < 187; x += 6.6) {
    partes.push(arco(x, 1.2, 4.2, 8, true), arco(x, 12.2, 4.2, 7.4, true), arco(x, 22.8, 4.2, 7.2, true));
    if (x > 114 && Math.round((x - 2.4) / 6.6) % 2 === 0) partes.push(ret(x + 1.3, 39, 1.6, 2.6, true));
  }
  return juntar(...partes);
};
// Ópera de Sydney: 183 m de comprimento, cascas de até 65 m sobre o pódio.
D.opera = () => juntar(
  poly([[0, 0], [183, 0], [183, 12], [0, 12]]),
  poly([[20, 11], [35, 30], [52, 48], [70, 61], [78, 65], [82, 52], [85, 11]]),
  poly([[60, 11], [75, 30], [95, 47], [110, 55], [113, 40], [116, 11]]),
  poly([[95, 11], [110, 28], [125, 40], [135, 45], [138, 30], [141, 11]]),
  poly([[128, 11], [143, 24], [160, 33], [162, 20], [164, 11]]),
  poly([[150, 11], [168, 22], [178, 25], [176, 11]]),
);
// London Eye: roda de 120 m com 32 cabines, 135 m de altura, apoiada de um lado.
D.londoneye = () => {
  const c = 74, partes = [circulo(0, c, 60, false, 96), circulo(0, c, 57.5, true, 96), circulo(0, c, 3.2)];
  for (let i = 0; i < 32; i++) { const a = (2 * Math.PI * i) / 32; partes.push(elipse(61 * Math.cos(a), c + 61 * Math.sin(a), 2.2, 1.6)); }
  for (let i = 0; i < 16; i++) { const a = (Math.PI * i) / 16; partes.push(linha(-58 * Math.cos(a), c - 58 * Math.sin(a), 58 * Math.cos(a), c + 58 * Math.sin(a), 0.5)); }
  partes.push(linha(0, c, -30, 0, 3), linha(0, c, -16, 0, 3), ret(-34, 0, 22, 1.2));
  return juntar(...partes);
};
// Moai Paro: 10 m, de perfil.
D.moai = () => poly([[0, 0], [0, 8.6], [0.4, 9.6], [1.3, 10], [2.6, 9.8], [3.1, 9.1], [3.5, 8.6], [3.2, 8.1], [3.3, 7.7], [3.9, 6.3], [3.6, 6], [3.7, 5.6], [3.4, 5.3], [3.55, 5], [3.2, 4.6], [3.4, 4.1], [3, 3.7], [3.1, 2], [3.3, 1], [3.2, 0]]);
// Turbina eólica: torre de 100 m e pás de 60 m (uma para cima).
D.turbina = () => {
  const pa = [[-1.2, 2], [-2.2, 10], [-1.6, 30], [-0.5, 60], [0.5, 60], [1, 30], [1.5, 10], [1.2, 2]];
  return juntar(poly([[-2.25, 0], [2.25, 0], [1.3, 98], [-1.3, 98]]), ret(-2.5, 98, 12, 4.2), circulo(0, 100, 2), ...[0, 120, 240].map((g) => poly(girar(pa, 0, 100, g))));
};
// Sequoia General Sherman: 84 m de altura, 11 m de diâmetro na base.
D.sequoia = () => poly([[0, 84], [3, 82], [6, 78], [5, 74], [9, 71], [8, 66], [12, 62], [10, 58], [14, 54], [11, 50], [13, 46], [8, 44], [3, 42], [2.8, 30], [3.3, 15], [4, 6], [5.5, 0], [-5.5, 0], [-4.2, 6], [-3.2, 15], [-2.9, 30], [-3.2, 41], [-9, 43], [-12, 47], [-10.5, 51], [-13, 55], [-10, 59], [-11.5, 63], [-8, 67], [-9, 72], [-5.5, 75], [-6, 79], [-3, 82]]);
// Coqueiro: 25 m, tronco curvo e folhas caídas.
D.coqueiro = () => {
  const tronco = [];
  for (let i = 0; i <= 10; i++) { const h = 23 * (i / 10), x = 3 * (h / 23) ** 2; tronco.push([x + 0.28 - 0.08 * (i / 10), h]); }
  const lado = tronco.map(([x, h], i) => [x - 0.56 + 0.16 * (i / 10), h]).reverse();
  const folha = [[0, 0], [1.5, 0.6], [3, 0.6], [4.5, -0.2], [6, -1.6], [4.5, -0.9], [3, -0.3], [1.5, 0], [0, -0.3]];
  return juntar(poly([...tronco, ...lado]), ...[15, 50, 85, 130, 165, 195, -15].map((g) => poly(girar(folha, 3, 23.4, g))), circulo(3, 23, 0.9));
};
D.baoba = () => espelho([[0, 25], [2, 24.5], [3.5, 25], [5, 23.5], [7, 24.5], [8.5, 22.5], [10, 23], [9.5, 21], [7, 20], [5.5, 19], [4, 17], [3.6, 10], [4.2, 3], [4.8, 0]]);
// Cacto saguaro: 12 m, tronco de 70 cm e dois braços.
D.saguaro = () => juntar(arred(-0.35, 0, 0.7, 12, 0.35), arred(0.1, 5, 1.5, 0.6, 0.3), arred(1.0, 5, 0.6, 4.4, 0.3), arred(-1.4, 6.6, 1.5, 0.55, 0.27), arred(-1.4, 6.6, 0.55, 3.6, 0.27));

// Pessoas (de frente). Altura 1; a escala sai da medida de cada um.
const PESSOA = [[0, 1], [0.045, 0.99], [0.065, 0.965], [0.07, 0.93], [0.065, 0.9], [0.05, 0.875], [0.04, 0.86], [0.042, 0.84], [0.09, 0.825], [0.125, 0.81], [0.14, 0.78], [0.145, 0.72], [0.15, 0.64], [0.158, 0.56], [0.16, 0.5], [0.155, 0.47], [0.14, 0.465], [0.132, 0.55], [0.123, 0.64], [0.112, 0.73], [0.098, 0.74], [0.09, 0.66], [0.088, 0.6], [0.1, 0.52], [0.098, 0.46], [0.09, 0.3], [0.075, 0.12], [0.072, 0.04], [0.1, 0.015], [0.11, 0], [0.03, 0], [0.03, 0.04], [0.035, 0.3], [0.02, 0.45], [0, 0.47]];
D.pessoa = () => espelho(PESSOA);
// Criança: cabeça maior em relação ao corpo.
D.crianca = () => espelho([[0, 1], [0.06, 0.99], [0.085, 0.95], [0.09, 0.9], [0.085, 0.86], [0.065, 0.83], [0.05, 0.815], [0.052, 0.8], [0.1, 0.785], [0.135, 0.77], [0.15, 0.73], [0.155, 0.66], [0.16, 0.58], [0.165, 0.52], [0.16, 0.49], [0.145, 0.485], [0.138, 0.57], [0.128, 0.65], [0.115, 0.7], [0.1, 0.71], [0.095, 0.62], [0.1, 0.5], [0.098, 0.44], [0.09, 0.28], [0.08, 0.1], [0.078, 0.04], [0.105, 0.015], [0.115, 0], [0.03, 0], [0.03, 0.04], [0.035, 0.28], [0.02, 0.42], [0, 0.44]]);
// Darth Vader: capacete e capa até o chão.
D.vader = () => espelho([[0, 1], [0.05, 0.99], [0.07, 0.96], [0.075, 0.92], [0.088, 0.872], [0.06, 0.864], [0.05, 0.85], [0.13, 0.82], [0.16, 0.78], [0.19, 0.4], [0.22, 0], [0.03, 0], [0.03, 0.04], [0.035, 0.3], [0.02, 0.45], [0, 0.47]]);
// Hagrid: grandão, cabelo e barba cheios, casaco até o joelho.
D.hagrid = () => espelho([[0, 1], [0.06, 0.99], [0.085, 0.96], [0.092, 0.92], [0.09, 0.87], [0.075, 0.83], [0.1, 0.815], [0.17, 0.79], [0.185, 0.74], [0.19, 0.64], [0.195, 0.52], [0.188, 0.48], [0.17, 0.48], [0.165, 0.6], [0.155, 0.7], [0.15, 0.6], [0.165, 0.42], [0.2, 0.25], [0.11, 0.25], [0.1, 0.12], [0.1, 0.03], [0.13, 0.01], [0.14, 0], [0.04, 0], [0.04, 0.04], [0.045, 0.24], [0, 0.25]]);
// Gundam RX-78-2: 18 m.
D.gundam = () => espelho([[0, 18], [0.25, 17.8], [0.5, 17.6], [2.2, 18.4], [0.9, 17.2], [0.9, 16.6], [0.6, 16.2], [0.7, 16], [2.6, 16], [2.8, 16.4], [4.6, 16.4], [5.1, 15.8], [5.1, 14.2], [4.6, 13.9], [4.8, 13.5], [4.9, 11.5], [5.3, 11.3], [5.4, 9.2], [5, 9], [5.1, 8.2], [4.3, 8], [4.2, 9], [4, 11.2], [3.8, 13.4], [3, 13.6], [2.6, 12.4], [2.2, 11.2], [2.6, 10.6], [2.9, 9.2], [2.4, 9], [2.6, 7.5], [2.8, 5.5], [3, 3.2], [3.4, 1], [3.6, 0], [0.7, 0], [0.8, 1], [0.6, 5], [0.4, 8.6], [0, 8.8]]);
// Godzilla (2019): 120 m de altura, de lado, com as placas nas costas.
D.godzilla = () => poly([[0, 6], [20, 14], [40, 24], [60, 34], [70, 42], [78, 55], [82, 70], [80, 74], [84, 76], [82, 80], [87, 83], [85, 87], [90, 90], [88, 94], [93, 98], [91, 102], [96, 106], [95, 108], [100, 110], [106, 118], [114, 120], [124, 118], [130, 114], [128, 110], [122, 109], [120, 106], [114, 104], [110, 98], [114, 86], [118, 84], [124, 80], [126, 76], [121, 77], [117, 80], [112, 72], [110, 60], [114, 52], [115, 40], [112, 24], [116, 8], [124, 4], [124, 0], [100, 0], [100, 6], [96, 20], [92, 36], [80, 30], [60, 20], [40, 10], [20, 4]]);
// Monstro do Lago Ness (como contam): pescoço comprido e nadadeiras, 10 m.
D.nessie = () => poly([[0, 1.2], [2, 1.7], [3.5, 2.5], [5.5, 2.8], [7.3, 2.6], [8, 3.3], [8.6, 4.2], [9.1, 4.8], [9.8, 4.9], [10, 4.6], [9.4, 4.3], [8.9, 3.6], [8.4, 2.4], [8, 1.4], [8.6, 0.5], [7.9, 0.2], [7.3, 1], [5.2, 0.7], [3.4, 0], [2.9, 0.1], [2.9, 0.8], [1.6, 0.9]]);

// Veículos (de lado, virados para a direita, rodas no chão).
const roda = (x, r) => circulo(x, r, r);
D.fusca = () => juntar(
  poly([[0.05, 0.35], [0, 0.55], [0.15, 0.75], [0.45, 1], [0.95, 1.3], [1.5, 1.48], [2.4, 1.5], [2.9, 1.32], [3.15, 1], [3.7, 0.88], [4, 0.7], [4.08, 0.5], [4.02, 0.3], [3.55, 0.3], [3.5, 0.55], [3.3, 0.72], [3, 0.72], [2.8, 0.55], [2.72, 0.3], [1.18, 0.3], [1.1, 0.55], [0.9, 0.72], [0.6, 0.72], [0.4, 0.55], [0.33, 0.3]]),
  roda(0.75, 0.32), roda(3.15, 0.32),
  poly([[1.05, 1.07], [1.55, 1.36], [2.35, 1.38], [2.75, 1.12], [2.7, 1.05]], true),
);
D.onibus = () => {
  const p = [arred(0, 0.35, 12, 2.85, 0.3), roda(2.6, 0.5), roda(9.3, 0.5), ret(10.9, 1.2, 0.95, 1.75, true)];
  for (let x = 0.5; x < 10.2; x += 1.45) p.push(ret(x, 1.75, 1.25, 1.05, true));
  p.push(ret(4.35, 0.6, 1.1, 1.0, true));
  return juntar(...p);
};
D.doisandares = () => {
  const p = [arred(0, 0.3, 11.2, 4.1, 0.5), roda(2.4, 0.5), roda(8.7, 0.5)];
  for (let x = 0.5; x < 10.2; x += 1.6) p.push(ret(x, 3.1, 1.35, 0.9, true));
  for (let x = 2.2; x < 10.2; x += 1.6) p.push(ret(x, 1.65, 1.35, 0.85, true));
  p.push(ret(10.2, 1.5, 0.8, 2.3, true), ret(0.5, 0.8, 1.2, 1.7, true));
  return juntar(...p);
};
D.carreta = () => juntar(
  ret(0, 1.25, 14.2, 2.75), ret(0.6, 0.85, 13.5, 0.4),
  poly([[15, 0.8], [18.5, 0.8], [18.5, 2.2], [18.1, 3], [17.4, 3.35], [15, 3.35]]), ret(14.1, 0.85, 1.2, 0.5),
  poly([[17.5, 2.2], [18.25, 2.2], [17.95, 2.95], [17.5, 3.05]], true),
  ...[1.6, 2.7, 3.8, 13.0, 14.2, 17.3].map((x) => roda(x, 0.5)),
);
D.bicicleta = () => juntar(
  circulo(0.35, 0.34, 0.34, false, 60), circulo(0.35, 0.34, 0.3, true, 60), circulo(1.4, 0.34, 0.34, false, 60), circulo(1.4, 0.34, 0.3, true, 60),
  circulo(0.35, 0.34, 0.04), circulo(1.4, 0.34, 0.04), circulo(0.78, 0.3, 0.07),
  linha(0.35, 0.34, 0.78, 0.3, 0.03), linha(0.35, 0.34, 0.66, 0.84, 0.03), linha(0.78, 0.3, 0.64, 0.84, 0.035), linha(0.64, 0.8, 1.22, 0.8, 0.035),
  linha(0.78, 0.3, 1.23, 0.76, 0.04), linha(1.4, 0.34, 1.24, 0.86, 0.035), linha(1.24, 0.86, 1.2, 1.0, 0.03), linha(1.12, 1.0, 1.32, 1.02, 0.03),
  linha(0.64, 0.84, 0.62, 0.92, 0.03), poly([[0.5, 0.93], [0.78, 0.95], [0.77, 0.9], [0.52, 0.89]]),
);
D.boeing747 = () => juntar(
  poly([[0, 9.4], [6, 10.2], [6.5, 10.2], [2.5, 19.4], [6.8, 19.4], [14, 10], [45, 9.9], [50, 12], [56, 12.5], [61, 12], [66, 10.5], [68.5, 9], [70.2, 7.2], [70.7, 6.3], [70.2, 5], [68.5, 3.9], [64, 3.4], [30, 3.4], [15, 4.6], [6, 7]]),
  elipse(6, 10.1, 6, 0.55), elipse(38.5, 3.2, 3, 1.3), elipse(29, 4.2, 2.6, 1.15), linha(38.5, 3.4, 40, 5, 0.8), linha(29, 4.6, 30.5, 6, 0.7),
  linha(63.5, 3.5, 63.5, 0.9, 0.4), roda(63.5, 0.6), linha(40, 3.5, 40, 1, 0.6), roda(39.4, 0.62), roda(40.8, 0.62),
);
D.titanic = () => juntar(
  poly([[12, 0], [263, 0], [266, 8], [268, 15], [269, 20], [0.5, 20], [0, 15], [2, 9], [6, 3]]),
  ret(38, 20, 194, 4.5), ret(55, 24.5, 140, 2.5), ret(200, 24.5, 22, 4),
  ...[108, 135, 162, 189].map((x) => poly(cisalhar([[x - 3.6, 26], [x + 3.6, 26], [x + 3.6, 53], [x - 3.6, 53]].map(([a, b]) => [a - 26 * 0.12, b]), 0.12))),
  linha(224, 20, 223, 62, 0.8), linha(42, 20, 41, 58, 0.8),
);
D.evergiven = () => {
  const p = [poly([[0, 8], [4, 2], [12, 0], [385, 0], [395, 8], [400, 22], [399.5, 30], [0, 30]])];
  for (let x = 18; x < 378; x += 13.5) if (x < 262 || x > 290) p.push(ret(x, 30, 12.9, x < 40 || x > 360 ? 16 : 22));
  p.push(ret(266, 30, 22, 30), ret(271, 60, 12, 2.5), ret(44, 30, 9, 28));
  return juntar(...p);
};
D.saturnov = () => espelho([[0, 110.6], [0.25, 108], [0.4, 105.5], [1.95, 103], [1.95, 99.5], [3.3, 92.5], [3.3, 74], [5.05, 68], [5.05, 8], [5.6, 6], [9.2, 2.5], [9.2, 0.5], [6, 1.5], [5.3, 0], [0, 0]]);
D.onibusespacial = () => juntar(
  poly([[0, 4.2], [0, 8.5], [2, 9], [3, 9.2], [1.5, 17.3], [5.5, 17.3], [12, 9.5], [27, 9.3], [31, 8.8], [33.5, 8.2], [35.8, 6.5], [37.2, 5], [36.8, 4], [34, 3.4], [22, 3.2], [8, 3.4], [2, 3.6]]),
  poly([[-1.6, 3.6], [0.2, 4.6], [0.2, 6], [-1.6, 7]]), poly([[-1.4, 7], [0.2, 7.2], [0.2, 8.4], [-1.4, 8.8]]),
  linha(30, 3.4, 30, 0.6, 0.35), roda(30, 0.55), linha(14, 3.3, 14, 0.6, 0.45), roda(14, 0.6),
);
D.typhoon = () => juntar(
  poly([[0, 6], [8, 9.5], [30, 12.6], [150, 13], [168, 11.5], [175, 7], [173, 2.5], [160, 0.3], [30, 0.2], [10, 2.5]]),
  poly([[96, 12.5], [99, 23.5], [118, 24], [124, 12.5]]), poly([[2, 7], [-1, 14], [5, 14], [10, 9]]), poly([[2, 5], [-1, 0], [5, 0], [10, 3]]),
);
D.hindenburg = () => {
  const cima = [], baixo = [];
  for (let i = 0; i <= 40; i++) {
    const x = (245 * i) / 40, u = x < 140 ? (x - 140) / 140 : (x - 140) / 105;
    const r = 20.6 * Math.pow(Math.max(0, 1 - u * u), 0.55);
    cima.push([x, 20.6 + r]);
    baixo.push([x, 20.6 - r]);
  }
  return juntar(poly([...cima, ...baixo.reverse()]), poly([[4, 26], [-2, 38], [10, 38], [30, 30]]), poly([[4, 15], [-2, 3], [10, 3], [30, 11]]), arred(186, -1.5, 24, 4, 1.5));
};
D.blackhawk = () => juntar(
  poly([[0, 3.6], [1, 4.1], [3.5, 3.4], [9.5, 3.6], [11, 4.4], [15.5, 4.3], [17.5, 3.6], [18.7, 2.6], [18.6, 1.8], [17, 1.3], [11, 1.2], [9, 2.2], [3, 2.9], [0.6, 3.1]]),
  poly([[0.3, 3.5], [-0.5, 5.6], [0.6, 5.6], [1.6, 3.8]]), circulo(0.4, 4.5, 1.4), circulo(0.4, 4.5, 1.25, true),
  ret(3.3, 5.0, 16.4, 0.18), ret(11.2, 4.4, 0.5, 0.65), linha(12, 1.2, 12, 0.3, 0.15), roda(12, 0.3), linha(17.5, 1.4, 17.6, 0.3, 0.12), roda(17.6, 0.28),
);
D.leopard = () => juntar(
  poly([[0, 0.9], [0.4, 0.45], [6.8, 0.45], [7.7, 0.95], [7.6, 1.8], [0.2, 1.8]]),
  poly([[1.3, 1.8], [1.4, 2.75], [2, 3], [5.6, 2.95], [6.3, 2.5], [6.4, 1.8]]), ret(6.3, 2.35, 3.67, 0.2),
  ...[0.75, 1.75, 2.75, 3.75, 4.75, 5.75, 6.75].map((x) => circulo(x, 0.42, 0.42)),
);
D.caravela = () => juntar(
  poly([[0, 3], [1, 2.5], [3, 0.8], [6, 0], [19, 0], [22, 1.2], [24.5, 3.2], [25, 3.6], [22, 3.6], [20, 2.8], [5, 2.8], [2.8, 4.8], [0.4, 5]]),
  linha(15, 2.8, 15, 20, 0.35), linha(8, 2.8, 8, 16, 0.3),
  poly([[15, 4], [13.5, 4], [10, 9], [21.5, 19.5], [15, 9]]), poly([[8, 4], [6.6, 4], [3.6, 7.5], [13, 15.5], [8, 7.5]]),
);
D.balao = () => {
  const p = [];
  for (let i = 0; i <= 30; i++) { const a = (Math.PI * i) / 30; p.push([9 * Math.cos(a), 16 + 8 * Math.sin(a)]); }
  p.push([-9, 15], [-7.5, 10.5], [-4.5, 6.8], [-1.8, 4.6], [1.8, 4.6], [4.5, 6.8], [7.5, 10.5], [9, 15]);
  return juntar(poly(p), ret(-1, 0, 2, 1.4), linha(-1.6, 4.7, -0.9, 1.4, 0.12), linha(1.6, 4.7, 0.9, 1.4, 0.12));
};

// Objetos (em centímetros).
D.celular = () => juntar(arred(0, 0, 7.16, 14.76, 1.05), arred(2.6, 13.5, 1.95, 0.55, 0.27, true), ret(7.16, 10.2, 0.08, 1.6));
D.cartao = () => juntar(arred(0, 0, 8.56, 5.398, 0.32), arred(0.8, 2.2, 1.2, 0.9, 0.12, true));
D.bolafutebol = () => {
  const p = [circulo(0, 0, 11, false, 72)];
  const pent = (cx, cy, r, g) => poly(Array.from({ length: 5 }, (_, i) => [cx + r * Math.cos(((g + 72 * i) * Math.PI) / 180), cy + r * Math.sin(((g + 72 * i) * Math.PI) / 180)]), true);
  p.push(pent(0, 0, 2.8, 90));
  for (let i = 0; i < 5; i++) { const a = ((90 + 36 + 72 * i) * Math.PI) / 180; p.push(pent(8.4 * Math.cos(a), 8.4 * Math.sin(a), 2.1, 90 + 36 + 72 * i + 36)); }
  return juntar(...p);
};
D.bolabasquete = () => {
  const p = [circulo(0, 0, 12, false, 72), ret(-0.25, -11.4, 0.5, 22.8, true), ret(-11.4, -0.25, 22.8, 0.5, true)];
  for (const s of [-1, 1]) {
    const pts = [];
    for (let i = 0; i <= 16; i++) { const a = (-0.75 + 1.5 * (i / 16)); pts.push([s * (16 - 9.3 * Math.cos(a)), 9.3 * Math.sin(a)]); }
    p.push(poly([...pts, ...pts.slice().reverse().map(([x, y]) => [x - s * 0.5, y])], true));
  }
  return juntar(...p);
};
D.latinha = () => juntar(poly([[-2.6, 0], [2.6, 0], [3.3, 0.9], [3.3, 10.6], [2.6, 12], [-2.6, 12], [-3.3, 10.6], [-3.3, 0.9]]), ret(-2.4, 11.9, 4.8, 0.3));
D.garrafa = () => espelho([[0, 33], [1.6, 33], [1.6, 31.5], [1.4, 31], [1.5, 29], [2.4, 26], [4.4, 21], [5.2, 17], [5.2, 4], [4.6, 2.2], [5.2, 1], [4.2, 0]]);
D.geladeira = () => juntar(arred(0, 2, 70, 178, 4), ret(4, 0, 6, 2), ret(60, 0, 6, 2), ret(2, 122, 66, 0.8, true), ret(58, 132, 3, 30, true), ret(58, 82, 3, 34, true));
D.porta = () => juntar(ret(0, 0, 80, 210), ret(8, 112, 64, 88, true), ret(8, 10, 64, 92, true), circulo(70, 105, 3), ret(66, 103.5, 8, 3));
D.cadeira = () => juntar(ret(0, 43, 45, 4), linha(3, 0, 4, 44, 3.2), linha(42, 0, 41, 44, 3.2), linha(41, 46, 46, 90, 3.2), ret(38, 60, 7, 26));
D.sofa = () => juntar(arred(0, 8, 210, 50, 6), arred(14, 40, 182, 45, 8), arred(0, 8, 24, 62, 8), arred(186, 8, 24, 62, 8), ret(12, 0, 6, 8), ret(192, 0, 6, 8), ret(78, 40, 1.2, 18, true), ret(131, 40, 1.2, 18, true));
D.piano = () => juntar(poly([[0, 62], [274, 62], [274, 100], [120, 100], [60, 96], [20, 88], [0, 80]]), ret(8, 0, 8, 62), ret(250, 0, 8, 62), ret(150, 0, 8, 62), ret(200, 20, 30, 3), linha(214, 23, 214, 62, 2));
D.tv = () => juntar(arred(0, 7, 123, 71, 1.2), ret(3, 10, 117, 65, true), poly([[50, 0], [73, 0], [65, 7], [58, 7]]));
D.caneca = () => juntar(poly([[0, 0], [8, 0], [8, 9.5], [0, 9.5]]), circulo(9.2, 5, 2.8), circulo(9.2, 5, 1.6, true), ret(0, 2.2, 8, 5.6));
D.lampada = () => juntar(circulo(3, 7.5, 3, false, 48), poly([[1.2, 5], [4.8, 5], [3.9, 2.4], [2.1, 2.4]]), arred(2, 0, 2, 2.6, 0.5));
D.dado = () => juntar(arred(0, 0, 1.6, 1.6, 0.22), ...[[0.4, 0.4], [1.2, 1.2], [0.8, 0.8], [0.4, 1.2], [1.2, 0.4]].map(([x, y]) => circulo(x, y, 0.13, true, 16)));
D.lapis = () => juntar(poly([[0, 0], [14.5, 0], [17.5, 0.37], [14.5, 0.75], [0, 0.75]]), ret(-0.6, 0.05, 0.7, 0.65));
D.moeda = () => juntar(circulo(0, 0, 1.35, false, 60), circulo(0, 0, 0.95, true, 60), circulo(0, 0, 0.88, false, 60));
D.chave = () => juntar(circulo(1.2, 4.8, 1.2, false, 36), circulo(1.2, 4.8, 0.4, true, 24), poly([[0.95, 3.7], [1.45, 3.7], [1.45, 0.1], [1.2, 0], [0.95, 0.1]]), ret(1.45, 0.6, 0.5, 0.4), ret(1.45, 1.4, 0.4, 0.4), ret(1.45, 2.1, 0.55, 0.35));
D.banana = () => {
  const fora = [], dentro = [];
  for (let i = 0; i <= 20; i++) { const a = Math.PI * (0.18 + 0.64 * (i / 20)); fora.push([12 * Math.cos(a), 12 * Math.sin(a) - 8]); dentro.push([9.8 * Math.cos(a), 9.8 * Math.sin(a) * 0.92 - 7.4]); }
  return juntar(poly([...fora, ...dentro.reverse()]), linha(fora[20][0], fora[20][1], fora[20][0] - 0.9, fora[20][1] + 0.6, 0.6));
};
// Violão: corpo de 50 cm (38 cm na parte de baixo), braço e cabeça; 1,03 m ao todo.
D.violao = () => juntar(circulo(0, 19, 19, false, 64), circulo(0, 40, 14.5, false, 64), ret(-11, 26, 22, 10), circulo(0, 36, 4.3, true, 40), ret(-2.6, 52, 5.2, 37), arred(-3.6, 87, 7.2, 16, 1.5));
D.notebook = () => juntar(arred(1, 2.2, 33.7, 22, 0.8), ret(2.4, 3.6, 30.9, 19.2, true), poly([[0, 0], [35.7, 0], [35, 2.2], [0.7, 2.2]]));

// ───────────── os itens ─────────────
// [id, categoria, desenho ("mao:<nome>" ou "bicho:<pasta/arquivo>"), "português", "English", "español", medida, valor]
// valor em metros, sempre da caixa da silhueta (altura total, comprimento total com a cauda, etc.).
const ITENS = [
  // Lugares e monumentos
  ["torre-eiffel", "monumentos", "mao:eiffel", "Torre Eiffel", "Eiffel Tower", "Torre Eiffel", "a", 330],
  ["cristo", "monumentos", "mao:cristo", "Cristo Redentor (com o pedestal)", "Christ the Redeemer (with pedestal)", "Cristo Redentor (con el pedestal)", "a", 38],
  ["liberdade", "monumentos", "mao:liberdade", "Estátua da Liberdade (com a base)", "Statue of Liberty (with base)", "Estatua de la Libertad (con la base)", "a", 93],
  ["big-ben", "monumentos", "mao:bigben", "Big Ben", "Big Ben", "Big Ben", "a", 96],
  ["torre-pisa", "monumentos", "mao:pisa", "Torre de Pisa", "Leaning Tower of Pisa", "Torre de Pisa", "a", 56.7],
  ["queops", "monumentos", "mao:queops", "Pirâmide de Quéops", "Great Pyramid of Giza", "Pirámide de Keops", "a", 138.5],
  ["piramide-louvre", "monumentos", "mao:louvre", "Pirâmide do Louvre", "Louvre Pyramid", "Pirámide del Louvre", "a", 21.6],
  ["arco-triunfo", "monumentos", "mao:arco", "Arco do Triunfo", "Arc de Triomphe", "Arco de Triunfo", "a", 50],
  ["washington", "monumentos", "mao:washington", "Monumento a Washington", "Washington Monument", "Monumento a Washington", "a", 169.3],
  ["burj-khalifa", "monumentos", "mao:burj", "Burj Khalifa", "Burj Khalifa", "Burj Khalifa", "a", 828],
  ["empire-state", "monumentos", "mao:empire", "Empire State Building (com a antena)", "Empire State Building (with antenna)", "Empire State Building (con la antena)", "a", 443],
  ["skytree", "monumentos", "mao:skytree", "Tokyo Skytree", "Tokyo Skytree", "Tokyo Skytree", "a", 634],
  ["coliseu", "monumentos", "mao:coliseu", "Coliseu", "Colosseum", "Coliseo", "c", 189],
  ["opera-sydney", "monumentos", "mao:opera", "Ópera de Sydney", "Sydney Opera House", "Ópera de Sídney", "c", 183],
  ["london-eye", "monumentos", "mao:londoneye", "London Eye", "London Eye", "London Eye", "a", 135],
  ["moai", "monumentos", "mao:moai", "Moai (o maior de pé)", "Moai (tallest standing)", "Moái (el más alto en pie)", "a", 10],
  ["turbina-eolica", "monumentos", "mao:turbina", "Turbina eólica (com a pá em cima)", "Wind turbine (blade at the top)", "Aerogenerador (con el aspa arriba)", "a", 160],
  ["sequoia", "monumentos", "mao:sequoia", "Sequoia General Sherman", "General Sherman sequoia", "Secuoya General Sherman", "a", 84],
  ["coqueiro", "monumentos", "mao:coqueiro", "Coqueiro", "Coconut palm", "Cocotero", "a", 25],
  ["baoba", "monumentos", "mao:baoba", "Baobá", "Baobab", "Baobab", "a", 25],
  ["saguaro", "monumentos", "mao:saguaro", "Cacto saguaro", "Saguaro cactus", "Cactus saguaro", "a", 12],
  // Pessoas e monstros
  ["pessoa", "personagens", "mao:pessoa", "Homem adulto (média no Brasil)", "Adult man (Brazil average)", "Hombre adulto (promedio en Brasil)", "a", 1.73],
  ["mulher", "personagens", "mao:pessoa", "Mulher adulta (média no Brasil)", "Adult woman (Brazil average)", "Mujer adulta (promedio en Brasil)", "a", 1.61],
  ["shaq", "personagens", "mao:pessoa", "Shaquille O'Neal", "Shaquille O'Neal", "Shaquille O'Neal", "a", 2.16],
  ["wadlow", "personagens", "mao:pessoa", "Robert Wadlow, o mais alto da história", "Robert Wadlow, tallest ever", "Robert Wadlow, el más alto de la historia", "a", 2.72],
  ["crianca", "personagens", "mao:crianca", "Criança de 5 anos", "5-year-old child", "Niño de 5 años", "a", 1.1],
  ["darth-vader", "personagens", "mao:vader", "Darth Vader", "Darth Vader", "Darth Vader", "a", 2.02],
  ["hagrid", "personagens", "mao:hagrid", "Hagrid (livro)", "Hagrid (book)", "Hagrid (libro)", "a", 3.5],
  ["gundam", "personagens", "mao:gundam", "Gundam RX-78-2", "Gundam RX-78-2", "Gundam RX-78-2", "a", 18],
  ["godzilla", "personagens", "mao:godzilla", "Godzilla (2019)", "Godzilla (2019)", "Godzilla (2019)", "a", 120],
  ["king-kong", "personagens", "bicho:terrestrial_animal/gorilla_01", "King Kong (Ilha da Caveira, 2017)", "King Kong (Skull Island, 2017)", "King Kong (La Isla Calavera, 2017)", "a", 31.6],
  ["nessie", "personagens", "mao:nessie", "Monstro do Lago Ness (como contam)", "Loch Ness Monster (as told)", "Monstruo del lago Ness (según cuentan)", "c", 10],
  // Animais (silhuetas realistas, de lado)
  ["girafa", "animais", "bicho:terrestrial_animal/giraffe_02", "Girafa", "Giraffe", "Jirafa", "a", 5.5],
  ["elefante", "animais", "bicho:terrestrial_animal/elephant_african", "Elefante-africano", "African elephant", "Elefante africano", "a", 3.5],
  ["mamute", "animais", "bicho:terrestrial_animal/mammoth", "Mamute-lanoso", "Woolly mammoth", "Mamut lanudo", "a", 3.4],
  ["rinoceronte", "animais", "bicho:terrestrial_animal/rhinoceros_01", "Rinoceronte-branco", "White rhinoceros", "Rinoceronte blanco", "c", 4],
  ["hipopotamo", "animais", "bicho:terrestrial_animal/hippopotamus_02", "Hipopótamo", "Hippopotamus", "Hipopótamo", "c", 4],
  ["camelo", "animais", "bicho:terrestrial_animal/camel_02", "Camelo", "Camel", "Camello", "a", 2.2],
  ["cavalo", "animais", "bicho:terrestrial_animal/horse_01", "Cavalo (com a cauda)", "Horse (with tail)", "Caballo (con la cola)", "c", 2.6],
  ["zebra", "animais", "bicho:terrestrial_animal/zebra_02", "Zebra (com a cauda)", "Zebra (with tail)", "Cebra (con la cola)", "c", 2.7],
  ["vaca", "animais", "bicho:terrestrial_animal/cow_04", "Vaca (com a cauda)", "Cow (with tail)", "Vaca (con la cola)", "c", 2.9],
  ["bisao", "animais", "bicho:terrestrial_animal/bison", "Bisão-americano", "American bison", "Bisonte americano", "c", 3.5],
  ["leao", "animais", "bicho:terrestrial_animal/lion_m_03", "Leão (com a cauda)", "Lion (with tail)", "León (con la cola)", "c", 3],
  ["urso-pardo", "animais", "bicho:terrestrial_animal/bear_02", "Urso-pardo em pé", "Brown bear standing", "Oso pardo de pie", "a", 2.5],
  ["gorila", "animais", "bicho:terrestrial_animal/gorilla_01", "Gorila", "Gorilla", "Gorila", "a", 1.7],
  ["canguru", "animais", "bicho:terrestrial_animal/kangaroo_03", "Canguru-vermelho", "Red kangaroo", "Canguro rojo", "a", 1.8],
  ["avestruz", "animais", "bicho:aerial_animal/ostrich_01", "Avestruz", "Ostrich", "Avestruz", "a", 2.7],
  ["pinguim", "animais", "bicho:aerial_animal/penguin_01", "Pinguim-imperador", "Emperor penguin", "Pingüino emperador", "a", 1.15],
  ["flamingo", "animais", "bicho:aerial_animal/flamingo_02", "Flamingo", "Flamingo", "Flamenco", "a", 1.4],
  ["lhama", "animais", "bicho:terrestrial_animal/lama", "Lhama", "Llama", "Llama", "a", 1.8],
  ["cachorro", "animais", "bicho:terrestrial_animal/dog_01", "Cachorro (labrador, com a cauda)", "Dog (labrador, with tail)", "Perro (labrador, con la cola)", "c", 1.1],
  ["gato", "animais", "bicho:terrestrial_animal/cat_03", "Gato (com a cauda)", "Cat (with tail)", "Gato (con la cola)", "c", 0.75],
  ["camundongo", "animais", "bicho:terrestrial_animal/mouse_01", "Camundongo (com a cauda)", "Mouse (with tail)", "Ratón (con la cola)", "c", 0.16],
  ["porco", "animais", "bicho:terrestrial_animal/pig_01", "Porco", "Pig", "Cerdo", "c", 1.6],
  ["panda", "animais", "bicho:terrestrial_animal/giant_panda", "Panda-gigante", "Giant panda", "Panda gigante", "c", 1.7],
  ["baleia-azul", "animais", "bicho:aquatic_animal/whale_finwhale_02", "Baleia-azul", "Blue whale", "Ballena azul", "c", 25],
  ["jubarte", "animais", "bicho:aquatic_animal/whale_humpbackwhale_03", "Baleia-jubarte", "Humpback whale", "Ballena jorobada", "c", 15],
  ["cachalote", "animais", "bicho:aquatic_animal/whale_spermwhale", "Cachalote", "Sperm whale", "Cachalote", "c", 16],
  ["orca", "animais", "bicho:aquatic_animal/orca_killer_whale", "Orca", "Orca", "Orca", "c", 8],
  ["tubarao-branco", "animais", "bicho:aquatic_animal/shark_03", "Tubarão-branco", "Great white shark", "Tiburón blanco", "c", 4.5],
  ["golfinho", "animais", "bicho:aquatic_animal/dolphin_02", "Golfinho-nariz-de-garrafa", "Bottlenose dolphin", "Delfín mular", "c", 2.6],
  ["narval", "animais", "bicho:aquatic_animal/narwhal_02", "Narval (com a presa)", "Narwhal (with tusk)", "Narval (con el colmillo)", "c", 6.5],
  ["tartaruga", "animais", "bicho:aquatic_animal/turtle_02", "Tartaruga-de-couro", "Leatherback turtle", "Tortuga laúd", "c", 2],
  ["cavalo-marinho", "animais", "bicho:aquatic_animal/seahorse_01", "Cavalo-marinho", "Seahorse", "Caballito de mar", "a", 0.15],
  ["tarantula", "animais", "bicho:dangerous_animals/spider_tarantula_01", "Aranha-golias (pernas abertas)", "Goliath birdeater (legs spread)", "Tarántula Goliat (patas abiertas)", "l", 0.28],
  ["quetzalcoatlus", "animais", "bicho:aerial_animal/pterosaur_01", "Quetzalcoatlus (pterossauro)", "Quetzalcoatlus (pterosaur)", "Quetzalcoatlus (pterosaurio)", "e", 10],
  ["albatroz", "animais", "bicho:aerial_animal/albatross_01", "Albatroz-errante (asas abertas)", "Wandering albatross (wings spread)", "Albatros viajero (alas abiertas)", "e", 3.4],
  ["beija-flor", "animais", "bicho:aerial_animal/hummingbird_01", "Beija-flor", "Hummingbird", "Colibrí", "c", 0.09],
  // Veículos
  ["fusca", "veiculos", "mao:fusca", "Fusca", "VW Beetle", "Escarabajo (VW)", "c", 4.08],
  ["onibus", "veiculos", "mao:onibus", "Ônibus urbano", "City bus", "Autobús urbano", "c", 12],
  ["dois-andares", "veiculos", "mao:doisandares", "Ônibus de dois andares de Londres", "London double-decker bus", "Autobús de dos pisos de Londres", "a", 4.4],
  ["carreta", "veiculos", "mao:carreta", "Caminhão com carreta", "Semi-trailer truck", "Camión con remolque", "c", 18.5],
  ["bicicleta", "veiculos", "mao:bicicleta", "Bicicleta", "Bicycle", "Bicicleta", "c", 1.75],
  ["boeing-747", "veiculos", "mao:boeing747", "Boeing 747", "Boeing 747", "Boeing 747", "c", 70.7],
  ["titanic", "veiculos", "mao:titanic", "Titanic", "Titanic", "Titanic", "c", 269],
  ["ever-given", "veiculos", "mao:evergiven", "Navio porta-contêineres Ever Given", "Ever Given container ship", "Portacontenedores Ever Given", "c", 400],
  ["saturn-v", "veiculos", "mao:saturnov", "Foguete Saturno V", "Saturn V rocket", "Cohete Saturno V", "a", 110.6],
  ["onibus-espacial", "veiculos", "mao:onibusespacial", "Ônibus espacial", "Space Shuttle orbiter", "Transbordador espacial", "c", 37.2],
  ["typhoon", "veiculos", "mao:typhoon", "Submarino classe Typhoon", "Typhoon-class submarine", "Submarino clase Typhoon", "c", 175],
  ["hindenburg", "veiculos", "mao:hindenburg", "Dirigível Hindenburg", "Hindenburg airship", "Dirigible Hindenburg", "c", 245],
  ["black-hawk", "veiculos", "mao:blackhawk", "Helicóptero Black Hawk (com a hélice)", "Black Hawk helicopter (with rotor)", "Helicóptero Black Hawk (con el rotor)", "c", 19.8],
  ["tanque", "veiculos", "mao:leopard", "Tanque Leopard 2 (com o canhão)", "Leopard 2 tank (with gun)", "Tanque Leopard 2 (con el cañón)", "c", 9.97],
  ["caravela", "veiculos", "mao:caravela", "Caravela (como a de Cabral)", "Caravel (like Cabral's)", "Carabela (como la de Cabral)", "c", 25],
  ["balao", "veiculos", "mao:balao", "Balão de ar quente", "Hot air balloon", "Globo aerostático", "a", 25],
  // Objetos
  ["celular", "objetos", "mao:celular", "iPhone 15", "iPhone 15", "iPhone 15", "a", 0.1476],
  ["cartao", "objetos", "mao:cartao", "Cartão de crédito", "Credit card", "Tarjeta de crédito", "l", 0.0856],
  ["bola-futebol", "objetos", "mao:bolafutebol", "Bola de futebol", "Soccer ball", "Balón de fútbol", "d", 0.22],
  ["bola-basquete", "objetos", "mao:bolabasquete", "Bola de basquete", "Basketball", "Balón de baloncesto", "d", 0.24],
  ["latinha", "objetos", "mao:latinha", "Lata de refrigerante", "Soda can", "Lata de refresco", "a", 0.122],
  ["garrafa", "objetos", "mao:garrafa", "Garrafa PET de 2 litros", "2-liter soda bottle", "Botella de 2 litros", "a", 0.33],
  ["geladeira", "objetos", "mao:geladeira", "Geladeira duplex", "Two-door fridge", "Refrigerador de dos puertas", "a", 1.8],
  ["porta", "objetos", "mao:porta", "Porta", "Door", "Puerta", "a", 2.1],
  ["cadeira", "objetos", "mao:cadeira", "Cadeira", "Chair", "Silla", "a", 0.9],
  ["sofa", "objetos", "mao:sofa", "Sofá de 3 lugares", "3-seat sofa", "Sofá de 3 plazas", "c", 2.1],
  ["piano", "objetos", "mao:piano", "Piano de cauda de concerto", "Concert grand piano", "Piano de cola de concierto", "c", 2.74],
  ["tv", "objetos", "mao:tv", "TV de 55 polegadas", "55-inch TV", "Televisor de 55 pulgadas", "l", 1.23],
  ["caneca", "objetos", "mao:caneca", "Caneca", "Mug", "Taza", "a", 0.095],
  ["lampada", "objetos", "mao:lampada", "Lâmpada", "Light bulb", "Bombilla", "a", 0.105],
  ["dado", "objetos", "mao:dado", "Dado", "Die", "Dado", "l", 0.016],
  ["lapis", "objetos", "mao:lapis", "Lápis", "Pencil", "Lápiz", "c", 0.181],
  ["moeda", "objetos", "mao:moeda", "Moeda de 1 real", "1 real coin", "Moneda de 1 real", "d", 0.027],
  ["chave", "objetos", "mao:chave", "Chave de casa", "House key", "Llave de casa", "cv", 0.06],
  ["banana", "objetos", "mao:banana", "Banana", "Banana", "Plátano", "c", 0.2],
  ["violao", "objetos", "mao:violao", "Violão", "Acoustic guitar", "Guitarra acústica", "cv", 1.03],
  ["notebook", "objetos", "mao:notebook", "Notebook de 15 polegadas", "15-inch laptop", "Portátil de 15 pulgadas", "l", 0.357],
];

const [saida, pastaBichos] = process.argv.slice(2);
const arred1 = (d) => d.replace(/-?\d*\.\d+(?:e-?\d+)?/g, (n) => " " + String(Math.round(Number(n) * 100) / 100)).replace(/([A-Za-z]) /g, "$1");
const linhas = [];
for (const [id, cat, desenho, pt, en, es, medida, metros] of ITENS) {
  let d;
  if (desenho.startsWith("mao:")) {
    if (!D[desenho.slice(4)]) throw new Error("desenho não existe: " + desenho);
    d = D[desenho.slice(4)]();
  } else {
    const svg = fs.readFileSync(path.join(pastaBichos, desenho.slice(6) + ".svg"), "utf8");
    if (/transform=|<g\b/.test(svg)) throw new Error("silhueta com transformação: " + desenho);
    d = arred1([...svg.matchAll(/\sd="([^"]+)"/g)].map((m) => m[1]).join(" "));
  }
  const [x0, y0, x1, y1] = svgPathBbox(d);
  const w = x1 - x0, h = y1 - y0;
  const dim = medida === "a" || medida === "cv" ? h : w;
  linhas.push(`  ${JSON.stringify([id, cat, pt, en, es, medida, metros, +(metros / dim).toPrecision(6), +x0.toFixed(3), +y0.toFixed(3), +w.toFixed(3), +h.toFixed(3), d])},`);
}
fs.writeFileSync(saida, `// Itens do Tamanhozi (os países ficam em paises.js): [id, categoria, "português", "English", "español", medida, metros,
// metros por unidade do desenho, x, y, largura e altura da silhueta, contorno SVG]. Gerado por ferramentas/gerar-tamanhozi.js.
// medida: a = altura, c = comprimento, cv = comprimento (em pé, na vertical), l = largura, d = diâmetro, e = envergadura.
// Silhuetas: animais do acervo "QGIS svg icons - Animal silhouettes" (domínio público); o resto desenhado com as medidas reais.
// Itens novos entram no FIM (a ordem é usada pelo sorteio do dia) e precisam de uma linha nova em TZ_DIARIO_POOLS.

tzItens([
${linhas.join("\n")}
]);
`);
console.log(linhas.length, "itens", fs.statSync(saida).size, "bytes");
