import { mkdirSync, copyFileSync, cpSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
mkdirSync('public/vendor', { recursive: true }); mkdirSync('public/css', { recursive: true });
for (const file of ['tabs', 'accordion', 'collapse', 'overlay', 'tooltip', 'select', 'datatable']) copyFileSync(`node_modules/flyonui/dist/${file}.js`, `public/vendor/${file}.js`);
// DataTables applicatives : les bibliothèques restent servies depuis le projet, sans CDN.
copyFileSync('node_modules/jquery/dist/jquery.min.js', 'public/vendor/jquery.js');
copyFileSync('node_modules/datatables.net/js/dataTables.min.js', 'public/vendor/datatables.js');
for (const [from, to] of [
  ['@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2', 'manrope.woff2'],
  ['@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2', 'mono.woff2'],
  ['material-symbols/material-symbols-rounded.woff2', 'symbols.woff2']
]) copyFileSync('node_modules/' + from, 'public/vendor/' + to);

// Monaco Editor (build AMD minifié). Les services TypeScript/CSS/HTML/JSON et les traductions
// autres que le français ne servent pas à un éditeur SQL : ils ne sont pas copiés.
const monacoSource = 'node_modules/monaco-editor/min/vs', monacoTarget = 'public/vendor/monaco/vs';
rmSync('public/vendor/monaco', { recursive: true, force: true });
cpSync(monacoSource, monacoTarget, {
  recursive: true,
  filter: source => {
    const path = source.replaceAll('\\', '/').slice(monacoSource.length);
    return !path.startsWith('/language') && !/^\/assets\/(ts|css|html|json)\.worker-/.test(path) && !/^\/nls\/lang\/(?!fr\.js$)./.test(path);
  }
});
// La CSP limite les polices à 'self' : la police d'icônes codicon, inlinée en data:, devient un fichier local.
const monacoCss = monacoTarget + '/editor/editor.main.css';
writeFileSync(monacoCss, readFileSync(monacoCss, 'utf8').replace(/url\(data:font\/ttf;base64,([^)]+)\)/, (_, data) => {
  writeFileSync(monacoTarget + '/editor/codicon.ttf', Buffer.from(data, 'base64'));
  return 'url(codicon.ttf)';
}));
// Worker servi depuis le projet plutôt qu'en blob: (même CSP qu'avant, sans worker-src supplémentaire).
const editorWorker = readdirSync(monacoTarget + '/assets').find(file => /^editor\.worker-.+\.js$/.test(file));
if (!editorWorker) throw new Error('Worker Monaco introuvable : vérifier la version de monaco-editor.');
writeFileSync('public/vendor/monaco/editor-worker.js', `importScripts('vs/assets/${editorWorker}');postMessage({type:'vscode-worker-ready'});\n`);
console.log('FlyonUI, Monaco Editor, polices et icônes copiés localement.');
