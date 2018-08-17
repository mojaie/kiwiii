
/** @module dialog/filter */

import _ from 'lodash';
import d3 from 'd3';

import {default as fetcher} from '../common/fetcher.js';
import {default as misc} from '../common/misc.js';

import {default as badge} from '../component/badge.js';
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
  const mbody = selection.call(modal.submitDialog, id, title)
    .select('.modal-body');
  mbody.append('div')
      .classed('text-muted', true)
      .classed('small', true)
      .classed('text-right', true)
      .text('Ctrl+F to fill the form with demo queries');

  // Key
  mbody.append('div')
      .classed('key', true)
      .call(lbox.selectBox, 'Field')
      .on('change', function () {
        const field = lbox.selectedRecord(d3.select(this));
        const fmt = misc.sortType(field.format || 'd3_format');
        selection.select('.textvalue')
            .property('hidden', fmt !== 'text');
        selection.select('.numvalue')
            .property('hidden', fmt !== 'numeric');
      });

  // Operator
  mbody.append('div')
      .classed('operator', true)
      .call(lbox.selectBox, 'Operator')
      .call(lbox.updateSelectBoxOptions, [
              {key: 'eq', name: '='},
              {key: 'gt', name: '>'},
              {key: 'lt', name: '<'},
              {key: 'ge', name: '>='},
              {key: 'le', name: '>='},
              {key: 'lk', name: 'LIKE'}
            ]);

  // Text value
  const textValueBox = mbody.append('div')
      .classed('textvalue', true)
      .call(box.textBox, 'Value')
      .on('input', function() {
        const valid = dialogFormValid(selection);
        selection.select('.submit').property('disabled', !valid);
      });
  textValueBox.select('.form-control')
      .attr('required', 'required');
  textValueBox.select('.invalid-feedback')
      .call(badge.updateInvalidMessage, 'Please provide a valid text');

  // Numeric value
  const numValueBox = mbody.append('div')
      .classed('numvalue', true)
      .call(box.numberBox, 'Value')
      .on('input', function() {
        const valid = dialogFormValid(selection);
        selection.select('.submit').property('disabled', !valid);
      });
  numValueBox.select('.form-control')
      .attr('required', 'required');
  numValueBox.select('.invalid-feedback')
      .call(badge.updateInvalidMessage, 'Please provide a valid number');

  // Target databases
  mbody.append('div')
      .classed('target', true)
      .call(lbox.checklistBox, 'Target databases')
      .on('change', function() {
        const valid = dialogFormValid(selection);
        selection.select('.submit').property('disabled', !valid);
      })
    .select('.invalid-feedback')
      .call(badge.updateInvalidMessage, 'Please choose at least one items');
}


function updateBody(selection, resources) {
  const fields = _(resources.map(e => e.fields))
    .flatten()
    .uniqBy('key')
    .value()
    .filter(e => e.hasOwnProperty('d3_format')
                 || ['compound_id', 'numeric', 'text'].includes(e.format));
  selection.select('.key')
      .call(lbox.updateSelectBoxOptions, fields)
      .call(box.updateFormValue, fields[0].key)
      .dispatch('change');
  selection.select('.operator').call(box.updateFormValue, 'eq');
  selection.select('.textvalue').call(box.updateFormValue, null);
  selection.select('.numvalue').call(box.updateFormValue, null);
  const res = resources.map(d => ({key: d.id, name: d.name}));
  selection.select('.target')
      .call(lbox.updateChecklistItems, res)
      .call(lbox.checkRequired)
      .call(lbox.updateChecklistValues, []);
  selection.select('.submit').property('disabled', true);
}


function dialogFormValid(selection) {
  const fmt = lbox.selectedRecord(selection.select('.key')).format;
  const type = misc.sortType(fmt);
  const textValid = box.formValid(selection.select('.textvalue'));
  const numValid = box.formValid(selection.select('.numvalue'));
  const targetChecked = lbox.anyChecked(selection.select('.target'));
  return (type === 'text' ? textValid : numValid) && targetChecked;
}


function execute(selection) {
  const query = {
    workflow: 'filter',
    targets: lbox.checklistBoxValue(selection.select('.target')),
    key: box.formValue(selection.select('.key')),
    value: box.formValue(selection.select('.value')),
    operator: box.formValue(selection.select('.operator'))
  };
  return fetcher.get(query.workflow, query)
    .then(fetcher.json);
}


function fill(selection) {
  selection.select('.key').call(box.updateFormValue, '_mw');
  selection.select('.operator').call(box.updateFormValue, 'gt');
  selection.select('.value').call(box.formValue, '1500');
  selection.select('.target').call(lbox.updateChecklistValues, ['drugbankfda'])
      .dispatch('change');
}


export default {
  menuLink, body, updateBody, execute, fill
};
