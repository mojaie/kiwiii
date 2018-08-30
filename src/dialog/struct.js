
/** @module dialog/struct */

import d3 from 'd3';

import {default as fetcher} from '../common/fetcher.js';

import {default as badge} from '../component/badge.js';
import {default as button} from '../component/button.js';
import {default as box} from '../component/formBox.js';
import {default as lbox} from '../component/formListBox.js';
import {default as modal} from '../component/modal.js';
import {default as group} from './formGroup.js';


const id = 'struct-dialog';
const title = 'Search by structure';


function menuLink(selection) {
  selection.call(button.dropdownMenuModal, title, id, 'menu-searchchem');
}


function body(selection) {
  const mbody = selection.call(modal.submitDialog, id, title)
    .select('.modal-body');
  mbody.append('div')
      .classed('text-muted', true)
      .classed('small', true)
      .classed('text-right', true)
      .text('Ctrl+F to fill the form with demo queries');

  // Query molecule
  mbody.append('div')
      .classed('qmol', true)
      .call(group.queryMolGroup)
      .on('input', function() {
        const valid = dialogFormValid(selection);
        selection.select('.submit').property('disabled', !valid);
      });

  // Structure search method
  mbody.append('div')
      .classed('method', true)
      .call(lbox.selectBox, 'Method')
      .on('change', function () {
        const value = box.formValue(d3.select(this));
        const mcs = ['gls', 'rdfmcs'].includes(value);
        const strMatch = ['exact', 'substr', 'supstr'].includes(value);
        selection.select('.measure').call(box.updateFormValue, 'sim');
        selection.select('.measure select').property('disabled', !mcs);
        selection.select('.thld input').property('disabled', strMatch);
        selection.select('.diam input').property('disabled', value !== 'gls');
        selection.select('.timeout input').property('disabled', !mcs);
      });

  // Measure type
  mbody.append('div')
      .classed('measure', true)
      .call(lbox.selectBox, 'Measure')
      .call(lbox.updateSelectBoxOptions, [
              {key: 'sim', name: 'Similarity'},
              {key: 'edge', name: 'Edge count'}
            ])
      .on('change', function () {
        const value = box.formValue(d3.select(this));
        const rs = value === 'sim' ? [0.4, 1, 0.01] : [1, 999, 1];
        selection.select('.thld')
            .call(box.updateNumberRange, rs[0], rs[1], rs[2]);
      });

  // Threshold
  const thldBox = mbody.append('div')
      .classed('thld', true)
      .call(box.numberBox, 'Threshold')
      .on('input', function() {
        const valid = dialogFormValid(selection);
        selection.select('.submit').property('disabled', !valid);
      });
  thldBox.select('.form-control')
      .attr('required', 'required');
  thldBox.select('.invalid-feedback')
      .call(badge.updateInvalidMessage,
            'Please provide a valid number (0.40 to 1.00)');

  // Similarity search options
  mbody.append('div')
      .classed('option', true)
      .call(group.simOptionGroup)
      .on('input', function() {
        const valid = dialogFormValid(selection);
        selection.select('.submit').property('disabled', !valid);
      });

  // Targets
  mbody.append('div')
      .classed('target', true)
      .call(lbox.checklistBox, 'Target databases')
      .on('input', function() {
        const valid = dialogFormValid(selection);
        selection.select('.submit').property('disabled', !valid);
      });
}


function updateBody(selection, resources, rdk) {
  selection.select('.qmol')
      .call(group.updateQueryMolResources, resources)
      .call(group.updateQueryMolValues,
            {format: 'molfile', source: resources[0].key, value: ''});
  // Search type
  const methodList = [
    {key: 'exact', name: 'Exact match'},
    {key: 'substr', name: 'Substructure'},
    {key: 'supstr', name: 'Superstructure'},
    {key: 'gls', name: 'MCS-DR/GLS'}
  ];
  if (rdk) {
    methodList.push({key: 'rdmorgan', name: 'RDKit Morgan similarity'});
    methodList.push({key: 'rdfmcs', name: 'RDKit FMCS'});
  }
  selection.select('.method')
      .call(lbox.updateSelectBoxOptions, methodList)
      .call(box.updateFormValue, 'exact')
      .dispatch('change');
  selection.select('.measure')
      .call(box.updateFormValue, 'sim');
  selection.select('.thld')
      .call(box.updateFormValue, 0.5);
  selection.select('.option')
      .call(group.updateSimOptionValues,
            {ignoreHs: true, timeout: 2, diameter: 8});
  const res = resources.map(d => ({key: d.id, name: d.name}));
  selection.select('.target')
      .call(lbox.updateChecklistItems, res)
      .call(lbox.updateChecklistValues, []);
  selection.select('.submit').property('disabled', true);
}


function dialogFormValid(selection) {
  const qmolValid = group.queryMolValid(selection.select('.qmol'));
  const thldValid = box.formValid(selection.select('.thld'));
  const simOptionValid = group.simOptionValid(selection.select('.option'));
  const targetChecked = lbox.anyChecked(selection.select('.target'));
  return qmolValid && thldValid && simOptionValid && targetChecked;
}


function execute(selection) {
  const params = group.simOptionValues(selection.select('.option'));
  const measure = selection.select('.measure');
  const thld = selection.select('.thld');
  if (!measure.select('select').property('disabled')) {
    params.measure = box.formValue(measure);
  }
  if (!thld.select('input').property('disabled')) {
    params.threshold = box.formValue(thld);
  }
  const query = {
    workflow: box.formValue(selection.select('.method')),
    targets: lbox.checklistValues(selection.select('.target')),
    queryMol: group.queryMolValues(selection.select('.qmol')),
    params: params
  };
  return fetcher.get(query.workflow, query)
    .then(fetcher.json);
}


function fill(selection) {
  selection.select('.qmol')
      .call(group.updateQueryMolValues,
            {format: 'dbid', source: 'drugbankfda', value: 'DB00465'});
  selection.select('.method').call(box.updateFormValue, 'gls')
      .dispatch('change');
  selection.select('.measure').call(box.updateFormValue, 'sim')
      .dispatch('change');
  selection.select('.thld').call(box.updateFormValue, 0.7);
  selection.select('.option')
    .call(group.updateSimOptionValues,
          {ignoreHs: true, timeout: 2, diameter: 8});
  selection.select('.target').call(lbox.updateChecklistValues, 'drugbankfda')
      .dispatch('input');
}


export default {
  menuLink, body, updateBody, execute, fill
};
