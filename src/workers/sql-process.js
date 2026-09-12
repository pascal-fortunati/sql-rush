// Deliberately has no import of the app DB, sessions, environment config or user data.
import Database from 'better-sqlite3';
import { performance } from 'node:perf_hooks';
import { checkQuery } from '../services/sql-policy.js';
import { collectRows, snapshot, resultsEqual, statesEqual } from '../services/validation.js';

export function createExerciseDatabase(exercise) {
  const db = new Database(':memory:');
  db.pragma('temp_store = MEMORY');
  db.pragma('hard_heap_limit = 33554432');
  db.pragma('max_page_count = 2048');
  db.pragma('trusted_schema = OFF');
  db.pragma('foreign_keys = ON');
  db.exec(exercise.schemaSql); db.exec(exercise.seedSql);
  return db;
}
function execute(db, query) {
  const statement = db.prepare(query); // Rejects multiple statements independently of the lexer.
  if (statement.reader) return { ...collectRows(statement), changes: 0 };
  const { changes } = statement.run(); return { columns: [], rows: [], origins: [], changes };
}
function explainError(error) {
  const raw = error.message;
  const suggestions = [[/no such column/i, 'Vérifie les noms des colonnes. Une chaîne de caractères doit être entourée de quotes simples.'], [/no such table/i, 'Vérifie le nom de la table après FROM ou JOIN.'], [/syntax error/i, 'Vérifie les virgules, les parenthèses et l’ordre SELECT → FROM → WHERE → GROUP BY → HAVING → ORDER BY.'], [/misuse of aggregate/i, 'Les agrégats filtrent des groupes avec HAVING, après GROUP BY.'], [/ambiguous column/i, 'Précise le nom ou l’alias de la table devant cette colonne.'], [/FOREIGN KEY/i, 'La clé étrangère doit désigner une ligne existante. Un parent encore référencé ne peut pas être supprimé.'], [/UNIQUE/i, 'Cette clé ou cette valeur existe déjà ; elle doit rester unique.'], [/NOT NULL/i, 'Cette colonne obligatoire ne peut pas contenir NULL.'], [/out of memory|database or disk is full/i, 'La requête dépasse la mémoire autorisée. Réduis les calculs ou le volume des données.']];
  return { error: raw, message: suggestions.find(([pattern]) => pattern.test(raw))?.[1] || raw };
}
process.once('message', ({ exercise, query, preview, playground }) => {
  const start = performance.now(); let actual, reference;
  try {
    if (!preview) checkQuery(query, playground ? { ...exercise, validationMode: 'playground' } : exercise);
    actual = createExerciseDatabase(exercise);
    if (preview) { process.send({ success: true, tables: snapshot(actual) }); return; }
    if (exercise.validationMode === 'result' && !playground) actual.pragma('query_only = ON');
    const obtained = execute(actual, query); let correct = null; let expected;
    if (!playground) {
      reference = createExerciseDatabase(exercise);
      expected = execute(reference, exercise.solutionSql);
      correct = exercise.validationMode === 'result' ? resultsEqual(obtained, expected, exercise) : statesEqual(snapshot(actual), snapshot(reference));
    }
    // DML / DDL return a readable preview of the resulting database, too.
    const tables = obtained.columns.length ? undefined : snapshot(actual);
    const { origins, ...visible } = obtained;
    process.send({ success: true, correct, ...visible, tables, executionTime: Math.round((performance.now() - start) * 100) / 100, message: playground ? 'Requête exécutée.' : correct ? 'Requête correcte !' : 'Ta requête fonctionne, mais le résultat ne correspond pas exactement à ce qui est demandé.' });
  } catch (error) { process.send({ success: false, correct: false, columns: [], rows: [], executionTime: Math.round(performance.now() - start), ...explainError(error) }); }
  finally { actual?.close(); reference?.close(); process.disconnect(); }
});
