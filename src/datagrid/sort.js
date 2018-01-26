
/** @module datagrid/sort */

import d3 from 'd3';
import {default as def} from '../helper/definition.js';
import {default as fmt} from '../helper/formatValue.js';
import {default as component} from './component.js';


function setSort(selection, state) {
  selection.select('.dg-header').selectAll('.dg-hcell')
    .filter(d => def.sortType(d.format) !== 'none')
    .append('span').append('a')
      .attr('id', d => `sort-${d.key}`)
      .text('^v')
      .style('display', 'inline-block')
      .style('width', '30px')
      .style('text-align', 'center')
    .on('click', d => {
      const isAsc = d3.select(`#sort-${d.key}`).text() === 'v';
      d3.select(`#sort-${d.key}`).text(isAsc ? '^' : 'v');
      const isNum = def.sortType(d.format) === 'numeric';
      const cmp = isAsc
        ? (isNum ? fmt.numericAsc : fmt.textAsc)
        : (isNum ? fmt.numericDesc : fmt.textDesc);
      state.records = state.records.sort((a, b) => cmp(a[d.key], b[d.key]));
      selection.call(component.updateRows, state);
    });
}


export default {
  setSort
};
