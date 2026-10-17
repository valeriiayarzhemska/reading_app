// Hermes has no Intl.PluralRules, so i18next falls back to "1 = one, else
// other" and Ukrainian breaks (11 книжки instead of 11 книжок).
// `polyfill.js` installs only when the feature is missing; order matters.
import '@formatjs/intl-getcanonicallocales/polyfill.js';
import '@formatjs/intl-pluralrules/polyfill.js';
import '@formatjs/intl-pluralrules/locale-data/en.js';
import '@formatjs/intl-pluralrules/locale-data/uk.js';
