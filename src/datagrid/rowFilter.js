
/** @module datagrid/rowFilter */

import d3 from 'd3';
import {default as misc} from '../common/misc.js';
import {default as box} from './component/formBox.js';


function setFilter(selection, state) {
  selection.select('.dg-filter').remove();
  const filterInput = selection.insert('div')
    .classed('dg-filter', true)
    .call(box.textBox, 'dg-filterinput', 'Filter', 40, null)
  filterInput.select('input')
    .on('keypress', () => {
      if (d3.event.keyCode === 13) d3.event.preventDefault();  // disable enter key
    })
    .on('keyup', () => {
      // TODO: update visibleRows
      const match = d => misc.partialMatch(box.textBoxValue(filterInput), d.name);
      
    });
}


export default {
  setFilter
};
