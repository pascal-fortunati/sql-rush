// Met en valeur les éléments SQL d'une consigne. Le texte d'origine n'est jamais modifié :
// seul son rendu HTML distingue tables, colonnes, valeurs et intentions.
const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ESCAPES[c]);

// Locutions qui portent la contrainte de l'énoncé : elles sont soulignées, jamais colorées.
const PHRASES = ['dans cet ordre', 'bornes comprises', 'au maximum', 'au moins', 'y compris', 'une seule fois', 'zéro compris', 'ex æquo', 'sans doublons'];
const EMPHASIS = new Set(['uniquement', 'seulement', 'strictement', 'exactement', 'toutes', 'distincts', 'distinctes', 'décroissant', 'décroissante', 'croissant', 'croissante', 'alphabétique', 'aucune', 'aucun', 'jamais']);
const TYPES = /^\s*(?:INTEGER|TEXT|REAL|BLOB|NUMERIC)\b/;
const TOKEN = new RegExp(
  `(?<phrase>${PHRASES.join('|')})` +
  `|(?<literal>«[^»]{1,60}»|'(?:[^']|'')*')` +
  '|(?<qualified>[A-Za-z_][A-Za-z0-9_]*\\.[A-Za-z_][A-Za-z0-9_]*)' +
  '|(?<word>[A-Za-zÀ-ÖØ-öø-ÿ_][A-Za-zÀ-ÖØ-öø-ÿ0-9_]*)' +
  '|(?<number>\\d+(?:[.,]\\d+)?)', 'g');

const code = (kind, text) => `<code class="tok tok-${kind}">${escapeHtml(text)}</code>`;

function vocabulary(text, tables) {
  const tableNames = new Set(), columnNames = new Set(), values = new Set();
  for (const table of tables) {
    tableNames.add(table.name.toLowerCase());
    const columns = table.columns || [];
    for (const column of columns) columnNames.add(column.name.toLowerCase());
    // Les catégories déjà lisibles dans les données (villes, statuts) sont citées comme valeurs.
    for (const label of ['ville', 'statut']) {
      const index = columns.findIndex(c => c.name.toLowerCase() === label);
      if (index >= 0) for (const row of table.rows || []) if (typeof row[index] === 'string') values.add(row[index]);
    }
  }
  // Les exercices de structure citent des tables et des colonnes qui n'existent pas encore.
  for (const [, name] of text.matchAll(/\b(?:[Cc]rée|table)\s+([a-z_][a-z0-9_]*)/g)) tableNames.add(name);
  for (const [, name] of text.matchAll(/\b(?:alias|colonne|nommée?)\s+([A-Za-z_][A-Za-z0-9_]*)/g)) columnNames.add(name.toLowerCase());
  for (const [, name] of text.matchAll(/\b(?:à|ni|liste|vaut)\s+([A-ZÀ-Ö][A-Za-zÀ-ÿ-]{2,20})/g)) values.add(name);
  return { tableNames, columnNames, values };
}

export function statementHtml(text, tables = []) {
  if (typeof text !== 'string' || !text) return '';
  const { tableNames, columnNames, values } = vocabulary(text, tables);
  let html = '', last = 0;
  for (const match of text.matchAll(TOKEN)) {
    const { phrase, literal, qualified, word, number } = match.groups;
    let rendered = null;
    if (phrase) rendered = `<em class="tok-em">${escapeHtml(phrase)}</em>`;
    else if (literal) rendered = code('literal', literal);
    else if (qualified) {
      const [table, column] = qualified.split('.');
      rendered = `${code('table', table)}<span class="tok-dot">.</span>${code('column', column)}`;
    } else if (word) {
      const key = word.toLocaleLowerCase('fr');
      if (EMPHASIS.has(key)) rendered = `<em class="tok-em">${escapeHtml(word)}</em>`;
      else if (tableNames.has(key)) rendered = code('table', word);
      else if (columnNames.has(key) || TYPES.test(text.slice(match.index + word.length))) rendered = code('column', word);
      else if (values.has(word)) rendered = code('literal', word);
      else if (/^[A-Z][A-Z_]+$/.test(word)) rendered = `<span class="tok-kw">${escapeHtml(word)}</span>`;
    } else if (number) rendered = `<span class="tok-num">${escapeHtml(number)}</span>`;
    if (!rendered) continue;
    html += escapeHtml(text.slice(last, match.index)) + rendered;
    last = match.index + match[0].length;
  }
  return html + escapeHtml(text.slice(last));
}
