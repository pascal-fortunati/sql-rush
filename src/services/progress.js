import { levels, exercises } from '../content/exercises.js';
export function progressFor(db, userId, exerciseId) {
  db.prepare('INSERT OR IGNORE INTO user_progress(user_id,exercise_id) VALUES(?,?)').run(userId, exerciseId);
  return db.prepare('SELECT * FROM user_progress WHERE user_id=? AND exercise_id=?').get(userId, exerciseId);
}
export function awardBadge(db, userId, id) { db.prepare('INSERT OR IGNORE INTO user_badges(user_id,badge_id) VALUES(?,?)').run(userId, id); }
export function recordAttempt(db, userId, exercise, query, result, mode = 'training') {
  return db.transaction(() => {
    const p = progressFor(db, userId, exercise.id); const success = result.success && result.correct;
    const hints = mode === 'training' ? p.hints_used : 0;
    db.prepare('INSERT INTO attempts(user_id,exercise_id,query,success,execution_time,hints_used,mode) VALUES(?,?,?,?,?,?,?)').run(userId, exercise.id, query, success ? 1 : 0, result.executionTime || 0, hints, mode);
    let xp = 0;
    if (success && !p.solved) {
      xp = p.solution_seen ? 0 : Math.max(1, exercise.xp - hints * 2) + (mode === 'exam' ? 5 : 0);
      db.prepare('UPDATE user_progress SET solved=1,solved_at=CURRENT_TIMESTAMP WHERE user_id=? AND exercise_id=?').run(userId, exercise.id);
      db.prepare('UPDATE users SET xp=xp+?,level=1+CAST((xp+?)/150 AS INTEGER),solved_count=solved_count+1,current_streak=current_streak+1,best_streak=MAX(best_streak,current_streak+1),last_activity=CURRENT_TIMESTAMP WHERE id=?').run(xp, xp, userId);
    } else if (!success) db.prepare('UPDATE users SET current_streak=0,last_activity=CURRENT_TIMESTAMP WHERE id=?').run(userId);
    else db.prepare('UPDATE users SET last_activity=CURRENT_TIMESTAMP WHERE id=?').run(userId);
    const u = db.prepare('SELECT * FROM users WHERE id=?').get(userId);
    if (success) {
      if (exercise.level === 1) awardBadge(db, userId, 'first');
      if (!hints && !p.solution_seen) awardBadge(db, userId, 'no-hint');
      if (mode === 'exam') awardBadge(db, userId, 'exam');
      for (const [n, id] of [[10, 'ten'], [50, 'fifty'], [100, 'hundred']]) if (u.solved_count >= n) awardBadge(db, userId, id);
      for (const [level, id] of [[2, 'where'], [4, 'aggregate'], [5, 'join']]) if (db.prepare('SELECT COUNT(*) n FROM user_progress p JOIN exercises e ON e.id=p.exercise_id WHERE p.user_id=? AND p.solved=1 AND e.level=?').get(userId, level).n >= 10) awardBadge(db, userId, id);
    }
    return { xp, streak: u.current_streak, totalXp: u.xp, alreadySolved: !!p.solved, solutionSeen: !!p.solution_seen };
  })();
}
export function statsFor(db, userId) {
  const totals = db.prepare('SELECT COUNT(*) attempts,COALESCE(SUM(success),0) correct FROM attempts WHERE user_id=?').get(userId);
  const progress = db.prepare('SELECT * FROM user_progress WHERE user_id=?').all(userId);
  const solved = new Set(progress.filter(p => p.solved).map(p => p.exercise_id));
  const categories = levels.map(l => {
    const group = exercises.filter(e => e.level === l.id);
    const attempts = db.prepare('SELECT COUNT(*) total,COALESCE(SUM(a.success),0) correct FROM attempts a JOIN exercises e ON a.exercise_id=e.id WHERE a.user_id=? AND e.level=?').get(userId, l.id);
    const done = group.filter(e => solved.has(e.id)).length;
    return { ...l, total: group.length, done, percent: Math.round(done / group.length * 100), attempts: attempts.total, accuracy: attempts.total ? Math.round(attempts.correct / attempts.total * 100) : null };
  });
  const badges = db.prepare('SELECT b.*,ub.earned_at FROM badges b LEFT JOIN user_badges ub ON b.id=ub.badge_id AND ub.user_id=?').all(userId);
  return { totals, solved, categories, badges, accuracy: totals.attempts ? Math.round(totals.correct / totals.attempts * 100) : 0, percent: Math.round(solved.size / exercises.length * 100) };
}
