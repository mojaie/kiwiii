
/** @module dialog/search */

import d3 from 'd3';
import _ from 'lodash';

import {default as fetcher} from '../common/fetcher.js';

import {default as badge} from '../component/badge.js';
import {default as button} from '../component/button.js';
import {default as box} from '../component/formBox.js';
import {default as lbox} from '../component/formListBox.js';
import {default as modal} from '../component/modal.js';


const id = 'search-dialog';
const title = 'Search by compound ID';


function menuLink(selection) {
  selection.call(button.dropdownMenuModal, title, id, 'menu-searchtext');
}


function body(selection) {
  const mbody = selection.call(modal.submitDialog, id, title)
    .select('.modal-body');
  mbody.append('div')
      .classed('text-muted', true)
      .classed('small', true)
      .classed('text-right', true)
      .text('Ctrl+F to fill the form with demo queries');
  mbody.append('div')
      .classed('field', true)
      .call(lbox.selectBox, 'Field');
  mbody.append('div')
      .classed('query', true)
      .call(box.textareaBox, 'Query', 12)
      .call(badge.updateInvalidMessage, 'Please provide valid queries')
      .on('input', function() {
        const valid = box.textareaValid(d3.select(this));
        selection.select('.submit').property('disabled', !valid);
      });
}


function updateBody(selection, resources) {
  const fields = _(resources.map(e => e.fields))
    .flatten()
    .uniqBy('key')
    .value()
    .filter(e => e.hasOwnProperty('d3_format')
                 || ['compound_id', 'numeric', 'text'].includes(e.format));
  const def = fields.find(e => e.format === 'compound_id') || fields[0];
  selection.select('.field')
      .call(lbox.updateSelectBoxOptions, fields)
      .call(box.updateFormValue, def.key);
  selection.select('.query')
      .call(box.updateFormValue, '');
  selection.select('.submit').property('disabled', true);
}


function execute(selection, resources) {
  const query = {
    workflow: 'search',
    targets: resources.map(e => e.id),  // All DBs
    key: box.formValue(selection.select('.field')),
    values: box.textareaBoxLines(selection.select('.query'))
  };
  return fetcher.get(query.workflow, query)
    .then(fetcher.json);
}


function fill(selection) {
  selection.select('.field').call(box.updateFormValue, 'compound_id');
  selection.select('.query')
      .call(box.updateFormValue, "DB00186\nDB00189\nDB00193\nDB00203\nDB00764\nDB00863\nDB00865\nDB00868\nDB01143\nDB01240\nDB01242\nDB01361\nDB01366\nDB02638\nDB02959")
      .dispatch('input');
}

export default {
  menuLink, body, updateBody, execute, fill
};
