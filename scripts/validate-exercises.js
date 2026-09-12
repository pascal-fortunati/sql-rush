import assert from 'node:assert/strict';
import { exercises, levels } from '../src/content/exercises.js';
import { runSql } from '../src/services/sql-runner.js';

assert.equal(new Set(exercises.map(e => e.id)).size, exercises.length, 'Les identifiants doivent être uniques.');
assert.ok(exercises.length >= 200);
let failed = 0;
for (let offset = 0; offset < exercises.length; offset += 4) {
  await Promise.all(exercises.slice(offset, offset + 4).map(async e => {
    for (const field of ['title', 'statement', 'difficulty', 'category', 'schemaSql', 'seedSql', 'solutionSql', 'explanation', 'notion']) assert.ok(e[field], `${e.id}: champ absent ${field}`);
    assert.equal(e.hints.length, 3);
    const result = await runSql(e, e.solutionSql);
    if (!result.success || !result.correct) { console.error(`ÉCHEC ${e.id}: ${result.error || result.message}`); failed++; }
    else if (e.validationMode === 'result' && !result.rows.length && e.tags[0] !== 'Résultat vide') { console.error(`ÉCHEC ${e.id}: résultat vide non prévu pédagogiquement`); failed++; }
  }));
  if (offset % 40 === 0) console.log(`${Math.min(offset + 4, exercises.length)} / ${exercises.length} solutions exécutées`);
}
for (const l of levels) console.log(`Niveau ${l.id} — ${l.name} : ${exercises.filter(e => e.level === l.id).length}`);
console.log(`${exercises.length - failed}/${exercises.length} exercices validés (schéma, données, solution, résultat ou état final).`);
process.exitCode = failed ? 1 : 0;
