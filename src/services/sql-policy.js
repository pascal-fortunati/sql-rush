// A lexer, rather than a regex applied to raw SQL: comments and quoted identifiers
// must never conceal an ATTACH, a PRAGMA or a function call.
export function tokens(sql) {
  const result = [];
  for (let i = 0; i < sql.length;) {
    const c = sql[i];
    if (/\s/.test(c)) { i++; continue; }
    if (sql.startsWith('--', i)) { const end = sql.indexOf('\n', i); i = end < 0 ? sql.length : end + 1; continue; }
    if (sql.startsWith('/*', i)) { const end = sql.indexOf('*/', i + 2); if (end < 0) throw new Error('Commentaire SQL non terminé.'); i = end + 2; continue; }
    if (['\'', '"', '`', '['].includes(c)) {
      const end = c === '[' ? ']' : c; let value = ''; let closed = false; i++;
      while (i < sql.length) { if (sql[i] === end) { if (c !== '[' && sql[i + 1] === end) { value += end; i += 2; } else { i++; closed = true; break; } } else value += sql[i++]; }
      if (!closed) throw new Error('Une chaîne ou un identifiant n’est pas refermé. Vérifie les quotes.');
      result.push({ value: value.toLowerCase(), kind: c === "'" ? 'string' : 'identifier' }); continue;
    }
    if (/[a-z_\u0080-\uffff]/i.test(c)) { let value = ''; while (i < sql.length && /[\w$\u0080-\uffff]/.test(sql[i])) value += sql[i++]; result.push({ value: value.toLowerCase(), kind: 'word' }); continue; }
    result.push({ value: c, kind: 'symbol' }); i++;
  }
  return result;
}
const forbidden = new Set('attach detach pragma vacuum load_extension readfile writefile eval shell system import export fts3_tokenizer virtual trigger analyze reindex'.split(' '));
const allowedFunctions = new Set('count sum avg min max total round abs lower upper length substr substring trim ltrim rtrim coalesce ifnull nullif iif typeof cast date time datetime strftime julianday unixepoch replace instr printf format concat concat_ws group_concat string_agg char unicode hex unhex likelihood likely unlikely'.split(' '));
const beforeParen = new Set('in exists as values select from where on and or not having by over partition key unique check references default integer text real numeric decimal varchar'.split(' '));

export function checkQuery(query, exercise) {
  if (typeof query !== 'string' || !query.trim()) throw new Error('Écris une requête avant de la lancer.');
  if (Buffer.byteLength(query) > 12000) throw new Error('La requête est trop longue (12 Ko maximum).');
  if (query.includes('\0')) throw new Error('Caractère SQL non autorisé.');
  const list = tokens(query); const words = list.map(t => t.value);
  if (!['select', 'with', 'insert', 'update', 'delete', 'create', 'alter', 'drop'].includes(words[0])) {
    const start = /^[a-z_]\w{0,23}$/i.test(words[0] || '') ? ` : « ${words[0].toUpperCase()} »` : '';
    throw new Error(`Instruction SQL non reconnue${start}. Une requête commence par SELECT, WITH, INSERT, UPDATE, DELETE, CREATE, ALTER ou DROP.`);
  }
  if (list.some((t, i) => t.value === ';' && i !== list.length - 1)) throw new Error('Exécute une seule instruction SQL à la fois.');
  const knownNames = new Set(tokens(exercise.schemaSql).filter(t => t.kind === 'word' || t.kind === 'identifier').map(t => t.value));
  if (words[0] === 'create' && words[1] !== 'table') throw new Error('Seule la création de tables ordinaires est autorisée.');
  if (words[0] === 'drop' && words[1] !== 'table') throw new Error('Seul DROP TABLE est autorisé ici.');
  if (words[0] === 'alter' && words[1] !== 'table') throw new Error('Seul ALTER TABLE est autorisé ici.');
  // Permit the new table name and optional CTE column lists.
  list.forEach((t, i) => { if (['table', 'with'].includes(list[i - 1]?.value)) knownNames.add(t.value); });
  for (let i = 0; i < list.length; i++) {
    const t = list[i]; const functionCall = list[i + 1]?.value === '(';
    if (t.kind !== 'string' || functionCall) {
      if (forbidden.has(t.value) || t.value.startsWith('pragma_') || t.value.startsWith('sqlite_')) throw new Error('Cette opération est désactivée : les fichiers et réglages SQLite sont inaccessibles.');
    }
    if (functionCall && t.kind !== 'symbol' && !allowedFunctions.has(t.value) && !beforeParen.has(t.value) && !knownNames.has(t.value)) throw new Error(`Fonction non autorisée dans cet entraînement : ${t.value}.`);
  }
  if (exercise.validationMode === 'result' && !['select', 'with'].includes(words[0])) throw new Error('Cet exercice attend un SELECT : la base est en lecture seule.');
  if (exercise.validationMode === 'state' && !['insert', 'update', 'delete', 'with'].includes(words[0])) throw new Error('Cet exercice attend une modification des données (INSERT, UPDATE ou DELETE).');
  return query;
}
