/**
 * Baut assets/lernkumpel.css aus assets/tailwind-input.css.
 *
 *   node build-css.mjs
 *
 * Warum überhaupt ein Build? Das bequeme <script src="https://cdn.tailwindcss.com">
 * ist ein JIT-Compiler in modernem JavaScript (ES2020) und stirbt auf alten
 * Android-Browsern mit einem SyntaxError -> die Seite bleibt komplett unformatiert.
 * Fertiges CSS funktioniert überall, ist ~8x kleiner und lädt deutlich schneller.
 *
 * Nach jeder Änderung an den Tailwind-Klassen in den HTML-Dateien neu ausführen!
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const OUT = 'assets/lernkumpel.css';
const TAILWIND = 'tailwindcss@3.4.17';

console.log(`> npx ${TAILWIND} ...`);
execFileSync(
  'npx',
  ['-y', TAILWIND, '-c', 'tailwind.config.js', '-i', 'assets/tailwind-input.css', '-o', OUT, '--minify'],
  { stdio: 'inherit', cwd: import.meta.dirname },
);

/*
 * Tailwind 3 gibt modernes CSS aus, das alte Browser nicht nur ignorieren, sondern
 * teils komplett verwerfen. Diese Umschreibungen sind semantisch identisch, aber
 * schon ab Chrome 49 verständlich.
 */
const rewrites = [
  // rgb(255 255 255 / .8) -> rgba(255,255,255,.8)            (Leerzeichen-Syntax: Chrome 65+)
  [/rgba?\((\d+) (\d+) (\d+)\s*\/\s*(var\([^()]*\)|[^)]+)\)/g, 'rgba($1,$2,$3,$4)'],
  // rgb(255 255 255) -> rgb(255,255,255)
  [/rgba?\((\d+) (\d+) (\d+)\)/g, 'rgb($1,$2,$3)'],
  // :where() ist erst ab Chrome 88 bekannt - ein unbekannter Selektor in der Liste
  // lässt den Browser die *ganze* Regel verwerfen (z. B. den Button-Reset).
  [/:where\(:not\(\[hidden=until-found\]\)\)/g, ''],
  [/:where\((\[[^)]+\])\)/g, '$1'],
  // inset: 0 -> Einzel-Eigenschaften                          (inset: Chrome 87+)
  [/([{;])inset:0([;}])/g, '$1top:0;right:0;bottom:0;left:0$2'],
];

let css = readFileSync(OUT, 'utf8');
const before = css.length;
for (const [pattern, replacement] of rewrites) css = css.replace(pattern, replacement);

// Absichern, dass nichts Unverträgliches übrig geblieben ist.
const leftovers = [
  [/rgba?\(\d+ \d+ \d+/, 'rgb() mit Leerzeichen-Syntax'],
  [/:where\(|:is\(/, ':where()/:is()'],
  [/oklch\(|color-mix\(|@property/, 'CSS Color 4 / @property'],
];
for (const [pattern, label] of leftovers) {
  const hit = css.match(pattern);
  if (hit) throw new Error(`${label} noch im Output gefunden: ${JSON.stringify(hit[0])}`);
}

writeFileSync(OUT, `/* Generiert von build-css.mjs - nicht direkt bearbeiten. */\n${css}`);
console.log(`> ${OUT}: ${(css.length / 1024).toFixed(1)} kB (Legacy-Umschreibungen: ${before - css.length} Zeichen gespart)`);
