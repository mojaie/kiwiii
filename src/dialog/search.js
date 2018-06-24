
/** @module dialog/search */

import {default as fetcher} from '../common/fetcher.js';

import {default as button} from '../component/button.js';
import {default as box} from '../component/formBox.js';
import {default as modal} from '../component/modal.js';


const id = 'search-dialog';
const title = 'Search by compound ID';


function menuLink(selection) {
  selection.call(button.dropdownMenuModal, title, id, 'searchtext');
}


function body(selection, placeholder) {
  selection.call(modal.submitDialog, id, title)
    .select('.modal-body').append('div')
      .classed('ids', true)
      .call(box.textareaBox, 'search-query', 'Query', 20, placeholder, '');
}


function execute(selection, chemrsrc) {
  const query = {
    workflow: 'search',
    targets: chemrsrc.map(e => e.id),  // All DBs
    key: 'compound_id',
    values: box.textareaBoxLines(selection.select('.ids'))
  };
  return fetcher.get(query.workflow, query)
    .then(fetcher.json);
}


export default {
  menuLink, body, execute
};
