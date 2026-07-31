/**
 * Wird nur von `node build-css.mjs` benutzt, um assets/lernkumpel.css zu erzeugen.
 * Seiten, die das fertige CSS statt des Tailwind-CDN-Skripts laden, hier eintragen.
 */
module.exports = {
  content: [
    './index.html',
    './zahlen-safari/index.html',
  ],
  theme: { extend: {} },
  plugins: [],
};
