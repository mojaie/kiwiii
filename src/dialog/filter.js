
/** @module dialog/filter */

import _ from 'lodash';
import d3 from 'd3';

import {default as fetcher} from '../common/fetcher.js';

import {default as button} from '../component/button.js';
import {default as box} from '../component/formBox.js';
import {default as lbox} from '../component/formListBox.js';
import {default as modal} from '../component/modal.js';


const id = 'filter-dialog';
const title = 'Search by properties';


function menuLink(selection) {
  selection.call(button.dropdownMenuModal, title, id, 'menu-searchprop');
}


function body(selection) {
  const dialog = selection.call(modal.submitDialog, id, title);
  dialog.select('.modal-body').append('div')
      .classed('key', true)
      .call(lbox.selectBox, 'Field');
  dialog.select('.modal-body').append('div')
      .classed('operator', true)
      .call(lbox.selectBox, 'Operator')
      .call(lbox.selectBoxItems, [
              {key: 'eq', name: '='},
              {key: 'gt', name: '>'},
              {key: 'lt', name: '<'},
              {key: 'ge', name: '>='},
              {key: 'le', name: '>='},
              {key: 'lk', name: 'LIKE'}
            ]);
  dialog.select('.modal-body').append('div')
      .classed('value', true)
      .call(box.textBox, 'Value');
  // Targets
  dialog.select('.modal-body').append('div')
      .classed('target', true)
      .call(lbox.checklistBox, 'Target databases');
}


function updateBody(selection, resources) {
  const fields = _(resources.map(e => e.fields))
    .flatten()
    .uniqBy('key')
    .value()
    .filter(e => e.hasOwnProperty('d3_format')
                 || ['compound_id', 'numeric', 'text'].includes(e.format));
  selection.select('.key')
      .call(lbox.selectBoxItems, fields)
      .call(lbox.updateSelectBox, fields[0]);
  selection.select('.operator')
      .call(lbox.updateSelectBox, 'eq');
  selection.select('.value')
      .call(box.updateTextBox, '')
      .on('input', function () {
        d3.select(this).dispatch('validate');
      });
  const res = resources.map(d => ({key: d.id, name: d.name}));
  selection.select('.target')
      .call(lbox.checklistBoxItems, res)
      .call(lbox.updateChecklistBox, null)
      .on('change', function () {
        d3.select(this).dispatch('validate');
      });
  // Input validation
  selection.selectAll('.value,.target')
      .on('validate', function () {
        const textValid = box.textBoxValue(selection.select('.value')) !== '';
        const targetChecked = lbox.anyChecked(selection.select('.target'));
        selection.select('.submit')
          .property('disabled', !(textValid && targetChecked));
      })
      .dispatch('validate');
}



function execute(selection) {
  const query = {
    workflow: 'filter',
    targets: lbox.checklistBoxValue(selection.select('.target')),
    key: lbox.selectBoxValue(selection.select('.key')),
    value: box.textBoxValue(selection.select('.value')),
    operator: lbox.selectBoxValue(selection.select('.operator'))
  };
  return fetcher.get(query.workflow, query)
    .then(fetcher.json);
}


export default {
  menuLink, body, updateBody, execute
};
