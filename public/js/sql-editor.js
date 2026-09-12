/* Éditeur SQL Monaco, chargé uniquement par la page d'exercice depuis /vendor/monaco (aucun CDN).
   L'autocomplétion ne connaît que la syntaxe SQL générique, les tables et colonnes du schéma affiché
   et les alias tapés par l'étudiant : jamais la solution, les indices, la correction ni les valeurs des lignes. */
(() => {
  const BASE = '/vendor/monaco';
  const MAX_LENGTH = 12000;
  let loading = null;

  function loadMonaco() {
    if (window.monaco?.editor) return Promise.resolve(window.monaco);
    const script = src => new Promise((resolve, reject) => {
      const element = document.createElement('script'); element.src = src;
      element.onload = resolve; element.onerror = () => reject(new Error('Monaco indisponible : ' + src));
      document.head.append(element);
    });
    // Libellés français : script classique (globales NLS), à charger avant le loader AMD.
    return loading ??= script(BASE + '/vs/nls/lang/fr.js').then(() => script(BASE + '/vs/loader.js')).then(() => new Promise((resolve, reject) => {
      window.require.config({ paths: { vs: BASE + '/vs' } });
      window.require(['vs/editor/editor.main'], () => {
        // Worker local plutôt que la fabrique blob: de Monaco : la CSP reste inchangée.
        window.MonacoEnvironment = { getWorker: () => new Worker(BASE + '/editor-worker.js') };
        resolve(window.monaco);
      }, reject);
    }));
  }

  /* Thèmes : couleurs lues dans les variables FlyonUI de chaque thème, pas de palette parallèle. */
  const hex = value => /^#[0-9a-f]{6}$/i.test(value) ? value.toLowerCase() : null;
  const mix = (a, b, weight) => '#' + [1, 3, 5].map(i => Math.round(parseInt(a.substr(i, 2), 16) * weight + parseInt(b.substr(i, 2), 16) * (1 - weight)).toString(16).padStart(2, '0')).join('');
  function palette(theme) {
    const probe = document.createElement('div'); probe.dataset.theme = theme; probe.hidden = true; document.body.append(probe);
    const style = getComputedStyle(probe); const read = (name, fallback) => hex(style.getPropertyValue(name).trim()) || fallback;
    const colors = {
      primary: read('--color-primary', theme === 'dark' ? '#86e1b2' : '#076b4e'), warning: read('--color-warning', theme === 'dark' ? '#f2be70' : '#985607'),
      info: read('--color-info', theme === 'dark' ? '#93c9ee' : '#2b6699'), base100: read('--color-base-100', theme === 'dark' ? '#1b2723' : '#ffffff'),
      base200: read('--color-base-200', theme === 'dark' ? '#131d19' : '#f5f6f2'), base300: read('--color-base-300', theme === 'dark' ? '#33453c' : '#e4e7df'),
      content: read('--color-base-content', theme === 'dark' ? '#e6ede7' : '#24322c')
    };
    probe.remove(); return colors;
  }
  function defineThemes(monaco) {
    for (const theme of ['light', 'dark']) {
      const c = palette(theme); const dark = theme === 'dark';
      // Le fond sombre historique de requete.sql est conservé en thème sombre.
      const background = dark ? '#15271f' : c.base200; const foreground = dark ? '#e1f4d1' : c.content;
      const comment = dark ? '#8ba28e' : mix(c.content, background, .62);
      const strip = color => color.slice(1);
      // Chaque règle existe aussi en « .sql » : les thèmes de base Monaco colorent string.sql et predefined.sql.
      const rules = [
        ['', foreground], ['keyword', dark ? c.primary : mix(c.primary, '#ffffff', .9)], ['operator', dark ? mix(c.primary, foreground, .55) : mix(c.primary, '#ffffff', .9)],
        ['predefined', c.info], ['string', c.warning], ['number', dark ? c.info : mix(c.info, c.primary, .55)],
        ['comment', comment, 'italic'], ['comment.quote', comment, 'italic'], ['delimiter', mix(foreground, background, .7)], ['identifier', foreground]
      ].flatMap(([token, color, fontStyle]) => [token, token && token + '.sql'].filter((t, i) => i === 0 || t).map(t => ({ token: t, foreground: strip(color), ...(fontStyle ? { fontStyle } : {}) })));
      monaco.editor.defineTheme('sqlrush-' + theme, {
        base: dark ? 'vs-dark' : 'vs', inherit: true,
        rules,
        colors: {
          'editor.background': background, 'editor.foreground': foreground,
          'editorCursor.foreground': c.primary, 'editor.selectionBackground': c.primary + (dark ? '40' : '30'),
          'editor.inactiveSelectionBackground': c.primary + '22', 'editor.lineHighlightBackground': '#00000000', 'editor.lineHighlightBorder': '#00000000',
          'editorBracketMatch.background': c.primary + '26', 'editorBracketMatch.border': c.primary + '80',
          'editorWidget.background': c.base100, 'editorWidget.foreground': c.content, 'editorWidget.border': c.base300,
          'editorSuggestWidget.background': c.base100, 'editorSuggestWidget.border': c.base300, 'editorSuggestWidget.foreground': c.content,
          'editorSuggestWidget.selectedBackground': c.primary + (dark ? '33' : '1f'), 'editorSuggestWidget.selectedForeground': c.content,
          'editorSuggestWidget.highlightForeground': c.primary, 'editorSuggestWidget.focusHighlightForeground': c.primary,
          'list.hoverBackground': c.primary + '14', 'focusBorder': c.primary + '00',
          'scrollbarSlider.background': foreground + '30', 'scrollbarSlider.hoverBackground': c.primary + '80', 'scrollbarSlider.activeBackground': c.primary + 'a0'
        }
      });
    }
  }
  const currentTheme = () => 'sqlrush-' + (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');

  /* Vocabulaire SQL générique, limité aux syntaxes acceptées par le moteur de l'application. */
  const STATEMENTS = ['SELECT', 'INSERT INTO', 'UPDATE', 'DELETE FROM', 'CREATE TABLE', 'ALTER TABLE', 'DROP TABLE', 'WITH'];
  const KEYWORDS = ['FROM', 'WHERE', 'DISTINCT', 'AS', 'AND', 'OR', 'NOT', 'IN', 'BETWEEN', 'LIKE', 'IS NULL', 'IS NOT NULL', 'NULL',
    'ORDER BY', 'ASC', 'DESC', 'LIMIT', 'OFFSET', 'GROUP BY', 'HAVING', 'JOIN', 'INNER JOIN', 'LEFT JOIN', 'ON',
    'VALUES', 'SET', 'PRIMARY KEY', 'FOREIGN KEY', 'REFERENCES', 'NOT NULL', 'UNIQUE', 'DEFAULT', 'CHECK', 'ADD COLUMN',
    'INTEGER', 'TEXT', 'REAL', 'EXISTS', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END'];
  const FUNCTIONS = ['COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'ROUND', 'LENGTH', 'UPPER', 'LOWER', 'COALESCE', 'IFNULL', 'ABS', 'SUBSTR', 'TRIM', 'REPLACE'];
  const RESERVED = new Set([...STATEMENTS, ...KEYWORDS].flatMap(k => k.toLowerCase().split(' ')).concat(['right', 'full', 'outer', 'cross', 'natural', 'using', 'union', 'select', 'insert', 'into', 'update', 'delete', 'create', 'alter', 'drop', 'table', 'with']));
  const TABLE_CONTEXT = new Set(['from', 'join', 'into', 'update', 'table', 'references']);
  const COLUMN_CONTEXT = new Set(['select', 'where', 'on', 'and', 'or', 'by', 'having', 'set', 'distinct', 'not', 'when', 'then', 'else', 'case', 'like', 'in', 'between']);

  // Texte avant le curseur sans commentaires ni contenu des chaînes ; null si le curseur est dans l'un d'eux.
  function scrub(text) {
    let out = ''; let i = 0;
    while (i < text.length) {
      if (text.startsWith('--', i)) { const end = text.indexOf('\n', i); if (end < 0) return null; out += ' '; i = end; continue; }
      if (text.startsWith('/*', i)) { const end = text.indexOf('*/', i + 2); if (end < 0) return null; out += ' '; i = end + 2; continue; }
      if (text[i] === "'" || text[i] === '"') { const quote = text[i]; let end = i + 1; while (end < text.length && (text[end] !== quote || text[end + 1] === quote)) end += text[end] === quote ? 2 : 1; if (end >= text.length) return null; out += quote + quote; i = end + 1; continue; }
      out += text[i++];
    }
    return out;
  }

  function createProvider(monaco, state) {
    const { CompletionItemKind: Kind, CompletionItemInsertTextRule: Rule } = monaco.languages;
    return {
      triggerCharacters: ['.'],
      provideCompletionItems(model, position) {
        const schema = state.schema; if (!state.assist) return { suggestions: [] };
        const before = scrub(model.getValueInRange({ startLineNumber: 1, startColumn: 1, endLineNumber: position.lineNumber, endColumn: position.column }));
        if (before === null) return { suggestions: [] };
        const whole = scrub(model.getValue() + '\n') ?? before;
        const tables = schema?.tables || []; const byName = new Map(tables.map(t => [t.name.toLowerCase(), t]));
        // Alias locaux : FROM hotels h, JOIN hotels AS h, UPDATE hotels…
        const aliases = new Map(tables.map(t => [t.name.toLowerCase(), t]));
        for (const match of whole.matchAll(/\b(?:from|join|update|into)\s+([a-z_]\w*)(?:\s+(?:as\s+)?([a-z_]\w*))?/gi)) {
          const table = byName.get(match[1].toLowerCase());
          if (table && match[2] && !RESERVED.has(match[2].toLowerCase())) aliases.set(match[2].toLowerCase(), table);
        }
        const used = new Set([...whole.matchAll(/\b(?:from|join|update|into)\s+([a-z_]\w*)/gi)].map(m => m[1].toLowerCase()).filter(name => byName.has(name)));
        const word = model.getWordUntilPosition(position);
        const range = { startLineNumber: position.lineNumber, endLineNumber: position.lineNumber, startColumn: word.startColumn, endColumn: word.endColumn };
        const nextChar = model.getLineContent(position.lineNumber).charAt(word.endColumn - 1);
        const spaced = text => /\s/.test(nextChar) ? text : text + ' ';
        const columnItem = (name, owners, sort) => ({
          label: { label: name, description: 'Colonne · ' + owners.map(t => t.name).join(', ') }, kind: Kind.Field,
          detail: owners.map(t => `${t.name}.${name}${t.columns.find(c => c.name === name)?.type ? ' · ' + t.columns.find(c => c.name === name).type : ''}`).join('\n'),
          insertText: name, range, sortText: sort + name
        });

        // Après « alias. » ou « table. » : uniquement les colonnes de cette table.
        const qualifier = /([a-z_]\w*)\.\w*$/i.exec(before);
        if (qualifier) {
          const table = aliases.get(qualifier[1].toLowerCase());
          return { suggestions: table ? table.columns.map((c, i) => ({ ...columnItem(c.name, [table], '0'), sortText: '0' + String(i).padStart(3, '0') })) : [] };
        }

        const tokens = before.slice(0, before.length - word.word.length).match(/[a-z_]\w*|[^\s\w]/gi) || [];
        const lastKeywordIndex = tokens.findLastIndex(t => TABLE_CONTEXT.has(t.toLowerCase()) || COLUMN_CONTEXT.has(t.toLowerCase()) || t === ';');
        const lastKeyword = tokens[lastKeywordIndex]?.toLowerCase();
        const previous = tokens.at(-1)?.toLowerCase();
        const afterIdentifier = previous && /^[a-z_]\w*$/.test(previous) && !RESERVED.has(previous) || previous === ')' || previous === "'" || /^\d/.test(previous || '');
        let context = 'keyword';
        if (!tokens.length || previous === ';') context = 'statement';
        else if (TABLE_CONTEXT.has(lastKeyword) && tokens.length - 1 === lastKeywordIndex) context = 'table';
        else if (!afterIdentifier && (COLUMN_CONTEXT.has(lastKeyword) || [',', '(', '=', '<', '>', '+', '-', '*', '/'].includes(previous))) context = 'column';
        const rank = { statement: { statement: '0', keyword: '3', table: '4', column: '5', function: '6' }, table: { table: '0', keyword: '3', statement: '8', column: '7', function: '9' }, column: { column: '0', function: '2', keyword: '3', table: '4', statement: '8' }, keyword: { keyword: '0', statement: '2', column: '3', function: '4', table: '5' } }[context];

        const suggestions = [];
        const lineBefore = model.getLineContent(position.lineNumber).slice(0, position.column - 1);
        const keywordItem = (keyword, group) => {
          // « ORDER B » doit devenir « ORDER BY », pas « ORDER ORDER BY ».
          let start = word.startColumn;
          for (let length = Math.min(keyword.length, lineBefore.length); length > word.word.length; length--) {
            const typed = lineBefore.slice(-length);
            if (/\s/.test(typed) && keyword.toLowerCase().startsWith(typed.toLowerCase()) && !/\w/.test(lineBefore.charAt(lineBefore.length - length - 1))) { start = position.column - length; break; }
          }
          suggestions.push({ label: { label: keyword, description: 'Mot-clé' }, kind: Kind.Keyword, insertText: spaced(keyword), filterText: keyword, range: { ...range, startColumn: start }, sortText: rank[group] + keyword });
        };
        STATEMENTS.forEach(keyword => keywordItem(keyword, 'statement'));
        KEYWORDS.forEach(keyword => keywordItem(keyword, 'keyword'));
        for (const table of tables) {
          suggestions.push({ label: { label: table.name, description: `Table · ${table.rows} ligne${table.rows > 1 ? 's' : ''}` }, kind: Kind.Struct, detail: table.columns.map(c => c.name).join(', '), insertText: spaced(table.name), range, sortText: rank.table + table.name });
        }
        // Une entrée par nom de colonne ; les tables déjà citées dans la requête passent devant.
        const owners = new Map();
        for (const table of tables) for (const column of table.columns) owners.set(column.name, [...(owners.get(column.name) || []), table]);
        for (const [name, list] of owners) suggestions.push(columnItem(name, list, rank.column + (used.size && list.some(t => used.has(t.name.toLowerCase())) ? 'a' : 'b')));
        for (const fn of FUNCTIONS) suggestions.push({ label: { label: fn + '()', description: 'Fonction' }, kind: Kind.Function, insertText: fn + '($0)', insertTextRules: Rule.InsertAsSnippet, filterText: fn, range, sortText: rank.function + fn });
        return { suggestions };
      }
    };
  }

  let providerState = null;

  /**
   * Remplace le textarea par Monaco.
   * options.assist : autocomplétion (désactivée en Mode Examen) ; options.keys : 'run' ou 'exam'.
   * options.onRun / onControlEnter / onChange : actions de la page.
   */
  async function mount(textarea, options) {
    const monaco = await loadMonaco();
    try { await document.fonts?.load("15px 'JetBrains Mono'"); } catch { }
    defineThemes(monaco);
    const assist = !!options.assist;
    if (assist) {
      if (!providerState) { providerState = { assist: true, schema: options.schema }; monaco.languages.registerCompletionItemProvider('sql', createProvider(monaco, providerState)); }
      else Object.assign(providerState, { assist: true, schema: options.schema });
    }

    const host = document.createElement('div'); host.className = 'sql-monaco';
    const placeholder = document.createElement('div'); placeholder.className = 'sql-monaco-placeholder'; placeholder.setAttribute('aria-hidden', 'true'); placeholder.textContent = textarea.placeholder;
    host.append(placeholder); textarea.after(host); textarea.hidden = true;

    const editor = monaco.editor.create(host, {
      value: textarea.value, language: 'sql', theme: currentTheme(), ariaLabel: 'Éditeur de requête SQL',
      automaticLayout: true, minimap: { enabled: false }, lineNumbers: 'off', folding: false, glyphMargin: false, lineDecorationsWidth: 20,
      scrollBeyondLastLine: false, wordWrap: 'on', contextmenu: false, fontFamily: "'JetBrains Mono', monospace", fontSize: 15, lineHeight: 26,
      padding: { top: 16, bottom: 16 }, renderLineHighlight: 'none', overviewRulerLanes: 0, overviewRulerBorder: false, hideCursorInOverviewRuler: true,
      scrollbar: { horizontal: 'hidden', verticalScrollbarSize: 6, useShadows: false, alwaysConsumeMouseWheel: false },
      stickyScroll: { enabled: false }, links: false, hover: { enabled: false }, occurrencesHighlight: 'off', selectionHighlight: false,
      lightbulb: { enabled: 'off' }, codeLens: false, dragAndDrop: false, guides: { indentation: false }, renderValidationDecorations: 'off',
      unicodeHighlight: { ambiguousCharacters: false, invisibleCharacters: false }, tabSize: 2, insertSpaces: true, detectIndentation: false,
      fixedOverflowWidgets: true, wordBasedSuggestions: 'off', parameterHints: { enabled: false }, inlineSuggest: { enabled: false },
      // Tab accepte une suggestion ; Entrée reste réservée à l'exécution.
      acceptSuggestionOnEnter: 'off', acceptSuggestionOnCommitCharacter: false, tabCompletion: 'off',
      quickSuggestions: assist ? { other: true, comments: false, strings: false } : false, quickSuggestionsDelay: 40,
      suggestOnTriggerCharacters: assist, snippetSuggestions: assist ? 'inline' : 'none',
      suggest: { preview: false, showWords: false, showSnippets: false, showStatusBar: false, localityBonus: false, shareSuggestSelections: false, filterGraceful: true }
    });
    const model = editor.getModel(); const LF = monaco.editor.EndOfLineSequence.LF;
    const text = () => model.getValue(monaco.editor.EndOfLinePreference.LF); // fins de ligne identiques au textarea
    host.querySelector('textarea, .native-edit-context')?.setAttribute('aria-describedby', textarea.getAttribute('aria-describedby') || '');

    const syncPlaceholder = () => {
      placeholder.hidden = model.getValueLength() > 0;
      placeholder.style.left = editor.getLayoutInfo().contentLeft + 'px';
    };
    // Hauteur : la hauteur minimale du textarea d'origine (CSS responsive), puis agrandissement avec le contenu.
    const fit = () => { const min = parseFloat(getComputedStyle(textarea).minHeight) || 168; host.style.height = Math.min(460, Math.max(min, editor.getContentHeight())) + 'px'; };
    fit(); syncPlaceholder();
    editor.onDidContentSizeChange(fit); editor.onDidLayoutChange(syncPlaceholder); addEventListener('resize', fit);
    editor.onDidChangeModelContent(() => {
      if (model.getValueLength() > MAX_LENGTH) { editor.trigger('limite', 'undo'); return; }
      if (model.getEOL() !== '\n') { model.setEOL(LF); return; } // setValue rétablit la fin de ligne de la plateforme
      textarea.value = text(); syncPlaceholder(); options.onChange?.();
    });
    requestAnimationFrame(() => monaco.editor.remeasureFonts());

    new MutationObserver(() => monaco.editor.setTheme(currentTheme())).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    const hideSuggest = () => editor.trigger('clavier', 'hideSuggestWidget', null);
    editor.onKeyDown(event => {
      const { KeyCode } = monaco;
      const modifier = event.ctrlKey || event.metaKey;
      const block = () => { event.preventDefault(); event.stopPropagation(); };
      if (event.keyCode === KeyCode.F1 && !event.altKey) return block(); // pas de palette de commandes
      if (!assist && event.keyCode === KeyCode.Space && modifier) return block(); // aucune suggestion manuelle en examen
      if (event.keyCode !== KeyCode.Enter || event.altKey) return;
      if (event.shiftKey && !modifier) { block(); hideSuggest(); editor.trigger('clavier', 'type', { text: '\n' }); return; }
      if (options.keys === 'exam') { if (modifier) block(); return; } // Entrée écrit normalement ; « J’ai terminé » reste explicite
      block(); hideSuggest();
      if (modifier) options.onControlEnter?.(); else options.onRun?.();
    });

    return {
      getValue: text,
      setValue: text => { editor.setValue(text); editor.setPosition(model.getFullModelRange().getEndPosition()); },
      setReadOnly: readOnly => editor.updateOptions({ readOnly }),
      focus: () => editor.focus(),
      setSchema: schema => { if (providerState) providerState.schema = schema; }
    };
  }

  window.SqlEditor = { mount };
})();
