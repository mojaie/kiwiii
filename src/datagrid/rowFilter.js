
/** @module datagrid/rowFilter */

import {default as box} from '../component/formBox.js';


function setFilter(selection, state) {
  const searchBox = selection
      .classed('row', true)
      .classed('justify-content-end', true)
    .append('div')
      .classed('col-5', true)
      .call(box.textBox, 'Search', null);
  searchBox.select('label').classed('text-right', true);
  searchBox.select('input')
    .on('keyup', function () {
      state.updateFilterNotifier(box.textBoxValue(searchBox));
    });
}


export default {
  setFilter
};
