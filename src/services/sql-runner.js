import { fork } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { checkQuery } from './sql-policy.js';

const workerFile = fileURLToPath(new URL('../workers/sql-process.js', import.meta.url));
let active = 0;
const maxConcurrent = 4;
export async function runSql(exercise, query, { timeout = 1500, preview = false, playground = false } = {}) {
  if (!preview) try { checkQuery(query, playground ? { ...exercise, validationMode: 'playground' } : exercise); } catch (e) { return { success: false, correct: false, columns: [], rows: [], executionTime: 0, error: e.message, message: e.message }; }
  if (active >= maxConcurrent) return { success: false, busy: true, message: 'Les ateliers SQL sont occupés. Réessaie dans quelques secondes.' };
  active++;
  return new Promise(resolve => {
    // The child inherits no application secret. A process can be force-killed even
    // while SQLite is executing native code, unlike terminating a JS worker.
    const child = fork(workerFile, [], { execArgv: ['--max-old-space-size=64'], env: { SystemRoot: process.env.SystemRoot || '', PATH: process.env.PATH || '' }, stdio: ['ignore', 'ignore', 'ignore', 'ipc'], windowsHide: true });
    let result; let settled = false;
    const finish = () => { if (settled) return; settled = true; clearTimeout(timer); active--; resolve(result || { success: false, correct: false, message: 'Le moteur SQL a interrompu cette requête. Réduis sa complexité.', error: 'Processus SQL interrompu', columns: [], rows: [] }); };
    const timer = setTimeout(() => { result = { success: false, correct: false, timeout: true, columns: [], rows: [], executionTime: timeout, error: 'Délai dépassé', message: 'La requête a dépassé le temps autorisé (1 500 ms).' }; child.kill('SIGKILL'); }, timeout);
    child.once('message', message => { result = message; });
    child.once('error', () => { result = { success: false, message: 'Impossible de démarrer le moteur SQL.' }; finish(); });
    child.once('exit', finish);
    child.send({ exercise, query, preview, playground });
  });
}
const previews = new Map();
export async function previewDatabase(exercise) {
  const key = exercise.datasetId || exercise.id;
  if (!previews.has(key)) {
    const result = await runSql(exercise, '', { preview: true });
    if (!result.success) throw new Error(result.message);
    previews.set(key, result.tables);
  }
  return previews.get(key);
}
