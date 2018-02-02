
/** @module dialog/filter */

import KArray from '../common/KArray.js';

import {default as button} from '../component/button.js';
import {default as box} from '../component/formBox.js';
import {default as lbox} from '../component/formListBox.js';
import {default as modal} from '../component/modal.js';


const id = 'filter-dialog';
const title = 'Search by properties';


function menuLink(selection) {
  selection.call(button.dropdownMenuModal, 'prop', title, id);
}


function body(selection, resources) {
  const dialog = selection.call(modal.submitDialog, id, title);
  const fields = KArray.from(resources.map(e => e.fields))
    .extend().unique('key').toArray()
    .filter(e => e.hasOwnProperty('d3_format')
                 || ['compound_id', 'numeric', 'text'].includes(e.format));
  dialog.select('.modal-body').append('div')
    .classed('key', true)
    .call(lbox.selectBox, 'filter-field', 'Field', fields, null);
  dialog.select('.modal-body').append('div')
    .classed('operator', true)
    .call(lbox.selectBox, 'filter-op', 'Operator',
          [
            {key: 'eq', name: '='},
            {key: 'gt', name: '>'},
            {key: 'lt', name: '<'},
            {key: 'ge', name: '>='},
            {key: 'le', name: '>='},
            {key: 'lk', name: 'LIKE'}
          ], 'eq');
  dialog.select('.modal-body').append('div')
    .classed('value', true)
    .call(box.textBox, 'filter-value', 'Value', null, '');
  // Targets
  const res = resources.map(d => ({key: d.id, name: d.name}));
  dialog.select('.modal-body').append('div')
      .classed('target', true)
      .call(lbox.checklistBox, 'struct-target', 'Target databases', res, null);
}


function query(selection) {
  return {
    workflow: 'filter',
    targets: lbox.checklistBoxValue(selection.select('.target')),
    key: lbox.selectBoxValue(selection.select('.key')),
    value: box.textBoxValue(selection.select('.value')),
    operator: lbox.selectBoxValue(selection.select('.operator'))
  };
}


export default {
  menuLink, body, query
};
