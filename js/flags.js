/**
 * flags.js — Maps squadId to ISO 3166-1 alpha-2 country code for flagcdn.com
 * flagcdn.com/w40/{code}.png
 */

const FLAG_CODES = {
  1:  'dz', // Algeria
  2:  'ar', // Argentina
  3:  'au', // Australia
  4:  'at', // Austria
  5:  'be', // Belgium
  6:  'ba', // Bosnia and Herzegovina
  7:  'br', // Brazil
  8:  'cv', // Cabo Verde
  9:  'ca', // Canada
  10: 'co', // Colombia
  11: 'cd', // Congo DR
  12: 'ci', // Côte d'Ivoire
  13: 'hr', // Croatia
  14: 'cw', // Curaçao
  15: 'cz', // Czechia
  16: 'ec', // Ecuador
  17: 'eg', // Egypt
  18: 'gb-eng', // England (special)
  19: 'fr', // France
  20: 'de', // Germany
  21: 'gh', // Ghana
  22: 'ht', // Haiti
  23: 'ir', // IR Iran
  24: 'iq', // Iraq
  25: 'jp', // Japan
  26: 'jo', // Jordan
  27: 'kr', // Korea Republic
  28: 'mx', // Mexico
  29: 'ma', // Morocco
  30: 'nl', // Netherlands
  31: 'nz', // New Zealand
  32: 'no', // Norway
  33: 'pa', // Panama
  34: 'py', // Paraguay
  35: 'pt', // Portugal
  36: 'qa', // Qatar
  37: 'sa', // Saudi Arabia
  38: 'gb-sct', // Scotland (special)
  39: 'sn', // Senegal
  40: 'za', // South Africa
  41: 'es', // Spain
  42: 'se', // Sweden
  43: 'ch', // Switzerland
  44: 'tn', // Tunisia
  45: 'tr', // Türkiye
  46: 'uy', // Uruguay
  47: 'us', // USA
  48: 'uz', // Uzbekistan
};

function getFlagUrl(squadId) {
  const code = FLAG_CODES[squadId];
  if (!code) return '';
  return `https://flagcdn.com/w40/${code}.png`;
}
