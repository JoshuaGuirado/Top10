// Uso: npm i world-atlas@2.0.2 topojson-client@3.1.0 numa pasta à parte e, de lá, node gerar-mapazi.js <caminho>/mapazi/data/paises.js
// Gera mapazi/data/paises.js: contorno de cada país numa projeção de área igual (Lambert azimutal),
// centrada no próprio país, para os tamanhos serem comparáveis entre si.
const topojson = require("topojson-client");
const topo = require("world-atlas/countries-50m.json");
const fs = require("fs");
const R = 6371.0088;
const NOMES = [
  ["076", "Brasil", "Brazil", "Brasil"], ["643", "Rússia", "Russia", "Rusia"], ["840", "Estados Unidos", "United States", "Estados Unidos"],
  ["124", "Canadá", "Canada", "Canadá"], ["156", "China", "China", "China"], ["036", "Austrália", "Australia", "Australia"],
  ["356", "Índia", "India", "India"], ["032", "Argentina", "Argentina", "Argentina"], ["484", "México", "Mexico", "México"],
  ["250", "França", "France", "Francia"], ["276", "Alemanha", "Germany", "Alemania"], ["826", "Reino Unido", "United Kingdom", "Reino Unido"],
  ["380", "Itália", "Italy", "Italia"], ["724", "Espanha", "Spain", "España"], ["392", "Japão", "Japan", "Japón"],
  ["410", "Coreia do Sul", "South Korea", "Corea del Sur"], ["710", "África do Sul", "South Africa", "Sudáfrica"], ["818", "Egito", "Egypt", "Egipto"],
  ["566", "Nigéria", "Nigeria", "Nigeria"], ["180", "República Democrática do Congo", "DR Congo", "República Democrática del Congo"],
  ["012", "Argélia", "Algeria", "Argelia"], ["682", "Arábia Saudita", "Saudi Arabia", "Arabia Saudita"], ["364", "Irã", "Iran", "Irán"],
  ["586", "Paquistão", "Pakistan", "Pakistán"], ["360", "Indonésia", "Indonesia", "Indonesia"], ["608", "Filipinas", "Philippines", "Filipinas"],
  ["704", "Vietnã", "Vietnam", "Vietnam"], ["764", "Tailândia", "Thailand", "Tailandia"], ["152", "Chile", "Chile", "Chile"],
  ["604", "Peru", "Peru", "Perú"], ["170", "Colômbia", "Colombia", "Colombia"], ["862", "Venezuela", "Venezuela", "Venezuela"],
  ["068", "Bolívia", "Bolivia", "Bolivia"], ["600", "Paraguai", "Paraguay", "Paraguay"], ["858", "Uruguai", "Uruguay", "Uruguay"],
  ["218", "Equador", "Ecuador", "Ecuador"], ["620", "Portugal", "Portugal", "Portugal"], ["528", "Holanda", "Netherlands", "Países Bajos"],
  ["056", "Bélgica", "Belgium", "Bélgica"], ["756", "Suíça", "Switzerland", "Suiza"], ["040", "Áustria", "Austria", "Austria"],
  ["752", "Suécia", "Sweden", "Suecia"], ["578", "Noruega", "Norway", "Noruega"], ["246", "Finlândia", "Finland", "Finlandia"],
  ["208", "Dinamarca", "Denmark", "Dinamarca"], ["372", "Irlanda", "Ireland", "Irlanda"], ["616", "Polônia", "Poland", "Polonia"],
  ["804", "Ucrânia", "Ukraine", "Ucrania"], ["792", "Turquia", "Turkey", "Turquía"], ["300", "Grécia", "Greece", "Grecia"],
  ["642", "Romênia", "Romania", "Rumania"], ["348", "Hungria", "Hungary", "Hungría"], ["203", "República Tcheca", "Czechia", "Chequia"],
  ["104", "Mianmar", "Myanmar", "Myanmar"], ["116", "Camboja", "Cambodia", "Camboya"], ["418", "Laos", "Laos", "Laos"],
  ["050", "Bangladesh", "Bangladesh", "Bangladés"], ["144", "Sri Lanka", "Sri Lanka", "Sri Lanka"], ["524", "Nepal", "Nepal", "Nepal"],
  ["004", "Afeganistão", "Afghanistan", "Afganistán"], ["398", "Cazaquistão", "Kazakhstan", "Kazajistán"], ["496", "Mongólia", "Mongolia", "Mongolia"],
  ["784", "Emirados Árabes Unidos", "United Arab Emirates", "Emiratos Árabes Unidos"], ["400", "Jordânia", "Jordan", "Jordania"],
  ["376", "Israel", "Israel", "Israel"], ["422", "Líbano", "Lebanon", "Líbano"], ["368", "Iraque", "Iraq", "Irak"], ["760", "Síria", "Syria", "Siria"],
  ["706", "Somália", "Somalia", "Somalia"], ["231", "Etiópia", "Ethiopia", "Etiopía"], ["404", "Quênia", "Kenya", "Kenia"],
  ["834", "Tanzânia", "Tanzania", "Tanzania"], ["800", "Uganda", "Uganda", "Uganda"], ["646", "Ruanda", "Rwanda", "Ruanda"],
  ["508", "Moçambique", "Mozambique", "Mozambique"], ["024", "Angola", "Angola", "Angola"], ["716", "Zimbábue", "Zimbabwe", "Zimbabue"],
  ["894", "Zâmbia", "Zambia", "Zambia"], ["072", "Botsuana", "Botswana", "Botsuana"], ["516", "Namíbia", "Namibia", "Namibia"],
  ["450", "Madagascar", "Madagascar", "Madagascar"], ["554", "Nova Zelândia", "New Zealand", "Nueva Zelanda"],
  ["598", "Papua-Nova Guiné", "Papua New Guinea", "Papúa Nueva Guinea"], ["320", "Guatemala", "Guatemala", "Guatemala"],
  ["340", "Honduras", "Honduras", "Honduras"], ["222", "El Salvador", "El Salvador", "El Salvador"], ["558", "Nicarágua", "Nicaragua", "Nicaragua"],
  ["188", "Costa Rica", "Costa Rica", "Costa Rica"], ["591", "Panamá", "Panama", "Panamá"], ["192", "Cuba", "Cuba", "Cuba"],
  ["332", "Haiti", "Haiti", "Haití"], ["214", "República Dominicana", "Dominican Republic", "República Dominicana"], ["388", "Jamaica", "Jamaica", "Jamaica"],
  ["304", "Groenlândia", "Greenland", "Groenlandia"], ["352", "Islândia", "Iceland", "Islandia"], ["008", "Albânia", "Albania", "Albania"],
  ["191", "Croácia", "Croatia", "Croacia"], ["688", "Sérvia", "Serbia", "Serbia"], ["100", "Bulgária", "Bulgaria", "Bulgaria"],
  ["504", "Marrocos", "Morocco", "Marruecos"], ["788", "Tunísia", "Tunisia", "Túnez"], ["434", "Líbia", "Libya", "Libia"],
  ["729", "Sudão", "Sudan", "Sudán"], ["148", "Chade", "Chad", "Chad"], ["562", "Níger", "Niger", "Níger"], ["466", "Mali", "Mali", "Malí"],
  ["288", "Gana", "Ghana", "Ghana"], ["384", "Costa do Marfim", "Ivory Coast", "Costa de Marfil"], ["686", "Senegal", "Senegal", "Senegal"],
  ["120", "Camarões", "Cameroon", "Camerún"], ["626", "Timor-Leste", "Timor-Leste", "Timor Oriental"], ["458", "Malásia", "Malaysia", "Malasia"],
  ["408", "Coreia do Norte", "North Korea", "Corea del Norte"], ["158", "Taiwan", "Taiwan", "Taiwán"], ["512", "Omã", "Oman", "Omán"],
  ["887", "Iêmen", "Yemen", "Yemen"], ["634", "Catar", "Qatar", "Catar"], ["860", "Uzbequistão", "Uzbekistan", "Uzbekistán"],
  ["268", "Geórgia", "Georgia", "Georgia"], ["112", "Belarus", "Belarus", "Bielorrusia"], ["440", "Lituânia", "Lithuania", "Lituania"],
  ["428", "Letônia", "Latvia", "Letonia"], ["233", "Estônia", "Estonia", "Estonia"], ["703", "Eslováquia", "Slovakia", "Eslovaquia"],
  ["705", "Eslovênia", "Slovenia", "Eslovenia"], ["442", "Luxemburgo", "Luxembourg", "Luxemburgo"], ["328", "Guiana", "Guyana", "Guyana"],
  ["740", "Suriname", "Suriname", "Surinam"], ["196", "Chipre", "Cyprus", "Chipre"],
];

