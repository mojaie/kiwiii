
/** @module datagrid/sort */

import d3 from 'd3';

import {default as misc} from '../common/misc.js';
import {default as component} from './component.js';


function numericAsc(a, b) {
  const fa = parseFloat(a);
  const fb = parseFloat(b);
  if (isNaN(fa) || isNaN(fb)) {
    return String(b).localeCompare(String(a));
  }
  return fb - fa;
}


function numericDesc(a, b) {
  return numericAsc(b, a);
}


function textAsc(a, b) {
  return String(b).localeCompare(String(a));
}


function textDesc(a, b) {
  return textAsc(b, a);
}


function setSort(selection, state) {
  selection.select('.dg-header').selectAll('.dg-hcell')
    .filter(d => misc.sortType(d.format) !== 'none')
    .append('span').append('a')
      .attr('id', d => `sort-${d.key}`)
      .text('^v')
      .style('display', 'inline-block')
      .style('width', '30px')
      .style('text-align', 'center')
    .on('click', d => {
      const isAsc = d3.select(`#sort-${d.key}`).text() === 'v';
      d3.select(`#sort-${d.key}`).text(isAsc ? '^' : 'v');
      state.setSortOrder(d.key, isAsc ? 'desc' : 'asc');
      selection.call(component.updateRows, state);
    });
  state.updateContentsNotifier = () => {
    state.applyData();
    selection.call(component.updateHeader, state)
      .call(setSort, state);
  };
}


export default {
  setSort
};
