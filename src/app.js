import express from 'express';
import session from 'express-session';
import bcrypt from 'bcrypt';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { randomBytes, randomUUID, timingSafeEqual, randomInt } from 'node:crypto';
import { resolve } from 'node:path';
import { openDatabase, SQLiteSessionStore } from './config/database.js';
import { exercises, exerciseById, levels, cheatsheet } from './content/exercises.js';
import { datasets, datasetById } from './content/datasets.js';
import { runSql, previewDatabase } from './services/sql-runner.js';
import { recordAttempt, statsFor, progressFor, awardBadge } from './services/progress.js';
import { statementHtml } from './views/helpers/statement.js';
import { advancedSelect } from './views/helpers/select.js';

const safeUser = u => u ? Object.fromEntries(Object.entries(u).filter(([key]) => !['password_hash', 'email'].includes(key))) : null;
const shuffle = items => { const result = [...items]; for (let i = result.length - 1; i > 0; i--) { const j = randomInt(i + 1);[result[i], result[j]] = [result[j], result[i]]; } return result; };
const saveSession = req => new Promise((resolve, reject) => req.session.save(err => err ? reject(err) : resolve()));
const regenerate = req => new Promise((resolve, reject) => req.session.regenerate(err => err ? reject(err) : resolve()));

export function createApp({ db = openDatabase(), secret = process.env.SESSION_SECRET, secure = process.env.COOKIE_SECURE === 'true', trustProxy = Number(process.env.TRUST_PROXY || 0), rateLimits = true } = {}) {
  if (!secret || secret.length < 32) throw new Error('SESSION_SECRET absent ou trop court. Exécute npm run setup.');
  const app = express(); const store = new SQLiteSessionStore(db); const busyUsers = new Set();
  app.locals.db = db; app.locals.sessionStore = store; app.locals.statementHtml = statementHtml; app.locals.advancedSelect = advancedSelect;
  app.disable('x-powered-by'); if (trustProxy) app.set('trust proxy', trustProxy);
  app.set('view engine', 'ejs'); app.set('views', resolve('src/views'));
  app.use(helmet({ contentSecurityPolicy: { directives: { 'script-src': ["'self'"], 'style-src': ["'self'", "'unsafe-inline'"], 'font-src': ["'self'"], 'img-src': ["'self'", 'data:'], 'connect-src': ["'self'"], 'upgrade-insecure-requests': secure ? [] : null } } }));
  app.use(express.static(resolve('public'), { maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0 }));
  app.use(express.urlencoded({ extended: false, limit: '20kb' })); app.use(express.json({ limit: '20kb' }));
  app.use(session({ name: 'sqlrush.sid', secret, store, resave: false, saveUninitialized: false, cookie: { httpOnly: true, sameSite: 'lax', secure, maxAge: 7 * 86400000 } }));
  app.use((req, res, next) => {
    req.session.csrf ||= randomBytes(32).toString('hex');
    req.user = req.session.userId ? db.prepare('SELECT * FROM users WHERE id=?').get(req.session.userId) : null;
    res.locals = { ...res.locals, user: safeUser(req.user), csrf: req.session.csrf, path: req.path, title: 'SQL Rush DWWM', examLayout: false, levels, totalExercises: exercises.length };
    res.set('Cache-Control', 'no-store');
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      const supplied = req.get('x-csrf-token') || req.body?._csrf;
      if (typeof supplied !== 'string' || !/^[a-f0-9]{64}$/.test(supplied) || !timingSafeEqual(Buffer.from(supplied), Buffer.from(req.session.csrf))) return res.status(403).format({ json: () => res.json({ success: false, message: 'La session a expiré. Recharge la page avant de réessayer.' }), html: () => res.render('error', { title: 'Session expirée', message: 'Recharge la page, puis réessaie.' }) });
    }
    next();
  });
  const loginRequired = (req, res, next) => { if (req.user) return next(); if (req.path.startsWith('/api/')) return res.status(401).json({ success: false, message: 'Reconnecte-toi pour continuer.' }); res.redirect('/login'); };
  const authLimit = rateLimits ? rateLimit({ windowMs: 15 * 60000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false, message: 'Trop de tentatives de connexion. Réessaie dans 15 minutes.' }) : (_q, _r, n) => n();
  const sqlLimit = rateLimits ? rateLimit({ windowMs: 60000, limit: 60, standardHeaders: 'draft-8', legacyHeaders: false, keyGenerator: req => String(req.user.id), message: { success: false, message: 'Fais une courte pause : 60 exécutions par minute maximum.' } }) : (_q, _r, n) => n();
  app.get('/', (req, res) => res.redirect(req.user ? '/dashboard' : '/login'));
  for (const page of ['login', 'register']) app.get('/' + page, (req, res) => req.user ? res.redirect('/dashboard') : res.render('auth', { title: page === 'login' ? 'Connexion' : 'Créer mon compte', page, error: null, values: {} }));
  app.post('/register', authLimit, async (req, res) => {
    const { pseudo = '', email = '', password = '' } = req.body;
    const values = { pseudo: typeof pseudo === 'string' ? pseudo.trim() : '', email: typeof email === 'string' ? email.trim().toLowerCase() : '' };
    let error;
    if (!/^[\p{L}\p{N}_ .-]{2,24}$/u.test(values.pseudo)) error = 'Le pseudo doit contenir 2 à 24 lettres, chiffres, espaces ou caractères . _ -.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email) || values.email.length > 254) error = 'Renseigne une adresse email valide.';
    else if (typeof password !== 'string' || password.length < 10 || Buffer.byteLength(password) > 72) error = 'Le mot de passe doit contenir au moins 10 caractères et au maximum 72 octets.';
    if (error) return res.status(400).render('auth', { page: 'register', title: 'Créer mon compte', error, values });
    const hash = await bcrypt.hash(password, 12);
    let userId;
    try { userId = Number(db.prepare('INSERT INTO users(pseudo,email,password_hash) VALUES(?,?,?)').run(values.pseudo, values.email, hash).lastInsertRowid); } catch (e) { if (e.code?.startsWith('SQLITE_CONSTRAINT')) return res.status(409).render('auth', { page: 'register', title: 'Créer mon compte', error: 'Ce pseudo ou cette adresse email est déjà utilisé.', values }); throw e; }
    await regenerate(req); req.session.userId = userId; req.session.csrf = randomBytes(32).toString('hex'); await saveSession(req); res.redirect('/dashboard');
  });
  const dummyHash = bcrypt.hashSync(randomBytes(24).toString('hex'), 12);
  app.post('/login', authLimit, async (req, res) => {
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body.password === 'string' && Buffer.byteLength(req.body.password) <= 72 ? req.body.password : '';
    const user = db.prepare('SELECT * FROM users WHERE email=?').get(email);
    const matches = await bcrypt.compare(password, user?.password_hash || dummyHash);
    if (!user || !matches) return res.status(401).render('auth', { page: 'login', title: 'Connexion', values: { email }, error: 'Email ou mot de passe incorrect.' });
    await regenerate(req); req.session.userId = user.id; req.session.csrf = randomBytes(32).toString('hex'); await saveSession(req); res.redirect('/dashboard');
  });
  app.post('/logout', (req, res, next) => req.session.destroy(err => { if (err) return next(err); res.clearCookie('sqlrush.sid', { path: '/' }); res.redirect('/login'); }));
  app.use(loginRequired);
  app.get('/dashboard', (req, res) => {
    const stats = statsFor(db, req.user.id); const next = exercises.find(e => !stats.solved.has(e.id)) || exercises[0];
    const recent = db.prepare('SELECT a.*,e.title,e.category FROM attempts a JOIN exercises e ON e.id=a.exercise_id WHERE user_id=? ORDER BY a.id DESC LIMIT 5').all(req.user.id);
    res.render('dashboard', { title: 'Mon tableau de bord', stats, next, recent });
  });
  app.get('/training', (req, res) => {
    const stats = statsFor(db, req.user.id); const level = Number(req.query.level) || 0; const search = String(req.query.q || '').slice(0, 100); const status = String(req.query.status || '');
    const filtered = exercises.filter(e => (!level || e.level === level) && (!search || `${e.title} ${e.statement} ${e.tags.join(' ')}`.toLocaleLowerCase('fr').includes(search.toLocaleLowerCase('fr'))) && (!status || (status === 'done' ? stats.solved.has(e.id) : !stats.solved.has(e.id))));
    const perPage = 24;
    const pages = Math.max(1, Math.ceil(filtered.length / perPage)); const page = Math.min(pages, Math.max(1, Number.parseInt(req.query.page) || 1));
    res.render('training', { title: 'L’atelier SQL', stats, items: filtered.slice((page - 1) * perPage, page * perPage), count: filtered.length, level, search, status, page, pages, perPage });
  });
  function weakExercises(userId) {
    const rows = db.prepare('SELECT exercise_id,COUNT(*) n FROM attempts WHERE user_id=? AND success=0 GROUP BY exercise_id ORDER BY n DESC').all(userId);
    const stats = statsFor(db, userId); const categories = new Map(); rows.forEach(r => { const e = exerciseById.get(r.exercise_id); if (e) categories.set(e.level, (categories.get(e.level) || 0) + r.n); });
    // Weight categories by observed errors; an unsolved error gets two extra chances.
    return exercises.flatMap(e => Array.from({ length: categories.get(e.level) ? Math.min(12, categories.get(e.level)) + (rows.some(r => r.exercise_id === e.id) && !stats.solved.has(e.id) ? 2 : 0) : 0 }, () => e));
  }
  app.get('/training/random', (req, res) => {
    const weak = req.query.weak === '1' ? weakExercises(req.user.id) : [];
    const pool = weak.length ? weak : exercises; res.redirect('/training/' + pool[randomInt(pool.length)].id);
  });
  async function renderExercise(res, exercise, { mode = 'training', run = null, progress = null } = {}) {
    const tables = await previewDatabase(exercise);
    const index = exercises.findIndex(e => e.id === exercise.id);
    res.render('exercise', { title: mode === 'exam' ? 'Question au tableau' : exercise.title, examLayout: mode === 'exam', exercise, tables, mode, run, progress, number: index + 1, nextUrl: '/training/' + exercises[(index + 1) % exercises.length].id });
  }
  app.get('/training/:id', async (req, res) => {
    const e = exerciseById.get(req.params.id); if (!e) return res.status(404).render('error', { title: 'Exercice introuvable', message: 'Choisis un exercice dans l’atelier.' });
    await renderExercise(res, e, { progress: progressFor(db, req.user.id, e.id) });
  });
  app.post('/api/exercises/:id/hint', (req, res) => {
    const e = exerciseById.get(req.params.id); if (!e) return res.sendStatus(404);
    const p = progressFor(db, req.user.id, e.id); const count = Math.min(3, p.hints_used + 1);
    db.prepare('UPDATE user_progress SET hints_used=? WHERE user_id=? AND exercise_id=?').run(count, req.user.id, e.id);
    res.json({ success: true, hints: e.hints.slice(0, count), hintsUsed: count });
  });
  app.post('/api/exercises/:id/solution', (req, res) => {
    const e = exerciseById.get(req.params.id); if (!e) return res.sendStatus(404);
    progressFor(db, req.user.id, e.id); db.prepare('UPDATE user_progress SET solution_seen=1 WHERE user_id=? AND exercise_id=?').run(req.user.id, e.id);
    res.json({ success: true, solution: e.solutionSql, explanation: e.explanation });
  });
  app.post('/api/exercises/:id/run', sqlLimit, async (req, res) => {
    const e = exerciseById.get(req.params.id); if (!e) return res.sendStatus(404);
    await grade(req, res, e, 'training');
  });
  async function grade(req, res, exercise, mode, run = null) {
    const query = req.body.query;
    if (typeof query !== 'string' || !query.trim() || Buffer.byteLength(query) > 12000) return res.status(400).json({ success: false, message: 'Saisis une requête de 1 à 12 000 octets.' });
    if (busyUsers.has(req.user.id)) return res.status(429).json({ success: false, message: 'Une requête est déjà en cours. Patiente un instant.' });
    busyUsers.add(req.user.id);
    try {
      const result = await runSql(exercise, query);
      if (result.busy) return res.status(503).json(result);
      const outcome = db.transaction(() => {
        const reward = recordAttempt(db, req.user.id, exercise, query, result, mode);
        if (run) {
          const answers = JSON.parse(run.answers); const ids = JSON.parse(run.exercise_ids);
          const correct = !!(result.success && result.correct); const position = currentIndex(answers);
          const previous = answers[position] || null;
          // L'examen ne comptabilise qu'une validation ; le sprint reste ouvert jusqu'à la bonne réponse.
          answers[position] = {
            exerciseId: exercise.id, attemptCount: (previous?.attemptCount || 0) + 1,
            firstAttemptCorrect: previous ? previous.firstAttemptCorrect : correct,
            resolved: correct, skipped: false, done: mode === 'exam' || correct, correct,
            query, time: result.executionTime || 0, result, answeredAt: Date.now()
          };
          const finished = answers.length === ids.length && answers.every(a => a.done);
          db.prepare('UPDATE runs SET answers=?,finished_at=? WHERE id=?').run(JSON.stringify(answers), finished ? Date.now() : null, run.id);
          if (mode === 'sprint' && finished && answers.length >= 10 && answers.every(a => a.firstAttemptCorrect)) awardBadge(db, req.user.id, 'sprint');
          Object.assign(reward, { done: answers[position].done, attemptCount: answers[position].attemptCount, firstAttemptCorrect: answers[position].firstAttemptCorrect, resolved: correct });
          reward.nextUrl = mode === 'exam' ? '/exam' : '/sprint/' + run.id;
          if (answers[position].done) { reward.solution = exercise.solutionSql; reward.explanation = exercise.explanation; }
        }
        return reward;
      })();
      res.json({ ...result, ...outcome });
    } finally { busyUsers.delete(req.user.id); }
  }
  // Une question reste « courante » tant qu'elle n'est ni résolue ni passée.
  const currentIndex = answers => { const pending = answers.findIndex(a => !a.done); return pending >= 0 ? pending : answers.length; };
  const runStats = details => ({
    firstTry: details.filter(a => a.firstAttemptCorrect ?? a.correct).length,
    resolved: details.filter(a => a.resolved ?? a.correct).length,
    attempts: details.reduce((total, a) => total + (a.attemptCount ?? 1), 0)
  });
  app.get('/exam', (req, res) => res.render('modes', { title: 'Mode Examen', mode: 'exam' }));
  function startRun(req, res, mode) {
    const difficulty = ['Facile', 'Normale', 'Difficile'].includes(req.body.difficulty) ? req.body.difficulty : null;
    const count = mode === 'exam' ? 1 : ([5, 10, 20].includes(Number(req.body.count)) ? Number(req.body.count) : 10);
    const pool = exercises.filter(e => e.examEligible && (!difficulty || e.difficulty === difficulty));
    const ids = shuffle(pool).slice(0, count).map(e => e.id); const id = randomUUID();
    db.prepare('INSERT INTO runs(id,user_id,mode,exercise_ids,started_at) VALUES(?,?,?,?,?)').run(id, req.user.id, mode, JSON.stringify(ids), Date.now());
    res.redirect(`/${mode}/${id}`);
  }
  app.post('/exam/start', (req, res) => startRun(req, res, 'exam'));
  app.get('/sprint', (req, res) => res.render('modes', { title: 'Sprint SQL', mode: 'sprint' }));
  app.post('/sprint/start', (req, res) => startRun(req, res, 'sprint'));
  const getRun = (req, mode) => db.prepare('SELECT * FROM runs WHERE id=? AND user_id=? AND mode=?').get(req.params.id || req.body.runId, req.user.id, mode);
  for (const mode of ['exam', 'sprint']) {
    app.get(`/${mode}/:id`, async (req, res) => {
      const run = getRun(req, mode); if (!run) return res.status(404).render('error', { title: 'Session introuvable', message: 'Lance une nouvelle session pour continuer.' });
      const ids = JSON.parse(run.exercise_ids); const answers = JSON.parse(run.answers);
      if (run.finished_at) {
        const details = answers.map(a => ({ ...a, exercise: exerciseById.get(a.exerciseId) }));
        const weak = [...new Set(details.filter(a => !(a.firstAttemptCorrect ?? a.correct)).map(a => a.exercise.tags[0]))];
        return res.render('summary', { title: mode === 'exam' ? 'Retour du jury' : 'Bilan du sprint', run, details, weak, stats: runStats(details), score: details.filter(a => a.resolved ?? a.correct).length, duration: Math.round((run.finished_at - run.started_at) / 1000), examLayout: mode === 'exam' });
      }
      const position = currentIndex(answers);
      await renderExercise(res, exerciseById.get(ids[position]), { mode, run: { id: run.id, current: position + 1, total: ids.length, startedAt: run.started_at, done: answers.filter(a => a.done).length, attempts: answers[position]?.attemptCount || 0 } });
    });
    app.post(`/api/${mode}/run`, sqlLimit, async (req, res) => {
      if (typeof req.body.runId !== 'string') return res.status(400).json({ success: false, message: 'Session manquante.' });
      const run = getRun(req, mode); if (!run) return res.sendStatus(404);
      const ids = JSON.parse(run.exercise_ids); const answers = JSON.parse(run.answers); const position = currentIndex(answers);
      if (run.finished_at || position >= ids.length || req.body.exerciseId !== ids[position]) return res.status(409).json({ success: false, message: 'Cette question a déjà été validée. Passe à la suite.' });
      await grade(req, res, exerciseById.get(ids[position]), mode, run);
    });
  }
  app.post('/api/sprint/skip', (req, res) => {
    const run = getRun(req, 'sprint'); if (!run) return res.sendStatus(404);
    const ids = JSON.parse(run.exercise_ids); const answers = JSON.parse(run.answers); const position = currentIndex(answers);
    if (run.finished_at || position >= ids.length || req.body.exerciseId !== ids[position]) return res.status(409).json({ success: false, message: 'Cette question est déjà terminée.' });
    const previous = answers[position] || null;
    answers[position] = {
      exerciseId: ids[position], attemptCount: previous?.attemptCount || 0, firstAttemptCorrect: false, resolved: false, skipped: true, done: true, correct: false,
      query: previous?.query || '', time: 0, result: previous?.result || { success: false, columns: [], rows: [] }, answeredAt: Date.now()
    };
    const finished = answers.every(a => a.done) && answers.length === ids.length;
    db.prepare('UPDATE runs SET answers=?,finished_at=? WHERE id=?').run(JSON.stringify(answers), finished ? Date.now() : null, run.id);
    res.json({ success: true, skipped: true, nextUrl: '/sprint/' + run.id });
  });
  app.get('/review', (req, res) => {
    const stats = statsFor(db, req.user.id);
    const errors = db.prepare('SELECT a.*,e.title,e.category,p.solved FROM attempts a JOIN exercises e ON e.id=a.exercise_id LEFT JOIN user_progress p ON p.user_id=a.user_id AND p.exercise_id=a.exercise_id WHERE a.user_id=? AND a.success=0 ORDER BY a.id DESC LIMIT 30').all(req.user.id);
    res.render('review', { title: 'Mes erreurs, mes progrès', stats, errors });
  });
  app.get('/leaderboard', (req, res) => {
    const users = db.prepare('SELECT pseudo,xp,level,solved_count,best_streak,id FROM users ORDER BY xp DESC,solved_count DESC,id LIMIT 500').all();
    res.render('leaderboard', { title: 'La promotion', users, datatable: true });
  });
  app.get('/playground', async (req, res) => {
    const dataset = datasetById.get(String(req.query.dataset)) || datasets[3];
    const exercise = { ...dataset, datasetId: dataset.id, title: 'Le bac à sable', statement: 'Explore les données librement. Chaque exécution repart de la base de départ.', notion: 'Une instruction par exécution. Aucun score.', id: dataset.id, validationMode: 'playground', tags: [], level: 0 };
    res.render('exercise', { title: 'Le bac à sable', exercise, tables: await previewDatabase(exercise), mode: 'playground', run: null, progress: null, number: 0, nextUrl: null, datasets });
  });
  app.post('/api/playground/run', sqlLimit, async (req, res) => {
    const d = datasetById.get(req.body.datasetId); if (!d) return res.status(400).json({ success: false, message: 'Jeu de données inconnu.' });
    if (busyUsers.has(req.user.id)) return res.status(429).json({ success: false, message: 'Une requête est déjà en cours.' });
    busyUsers.add(req.user.id); try { res.json(await runSql({ ...d, validationMode: 'playground' }, req.body.query, { playground: true })); } finally { busyUsers.delete(req.user.id); }
  });
  app.get('/cheatsheet', (req, res) => res.render('cheatsheet', { title: 'Aide-mémoire SQL', examples: cheatsheet }));
  app.use((req, res) => res.status(404).render('error', { title: 'Page introuvable', message: 'Cette page n’existe pas. Retrouve ton parcours depuis le tableau de bord.' }));
  app.use((error, req, res, _next) => {
    console.error('Erreur serveur :', error.code || error.name, error.message);
    const status = error.status === 413 ? 413 : 500; const message = status === 413 ? 'La requête envoyée est trop volumineuse.' : 'Une erreur est survenue. Réessaie dans quelques instants.';
    if (req.path.startsWith('/api/')) return res.status(status).json({ success: false, message });
    res.status(status).render('error', { title: 'Un petit contretemps', message });
  });
  return app;
}
