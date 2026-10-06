// Insígnias das categorias: ícones de traço que herdam a cor do texto.
const CATEGORY_ICONS = {
  geografia: '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>',
  brasil: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M12 7.5 19 12l-7 4.5L5 12z"/><circle cx="12" cy="12" r="2.2"/>',
  futebol: '<circle cx="12" cy="12" r="9"/><path d="m12 8 3.4 2.5-1.3 4h-4.2l-1.3-4z"/><path d="M12 8V3.5M15.4 10.5l4.2-1.4M14.1 14.5l2.6 3.6M9.9 14.5l-2.6 3.6M8.6 10.5 4.4 9.1"/>',
  esporte: '<circle cx="12" cy="15" r="5.5"/><path d="M8.5 10.7 6 3h4l2 5 2-5h4l-2.5 7.7"/><path d="M12 12.5v5"/>',
  filmes: '<rect x="3" y="9" width="18" height="11" rx="2"/><path d="m3.5 9-.8-3.6 16.6-3.3.8 3.6z"/><path d="m8 4.8 2 3.4M13.2 3.8l2 3.4"/>',
  herois: '<path d="M12 3 4.5 6v5.5c0 4.6 3.2 8 7.5 9.5 4.3-1.5 7.5-4.9 7.5-9.5V6z"/><path d="m12 8 1.3 2.7 3 .4-2.2 2.1.5 3-2.6-1.4-2.6 1.4.5-3-2.2-2.1 3-.4z"/>',
  animes: '<path d="M12 2.5 14.2 9.8 21.5 12l-7.3 2.2L12 21.5l-2.2-7.3L2.5 12l7.3-2.2z"/><circle cx="12" cy="12" r="1.6"/>',
  games: '<path d="M6.5 7h11a4 4 0 0 1 3.9 4.8l-1 5a2.6 2.6 0 0 1-4.5 1.2L14.3 16H9.7l-1.6 2a2.6 2.6 0 0 1-4.5-1.2l-1-5A4 4 0 0 1 6.5 7z"/><path d="M8 10v4M6 12h4"/><circle cx="15.5" cy="11" r=".9"/><circle cx="17.5" cy="13" r=".9"/>',
  musica: '<path d="M9 18V5.5l11-2V16"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/><path d="M9 9.5l11-2"/>',
  tv: '<rect x="3" y="7" width="18" height="12" rx="2.5"/><path d="m8.5 3 3.5 4 3.5-4M8 22h8"/>',
  ciencia: '<path d="M9.5 3h5M10.5 3v6L5 18.5A1.7 1.7 0 0 0 6.5 21h11a1.7 1.7 0 0 0 1.5-2.5L13.5 9V3"/><path d="M7.5 14h9"/>',
  matematica: '<rect x="3.5" y="3.5" width="17" height="17" rx="3"/><path d="M7 8.5h4M9 6.5v4M13.5 8.5h4M7 15.5l3 3M10 15.5l-3 3M13.5 15h4M13.5 18h4"/>',
  historia: '<path d="M3 9.5 12 4l9 5.5zM4 21h16M5.5 9.5v9M10 9.5v9M14 9.5v9M18.5 9.5v9M3 18.5h18"/>',
  curiosidades: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.7.5 1.1 1.3 1.1 2.2h5c0-.9.4-1.7 1.1-2.2A6 6 0 0 0 12 3z"/>',
  idiomas: '<path d="M4 5h10a1.5 1.5 0 0 1 1.5 1.5V12a1.5 1.5 0 0 1-1.5 1.5H8.5L5 16.5v-3H4A1.5 1.5 0 0 1 2.5 12V6.5A1.5 1.5 0 0 1 4 5z"/><path d="M18 9h2a1.5 1.5 0 0 1 1.5 1.5V16a1.5 1.5 0 0 1-1.5 1.5h-1v3l-3.5-3H12a1.5 1.5 0 0 1-1.5-1.5"/>',
  animais: '<ellipse cx="12" cy="16" rx="4.5" ry="3.8"/><circle cx="6" cy="10.5" r="1.9"/><circle cx="9.5" cy="6.5" r="1.9"/><circle cx="14.5" cy="6.5" r="1.9"/><circle cx="18" cy="10.5" r="1.9"/>',
  frases: '<path d="M5 4h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-7l-5 4v-4H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><path d="M8.5 9v2.5M8.5 9h1.8M13.5 9v2.5M13.5 9h1.8"/>',
  personagens: '<circle cx="12" cy="8.5" r="4.5"/><path d="M4 21c.8-4 4-6.5 8-6.5s7.2 2.5 8 6.5"/><path d="M10.3 8.3h.01M13.7 8.3h.01"/>',
  comida: '<path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M17 21V3c-2.5 1.5-3.5 4.5-3.5 8h3.5"/>',
  diaadia: '<path d="M3.5 11 12 4l8.5 7M5.5 9.5V20h13V9.5"/><path d="M10 20v-5.5h4V20"/>',
  minhas: '<path d="M14.5 4.5l5 5L9 20H4v-5z"/><path d="m12.5 6.5 5 5"/>',
};

function icon(cat, cls = "ico") {
  const body = CATEGORY_ICONS[cat] || CATEGORY_ICONS.minhas;
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
}
