
/** @module dialog/search */


import {default as button} from '../component/button.js';
import {default as box} from '../component/formBox.js';
import {default as modal} from '../component/modal.js';


const id = 'search-dialog';
const title = 'Search by compound ID';


function menuLink(selection) {
  selection.call(button.dropdownMenuModal, title, id, 'magnifying-glass');
}


function body(selection, placeholder) {
  selection.call(modal.submitDialog, id, title)
    .select('.modal-body').append('div')
      .classed('ids', true)
      .call(box.textareaBox, 'search-query', 'Query', 20, placeholder, '');
}


function query(selection, targets) {
  return {
    workflow: 'search',
    targets: targets,
    key: 'compound_id',
    values: box.textareaBoxLines(selection.select('.ids'))
  };
}


export default {
  menuLink, body, query
};
