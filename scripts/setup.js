import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { openDatabase } from '../src/config/database.js';

if (!existsSync('.env')) writeFileSync('.env', readFileSync('.env.example', 'utf8').replace('SESSION_SECRET=', 'SESSION_SECRET=' + randomBytes(48).toString('hex')), { mode: 0o600 });
else {
  const content = readFileSync('.env', 'utf8');
  if (/^SESSION_SECRET=\s*$/m.test(content)) writeFileSync('.env', content.replace(/^SESSION_SECRET=\s*$/m, 'SESSION_SECRET=' + randomBytes(48).toString('hex')), { mode: 0o600 });
}
const db = openDatabase();
console.log(`Base initialisée : ${db.prepare('SELECT COUNT(*) n FROM exercises').get().n} exercices. Aucun compte de démonstration ni mot de passe prédéfini.`);
db.close();
