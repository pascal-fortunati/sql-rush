// Pendant navigateur de src/views/partials/sql-table.ejs : même balisage, mêmes classes.
// Toute évolution du rendu d'une table SQL doit être reportée dans les deux fichiers.
window.sqlTable = function sqlTable({ columns, rows, caption = 'Table SQL', tall = false }) {
  const make = (tag, className, text) => {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  };
  const wrap = make('div', 'sql-table-wrap');
  if (tall) wrap.dataset.tall = 'true';
  const table = make('table', 'table table-sm sql-table');
  table.append(make('caption', 'sr-only', caption));
  const thead = make('thead');
  const headRow = make('tr');
  for (const column of columns) {
    const { name, pk, type } = typeof column === 'string' ? { name: column } : column;
    const th = make('th');
    th.scope = 'col';
    th.append(make('span', 'sql-col', name));
    if (pk) {
      const key = make('span', 'material-symbols-rounded sql-key', 'key');
      key.title = 'Clé primaire';
      key.setAttribute('aria-label', 'clé primaire');
      th.append(key);
    }
    if (type) th.append(make('span', 'sql-type', type));
    headRow.append(th);
  }
  thead.append(headRow);
  table.append(thead);
  const body = make('tbody');
  for (const row of rows) {
    const tr = make('tr');
    for (const value of row) {
      const td = make('td', typeof value === 'number' ? 'sql-num' : null);
      if (value === null) td.append(make('span', 'null-badge', 'NULL'));
      else td.textContent = String(value);
      tr.append(td);
    }
    body.append(tr);
  }
  table.append(body);
  wrap.append(table);
  if (!rows.length) wrap.append(make('p', 'sql-empty', 'Aucune ligne. Les colonnes demandées restent affichées.'));
  return wrap;
};
