
/** @module datagrid/sort */

import d3 from 'd3';

import {default as misc} from '../common/misc.js';
import {default as component} from './component.js';


function setSort(selection, state) {
  state.headerCellRenderer = header => {
    header.style('display', 'inline-block')
      .style('width', d => `${d.width}%`)
      .text(d => d.name)
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
  };
}


export default {
  setSort
};