const rad = Math.PI / 180;
// Territórios longe do país que atrapalham o desenho (lon e lat do centro do polígono, em graus).
const FORA = {
  "840": (l, f) => f < 30 && l < -140, // Havaí
  "218": (l) => l < -85, // Galápagos
  "578": (l, f) => f > 74, // Svalbard e Jan Mayen
  "724": (l, f) => f < 32, // Canárias
  "620": (l) => l < -12, // Açores e Madeira
  "152": (l) => l < -80, // Ilha de Páscoa e Juan Fernández
  "528": (l, f) => f < 20, // Caribe holandês
  "250": (l, f) => f < 40 || l < -10, // ultramar
  "036": (l, f) => l > 155 || l < 110 || f < -45, // ilhas distantes
  "554": (l) => l < 160 && l > 0, // ilhas distantes
};
function laea(lam0, phi0) {
  const s0 = Math.sin(phi0), c0 = Math.cos(phi0);
  return ([lon, lat]) => {
    const lam = lon * rad, phi = lat * rad;
    let dl = lam - lam0;
    const cp = Math.cos(phi), sp = Math.sin(phi), cd = Math.cos(dl);
    const k = Math.sqrt(2 / Math.max(1e-12, 1 + s0 * sp + c0 * cp * cd));
    return [R * k * cp * Math.sin(dl), R * k * (c0 * sp - s0 * cp * cd)];
  };
}
const area = (ring) => { let a = 0; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) a += (ring[j][0] + ring[i][0]) * (ring[j][1] - ring[i][1]); return a / 2; };
const centro = (ring) => { let x = 0, y = 0; ring.forEach((p) => { x += p[0]; y += p[1]; }); return [x / ring.length, y / ring.length]; };
// Centro de um anel em graus, pela média dos vetores 3D (funciona perto de 180°).
function centroGeo(ring) {
  let x = 0, y = 0, z = 0;
  for (const [lon, lat] of ring) { const l = lon * rad, f = lat * rad; x += Math.cos(f) * Math.cos(l); y += Math.cos(f) * Math.sin(l); z += Math.sin(f); }
  return [Math.atan2(y, x), Math.atan2(z, Math.hypot(x, y))];
}
function dp(pts, tol) {
  if (pts.length < 4) return pts;
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
  const st = [[0, pts.length - 1]];
  while (st.length) {
    const [a, b] = st.pop(); let m = -1, md = tol;
    const [ax, ay] = pts[a], [bx, by] = pts[b]; const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy);
    for (let i = a + 1; i < b; i++) { const d = L < 1e-6 ? Math.hypot(pts[i][0] - ax, pts[i][1] - ay) : Math.abs(dy * pts[i][0] - dx * pts[i][1] + bx * ay - by * ax) / L; if (d > md) { md = d; m = i; } }
    if (m >= 0) { keep[m] = 1; st.push([a, m], [m, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}

const feats = new Map();
for (const f of topojson.feature(topo, topo.objects.countries).features) if (!feats.has(f.id)) feats.set(f.id, f); // o primeiro com o id é o país (depois vêm territórios)
// Regiões sem id que ficam no mapa do país (como nos mapas comuns).
const JUNTAR = { Somaliland: "706", "N. Cyprus": "196" };
const polysDe = (g) => (g.type === "Polygon" ? [g.coordinates] : g.coordinates);
for (const f of topojson.feature(topo, topo.objects.countries).features) {
  const alvo = JUNTAR[f.properties.name];
  if (alvo) { const g = feats.get(alvo).geometry; feats.get(alvo).geometry = { type: "MultiPolygon", coordinates: polysDe(g).concat(polysDe(f.geometry)) }; }
}
const linhas = [];
for (const [id, pt, en, es] of NOMES) {
  const f = feats.get(id);
  if (!f) { console.error("falta", id, pt); continue; }
  const polys = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
  // Cada polígono com a área (numa projeção centrada nele) e o centro; o centro do país é a média pesada pela área.
  const info = polys.map((p) => {
    const [l0, f0] = centroGeo(p[0]);
    const a = Math.abs(area(p[0].map(laea(l0, f0))));
    return { p, a, v: [Math.cos(f0) * Math.cos(l0) * a, Math.cos(f0) * Math.sin(l0) * a, Math.sin(f0) * a], l0: l0 / rad, f0: f0 / rad };
  }).filter((x) => !(FORA[id] && FORA[id](x.l0, x.f0)));
  const somaA = info.reduce((s, x) => s + x.a, 0);
  const v = [0, 1, 2].map((k) => info.reduce((s, x) => s + x.v[k], 0));
  const lam0 = Math.atan2(v[1], v[0]), phi0 = Math.atan2(v[2], Math.hypot(v[0], v[1]));
  const pr = laea(lam0, phi0);
  const raio = Math.max(600, 2 * Math.sqrt(somaA));
  const aneis = [];
  let total = 0;
  for (const { p, a } of info) {
    const rs = p.map((r) => r.map(pr));
    const c = centro(rs[0]);
    if (Math.hypot(c[0], c[1]) > raio || a < Math.max(15, somaA * 0.0006)) continue;
    total += Math.abs(area(rs[0])) - rs.slice(1).reduce((s, r) => s + Math.abs(area(r)), 0);
    aneis.push(...rs);
  }
  const tol = Math.sqrt(total) * 0.0025;
  const simples = aneis.map((r) => dp(r, tol)).filter((r) => r.length >= 4);
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  simples.forEach((r) => r.forEach(([x, y]) => { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); }));
  // Unidade do desenho: o país tem uns 1000 de largura/altura; u = km por unidade.
  const u = Math.max(maxX - minX, maxY - minY) / 1000;
  const d = simples.map((r) => {
    const q = r.map(([x, y]) => [Math.round((x - minX) / u), Math.round((maxY - y) / u)]);
    const out = [q[0]];
    for (let i = 1; i < q.length; i++) if (q[i][0] !== out[out.length - 1][0] || q[i][1] !== out[out.length - 1][1]) out.push(q[i]);
    let s = "M" + out[0][0] + " " + out[0][1];
    for (let i = 1; i < out.length; i++) s += "l" + (out[i][0] - out[i - 1][0]) + " " + (out[i][1] - out[i - 1][1]);
    return s + "z";
  }).join("");
  linhas.push(`  ["${id}", ${JSON.stringify(pt)}, ${JSON.stringify(en)}, ${JSON.stringify(es)}, ${Math.round(total)}, ${+u.toFixed(4)}, ${Math.round((maxX - minX) / u)}, ${Math.round((maxY - minY) / u)}, "${d}"],`);
}
fs.writeFileSync(process.argv[2], `// Países do Mapazi: [id ISO, "português", "English", "español", área em km², km por unidade do desenho, largura, altura, contorno SVG].
// Gerado de Natural Earth (domínio público, via world-atlas 50m) numa projeção de área igual (Lambert azimutal)
// centrada em cada país, então desenhar dois países na mesma escala (km por pixel) mostra o tamanho real de um
// perto do outro. Territórios longe do corpo do país ficam de fora (Havaí, Guiana Francesa, Canárias, Svalbard…).
// Países novos entram no FIM (a ordem é usada pelo sorteio do dia) e precisam de uma linha nova em MP_DIARIO_POOLS.

mpPaises([
${linhas.join("\n")}
]);
`);
console.log(linhas.length, "países");
