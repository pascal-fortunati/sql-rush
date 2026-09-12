(() => {
  const workspace = document.getElementById('sql-workspace'); if (!workspace) return;
  const { mode, exerciseId, datasetId, runId, userId } = workspace.dataset;
  const textarea = document.getElementById('sql-query'); const runButton = document.getElementById('run-query'); const resetButton = document.getElementById('reset-query');
  const panel = document.getElementById('result-panel'); const token = document.querySelector('meta[name="csrf-token"]').content;
  const sticky = document.getElementById('sticky-actions'); const stickyNext = document.getElementById('sticky-next'); const stickyStatus = document.getElementById('sticky-status');
  const timed = mode === 'exam' || mode === 'sprint'; let running = false; let submitted = false; let solved = false; let watcher = null;
  const smooth = () => matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth';
  const finePointer = () => matchMedia('(hover: hover) and (pointer: fine)').matches;
  const modKey = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent) ? '⌘' : 'Ctrl';
  // Monaco remplace le textarea une fois chargé ; le textarea reste l'éditeur de secours.
  let monacoEditor = null;
  const editor = {
    get value() { return monacoEditor ? monacoEditor.getValue() : textarea.value; },
    set value(text) { if (monacoEditor) monacoEditor.setValue(text); else textarea.value = text; },
    set readOnly(state) { textarea.readOnly = state; monacoEditor?.setReadOnly(state); },
    focus() { if (monacoEditor) monacoEditor.focus(); else textarea.focus(); }
  };
  const draftKey = `sqlrush-draft:${userId}:${mode}:${runId || exerciseId}`;
  const saveDraft = () => { try { localStorage.setItem(draftKey, editor.value); } catch { } };
  try { textarea.value = localStorage.getItem(draftKey) || ''; } catch { }
  textarea.addEventListener('input', saveDraft);
  const element = (tag, classes, text) => { const el = document.createElement(tag); if (classes) el.className = classes; if (text !== undefined) el.textContent = text; return el; };
  const icon = name => { const el = element('span', 'material-symbols-rounded', name); el.setAttribute('aria-hidden', 'true'); return el; };
  async function post(url, body = {}) {
    const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': token, Accept: 'application/json' }, body: JSON.stringify(body) });
    const type = response.headers.get('content-type') || '';
    if (!type.includes('application/json')) throw new Error('La session ou le serveur est indisponible. Recharge la page. Ton brouillon est conservé.');
    const data = await response.json(); if (!response.ok) throw new Error(data.message || 'La demande n’a pas pu être traitée. Réessaie.'); return data;
  }
  function correction(data) {
    document.getElementById('solution-sql').textContent = data.solution;
    document.getElementById('solution-explanation').textContent = data.explanation;
    document.getElementById('correction-panel').classList.remove('hidden');
  }
  function resultHead(state, title, meta) {
    const bar = element('div', `result-head result-${state}`);
    bar.append(icon(state === 'success' ? 'check_circle' : state === 'error' ? 'error' : 'manage_search'));
    const titles = element('div', 'result-headings');
    titles.append(element('h2', 'result-title', title));
    if (meta) titles.append(element('p', 'result-meta', meta));
    bar.append(titles);
    return bar;
  }
  function showError(message) { panel.replaceChildren(resultHead('error', 'Un instant', ''), element('p', 'result-note', message)); releaseSticky(); }
  function releaseSticky() { watcher?.disconnect(); watcher = null; sticky.hidden = true; }
  function armSticky(next, status) {
    stickyNext.href = next.href; stickyStatus.textContent = status;
    watcher?.disconnect();
    watcher = new IntersectionObserver(entries => { sticky.hidden = entries[0].isIntersecting; }, { threshold: 1 });
    watcher.observe(next);
  }
  // Trois états distincts : erreur SQL, requête valide mais résultat différent, réponse correcte.
  function renderResult(data) {
    panel.replaceChildren();
    const free = mode === 'playground';
    const state = data.error ? 'error' : (data.correct || free) ? 'success' : 'warning';
    const title = state === 'error' ? 'Erreur SQL' : state === 'success' ? (free ? 'Requête exécutée.' : 'Requête correcte !') : 'Pas encore.';
    const note = state === 'error' ? data.message : data.correct ? '' : free ? '' : 'Ta requête fonctionne, mais le résultat ne correspond pas exactement à ce qui est demandé.';
    const changed = data.changes || 0;
    const rows = data.columns?.length ? `${data.rows.length} ligne${data.rows.length > 1 ? 's' : ''}` : `${changed} ligne${changed > 1 ? 's' : ''} modifiée${changed > 1 ? 's' : ''}`;
    const bar = resultHead(state, title, data.success ? `${rows} · ${data.executionTime ?? 0} ms` : '');
    if (data.correct) {
      const rewards = element('div', 'result-rewards');
      rewards.append(element('span', 'badge badge-soft badge-success', `+${data.xp || 0} XP`));
      rewards.append(element('span', 'badge badge-soft badge-warning', `Série : ${data.streak || 0}`));
      bar.append(rewards);
    }
    // L'aide reste à portée après un échec ; « Question suivante » n'apparaît jamais avant la réussite.
    if (!data.correct && !data.done && mode === 'sprint') {
      const skip = element('button', 'btn btn-text btn-sm result-skip', 'Passer cette question');
      skip.type = 'button';
      skip.addEventListener('click', async () => {
        skip.disabled = true;
        try { const outcome = await post('/api/sprint/skip', { runId, exerciseId }); location.href = outcome.nextUrl; }
        catch (error) { showError(error.message); skip.disabled = false; }
      });
      bar.append(skip);
    }
    if (!data.correct && !timed && mode === 'training' && document.getElementById('hint-button')) {
      const help = element('button', 'btn btn-outline btn-sm result-next', 'Voir un indice');
      help.type = 'button'; help.addEventListener('click', () => document.getElementById('hint-button').click());
      bar.append(help);
    }
    if (data.done || data.correct) {
      const next = element('a', 'btn result-next ' + (data.correct ? 'btn-primary' : 'btn-outline'));
      next.id = 'next-exercise'; next.href = data.nextUrl || workspace.dataset.nextUrl || '/training';
      const label = timed ? (mode === 'exam' ? 'Question suivante' : 'Continuer le sprint') : 'Exercice suivant';
      next.append(document.createTextNode(label), icon('arrow_forward'));
      if (data.correct && mode !== 'exam') {
        const keys = element('span', 'next-kbd'); keys.setAttribute('aria-hidden', 'true');
        keys.append(element('kbd', 'kbd kbd-xs', modKey), element('kbd', 'kbd kbd-xs', 'Entrée'));
        next.append(keys); next.title = `${label} (${modKey} + Entrée)`; next.setAttribute('aria-keyshortcuts', 'Control+Enter Meta+Enter');
      }
      bar.append(next);
    }
    panel.append(bar);
    if (note) panel.append(element('p', 'result-note', note));
    if (data.error && data.error !== note) panel.append(element('pre', 'result-error', data.error));
    if (data.correct) {
      if (data.alreadySolved) panel.append(element('p', 'result-note', 'Déjà réussi : le réentraînement ne rapporte pas d’XP supplémentaire.'));
      else if (data.solutionSeen) panel.append(element('p', 'result-note', 'Solution consultée : la réussite est enregistrée sans XP.'));
    }
    if (data.success) {
      if (data.columns?.length) panel.append(window.sqlTable({ columns: data.columns, rows: data.rows, caption: 'Résultat de la requête SQL', tall: true }));
      if (data.tables) for (const table of data.tables) {
        panel.append(element('h3', 'result-table-title', `${table.name} · état après exécution`));
        panel.append(window.sqlTable({ columns: table.columns.map(c => ({ name: c.name, pk: c.pk })), rows: table.rows, caption: `État de ${table.name} après exécution`, tall: true }));
      }
    }
    if (data.solution) correction(data);
    const next = document.getElementById('next-exercise');
    if (next && data.correct) armSticky(next, `Correct · +${data.xp || 0} XP`);
    else if (next) armSticky(next, 'Réponse enregistrée');
    else releaseSticky();
    solved = !!data.correct;
    // Au clavier, le focus revient dans l'éditeur pour enchaîner (le panneau reste annoncé via aria-live).
    if (mode !== 'exam' && finePointer()) editor.focus();
    else { panel.tabIndex = -1; panel.focus({ preventScroll: true }); }
    const box = panel.getBoundingClientRect();
    if (box.top < 0 || box.top > innerHeight - 140) panel.scrollIntoView({ behavior: smooth(), block: 'nearest' });
  }
  async function execute() {
    if (running || submitted) return;
    if (!editor.value.trim()) { showError('Écris une requête avant de la lancer.'); editor.focus(); return; }
    running = true; runButton.disabled = true; resetButton.disabled = true; editor.readOnly = true; panel.setAttribute('aria-busy', 'true');
    const previous = runButton.innerHTML; runButton.replaceChildren(element('span', 'loading loading-spinner loading-sm'), document.createTextNode('Exécution…'));
    try {
      const url = mode === 'training' ? `/api/exercises/${exerciseId}/run` : mode === 'playground' ? '/api/playground/run' : `/api/${mode}/run`;
      const data = await post(url, { query: editor.value, exerciseId, datasetId, runId });
      if (data.busy) { showError(data.message); return; }
      if (data.done) submitted = true;
      renderResult(data);
      if (data.correct || data.done) try { localStorage.removeItem(draftKey); } catch { }
    } catch (error) { showError(error.message || 'Connexion interrompue. Ton brouillon est conservé.'); }
    finally { running = false; runButton.innerHTML = previous; runButton.disabled = submitted; resetButton.disabled = submitted; editor.readOnly = submitted; panel.setAttribute('aria-busy', 'false'); }
  }
  runButton.addEventListener('click', execute);
  /* Raccourcis (hors Mode Examen) : Entrée exécute, Maj+Entrée ajoute une ligne,
     Ctrl/Cmd+Entrée passe à la suite après une réussite, sinon exécute. */
  const goNext = () => { const next = document.getElementById('next-exercise'); if (!solved || !next) return false; location.href = next.href; return true; };
  const runOrNext = () => { if (!goNext()) execute(); };
  textarea.addEventListener('keydown', event => {
    if (event.key !== 'Enter' || event.shiftKey || event.altKey || mode === 'exam') return;
    event.preventDefault(); if (event.ctrlKey || event.metaKey) runOrNext(); else execute();
  });
  document.addEventListener('keydown', event => {
    if (mode === 'exam' || event.defaultPrevented || event.key !== 'Enter' || !(event.ctrlKey || event.metaKey)) return;
    if (goNext()) event.preventDefault();
  });
  resetButton.addEventListener('click', () => { editor.value = ''; saveDraft(); editor.focus(); });
  document.querySelector('.editor-file')?.addEventListener('click', event => { if (monacoEditor) { event.preventDefault(); editor.focus(); } });
  document.addEventListener('DOMContentLoaded', () => {
    // Monaco est chargé après les scripts FlyonUI (son loader AMD modifierait leur enregistrement UMD).
    const schemaNode = document.getElementById('sql-schema');
    window.SqlEditor?.mount(textarea, {
      assist: mode !== 'exam', keys: mode === 'exam' ? 'exam' : 'run', schema: schemaNode ? JSON.parse(schemaNode.textContent) : null,
      onRun: execute, onControlEnter: runOrNext, onChange: saveDraft
    }).then(instance => {
      monacoEditor = instance; instance.setReadOnly(submitted || running);
      if (mode !== 'exam' && finePointer() && !document.activeElement?.closest('input, select, textarea, button, a, [contenteditable]')) instance.focus();
    }).catch(error => console.warn('Éditeur Monaco indisponible, textarea conservé :', error)); // le textarea reste utilisable
  });
  const hints = document.getElementById('hint-button');
  hints?.addEventListener('click', async () => { hints.disabled = true; try { const data = await post(`/api/exercises/${exerciseId}/hint`); document.getElementById('hints-list').replaceChildren(...data.hints.map(h => element('li', '', h))); document.getElementById('hint-count').textContent = data.hintsUsed; document.getElementById('hints-panel').classList.remove('hidden'); } catch (error) { showError(error.message); } finally { hints.disabled = false; } });
  const solutionModal = document.getElementById('solution-modal'); const confirmSolution = document.getElementById('confirm-solution');
  solutionModal?.addEventListener('open.overlay', () => { confirmSolution.disabled = false; });
  solutionModal?.addEventListener('close.overlay', () => { confirmSolution.disabled = true; });
  confirmSolution?.addEventListener('click', async () => { confirmSolution.disabled = true; try { const data = await post(`/api/exercises/${exerciseId}/solution`); window.HSOverlay?.close('#solution-modal'); correction(data); document.getElementById('correction-panel').scrollIntoView({ behavior: smooth(), block: 'nearest' }); } catch (error) { showError(error.message); confirmSolution.disabled = false; } });
  const hide = document.getElementById('hide-schema');
  hide?.addEventListener('click', () => { const database = document.getElementById('database-panel'); database.hidden = !database.hidden; hide.setAttribute('aria-expanded', String(!database.hidden)); hide.replaceChildren(icon(database.hidden ? 'visibility' : 'visibility_off'), document.createTextNode(database.hidden ? 'Afficher la base' : 'Masquer la base')); });
  // Largeur des deux panneaux : ajustable a la souris ou au clavier, memorisee pour les exercices suivants.
  const resizer = document.getElementById('ws-resizer'); const grid = document.querySelector('.workspace-grid');
  if (resizer && grid) {
    const MIN_LEFT = 470, MIN_RIGHT = 560, KEY = 'sqlrush-ws-left';
    const limits = () => { const width = grid.getBoundingClientRect().width; return { max: Math.max(MIN_LEFT, width - 22 - MIN_RIGHT), width }; };
    const twoColumns = () => getComputedStyle(resizer).display !== 'none';
    const apply = (value, persist) => {
      const { max } = limits(); const left = Math.round(Math.min(max, Math.max(MIN_LEFT, value)));
      grid.style.setProperty('--ws-left', left + 'px');
      resizer.setAttribute('aria-valuenow', String(left)); resizer.setAttribute('aria-valuemax', String(Math.round(max)));
      if (persist) try { localStorage.setItem(KEY, String(left)); } catch { }
      return left;
    };
    const current = () => document.querySelector('.ws-side').getBoundingClientRect().width;
    const restore = () => { if (!twoColumns()) return; let saved; try { saved = Number(localStorage.getItem(KEY)); } catch { } if (saved) apply(saved, false); else resizer.setAttribute('aria-valuenow', String(Math.round(current()))); };
    restore(); addEventListener('resize', restore);
    resizer.addEventListener('pointerdown', event => {
      if (!twoColumns()) return;
      event.preventDefault(); resizer.setPointerCapture(event.pointerId); document.body.style.cursor = 'col-resize';
      const origin = grid.getBoundingClientRect().left;
      const move = moveEvent => apply(moveEvent.clientX - origin, false);
      const stop = () => { resizer.removeEventListener('pointermove', move); resizer.removeEventListener('pointerup', stop); document.body.style.cursor = ''; apply(current(), true); };
      resizer.addEventListener('pointermove', move); resizer.addEventListener('pointerup', stop);
    });
    resizer.addEventListener('keydown', event => {
      const step = event.key === 'ArrowLeft' ? -24 : event.key === 'ArrowRight' ? 24 : 0;
      if (!step || !twoColumns()) return;
      event.preventDefault(); apply(current() + step, true);
    });
  }
  const clock = document.getElementById('clock');
  if (clock) { const tick = () => { if (submitted) return; const seconds = Math.max(0, Math.floor((Date.now() - Number(clock.dataset.start)) / 1000)); clock.textContent = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`; }; tick(); setInterval(tick, 1000); }
})();
