import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync('index.html', 'utf8');
const scripts = [...html.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)];
if (!scripts.length) {
  console.error('Aucun script JavaScript intégré trouvé dans index.html.');
  process.exit(1);
}
let failed = false;
scripts.forEach((match, index) => {
  try {
    new vm.Script(match[1], { filename: 'index.html:inline-script-' + (index + 1) });
    console.log('OK — script intégré ' + (index + 1));
  } catch (error) {
    failed = true;
    console.error('ERREUR — script intégré ' + (index + 1) + ': ' + error.message);
  }
});
if (failed) process.exit(1);
console.log('Validation syntaxique terminée : ' + scripts.length + ' script(s).');
