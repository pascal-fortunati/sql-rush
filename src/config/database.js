import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import session from 'express-session';
import { exercises } from '../content/exercises.js';

export function openDatabase(filename = resolve('data/app.db')) {
  if (filename !== ':memory:') mkdirSync(dirname(filename), { recursive: true });
  const db = new Database(filename);
  db.pragma('journal_mode = WAL'); db.pragma('foreign_keys = ON'); db.pragma('busy_timeout = 5000');
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY, pseudo TEXT NOT NULL UNIQUE COLLATE NOCASE, email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL, xp INTEGER NOT NULL DEFAULT 0, level INTEGER NOT NULL DEFAULT 1,
      current_streak INTEGER NOT NULL DEFAULT 0, best_streak INTEGER NOT NULL DEFAULT 0,
      solved_count INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, last_activity TEXT
    );
    CREATE TABLE IF NOT EXISTS exercises (id TEXT PRIMARY KEY, title TEXT NOT NULL, level INTEGER NOT NULL, category TEXT NOT NULL, tags TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS attempts (
      id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      exercise_id TEXT NOT NULL REFERENCES exercises(id), query TEXT NOT NULL, success INTEGER NOT NULL,
      execution_time REAL NOT NULL DEFAULT 0, hints_used INTEGER NOT NULL DEFAULT 0,
      mode TEXT NOT NULL DEFAULT 'training', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS attempts_user ON attempts(user_id,exercise_id,created_at);
    CREATE TABLE IF NOT EXISTS user_progress (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, exercise_id TEXT NOT NULL REFERENCES exercises(id),
      solved INTEGER NOT NULL DEFAULT 0, hints_used INTEGER NOT NULL DEFAULT 0,
      solution_seen INTEGER NOT NULL DEFAULT 0, solved_at TEXT, PRIMARY KEY(user_id,exercise_id)
    );
    CREATE TABLE IF NOT EXISTS badges (id TEXT PRIMARY KEY, name TEXT NOT NULL, icon TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS user_badges (user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, badge_id TEXT NOT NULL REFERENCES badges(id), earned_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(user_id,badge_id));
    CREATE TABLE IF NOT EXISTS sessions (sid TEXT PRIMARY KEY, data TEXT NOT NULL, expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS runs (id TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, mode TEXT NOT NULL, exercise_ids TEXT NOT NULL, answers TEXT NOT NULL DEFAULT '[]', started_at INTEGER NOT NULL, finished_at INTEGER);
    CREATE INDEX IF NOT EXISTS runs_user ON runs(user_id,started_at);
  `);
  db.transaction(() => {
    const insert = db.prepare('INSERT INTO exercises(id,title,level,category,tags) VALUES(?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET title=excluded.title,level=excluded.level,category=excluded.category,tags=excluded.tags');
    exercises.forEach(e => insert.run(e.id, e.title, e.level, e.category, JSON.stringify(e.tags)));
    const badge = db.prepare('INSERT OR IGNORE INTO badges VALUES(?,?,?)');
    [['first', 'Premier SELECT', 'database'], ['ten', '10 bonnes réponses', 'star'], ['fifty', '50 bonnes réponses', 'military_tech'], ['hundred', '100 bonnes réponses', 'workspace_premium'], ['where', 'Maître du WHERE', 'filter_alt'], ['join', 'Roi des JOIN', 'join_inner'], ['aggregate', 'Agrégateur', 'functions'], ['no-hint', 'Sans indice', 'lightbulb'], ['sprint', '10/10 Sprint', 'bolt'], ['exam', 'Survivant du tableau', 'school']].forEach(b => badge.run(...b));
  })();
  return db;
}

export class SQLiteSessionStore extends session.Store {
  constructor(db) { super(); this.db = db; this.timer = setInterval(() => db.prepare('DELETE FROM sessions WHERE expires < ?').run(Date.now()), 3600000); this.timer.unref(); }
  get(sid, callback) { try { const row = this.db.prepare('SELECT data FROM sessions WHERE sid=? AND expires>?').get(sid, Date.now()); callback(null, row ? JSON.parse(row.data) : null); } catch (e) { callback(e); } }
  set(sid, data, callback = () => { }) { try { const expires = data.cookie.expires ? new Date(data.cookie.expires).getTime() : Date.now() + 7 * 86400000; this.db.prepare('INSERT INTO sessions VALUES(?,?,?) ON CONFLICT(sid) DO UPDATE SET data=excluded.data,expires=excluded.expires').run(sid, JSON.stringify(data), expires); callback(); } catch (e) { callback(e); } }
  destroy(sid, callback = () => { }) { try { this.db.prepare('DELETE FROM sessions WHERE sid=?').run(sid); callback(); } catch (e) { callback(e); } }
  touch(sid, data, callback = () => { }) { try { this.db.prepare('UPDATE sessions SET expires=? WHERE sid=?').run(new Date(data.cookie.expires).getTime(), sid); callback(); } catch (e) { callback(e); } }
  close() { clearInterval(this.timer); }
}
