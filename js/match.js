// Comparação de palpites. Não mexe na tela, por isso é testada em tests/match.test.js.

// Ignora acentos, maiúsculas, pontuação e artigo inicial ao comparar palpites.
function normalize(text) {
  return String(text)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " e ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/^(o|a|os|as|the|um|uma) (?=\S)/, "");
}

// Singular e plural valem o mesmo ("bananas" = "banana").
function stem(text) {
  return text.split(" ").map((w) => (w.length > 3 && !/\d/.test(w) ? w.replace(/(oes|aes|es|s)$/, "") : w)).join(" ");
}

function levenshtein(a, b) {
  if (Math.abs(a.length - b.length) > 2) return 99;
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = tmp;
    }
  }
  return prev[b.length];
}

// learned: respostas aceitas pelo grupo em partidas anteriores ({ índice: ["palpite", ...] }).
function parseList(list, learned = {}) {
  return list.items.map((raw, i) => {
    const parts = raw.split("|");
    const exact = [...parts.filter((p) => !p.startsWith("~")).map(normalize), ...(learned[i] || [])];
    return {
      name: parts[0],
      exact,
      stems: exact.map(stem),
      keys: parts.filter((p) => p.startsWith("~")).map((p) => normalize(p.slice(1))),
    };
  });
}

// Devolve { index } para um acerto novo, { dup } se o item já foi achado, ou null.
function matchGuess(items, found, raw) {
  const g = normalize(raw);
  if (!g) return null;
  const gs = stem(g);
  const padded = ` ${g} `;
  const choose = (idxs) => {
    if (!idxs.length) return null;
    const fresh = idxs.find((i) => !found.has(i));
    return fresh !== undefined ? { index: fresh } : { dup: idxs[0] };
  };
  const where = (test) => items.map((it, i) => (test(it) ? i : -1)).filter((i) => i >= 0);

  const r1 = choose(where((it) => it.exact.includes(g)));
  if (r1) return r1;
  const r2 = choose(where((it) => it.stems.includes(gs)));
  if (r2) return r2;
  const r3 = choose(where((it) => it.keys.some((k) => padded.includes(` ${k} `))));
  if (r3) return r3;

  // Um errinho de digitação é perdoado em palavras sem números.
  if (g.length >= 5 && !/\d/.test(g)) {
    const limit = g.length >= 9 ? 2 : 1;
    let best = 99, bestIdx = [];
    items.forEach((it, i) => {
      for (const e of it.exact) {
        if (/\d/.test(e) || e.length < 5) continue;
        const d = levenshtein(g, e);
        if (d < best) { best = d; bestIdx = [i]; }
        else if (d === best && !bestIdx.includes(i)) bestIdx.push(i);
      }
    });
    if (best <= limit && bestIdx.length === 1) return choose(bestIdx);
  }
  return null;
}

// Parecença entre dois textos já normalizados (0 a 1), por pares de letras.
function similarity(a, b) {
  if (!a || !b) return 0;
  if (a === b) return 1;
  const pairs = (s) => {
    const t = ` ${s} `;
    const out = [];
    for (let i = 0; i < t.length - 1; i++) out.push(t.slice(i, i + 2));
    return out;
  };
  const A = pairs(a);
  const pool = pairs(b);
  const total = A.length + pool.length;
  let hits = 0;
  for (const p of A) {
    const k = pool.indexOf(p);
    if (k >= 0) { hits++; pool.splice(k, 1); }
  }
  let score = (2 * hits) / total;
  if (Math.min(a.length, b.length) >= 3 && (a.includes(b) || b.includes(a))) score = Math.max(score, 0.6);
  return score;
}

// Itens ainda escondidos mais parecidos com o palpite (para "Aceitar mesmo assim").
function rankCandidates(items, found, raw, limit = 3) {
  const g = normalize(raw);
  return items
    .map((it, i) => ({ i, score: Math.max(0, ...[...it.exact, ...it.keys].map((e) => similarity(g, e))) }))
    .filter((c) => !found.has(c.i))
    .sort((a, b) => b.score - a.score || a.i - b.i)
    .slice(0, limit)
    .map((c) => c.i);
}

// Dica de um item: primeira letra e tamanho ("B… · 6 letras").
function hintFor(name) {
  const chars = name.match(/[\p{L}\p{N}]/gu) || [];
  const words = name.trim().split(/\s+/).length;
  const first = (chars[0] || "?").toUpperCase();
  return `${first}… · ${chars.length} letras${words > 1 ? ` · ${words} palavras` : ""}`;
}
