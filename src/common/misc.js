
/** @module common/misc */

import d3 from 'd3';


// TODO: re-define
function sortType(fmt) {
  if (['numeric', 'd3_format'].includes(fmt)) return 'numeric';
  if (['text', 'compound_id', 'assay_id', 'list'].includes(fmt)) return 'text';
  if (['text_field', 'checkbox', 'html'].includes(fmt)) return 'html';
  return 'none';
}


/**
 * Format number
 * @param {object} value - value
 * @param {string} type - si | scientific | rounded | raw
 */
function formatNum(value, d3format) {
  if (value === undefined || value === null || Number.isNaN(value)) return '';
  return value == parseFloat(value) ? d3.format(d3format)(value) : value;
}


function partialMatch(query, target) {
  if (target === undefined || target === null || target === '') return false;
  return target.toString().toUpperCase()
    .indexOf(query.toString().toUpperCase()) !== -1;
}


// Ref. https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}


export default {
  sortType, formatNum, partialMatch, uuidv4
};
