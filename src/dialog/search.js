
/** @module dialog/search */

import d3 from 'd3';
import _ from 'lodash';

import {default as fetcher} from '../common/fetcher.js';

import {default as button} from '../component/button.js';
import {default as box} from '../component/formBox.js';
import {default as lbox} from '../component/formListBox.js';
import {default as modal} from '../component/modal.js';


const id = 'search-dialog';
const title = 'Search by compound ID';


function menuLink(selection) {
  selection.call(button.dropdownMenuModal, title, id, 'searchtext');
}


function body(selection, resources, placeholder) {
  const fields = _(resources.map(e => e.fields))
    .flatten()
    .uniqBy('key')
    .value()
    .filter(e => e.hasOwnProperty('d3_format')
                 || ['compound_id', 'numeric', 'text'].includes(e.format));
  const def = fields.find(e => e.format === 'compound_id') || fields[0];
  const mbody = selection.call(modal.submitDialog, id, title)
    .select('.modal-body');
  mbody.append('div')
      .classed('field', true)
      .call(lbox.selectBox, 'Field', fields, def.key);
  mbody.append('div')
      .classed('query', true)
      .call(box.textareaBox, 'Query', 20, placeholder, '')
      .on('input', function() {  // Validation
        const values = box.textareaBoxLines(d3.select(this));
        selection.select('.submit').property('disabled', !values.length);
      });
}


function execute(selection, resources) {
  const query = {
    workflow: 'search',
    targets: resources.map(e => e.id),  // All DBs
    key: lbox.selectBoxValue(selection.select('.field')),
    values: box.textareaBoxLines(selection.select('.query'))
  };
  return fetcher.get(query.workflow, query)
    .then(fetcher.json);
}


export default {
  menuLink, body, execute
};
