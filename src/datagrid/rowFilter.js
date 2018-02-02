
/** @module datagrid/rowFilter */

import d3 from 'd3';
import {default as misc} from '../common/misc.js';
import {default as component} from './component.js';


function filter(selection, state) {
  // Prevent implicit submission
  document.getElementById('join-search')
    .addEventListener('keypress', event => {
      if (event.keyCode === 13) event.preventDefault();
    });
  selection
    .on('keyup', function () {
      const match = d => misc.partialMatch(d3form.value(this), d.name);
      selection.selectAll('li')
        .style('visibility', d => match(d) ? null : 'hidden')
        .style('position', d => match(d) ? null : 'absolute');
    });
}


export default {
  filter
};
