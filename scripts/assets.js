import { mkdirSync, copyFileSync } from 'node:fs';
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
console.log('FlyonUI, polices et icônes copiés localement.');
