
import d3 from 'd3';


/**
 * Format number
 * @param {object} value - value
 * @param {string} type - si | scientific | rounded | raw
 */
export function formatNum(value, type) {
  const conv = {
    scientific: ".3e",
    si: ".3s",
    rounded: ".3r"
  };
  if (type === 'raw') return value;
  if (value === undefined || value === null || Number.isNaN(value)) return '';
  return value == parseFloat(value) ? d3.format(conv[type])(value) : value;
}

export function partialMatch(query, target) {
  if (target === undefined || target === null || target === '') return false;
  return target.toString().toUpperCase()
    .indexOf(query.toString().toUpperCase()) !== -1;
}

export function numericAsc(a, b) {
  const fa = parseFloat(a);
  const fb = parseFloat(b);
  if (isNaN(fa) || isNaN(fb)) {
    return String(b).localeCompare(String(a));
  }
  return fb - fa;
}


export function numericDesc(a, b) {
  return numericAsc(b, a);
}


export function textAsc(a, b) {
  return String(b).localeCompare(String(a));
}


export function textDesc(a, b) {
  return textAsc(b, a);
}
