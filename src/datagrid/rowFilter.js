
/** @module datagrid/rowFilter */

import {default as box} from '../component/formBox.js';


function setFilter(selection, state) {
  const searchBox = selection
      .classed('row', true)
      .classed('justify-content-end', true)
    .append('div')
      .classed('col-6', true)
      .call(box.textBox, null, 'Search', 40, null);
  searchBox.select('input')
    .on('keyup', function () {
      state.updateFilterNotifier(box.textBoxValue(searchBox));
    });
}


export default {
  setFilter
};
