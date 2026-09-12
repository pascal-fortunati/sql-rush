import { tokens } from './sql-policy.js';
export const identifier = s => `"${s.replaceAll('"', '""')}"`;
const serial = value => JSON.stringify(value, (_, v) => typeof v === 'bigint' ? `${v}n` : Buffer.isBuffer(v) ? v.toString('hex') : v);

function valueEqual(a, b) { return typeof a === 'number' && typeof b === 'number' ? Math.abs(a - b) <= 1e-8 * Math.max(1, Math.abs(a), Math.abs(b)) : serial(a) === serial(b); }
function rowEqual(a, b) { return a.length === b.length && a.every((v, i) => valueEqual(v, b[i])); }
export function rowsEqual(actual, expected, orderMatters = false) {
  if (actual.length !== expected.length) return false;
  if (orderMatters) return actual.every((row, i) => rowEqual(row, expected[i]));
  // Multiset comparison preserves duplicates and handles floating point calculations.
  const unused = [...expected];
  return actual.every(row => { const i = unused.findIndex(other => rowEqual(row, other)); if (i < 0) return false; unused.splice(i, 1); return true; });
}
export function resultsEqual(actual, expected, exercise) {
  if (actual.columns.length !== expected.columns.length) return false;
  if (exercise.strictColumns && actual.columns.some((c, i) => c.toLowerCase() !== expected.columns[i].toLowerCase())) return false;
  // Native origin metadata catches a wrong column even when both result sets are empty.
  if (expected.origins?.some((o, i) => o.column && actual.origins?.[i]?.column && (o.column !== actual.origins[i].column || o.table !== actual.origins[i].table))) return false;
  return rowsEqual(actual.rows, expected.rows, exercise.orderMatters);
}
export function collectRows(statement) {
  const metadata = statement.columns(); const columns = metadata.map(c => c.name); const rows = []; let bytes = 0;
  if (columns.length > 40) throw new Error('Trop de colonnes : maximum 40.');
  for (const raw of statement.raw().iterate()) {
    const row = raw.map(v => Buffer.isBuffer(v) ? `0x${v.toString('hex')}` : typeof v === 'bigint' ? v.toString() : v);
    bytes += Buffer.byteLength(JSON.stringify(row));
    if (rows.length >= 500 || bytes > 256000) throw new Error('Résultat trop volumineux : maximum 500 lignes et 256 Ko. Ajoute un filtre ou LIMIT.');
    rows.push(row);
  }
  return { columns, rows, origins: metadata.map(c => ({ table: c.table, column: c.column })) };
}
const normDefault = v => v === null ? null : v.replace(/^\((.*)\)$/, '$1').trim();
export function snapshot(db) {
  return db.prepare("SELECT name,sql FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(table => {
    const name = identifier(table.name);
    const columns = db.prepare(`PRAGMA table_xinfo(${name})`).all().map(c => ({ name: c.name.toLowerCase(), type: c.type.toUpperCase(), notnull: c.notnull, default: normDefault(c.dflt_value), pk: c.pk, hidden: c.hidden }));
    const foreignKeys = db.prepare(`PRAGMA foreign_key_list(${name})`).all().map(({ id, ...f }) => f).sort((a, b) => serial(a).localeCompare(serial(b)));
    const unique = db.prepare(`PRAGMA index_list(${name})`).all().filter(i => i.unique).map(i => db.prepare(`PRAGMA index_xinfo(${identifier(i.name)})`).all().filter(c => c.key).map(({ name, desc, coll }) => ({ name, desc, coll }))).sort((a, b) => serial(a).localeCompare(serial(b)));
    const structure = tokens(table.sql); const checks = [];
    structure.forEach((t, i) => { if (t.value === 'check') { let depth = 0; const part = []; for (let j = i + 1; j < structure.length; j++) { const v = structure[j].value; part.push(v); if (v === '(') depth++; if (v === ')' && --depth === 0) break; } checks.push(part.join(' ')); } });
    const flags = db.prepare('PRAGMA table_list').all().find(t => t.name === table.name);
    return { name: table.name, columns, foreignKeys, unique, checks: checks.sort(), strict: flags.strict, withoutRowid: flags.wr, rows: collectRows(db.prepare(`SELECT * FROM ${name}`)).rows };
  });
}
export function statesEqual(actual, expected) {
  if (actual.length !== expected.length) return false;
  return expected.every((e, i) => { const a = actual[i]; const { rows: ar, ...as } = a; const { rows: er, ...es } = e; return serial(as) === serial(es) && rowsEqual(ar, er); });
}
