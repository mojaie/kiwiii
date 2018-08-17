
/** @module dialog/networkgen */

import d3 from 'd3';

import {default as fetcher} from '../common/fetcher.js';

import {default as badge} from '../component/badge.js';
import {default as button} from '../component/button.js';
import {default as box} from '../component/formBox.js';
import {default as lbox} from '../component/formListBox.js';
import {default as modal} from '../component/modal.js';

import {default as group} from './formGroup.js';


const id = 'networkgen-dialog';
const title = 'Generate similarity network';


function menuLink(selection) {
  selection.call(button.dropdownMenuModal, title, id, 'menu-network');
}


function body(selection) {
  const mbody = selection.call(modal.submitDialog, id, title)
      .select('.modal-body');

  // Similarity measure
  mbody.append('div')
      .classed('measure', true)
      .call(lbox.selectBox, 'Measure')
      .on('change', function () {
        const value = box.formValue(d3.select(this));
        selection.select('.diam input')
            .property('disabled', value !== 'gls');
        selection.select('.timeout input')
            .property('disabled', !['gls', 'rdfmcs'].includes(value));
      });

  // Threshold
  const thldBox = mbody.append('div')
      .classed('thld', true)
      .call(box.numberBox, 'Threshold')
      .call(box.updateNumberRange, 0.01, 1, 0.01)
      .on('input', function() {
        const valid = dialogFormValid(selection);
        selection.select('.submit').property('disabled', !valid);
      });
  thldBox.select('.form-control')
      .attr('required', 'required');
  thldBox.select('.invalid-feedback')
      .call(badge.updateInvalidMessage,
            'Please provide a valid number (0.01 to 1.00)');

  // Similarity search options
  mbody.append('div')
      .classed('option', true)
      .call(group.simOptionGroup)
      .on('input', function() {
        const valid = dialogFormValid(selection);
        selection.select('.submit').property('disabled', !valid);
      });
}


function updateBody(selection, rdk) {
  // Similarity measure
  const measures = [
    {key: 'gls', name: 'Graph-based local similarity(GLS)'}
  ];
  if (rdk) {
    measures.push({key: 'rdmorgan', name: 'RDKit Morgan similarity'});
    measures.push({key: 'rdfmcs', name: 'RDKit FMCS'});
  }
  selection.select('.measure')
      .call(lbox.updateSelectBoxOptions, measures)
      .call(box.updateFormValue, 'gls');
  selection.select('.thld').call(box.updateFormValue, 0.5);
  selection.select('.option')
      .call(group.updateSimOptionValues,
            {ignoreHs: true, timeout: 2, diameter: 8});
}


function dialogFormValid(selection) {
  const thldValid = box.formValid(selection.select('.thld'));
  const simOptionValid = group.simOptionValid(selection.select('.option'));
  return thldValid && simOptionValid;
}


function execute(selection, rcds) {
  const measure = selection.select('.measure');
  const thld = selection.select('.thld');
  const params = group.simOptionValues(selection.select('.option'));
  if (!measure.select('select').property('disabled')) {
    params.measure = box.formValue(measure);
  }
  if (!thld.select('input').property('disabled')) {
    params.threshold = box.formValue(thld);
  }
  const formData = new FormData();
  // TODO: need updates in flashflood query schema
  formData.append('params', JSON.stringify(params));
  formData.append('contents', new Blob([JSON.stringify(rcds)]));
  return fetcher.post(`${params.measure}net`, formData)
    .then(fetcher.json);
}


export default {
  menuLink, body, updateBody, execute
};
