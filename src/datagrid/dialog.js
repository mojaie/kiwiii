
import d3 from 'd3';

import {default as box} from '../component/formBox.js';
import {default as modal} from '../component/modal.js';
import {default as fetcher} from '../fetcher.js';


function searchDialog(selection, state) {
  const dialog = selection
    .call(modal.submitDialog, 'search-dialog', 'Search compounds');
  const textarea = dialog.select('.modal-body').append('div')
    .call(box.textareaBox, 'search-query', 'Query', 40, state.placeholder, '');
  dialog.select('.submit')
      .on('click', function () {
        d3.select('#loading-icon').style('display', 'inline');
        const query = {
          workflow: 'search',
          targets: state.resources.filter(e => e.domain === 'chemical').map(e => e.id),
          key: 'compound_id',
          values: box.textareaBoxValue(textarea)
        };
        return fetcher.get(query.workflow, query)
          .then(fetcher.json)
          .then(callback, fetcher.error);
      });
}




export default {
  searchDialog
};
